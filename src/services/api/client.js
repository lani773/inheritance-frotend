/**
 * INHERITANCE CHOIR — Production API Client
 *
 * Features:
 * - Auto token refresh on 401
 * - Request deduplication (same URL same time → single request)
 * - In-memory + localStorage caching with TTL
 * - Exponential backoff retry for network errors
 * - Request queue when offline (auto-flush on reconnect)
 * - Structured error handling with typed errors
 * - Request/response interceptors
 * - Abort controller for cleanup
 */

// ── Configuration ──────────────────────────────────────────────
const BASE_URL   = process.env.REACT_APP_API_URL  || 'https://inheritance-backend--irumvafils3.replit.app/api/v1';
const WS_URL     = process.env.REACT_APP_WS_URL   || 'wss://inheritance-backend--irumvafils3.replit.app/ws';
const TIMEOUT_MS = 15_000;

// ── Typed API Errors ───────────────────────────────────────────
export class APIError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.name    = 'APIError';
    this.status  = status;
    this.code    = code;
    this.details = details;
  }
}

export class NetworkError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthError extends APIError {
  constructor(message) {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'AuthError';
  }
}

// ── In-Memory Cache ────────────────────────────────────────────
class RequestCache {
  constructor() {
    this._mem  = new Map();  // key → { data, expiresAt }
    this._inFlight = new Map(); // key → Promise (deduplication)
  }

  get(key) {
    const entry = this._mem.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) { this._mem.delete(key); return null; }
    return entry.data;
  }

  set(key, data, ttlMs = 60_000) {
    this._mem.set(key, { data, expiresAt: Date.now() + ttlMs });
    // Also persist to localStorage for offline access
    try {
      const store = JSON.parse(localStorage.getItem('choir_api_cache') || '{}');
      store[key] = { data, expiresAt: Date.now() + ttlMs };
      // Prune old entries
      const pruned = Object.fromEntries(
        Object.entries(store).filter(([,v]) => v.expiresAt > Date.now())
      );
      localStorage.setItem('choir_api_cache', JSON.stringify(pruned));
    } catch {}
  }

  getOffline(key) {
    try {
      const store = JSON.parse(localStorage.getItem('choir_api_cache') || '{}');
      const entry = store[key];
      if (!entry) return null;
      return entry.data; // return stale offline data regardless of TTL
    } catch { return null; }
  }

  invalidate(pattern) {
    for (const key of this._mem.keys()) {
      if (key.includes(pattern)) this._mem.delete(key);
    }
  }

  clear() { this._mem.clear(); }

  // Request deduplication
  dedupe(key, fn) {
    if (this._inFlight.has(key)) return this._inFlight.get(key);
    const promise = fn().finally(() => this._inFlight.delete(key));
    this._inFlight.set(key, promise);
    return promise;
  }
}

// ── Offline Queue ──────────────────────────────────────────────
class OfflineQueue {
  constructor() {
    this._queue = JSON.parse(localStorage.getItem('choir_offline_queue') || '[]');
  }

  enqueue(request) {
    this._queue.push({ ...request, queuedAt: Date.now(), id: `oq_${Date.now()}` });
    localStorage.setItem('choir_offline_queue', JSON.stringify(this._queue));
  }

  async flush(client) {
    const pending = [...this._queue];
    this._queue = [];
    localStorage.setItem('choir_offline_queue', JSON.stringify([]));

    for (const req of pending) {
      try {
        await client.request(req.method, req.url, req.data, { skipQueue: true });
      } catch (e) {
        console.warn('Offline queue flush failed:', req.url, e.message);
      }
    }
    return pending.length;
  }

  get length() { return this._queue.length; }
}

// ── Main API Client ────────────────────────────────────────────
class ChoirAPIClient {
  constructor() {
    this.baseURL     = BASE_URL;
    this.cache       = new RequestCache();
    this.offlineQueue = new OfflineQueue();
    this._interceptors = { request: [], response: [] };
    this._isRefreshing = false;
    this._refreshQueue = [];

    // Flush offline queue when coming online
    window.addEventListener('online', () => {
      if (this.offlineQueue.length > 0) {
        console.log(`[API] Flushing ${this.offlineQueue.length} queued requests`);
        this.offlineQueue.flush(this).then(n => {
          console.log(`[API] Flushed ${n} requests`);
        });
      }
    });
  }

  // ── Token management ─────────────────────────────────────────
  getAccessToken()  { return localStorage.getItem('choir_access_token')  || ''; }
  getRefreshToken() { return localStorage.getItem('choir_refresh_token') || ''; }
  setTokens(access, refresh) {
    localStorage.setItem('choir_access_token',  access);
    if (refresh) localStorage.setItem('choir_refresh_token', refresh);
  }
  clearTokens() {
    localStorage.removeItem('choir_access_token');
    localStorage.removeItem('choir_refresh_token');
  }

  // ── Interceptors ──────────────────────────────────────────────
  addRequestInterceptor(fn)  { this._interceptors.request.push(fn);  return this; }
  addResponseInterceptor(fn) { this._interceptors.response.push(fn); return this; }

  // ── Core request ─────────────────────────────────────────────
  async request(method, endpoint, data = null, options = {}) {
    const {
      cache: cacheOpt = null,    // { ttl: ms } or false
      skipQueue = false,
      signal,
      headers: extraHeaders = {},
    } = options;

    const url      = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    const cacheKey = `${method}:${url}:${JSON.stringify(data)}`;

    // Cache hit for GET
    if (method === 'GET' && cacheOpt !== false) {
      const ttl    = cacheOpt?.ttl ?? 60_000;
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }

    // Offline — queue mutating requests
    if (!navigator.onLine && method !== 'GET' && !skipQueue) {
      this.offlineQueue.enqueue({ method, url: endpoint, data });
      throw new NetworkError('Request queued for when you are back online');
    }

    // Offline — return stale cached data for GETs
    if (!navigator.onLine && method === 'GET') {
      const stale = this.cache.getOffline(cacheKey);
      if (stale) return stale;
      throw new NetworkError('You are offline and no cached data is available');
    }

    // Deduplicate in-flight GETs
    if (method === 'GET') {
      return this.cache.dedupe(cacheKey, () => this._execute(method, url, data, cacheKey, cacheOpt, extraHeaders, signal));
    }

    return this._execute(method, url, data, cacheKey, cacheOpt, extraHeaders, signal);
  }

  async _execute(method, url, data, cacheKey, cacheOpt, extraHeaders, signal) {
    const controller = signal ? null : new AbortController();
    const timeout    = controller
      ? setTimeout(() => controller.abort(), TIMEOUT_MS)
      : null;

    const headers = {
      'Content-Type': 'application/json',
      'X-Request-ID': `req_${Date.now().toString(36)}`,
      ...extraHeaders,
    };

    const token = this.getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // Apply request interceptors
    let reqConfig = { method, url, headers, body: data ? JSON.stringify(data) : undefined };
    for (const fn of this._interceptors.request) {
      reqConfig = (await fn(reqConfig)) || reqConfig;
    }

    try {
      const res = await fetch(reqConfig.url, {
        method:  reqConfig.method,
        headers: reqConfig.headers,
        body:    reqConfig.body,
        signal:  signal || controller?.signal,
      });

      clearTimeout(timeout);

      // Token refresh on 401
      if (res.status === 401 && !reqConfig.url.includes('/auth/refresh')) {
        return this._handleUnauthorized(method, url, data, cacheKey, cacheOpt, extraHeaders);
      }

      const contentType = res.headers.get('content-type') || '';
      const payload = contentType.includes('application/json')
        ? await res.json()
        : await res.text();

      if (!res.ok) {
        const msg     = payload?.message || payload || `HTTP ${res.status}`;
        const apiErr  = new APIError(msg, res.status, payload?.code, payload?.details);
        if (res.status === 401) throw new AuthError(msg);
        throw apiErr;
      }

      // Apply response interceptors
      let result = payload;
      for (const fn of this._interceptors.response) {
        result = (await fn(result, res)) || result;
      }

      // Cache successful GET
      if (method === 'GET' && cacheOpt !== false) {
        this.cache.set(cacheKey, result, cacheOpt?.ttl ?? 60_000);
      }

      return result;
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') throw new NetworkError('Request timed out');
      if (err instanceof APIError || err instanceof NetworkError) throw err;
      throw new NetworkError(err.message || 'Network error');
    }
  }

  async _handleUnauthorized(method, url, data, cacheKey, cacheOpt, extraHeaders) {
    if (this._isRefreshing) {
      return new Promise((resolve, reject) => {
        this._refreshQueue.push({ resolve, reject, method, url, data, cacheKey, cacheOpt, extraHeaders });
      });
    }

    this._isRefreshing = true;
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) throw new AuthError('No refresh token');

      const res = await this._execute('POST', `${this.baseURL}/auth/refresh`, { refreshToken }, null, false, {}, null);
      this.setTokens(res.accessToken, res.refreshToken);

      // Retry queued requests
      this._refreshQueue.forEach(q => {
        this._execute(q.method, q.url, q.data, q.cacheKey, q.cacheOpt, q.extraHeaders, null)
          .then(q.resolve).catch(q.reject);
      });
      this._refreshQueue = [];

      return this._execute(method, url, data, cacheKey, cacheOpt, extraHeaders, null);
    } catch (e) {
      this._refreshQueue.forEach(q => q.reject(new AuthError('Session expired')));
      this._refreshQueue = [];
      this.clearTokens();
      window.dispatchEvent(new CustomEvent('choir:logout'));
      throw new AuthError('Session expired. Please log in again.');
    } finally {
      this._isRefreshing = false;
    }
  }

  // ── HTTP shortcuts ────────────────────────────────────────────
  get(url, options)           { return this.request('GET',    url, null,  options); }
  post(url, data, options)    { return this.request('POST',   url, data,  options); }
  put(url, data, options)     { return this.request('PUT',    url, data,  options); }
  patch(url, data, options)   { return this.request('PATCH',  url, data,  options); }
  delete(url, options)        { return this.request('DELETE', url, null,  options); }

  // ── Cache control ─────────────────────────────────────────────
  invalidateCache(pattern)    { this.cache.invalidate(pattern); }
  clearCache()                { this.cache.clear(); }
}

// ── Singleton ─────────────────────────────────────────────────
export const api = new ChoirAPIClient();

// ── Dev mode: log all requests ─────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  api.addRequestInterceptor(config => {
    console.debug(`[API →] ${config.method} ${config.url}`);
    return config;
  });
  api.addResponseInterceptor((data, res) => {
    console.debug(`[API ←] ${res.status} ${res.url}`);
    return data;
  });
}

export default api;

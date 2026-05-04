/**
 * INHERITANCE CHOIR — PWA Manager
 * Handles install prompt, offline detection, service worker updates.
 */
import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';

const PWAContext = createContext(null);

export function PWAProvider({ children }) {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled,   setIsInstalled]   = useState(false);
  const [isOffline,     setIsOffline]     = useState(!navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [swRegistration,  setSwRegistration]  = useState(null);

  // ── Install prompt ─────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
    window.addEventListener('appinstalled', () => setIsInstalled(true));

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // ── Offline detection ─────────────────────────────────────
  useEffect(() => {
    const goOnline  = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // ── Service Worker ─────────────────────────────────────────
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // IMPORTANT: Disable SW in development to prevent caching issues and "failed to fetch" errors
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations().then(regs => {
        for (let reg of regs) {
          reg.unregister();
        }
      });
      return;
    }

    navigator.serviceWorker.register('/service-worker.js').then(reg => {
      setSwRegistration(reg);
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setUpdateAvailable(true);
          }
        });
      });
    }).catch(err => {
      console.log('SW registration failed:', err.message);
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }, []);

  const triggerInstall = useCallback(async () => {
    if (!installPrompt) return false;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
      setIsInstalled(true);
    }
    return outcome === 'accepted';
  }, [installPrompt]);

  const applyUpdate = useCallback(() => {
    swRegistration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
  }, [swRegistration]);

  return (
    <PWAContext.Provider value={{
      canInstall: !!installPrompt && !isInstalled,
      isInstalled,
      isOffline,
      updateAvailable,
      triggerInstall,
      applyUpdate,
    }}>
      {children}
      <OfflineBanner isOffline={isOffline} />
      <UpdateBanner available={updateAvailable} onUpdate={applyUpdate} />
    </PWAContext.Provider>
  );
}

export function usePWA() {
  return useContext(PWAContext) || {};
}

// ── Install Button ─────────────────────────────────────────────
export function InstallButton({ style = {}, className = '' }) {
  const { canInstall, triggerInstall } = usePWA();
  const [loading, setLoading] = useState(false);

  if (!canInstall) return null;

  const handleClick = async () => {
    setLoading(true);
    await triggerInstall();
    setLoading(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 18px',
        background: 'linear-gradient(135deg, #A07820, #C9A84C)',
        border: 'none', borderRadius: 12,
        color: '#080C14', fontSize: 13, fontWeight: 700,
        cursor: loading ? 'wait' : 'pointer',
        boxShadow: '0 4px 16px rgba(201,168,76,0.3)',
        transition: 'all 0.2s',
        ...style,
      }}
      className={className}
    >
      <span>📲</span>
      {loading ? 'Installing…' : 'Install App'}
    </button>
  );
}

// ── Offline Banner ─────────────────────────────────────────────
function OfflineBanner({ isOffline }) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => { if (!isOffline) setDismissed(false); }, [isOffline]);

  if (!isOffline || dismissed) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9998,
      background: 'linear-gradient(135deg, #92400E, #B45309)',
      borderBottom: '1px solid #F59E0B44',
      padding: '10px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      animation: 'slideDown 0.3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>📡</span>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#FEF3C7' }}>
            You're offline
          </p>
          <p style={{ margin: 0, fontSize: 11, color: '#F59E0B' }}>
            Some features are limited. Cached data is available.
          </p>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        style={{ background: 'none', border: 'none', color: '#F59E0B', cursor: 'pointer', fontSize: 18 }}
      >
        ×
      </button>
    </div>
  );
}

// ── Update Banner ─────────────────────────────────────────────
function UpdateBanner({ available, onUpdate }) {
  if (!available) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: 24, zIndex: 9997,
      background: 'linear-gradient(135deg, #141E33, #1E2D4A)',
      border: '1px solid #C9A84C44',
      borderRadius: 16, padding: '16px 20px',
      boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', gap: 16,
      maxWidth: 320, animation: 'slideUp 0.4s ease',
    }}>
      <span style={{ fontSize: 28 }}>🎵</span>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#F0F4FF' }}>
          Update Available
        </p>
        <p style={{ margin: '2px 0 10px', fontSize: 11, color: '#64748B' }}>
          A new version of Inheritance Choir is ready.
        </p>
        <button
          onClick={onUpdate}
          style={{
            background: 'linear-gradient(135deg, #A07820, #C9A84C)',
            border: 'none', borderRadius: 8,
            padding: '6px 14px', fontSize: 12,
            fontWeight: 700, color: '#080C14', cursor: 'pointer',
          }}
        >
          Update Now
        </button>
      </div>
    </div>
  );
}

// ── Offline Cache Helper ───────────────────────────────────────
const CACHE_KEY = 'choir_offline_cache';

export const offlineCache = {
  set: (key, data) => {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      cache[key] = { data, timestamp: Date.now() };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {}
  },
  get: (key, maxAgeMs = 24 * 60 * 60 * 1000) => {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      const entry = cache[key];
      if (!entry) return null;
      if (Date.now() - entry.timestamp > maxAgeMs) return null;
      return entry.data;
    } catch { return null; }
  },
  clear: () => localStorage.removeItem(CACHE_KEY),
};

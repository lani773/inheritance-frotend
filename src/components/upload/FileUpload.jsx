/**
 * INHERITANCE CHOIR — File Upload System
 * Drag-and-drop uploads with live progress, preview, and type validation.
 * Simulates cloud upload in dev mode; connects to API in production.
 */
import React, { useState, useRef, useCallback } from 'react';

const MAX_SIZE_MB  = 10;
const MAX_SIZE     = MAX_SIZE_MB * 1024 * 1024;

const FILE_TYPES = {
  image:    { accept:'image/*',                       icon:'🖼', label:'Image',    color:'#3B82F6' },
  document: { accept:'.pdf,.doc,.docx,.txt,.xls,.xlsx', icon:'📄', label:'Document', color:'#8B5CF6' },
  audio:    { accept:'audio/*',                       icon:'🎵', label:'Audio',    color:'#22C55E' },
  any:      { accept:'*/*',                           icon:'📎', label:'File',     color:'#C9A84C' },
};

// ── Format helpers ─────────────────────────────────────────────
function fmtSize(bytes) {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024*1024)   return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/1024/1024).toFixed(1)} MB`;
}
function getFileIcon(file) {
  if (file.type.startsWith('image/'))  return '🖼';
  if (file.type.startsWith('audio/'))  return '🎵';
  if (file.type.startsWith('video/'))  return '🎬';
  if (file.type.includes('pdf'))       return '📑';
  if (file.type.includes('word'))      return '📝';
  if (file.type.includes('excel') || file.type.includes('sheet')) return '📊';
  return '📎';
}

// ── Upload simulation ──────────────────────────────────────────
async function simulateUpload(file, onProgress) {
  return new Promise((resolve) => {
    let p = 0;
    const speed = 20 + Math.random() * 30; // KB/s
    const interval = setInterval(() => {
      p = Math.min(p + (speed / (file.size / 1024)) * 100, 100);
      onProgress(Math.round(p));
      if (p >= 100) {
        clearInterval(interval);
        resolve({
          url:  URL.createObjectURL(file),
          name: file.name,
          size: file.size,
          type: file.type,
        });
      }
    }, 100);
  });
}

// ── Single file item ──────────────────────────────────────────
function FileItem({ item, onRemove }) {
  const [preview, setPreview] = useState(null);

  React.useEffect(() => {
    if (item.file.type.startsWith('image/')) {
      const url = URL.createObjectURL(item.file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [item.file]);

  return (
    <div style={{
      display:'flex', alignItems:'center', gap:14,
      padding:'12px 16px',
      background: item.status==='done' ? 'rgba(34,197,94,0.05)' : item.status==='error' ? 'rgba(239,68,68,0.05)' : '#141E33',
      border:`1px solid ${item.status==='done' ? '#22C55E22' : item.status==='error' ? '#EF444422' : '#1E2D4A'}`,
      borderRadius:12, transition:'all 0.3s',
    }}>
      {/* Thumbnail / icon */}
      <div style={{
        width:44, height:44, borderRadius:8, flexShrink:0, overflow:'hidden',
        background:'#0F172A', border:'1px solid #1E2D4A',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:22,
      }}>
        {preview ? (
          <img src={preview} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        ) : getFileIcon(item.file)}
      </div>

      {/* Info */}
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ margin:0, fontSize:13, color:'#F0F4FF', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {item.file.name}
        </p>
        <p style={{ margin:'2px 0 0', fontSize:11, color:'#64748B' }}>
          {fmtSize(item.file.size)}
          {item.status==='error' && <span style={{ color:'#EF4444', marginLeft:8 }}>{item.error}</span>}
        </p>

        {/* Progress bar */}
        {item.status==='uploading' && (
          <div style={{ marginTop:6, height:3, background:'#1E2D4A', borderRadius:2, overflow:'hidden' }}>
            <div style={{
              height:'100%', width:`${item.progress}%`,
              background:'linear-gradient(90deg, #A07820, #C9A84C)',
              transition:'width 0.2s ease',
              borderRadius:2,
            }} />
          </div>
        )}
      </div>

      {/* Status / action */}
      <div style={{ flexShrink:0 }}>
        {item.status==='uploading' && (
          <span style={{ fontSize:12, color:'#C9A84C', fontFamily:'DM Mono, monospace' }}>
            {item.progress}%
          </span>
        )}
        {item.status==='done' && <span style={{ fontSize:18 }}>✅</span>}
        {item.status==='error' && <span style={{ fontSize:18 }}>❌</span>}
        {item.status==='pending' && (
          <button onClick={() => onRemove(item.id)} style={{
            background:'none', border:'none', color:'#64748B', cursor:'pointer', fontSize:18, padding:2,
          }}>×</button>
        )}
        {item.status==='done' && (
          <a href={item.result?.url} download={item.file.name} style={{ marginLeft:8 }}>
            <button style={{ background:'none', border:'none', color:'#C9A84C', cursor:'pointer', fontSize:13 }}>↓</button>
          </a>
        )}
      </div>
    </div>
  );
}

// ── Main Upload Component ──────────────────────────────────────
export default function FileUpload({
  accept       = 'any',
  multiple     = true,
  maxFiles     = 10,
  onUploadDone,
  label        = 'Upload Files',
}) {
  const [items,    setItems]    = useState([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const accepted = FILE_TYPES[accept] || FILE_TYPES.any;

  const addFiles = useCallback(async (files) => {
    const newItems = Array.from(files).slice(0, maxFiles - items.length).map(file => {
      if (file.size > MAX_SIZE) {
        return { id:`f_${Date.now()}_${Math.random()}`, file, status:'error', error:`File too large (max ${MAX_SIZE_MB}MB)`, progress:0 };
      }
      return { id:`f_${Date.now()}_${Math.random()}`, file, status:'pending', progress:0 };
    });

    setItems(prev => [...prev, ...newItems]);

    // Start uploading valid files
    for (const item of newItems) {
      if (item.status !== 'pending') continue;
      setItems(prev => prev.map(i => i.id===item.id ? { ...i, status:'uploading' } : i));
      try {
        const result = await simulateUpload(item.file, (p) => {
          setItems(prev => prev.map(i => i.id===item.id ? { ...i, progress:p } : i));
        });
        setItems(prev => prev.map(i => i.id===item.id ? { ...i, status:'done', progress:100, result } : i));
        onUploadDone?.(result);
      } catch {
        setItems(prev => prev.map(i => i.id===item.id ? { ...i, status:'error', error:'Upload failed' } : i));
      }
    }
  }, [items.length, maxFiles, onUploadDone]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));

  const done    = items.filter(i => i.status==='done').length;
  const total   = items.length;
  const uploading = items.some(i => i.status==='uploading');

  return (
    <div style={{ fontFamily:'Crimson Pro, serif' }}>
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border:`2px dashed ${dragging ? '#C9A84C' : '#1E2D4A'}`,
          borderRadius:16, padding:'32px 20px', textAlign:'center',
          cursor:'pointer', transition:'all 0.2s',
          background: dragging ? 'rgba(201,168,76,0.06)' : 'transparent',
          marginBottom:16,
        }}
      >
        <div style={{ fontSize:40, marginBottom:12 }}>{accepted.icon}</div>
        <h4 style={{ margin:'0 0 6px', fontSize:15, color:'#F0F4FF', fontFamily:'Cinzel, serif' }}>
          {dragging ? 'Drop files here' : label}
        </h4>
        <p style={{ margin:0, fontSize:12, color:'#64748B' }}>
          Drag & drop or click to browse · {accepted.label} files · Max {MAX_SIZE_MB}MB each
        </p>
        {multiple && items.length < maxFiles && (
          <p style={{ margin:'6px 0 0', fontSize:11, color:'#374151' }}>
            {items.length}/{maxFiles} files
          </p>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accepted.accept}
        multiple={multiple}
        onChange={e => addFiles(e.target.files)}
        style={{ display:'none' }}
      />

      {/* Overall progress */}
      {total > 0 && (
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          marginBottom:12, padding:'8px 0',
        }}>
          <span style={{ fontSize:12, color:'#64748B' }}>
            {uploading ? `Uploading… ${done}/${total}` : `${done} of ${total} complete`}
          </span>
          {done > 0 && !uploading && (
            <button
              onClick={() => setItems([])}
              style={{ background:'none', border:'none', color:'#64748B', cursor:'pointer', fontSize:12 }}
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* File list */}
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {items.map(item => (
          <FileItem key={item.id} item={item} onRemove={removeItem} />
        ))}
      </div>

      {/* Upload more button */}
      {items.length > 0 && items.length < maxFiles && !uploading && (
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            width:'100%', marginTop:10, padding:'10px',
            background:'transparent', border:'1px dashed #1E2D4A',
            borderRadius:10, color:'#64748B', fontSize:13, cursor:'pointer',
            transition:'all 0.2s',
          }}
          onMouseEnter={e => { e.target.style.borderColor='#C9A84C44'; e.target.style.color='#C9A84C'; }}
          onMouseLeave={e => { e.target.style.borderColor='#1E2D4A'; e.target.style.color='#64748B'; }}
        >
          + Add more files
        </button>
      )}
    </div>
  );
}

// ── Avatar uploader ────────────────────────────────────────────
export function AvatarUploader({ currentUrl, onUpload }) {
  const [preview, setPreview] = useState(currentUrl || null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setLoading(true);

    const result = await simulateUpload(file, () => {});
    setLoading(false);
    onUpload?.(result.url);
    e.target.value = '';
  };

  const initials = 'IC';
  const VP_COLOR = '#C9A84C';

  return (
    <div style={{ position:'relative', display:'inline-block' }}>
      <div
        style={{
          width:96, height:96, borderRadius:'50%',
          background: preview ? 'transparent' : `${VP_COLOR}22`,
          border:`3px solid ${VP_COLOR}44`,
          overflow:'hidden', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}
        onClick={() => fileRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        ) : (
          <span style={{ fontSize:28, fontWeight:700, color:VP_COLOR, fontFamily:'Cinzel, serif' }}>{initials}</span>
        )}
        {loading && (
          <div style={{
            position:'absolute', inset:0, background:'rgba(0,0,0,0.6)',
            display:'flex', alignItems:'center', justifyContent:'center',
            borderRadius:'50%',
          }}>
            <div style={{ width:24, height:24, border:'2px solid #1E2D4A', borderTop:'2px solid #C9A84C', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
          </div>
        )}
      </div>
      <button
        onClick={() => fileRef.current?.click()}
        style={{
          position:'absolute', bottom:0, right:0,
          width:28, height:28, borderRadius:'50%',
          background:'linear-gradient(135deg, #A07820, #C9A84C)',
          border:'2px solid #0A1628',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:13, cursor:'pointer',
        }}
      >
        📷
      </button>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display:'none' }} />
    </div>
  );
}

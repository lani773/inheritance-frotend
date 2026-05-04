/**
 * INHERITANCE CHOIR — Prayer Board (Enhanced v2)
 * Community prayer requests: upvotes, prayed-for counts, answered status, categories.
 */
import React, { useState, useMemo } from 'react';
import { useAuth }          from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';

const CATEGORIES = [
  { id:'health',    label:'Health',       icon:'🏥', color:'#EF4444' },
  { id:'family',    label:'Family',       icon:'👨‍👩‍👧', color:'#F59E0B' },
  { id:'provision', label:'Provision',    icon:'🙏', color:'#C9A84C' },
  { id:'guidance',  label:'Guidance',     icon:'🌟', color:'#8B5CF6' },
  { id:'gratitude', label:'Thanksgiving', icon:'❤️', color:'#22C55E' },
  { id:'choir',     label:'Choir',        icon:'🎵', color:'#3B82F6' },
  { id:'other',     label:'Other',        icon:'✨', color:'#94A3B8' },
];

const SEED = [
  { id:'p1', authorId:'2', authorName:'Marie Claire', category:'health',   request:'Please pray for my mother who has been hospitalized this week. May God grant her a complete and speedy recovery.', isAnonymous:false, upvotes:['1','3','4'], answered:false, prayedBy:['1','3'], createdAt:new Date(Date.now()-86400000).toISOString() },
  { id:'p2', authorId:'anon', authorName:'Anonymous', category:'provision', request:'Praying for financial provision for my family. I trust God will open doors.', isAnonymous:true, upvotes:['1','2','3'], answered:false, prayedBy:['2'], createdAt:new Date(Date.now()-2*86400000).toISOString() },
  { id:'p3', authorId:'3', authorName:'Jean-Paul Habimana', category:'gratitude', request:'Grateful to God for the safe delivery of our baby girl! She and the mother are both healthy. Thank you all for your prayers!', isAnonymous:false, upvotes:['1','2','4','5','6'], answered:true, answeredNote:'God has been faithful!', prayedBy:['1','2','4','5'], createdAt:new Date(Date.now()-7*86400000).toISOString() },
  { id:'p4', authorId:'4', authorName:'Diane Mukamana', category:'choir', request:'Please pray for our Christmas performance — that God uses our voices to touch hearts and bring people to faith.', isAnonymous:false, upvotes:['1','2','3','6'], answered:false, prayedBy:['1','3','6'], createdAt:new Date(Date.now()-3*86400000).toISOString() },
];

function timeAgo(ts) {
  const d=(Date.now()-new Date(ts).getTime())/1000;
  if(d<3600)return`${Math.floor(d/60)}m ago`;
  if(d<86400)return`${Math.floor(d/3600)}h ago`;
  return`${Math.floor(d/86400)}d ago`;
}

export default function PrayerPage() {
  const { session }  = useAuth();
  const { toast }    = useNotifications();
  const myId         = String(session?.id||'1');

  const [prayers,  setPrayers]  = useState(SEED);
  const [showForm, setShowForm] = useState(false);
  const [filter,   setFilter]   = useState('all');
  const [catFilter,setCatFilter]= useState('all');
  const [form,     setForm]     = useState({ request:'', category:'other', isAnonymous:false });

  const filtered = useMemo(()=>{
    let list=[...prayers];
    if(filter==='unanswered') list=list.filter(p=>!p.answered);
    if(filter==='answered')   list=list.filter(p=>p.answered);
    if(catFilter!=='all')     list=list.filter(p=>p.category===catFilter);
    return list.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  },[prayers,filter,catFilter]);

  const upvote=(id)=>setPrayers(ps=>ps.map(p=>p.id!==id?p:{...p,upvotes:p.upvotes.includes(myId)?p.upvotes.filter(x=>x!==myId):[...p.upvotes,myId]}));
  const prayed=(id)=>{setPrayers(ps=>ps.map(p=>p.id!==id?p:{...p,prayedBy:p.prayedBy.includes(myId)?p.prayedBy.filter(x=>x!==myId):[...p.prayedBy,myId]}));toast('Praying with you 🙏',{type:'success'});};
  const markAnswered=(id)=>{setPrayers(ps=>ps.map(p=>p.id===id?{...p,answered:true,answeredNote:'God has been faithful!'}:p));toast('Praise God! 🙌',{type:'success'});};
  const del=(id)=>setPrayers(ps=>ps.filter(p=>p.id!==id));
  const submit=()=>{
    if(!form.request.trim())return;
    setPrayers(ps=>[{id:`p_${Date.now()}`,authorId:myId,authorName:session?.fullName||'Member',category:form.category,request:form.request,isAnonymous:form.isAnonymous,upvotes:[],answered:false,prayedBy:[],createdAt:new Date().toISOString()},...ps]);
    setForm({request:'',category:'other',isAnonymous:false});setShowForm(false);
    toast('Prayer request shared 🙏',{type:'success'});
  };

  return(
    <div style={{padding:'28px 32px',background:'#080C14',minHeight:'100vh',fontFamily:'Crimson Pro, serif',color:'#F0F4FF'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24,flexWrap:'wrap',gap:12}}>
        <div>
          <h1 style={{margin:0,fontSize:24,fontFamily:'Cinzel, serif',color:'#C9A84C'}}>🙏 Prayer Board</h1>
          <p style={{margin:'4px 0 0',fontSize:13,color:'#64748B'}}>{prayers.length} requests · {prayers.filter(p=>p.answered).length} answered</p>
        </div>
        <button onClick={()=>setShowForm(s=>!s)} style={{padding:'10px 20px',background:'linear-gradient(135deg,#A07820,#C9A84C)',border:'none',borderRadius:12,color:'#080C14',fontSize:13,fontWeight:700,cursor:'pointer'}}>
          🙏 Share Request
        </button>
      </div>

      {showForm&&(
        <div style={{background:'#0F172A',border:'1px solid rgba(201,168,76,0.3)',borderRadius:20,padding:24,marginBottom:20}}>
          <h3 style={{margin:'0 0 16px',fontFamily:'Cinzel, serif',color:'#C9A84C'}}>Share a Prayer Request</h3>
          <textarea value={form.request} onChange={e=>setForm(f=>({...f,request:e.target.value}))} placeholder="Share your prayer request…" rows={4}
            style={{width:'100%',background:'#141E33',border:'1px solid #1E2D4A',borderRadius:10,padding:'12px 14px',color:'#F0F4FF',fontSize:14,outline:'none',resize:'vertical',boxSizing:'border-box',fontFamily:'Crimson Pro, serif',marginBottom:12}}/>
          <div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap',marginBottom:14}}>
            <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}
              style={{background:'#141E33',border:'1px solid #1E2D4A',borderRadius:8,padding:'8px 10px',color:'#F0F4FF',fontSize:13,flex:1,minWidth:160}}>
              {CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select>
            <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
              <input type="checkbox" checked={form.isAnonymous} onChange={e=>setForm(f=>({...f,isAnonymous:e.target.checked}))} style={{accentColor:'#C9A84C'}}/>
              <span style={{fontSize:13,color:'#94A3B8'}}>Anonymous</span>
            </label>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>setShowForm(false)} style={{flex:1,padding:'9px',background:'#141E33',border:'1px solid #1E2D4A',borderRadius:10,color:'#64748B',cursor:'pointer'}}>Cancel</button>
            <button onClick={submit} disabled={!form.request.trim()} style={{flex:2,padding:'9px',background:form.request.trim()?'linear-gradient(135deg,#A07820,#C9A84C)':'#1E2D4A',border:'none',borderRadius:10,color:'#080C14',fontWeight:700,cursor:'pointer',fontSize:13}}>Submit Request</button>
          </div>
        </div>
      )}

      <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
        {[{id:'all',l:'All'},{id:'unanswered',l:'Active'},{id:'answered',l:'✓ Answered'}].map(f=>(
          <button key={f.id} onClick={()=>setFilter(f.id)} style={{padding:'5px 12px',borderRadius:20,border:'none',background:filter===f.id?'rgba(201,168,76,0.2)':'#141E33',color:filter===f.id?'#C9A84C':'#64748B',fontSize:12,cursor:'pointer',fontWeight:filter===f.id?700:400,boxShadow:filter===f.id?'0 0 0 1px rgba(201,168,76,0.3)':'none'}}>{f.l}</button>
        ))}
        {CATEGORIES.map(c=>(
          <button key={c.id} onClick={()=>setCatFilter(catFilter===c.id?'all':c.id)} style={{padding:'4px 10px',borderRadius:20,border:'none',background:catFilter===c.id?`${c.color}15`:'transparent',color:catFilter===c.id?c.color:'#374151',fontSize:12,cursor:'pointer'}}>{c.icon}</button>
        ))}
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        {filtered.map(p=>{
          const cat=CATEGORIES.find(c=>c.id===p.category)||CATEGORIES[6];
          const upvoted=p.upvotes.includes(myId), prayed_=p.prayedBy.includes(myId), isOwn=p.authorId===myId;
          return(
            <div key={p.id} style={{background:p.answered?'rgba(34,197,94,0.04)':'#0F172A',border:`1px solid ${p.answered?'#22C55E22':'#1E2D4A'}`,borderRadius:16,borderLeft:`3px solid ${cat.color}`,padding:'18px 20px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:34,height:34,borderRadius:'50%',background:`${cat.color}22`,border:`1.5px solid ${cat.color}44`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>{p.isAnonymous?'🙏':p.authorName[0]}</div>
                  <div>
                    <p style={{margin:0,fontSize:13,color:'#F0F4FF',fontWeight:600}}>{p.isAnonymous?'Anonymous':p.authorName}</p>
                    <div style={{display:'flex',gap:8,marginTop:2}}>
                      <span style={{fontSize:10,color:cat.color,background:`${cat.color}11`,border:`1px solid ${cat.color}33`,borderRadius:4,padding:'1px 5px'}}>{cat.icon} {cat.label}</span>
                      <span style={{fontSize:10,color:'#374151'}}>{timeAgo(p.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div style={{display:'flex',gap:6}}>
                  {p.answered&&<span style={{fontSize:11,color:'#22C55E',background:'#22C55E11',border:'1px solid #22C55E33',borderRadius:6,padding:'2px 8px',fontWeight:700}}>✓ Answered</span>}
                  {isOwn&&!p.answered&&<button onClick={()=>markAnswered(p.id)} style={{background:'none',border:'1px solid rgba(34,197,94,0.3)',borderRadius:6,padding:'3px 8px',color:'#22C55E',cursor:'pointer',fontSize:11}}>Mark Answered</button>}
                  {isOwn&&<button onClick={()=>del(p.id)} style={{background:'none',border:'none',color:'#374151',cursor:'pointer',fontSize:16}}>×</button>}
                </div>
              </div>
              <p style={{margin:'0 0 14px',fontSize:14,color:'#CBD5E1',lineHeight:1.7}}>{p.request}</p>
              {p.answered&&p.answeredNote&&<div style={{background:'rgba(34,197,94,0.08)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:10,padding:'10px 14px',marginBottom:12}}><p style={{margin:0,fontSize:12,color:'#22C55E',fontStyle:'italic'}}>🎉 {p.answeredNote}</p></div>}
              <div style={{display:'flex',gap:10,alignItems:'center'}}>
                <button onClick={()=>upvote(p.id)} style={{display:'flex',alignItems:'center',gap:5,background:upvoted?'rgba(201,168,76,0.15)':'transparent',border:`1px solid ${upvoted?'rgba(201,168,76,0.3)':'#1E2D4A'}`,borderRadius:8,padding:'5px 12px',cursor:'pointer',color:upvoted?'#C9A84C':'#64748B',fontSize:12,fontWeight:upvoted?700:400}}>🙏 {p.upvotes.length}</button>
                <button onClick={()=>prayed(p.id)} style={{display:'flex',alignItems:'center',gap:5,background:prayed_?'rgba(34,197,94,0.1)':'transparent',border:`1px solid ${prayed_?'rgba(34,197,94,0.3)':'#1E2D4A'}`,borderRadius:8,padding:'5px 12px',cursor:'pointer',color:prayed_?'#22C55E':'#64748B',fontSize:12}}>✓ Praying{p.prayedBy.length>0&&` (${p.prayedBy.length})`}</button>
                <span style={{marginLeft:'auto',fontSize:11,color:'#374151'}}>{p.prayedBy.length} praying</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

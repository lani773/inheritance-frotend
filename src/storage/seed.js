/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Seed Data  (Task 3: Analytics-ready)
   12 months of contributions + attendance for beautiful charts.
   ═══════════════════════════════════════════════════════════════════ */
import Storage, { KEYS } from './engine';
import { DEFAULT_ADMIN }  from '../config/constants';

export function initializeStorage() {
  if (Storage.get(KEYS.INITIALIZED)) return;

  /* ── Members ──────────────────────────────────────────────── */
  const members = [
    { ...DEFAULT_ADMIN, online: true, contributionTotal: 0 },
    { id:2,  email:'marie.uwase@choir.org',     password:'member123', fullName:'Marie Uwase',      role:'vp_welfare',      voicePart:'Soprano', status:'active', isAdmin:false, joinDate:'2021-03-10', phone:'+250 788 111 002', attendance:92, contributionTotal:0, gender:'Female', maritalStatus:'Single',  dateOfBirth:'1995-08-22', bio:'Passionate soprano.', online:true,  permissions:['welfare'] },
    { id:3,  email:'paul.habimana@choir.org',   password:'member123', fullName:'Paul Habimana',    role:'attendance_lead', voicePart:'Bass',    status:'active', isAdmin:false, joinDate:'2021-06-20', phone:'+250 788 111 003', attendance:88, contributionTotal:0, gender:'Male',   maritalStatus:'Married', dateOfBirth:'1988-11-05', bio:'Dedicated bass.',    online:false, permissions:['attendance'] },
    { id:4,  email:'grace.mukamana@choir.org',  password:'member123', fullName:'Grace Mukamana',   role:'secretary',       voicePart:'Alto',    status:'active', isAdmin:false, joinDate:'2021-09-15', phone:'+250 788 111 004', attendance:95, contributionTotal:0, gender:'Female', maritalStatus:'Married', dateOfBirth:'1990-02-14', bio:'Choir secretary.',   online:true,  permissions:['messages','posts','events'] },
    { id:5,  email:'david.niyonkuru@choir.org', password:'member123', fullName:'David Niyonkuru',  role:'treasurer',       voicePart:'Tenor',   status:'active', isAdmin:false, joinDate:'2022-01-08', phone:'+250 788 111 005', attendance:84, contributionTotal:0, gender:'Male',   maritalStatus:'Single',  dateOfBirth:'1993-07-30', bio:'Treasurer.',         online:false, permissions:['contributions'] },
    { id:6,  email:'alice.iradukunda@choir.org',password:'member123', fullName:'Alice Iradukunda', role:'member',          voicePart:'Soprano', status:'active', isAdmin:false, joinDate:'2022-04-20', phone:'+250 788 111 006', attendance:78, contributionTotal:0, gender:'Female', maritalStatus:'Single',  dateOfBirth:'1998-03-17', bio:'Soprano member.',    online:false, permissions:[] },
    { id:7,  email:'josue.nsanzimana@choir.org',password:'member123', fullName:'Josue Nsanzimana', role:'choir_director',  voicePart:'Bass',    status:'active', isAdmin:false, joinDate:'2021-02-01', phone:'+250 788 111 007', attendance:96, contributionTotal:0, gender:'Male',   maritalStatus:'Married', dateOfBirth:'1982-09-11', bio:'Choir director.',    online:true,  permissions:['songs','events','attendance'] },
    { id:8,  email:'clemence.uwase@choir.org',  password:'member123', fullName:'Clémence Uwase',   role:'member',          voicePart:'Alto',    status:'active', isAdmin:false, joinDate:'2022-07-12', phone:'+250 788 111 008', attendance:82, contributionTotal:0, gender:'Female', maritalStatus:'Married', dateOfBirth:'1987-05-30', bio:'Alto section.',      online:false, permissions:[] },
    { id:9,  email:'eric.mugabo@choir.org',     password:'member123', fullName:'Eric Mugabo',      role:'section_lead',    voicePart:'Tenor',   status:'active', isAdmin:false, joinDate:'2021-11-15', phone:'+250 788 111 009', attendance:90, contributionTotal:0, gender:'Male',   maritalStatus:'Single',  dateOfBirth:'1991-08-22', bio:'Tenor section lead.',online:true,  permissions:['attendance'] },
    { id:10, email:'hope.uwimana@choir.org',    password:'member123', fullName:'Hope Uwimana',     role:'member',          voicePart:'Alto',    status:'pending',isAdmin:false, joinDate:'2024-01-15', phone:'+250 788 111 010', attendance:0,  contributionTotal:0, gender:'Female', maritalStatus:'Single',  dateOfBirth:'2001-12-03', bio:'',                   online:false, permissions:[] },
  ];

  /* ── Events ───────────────────────────────────────────────── */
  const today   = new Date();
  const fmt     = (d) => d.toISOString().split('T')[0];
  const offset  = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return fmt(d); };

  const events = [
    { id:1,  title:'Sunday Morning Rehearsal',       type:'rehearsal',   date:offset(2),   time:'09:00', endTime:'12:00', location:'Main Sanctuary',      mandatory:true,  targetVoices:['Soprano','Alto','Tenor','Bass'], description:'Full choir rehearsal.', recurrence:'weekly'  },
    { id:2,  title:'Easter Grand Concert',           type:'performance', date:offset(14),  time:'18:00', endTime:'20:30', location:'City Hall Auditorium', mandatory:true,  targetVoices:['Soprano','Alto','Tenor','Bass'], description:'Annual Easter concert.', recurrence:'none' },
    { id:3,  title:'Soprano & Alto Sectional',       type:'rehearsal',   date:offset(5),   time:'10:00', endTime:'12:00', location:'Choir Room B',         mandatory:false, targetVoices:['Soprano','Alto'], description:'Section practice.', recurrence:'none' },
    { id:4,  title:'Monthly Leadership Meeting',     type:'meeting',     date:offset(7),   time:'14:00', endTime:'15:30', location:'Conference Room',      mandatory:false, targetVoices:['Soprano','Alto','Tenor','Bass'], description:'Monthly committee meeting.', recurrence:'monthly' },
    { id:5,  title:'Sunday Worship Service',         type:'service',     date:offset(9),   time:'08:30', endTime:'11:00', location:'Main Sanctuary',       mandatory:true,  targetVoices:['Soprano','Alto','Tenor','Bass'], description:'Regular Sunday worship.', recurrence:'weekly' },
    { id:6,  title:'Voice Workshop — Breath Control',type:'workshop',    date:offset(21),  time:'13:00', endTime:'16:00', location:'Practice Hall',        mandatory:false, targetVoices:['Soprano','Alto','Tenor','Bass'], description:'Guest instructor workshop.', recurrence:'none' },
    { id:7,  title:'Christmas Special',              type:'rehearsal',   date:offset(-30), time:'09:00', endTime:'12:00', location:'Main Sanctuary',       mandatory:true,  targetVoices:['Soprano','Alto','Tenor','Bass'], description:'Christmas rehearsal.', recurrence:'none' },
    { id:8,  title:'New Year Concert',               type:'performance', date:offset(-90), time:'19:00', endTime:'21:30', location:'Convention Centre',    mandatory:true,  targetVoices:['Soprano','Alto','Tenor','Bass'], description:'New Year celebration.', recurrence:'none' },
    { id:9,  title:'February Sunday Service',        type:'service',     date:offset(-45), time:'08:30', endTime:'11:00', location:'Main Sanctuary',       mandatory:true,  targetVoices:['Soprano','Alto','Tenor','Bass'], description:'February worship.', recurrence:'weekly' },
    { id:10, title:'Tenor & Bass Sectional',         type:'rehearsal',   date:offset(-15), time:'10:00', endTime:'12:00', location:'Choir Room A',         mandatory:false, targetVoices:['Tenor','Bass'], description:'Lower voices practice.', recurrence:'none' },
  ];

  /* ── 12 months of contributions ──────────────────────────── */
  // Base monthly amounts per member
  const bases = { 1:300, 2:240, 3:210, 4:260, 5:185, 6:160, 7:275, 8:195, 9:225 };
  // Seasonal growth pattern (Apr peak = Easter, Dec peak = Christmas)
  const seasonal = [0.80,0.82,0.90,1.15,0.95,0.88,0.85,0.88,0.92,0.95,1.00,1.20];

  const contributions = [];
  let cid = 1;
  const now = new Date();

  for (let mo = 11; mo >= 0; mo--) {
    const d   = new Date(now.getFullYear(), now.getMonth() - mo, 1);
    const yr  = d.getFullYear();
    const m   = String(d.getMonth() + 1).padStart(2, '0');
    const sf  = seasonal[d.getMonth()];

    Object.entries(bases).forEach(([mid, base]) => {
      const v = 0.88 + Math.random() * 0.24;
      const id = Number(mid);

      // Tithe (all members, every month)
      contributions.push({ id:cid++, memberId:id, type:'tithe',    amount:Math.round(base*sf*v*0.82), currency:'RWF', date:`${yr}-${m}-05`, method:['cash','mobile_money','bank_transfer'][id%3], reference:`TH-${yr}-${m}-${id}`, verified:true, notes:'', receiptNo:`CHR-${yr}-${cid}`, createdAt:`${yr}-${m}-05T10:00:00.000Z` });
      // Offering (most members, every month)
      if (id % 3 !== 0 || mo % 2 === 0) {
        contributions.push({ id:cid++, memberId:id, type:'offering',  amount:Math.round(base*sf*v*0.25), currency:'RWF', date:`${yr}-${m}-19`, method:'cash',         reference:`OF-${yr}-${m}-${id}`, verified:true, notes:'', receiptNo:`CHR-${yr}-${cid}`, createdAt:`${yr}-${m}-19T11:00:00.000Z` });
      }
      // Special gift (Easter & Christmas quarters)
      if ((mo === 1 || mo === 11) && id <= 5) {
        contributions.push({ id:cid++, memberId:id, type:'special_gift', amount:Math.round(base*sf*0.5), currency:'RWF', date:`${yr}-${m}-28`, method:'bank_transfer', reference:`SG-${yr}-${m}-${id}`, verified:true, notes:'Seasonal gift', receiptNo:`CHR-${yr}-${cid}`, createdAt:`${yr}-${m}-28T09:00:00.000Z` });
      }
    });
    // Welfare fund (every other month)
    if (mo % 2 === 1) {
      contributions.push({ id:cid++, memberId:1, type:'welfare_fund', amount:Math.round(100*sf), currency:'RWF', date:`${yr}-${m}-10`, method:'cash', reference:`WF-${yr}-${m}`, verified:true, notes:'Welfare fund', receiptNo:`CHR-${yr}-WF-${cid}`, createdAt:`${yr}-${m}-10T10:00:00.000Z` });
    }
  }

  // Update contributionTotal on each member
  const totals = {};
  contributions.forEach(c => { totals[c.memberId] = (totals[c.memberId]||0) + c.amount; });
  members.forEach(m => { if (totals[m.id]) m.contributionTotal = totals[m.id]; });

  /* ── Attendance records (past events) ─────────────────────── */
  const attendance = [];
  const pastEvents = events.filter(e => e.date < fmt(today));
  const active = members.filter(m => m.status === 'active');

  pastEvents.forEach(ev => {
    active.forEach(m => {
      const rand = Math.random() * 100;
      const rate = m.attendance || 75;
      const status = rand < rate*0.85 ? 'present' : rand < rate*0.95 ? 'late' : rand < rate ? 'excused' : 'absent';
      attendance.push({ eventId:ev.id, memberId:m.id, status, timestamp:`${ev.date}T${ev.time}:00.000Z`, markedBy:3 });
    });
  });

  /* ── Other collections (slim) ─────────────────────────────── */
  const messages = [
    { id:1, senderId:1, recipientId:null, isBroadcast:true, toVoicePart:null,      subject:'Easter Concert Preparation', body:'Dear choir family, we are 2 weeks away from our Easter Concert. Please ensure you have memorized your parts.', isRead:false, attachments:[], sentAt:new Date(Date.now()-86400000*2).toISOString(), readBy:[1,2] },
    { id:2, senderId:4, recipientId:null, isBroadcast:true, toVoicePart:null,      subject:'Meeting Minutes — February',  body:'February summary: Easter prep on track. Welfare fund RWF 50k available.',                                       isRead:false, attachments:[], sentAt:new Date(Date.now()-86400000*5).toISOString(), readBy:[1,4] },
    { id:3, senderId:7, recipientId:null, isBroadcast:true, toVoicePart:'Soprano', subject:'Soprano Practice Notes',       body:'Focus on bars 34-48 in the Hallelujah Chorus. High C in bar 42 must be clean.',                                isRead:true,  attachments:[], sentAt:new Date(Date.now()-86400000).toISOString(),   readBy:[1,2,6] },
  ];

  const posts = [
    { id:1, type:'announcement', title:'🌟 Easter Concert Tickets',    body:'Tickets for March 15 Easter Concert are available! City Hall, 6 PM. Free entry.', authorId:1, pinned:true,  expiresAt:offset(20), viewCount:45, tags:['easter'],  createdAt:new Date(Date.now()-86400000*3).toISOString() },
    { id:2, type:'prayer',       title:'🙏 Prayer — Mama Uwase',        body:"Please pray for Marie's mother recovering from surgery.",                          authorId:2, pinned:false, expiresAt:null,       viewCount:23, tags:['prayer'],  createdAt:new Date(Date.now()-86400000).toISOString()   },
    { id:3, type:'praise',       title:'🙌 Welcome Hope Uwimana!',      body:'Welcome Hope to the choir family! Alto voice.',                                    authorId:4, pinned:false, expiresAt:null,       viewCount:31, tags:['welcome'], createdAt:new Date(Date.now()-86400000*7).toISOString() },
  ];

  const songs = [
    { id:1, title:'Hallelujah Chorus', composer:'G.F. Handel',  genre:'classical',    difficulty:'advanced',     key:'D Major', timeSignature:'4/4', bpm:120, language:'English', voiceParts:['Soprano','Alto','Tenor','Bass'], status:'active', lyrics:'[CHORUS]\nHallelujah! Hallelujah!\nFor the Lord God Omnipotent reigneth.', audioUrls:{Soprano:'',Alto:'',Tenor:'',Bass:''}, videoUrl:'', sheetMusicUrl:'', notes:'Easter Concert key piece.', createdAt:'2026-01-10T10:00:00.000Z' },
    { id:2, title:'Amazing Grace',     composer:'John Newton',   genre:'hymn',         difficulty:'beginner',     key:'G Major', timeSignature:'3/4', bpm:72,  language:'English', voiceParts:['Soprano','Alto','Tenor','Bass'], status:'active', lyrics:'[VERSE 1]\nAmazing grace, how sweet the sound\nThat saved a wretch like me.', audioUrls:{Soprano:'',Alto:'',Tenor:'',Bass:''}, videoUrl:'', sheetMusicUrl:'', notes:'Opening song.',      createdAt:'2026-01-15T10:00:00.000Z' },
    { id:3, title:'Blessed Assurance', composer:'Fanny Crosby',  genre:'gospel',       difficulty:'intermediate', key:'Eb Major',timeSignature:'3/4', bpm:88,  language:'English', voiceParts:['Soprano','Alto','Tenor','Bass'], status:'active', lyrics:'[CHORUS]\nThis is my story, this is my song\nPraising my Savior all the day long.', audioUrls:{Soprano:'',Alto:'',Tenor:'',Bass:''}, videoUrl:'', sheetMusicUrl:'', notes:'Congregation favorite.', createdAt:'2026-01-20T10:00:00.000Z' },
  ];

  const welfare = [{ id:1, memberId:2, type:'medical', title:'Surgery Recovery Support', priority:'high', status:'in_progress', description:"Marie's mother requires post-surgery care.", amountNeeded:150000, amountRaised:80000, assignedTo:1, followUpDate:offset(7), timeline:[{ action:'Case opened', by:'Jean Baptiste', at:new Date(Date.now()-86400000*5).toISOString(), note:'Initial assessment.' },{ action:'Partial funds collected', by:'David', at:new Date(Date.now()-86400000*2).toISOString(), note:'RWF 80k raised.' }], createdAt:new Date(Date.now()-86400000*5).toISOString() }];

  const settings = { choirName:'INHERITANCE CHOIR', tagline:'Voices united in worship and excellence', contactEmail:'inheritancechoir@gmail.com', contactPhone:'+250 788 123 456', address:'Kigali, Rwanda', timezone:'Africa/Kigali', currency:'RWF', language:'en', brandColor:'#C9A84C', attendanceGoalPercent:80, monthlyTitheReminders:true, eventReminders24h:true, birthdayEmails:true, updatedAt:new Date().toISOString() };

  const notifications = [
    { id:1, type:'info',    title:'Easter Concert in 2 weeks',      message:'Ensure all members are prepared.',   isRead:false, actionUrl:'/dashboard/events',       createdAt:new Date(Date.now()-3600000).toISOString()     },
    { id:2, type:'warning', title:'2 members below 70% attendance', message:'Alice and Paul are at risk.',        isRead:false, actionUrl:'/dashboard/attendance',    createdAt:new Date(Date.now()-7200000).toISOString()     },
    { id:3, type:'success', title:'Hope Uwimana registered',        message:'New member pending approval.',       isRead:true,  actionUrl:'/dashboard/admin',         createdAt:new Date(Date.now()-86400000).toISOString()    },
    { id:4, type:'info',    title:'Monthly report ready',           message:'February report is available.',      isRead:true,  actionUrl:'/dashboard/reports',       createdAt:new Date(Date.now()-86400000*2).toISOString()  },
    { id:5, type:'success', title:'March tithe target reached!',    message:'Contributions goal achieved.',       isRead:false, actionUrl:'/dashboard/contributions', createdAt:new Date(Date.now()-1800000).toISOString()     },
  ];

  const auditLog = [
    { id:1, userEmail:DEFAULT_ADMIN.email, action:'member.created',        resource:'member',       resourceId:2, oldValues:null, newValues:{ fullName:'Marie Uwase' },           timestamp:'2021-03-10T09:00:00.000Z' },
    { id:2, userEmail:DEFAULT_ADMIN.email, action:'event.created',         resource:'event',        resourceId:1, oldValues:null, newValues:{ title:'Sunday Morning Rehearsal' }, timestamp:new Date(Date.now()-86400000).toISOString()  },
    { id:3, userEmail:DEFAULT_ADMIN.email, action:'contribution.recorded', resource:'contribution', resourceId:1, oldValues:null, newValues:{ amount:280, type:'tithe' },          timestamp:new Date(Date.now()-3600000).toISOString()   },
    { id:4, userEmail:'paul.habimana@choir.org', action:'attendance.saved',resource:'attendance',  resourceId:7, oldValues:null, newValues:{ eventId:7, records:9 },              timestamp:new Date(Date.now()-7200000).toISOString()   },
  ];

  /* ── Commit ───────────────────────────────────────────────── */
  Storage.set(KEYS.MEMBERS,               members);
  Storage.set(KEYS.PENDING_REGISTRATIONS, [members.find(m => m.id === 10)]);
  Storage.set(KEYS.EVENTS,               events);
  Storage.set(KEYS.CONTRIBUTIONS,        contributions);
  Storage.set(KEYS.ATTENDANCE,           attendance);
  Storage.set(KEYS.MESSAGES,             messages);
  Storage.set(KEYS.POSTS,                posts);
  Storage.set(KEYS.SONGS,               songs);
  Storage.set(KEYS.WELFARE_CASES,       welfare);
  Storage.set(KEYS.SETTINGS,            settings);
  Storage.set(KEYS.NOTIFICATIONS,       notifications);
  Storage.set(KEYS.AUDIT_LOG,           auditLog);
  Storage.set(KEYS.EXCUSES,             []);
  Storage.set(KEYS.SETLISTS,            []);
  Storage.set(KEYS.PRAYER_REQUESTS,     []);
  Storage.set(KEYS.INITIALIZED,         true);

  console.log(`✅ INHERITANCE CHOIR ready — ${members.length} members, ${contributions.length} contributions (12 months), ${attendance.length} attendance records`);
}

export function resetStorage() {
  Storage.clearAll();
  initializeStorage();
}

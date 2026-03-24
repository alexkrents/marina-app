import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://gnuhjlgqqzbkupqwajkf.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdudWhqbGdxcXpia3VwcXdhamtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMDE5ODIsImV4cCI6MjA4OTU3Nzk4Mn0.8Uv8UxTp-qncqH_7DJFaZqCZbETgJYqpfZ5lHdvrhP0"
);

const fmt     = (d) => d ? new Date(d).toLocaleString("el-GR") : "—";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("el-GR") : "—";
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString("el-GR",{hour:"2-digit",minute:"2-digit"}) : "—";

const T = {
  el: {
    appName:"Marina Manager", appSub:"Σύστημα Διαχείρισης Σκαφών",
    login:"Σύνδεση", register:"Εγγραφή", logout:"Αποσύνδεση",
    email:"Email", password:"Κωδικός (min 6 χαρ.)", fullName:"Πλήρες Όνομα",
    createAccount:"Δημιουργία Λογαριασμού", pleaseWait:"Παρακαλώ περιμένετε...",
    dashboard:"Dashboard", movements:"Στο Νερό", map:"Χάρτης",
    vessels:"Σκάφη", history:"Ιστορικό", users:"Χρήστες",
    newVessel:"+ Νέο Σκάφος", addVessel:"Προσθήκη Σκάφους",
    editVessel:"Επεξεργασία Σκάφους", save:"Αποθήκευση", cancel:"Άκυρο",
    delete:"Διαγραφή", confirm:"Είστε σίγουροι;", yes:"Ναι",
    inWater:"+ Στο Νερό", inWaterNow:"Αυτή τη στιγμή στο νερό",
    returnedToday:"Επέστρεψαν σήμερα", markReturned:"✓ Επέστρεψε",
    noVessels:"Δεν υπάρχουν σκάφη ακόμα", noHistory:"Δεν υπάρχει ιστορικό",
    noMovements:"Κανένα σκάφος στο νερό αυτή τη στιγμή",
    vesselName:"Όνομα Σκάφους", trailerPlate:"Πινακίδα Τρέιλερ",
    registry:"Νηολόγιο", owner:"Ιδιοκτήτης", notes:"Παρατηρήσεις",
    berthNumber:"Αριθμός Θέσης", status:"Κατάσταση",
    active:"Ενεργό", temp:"Προσωρινά", out:"Εκτός",
    entryDate:"Ημερομηνία Εισόδου", exitDate:"Ημερομηνία Εξόδου",
    urgent:"Επείγον", normal:"Κανονικό",
    uploadMap:"Ανέβασε Κάτοψη", changeMap:"📷 Κάτοψη",
    exportCSV:"⬇ Export", search:"🔍 Αναζήτηση...",
    all:"Όλα", dragHint:"Drag για μετακίνηση · Κλικ για επεξεργασία",
    totalVessels:"Σύνολο", activeVessels:"Ενεργά", tempVessels:"Προσωρινά",
    outVessels:"Εκτός", inWaterStat:"Στο Νερό", urgentStat:"Επείγοντα",
    monthlyActivity:"Κινήσεις τελευταίων 6 μηνών", needsAttention:"Χρειάζονται προσοχή",
    expectedReturn:"Αναμενόμενη Επιστροφή", returnPlaceholder:"π.χ. 18:00 ή Αύριο",
    selectVessel:"— Επιλέξτε σκάφος —", submit:"Καταχώρηση",
    admin:"Admin", employee:"Υπάλληλος", you:"Εσύ",
    noMap:"Δεν έχει οριστεί κάτοψη", accounts:"Λογαριασμοί Χρηστών",
    registeredOk:"Λογαριασμός δημιουργήθηκε! Συνδεθείτε.",
    addedOk:"Σκάφος προστέθηκε!", updatedOk:"Στοιχεία ενημερώθηκαν!",
    deletedOk:"διαγράφηκε", mapOk:"Κάτοψη ανέβηκε!", movedOk:"Κίνηση καταχωρήθηκε!",
    returnedOk:"Σκάφος επέστρεψε!", roleOk:"Ρόλος ενημερώθηκε!",
    outTime:"Ώρα Εξόδου", returnedAt:"Επέστρεψε", vesselOut:"Βγήκε",
    noResults:"Δεν βρέθηκαν αποτελέσματα",
  },
  en: {
    appName:"Marina Manager", appSub:"Vessel Management System",
    login:"Sign In", register:"Register", logout:"Sign Out",
    email:"Email", password:"Password (min 6 chars)", fullName:"Full Name",
    createAccount:"Create Account", pleaseWait:"Please wait...",
    dashboard:"Dashboard", movements:"In Water", map:"Map",
    vessels:"Vessels", history:"History", users:"Users",
    newVessel:"+ New Vessel", addVessel:"Add Vessel",
    editVessel:"Edit Vessel", save:"Save", cancel:"Cancel",
    delete:"Delete", confirm:"Are you sure?", yes:"Yes",
    inWater:"+ In Water", inWaterNow:"Currently in the water",
    returnedToday:"Returned today", markReturned:"✓ Returned",
    noVessels:"No vessels yet", noHistory:"No history yet",
    noMovements:"No vessels in the water right now",
    vesselName:"Vessel Name", trailerPlate:"Trailer Plate",
    registry:"Registry", owner:"Owner", notes:"Notes",
    berthNumber:"Berth Number", status:"Status",
    active:"Active", temp:"Temporary", out:"Out of service",
    entryDate:"Entry Date", exitDate:"Exit Date",
    urgent:"Urgent", normal:"Normal",
    uploadMap:"Upload Map", changeMap:"📷 Map",
    exportCSV:"⬇ Export", search:"🔍 Search...",
    all:"All", dragHint:"Drag to move · Click to edit",
    totalVessels:"Total", activeVessels:"Active", tempVessels:"Temporary",
    outVessels:"Out", inWaterStat:"In Water", urgentStat:"Urgent",
    monthlyActivity:"Activity last 6 months", needsAttention:"Needs attention",
    expectedReturn:"Expected Return", returnPlaceholder:"e.g. 18:00 or Tomorrow",
    selectVessel:"— Select vessel —", submit:"Submit",
    admin:"Admin", employee:"Employee", you:"You",
    noMap:"No map defined", accounts:"User Accounts",
    registeredOk:"Account created! Please sign in.",
    addedOk:"Vessel added!", updatedOk:"Details updated!",
    deletedOk:"deleted", mapOk:"Map uploaded!", movedOk:"Movement recorded!",
    returnedOk:"Vessel returned!", roleOk:"Role updated!",
    outTime:"Out Time", returnedAt:"Returned", vesselOut:"Out",
    noResults:"No results found",
  }
};

export default function App() {
  const [lang,      setLang]      = useState(() => localStorage.getItem("marina_lang") || "el");
  const [authMode,  setAuthMode]  = useState("login");
  const [authForm,  setAuthForm]  = useState({ email:"", password:"", name:"" });
  const [authErr,   setAuthErr]   = useState("");
  const [loading,   setLoading]   = useState(false);
  const [session,   setSession]   = useState(null);
  const [userRole,  setUserRole]  = useState("employee");
  const [vessels,   setVessels]   = useState([]);
  const [history,   setHistory]   = useState([]);
  const [movements, setMovements] = useState([]);
  const [users,     setUsers]     = useState([]);
  const [bgImage,   setBgImage]   = useState(null);
  const [view,      setView]      = useState("map");
  const [modal,     setModal]     = useState(null);
  const [dragging,  setDragging]  = useState(null);
  const [toast,     setToast]     = useState(null);
  const [zoom,      setZoom]      = useState(1);
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState("all");
  const mapRef  = useRef(null);
  const bgRef   = useRef(null);
  const dragOff = useRef({ x:0, y:0 });

  const t       = T[lang];
  const isAdmin = userRole === "admin";

  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3200); };
  const toggleLang = () => { const nl=lang==="el"?"en":"el"; setLang(nl); localStorage.setItem("marina_lang",nl); };

  function handleWheel(e) { e.preventDefault(); setZoom(z=>Math.min(4,Math.max(0.3,z-e.deltaY*0.001))); }
  function zoomIn()    { setZoom(z=>Math.min(4,+(z+0.2).toFixed(1))); }
  function zoomOut()   { setZoom(z=>Math.max(0.3,+(z-0.2).toFixed(1))); }
  function zoomReset() { setZoom(1); }

  useEffect(() => {
    supabase.auth.getSession().then(({data}) => {
      setSession(data.session);
      if (data.session) { loadAll(); loadUserRole(data.session.user.id); }
    });
    const {data:listener} = supabase.auth.onAuthStateChange((_e,sess) => {
      setSession(sess);
      if (sess) { loadAll(); loadUserRole(sess.user.id); }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadUserRole(uid) {
    const {data} = await supabase.from("marina_users").select("role").eq("user_id",uid).single();
    if (data) setUserRole(data.role);
    else { await supabase.from("marina_users").insert([{user_id:uid,role:"employee"}]); setUserRole("employee"); }
  }

  async function loadAll() {
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const [{data:v},{data:h},{data:st},{data:u},{data:m}] = await Promise.all([
      supabase.from("vessels").select("*").order("created_at",{ascending:true}),
      supabase.from("vessel_history").select("*").order("created_at",{ascending:false}).limit(300),
      supabase.from("marina_settings").select("*"),
      supabase.from("marina_users").select("*"),
      supabase.from("daily_movements").select("*").gte("created_at",todayStart.toISOString()).order("created_at",{ascending:false}),
    ]);
    if (v) setVessels(v); if (h) setHistory(h); if (u) setUsers(u); if (m) setMovements(m);
    if (st) { const bg=st.find(r=>r.key==="bg_image"); if (bg) setBgImage(bg.value); }
  }

  async function handleAuth(e) {
    e.preventDefault(); setAuthErr(""); setLoading(true);
    if (authMode==="login") {
      const {error} = await supabase.auth.signInWithPassword({email:authForm.email,password:authForm.password});
      if (error) setAuthErr(error.message);
    } else {
      const {error} = await supabase.auth.signUp({
        email:authForm.email, password:authForm.password,
        options:{data:{full_name:authForm.name}},
      });
      if (error) setAuthErr(error.message);
      else { showToast(t.registeredOk,"info"); setAuthMode("login"); setAuthForm({email:"",password:"",name:""}); }
    }
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setVessels([]); setHistory([]); setBgImage(null); setUsers([]); setMovements([]);
  }

  async function logHistory(vessel_id, action, before, after, vessel_name) {
    await supabase.from("vessel_history").insert([{
      vessel_id, vessel_name:vessel_name||"", action,
      before_data:before?JSON.stringify(before):null,
      after_data:after?JSON.stringify(after):null,
      user_email:session?.user?.email||"unknown",
    }]);
  }

  async function saveVessel(form) {
    setLoading(true);
    const payload = {
      name:form.name, trailer_plate:form.trailer_plate, registry:form.registry,
      owner:form.owner, notes:form.notes, pos_x:form.pos_x??50, pos_y:form.pos_y??50,
      berth_number:form.berth_number||"", status:form.status||"active",
      entry_date:form.entry_date||null, exit_date:form.exit_date||null,
      urgent:form.urgent||false, photo:form.photo||null,
    };
    if (!form.id) {
      const {data} = await supabase.from("vessels").insert([payload]).select().single();
      await logHistory(data?.id,"Προσθήκη σκάφους",null,payload,form.name);
      showToast(t.addedOk);
    } else {
      const old = vessels.find(v=>v.id===form.id);
      await supabase.from("vessels").update(payload).eq("id",form.id);
      await logHistory(form.id,"Επεξεργασία στοιχείων",old,payload,form.name);
      showToast(t.updatedOk);
    }
    await loadAll(); setModal(null); setLoading(false);
  }

  async function deleteVessel(id, name) {
    await supabase.from("vessel_history").delete().eq("vessel_id",id);
    await supabase.from("vessels").delete().eq("id",id);
    showToast(`"${name}" ${t.deletedOk}`);
    await loadAll(); setModal(null);
  }

  async function updateUserRole(userId, role) {
    await supabase.from("marina_users").update({role}).eq("user_id",userId);
    await loadAll(); showToast(t.roleOk);
  }

  function onDragStart(e, vessel) {
    setDragging(vessel.id);
    const r = e.currentTarget.getBoundingClientRect();
    dragOff.current = {x:e.clientX-r.left, y:e.clientY-r.top};
    e.dataTransfer.effectAllowed = "move";
  }

  async function onDrop(e) {
    e.preventDefault(); if (!dragging) return;
    const r = mapRef.current.getBoundingClientRect();
    const px = Math.max(0,Math.min(94,((e.clientX-r.left-dragOff.current.x)/r.width)*100));
    const py = Math.max(0,Math.min(94,((e.clientY-r.top-dragOff.current.y)/r.height)*100));
    const vessel = vessels.find(v=>v.id===dragging);
    await supabase.from("vessels").update({pos_x:px,pos_y:py}).eq("id",dragging);
    await logHistory(dragging,"Μετακίνηση σκάφους",{pos_x:vessel.pos_x,pos_y:vessel.pos_y},{pos_x:px,pos_y:py},vessel.name);
    setDragging(null); await loadAll();
  }

  async function handleBgUpload(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      await supabase.from("marina_settings").upsert([{key:"bg_image",value:dataUrl}],{onConflict:"key"});
      setBgImage(dataUrl);
      await logHistory(null,"Αλλαγή κάτοψης",null,{file:file.name},"—");
      showToast(t.mapOk);
    };
    reader.readAsDataURL(file);
  }

  async function addMovement(form) {
    const vessel = vessels.find(v=>v.id===form.vessel_id);
    await supabase.from("daily_movements").insert([{
      vessel_id:form.vessel_id, vessel_name:vessel?.name||"",
      owner:vessel?.owner||"", expected_return:form.expected_return||"",
      notes:form.notes||"", user_email:session?.user?.email||"unknown",
    }]);
    showToast(t.movedOk); await loadAll();
  }

  async function markReturned(id) {
    await supabase.from("daily_movements").update({returned:true,returned_time:new Date().toISOString()}).eq("id",id);
    showToast(t.returnedOk); await loadAll();
  }

  function exportCSV(rows, cols, filename) {
    const csv = [cols,...rows].map(r=>r.map(c=>`"${(c||"").toString().replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"}));
    a.download = filename; a.click();
  }

  const filteredVessels = vessels.filter(v => {
    const q = search.toLowerCase();
    const ms = !q||v.name?.toLowerCase().includes(q)||v.owner?.toLowerCase().includes(q)||v.trailer_plate?.toLowerCase().includes(q)||v.berth_number?.toLowerCase().includes(q);
    const mf = filter==="all"||v.status===filter||(filter==="urgent"&&v.urgent);
    return ms && mf;
  });

  const activeMovements   = movements.filter(m=>!m.returned);
  const returnedMovements = movements.filter(m=>m.returned);

  const stats = {
    total:vessels.length, active:vessels.filter(v=>v.status==="active").length,
    temp:vessels.filter(v=>v.status==="temp").length, out:vessels.filter(v=>v.status==="out").length,
    urgent:vessels.filter(v=>v.urgent).length, inWater:activeMovements.length,
  };

  const monthlyData = Array.from({length:6},(_,i)=>{
    const d=new Date(); d.setMonth(d.getMonth()-5+i);
    const mo=d.getMonth(); const y=d.getFullYear();
    return { label:d.toLocaleDateString("el-GR",{month:"short"}), count:history.filter(h=>{const hd=new Date(h.created_at);return hd.getMonth()===mo&&hd.getFullYear()===y;}).length };
  });
  const maxMonthly = Math.max(...monthlyData.map(d=>d.count),1);

  // ── LOGIN ────────────────────────────────────────────────────────────────
  if (!session) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f0f4f8",fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
      <button onClick={toggleLang} style={{position:"fixed",top:20,right:20,padding:"6px 16px",background:"#fff",border:"1px solid #d1d5db",borderRadius:20,color:"#374151",fontSize:13,fontWeight:600,cursor:"pointer",boxShadow:"0 1px 3px rgba(0,0,0,0.1)"}}>
        {lang==="el"?"EN":"ΕΛ"}
      </button>
      <div style={{width:"100%",maxWidth:400,padding:"0 20px"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:64,height:64,background:"#1d4ed8",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 16px"}}>⚓</div>
          <h1 style={{color:"#111827",fontSize:26,fontWeight:700,margin:"0 0 4px"}}>{t.appName}</h1>
          <p style={{color:"#6b7280",fontSize:14,margin:0}}>{t.appSub}</p>
        </div>
        <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:16,padding:"28px 24px",boxShadow:"0 4px 16px rgba(0,0,0,0.06)"}}>
          <div style={{display:"flex",gap:4,marginBottom:22,background:"#f3f4f6",borderRadius:10,padding:4}}>
            {["login","register"].map(m=>(
              <button key={m} style={{flex:1,padding:"8px 0",border:"none",borderRadius:7,cursor:"pointer",background:authMode===m?"#fff":"transparent",color:authMode===m?"#111827":"#6b7280",fontSize:14,fontWeight:500,boxShadow:authMode===m?"0 1px 4px rgba(0,0,0,0.1)":"none"}}
                onClick={()=>{setAuthMode(m);setAuthErr("");}}>
                {m==="login"?t.login:t.register}
              </button>
            ))}
          </div>
          <form onSubmit={handleAuth} style={{display:"flex",flexDirection:"column",gap:12}}>
            {authMode==="register"&&<input style={S.inp} placeholder={t.fullName} value={authForm.name} onChange={e=>setAuthForm({...authForm,name:e.target.value})} required />}
            <input style={S.inp} type="email" placeholder={t.email} value={authForm.email} onChange={e=>setAuthForm({...authForm,email:e.target.value})} required />
            <input style={S.inp} type="password" placeholder={t.password} value={authForm.password} onChange={e=>setAuthForm({...authForm,password:e.target.value})} required minLength={6} />
            {authErr&&<p style={{color:"#dc2626",fontSize:13,margin:0}}>{authErr}</p>}
            <button style={{...S.btnP,width:"100%",padding:"12px",fontSize:15,borderRadius:10,marginTop:4}} type="submit" disabled={loading}>
              {loading?t.pleaseWait:authMode==="login"?t.login:t.createAccount}
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  // ── MAIN ─────────────────────────────────────────────────────────────────
  return (
    <div style={S.app}>
      {/* SIDEBAR */}
      <aside style={S.sidebar}>
        <div style={{padding:"20px 16px 16px",borderBottom:"1px solid #e5e7eb"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,background:"#1d4ed8",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>⚓</div>
            <div>
              <div style={{color:"#111827",fontWeight:700,fontSize:14,lineHeight:1.2}}>Marina Manager</div>
              <div style={{color:"#6b7280",fontSize:11}}>{t.appSub}</div>
            </div>
          </div>
        </div>

        <nav style={{flex:1,padding:"10px 8px",display:"flex",flexDirection:"column",gap:2}}>
          {[
            ["dashboard","📊",t.dashboard],
            ["movements","🌊",t.movements],
            ["map","🗺️",t.map],
            ["list","📋",t.vessels],
            ["history","📜",t.history],
            ...(isAdmin?[["users","👥",t.users]]:[]),
          ].map(([id,ic,lb])=>(
            <button key={id} onClick={()=>setView(id)}
              style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",border:"none",borderRadius:8,cursor:"pointer",textAlign:"left",fontSize:14,fontWeight:view===id?600:400,
                background:view===id?"#eff6ff":"transparent",color:view===id?"#1d4ed8":"#374151"}}>
              <span style={{fontSize:16}}>{ic}</span>{lb}
              {id==="movements"&&activeMovements.length>0&&<span style={{marginLeft:"auto",background:"#0ea5e9",color:"#fff",fontSize:10,fontWeight:700,padding:"1px 7px",borderRadius:10}}>{activeMovements.length}</span>}
              {id==="list"&&stats.urgent>0&&<span style={{marginLeft:"auto",background:"#dc2626",color:"#fff",fontSize:10,fontWeight:700,padding:"1px 7px",borderRadius:10}}>{stats.urgent}</span>}
            </button>
          ))}
        </nav>

        <div style={{padding:"10px 8px",borderTop:"1px solid #e5e7eb"}}>
          <div style={{padding:"8px 10px",background:"#f9fafb",borderRadius:8,marginBottom:8,border:"1px solid #e5e7eb"}}>
            <div style={{color:"#374151",fontSize:12,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{session.user?.email}</div>
            <div style={{color:"#6b7280",fontSize:11,marginTop:1}}>{isAdmin?"👑 Admin":"👤 "+t.employee}</div>
          </div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={toggleLang} style={{flex:1,padding:"7px",background:"#f3f4f6",border:"1px solid #e5e7eb",borderRadius:7,color:"#374151",cursor:"pointer",fontSize:12,fontWeight:600}}>
              {lang==="el"?"EN":"ΕΛ"}
            </button>
            <button onClick={handleLogout} style={{flex:2,padding:"7px",background:"#f3f4f6",border:"1px solid #e5e7eb",borderRadius:7,color:"#6b7280",cursor:"pointer",fontSize:12}}>
              {t.logout}
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:"#f9fafb"}}>
        {/* TOPBAR */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 24px",borderBottom:"1px solid #e5e7eb",background:"#fff",flexShrink:0,gap:12,flexWrap:"wrap",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
          <h2 style={{margin:0,fontSize:16,fontWeight:600,color:"#111827"}}>
            {view==="dashboard"?`📊 ${t.dashboard}`:view==="movements"?`🌊 ${t.movements}`:view==="map"?`🗺️ ${t.map}`:view==="list"?`📋 ${t.vessels}`:view==="history"?`📜 ${t.history}`:`👥 ${t.users}`}
          </h2>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            {view==="list"&&<input style={{...S.inp,width:190,padding:"7px 12px"}} placeholder={t.search} value={search} onChange={e=>setSearch(e.target.value)} />}
            {view==="list"&&(
              <select style={{...S.inp,width:"auto",padding:"7px 10px"}} value={filter} onChange={e=>setFilter(e.target.value)}>
                <option value="all">{t.all}</option>
                <option value="active">🟢 {t.active}</option>
                <option value="temp">🟡 {t.temp}</option>
                <option value="out">🔴 {t.out}</option>
                <option value="urgent">🚨 {t.urgentStat}</option>
              </select>
            )}
            {view==="map"&&<>
              <button style={S.btnS} onClick={()=>bgRef.current.click()}>{t.changeMap}</button>
              <input ref={bgRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleBgUpload}/>
              <div style={{display:"flex",alignItems:"center",gap:4,background:"#f3f4f6",border:"1px solid #e5e7eb",borderRadius:8,padding:"5px 10px"}}>
                <button style={S.zoomBtn} onClick={zoomOut}>−</button>
                <span style={{color:"#6b7280",fontSize:12,minWidth:36,textAlign:"center"}}>{Math.round(zoom*100)}%</span>
                <button style={S.zoomBtn} onClick={zoomIn}>+</button>
                <button style={{...S.zoomBtn,fontSize:11}} onClick={zoomReset}>↺</button>
              </div>
            </>}
            {view==="movements"&&<button style={S.btnP} onClick={()=>setModal({type:"movement"})}>{t.inWater}</button>}
            {(view==="map"||view==="list")&&<button style={S.btnP} onClick={()=>setModal({type:"vessel",vessel:null})}>{t.newVessel}</button>}
            {view==="list"&&isAdmin&&<button style={S.btnS} onClick={()=>exportCSV(
              vessels.map(v=>[v.name,v.berth_number,v.trailer_plate,v.registry,v.owner,v.status,fmtDate(v.entry_date),fmtDate(v.exit_date),v.urgent?"Y":"",v.notes]),
              ["Name","Berth","Plate","Registry","Owner","Status","Entry","Exit","Urgent","Notes"],
              `marina_${new Date().toISOString().slice(0,10)}.csv`)}>{t.exportCSV}</button>}
          </div>
        </div>

        {/* DASHBOARD */}
        {view==="dashboard"&&(
          <div style={{flex:1,overflow:"auto",padding:24}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:14,marginBottom:24}}>
              {[
                [t.totalVessels,"⚓",stats.total,"#1d4ed8","#eff6ff"],
                [t.activeVessels,"🟢",stats.active,"#059669","#ecfdf5"],
                [t.tempVessels,"🟡",stats.temp,"#d97706","#fffbeb"],
                [t.outVessels,"🔴",stats.out,"#dc2626","#fef2f2"],
                [t.inWaterStat,"🌊",stats.inWater,"#0284c7","#f0f9ff"],
                [t.urgentStat,"🚨",stats.urgent,"#dc2626","#fef2f2"],
              ].map(([lb,ic,val,color,bg])=>(
                <div key={lb} style={{background:bg,border:`1px solid ${color}22`,borderRadius:14,padding:"18px 16px"}}>
                  <div style={{fontSize:24,marginBottom:8}}>{ic}</div>
                  <div style={{fontSize:28,fontWeight:700,color}}>{val}</div>
                  <div style={{fontSize:12,color:"#6b7280",marginTop:4,fontWeight:500}}>{lb}</div>
                </div>
              ))}
            </div>
            <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:14,padding:22,marginBottom:20,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
              <h3 style={{margin:"0 0 18px",color:"#374151",fontSize:13,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>{t.monthlyActivity}</h3>
              <div style={{display:"flex",alignItems:"flex-end",gap:10,height:100}}>
                {monthlyData.map((d,i)=>(
                  <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                    <span style={{fontSize:11,color:"#6b7280",fontWeight:500}}>{d.count}</span>
                    <div style={{width:"100%",background:"#1d4ed8",borderRadius:"4px 4px 0 0",height:`${Math.max(4,(d.count/maxMonthly)*80)}px`,opacity:0.7+i*0.05}}/>
                    <span style={{fontSize:11,color:"#9ca3af"}}>{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
            {stats.urgent>0&&(
              <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:14,padding:20}}>
                <h3 style={{margin:"0 0 12px",color:"#dc2626",fontSize:13,fontWeight:600,textTransform:"uppercase"}}>🚨 {t.needsAttention}</h3>
                {vessels.filter(v=>v.urgent).map(v=>(
                  <div key={v.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #fee2e2"}}>
                    <div>
                      <strong style={{color:"#111827"}}>{v.name}</strong>
                      {v.berth_number&&<span style={{color:"#6b7280",fontSize:12,marginLeft:8}}>Θέση {v.berth_number}</span>}
                      {v.notes&&<p style={{color:"#6b7280",fontSize:12,margin:"2px 0 0"}}>{v.notes}</p>}
                    </div>
                    <button style={{...S.btnS,padding:"5px 10px",fontSize:12}} onClick={()=>setModal({type:"vessel",vessel:v})}>✏️</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MOVEMENTS */}
        {view==="movements"&&(
          <div style={{flex:1,overflow:"auto",padding:24}}>
            <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:14,marginBottom:16,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
              <div style={{padding:"14px 18px",borderBottom:"1px solid #f3f4f6",display:"flex",alignItems:"center",gap:10}}>
                <h3 style={{margin:0,color:"#111827",fontSize:15,fontWeight:600}}>{t.inWaterNow}</h3>
                {activeMovements.length>0&&<span style={{background:"#0ea5e9",color:"#fff",fontSize:11,padding:"2px 9px",borderRadius:10,fontWeight:600}}>{activeMovements.length}</span>}
              </div>
              {activeMovements.length===0?(
                <div style={{padding:"36px",textAlign:"center",color:"#9ca3af"}}>
                  <div style={{fontSize:36,marginBottom:10}}>⚓</div>
                  <p style={{margin:0,fontSize:14}}>{t.noMovements}</p>
                </div>
              ):(
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
                  <thead style={{background:"#f9fafb"}}><tr>
                    {[t.vesselName,t.owner,t.outTime,t.expectedReturn,""].map(h=>(
                      <th key={h} style={{textAlign:"left",padding:"10px 16px",color:"#6b7280",fontSize:12,fontWeight:600,borderBottom:"1px solid #e5e7eb",textTransform:"uppercase",letterSpacing:0.3}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {activeMovements.map(m=>(
                      <tr key={m.id} style={{borderBottom:"1px solid #f3f4f6"}}>
                        <td style={S.td}><strong style={{color:"#111827"}}>🚤 {m.vessel_name}</strong></td>
                        <td style={S.td}>{m.owner||"—"}</td>
                        <td style={{...S.td,color:"#1d4ed8",fontWeight:600}}>{fmtTime(m.out_time||m.created_at)}</td>
                        <td style={S.td}>{m.expected_return||"—"}</td>
                        <td style={S.td}>
                          <button style={{padding:"6px 14px",background:"#ecfdf5",color:"#059669",border:"1px solid #a7f3d0",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:500}}
                            onClick={()=>markReturned(m.id)}>{t.markReturned}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {returnedMovements.length>0&&(
              <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:14,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
                <div style={{padding:"12px 18px",borderBottom:"1px solid #f3f4f6",background:"#f9fafb"}}><h3 style={{margin:0,color:"#6b7280",fontSize:13,fontWeight:500}}>✅ {t.returnedToday} ({returnedMovements.length})</h3></div>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead style={{background:"#f9fafb"}}><tr>
                    {[t.vesselName,t.owner,t.vesselOut,t.returnedAt].map(h=>(
                      <th key={h} style={{textAlign:"left",padding:"9px 16px",color:"#6b7280",fontSize:11,fontWeight:600,borderBottom:"1px solid #e5e7eb",textTransform:"uppercase"}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {returnedMovements.map(m=>(
                      <tr key={m.id} style={{borderBottom:"1px solid #f3f4f6",opacity:0.6}}>
                        <td style={S.td}>{m.vessel_name}</td>
                        <td style={S.td}>{m.owner||"—"}</td>
                        <td style={S.td}>{fmtTime(m.out_time||m.created_at)}</td>
                        <td style={{...S.td,color:"#059669",fontWeight:500}}>{fmtTime(m.returned_time)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* MAP */}
        {view==="map"&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div ref={mapRef} style={{flex:1,position:"relative",overflow:"hidden",cursor:"crosshair",background:"#e2e8f0"}}
              onDragOver={e=>e.preventDefault()} onDrop={onDrop} onWheel={handleWheel}>
              <div style={{position:"absolute",inset:0,transform:`scale(${zoom})`,transformOrigin:"center center",backgroundImage:bgImage?`url(${bgImage})`:"none",backgroundSize:"contain",backgroundPosition:"center",backgroundRepeat:"no-repeat"}}>
                {!bgImage&&(
                  <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"#94a3b8"}}>
                    <div style={{fontSize:48,marginBottom:12}}>🏖️</div>
                    <p style={{margin:"0 0 16px",fontSize:15,color:"#64748b"}}>{t.noMap}</p>
                    <button style={S.btnP} onClick={()=>bgRef.current.click()}>{t.uploadMap}</button>
                  </div>
                )}
                {filteredVessels.map(v=>(
                  <div key={v.id} draggable onDragStart={e=>onDragStart(e,v)} onClick={()=>setModal({type:"vessel",vessel:v})}
                    style={{position:"absolute",left:`${v.pos_x}%`,top:`${v.pos_y}%`,transform:"translate(-50%,-50%)",cursor:"grab",userSelect:"none",display:"flex",flexDirection:"column",alignItems:"center",zIndex:10,opacity:dragging===v.id?0.3:1}}>
                    <div style={{fontSize:26,filter:"drop-shadow(0 2px 4px rgba(0,0,0,.3))"}}>{v.urgent?"🚨":"🚤"}</div>
                    <div style={{background:v.status==="out"?"#dc2626":v.status==="temp"?"#d97706":"#1d4ed8",color:"#fff",fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:4,marginTop:2,whiteSpace:"nowrap",maxWidth:110,overflow:"hidden",textOverflow:"ellipsis",boxShadow:"0 1px 4px rgba(0,0,0,.2)"}}>
                      {v.berth_number?`[${v.berth_number}] `:""}{v.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{padding:"8px 18px",background:"#fff",borderTop:"1px solid #e5e7eb",color:"#6b7280",fontSize:12,flexShrink:0,display:"flex",justifyContent:"space-between"}}>
              <span>{t.dragHint} · {filteredVessels.length} {t.vessels.toLowerCase()}</span>
              {activeMovements.length>0&&<span style={{color:"#0284c7",fontWeight:500}}>🌊 {activeMovements.length} {t.movements.toLowerCase()}</span>}
            </div>
          </div>
        )}

        {/* LIST */}
        {view==="list"&&(
          <div style={{flex:1,overflow:"auto",padding:24}}>
            {filteredVessels.length===0?(
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:250,gap:12,color:"#9ca3af"}}>
                <div style={{fontSize:46}}>⛵</div>
                <p style={{color:"#6b7280"}}>{search||filter!=="all"?t.noResults:t.noVessels}</p>
                {!search&&filter==="all"&&<button style={S.btnP} onClick={()=>setModal({type:"vessel",vessel:null})}>{t.newVessel}</button>}
              </div>
            ):(
              <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:14,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:14,minWidth:680}}>
                    <thead style={{background:"#f9fafb"}}><tr>
                      {["",t.vesselName,t.berthNumber,t.status,t.trailerPlate,t.owner,t.entryDate,t.exitDate,""].map(h=>(
                        <th key={h} style={{textAlign:"left",padding:"11px 14px",color:"#6b7280",fontSize:12,fontWeight:600,borderBottom:"1px solid #e5e7eb",textTransform:"uppercase",letterSpacing:0.3}}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {filteredVessels.map(v=>(
                        <tr key={v.id} style={{borderBottom:"1px solid #f3f4f6",background:v.urgent?"#fef2f2":"#fff"}}>
                          <td style={{...S.td,fontSize:18}}>{v.urgent?"🚨":"🚤"}</td>
                          <td style={S.td}><strong style={{color:"#111827"}}>{v.name}</strong></td>
                          <td style={S.td}>{v.berth_number?<span style={{background:"#eff6ff",color:"#1d4ed8",padding:"2px 9px",borderRadius:6,fontSize:12,fontWeight:600}}>{v.berth_number}</span>:"—"}</td>
                          <td style={S.td}><span style={{fontSize:13}}>{v.status==="active"?"🟢":v.status==="temp"?"🟡":"🔴"} <span style={{color:"#374151"}}>{t[v.status]||""}</span></span></td>
                          <td style={{...S.td,color:"#374151"}}>{v.trailer_plate||"—"}</td>
                          <td style={{...S.td,color:"#374151"}}>{v.owner||"—"}</td>
                          <td style={{...S.td,fontSize:12,color:"#6b7280"}}>{fmtDate(v.entry_date)}</td>
                          <td style={{...S.td,fontSize:12,color:v.exit_date&&new Date(v.exit_date)<new Date()?"#dc2626":"#6b7280"}}>{fmtDate(v.exit_date)}</td>
                          <td style={S.td}><button style={{padding:"5px 12px",background:"#eff6ff",color:"#1d4ed8",border:"1px solid #bfdbfe",borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:500}} onClick={()=>setModal({type:"vessel",vessel:v})}>✏️ Edit</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* HISTORY */}
        {view==="history"&&(
          <div style={{flex:1,overflow:"auto",padding:24}}>
            {history.length===0?(
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:250,gap:12,color:"#9ca3af"}}>
                <div style={{fontSize:46}}>📜</div><p>{t.noHistory}</p>
              </div>
            ):(
              <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:14,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
                  <thead style={{background:"#f9fafb"}}><tr>
                    {["Ημερομηνία/Ώρα",t.vesselName,"Ενέργεια","Χρήστης"].map(h=>(
                      <th key={h} style={{textAlign:"left",padding:"11px 16px",color:"#6b7280",fontSize:12,fontWeight:600,borderBottom:"1px solid #e5e7eb",textTransform:"uppercase"}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {history.map(h=>(
                      <tr key={h.id} style={{borderBottom:"1px solid #f3f4f6"}}>
                        <td style={{...S.td,whiteSpace:"nowrap",fontSize:12,color:"#6b7280"}}>{fmt(h.created_at)}</td>
                        <td style={S.td}><strong style={{color:"#111827"}}>{h.vessel_name||"—"}</strong></td>
                        <td style={S.td}>
                          <span style={{padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:500,
                            background:h.action.includes("Μετακίν")?"#eff6ff":h.action.includes("Προσθήκη")?"#ecfdf5":h.action.includes("Διαγρ")?"#fef2f2":"#f3f4f6",
                            color:h.action.includes("Μετακίν")?"#1d4ed8":h.action.includes("Προσθήκη")?"#059669":h.action.includes("Διαγρ")?"#dc2626":"#374151"}}>
                            {h.action}
                          </span>
                        </td>
                        <td style={{...S.td,color:"#6b7280",fontSize:12}}>{h.user_email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* USERS */}
        {view==="users"&&isAdmin&&(
          <div style={{flex:1,overflow:"auto",padding:24}}>
            <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:14,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
              <div style={{padding:"14px 18px",borderBottom:"1px solid #e5e7eb",background:"#f9fafb"}}><h3 style={{margin:0,color:"#111827",fontSize:15,fontWeight:600}}>👥 {t.accounts}</h3></div>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
                <thead><tr>
                  {["User ID",t.role,""].map(h=>(
                    <th key={h} style={{textAlign:"left",padding:"10px 18px",color:"#6b7280",fontSize:12,fontWeight:600,borderBottom:"1px solid #e5e7eb",textTransform:"uppercase"}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {users.map(u=>(
                    <tr key={u.user_id} style={{borderBottom:"1px solid #f3f4f6"}}>
                      <td style={{...S.td,fontSize:11,color:"#6b7280",fontFamily:"monospace"}}>{u.user_id?.slice(0,20)}...</td>
                      <td style={S.td}>
                        <span style={{padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:500,background:u.role==="admin"?"#eff6ff":"#f3f4f6",color:u.role==="admin"?"#1d4ed8":"#374151"}}>
                          {u.role==="admin"?`👑 ${t.admin}`:`👤 ${t.employee}`}
                        </span>
                      </td>
                      <td style={S.td}>{u.user_id!==session?.user?.id?
                        <button style={{padding:"5px 12px",background:"#eff6ff",color:"#1d4ed8",border:"1px solid #bfdbfe",borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:500}} onClick={()=>updateUserRole(u.user_id,u.role==="admin"?"employee":"admin")}>
                          → {u.role==="admin"?t.employee:t.admin}
                        </button>
                        :<span style={{color:"#9ca3af",fontSize:12}}>{t.you}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {modal?.type==="vessel"&&<VesselModal vessel={modal.vessel} loading={loading} isAdmin={isAdmin} t={t} onSave={saveVessel} onDelete={deleteVessel} onClose={()=>setModal(null)} />}
      {modal?.type==="movement"&&<MovementModal vessels={vessels} loading={loading} t={t} onSave={addMovement} onClose={()=>setModal(null)} />}

      {toast&&(
        <div style={{position:"fixed",bottom:24,right:24,padding:"12px 20px",borderRadius:12,color:"#fff",fontSize:14,fontWeight:500,zIndex:999,boxShadow:"0 4px 16px rgba(0,0,0,.15)",
          background:toast.type==="error"?"#dc2626":toast.type==="info"?"#1d4ed8":"#059669"}}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function MovementModal({vessels,onSave,onClose,loading,t}) {
  const [form,setForm] = useState({vessel_id:"",expected_return:"",notes:""});
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:16,width:"100%",maxWidth:420,boxShadow:"0 20px 50px rgba(0,0,0,.15)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:"1px solid #f3f4f6"}}>
          <h3 style={{margin:0,fontSize:16,fontWeight:600,color:"#111827"}}>🌊 {t.inWater}</h3>
          <button style={{background:"none",border:"none",color:"#9ca3af",fontSize:20,cursor:"pointer"}} onClick={onClose}>✕</button>
        </div>
        <div style={{padding:"16px 20px",display:"flex",flexDirection:"column",gap:13}}>
          <div><label style={S.lbl}>{t.vesselName}</label>
            <select style={S.inp} value={form.vessel_id} onChange={e=>set("vessel_id",e.target.value)}>
              <option value="">{t.selectVessel}</option>
              {vessels.map(v=><option key={v.id} value={v.id}>{v.name}{v.berth_number?` [${v.berth_number}]`:""}</option>)}
            </select>
          </div>
          <div><label style={S.lbl}>{t.expectedReturn}</label><input style={S.inp} placeholder={t.returnPlaceholder} value={form.expected_return} onChange={e=>set("expected_return",e.target.value)} /></div>
          <div><label style={S.lbl}>{t.notes}</label><textarea style={{...S.inp,height:58,resize:"vertical"}} value={form.notes} onChange={e=>set("notes",e.target.value)} /></div>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:8,padding:"14px 20px",borderTop:"1px solid #f3f4f6"}}>
          <button style={S.btnS} onClick={onClose}>{t.cancel}</button>
          <button style={{...S.btnP,opacity:!form.vessel_id||loading?0.5:1}} disabled={!form.vessel_id||loading} onClick={()=>{onSave(form);onClose();}}>{loading?"...":t.submit}</button>
        </div>
      </div>
    </div>
  );
}

function VesselModal({vessel,onSave,onDelete,onClose,loading,isAdmin,t}) {
  const [form,setForm] = useState({
    id:vessel?.id||null, name:vessel?.name||"", trailer_plate:vessel?.trailer_plate||"",
    registry:vessel?.registry||"", owner:vessel?.owner||"", notes:vessel?.notes||"",
    pos_x:vessel?.pos_x??50, pos_y:vessel?.pos_y??50, berth_number:vessel?.berth_number||"",
    status:vessel?.status||"active", entry_date:vessel?.entry_date||"", exit_date:vessel?.exit_date||"",
    urgent:vessel?.urgent||false, photo:vessel?.photo||null,
  });
  const [confirmDel,setConfirmDel] = useState(false);
  const photoRef = useRef(null);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  function handlePhoto(e) {
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader(); reader.onload=(ev)=>set("photo",ev.target.result); reader.readAsDataURL(file);
  }
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:16,width:"100%",maxWidth:520,boxShadow:"0 20px 50px rgba(0,0,0,.15)",maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:"1px solid #f3f4f6",position:"sticky",top:0,background:"#fff",zIndex:1}}>
          <h3 style={{margin:0,fontSize:16,fontWeight:600,color:"#111827"}}>{vessel?`✏️ ${t.editVessel}`:`🚤 ${t.addVessel}`}</h3>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={()=>set("urgent",!form.urgent)} style={{padding:"5px 12px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:500,background:form.urgent?"#fef2f2":"#f3f4f6",color:form.urgent?"#dc2626":"#6b7280",border:`1px solid ${form.urgent?"#fecaca":"#e5e7eb"}`}}>
              🚨 {form.urgent?t.urgent:t.normal}
            </button>
            <button style={{background:"none",border:"none",color:"#9ca3af",fontSize:20,cursor:"pointer"}} onClick={onClose}>✕</button>
          </div>
        </div>
        <div style={{padding:"18px 20px",display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
            <div style={{width:72,height:72,borderRadius:12,overflow:"hidden",background:"#f3f4f6",border:"1px solid #e5e7eb",flexShrink:0,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>photoRef.current.click()}>
              {form.photo?<img src={form.photo} style={{width:"100%",height:"100%",objectFit:"cover"}} />:<span style={{fontSize:24}}>📷</span>}
            </div>
            <input ref={photoRef} type="file" accept="image/*" style={{display:"none"}} onChange={handlePhoto} />
            <div style={{flex:1}}><label style={S.lbl}>{t.vesselName} *</label><input style={S.inp} value={form.name} onChange={e=>set("name",e.target.value)} /></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13}}>
            {[["trailer_plate",t.trailerPlate],["registry",t.registry],["owner",t.owner],["berth_number",t.berthNumber]].map(([k,lb])=>(
              <div key={k}><label style={S.lbl}>{lb}</label><input style={S.inp} value={form[k]} onChange={e=>set(k,e.target.value)} /></div>
            ))}
          </div>
          <div><label style={S.lbl}>{t.status}</label>
            <div style={{display:"flex",gap:8}}>
              {[["active",`🟢 ${t.active}`],["temp",`🟡 ${t.temp}`],["out",`🔴 ${t.out}`]].map(([val,lb])=>(
                <button key={val} onClick={()=>set("status",val)} style={{flex:1,padding:"9px 6px",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:500,background:form.status===val?"#eff6ff":"#f9fafb",color:form.status===val?"#1d4ed8":"#374151",border:`1px solid ${form.status===val?"#bfdbfe":"#e5e7eb"}`}}>{lb}</button>
              ))}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13}}>
            <div><label style={S.lbl}>{t.entryDate}</label><input style={S.inp} type="date" value={form.entry_date||""} onChange={e=>set("entry_date",e.target.value)} /></div>
            <div><label style={S.lbl}>{t.exitDate}</label><input style={S.inp} type="date" value={form.exit_date||""} onChange={e=>set("exit_date",e.target.value)} /></div>
          </div>
          <div><label style={S.lbl}>{t.notes}</label><textarea style={{...S.inp,height:68,resize:"vertical"}} value={form.notes} onChange={e=>set("notes",e.target.value)} /></div>
        </div>
        <div style={{display:"flex",alignItems:"center",padding:"14px 20px",borderTop:"1px solid #f3f4f6",gap:8,flexWrap:"wrap",position:"sticky",bottom:0,background:"#fff"}}>
          {vessel&&isAdmin&&!confirmDel&&<button style={{padding:"8px 14px",background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:500}} onClick={()=>setConfirmDel(true)}>🗑 {t.delete}</button>}
          {confirmDel&&<div style={{display:"flex",gap:8,alignItems:"center"}}>
            <span style={{color:"#dc2626",fontSize:13}}>{t.confirm}</span>
            <button style={{padding:"7px 12px",background:"#dc2626",color:"#fff",border:"none",borderRadius:7,cursor:"pointer",fontSize:13,fontWeight:500}} onClick={()=>onDelete(vessel.id,vessel.name)}>{t.yes}</button>
            <button style={S.btnS} onClick={()=>setConfirmDel(false)}>{t.cancel}</button>
          </div>}
          <div style={{marginLeft:"auto",display:"flex",gap:8}}>
            <button style={S.btnS} onClick={onClose}>{t.cancel}</button>
            <button style={{...S.btnP,opacity:!form.name||loading?0.5:1}} disabled={!form.name||loading} onClick={()=>onSave(form)}>{loading?"...":vessel?t.save:t.addVessel}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  inp:     { width:"100%",padding:"10px 13px",background:"#fff",border:"1px solid #d1d5db",
             borderRadius:8,color:"#111827",fontSize:14,boxSizing:"border-box",outline:"none",
             fontFamily:"inherit" },
  lbl:     { color:"#374151",fontSize:12,fontWeight:500,display:"block",marginBottom:5 },
  btnP:    { padding:"9px 18px",background:"#1d4ed8",color:"#fff",border:"none",borderRadius:8,
             cursor:"pointer",fontSize:14,fontWeight:500,whiteSpace:"nowrap" },
  btnS:    { padding:"9px 15px",background:"#fff",color:"#374151",border:"1px solid #d1d5db",
             borderRadius:8,cursor:"pointer",fontSize:14,whiteSpace:"nowrap" },
  app:     { display:"flex",height:"100vh",background:"#f9fafb",
             fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",color:"#111827",overflow:"hidden" },
  sidebar: { width:220,background:"#fff",borderRight:"1px solid #e5e7eb",
             display:"flex",flexDirection:"column",flexShrink:0,boxShadow:"1px 0 4px rgba(0,0,0,0.04)" },
  td:      { padding:"11px 14px",color:"#374151",fontSize:14 },
  zoomBtn: { padding:"2px 8px",background:"transparent",border:"none",color:"#374151",cursor:"pointer",fontSize:18,fontWeight:300,lineHeight:1 },
};

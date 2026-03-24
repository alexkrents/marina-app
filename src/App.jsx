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
    if (v) setVessels(v);
    if (h) setHistory(h);
    if (u) setUsers(u);
    if (m) setMovements(m);
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
    <div style={S.bg}>
      <button onClick={toggleLang} style={{position:"fixed",top:16,right:16,zIndex:999,padding:"6px 14px",background:"rgba(255,255,255,0.1)",backdropFilter:"blur(10px)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:20,color:"#f1f5f9",fontSize:13,fontWeight:600,cursor:"pointer"}}>
        {lang==="el"?"EN":"ΕΛ"}
      </button>
      <div style={{width:"100%",maxWidth:380,padding:"0 20px"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:52,marginBottom:10}}>⚓</div>
          <h1 style={{color:"#f1f5f9",fontSize:26,fontWeight:700,margin:"0 0 4px"}}>{t.appName}</h1>
          <p style={{color:"rgba(255,255,255,0.35)",fontSize:13,margin:0}}>{t.appSub}</p>
        </div>
        <div style={{background:"rgba(255,255,255,0.05)",backdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:20,padding:"26px 22px"}}>
          <div style={{display:"flex",gap:4,marginBottom:20,background:"rgba(0,0,0,0.2)",borderRadius:10,padding:4}}>
            {["login","register"].map(m=>(
              <button key={m} style={{flex:1,padding:"8px 0",border:"none",borderRadius:7,cursor:"pointer",background:authMode===m?"rgba(29,78,216,0.8)":"transparent",color:authMode===m?"#fff":"rgba(255,255,255,0.4)",fontSize:14,fontWeight:500}}
                onClick={()=>{setAuthMode(m);setAuthErr("");}}>
                {m==="login"?t.login:t.register}
              </button>
            ))}
          </div>
          <form onSubmit={handleAuth} style={{display:"flex",flexDirection:"column",gap:12}}>
            {authMode==="register" && <input style={S.inp} placeholder={t.fullName} value={authForm.name} onChange={e=>setAuthForm({...authForm,name:e.target.value})} required />}
            <input style={S.inp} type="email" placeholder={t.email} value={authForm.email} onChange={e=>setAuthForm({...authForm,email:e.target.value})} required />
            <input style={S.inp} type="password" placeholder={t.password} value={authForm.password} onChange={e=>setAuthForm({...authForm,password:e.target.value})} required minLength={6} />
            {authErr && <p style={{color:"#fca5a5",fontSize:13,margin:0,textAlign:"center"}}>{authErr}</p>}
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
      <aside style={S.sidebar}>
        <div style={{padding:"18px 14px 14px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:22}}>⚓</span>
            <span style={{color:"#f1f5f9",fontWeight:700,fontSize:15}}>Marina Manager</span>
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
            <button key={id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",border:"none",borderRadius:10,cursor:"pointer",textAlign:"left",fontSize:14,fontWeight:500,background:view===id?"rgba(29,78,216,0.25)":"transparent",color:view===id?"#60a5fa":"rgba(255,255,255,0.5)"}}
              onClick={()=>setView(id)}>
              <span>{ic}</span>{lb}
              {id==="movements"&&activeMovements.length>0&&<span style={{marginLeft:"auto",background:"#0ea5e9",color:"#fff",fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:10}}>{activeMovements.length}</span>}
              {id==="list"&&stats.urgent>0&&<span style={{marginLeft:"auto",background:"#dc2626",color:"#fff",fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:10}}>{stats.urgent}</span>}
            </button>
          ))}
        </nav>
        <div style={{padding:"10px 8px",borderTop:"1px solid rgba(255,255,255,0.06)"}}>
          <div style={{padding:"8px 10px",background:"rgba(255,255,255,0.04)",borderRadius:10,marginBottom:8}}>
            <div style={{color:"rgba(255,255,255,0.6)",fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{session.user?.email}</div>
            <div style={{color:"rgba(255,255,255,0.3)",fontSize:10,marginTop:2}}>{isAdmin?"👑 Admin":"👤 "+t.employee}</div>
          </div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={toggleLang} style={{flex:1,padding:"7px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,color:"rgba(255,255,255,0.5)",cursor:"pointer",fontSize:12,fontWeight:600}}>
              {lang==="el"?"EN":"ΕΛ"}
            </button>
            <button onClick={handleLogout} style={{flex:2,padding:"7px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,color:"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:12}}>
              {t.logout}
            </button>
          </div>
        </div>
      </aside>

      <main style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:"#060d18"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 20px",borderBottom:"1px solid rgba(255,255,255,0.06)",background:"rgba(255,255,255,0.02)",flexShrink:0,gap:12,flexWrap:"wrap"}}>
          <h2 style={{margin:0,fontSize:16,fontWeight:600,color:"#f1f5f9"}}>
            {view==="dashboard"?`📊 ${t.dashboard}`:view==="movements"?`🌊 ${t.movements}`:view==="map"?`🗺️ ${t.map}`:view==="list"?`📋 ${t.vessels}`:view==="history"?`📜 ${t.history}`:`👥 ${t.users}`}
          </h2>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            {view==="list"&&<input style={{...S.inp,width:180,padding:"7px 12px"}} placeholder={t.search} value={search} onChange={e=>setSearch(e.target.value)} />}
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
              <div style={{display:"flex",alignItems:"center",gap:4,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"5px 10px"}}>
                <button style={S.zoomBtn} onClick={zoomOut}>−</button>
                <span style={{color:"rgba(255,255,255,0.4)",fontSize:12,minWidth:36,textAlign:"center"}}>{Math.round(zoom*100)}%</span>
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
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12,marginBottom:24}}>
              {[[t.totalVessels,"⚓",stats.total],[t.activeVessels,"🟢",stats.active],[t.tempVessels,"🟡",stats.temp],[t.outVessels,"🔴",stats.out],[t.inWaterStat,"🌊",stats.inWater],[t.urgentStat,"🚨",stats.urgent]].map(([lb,ic,val])=>(
                <div key={lb} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"16px 14px"}}>
                  <div style={{fontSize:22,marginBottom:8}}>{ic}</div>
                  <div style={{fontSize:26,fontWeight:700,color:"#f1f5f9"}}>{val}</div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,0.35)",marginTop:4}}>{lb}</div>
                </div>
              ))}
            </div>
            <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:20,marginBottom:20}}>
              <h3 style={{margin:"0 0 16px",color:"rgba(255,255,255,0.5)",fontSize:12,fontWeight:500,textTransform:"uppercase",letterSpacing:0.5}}>{t.monthlyActivity}</h3>
              <div style={{display:"flex",alignItems:"flex-end",gap:10,height:100}}>
                {monthlyData.map((d,i)=>(
                  <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                    <span style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>{d.count}</span>
                    <div style={{width:"100%",background:"#1d4ed8",borderRadius:"4px 4px 0 0",height:`${Math.max(4,(d.count/maxMonthly)*80)}px`}}/>
                    <span style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
            {stats.urgent>0&&(
              <div style={{background:"rgba(220,38,38,0.08)",border:"1px solid rgba(220,38,38,0.2)",borderRadius:14,padding:20}}>
                <h3 style={{margin:"0 0 12px",color:"#fca5a5",fontSize:12,fontWeight:500,textTransform:"uppercase"}}>🚨 {t.needsAttention}</h3>
                {vessels.filter(v=>v.urgent).map(v=>(
                  <div key={v.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                    <div>
                      <strong style={{color:"#f1f5f9"}}>{v.name}</strong>
                      {v.berth_number&&<span style={{color:"rgba(255,255,255,0.3)",fontSize:12,marginLeft:8}}>{v.berth_number}</span>}
                      {v.notes&&<p style={{color:"rgba(255,255,255,0.4)",fontSize:12,margin:"2px 0 0"}}>{v.notes}</p>}
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
          <div style={{flex:1,overflow:"auto",padding:20}}>
            <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,marginBottom:16,overflow:"hidden"}}>
              <div style={{padding:"13px 16px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",gap:10}}>
                <h3 style={{margin:0,color:"#f1f5f9",fontSize:14,fontWeight:500}}>{t.inWaterNow}</h3>
                {activeMovements.length>0&&<span style={{background:"#0ea5e9",color:"#fff",fontSize:11,padding:"2px 8px",borderRadius:10,fontWeight:600}}>{activeMovements.length}</span>}
              </div>
              {activeMovements.length===0?(
                <div style={{padding:"30px",textAlign:"center",color:"rgba(255,255,255,0.25)"}}>
                  <div style={{fontSize:34,marginBottom:8}}>⚓</div>
                  <p style={{margin:0,fontSize:14}}>{t.noMovements}</p>
                </div>
              ):(
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
                  <thead><tr>{[t.vesselName,t.owner,t.outTime,t.expectedReturn,""].map(h=>(
                    <th key={h} style={{textAlign:"left",padding:"9px 14px",color:"rgba(255,255,255,0.3)",fontSize:11,fontWeight:500,borderBottom:"1px solid rgba(255,255,255,0.06)",textTransform:"uppercase"}}>{h}</th>
                  ))}</tr></thead>
                  <tbody>
                    {activeMovements.map(m=>(
                      <tr key={m.id} style={{borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                        <td style={S.td}><strong style={{color:"#f1f5f9"}}>🚤 {m.vessel_name}</strong></td>
                        <td style={S.td}>{m.owner||"—"}</td>
                        <td style={{...S.td,color:"#60a5fa",fontWeight:500}}>{fmtTime(m.out_time||m.created_at)}</td>
                        <td style={S.td}>{m.expected_return||"—"}</td>
                        <td style={S.td}>
                          <button style={{padding:"6px 12px",background:"rgba(6,78,59,0.5)",color:"#6ee7b7",border:"1px solid rgba(6,95,70,0.4)",borderRadius:8,cursor:"pointer",fontSize:12}}
                            onClick={()=>markReturned(m.id)}>{t.markReturned}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {returnedMovements.length>0&&(
              <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,overflow:"hidden"}}>
                <div style={{padding:"11px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}><h3 style={{margin:0,color:"rgba(255,255,255,0.35)",fontSize:13,fontWeight:400}}>✅ {t.returnedToday} ({returnedMovements.length})</h3></div>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead><tr>{[t.vesselName,t.owner,t.vesselOut,t.returnedAt].map(h=>(
                    <th key={h} style={{textAlign:"left",padding:"8px 14px",color:"rgba(255,255,255,0.25)",fontSize:11,fontWeight:500,borderBottom:"1px solid rgba(255,255,255,0.05)",textTransform:"uppercase"}}>{h}</th>
                  ))}</tr></thead>
                  <tbody>
                    {returnedMovements.map(m=>(
                      <tr key={m.id} style={{borderBottom:"1px solid rgba(255,255,255,0.03)",opacity:0.5}}>
                        <td style={S.td}>{m.vessel_name}</td>
                        <td style={S.td}>{m.owner||"—"}</td>
                        <td style={S.td}>{fmtTime(m.out_time||m.created_at)}</td>
                        <td style={{...S.td,color:"#6ee7b7"}}>{fmtTime(m.returned_time)}</td>
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
            <div ref={mapRef} style={{flex:1,position:"relative",overflow:"hidden",cursor:"crosshair",background:"#040a14"}}
              onDragOver={e=>e.preventDefault()} onDrop={onDrop} onWheel={handleWheel}>
              <div style={{position:"absolute",inset:0,transform:`scale(${zoom})`,transformOrigin:"center center",backgroundImage:bgImage?`url(${bgImage})`:"none",backgroundSize:"contain",backgroundPosition:"center",backgroundRepeat:"no-repeat"}}>
                {!bgImage&&(
                  <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.2)"}}>
                    <div style={{fontSize:46,marginBottom:12}}>🏖️</div>
                    <p style={{margin:"0 0 16px",fontSize:14}}>{t.noMap}</p>
                    <button style={S.btnP} onClick={()=>bgRef.current.click()}>{t.uploadMap}</button>
                  </div>
                )}
                {filteredVessels.map(v=>(
                  <div key={v.id} draggable onDragStart={e=>onDragStart(e,v)} onClick={()=>setModal({type:"vessel",vessel:v})}
                    style={{position:"absolute",left:`${v.pos_x}%`,top:`${v.pos_y}%`,transform:"translate(-50%,-50%)",cursor:"grab",userSelect:"none",display:"flex",flexDirection:"column",alignItems:"center",zIndex:10,opacity:dragging===v.id?0.2:1}}>
                    <div style={{fontSize:24,filter:"drop-shadow(0 2px 8px rgba(0,0,0,.95))"}}>{v.urgent?"🚨":"🚤"}</div>
                    <div style={{background:v.status==="out"?"rgba(127,29,29,.95)":v.status==="temp"?"rgba(120,53,15,.95)":"rgba(4,10,20,.92)",color:"#f1f5f9",fontSize:10,fontWeight:600,padding:"2px 7px",borderRadius:4,marginTop:2,whiteSpace:"nowrap",border:"1px solid rgba(255,255,255,0.12)",maxWidth:110,overflow:"hidden",textOverflow:"ellipsis"}}>
                      {v.berth_number?`[${v.berth_number}] `:""}{v.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{padding:"7px 16px",background:"rgba(255,255,255,0.02)",borderTop:"1px solid rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.3)",fontSize:12,flexShrink:0,display:"flex",justifyContent:"space-between"}}>
              <span>{t.dragHint} · {filteredVessels.length}</span>
              {activeMovements.length>0&&<span style={{color:"#38bdf8"}}>🌊 {activeMovements.length}</span>}
            </div>
          </div>
        )}

        {/* LIST */}
        {view==="list"&&(
          <div style={{flex:1,overflow:"auto",padding:20}}>
            {filteredVessels.length===0?(
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:250,gap:12,color:"rgba(255,255,255,0.25)"}}>
                <div style={{fontSize:46}}>⛵</div>
                <p>{search||filter!=="all"?t.noResults:t.noVessels}</p>
                {!search&&filter==="all"&&<button style={S.btnP} onClick={()=>setModal({type:"vessel",vessel:null})}>{t.newVessel}</button>}
              </div>
            ):(
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:14,minWidth:680}}>
                  <thead><tr>{["",t.vesselName,t.berthNumber,t.status,t.trailerPlate,t.owner,t.entryDate,t.exitDate,""].map(h=>(
                    <th key={h} style={{textAlign:"left",padding:"9px 13px",color:"rgba(255,255,255,0.3)",fontSize:11,fontWeight:500,borderBottom:"1px solid rgba(255,255,255,0.06)",textTransform:"uppercase"}}>{h}</th>
                  ))}</tr></thead>
                  <tbody>
                    {filteredVessels.map(v=>(
                      <tr key={v.id} style={{borderBottom:"1px solid rgba(255,255,255,0.04)",background:v.urgent?"rgba(220,38,38,0.04)":"transparent"}}>
                        <td style={{...S.td,fontSize:16}}>{v.urgent?"🚨":"🚤"}</td>
                        <td style={S.td}><strong style={{color:"#f1f5f9"}}>{v.name}</strong></td>
                        <td style={S.td}>{v.berth_number?<span style={{background:"rgba(29,78,216,0.2)",color:"#93c5fd",padding:"2px 8px",borderRadius:6,fontSize:12}}>{v.berth_number}</span>:"—"}</td>
                        <td style={S.td}><span style={{fontSize:13}}>{v.status==="active"?"🟢":v.status==="temp"?"🟡":"🔴"} {t[v.status]||""}</span></td>
                        <td style={S.td}>{v.trailer_plate||"—"}</td>
                        <td style={S.td}>{v.owner||"—"}</td>
                        <td style={{...S.td,fontSize:12,color:"rgba(255,255,255,0.4)"}}>{fmtDate(v.entry_date)}</td>
                        <td style={{...S.td,fontSize:12,color:v.exit_date&&new Date(v.exit_date)<new Date()?"#fca5a5":"rgba(255,255,255,0.4)"}}>{fmtDate(v.exit_date)}</td>
                        <td style={S.td}><button style={{padding:"5px 11px",background:"rgba(29,78,216,0.15)",color:"#93c5fd",border:"1px solid rgba(29,78,216,0.3)",borderRadius:7,cursor:"pointer",fontSize:12}} onClick={()=>setModal({type:"vessel",vessel:v})}>✏️</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* HISTORY */}
        {view==="history"&&(
          <div style={{flex:1,overflow:"auto",padding:20}}>
            {history.length===0?(
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:250,gap:12,color:"rgba(255,255,255,0.25)"}}>
                <div style={{fontSize:46}}>📜</div><p>{t.noHistory}</p>
              </div>
            ):(
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
                <thead><tr>{["Date/Time",t.vesselName,"Action","User"].map(h=>(
                  <th key={h} style={{textAlign:"left",padding:"9px 13px",color:"rgba(255,255,255,0.3)",fontSize:11,fontWeight:500,borderBottom:"1px solid rgba(255,255,255,0.06)",textTransform:"uppercase"}}>{h}</th>
                ))}</tr></thead>
                <tbody>
                  {history.map(h=>(
                    <tr key={h.id} style={{borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                      <td style={{...S.td,whiteSpace:"nowrap",fontSize:12,color:"rgba(255,255,255,0.4)"}}>{fmt(h.created_at)}</td>
                      <td style={S.td}><strong style={{color:"#f1f5f9"}}>{h.vessel_name||"—"}</strong></td>
                      <td style={S.td}><span style={{padding:"3px 10px",borderRadius:20,fontSize:12,color:"#bfdbfe",background:h.action.includes("Μετακίν")?"rgba(15,76,117,0.5)":h.action.includes("Προσθήκη")?"rgba(6,78,59,0.5)":h.action.includes("Διαγρ")?"rgba(127,29,29,0.5)":"rgba(30,58,95,0.5)"}}>{h.action}</span></td>
                      <td style={{...S.td,color:"rgba(255,255,255,0.3)",fontSize:12}}>{h.user_email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* USERS */}
        {view==="users"&&isAdmin&&(
          <div style={{flex:1,overflow:"auto",padding:20}}>
            <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,overflow:"hidden"}}>
              <div style={{padding:"13px 16px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}><h3 style={{margin:0,color:"#f1f5f9",fontSize:14,fontWeight:500}}>👥 {t.accounts}</h3></div>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
                <thead><tr>{["ID","Role",""].map(h=>(
                  <th key={h} style={{textAlign:"left",padding:"9px 16px",color:"rgba(255,255,255,0.3)",fontSize:11,fontWeight:500,borderBottom:"1px solid rgba(255,255,255,0.06)",textTransform:"uppercase"}}>{h}</th>
                ))}</tr></thead>
                <tbody>
                  {users.map(u=>(
                    <tr key={u.user_id} style={{borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                      <td style={{...S.td,fontSize:11,color:"rgba(255,255,255,0.3)",fontFamily:"monospace"}}>{u.user_id?.slice(0,16)}...</td>
                      <td style={S.td}><span style={{padding:"3px 10px",borderRadius:20,fontSize:12,background:u.role==="admin"?"rgba(29,78,216,0.2)":"rgba(255,255,255,0.05)",color:u.role==="admin"?"#93c5fd":"rgba(255,255,255,0.4)"}}>{u.role==="admin"?`👑 ${t.admin}`:`👤 ${t.employee}`}</span></td>
                      <td style={S.td}>{u.user_id!==session?.user?.id?<button style={{padding:"5px 11px",background:"rgba(29,78,216,0.15)",color:"#93c5fd",border:"1px solid rgba(29,78,216,0.3)",borderRadius:7,cursor:"pointer",fontSize:12}} onClick={()=>updateUserRole(u.user_id,u.role==="admin"?"employee":"admin")}>→ {u.role==="admin"?t.employee:t.admin}</button>:<span style={{color:"rgba(255,255,255,0.25)",fontSize:12}}>{t.you}</span>}</td>
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
        <div style={{position:"fixed",bottom:22,right:22,padding:"11px 20px",borderRadius:12,color:"#f1f5f9",fontSize:14,fontWeight:500,zIndex:999,boxShadow:"0 8px 32px rgba(0,0,0,.6)",background:toast.type==="error"?"rgba(127,29,29,0.95)":toast.type==="info"?"rgba(30,58,138,0.95)":"rgba(6,78,59,0.95)",border:"1px solid rgba(255,255,255,0.1)"}}>
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
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#0a1020",border:"1px solid rgba(255,255,255,0.1)",borderRadius:18,width:"100%",maxWidth:400,boxShadow:"0 25px 60px rgba(0,0,0,.7)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
          <h3 style={{margin:0,fontSize:16,fontWeight:600,color:"#f1f5f9"}}>🌊 {t.inWater}</h3>
          <button style={{background:"none",border:"none",color:"rgba(255,255,255,0.3)",fontSize:20,cursor:"pointer"}} onClick={onClose}>✕</button>
        </div>
        <div style={{padding:"16px 20px",display:"flex",flexDirection:"column",gap:13}}>
          <div><label style={S.lbl}>{t.vesselName}</label>
            <select style={S.inp} value={form.vessel_id} onChange={e=>set("vessel_id",e.target.value)}>
              <option value="">{t.selectVessel}</option>
              {vessels.map(v=><option key={v.id} value={v.id}>{v.name}{v.berth_number?` [${v.berth_number}]`:""}</option>)}
            </select>
          </div>
          <div><label style={S.lbl}>{t.expectedReturn}</label><input style={S.inp} placeholder={t.returnPlaceholder} value={form.expected_return} onChange={e=>set("expected_return",e.target.value)} /></div>
          <div><label style={S.lbl}>{t.notes}</label><textarea style={{...S.inp,height:54,resize:"vertical"}} value={form.notes} onChange={e=>set("notes",e.target.value)} /></div>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:8,padding:"13px 20px",borderTop:"1px solid rgba(255,255,255,0.07)"}}>
          <button style={S.btnS} onClick={onClose}>{t.cancel}</button>
          <button style={{...S.btnP,opacity:!form.vessel_id||loading?0.4:1}} disabled={!form.vessel_id||loading} onClick={()=>{onSave(form);onClose();}}>{loading?"...":t.submit}</button>
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
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#0a1020",border:"1px solid rgba(255,255,255,0.1)",borderRadius:18,width:"100%",maxWidth:510,boxShadow:"0 25px 60px rgba(0,0,0,.7)",maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:"1px solid rgba(255,255,255,0.07)",position:"sticky",top:0,background:"#0a1020",zIndex:1}}>
          <h3 style={{margin:0,fontSize:16,fontWeight:600,color:"#f1f5f9"}}>{vessel?`✏️ ${t.editVessel}`:`🚤 ${t.addVessel}`}</h3>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={()=>set("urgent",!form.urgent)} style={{padding:"5px 11px",borderRadius:8,cursor:"pointer",fontSize:12,background:form.urgent?"rgba(220,38,38,0.3)":"rgba(255,255,255,0.05)",color:form.urgent?"#fca5a5":"rgba(255,255,255,0.4)",border:`1px solid ${form.urgent?"rgba(220,38,38,0.4)":"rgba(255,255,255,0.1)"}`}}>
              🚨 {form.urgent?t.urgent:t.normal}
            </button>
            <button style={{background:"none",border:"none",color:"rgba(255,255,255,0.3)",fontSize:20,cursor:"pointer"}} onClick={onClose}>✕</button>
          </div>
        </div>
        <div style={{padding:"16px 20px",display:"flex",flexDirection:"column",gap:13}}>
          <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
            <div style={{width:72,height:72,borderRadius:12,overflow:"hidden",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",flexShrink:0,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>photoRef.current.click()}>
              {form.photo?<img src={form.photo} style={{width:"100%",height:"100%",objectFit:"cover"}} />:<span style={{fontSize:24}}>📷</span>}
            </div>
            <input ref={photoRef} type="file" accept="image/*" style={{display:"none"}} onChange={handlePhoto} />
            <div style={{flex:1}}><label style={S.lbl}>{t.vesselName} *</label><input style={S.inp} value={form.name} onChange={e=>set("name",e.target.value)} /></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {[["trailer_plate",t.trailerPlate],["registry",t.registry],["owner",t.owner],["berth_number",t.berthNumber]].map(([k,lb])=>(
              <div key={k}><label style={S.lbl}>{lb}</label><input style={S.inp} value={form[k]} onChange={e=>set(k,e.target.value)} /></div>
            ))}
          </div>
          <div><label style={S.lbl}>{t.status}</label>
            <div style={{display:"flex",gap:8}}>
              {[["active",`🟢 ${t.active}`],["temp",`🟡 ${t.temp}`],["out",`🔴 ${t.out}`]].map(([val,lb])=>(
                <button key={val} onClick={()=>set("status",val)} style={{flex:1,padding:"8px 6px",borderRadius:8,cursor:"pointer",fontSize:12,background:form.status===val?"rgba(29,78,216,0.3)":"rgba(255,255,255,0.04)",color:form.status===val?"#93c5fd":"rgba(255,255,255,0.4)",border:`1px solid ${form.status===val?"rgba(29,78,216,0.4)":"rgba(255,255,255,0.08)"}`}}>{lb}</button>
              ))}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><label style={S.lbl}>{t.entryDate}</label><input style={S.inp} type="date" value={form.entry_date||""} onChange={e=>set("entry_date",e.target.value)} /></div>
            <div><label style={S.lbl}>{t.exitDate}</label><input style={S.inp} type="date" value={form.exit_date||""} onChange={e=>set("exit_date",e.target.value)} /></div>
          </div>
          <div><label style={S.lbl}>{t.notes}</label><textarea style={{...S.inp,height:62,resize:"vertical"}} value={form.notes} onChange={e=>set("notes",e.target.value)} /></div>
        </div>
        <div style={{display:"flex",alignItems:"center",padding:"13px 20px",borderTop:"1px solid rgba(255,255,255,0.07)",gap:8,flexWrap:"wrap",position:"sticky",bottom:0,background:"#0a1020"}}>
          {vessel&&isAdmin&&!confirmDel&&<button style={{padding:"8px 13px",background:"rgba(127,29,29,0.3)",color:"#fca5a5",border:"1px solid rgba(153,27,27,0.4)",borderRadius:8,cursor:"pointer",fontSize:13}} onClick={()=>setConfirmDel(true)}>🗑 {t.delete}</button>}
          {confirmDel&&<div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{color:"#fca5a5",fontSize:13}}>{t.confirm}</span><button style={{padding:"7px 11px",background:"rgba(127,29,29,0.4)",color:"#fca5a5",border:"1px solid rgba(153,27,27,0.4)",borderRadius:7,cursor:"pointer",fontSize:13}} onClick={()=>onDelete(vessel.id,vessel.name)}>{t.yes}</button><button style={S.btnS} onClick={()=>setConfirmDel(false)}>{t.cancel}</button></div>}
          <div style={{marginLeft:"auto",display:"flex",gap:8}}>
            <button style={S.btnS} onClick={onClose}>{t.cancel}</button>
            <button style={{...S.btnP,opacity:!form.name||loading?0.4:1}} disabled={!form.name||loading} onClick={()=>onSave(form)}>{loading?"...":vessel?t.save:t.addVessel}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  bg:      { minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",
             background:"radial-gradient(ellipse at top,#0f1f3d 0%,#060d18 60%)",
             fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
  inp:     { width:"100%",padding:"10px 13px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",
             borderRadius:10,color:"#f1f5f9",fontSize:14,boxSizing:"border-box",outline:"none",fontFamily:"inherit" },
  lbl:     { color:"rgba(255,255,255,0.4)",fontSize:12,fontWeight:500,display:"block",marginBottom:5 },
  btnP:    { padding:"10px 18px",background:"#1d4ed8",color:"#fff",border:"none",borderRadius:10,
             cursor:"pointer",fontSize:14,fontWeight:500,whiteSpace:"nowrap" },
  btnS:    { padding:"10px 15px",background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.5)",
             border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,cursor:"pointer",fontSize:14,whiteSpace:"nowrap" },
  app:     { display:"flex",height:"100vh",background:"#060d18",
             fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",color:"#f1f5f9",overflow:"hidden" },
  sidebar: { width:215,background:"rgba(255,255,255,0.02)",borderRight:"1px solid rgba(255,255,255,0.06)",
             display:"flex",flexDirection:"column",flexShrink:0 },
  td:      { padding:"10px 13px",color:"rgba(255,255,255,0.6)",fontSize:14 },
  zoomBtn: { padding:"2px 8px",background:"transparent",border:"none",color:"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:18,fontWeight:300,lineHeight:1,borderRadius:4 },
};

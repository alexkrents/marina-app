import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://gnuhjlgqqzbkupqwajkf.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdudWhqbGdxcXpia3VwcXdhamtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMDE5ODIsImV4cCI6MjA4OTU3Nzk4Mn0.8Uv8UxTp-qncqH_7DJFaZqCZbETgJYqpfZ5lHdvrhP0"
);

const fmt     = (d) => d ? new Date(d).toLocaleString("el-GR") : "—";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("el-GR") : "—";
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString("el-GR", {hour:"2-digit",minute:"2-digit"}) : "—";
const STATUS  = { active:"🟢 Ενεργό", temp:"🟡 Προσωρινά", out:"🔴 Εκτός" };
const today   = () => new Date().toISOString().slice(0,10);

export default function App() {
  const [session,    setSession]    = useState(null);
  const [userRole,   setUserRole]   = useState("employee");
  const [authMode,   setAuthMode]   = useState("login");
  const [authForm,   setAuthForm]   = useState({ email:"", password:"", name:"" });
  const [authErr,    setAuthErr]    = useState("");
  const [loading,    setLoading]    = useState(false);
  const [vessels,    setVessels]    = useState([]);
  const [history,    setHistory]    = useState([]);
  const [movements,  setMovements]  = useState([]);
  const [users,      setUsers]      = useState([]);
  const [bgImage,    setBgImage]    = useState(null);
  const [view,       setView]       = useState("map");
  const [modal,      setModal]      = useState(null);
  const [dragging,   setDragging]   = useState(null);
  const [toast,      setToast]      = useState(null);
  const [zoom,       setZoom]       = useState(1);
  const [search,     setSearch]     = useState("");
  const [filter,     setFilter]     = useState("all");
  const mapRef  = useRef(null);
  const bgRef   = useRef(null);
  const dragOff = useRef({ x:0, y:0 });

  const isAdmin = userRole === "admin";

  const showToast = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  function handleWheel(e) { e.preventDefault(); setZoom(z => Math.min(4, Math.max(0.3, z - e.deltaY*0.001))); }
  function zoomIn()    { setZoom(z => Math.min(4,   +(z+0.2).toFixed(1))); }
  function zoomOut()   { setZoom(z => Math.max(0.3, +(z-0.2).toFixed(1))); }
  function zoomReset() { setZoom(1); }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) { loadAll(data.session); loadUserRole(data.session.user.id); }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, sess) => {
      setSession(sess);
      if (sess) { loadAll(sess); loadUserRole(sess.user.id); }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadUserRole(uid) {
    const { data } = await supabase.from("marina_users").select("role").eq("user_id", uid).single();
    if (data) setUserRole(data.role);
    else { await supabase.from("marina_users").insert([{ user_id:uid, role:"employee" }]); setUserRole("employee"); }
  }

  async function loadAll(sess) {
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const [{ data:v }, { data:h }, { data:st }, { data:u }, { data:m }] = await Promise.all([
      supabase.from("vessels").select("*").order("created_at", { ascending:true }),
      supabase.from("vessel_history").select("*").order("created_at", { ascending:false }).limit(300),
      supabase.from("marina_settings").select("*"),
      supabase.from("marina_users").select("*"),
      supabase.from("daily_movements").select("*").gte("created_at", todayStart.toISOString()).order("created_at", { ascending:false }),
    ]);
    if (v)  setVessels(v);
    if (h)  setHistory(h);
    if (u)  setUsers(u);
    if (m)  setMovements(m);
    if (st) { const bg = st.find(r => r.key==="bg_image"); if (bg) setBgImage(bg.value); }
  }

  async function handleAuth(e) {
    e.preventDefault(); setAuthErr(""); setLoading(true);
    if (authMode==="login") {
      const { error } = await supabase.auth.signInWithPassword({ email:authForm.email, password:authForm.password });
      if (error) setAuthErr(error.message);
    } else {
      const { error } = await supabase.auth.signUp({
        email:authForm.email, password:authForm.password,
        options: { data: { full_name:authForm.name } },
      });
      if (error) setAuthErr(error.message);
      else { showToast("Λογαριασμός δημιουργήθηκε! Συνδεθείτε.", "info"); setAuthMode("login"); }
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
      before_data: before ? JSON.stringify(before) : null,
      after_data:  after  ? JSON.stringify(after)  : null,
      user_email:  session?.user?.email||"unknown",
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
      const { data } = await supabase.from("vessels").insert([payload]).select().single();
      await logHistory(data?.id, "Προσθήκη σκάφους", null, payload, form.name);
      showToast("Σκάφος προστέθηκε!");
    } else {
      const old = vessels.find(v => v.id===form.id);
      await supabase.from("vessels").update(payload).eq("id", form.id);
      await logHistory(form.id, "Επεξεργασία στοιχείων", old, payload, form.name);
      showToast("Στοιχεία ενημερώθηκαν!");
    }
    await loadAll(session); setModal(null); setLoading(false);
  }

  async function deleteVessel(id, name) {
    await supabase.from("vessel_history").delete().eq("vessel_id", id);
    await supabase.from("vessels").delete().eq("id", id);
    showToast(`Σκάφος "${name}" διαγράφηκε`);
    await loadAll(session); setModal(null);
  }

  async function updateUserRole(userId, role) {
    await supabase.from("marina_users").update({ role }).eq("user_id", userId);
    await loadAll(session); showToast("Ρόλος ενημερώθηκε!");
  }

  function onDragStart(e, vessel) {
    setDragging(vessel.id);
    const r = e.currentTarget.getBoundingClientRect();
    dragOff.current = { x:e.clientX-r.left, y:e.clientY-r.top };
    e.dataTransfer.effectAllowed = "move";
  }

  async function onDrop(e) {
    e.preventDefault(); if (!dragging) return;
    const r = mapRef.current.getBoundingClientRect();
    const px = Math.max(0, Math.min(94, ((e.clientX-r.left-dragOff.current.x)/r.width)*100));
    const py = Math.max(0, Math.min(94, ((e.clientY-r.top-dragOff.current.y)/r.height)*100));
    const vessel = vessels.find(v => v.id===dragging);
    await supabase.from("vessels").update({ pos_x:px, pos_y:py }).eq("id", dragging);
    await logHistory(dragging, "Μετακίνηση σκάφους", { pos_x:vessel.pos_x,pos_y:vessel.pos_y }, { pos_x:px,pos_y:py }, vessel.name);
    setDragging(null); await loadAll(session);
  }

  async function handleBgUpload(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      await supabase.from("marina_settings").upsert([{ key:"bg_image", value:dataUrl }], { onConflict:"key" });
      setBgImage(dataUrl);
      await logHistory(null, "Αλλαγή κάτοψης", null, { file:file.name }, "—");
      showToast("Κάτοψη ανέβηκε!");
    };
    reader.readAsDataURL(file);
  }

  // Daily movements
  async function addMovement(form) {
    const vessel = vessels.find(v => v.id===form.vessel_id);
    await supabase.from("daily_movements").insert([{
      vessel_id:form.vessel_id,
      vessel_name: vessel?.name||form.vessel_name||"",
      owner: vessel?.owner||"",
      expected_return: form.expected_return||"",
      notes: form.notes||"",
      user_email: session?.user?.email||"unknown",
    }]);
    showToast("Κίνηση καταχωρήθηκε!");
    await loadAll(session);
  }

  async function markReturned(id) {
    await supabase.from("daily_movements").update({ returned:true, returned_time:new Date().toISOString() }).eq("id", id);
    showToast("Σκάφος επέστρεψε!");
    await loadAll(session);
  }

  function exportCSV(rows, cols, filename) {
    const csv = [cols,...rows].map(r => r.map(c => `"${(c||"").toString().replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\uFEFF"+csv], { type:"text/csv;charset=utf-8;" }));
    a.download = filename; a.click();
  }

  const filteredVessels = vessels.filter(v => {
    const q = search.toLowerCase();
    const matchSearch = !q || v.name?.toLowerCase().includes(q) || v.owner?.toLowerCase().includes(q) || v.trailer_plate?.toLowerCase().includes(q) || v.berth_number?.toLowerCase().includes(q);
    const matchFilter = filter==="all" || v.status===filter || (filter==="urgent" && v.urgent);
    return matchSearch && matchFilter;
  });

  const activeMovements  = movements.filter(m => !m.returned);
  const returnedMovements = movements.filter(m => m.returned);

  const stats = {
    total:     vessels.length,
    active:    vessels.filter(v=>v.status==="active").length,
    temp:      vessels.filter(v=>v.status==="temp").length,
    out:       vessels.filter(v=>v.status==="out").length,
    urgent:    vessels.filter(v=>v.urgent).length,
    inWater:   activeMovements.length,
    thisMonth: history.filter(h => new Date(h.created_at).getMonth()===new Date().getMonth()).length,
  };

  const monthlyData = Array.from({length:6}, (_,i) => {
    const d = new Date(); d.setMonth(d.getMonth()-5+i);
    const m = d.getMonth(); const y = d.getFullYear();
    return {
      label: d.toLocaleDateString("el-GR",{month:"short"}),
      count: history.filter(h => { const hd=new Date(h.created_at); return hd.getMonth()===m && hd.getFullYear()===y; }).length,
    };
  });
  const maxMonthly = Math.max(...monthlyData.map(d=>d.count), 1);

  // ── LOGIN ──────────────────────────────────────────────────────────────
  if (!session) return (
    <div style={S.bg}>
      <div style={S.card}>
        <div style={{fontSize:52,textAlign:"center",marginBottom:8}}>⚓</div>
        <h1 style={{color:"#f1f5f9",fontSize:24,fontWeight:700,textAlign:"center",margin:"0 0 4px"}}>Marina Manager</h1>
        <p style={{color:"#64748b",fontSize:13,textAlign:"center",marginBottom:24}}>Σύστημα Διαχείρισης Σκαφών</p>
        <div style={{display:"flex",gap:4,marginBottom:18,background:"#0f172a",borderRadius:8,padding:4}}>
          {["login","register"].map(m => (
            <button key={m} style={{flex:1,padding:"8px 0",border:"none",borderRadius:6,cursor:"pointer",
              background:authMode===m?"#1d4ed8":"transparent",color:authMode===m?"#fff":"#64748b",fontSize:14,fontWeight:600}}
              onClick={() => { setAuthMode(m); setAuthErr(""); }}>
              {m==="login"?"Σύνδεση":"Εγγραφή"}
            </button>
          ))}
        </div>
        <form onSubmit={handleAuth} style={{display:"flex",flexDirection:"column",gap:12}}>
          {authMode==="register" && <input style={S.inp} placeholder="Πλήρες Όνομα" value={authForm.name} onChange={e=>setAuthForm({...authForm,name:e.target.value})} required />}
          <input style={S.inp} type="email" placeholder="Email" value={authForm.email} onChange={e=>setAuthForm({...authForm,email:e.target.value})} required />
          <input style={S.inp} type="password" placeholder="Κωδικός (min 6 χαρ.)" value={authForm.password} onChange={e=>setAuthForm({...authForm,password:e.target.value})} required minLength={6} />
          {authErr && <p style={{color:"#fca5a5",fontSize:13,margin:0}}>{authErr}</p>}
          <button style={S.btnP} type="submit" disabled={loading}>{loading?"Παρακαλώ περιμένετε...":authMode==="login"?"Σύνδεση":"Δημιουργία Λογαριασμού"}</button>
        </form>
      </div>
    </div>
  );

  // ── MAIN ────────────────────────────────────────────────────────────────
  return (
    <div style={S.app}>
      {/* SIDEBAR */}
      <aside style={S.sidebar}>
        <div style={{display:"flex",alignItems:"center",gap:12,padding:"20px 16px 16px",borderBottom:"1px solid #334155"}}>
          <span style={{fontSize:28}}>⚓</span>
          <div>
            <div style={{color:"#f1f5f9",fontWeight:700,fontSize:16}}>Marina</div>
            <div style={{color:"#38bdf8",fontSize:10,fontWeight:700,letterSpacing:2}}>MANAGER</div>
          </div>
        </div>
        <nav style={{flex:1,padding:"12px 8px",display:"flex",flexDirection:"column",gap:3}}>
          {[
            ["dashboard","📊","Dashboard"],
            ["movements","🌊","Κινήσεις Ημέρας"],
            ["map","🗺️","Χάρτης"],
            ["list","📋","Σκάφη"],
            ["history","📜","Ιστορικό"],
            ...(isAdmin ? [["users","👥","Χρήστες"]] : []),
          ].map(([id,ic,lb]) => (
            <button key={id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",
              border:"none",borderRadius:8,cursor:"pointer",textAlign:"left",fontSize:14,fontWeight:500,
              background:view===id?"#1e3a5f":"transparent",color:view===id?"#38bdf8":"#94a3b8"}}
              onClick={() => setView(id)}>
              <span>{ic}</span>{lb}
              {id==="movements" && activeMovements.length>0 && (
                <span style={{marginLeft:"auto",background:"#0ea5e9",color:"#fff",fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:10}}>
                  {activeMovements.length}
                </span>
              )}
              {id==="list" && stats.urgent>0 && (
                <span style={{marginLeft:"auto",background:"#dc2626",color:"#fff",fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:10}}>
                  {stats.urgent}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div style={{padding:"12px 8px",borderTop:"1px solid #334155"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
            <span style={{width:8,height:8,background:"#22c55e",borderRadius:"50%",flexShrink:0}}/>
            <span style={{fontSize:11,color:"#64748b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{session.user?.email}</span>
          </div>
          <div style={{fontSize:10,color:"#1d4ed8",fontWeight:600,marginBottom:8,paddingLeft:14}}>
            {isAdmin?"👑 Admin":"👤 Υπάλληλος"}
          </div>
          <button style={{width:"100%",padding:"7px",background:"transparent",border:"1px solid #334155",borderRadius:6,color:"#64748b",cursor:"pointer",fontSize:12}} onClick={handleLogout}>Αποσύνδεση</button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* TOPBAR */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 20px",borderBottom:"1px solid #334155",background:"#1e293b",flexShrink:0,gap:12,flexWrap:"wrap"}}>
          <h2 style={{margin:0,fontSize:16,fontWeight:700,color:"#f1f5f9"}}>
            {view==="dashboard"?"📊 Dashboard":view==="movements"?"🌊 Κινήσεις Ημέρας":view==="map"?"🗺️ Χάρτης":view==="list"?"📋 Κατάλογος Σκαφών":view==="history"?"📜 Ιστορικό":"👥 Χρήστες"}
          </h2>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            {view==="list" && <input style={{...S.inp,width:180,padding:"7px 12px"}} placeholder="🔍 Αναζήτηση..." value={search} onChange={e=>setSearch(e.target.value)} />}
            {view==="list" && (
              <select style={{...S.inp,width:"auto",padding:"7px 10px"}} value={filter} onChange={e=>setFilter(e.target.value)}>
                <option value="all">Όλα</option>
                <option value="active">🟢 Ενεργά</option>
                <option value="temp">🟡 Προσωρινά</option>
                <option value="out">🔴 Εκτός</option>
                <option value="urgent">🚨 Επείγοντα</option>
              </select>
            )}
            {view==="map" && <>
              <button style={S.btnS} onClick={() => bgRef.current.click()}>📷 Κάτοψη</button>
              <input ref={bgRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleBgUpload}/>
              <div style={{display:"flex",alignItems:"center",gap:4,background:"#0f172a",border:"1px solid #334155",borderRadius:8,padding:"4px 8px"}}>
                <button style={S.zoomBtn} onClick={zoomOut}>−</button>
                <span style={{color:"#94a3b8",fontSize:12,minWidth:36,textAlign:"center"}}>{Math.round(zoom*100)}%</span>
                <button style={S.zoomBtn} onClick={zoomIn}>+</button>
                <button style={{...S.zoomBtn,fontSize:11}} onClick={zoomReset}>↺</button>
              </div>
            </>}
            {view==="movements" && (
              <button style={S.btnP} onClick={() => setModal({type:"movement"})}>+ Βγήκε στο νερό</button>
            )}
            {(view==="map"||view==="list") && (
              <button style={S.btnP} onClick={() => setModal({type:"vessel",vessel:null})}>+ Νέο Σκάφος</button>
            )}
            {view==="list" && isAdmin && (
              <button style={S.btnS} onClick={() => exportCSV(
                vessels.map(v=>[v.name,v.berth_number,v.trailer_plate,v.registry,v.owner,STATUS[v.status]||"",fmtDate(v.entry_date),fmtDate(v.exit_date),v.urgent?"ΝΑΙ":"",v.notes]),
                ["Όνομα","Θέση","Πινακίδα","Νηολόγιο","Ιδιοκτήτης","Κατάσταση","Είσοδος","Έξοδος","Επείγον","Παρατηρήσεις"],
                `marina_${new Date().toISOString().slice(0,10)}.csv`)}>⬇ Export</button>
            )}
          </div>
        </div>

        {/* DASHBOARD */}
        {view==="dashboard" && (
          <div style={{flex:1,overflow:"auto",padding:24}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:14,marginBottom:24}}>
              {[
                ["Σύνολο","⚓",stats.total,"#1d4ed8"],
                ["Ενεργά","🟢",stats.active,"#065f46"],
                ["Προσωρινά","🟡",stats.temp,"#92400e"],
                ["Εκτός","🔴",stats.out,"#7f1d1d"],
                ["Στο νερό","🌊",stats.inWater,"#0c4a6e"],
                ["Επείγοντα","🚨",stats.urgent,"#dc2626"],
              ].map(([lb,ic,val]) => (
                <div key={lb} style={{background:"#1e293b",border:"1px solid #334155",borderRadius:12,padding:"16px 14px"}}>
                  <div style={{fontSize:26,marginBottom:6}}>{ic}</div>
                  <div style={{fontSize:26,fontWeight:700,color:"#f1f5f9"}}>{val}</div>
                  <div style={{fontSize:12,color:"#64748b",marginTop:3}}>{lb}</div>
                </div>
              ))}
            </div>

            <div style={{background:"#1e293b",border:"1px solid #334155",borderRadius:12,padding:20,marginBottom:20}}>
              <h3 style={{margin:"0 0 16px",color:"#f1f5f9",fontSize:14,fontWeight:600}}>📈 Κινήσεις τελευταίων 6 μηνών</h3>
              <div style={{display:"flex",alignItems:"flex-end",gap:10,height:110}}>
                {monthlyData.map((d,i) => (
                  <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                    <span style={{fontSize:11,color:"#94a3b8"}}>{d.count}</span>
                    <div style={{width:"100%",background:"#1d4ed8",borderRadius:"4px 4px 0 0",height:`${Math.max(4,(d.count/maxMonthly)*85)}px`}}/>
                    <span style={{fontSize:11,color:"#64748b"}}>{d.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {stats.urgent > 0 && (
              <div style={{background:"#1e293b",border:"1px solid #991b1b",borderRadius:12,padding:20}}>
                <h3 style={{margin:"0 0 12px",color:"#fca5a5",fontSize:14,fontWeight:600}}>🚨 Χρειάζονται προσοχή</h3>
                {vessels.filter(v=>v.urgent).map(v => (
                  <div key={v.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #1e293b"}}>
                    <div>
                      <strong style={{color:"#f1f5f9"}}>{v.name}</strong>
                      {v.berth_number && <span style={{color:"#64748b",fontSize:12,marginLeft:8}}>Θέση {v.berth_number}</span>}
                      {v.notes && <p style={{color:"#94a3b8",fontSize:12,margin:"2px 0 0"}}>{v.notes}</p>}
                    </div>
                    <button style={{...S.btnS,padding:"5px 10px",fontSize:12}} onClick={() => setModal({type:"vessel",vessel:v})}>Επεξ.</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ΚΙΝΗΣΕΙΣ ΗΜΕΡΑΣ */}
        {view==="movements" && (
          <div style={{flex:1,overflow:"auto",padding:20}}>
            {/* Σκάφη στο νερό */}
            <div style={{background:"#1e293b",border:"1px solid #334155",borderRadius:12,marginBottom:20,overflow:"hidden"}}>
              <div style={{padding:"14px 18px",borderBottom:"1px solid #334155",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <h3 style={{margin:0,color:"#f1f5f9",fontSize:14,fontWeight:600}}>
                  🌊 Αυτή τη στιγμή στο νερό
                  <span style={{marginLeft:8,background:"#0ea5e9",color:"#fff",fontSize:11,padding:"2px 8px",borderRadius:10}}>{activeMovements.length}</span>
                </h3>
              </div>
              {activeMovements.length===0 ? (
                <div style={{padding:"30px",textAlign:"center",color:"#475569"}}>
                  <div style={{fontSize:36,marginBottom:8}}>⚓</div>
                  <p>Κανένα σκάφος στο νερό αυτή τη στιγμή</p>
                </div>
              ) : (
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
                  <thead><tr>
                    {["Σκάφος","Ιδιοκτήτης","Ώρα Εξόδου","Αναμενόμενη Επιστροφή","Σημειώσεις",""].map(h=>(
                      <th key={h} style={{textAlign:"left",padding:"9px 16px",color:"#64748b",fontSize:12,fontWeight:600,borderBottom:"1px solid #334155"}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {activeMovements.map(m => (
                      <tr key={m.id} style={{borderBottom:"1px solid #1e293b"}}>
                        <td style={S.td}><strong style={{color:"#f1f5f9"}}>🚤 {m.vessel_name}</strong></td>
                        <td style={S.td}>{m.owner||"—"}</td>
                        <td style={{...S.td,color:"#38bdf8",fontWeight:600}}>{fmtTime(m.out_time||m.created_at)}</td>
                        <td style={S.td}>{m.expected_return||"—"}</td>
                        <td style={{...S.td,color:"#94a3b8",fontSize:12}}>{m.notes||"—"}</td>
                        <td style={S.td}>
                          <button style={{padding:"5px 12px",background:"#064e3b",color:"#6ee7b7",border:"1px solid #065f46",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:600}}
                            onClick={() => markReturned(m.id)}>✓ Επέστρεψε</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Επέστρεψαν σήμερα */}
            {returnedMovements.length > 0 && (
              <div style={{background:"#1e293b",border:"1px solid #334155",borderRadius:12,overflow:"hidden"}}>
                <div style={{padding:"14px 18px",borderBottom:"1px solid #334155"}}>
                  <h3 style={{margin:0,color:"#94a3b8",fontSize:14,fontWeight:600}}>✅ Επέστρεψαν σήμερα ({returnedMovements.length})</h3>
                </div>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
                  <thead><tr>
                    {["Σκάφος","Ιδιοκτήτης","Βγήκε","Επέστρεψε"].map(h=>(
                      <th key={h} style={{textAlign:"left",padding:"9px 16px",color:"#64748b",fontSize:12,fontWeight:600,borderBottom:"1px solid #334155"}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {returnedMovements.map(m => (
                      <tr key={m.id} style={{borderBottom:"1px solid #1e293b",opacity:0.6}}>
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
        {view==="map" && (
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div ref={mapRef} style={{flex:1,position:"relative",overflow:"hidden",cursor:"crosshair",background:"#0f172a"}}
              onDragOver={e=>e.preventDefault()} onDrop={onDrop} onWheel={handleWheel}>
              <div style={{position:"absolute",inset:0,transform:`scale(${zoom})`,transformOrigin:"center center",
                backgroundImage:bgImage?`url(${bgImage})`:"none",backgroundSize:"contain",backgroundPosition:"center",backgroundRepeat:"no-repeat"}}>
                {!bgImage && (
                  <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"#475569"}}>
                    <div style={{fontSize:52,marginBottom:12}}>🏖️</div>
                    <p style={{margin:"0 0 12px"}}>Δεν έχει οριστεί κάτοψη</p>
                    <button style={S.btnP} onClick={() => bgRef.current.click()}>Ανέβασε Κάτοψη</button>
                  </div>
                )}
                {filteredVessels.map(v => (
                  <div key={v.id} draggable onDragStart={e=>onDragStart(e,v)} onClick={() => setModal({type:"vessel",vessel:v})}
                    style={{position:"absolute",left:`${v.pos_x}%`,top:`${v.pos_y}%`,transform:"translate(-50%,-50%)",
                      cursor:"grab",userSelect:"none",display:"flex",flexDirection:"column",alignItems:"center",zIndex:10,
                      opacity:dragging===v.id?0.25:1,transition:"opacity .15s"}}>
                    <div style={{fontSize:26,lineHeight:1,filter:"drop-shadow(0 2px 6px rgba(0,0,0,.9))"}}>{v.urgent?"🚨":"🚤"}</div>
                    <div style={{background:v.status==="out"?"rgba(127,29,29,.95)":v.status==="temp"?"rgba(120,53,15,.95)":"rgba(15,23,42,.92)",
                      color:"#f1f5f9",fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:4,marginTop:2,
                      whiteSpace:"nowrap",border:"1px solid #334155",maxWidth:110,overflow:"hidden",textOverflow:"ellipsis"}}>
                      {v.berth_number?`[${v.berth_number}] `:""}{v.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{padding:"7px 16px",background:"#1e293b",borderTop:"1px solid #334155",color:"#64748b",fontSize:12,flexShrink:0}}>
              🖱️ Drag για μετακίνηση · Κλικ για επεξεργασία · {filteredVessels.length} σκάφη
              {activeMovements.length>0 && <span style={{marginLeft:16,color:"#38bdf8"}}>🌊 {activeMovements.length} στο νερό τώρα</span>}
            </div>
          </div>
        )}

        {/* LIST */}
        {view==="list" && (
          <div style={{flex:1,overflow:"auto",padding:20}}>
            {filteredVessels.length===0 ? (
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:250,gap:12,color:"#475569"}}>
                <div style={{fontSize:48}}>⛵</div>
                <p>{search||filter!=="all"?"Δεν βρέθηκαν αποτελέσματα":"Δεν υπάρχουν σκάφη ακόμα"}</p>
                {!search && filter==="all" && <button style={S.btnP} onClick={() => setModal({type:"vessel",vessel:null})}>+ Προσθήκη</button>}
              </div>
            ) : (
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:14,minWidth:700}}>
                  <thead><tr>
                    {["","Σκάφος","Θέση","Κατάσταση","Πινακίδα","Ιδιοκτήτης","Είσοδος","Έξοδος",""].map(h=>(
                      <th key={h} style={{textAlign:"left",padding:"9px 13px",color:"#64748b",fontSize:12,fontWeight:600,borderBottom:"1px solid #334155"}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {filteredVessels.map(v => (
                      <tr key={v.id} style={{borderBottom:"1px solid #1e293b",background:v.urgent?"rgba(220,38,38,.05)":"transparent"}}>
                        <td style={{...S.td,fontSize:18}}>{v.urgent?"🚨":"🚤"}</td>
                        <td style={S.td}><strong style={{color:"#f1f5f9"}}>{v.name}</strong></td>
                        <td style={S.td}><span style={{background:"#1e3a5f",color:"#93c5fd",padding:"2px 8px",borderRadius:6,fontSize:12,fontWeight:600}}>{v.berth_number||"—"}</span></td>
                        <td style={S.td}>{STATUS[v.status]||"—"}</td>
                        <td style={S.td}>{v.trailer_plate||"—"}</td>
                        <td style={S.td}>{v.owner||"—"}</td>
                        <td style={{...S.td,fontSize:12}}>{fmtDate(v.entry_date)}</td>
                        <td style={{...S.td,fontSize:12,color:v.exit_date&&new Date(v.exit_date)<new Date()?"#fca5a5":"#cbd5e1"}}>{fmtDate(v.exit_date)}</td>
                        <td style={S.td}>
                          <button style={{padding:"5px 11px",background:"#1e3a5f",color:"#93c5fd",border:"1px solid #1d4ed8",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:600}}
                            onClick={() => setModal({type:"vessel",vessel:v})}>✏️ Επεξ.</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* HISTORY */}
        {view==="history" && (
          <div style={{flex:1,overflow:"auto",padding:20}}>
            {history.length===0 ? (
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:250,gap:12,color:"#475569"}}>
                <div style={{fontSize:48}}>📜</div><p>Δεν υπάρχει ιστορικό ακόμα</p>
              </div>
            ) : (
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
                <thead><tr>
                  {["Ημερομηνία/Ώρα","Σκάφος","Ενέργεια","Χρήστης"].map(h=>(
                    <th key={h} style={{textAlign:"left",padding:"9px 13px",color:"#64748b",fontSize:12,fontWeight:600,borderBottom:"1px solid #334155"}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {history.map(h => (
                    <tr key={h.id} style={{borderBottom:"1px solid #1e293b"}}>
                      <td style={{...S.td,whiteSpace:"nowrap",fontSize:12}}>{fmt(h.created_at)}</td>
                      <td style={S.td}><strong style={{color:"#f1f5f9"}}>{h.vessel_name||"—"}</strong></td>
                      <td style={S.td}>
                        <span style={{padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600,color:"#bfdbfe",
                          background:h.action.includes("Μετακίν")?"#0f4c75":h.action.includes("Προσθήκη")?"#064e3b":h.action.includes("Διαγρ")?"#7f1d1d":"#1e3a5f"}}>
                          {h.action}
                        </span>
                      </td>
                      <td style={{...S.td,color:"#94a3b8",fontSize:12}}>{h.user_email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* USERS */}
        {view==="users" && isAdmin && (
          <div style={{flex:1,overflow:"auto",padding:20}}>
            <div style={{background:"#1e293b",border:"1px solid #334155",borderRadius:12,overflow:"hidden"}}>
              <div style={{padding:"14px 18px",borderBottom:"1px solid #334155"}}>
                <h3 style={{margin:0,color:"#f1f5f9",fontSize:14,fontWeight:600}}>👥 Λογαριασμοί Χρηστών</h3>
              </div>
              {users.length===0 ? (
                <div style={{padding:30,textAlign:"center",color:"#475569"}}>Δεν υπάρχουν χρήστες ακόμα</div>
              ) : (
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
                  <thead><tr>
                    {["User ID","Ρόλος","Ενέργεια"].map(h=>(
                      <th key={h} style={{textAlign:"left",padding:"9px 18px",color:"#64748b",fontSize:12,fontWeight:600,borderBottom:"1px solid #334155"}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.user_id} style={{borderBottom:"1px solid #1e293b"}}>
                        <td style={{...S.td,fontSize:11,color:"#64748b",fontFamily:"monospace"}}>{u.user_id?.slice(0,16)}...</td>
                        <td style={S.td}>
                          <span style={{padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600,
                            background:u.role==="admin"?"#1e3a5f":"#0f172a",color:u.role==="admin"?"#38bdf8":"#94a3b8"}}>
                            {u.role==="admin"?"👑 Admin":"👤 Υπάλληλος"}
                          </span>
                        </td>
                        <td style={S.td}>
                          {u.user_id!==session?.user?.id ? (
                            <button style={{padding:"5px 11px",background:"#1e3a5f",color:"#93c5fd",border:"1px solid #1d4ed8",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:600}}
                              onClick={() => updateUserRole(u.user_id, u.role==="admin"?"employee":"admin")}>
                              → {u.role==="admin"?"Υπάλληλος":"Admin"}
                            </button>
                          ) : <span style={{color:"#64748b",fontSize:12}}>Εσύ</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>

      {modal?.type==="vessel" && (
        <VesselModal vessel={modal.vessel} loading={loading} isAdmin={isAdmin}
          onSave={saveVessel} onDelete={deleteVessel} onClose={() => setModal(null)} />
      )}

      {modal?.type==="movement" && (
        <MovementModal vessels={vessels} loading={loading}
          onSave={addMovement} onClose={() => setModal(null)} />
      )}

      {toast && (
        <div style={{position:"fixed",bottom:22,right:22,padding:"11px 20px",borderRadius:10,color:"#f1f5f9",fontSize:14,fontWeight:600,zIndex:999,
          boxShadow:"0 8px 24px rgba(0,0,0,.5)",background:toast.type==="error"?"#7f1d1d":toast.type==="info"?"#1e3a5f":"#064e3b"}}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ── MOVEMENT MODAL ────────────────────────────────────────────────────────────
function MovementModal({ vessels, onSave, onClose, loading }) {
  const [form, setForm] = useState({ vessel_id:"", vessel_name:"", expected_return:"", notes:"" });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.65)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:16}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#1e293b",border:"1px solid #334155",borderRadius:14,width:"100%",maxWidth:440,boxShadow:"0 25px 50px rgba(0,0,0,.6)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:"1px solid #334155"}}>
          <h3 style={{margin:0,fontSize:16,fontWeight:700,color:"#f1f5f9"}}>🌊 Σκάφος στο νερό</h3>
          <button style={{background:"none",border:"none",color:"#64748b",fontSize:20,cursor:"pointer"}} onClick={onClose}>✕</button>
        </div>
        <div style={{padding:"16px 20px",display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <label style={S.lbl}>Σκάφος</label>
            <select style={S.inp} value={form.vessel_id} onChange={e => {
              const v = vessels.find(x=>x.id===e.target.value);
              set("vessel_id", e.target.value);
              if (v) set("vessel_name", v.name);
            }}>
              <option value="">— Επιλέξτε σκάφος —</option>
              {vessels.map(v => <option key={v.id} value={v.id}>{v.name} {v.berth_number?`[${v.berth_number}]`:""}</option>)}
            </select>
          </div>
          <div>
            <label style={S.lbl}>Αναμενόμενη Επιστροφή</label>
            <input style={S.inp} placeholder="π.χ. 18:00 ή Αύριο πρωί" value={form.expected_return} onChange={e=>set("expected_return",e.target.value)} />
          </div>
          <div>
            <label style={S.lbl}>Σημειώσεις</label>
            <textarea style={{...S.inp,height:60,resize:"vertical"}} value={form.notes} onChange={e=>set("notes",e.target.value)} />
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:8,padding:"13px 20px",borderTop:"1px solid #334155"}}>
          <button style={S.btnS} onClick={onClose}>Άκυρο</button>
          <button style={{...S.btnP,opacity:!form.vessel_id||loading?0.5:1}} disabled={!form.vessel_id||loading}
            onClick={() => { onSave(form); onClose(); }}>
            {loading?"...":"Καταχώρηση"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── VESSEL MODAL ──────────────────────────────────────────────────────────────
function VesselModal({ vessel, onSave, onDelete, onClose, loading, isAdmin }) {
  const [form, setForm] = useState({
    id:vessel?.id||null, name:vessel?.name||"",
    trailer_plate:vessel?.trailer_plate||"", registry:vessel?.registry||"",
    owner:vessel?.owner||"", notes:vessel?.notes||"",
    pos_x:vessel?.pos_x??50, pos_y:vessel?.pos_y??50,
    berth_number:vessel?.berth_number||"", status:vessel?.status||"active",
    entry_date:vessel?.entry_date||"", exit_date:vessel?.exit_date||"",
    urgent:vessel?.urgent||false, photo:vessel?.photo||null,
  });
  const [confirmDel, setConfirmDel] = useState(false);
  const photoRef = useRef(null);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  function handlePhoto(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => set("photo", ev.target.result);
    reader.readAsDataURL(file);
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.65)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:16}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#1e293b",border:"1px solid #334155",borderRadius:14,width:"100%",maxWidth:540,
        boxShadow:"0 25px 50px rgba(0,0,0,.6)",maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",
          borderBottom:"1px solid #334155",position:"sticky",top:0,background:"#1e293b",zIndex:1}}>
          <h3 style={{margin:0,fontSize:16,fontWeight:700,color:"#f1f5f9"}}>{vessel?"✏️ Επεξεργασία":"🚤 Νέο Σκάφος"}</h3>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={() => set("urgent",!form.urgent)}
              style={{padding:"5px 10px",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:600,
                background:form.urgent?"#dc2626":"transparent",color:form.urgent?"#fff":"#64748b",
                border:`1px solid ${form.urgent?"#dc2626":"#334155"}`}}>
              🚨 {form.urgent?"Επείγον":"Κανονικό"}
            </button>
            <button style={{background:"none",border:"none",color:"#64748b",fontSize:20,cursor:"pointer"}} onClick={onClose}>✕</button>
          </div>
        </div>
        <div style={{padding:"16px 20px",display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
            <div style={{width:80,height:80,borderRadius:8,overflow:"hidden",background:"#0f172a",border:"1px solid #334155",
              flexShrink:0,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}
              onClick={() => photoRef.current.click()}>
              {form.photo ? <img src={form.photo} style={{width:"100%",height:"100%",objectFit:"cover"}} /> : <span style={{fontSize:28}}>📷</span>}
            </div>
            <input ref={photoRef} type="file" accept="image/*" style={{display:"none"}} onChange={handlePhoto} />
            <div style={{flex:1}}>
              <label style={S.lbl}>Όνομα Σκάφους *</label>
              <input style={S.inp} value={form.name} onChange={e=>set("name",e.target.value)} />
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13}}>
            {[["trailer_plate","Πινακίδα Τρέιλερ"],["registry","Νηολόγιο"],["owner","Ιδιοκτήτης"],["berth_number","Αριθμός Θέσης"]].map(([k,lb])=>(
              <div key={k}>
                <label style={S.lbl}>{lb}</label>
                <input style={S.inp} value={form[k]} onChange={e=>set(k,e.target.value)} />
              </div>
            ))}
          </div>
          <div>
            <label style={S.lbl}>Κατάσταση</label>
            <div style={{display:"flex",gap:8}}>
              {[["active","🟢 Ενεργό"],["temp","🟡 Προσωρινά"],["out","🔴 Εκτός"]].map(([val,lb])=>(
                <button key={val} onClick={() => set("status",val)}
                  style={{flex:1,padding:"8px 6px",borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:600,
                    background:form.status===val?"#1d4ed8":"#0f172a",color:form.status===val?"#fff":"#64748b",
                    border:`1px solid ${form.status===val?"#1d4ed8":"#334155"}`}}>
                  {lb}
                </button>
              ))}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13}}>
            <div>
              <label style={S.lbl}>Ημερομηνία Εισόδου</label>
              <input style={S.inp} type="date" value={form.entry_date||""} onChange={e=>set("entry_date",e.target.value)} />
            </div>
            <div>
              <label style={S.lbl}>Ημερομηνία Εξόδου</label>
              <input style={S.inp} type="date" value={form.exit_date||""} onChange={e=>set("exit_date",e.target.value)} />
            </div>
          </div>
          <div>
            <label style={S.lbl}>Παρατηρήσεις</label>
            <textarea style={{...S.inp,height:68,resize:"vertical"}} value={form.notes} onChange={e=>set("notes",e.target.value)} />
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",padding:"13px 20px",borderTop:"1px solid #334155",gap:8,flexWrap:"wrap",position:"sticky",bottom:0,background:"#1e293b"}}>
          {vessel && isAdmin && !confirmDel && (
            <button style={{padding:"8px 13px",background:"#7f1d1d",color:"#fca5a5",border:"1px solid #991b1b",borderRadius:7,cursor:"pointer",fontSize:13,fontWeight:600}}
              onClick={() => setConfirmDel(true)}>🗑 Διαγραφή</button>
          )}
          {confirmDel && (
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <span style={{color:"#fca5a5",fontSize:13}}>Είστε σίγουροι;</span>
              <button style={{padding:"7px 11px",background:"#7f1d1d",color:"#fca5a5",border:"1px solid #991b1b",borderRadius:6,cursor:"pointer",fontSize:13,fontWeight:600}}
                onClick={() => onDelete(vessel.id,vessel.name)}>Ναι</button>
              <button style={S.btnS} onClick={() => setConfirmDel(false)}>Άκυρο</button>
            </div>
          )}
          <div style={{marginLeft:"auto",display:"flex",gap:8}}>
            <button style={S.btnS} onClick={onClose}>Άκυρο</button>
            <button style={{...S.btnP,opacity:!form.name||loading?0.5:1}} disabled={!form.name||loading} onClick={() => onSave(form)}>
              {loading?"...":vessel?"Αποθήκευση":"Προσθήκη"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  bg:      { minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",
             background:"linear-gradient(135deg,#0f172a 0%,#1e3a5f 60%,#0f4c75 100%)",
             fontFamily:"'Segoe UI',system-ui,sans-serif" },
  card:    { background:"#1e293b",border:"1px solid #334155",borderRadius:16,padding:"36px 32px",
             width:"100%",maxWidth:380,boxShadow:"0 25px 50px rgba(0,0,0,.5)" },
  inp:     { width:"100%",padding:"10px 12px",background:"#0f172a",border:"1px solid #334155",
             borderRadius:8,color:"#f1f5f9",fontSize:14,boxSizing:"border-box",outline:"none",fontFamily:"inherit" },
  lbl:     { color:"#94a3b8",fontSize:12,fontWeight:600,display:"block",marginBottom:5 },
  btnP:    { padding:"10px 18px",background:"#1d4ed8",color:"#fff",border:"none",borderRadius:8,
             cursor:"pointer",fontSize:14,fontWeight:600,whiteSpace:"nowrap" },
  btnS:    { padding:"10px 16px",background:"#1e293b",color:"#94a3b8",border:"1px solid #334155",
             borderRadius:8,cursor:"pointer",fontSize:14,fontWeight:500,whiteSpace:"nowrap" },
  app:     { display:"flex",height:"100vh",background:"#0f172a",fontFamily:"'Segoe UI',system-ui,sans-serif",color:"#f1f5f9",overflow:"hidden" },
  sidebar: { width:215,background:"#1e293b",borderRight:"1px solid #334155",display:"flex",flexDirection:"column",flexShrink:0 },
  td:      { padding:"10px 13px",color:"#cbd5e1" },
  zoomBtn: { padding:"2px 8px",background:"transparent",border:"none",color:"#94a3b8",cursor:"pointer",fontSize:18,fontWeight:700,lineHeight:1,borderRadius:4 },
};

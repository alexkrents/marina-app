import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://gnuhjlgqqzbkupqwajkf.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdudWhqbGdxcXpia3VwcXdhamtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMDE5ODIsImV4cCI6MjA4OTU3Nzk4Mn0.8Uv8UxTp-qncqH_7DJFaZqCZbETgJYqpfZ5lHdvrhP0"
);

const fmt = (d) => new Date(d).toLocaleString("el-GR");

export default function App() {
  const [session,  setSession]  = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ email:"", password:"", name:"" });
  const [authErr,  setAuthErr]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [vessels,  setVessels]  = useState([]);
  const [history,  setHistory]  = useState([]);
  const [bgImage,  setBgImage]  = useState(null);
  const [view,     setView]     = useState("map");
  const [modal,    setModal]    = useState(null);
  const [dragging, setDragging] = useState(null);
  const [toast,    setToast]    = useState(null);
  const mapRef  = useRef(null);
  const bgRef   = useRef(null);
  const dragOff = useRef({ x:0, y:0 });

  const showToast = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) loadAll();
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, sess) => {
      setSession(sess);
      if (sess) loadAll();
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadAll() {
    const [{ data: v }, { data: h }, { data: st }] = await Promise.all([
      supabase.from("vessels").select("*").order("created_at", { ascending: true }),
      supabase.from("vessel_history").select("*").order("created_at", { ascending: false }).limit(300),
      supabase.from("marina_settings").select("*"),
    ]);
    if (v)  setVessels(v);
    if (h)  setHistory(h);
    if (st) { const bg = st.find(r => r.key === "bg_image"); if (bg) setBgImage(bg.value); }
  }

  async function handleAuth(e) {
    e.preventDefault(); setAuthErr(""); setLoading(true);
    if (authMode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email: authForm.email, password: authForm.password });
      if (error) setAuthErr(error.message);
    } else {
      const { error } = await supabase.auth.signUp({
        email: authForm.email, password: authForm.password,
        options: { data: { full_name: authForm.name } },
      });
      if (error) setAuthErr(error.message);
      else { showToast("Λογαριασμός δημιουργήθηκε! Συνδεθείτε.", "info"); setAuthMode("login"); }
    }
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setVessels([]); setHistory([]); setBgImage(null);
  }

  async function logHistory(vessel_id, action, before, after, vessel_name) {
    await supabase.from("vessel_history").insert([{
      vessel_id, vessel_name: vessel_name || "", action,
      before_data: before ? JSON.stringify(before) : null,
      after_data:  after  ? JSON.stringify(after)  : null,
      user_email:  session?.user?.email || "unknown",
    }]);
  }

  async function saveVessel(form) {
    setLoading(true);
    const payload = { name:form.name, trailer_plate:form.trailer_plate, registry:form.registry,
      owner:form.owner, notes:form.notes, pos_x:form.pos_x??50, pos_y:form.pos_y??50 };
    if (!form.id) {
      const { data } = await supabase.from("vessels").insert([payload]).select().single();
      await logHistory(data?.id, "Προσθήκη σκάφους", null, payload, form.name);
      showToast("Σκάφος προστέθηκε!");
    } else {
      const old = vessels.find(v => v.id === form.id);
      await supabase.from("vessels").update(payload).eq("id", form.id);
      await logHistory(form.id, "Επεξεργασία στοιχείων", old, payload, form.name);
      showToast("Στοιχεία ενημερώθηκαν!");
    }
    await loadAll(); setModal(null); setLoading(false);
  }

  async function deleteVessel(id, name) {
    await supabase.from("vessel_history").delete().eq("vessel_id", id);
    await supabase.from("vessels").delete().eq("id", id);
    showToast(`Σκάφος "${name}" διαγράφηκε`);
    await loadAll(); setModal(null);
  }

  function onDragStart(e, vessel) {
    setDragging(vessel.id);
    const r = e.currentTarget.getBoundingClientRect();
    dragOff.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    e.dataTransfer.effectAllowed = "move";
  }

  async function onDrop(e) {
    e.preventDefault(); if (!dragging) return;
    const r = mapRef.current.getBoundingClientRect();
    const px = Math.max(0, Math.min(94, ((e.clientX - r.left - dragOff.current.x) / r.width)  * 100));
    const py = Math.max(0, Math.min(94, ((e.clientY - r.top  - dragOff.current.y) / r.height) * 100));
    const vessel = vessels.find(v => v.id === dragging);
    await supabase.from("vessels").update({ pos_x: px, pos_y: py }).eq("id", dragging);
    await logHistory(dragging, "Μετακίνηση σκάφους", { pos_x:vessel.pos_x, pos_y:vessel.pos_y }, { pos_x:px, pos_y:py }, vessel.name);
    setDragging(null); await loadAll();
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

  function exportCSV(rows, cols, filename) {
    const csv = [cols,...rows].map(r => r.map(c => `"${(c||"").toString().replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\uFEFF"+csv], { type:"text/csv;charset=utf-8;" }));
    a.download = filename; a.click();
  }

  // ── LOGIN ──────────────────────────────────────────────────────────────────
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
          {authMode==="register" && (
            <input style={S.inp} placeholder="Πλήρες Όνομα" value={authForm.name}
              onChange={e=>setAuthForm({...authForm,name:e.target.value})} required />
          )}
          <input style={S.inp} type="email" placeholder="Email" value={authForm.email}
            onChange={e=>setAuthForm({...authForm,email:e.target.value})} required />
          <input style={S.inp} type="password" placeholder="Κωδικός (min 6 χαρ.)" value={authForm.password}
            onChange={e=>setAuthForm({...authForm,password:e.target.value})} required minLength={6} />
          {authErr && <p style={{color:"#fca5a5",fontSize:13,margin:0}}>{authErr}</p>}
          <button style={S.btnP} type="submit" disabled={loading}>
            {loading ? "Παρακαλώ περιμένετε..." : authMode==="login" ? "Σύνδεση" : "Δημιουργία Λογαριασμού"}
          </button>
        </form>
      </div>
    </div>
  );

  // ── MAIN ───────────────────────────────────────────────────────────────────
  return (
    <div style={S.app}>
      <aside style={S.sidebar}>
        <div style={{display:"flex",alignItems:"center",gap:12,padding:"20px 16px 16px",borderBottom:"1px solid #334155"}}>
          <span style={{fontSize:28}}>⚓</span>
          <div>
            <div style={{color:"#f1f5f9",fontWeight:700,fontSize:16}}>Marina</div>
            <div style={{color:"#38bdf8",fontSize:10,fontWeight:700,letterSpacing:2}}>MANAGER</div>
          </div>
        </div>
        <nav style={{flex:1,padding:"12px 8px",display:"flex",flexDirection:"column",gap:3}}>
          {[["map","🗺️","Χάρτης"],["list","📋","Σκάφη"],["history","📜","Ιστορικό"]].map(([id,ic,lb]) => (
            <button key={id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",
              border:"none",borderRadius:8,cursor:"pointer",textAlign:"left",fontSize:14,fontWeight:500,
              background:view===id?"#1e3a5f":"transparent",color:view===id?"#38bdf8":"#94a3b8"}}
              onClick={() => setView(id)}><span>{ic}</span>{lb}</button>
          ))}
        </nav>
        <div style={{padding:"12px 8px",borderTop:"1px solid #334155"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <span style={{width:8,height:8,background:"#22c55e",borderRadius:"50%",flexShrink:0}}/>
            <span style={{fontSize:11,color:"#64748b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
              {session.user?.email}
            </span>
          </div>
          <button style={{width:"100%",padding:"7px",background:"transparent",border:"1px solid #334155",
            borderRadius:6,color:"#64748b",cursor:"pointer",fontSize:12}} onClick={handleLogout}>
            Αποσύνδεση
          </button>
        </div>
      </aside>

      <main style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"13px 20px",borderBottom:"1px solid #334155",background:"#1e293b",flexShrink:0}}>
          <h2 style={{margin:0,fontSize:16,fontWeight:700,color:"#f1f5f9"}}>
            {view==="map"?"🗺️ Χάρτης Μαρίνας":view==="list"?"📋 Κατάλογος Σκαφών":"📜 Ιστορικό Κινήσεων"}
          </h2>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {view==="map" && <>
              <button style={S.btnS} onClick={() => bgRef.current.click()}>📷 Κάτοψη</button>
              <input ref={bgRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleBgUpload}/>
              <button style={S.btnP} onClick={() => setModal({type:"vessel",vessel:null})}>+ Νέο Σκάφος</button>
            </>}
            {view==="list" && <>
              <button style={S.btnS} onClick={() => exportCSV(
                vessels.map(v=>[v.name,v.trailer_plate,v.registry,v.owner,v.notes,v.pos_x?.toFixed(1),v.pos_y?.toFixed(1),fmt(v.created_at)]),
                ["Όνομα","Πινακίδα","Νηολόγιο","Ιδιοκτήτης","Παρατηρήσεις","X%","Y%","Ημ/νία"],
                `marina_${new Date().toISOString().slice(0,10)}.csv`)}>⬇ Export CSV</button>
              <button style={S.btnP} onClick={() => setModal({type:"vessel",vessel:null})}>+ Νέο Σκάφος</button>
            </>}
            {view==="history" && (
              <button style={S.btnS} onClick={() => exportCSV(
                history.map(h=>[fmt(h.created_at),h.vessel_name,h.action,h.user_email,h.before_data||"",h.after_data||""]),
                ["Ημερομηνία","Σκάφος","Ενέργεια","Χρήστης","Πριν","Μετά"],
                `marina_history_${new Date().toISOString().slice(0,10)}.csv`)}>⬇ Export Ιστορικό</button>
            )}
          </div>
        </div>

        {view==="map" && (
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div ref={mapRef}
              style={{flex:1,position:"relative",backgroundImage:bgImage?`url(${bgImage})`:"none",
                backgroundSize:"contain",backgroundPosition:"center",backgroundRepeat:"no-repeat",backgroundColor:"#0f172a",
                overflow:"hidden",cursor:"crosshair"}}
              onDragOver={e=>e.preventDefault()} onDrop={onDrop}>
              {!bgImage && (
                <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",
                  alignItems:"center",justifyContent:"center",color:"#475569"}}>
                  <div style={{fontSize:52,marginBottom:12}}>🏖️</div>
                  <p style={{margin:"0 0 12px",fontSize:15}}>Δεν έχει οριστεί κάτοψη μαρίνας</p>
                  <button style={S.btnP} onClick={() => bgRef.current.click()}>Ανέβασε Κάτοψη</button>
                </div>
              )}
              {vessels.map(v => (
                <div key={v.id} draggable
                  onDragStart={e => onDragStart(e, v)}
                  onClick={() => setModal({type:"vessel",vessel:v})}
                  style={{position:"absolute",left:`${v.pos_x}%`,top:`${v.pos_y}%`,
                    transform:"translate(-50%,-50%)",cursor:"grab",userSelect:"none",
                    display:"flex",flexDirection:"column",alignItems:"center",zIndex:10,
                    opacity:dragging===v.id?0.25:1,transition:"opacity .15s"}}>
                  <div style={{fontSize:28,lineHeight:1,filter:"drop-shadow(0 2px 6px rgba(0,0,0,.9))"}}>⛵</div>
                  <div style={{background:"rgba(15,23,42,.92)",color:"#f1f5f9",fontSize:10,fontWeight:700,
                    padding:"2px 7px",borderRadius:4,marginTop:3,whiteSpace:"nowrap",
                    border:"1px solid #334155",maxWidth:110,overflow:"hidden",textOverflow:"ellipsis"}}>
                    {v.name}
                  </div>
                </div>
              ))}
            </div>
            <div style={{padding:"7px 16px",background:"#1e293b",borderTop:"1px solid #334155",
              color:"#64748b",fontSize:12,flexShrink:0}}>
              🖱️ Drag για μετακίνηση · Κλικ για επεξεργασία · {vessels.length} σκάφη
            </div>
          </div>
        )}

        {view==="list" && (
          <div style={{flex:1,overflow:"auto",padding:20}}>
            {vessels.length===0 ? (
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",
                justifyContent:"center",height:250,gap:12,color:"#475569"}}>
                <div style={{fontSize:48}}>⛵</div>
                <p>Δεν υπάρχουν σκάφη ακόμα</p>
                <button style={S.btnP} onClick={() => setModal({type:"vessel",vessel:null})}>+ Προσθήκη</button>
              </div>
            ) : (
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:14,minWidth:600}}>
                  <thead><tr>
                    {["Σκάφος","Πινακίδα","Νηολόγιο","Ιδιοκτήτης","Παρατηρήσεις",""].map(h => (
                      <th key={h} style={{textAlign:"left",padding:"9px 13px",color:"#64748b",
                        fontSize:12,fontWeight:600,borderBottom:"1px solid #334155"}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {vessels.map(v => (
                      <tr key={v.id} style={{borderBottom:"1px solid #1e293b"}}>
                        <td style={S.td}><strong style={{color:"#f1f5f9"}}>{v.name}</strong></td>
                        <td style={S.td}>{v.trailer_plate||"—"}</td>
                        <td style={S.td}>{v.registry||"—"}</td>
                        <td style={S.td}>{v.owner||"—"}</td>
                        <td style={{...S.td,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.notes||"—"}</td>
                        <td style={S.td}>
                          <button style={{padding:"5px 11px",background:"#1e3a5f",color:"#93c5fd",
                            border:"1px solid #1d4ed8",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:600}}
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

        {view==="history" && (
          <div style={{flex:1,overflow:"auto",padding:20}}>
            {history.length===0 ? (
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",
                justifyContent:"center",height:250,gap:12,color:"#475569"}}>
                <div style={{fontSize:48}}>📜</div>
                <p>Δεν υπάρχει ιστορικό ακόμα</p>
              </div>
            ) : (
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
                <thead><tr>
                  {["Ημερομηνία/Ώρα","Σκάφος","Ενέργεια","Χρήστης"].map(h => (
                    <th key={h} style={{textAlign:"left",padding:"9px 13px",color:"#64748b",
                      fontSize:12,fontWeight:600,borderBottom:"1px solid #334155"}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {history.map(h => (
                    <tr key={h.id} style={{borderBottom:"1px solid #1e293b"}}>
                      <td style={{...S.td,whiteSpace:"nowrap",fontSize:12}}>{fmt(h.created_at)}</td>
                      <td style={S.td}><strong style={{color:"#f1f5f9"}}>{h.vessel_name||"—"}</strong></td>
                      <td style={S.td}>
                        <span style={{padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600,color:"#bfdbfe",
                          background:h.action.includes("Μετακίν")?"#0f4c75":
                            h.action.includes("Προσθήκη")?"#064e3b":
                            h.action.includes("Διαγρ")?"#7f1d1d":"#1e3a5f"}}>
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
      </main>

      {modal?.type==="vessel" && (
        <VesselModal vessel={modal.vessel} loading={loading}
          onSave={saveVessel} onDelete={deleteVessel} onClose={() => setModal(null)} />
      )}

      {toast && (
        <div style={{position:"fixed",bottom:22,right:22,padding:"11px 20px",borderRadius:10,
          color:"#f1f5f9",fontSize:14,fontWeight:600,zIndex:999,
          boxShadow:"0 8px 24px rgba(0,0,0,.5)",
          background:toast.type==="error"?"#7f1d1d":toast.type==="info"?"#1e3a5f":"#064e3b"}}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function VesselModal({ vessel, onSave, onDelete, onClose, loading }) {
  const [form, setForm] = useState({
    id:vessel?.id||null, name:vessel?.name||"",
    trailer_plate:vessel?.trailer_plate||"", registry:vessel?.registry||"",
    owner:vessel?.owner||"", notes:vessel?.notes||"",
    pos_x:vessel?.pos_x??50, pos_y:vessel?.pos_y??50,
  });
  const [confirmDel, setConfirmDel] = useState(false);
  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.65)",display:"flex",
      alignItems:"center",justifyContent:"center",zIndex:100,padding:16}}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{background:"#1e293b",border:"1px solid #334155",borderRadius:14,
        width:"100%",maxWidth:490,boxShadow:"0 25px 50px rgba(0,0,0,.6)",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"17px 20px",borderBottom:"1px solid #334155",position:"sticky",top:0,background:"#1e293b"}}>
          <h3 style={{margin:0,fontSize:16,fontWeight:700,color:"#f1f5f9"}}>
            {vessel?"✏️ Επεξεργασία Σκάφους":"⛵ Νέο Σκάφος"}
          </h3>
          <button style={{background:"none",border:"none",color:"#64748b",fontSize:20,cursor:"pointer"}}
            onClick={onClose}>✕</button>
        </div>
        <div style={{padding:"17px 20px",display:"flex",flexDirection:"column",gap:13}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13}}>
            {[["name","Όνομα Σκάφους *"],["trailer_plate","Πινακίδα Τρέιλερ"],
              ["registry","Νηολόγιο"],["owner","Ιδιοκτήτης"]].map(([k,lb]) => (
              <div key={k}>
                <label style={{color:"#94a3b8",fontSize:12,fontWeight:600,display:"block",marginBottom:5}}>{lb}</label>
                <input style={S.inp} value={form[k]} onChange={e => set(k, e.target.value)} />
              </div>
            ))}
          </div>
          <div>
            <label style={{color:"#94a3b8",fontSize:12,fontWeight:600,display:"block",marginBottom:5}}>Παρατηρήσεις</label>
            <textarea style={{...S.inp,height:72,resize:"vertical"}}
              value={form.notes} onChange={e => set("notes", e.target.value)} />
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",padding:"13px 20px",
          borderTop:"1px solid #334155",gap:8,flexWrap:"wrap",position:"sticky",bottom:0,background:"#1e293b"}}>
          {vessel && !confirmDel && (
            <button style={{padding:"8px 13px",background:"#7f1d1d",color:"#fca5a5",
              border:"1px solid #991b1b",borderRadius:7,cursor:"pointer",fontSize:13,fontWeight:600}}
              onClick={() => setConfirmDel(true)}>🗑 Διαγραφή</button>
          )}
          {confirmDel && (
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <span style={{color:"#fca5a5",fontSize:13}}>Είστε σίγουροι;</span>
              <button style={{padding:"7px 11px",background:"#7f1d1d",color:"#fca5a5",
                border:"1px solid #991b1b",borderRadius:6,cursor:"pointer",fontSize:13,fontWeight:600}}
                onClick={() => onDelete(vessel.id, vessel.name)}>Ναι</button>
              <button style={S.btnS} onClick={() => setConfirmDel(false)}>Άκυρο</button>
            </div>
          )}
          <div style={{marginLeft:"auto",display:"flex",gap:8}}>
            <button style={S.btnS} onClick={onClose}>Άκυρο</button>
            <button style={{...S.btnP,opacity:!form.name||loading?0.5:1}}
              disabled={!form.name||loading} onClick={() => onSave(form)}>
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
             borderRadius:8,color:"#f1f5f9",fontSize:14,boxSizing:"border-box",
             outline:"none",fontFamily:"inherit" },
  btnP:    { padding:"10px 18px",background:"#1d4ed8",color:"#fff",border:"none",borderRadius:8,
             cursor:"pointer",fontSize:14,fontWeight:600,whiteSpace:"nowrap" },
  btnS:    { padding:"10px 16px",background:"#1e293b",color:"#94a3b8",border:"1px solid #334155",
             borderRadius:8,cursor:"pointer",fontSize:14,fontWeight:500,whiteSpace:"nowrap" },
  app:     { display:"flex",height:"100vh",background:"#0f172a",
             fontFamily:"'Segoe UI',system-ui,sans-serif",color:"#f1f5f9",overflow:"hidden" },
  sidebar: { width:210,background:"#1e293b",borderRight:"1px solid #334155",
             display:"flex",flexDirection:"column",flexShrink:0 },
  td:      { padding:"10px 13px",color:"#cbd5e1" },
};

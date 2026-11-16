import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase, BUCKET, DEFAULT_PLAN, T, fmtDT, fmtTime } from "./lib.js";
import MapView from "./MapView.jsx";

/* ── Εικονίδια ───────────────────────────────────────────────────────────── */
const ICONS = {
  map: <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" />,
  water: <path d="M3 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />,
  vessels: <path d="M4 6h16M4 12h16M4 18h16" />,
  history: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  overview: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  users: <><circle cx="12" cy="8" r="4" /><path d="M4 21c.8-4 3.800-6 8-6s7.200 2 8 6" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.500-3.500" /></>,
  close: <path d="M6 6l12 12M18 6 6 18" />,
};
function Icon({ name, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}
function Anchor({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#FF9F5A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="5" r="2" /><path d="M12 7v14M5 13a7 7 0 0 0 14 0M8 11h8" />
    </svg>
  );
}

const naturalSort = (a, b) => a.code.localeCompare(b.code, "el", { numeric: true });

/* ── Ρίζα: σύνδεση, έγκριση, εφαρμογή ───────────────────────────────────── */
export default function App() {
  const [lang, setLang] = useState(() => { try { return localStorage.getItem("marina_lang") || "el"; } catch (e) { return "el"; } });
  const t = T[lang];
  const [session, setSession] = useState(undefined);
  const [me, setMe] = useState(undefined);
  const [recovery, setRecovery] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = useCallback((msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);
  const toggleLang = () => {
    const nl = lang === "el" ? "en" : "el";
    setLang(nl);
    try { localStorage.setItem("marina_lang", nl); } catch (e) { /* ignore */ }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session || null));
    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      setSession(sess || null);
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const uid = session?.user?.id;
  const loadMe = useCallback(async () => {
    if (!uid) { setMe(undefined); return; }
    const { data } = await supabase.from("marina_users").select("user_id,role,email,full_name").eq("user_id", uid).maybeSingle();
    setMe(data || { user_id: uid, role: "pending" });
  }, [uid]);
  useEffect(() => { loadMe(); }, [loadMe]);

  let body;
  if (session === undefined || (session && me === undefined)) {
    body = <div className="center-screen">{t.loading}</div>;
  } else if (!session) {
    body = <AuthScreen t={t} lang={lang} toggleLang={toggleLang} notify={notify} />;
  } else if (recovery) {
    body = <NewPassword t={t} notify={notify} onDone={() => setRecovery(false)} />;
  } else if (me.role !== "admin" && me.role !== "employee") {
    body = (
      <div className="center-screen">
        <div className="card narrow">
          <Anchor size={32} />
          <h1>{t.pendingTitle}</h1>
          <p className="muted">{t.pendingText}</p>
          <div className="row">
            <button type="button" className="btn primary" onClick={loadMe}>{t.checkAgain}</button>
            <button type="button" className="btn" onClick={() => supabase.auth.signOut()}>{t.logout}</button>
          </div>
        </div>
      </div>
    );
  } else {
    body = <Workspace session={session} me={me} t={t} lang={lang} toggleLang={toggleLang} notify={notify} />;
  }

  return (
    <>
      {body}
      {toast && <div className={"toast " + toast.type} role="status">{toast.msg}</div>}
    </>
  );
}

/* ── Οθόνη σύνδεσης ──────────────────────────────────────────────────────── */
function AuthScreen({ t, lang, toggleLang, notify }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setErr(""); setBusy(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.password });
      if (error) setErr(error.message);
    } else {
      const { error } = await supabase.auth.signUp({
        email: form.email.trim(), password: form.password,
        options: { data: { full_name: form.name.trim() } },
      });
      if (error) setErr(error.message);
    }
    setBusy(false);
  }
  async function forgot() {
    if (!form.email.trim()) { setErr(t.forgotNeedEmail); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(form.email.trim(), { redirectTo: window.location.origin });
    if (error) setErr(error.message); else notify(t.resetSent);
  }

  return (
    <div className="auth">
      <div className="auth-hero">
        <img src={DEFAULT_PLAN.url} alt="" className="auth-plan" />
        <div className="brand"><Anchor size={32} /><span>Marina Manager</span></div>
        <div className="auth-hero-text">
          <h1>{t.heroTitle}</h1>
          <p>{t.heroText}</p>
        </div>
      </div>
      <div className="auth-form-side">
        <div className="auth-lang">
          <button type="button" className="btn small" onClick={toggleLang}>{lang === "el" ? "EN" : "ΕΛ"}</button>
        </div>
        <form className="auth-form" onSubmit={submit}>
          <div>
            <h2>{mode === "login" ? t.login : t.requestAccess}</h2>
            <p className="muted">{mode === "login" ? t.welcome : t.requestText}</p>
          </div>
          {mode === "register" && (
            <Field label={t.fullName}><input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} required autoComplete="name" /></Field>
          )}
          <Field label={t.email}><input className="input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required autoComplete="email" /></Field>
          <Field label={t.password}>
            <input className="input" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} required minLength={mode === "register" ? 8 : 6}
              placeholder={mode === "register" ? t.passwordHint : ""} autoComplete={mode === "login" ? "current-password" : "new-password"} />
          </Field>
          {err && <p className="error-text" role="alert">{err}</p>}
          <button type="submit" className="btn primary big" disabled={busy}>{busy ? t.wait : mode === "login" ? t.signIn : t.sendRequest}</button>
          {mode === "login" ? (
            <div className="row between">
              <button type="button" className="link" onClick={forgot}>{t.forgot}</button>
              <button type="button" className="link" onClick={() => { setMode("register"); setErr(""); }}>{t.requestAccess}</button>
            </div>
          ) : (
            <button type="button" className="link" onClick={() => { setMode("login"); setErr(""); }}>{t.haveAccount}</button>
          )}
          <p className="note">{t.inviteNote}</p>
        </form>
      </div>
    </div>
  );
}

function NewPassword({ t, notify, onDone }) {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) notify(error.message, "error"); else { notify(t.passwordSaved); onDone(); }
  }
  return (
    <div className="center-screen">
      <form className="card narrow" onSubmit={submit}>
        <h1>{t.newPassword}</h1>
        <Field label={t.newPassword}><input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} minLength={8} required placeholder={t.passwordHint} autoComplete="new-password" /></Field>
        <button type="submit" className="btn primary big" disabled={busy}>{busy ? t.wait : t.savePassword}</button>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

/* ── Κύρια εφαρμογή ──────────────────────────────────────────────────────── */
function Workspace({ session, me, t, lang, toggleLang, notify }) {
  const isAdmin = me.role === "admin";
  const email = session.user.email;

  const [view, setView] = useState("map");
  const [vessels, setVessels] = useState([]);
  const [slots, setSlots] = useState([]);
  const [activeMoves, setActiveMoves] = useState([]);
  const [returnedMoves, setReturnedMoves] = useState([]);
  const [history, setHistory] = useState([]);
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState({});
  const [plan, setPlan] = useState(DEFAULT_PLAN);
  const [loaded, setLoaded] = useState(false);

  const [selectedId, setSelectedId] = useState(null);
  const [movingId, setMovingId] = useState(null);
  const [mapFilter, setMapFilter] = useState("all");
  const [editMode, setEditMode] = useState(false);
  const [addArmed, setAddArmed] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [modal, setModal] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const editRef = useRef(false);
  editRef.current = editMode;

  const fail = useCallback((error) => { notify(`${t.error}: ${error.message || error}`, "error"); }, [notify, t]);

  /* Φόρτωση δεδομένων */
  const loadAll = useCallback(async () => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const q = [
      supabase.from("vessels").select("id,name,trailer_plate,registry,owner,notes,status,urgent,slot_id,photo_path,created_at").order("name"),
      supabase.from("slots").select("*"),
      supabase.from("daily_movements").select("*").eq("returned", false).order("created_at", { ascending: false }),
      supabase.from("daily_movements").select("*").eq("returned", true).gte("returned_time", start.toISOString()).order("returned_time", { ascending: false }),
      supabase.from("vessel_history").select("id,vessel_id,vessel_name,action,details,user_email,created_at").order("created_at", { ascending: false }).limit(300),
      supabase.from("marina_settings").select("key,value").in("key", ["plan_path", "plan_w", "plan_h"]),
    ];
    if (isAdmin) q.push(supabase.from("marina_users").select("user_id,role,email,full_name,created_at").order("created_at"));
    const res = await Promise.all(q);
    const bad = res.find((r) => r.error);
    if (bad) { fail(bad.error); return; }
    setVessels(res[0].data || []);
    setSlots((res[1].data || []).sort(naturalSort));
    setActiveMoves(res[2].data || []);
    setReturnedMoves(res[3].data || []);
    setHistory(res[4].data || []);
    const st = {}; (res[5].data || []).forEach((r) => { st[r.key] = r.value; });
    setSettings(st);
    if (isAdmin) setUsers(res[6].data || []);
    setLoaded(true);
  }, [isAdmin, fail]);

  useEffect(() => {
    loadAll();
    const tick = () => { if (!document.hidden && !editRef.current) loadAll(); };
    const id = setInterval(tick, 20000);
    window.addEventListener("focus", tick);
    return () => { clearInterval(id); window.removeEventListener("focus", tick); };
  }, [loadAll]);

  /* Κάτοψη */
  useEffect(() => {
    let off = false;
    if (!settings.plan_path) { setPlan(DEFAULT_PLAN); return; }
    supabase.storage.from(BUCKET).createSignedUrl(settings.plan_path, 60 * 60 * 12).then(({ data }) => {
      if (off) return;
      if (data?.signedUrl) setPlan({ url: data.signedUrl, w: Number(settings.plan_w) || 1000, h: Number(settings.plan_h) || 800 });
      else setPlan(DEFAULT_PLAN);
    });
    return () => { off = true; };
  }, [settings.plan_path, settings.plan_w, settings.plan_h]);

  /* Παράγωγα */
  const slotById = useMemo(() => new Map(slots.map((s) => [s.id, s])), [slots]);
  const waterIds = useMemo(() => new Set(activeMoves.map((m) => m.vessel_id)), [activeMoves]);
  const stateOf = useCallback((v) => (v.status === "away" ? "away" : waterIds.has(v.id) ? "water" : v.status === "work" ? "work" : "berth"), [waterIds]);
  const codeOf = useCallback((v) => slotById.get(v.slot_id)?.code || null, [slotById]);
  const selected = vessels.find((v) => v.id === selectedId) || null;
  const moving = vessels.find((v) => v.id === movingId) || null;
  const unassigned = vessels.filter((v) => !v.slot_id && v.status !== "away");
  const counts = useMemo(() => {
    // «Όλα» = όσα βρίσκονται τώρα στον χώρο. Όσα έχουν αποχωρήσει μετρούν χωριστά.
    const c = { all: 0, berth: 0, water: 0, work: 0, away: 0 };
    vessels.forEach((v) => { const s = stateOf(v); c[s] += 1; if (s !== "away") c.all += 1; });
    return c;
  }, [vessels, stateOf]);
  const occupied = useMemo(() => new Set(vessels.filter((v) => v.slot_id).map((v) => v.slot_id)), [vessels]);

  useEffect(() => {
    let off = false;
    setPhotoUrl(null);
    if (selected?.photo_path) {
      supabase.storage.from(BUCKET).createSignedUrl(selected.photo_path, 3600).then(({ data }) => { if (!off) setPhotoUrl(data?.signedUrl || null); });
    }
    return () => { off = true; };
  }, [selected?.id, selected?.photo_path]);

  /* Ιστορικό */
  const log = useCallback(async (vessel, action, details) => {
    await supabase.from("vessel_history").insert([{
      vessel_id: vessel?.id || null, vessel_name: vessel?.name || "—", action, details: details || null, user_email: email,
    }]);
  }, [email]);

  /* Ενέργειες σκαφών */
  async function moveVessel(v, slotId) {
    const from = codeOf(v) || "Χωρίς θέση";
    const to = slotId ? slotById.get(slotId)?.code || "?" : "Χωρίς θέση";
    setVessels((vs) => vs.map((x) => (x.id === v.id ? { ...x, slot_id: slotId } : x)));
    setMovingId(null);
    const { error } = await supabase.from("vessels").update({ slot_id: slotId }).eq("id", v.id);
    if (error) { fail(error); loadAll(); return; }
    await log(v, "Μετακίνηση", `${from} → ${to}`);
    notify(t.moved);
    loadAll();
  }
  async function launch(vesselId, expected, notes) {
    const v = vessels.find((x) => x.id === vesselId);
    if (!v) return;
    const { error } = await supabase.from("daily_movements").insert([{
      vessel_id: v.id, vessel_name: v.name, owner: v.owner || "", expected_return: expected || "", notes: notes || "", user_email: email,
    }]);
    if (error) { fail(error); return; }
    await log(v, "Στο νερό", expected ? `Επιστροφή: ${expected}` : null);
    setModal(null); notify(t.saved); loadAll();
  }
  async function markReturned(m) {
    const { error } = await supabase.from("daily_movements").update({ returned: true, returned_time: new Date().toISOString() }).eq("id", m.id);
    if (error) { fail(error); return; }
    await log({ id: m.vessel_id, name: m.vessel_name }, "Επιστροφή από το νερό", null);
    notify(t.saved); loadAll();
  }
  async function toggleWork(v) {
    const next = v.status === "work" ? "active" : "work";
    const { error } = await supabase.from("vessels").update({ status: next }).eq("id", v.id);
    if (error) { fail(error); return; }
    await log(v, next === "work" ? "Έναρξη εργασιών" : "Τέλος εργασιών", null);
    loadAll();
  }
  // Αποχώρηση: το σκάφος φεύγει από τον χώρο, η θέση του ελευθερώνεται και τα στοιχεία του μένουν.
  async function setAway(v) {
    const from = codeOf(v);
    const { error } = await supabase.from("vessels").update({ status: "away", slot_id: null }).eq("id", v.id);
    if (error) { fail(error); return; }
    await log(v, "Αποχώρηση από τον χώρο", from ? `Θέση ${from}` : null);
    setMovingId(null); notify(t.saved); loadAll();
  }
  async function bringBack(v) {
    const { error } = await supabase.from("vessels").update({ status: "active" }).eq("id", v.id);
    if (error) { fail(error); return; }
    await log(v, "Επιστροφή στον χώρο", null);
    setSelectedId(v.id); setMovingId(v.id); notify(t.saved); loadAll();
  }
  async function saveVessel(form, file) {
    const payload = {
      name: form.name.trim(), trailer_plate: form.trailer_plate.trim(), registry: form.registry.trim(),
      owner: form.owner.trim(), notes: form.notes.trim(), urgent: !!form.urgent,
    };
    let id = form.id;
    if (!id) {
      const { data, error } = await supabase.from("vessels").insert([payload]).select("id").single();
      if (error) { fail(error); return; }
      id = data.id;
      await log({ id, name: payload.name }, "Προσθήκη σκάφους", null);
    } else {
      const { error } = await supabase.from("vessels").update(payload).eq("id", id);
      if (error) { fail(error); return; }
      await log({ id, name: payload.name }, "Αλλαγή στοιχείων", null);
    }
    if (file) {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `vessels/${id}-${Date.now()}.${ext}`;
      const up = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: true });
      if (up.error) fail(up.error);
      else {
        await supabase.from("vessels").update({ photo_path: path }).eq("id", id);
        if (form.photo_path) await supabase.storage.from(BUCKET).remove([form.photo_path]);
      }
    }
    setModal(null); setSelectedId(id); notify(t.saved); loadAll();
  }
  async function deleteVessel(v) {
    const { error } = await supabase.from("vessels").delete().eq("id", v.id);
    if (error) { fail(error); return; }
    if (v.photo_path) await supabase.storage.from(BUCKET).remove([v.photo_path]);
    await log(v, "Διαγραφή σκάφους", codeOf(v) ? `Θέση ${codeOf(v)}` : null);
    setModal(null); setSelectedId(null); notify(t.deleted); loadAll();
  }

  /* Ενέργειες θέσεων (μόνο διαχειριστής) */
  function nextCode(base) {
    const prefix = (base?.code || "Θ").match(/^\D*/)[0] || "Θ";
    let max = 0;
    slots.forEach((s) => { const m = s.code.match(new RegExp("^" + prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(\\d+)$")); if (m) max = Math.max(max, Number(m[1])); });
    return prefix + (max + 1);
  }
  async function insertSlot(row) {
    const { data, error } = await supabase.from("slots").insert([row]).select("*").single();
    if (error) { fail(error); return; }
    setSlots((ss) => [...ss, data].sort(naturalSort));
    setSelectedSlotId(data.id); setAddArmed(false);
  }
  function addSlot(p) {
    let base = slotById.get(selectedSlotId) || null;
    if (!base) {
      let bd = Infinity;
      slots.forEach((s) => { const d = Math.hypot(s.x - p.x, s.y - p.y); if (d < bd) { bd = d; base = s; } });
    }
    insertSlot({ code: nextCode(base), x: p.x, y: p.y, angle: base?.angle ?? 0, length: base?.length ?? 52, width: base?.width ?? 19 });
  }
  function duplicateSlot(s) {
    // Η νέα θέση μπαίνει στην πλευρά που έχει περισσότερο ελεύθερο χώρο.
    const a = ((s.angle + 90) * Math.PI) / 180;
    const step = s.width + 5;
    const cands = [1, -1].map((dir) => ({ x: s.x + Math.cos(a) * step * dir, y: s.y + Math.sin(a) * step * dir }));
    const room = (p) => Math.min(...slots.filter((o) => o.id !== s.id).map((o) => Math.hypot(o.x - p.x, o.y - p.y)), 9999);
    const p = room(cands[0]) >= room(cands[1]) ? cands[0] : cands[1];
    insertSlot({ code: nextCode(s), x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10, angle: s.angle, length: s.length, width: s.width });
  }
  const patchSlotLocal = (id, patch) => setSlots((ss) => ss.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  async function saveSlot(id, patch) {
    patchSlotLocal(id, patch);
    const { error } = await supabase.from("slots").update(patch).eq("id", id);
    if (error) { notify(error.code === "23505" ? t.codeTaken : `${t.error}: ${error.message}`, "error"); loadAll(); }
  }
  async function deleteSlot(s) {
    if (occupied.has(s.id)) { notify(t.slotOccupied, "error"); return; }
    const { error } = await supabase.from("slots").delete().eq("id", s.id);
    if (error) { fail(error); return; }
    setSlots((ss) => ss.filter((x) => x.id !== s.id)); setSelectedSlotId(null);
  }
  async function changePlan(file) {
    if (!file) return;
    const dims = await new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => { resolve({ w: img.naturalWidth, h: img.naturalHeight }); URL.revokeObjectURL(url); };
      img.onerror = () => { resolve({ w: 0, h: 0 }); URL.revokeObjectURL(url); };
      img.src = url;
    });
    const w = 1000, h = dims.w && dims.h ? Math.round((1000 * dims.h) / dims.w) : 800;
    const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
    const path = `plan/${Date.now()}.${ext}`;
    const up = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: true });
    if (up.error) { fail(up.error); return; }
    const old = settings.plan_path;
    const { error } = await supabase.from("marina_settings").upsert(
      [{ key: "plan_path", value: path }, { key: "plan_w", value: String(w) }, { key: "plan_h", value: String(h) }], { onConflict: "key" });
    if (error) { fail(error); return; }
    if (old) await supabase.storage.from(BUCKET).remove([old]);
    await log(null, "Αλλαγή κάτοψης", file.name);
    notify(t.saved); loadAll();
  }
  async function resetPlan() {
    const old = settings.plan_path;
    const { error } = await supabase.from("marina_settings").delete().in("key", ["plan_path", "plan_w", "plan_h"]);
    if (error) { fail(error); return; }
    if (old) await supabase.storage.from(BUCKET).remove([old]);
    await log(null, "Αλλαγή κάτοψης", "Αρχική κάτοψη");
    loadAll();
  }
  async function setRole(u, role) {
    const { error } = await supabase.from("marina_users").update({ role }).eq("user_id", u.user_id);
    if (error) { fail(error); return; }
    notify(t.saved); loadAll();
  }

  /* Εξαγωγή Excel */
  async function exportExcel() {
    try {
      const XLSX = await import("xlsx");
      const { data: hist } = await supabase.from("vessel_history").select("created_at,vessel_name,action,details,user_email").order("created_at", { ascending: false }).limit(5000);
      const stLabel = { berth: "Στη θέση", water: "Στο νερό", work: "Σε εργασίες", away: "Εκτός χώρου" };
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(vessels.map((v) => ({
        "Σκάφος": v.name, "Θέση": codeOf(v) || "", "Κατάσταση": stLabel[stateOf(v)], "Ιδιοκτήτης": v.owner || "",
        "Πινακίδα τρέιλερ": v.trailer_plate || "", "Νηολόγιο": v.registry || "", "Επείγον": v.urgent ? "Ναι" : "", "Παρατηρήσεις": v.notes || "",
      }))), "Σκάφη");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet((hist || []).map((h) => ({
        "Ημερομηνία": fmtDT(h.created_at, "el"), "Σκάφος": h.vessel_name || "", "Ενέργεια": h.action || "", "Λεπτομέρειες": h.details || "", "Χρήστης": h.user_email || "",
      }))), "Ιστορικό");
      XLSX.writeFile(wb, `marina_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (e) { fail(e); }
  }

  const enterEdit = () => { setEditMode(true); setSelectedId(null); setMovingId(null); setView("map"); };
  const leaveEdit = () => { setEditMode(false); setAddArmed(false); setSelectedSlotId(null); loadAll(); };
  const openVessel = (id) => { setSelectedId(id); setView("map"); };

  const nav = [
    ["map", t.navMap], ["water", t.navWater], ["vessels", t.navVessels], ["history", t.navHistory], ["overview", t.navOverview],
    ...(isAdmin ? [["users", t.navUsers]] : []),
  ];
  const pendingCount = users.filter((u) => u.role === "pending").length;
  const isVisible = (v) => stateOf(v) !== "away" && (mapFilter === "all" || stateOf(v) === mapFilter);

  return (
    <div className="app">
      <nav className="sidebar" aria-label="Menu">
        <div className="brand"><Anchor /><span>Marina Manager</span></div>
        <div className="nav">
          {nav.map(([id, label]) => (
            <button key={id} type="button" className={"nav-item" + (view === id ? " active" : "")} aria-current={view === id ? "page" : undefined}
              onClick={() => { if (editMode) leaveEdit(); setView(id); }}>
              <Icon name={id} /><span>{label}</span>
              {id === "water" && activeMoves.length > 0 && <span className="badge">{activeMoves.length}</span>}
              {id === "users" && pendingCount > 0 && <span className="badge">{pendingCount}</span>}
            </button>
          ))}
        </div>
        <div className="userbox">
          <span className="avatar">{(me.full_name || email || "?").slice(0, 1).toUpperCase()}</span>
          <span className="userbox-text"><strong>{me.full_name || email}</strong><small>{isAdmin ? t.admin : t.employee}</small></span>
          <button type="button" className="btn tiny on-dark" onClick={toggleLang}>{lang === "el" ? "EN" : "ΕΛ"}</button>
          <button type="button" className="btn tiny on-dark" onClick={() => supabase.auth.signOut()}>{t.logout}</button>
        </div>
      </nav>

      <main className="main">
        <div className="topbar">
          <span className="brand dark"><Anchor size={22} /><span>Marina Manager</span></span>
          <button type="button" className="btn tiny" onClick={toggleLang}>{lang === "el" ? "EN" : "ΕΛ"}</button>
          <button type="button" className="btn tiny" onClick={() => supabase.auth.signOut()}>{t.logout}</button>
        </div>
        {!loaded && <p className="muted">{t.loading}</p>}

        {loaded && view === "map" && (
          <>
            <div className="page-head">
              <h1>{t.navMap}</h1>
              {!editMode && (
                <label className="searchbox">
                  <Icon name="search" size={16} />
                  <input type="search" list="vessel-names" placeholder={t.search} aria-label={t.search}
                    onChange={(e) => { const q = e.target.value.trim().toLowerCase(); const hit = q && vessels.find((v) => v.name.toLowerCase() === q); if (hit) setSelectedId(hit.id); }} />
                  <datalist id="vessel-names">{vessels.map((v) => <option key={v.id} value={v.name} />)}</datalist>
                </label>
              )}
              {isAdmin && (editMode
                ? <button type="button" className="btn primary" onClick={leaveEdit}>{t.doneEditing}</button>
                : <button type="button" className="btn" onClick={enterEdit}>{t.editSlots}</button>)}
              {isAdmin && !editMode && <button type="button" className="btn primary" onClick={() => setModal({ type: "vessel", vessel: null })}>{t.newVessel}</button>}
            </div>

            <div className="map-layout">
              <section className="card map-card">
                {!editMode && (
                  <div className="chips">
                    {[["all", t.all], ["berth", t.berth], ["water", t.inWater], ["work", t.work]].map(([k, label]) => (
                      <button key={k} type="button" className={"chip" + (mapFilter === k ? " on" : "")} onClick={() => setMapFilter(k)}>{label} · {counts[k]}</button>
                    ))}
                  </div>
                )}
                {(moving || (editMode && addArmed)) && <p className="hint-bar">{moving ? `${moving.name}: ${t.moveHint}` : t.newSlotHint}</p>}
                <MapView
                  plan={plan} slots={slots} vessels={vessels} isVisible={isVisible} stateOf={stateOf}
                  selectedId={selectedId} onSelectVessel={(id) => { setSelectedId(id); if (id !== movingId) setMovingId(null); }}
                  onMoveVessel={moveVessel} movingVessel={moving}
                  editMode={editMode} addArmed={addArmed} selectedSlotId={selectedSlotId}
                  onSelectSlot={setSelectedSlotId} onAddSlot={addSlot} onUpdateSlot={saveSlot} t={t}
                />
                <div className="legend">
                  <span><i className="sw berth" />{t.berth}</span>
                  <span><i className="sw water" />{t.inWater}</span>
                  <span><i className="sw work" />{t.work}</span>
                  <span><i className="sw free" />{t.freeSlot}</span>
                  <span className="muted">{slots.length - occupied.size} / {slots.length}</span>
                </div>
              </section>

              <aside className="side">
                {editMode ? (
                  <SlotPanel t={t} slot={slotById.get(selectedSlotId) || null} occupiedBy={vessels.find((v) => v.slot_id === selectedSlotId) || null}
                    addArmed={addArmed} setAddArmed={setAddArmed} patchLocal={patchSlotLocal} save={saveSlot}
                    duplicate={duplicateSlot} remove={deleteSlot} changePlan={changePlan} resetPlan={resetPlan} hasCustomPlan={!!settings.plan_path} />
                ) : (
                  <>
                    {selected ? (
                      <VesselCard t={t} lang={lang} v={selected} state={stateOf(selected)} code={codeOf(selected)} photoUrl={photoUrl}
                        isAdmin={isAdmin} moving={movingId === selected.id}
                        move={activeMoves.find((m) => m.vessel_id === selected.id) || null}
                        onLaunch={() => setModal({ type: "launch", vesselId: selected.id })} onReturned={markReturned}
                        onMove={() => setMovingId(movingId === selected.id ? null : selected.id)}
                        onUnassign={() => moveVessel(selected, null)} onToggleWork={() => toggleWork(selected)}
                        onAway={() => setAway(selected)} onBack={() => bringBack(selected)}
                        awaySince={history.find((h) => h.vessel_id === selected.id && h.action === "Αποχώρηση από τον χώρο")?.created_at || null}
                        onEdit={() => setModal({ type: "vessel", vessel: selected })} onDelete={() => setModal({ type: "delete", vessel: selected })}
                        onClose={() => { setSelectedId(null); setMovingId(null); }} />
                    ) : (
                      <div className="card pad"><p className="muted">{t.selectHint}</p><p className="muted small">{t.dragHint}</p></div>
                    )}
                    {unassigned.length > 0 && (
                      <div className="card pad">
                        <h2>{t.noSlot} · {unassigned.length}</h2>
                        <div className="list">
                          {unassigned.map((v) => (
                            <button key={v.id} type="button" className={"list-row" + (selectedId === v.id ? " on" : "")} onClick={() => { setSelectedId(v.id); setMovingId(v.id); }}>
                              <strong>{v.name}</strong><span className="muted">{v.owner || ""}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {activeMoves.length > 0 && (
                      <div className="card pad">
                        <h2>{t.waterNow}</h2>
                        <div className="list">
                          {activeMoves.map((m) => (
                            <div key={m.id} className="list-static">
                              <strong>{m.vessel_name}</strong>
                              <span className="muted">{t.since} {isTodayStr(m.out_time || m.created_at) ? fmtTime(m.out_time || m.created_at, lang) : fmtDT(m.out_time || m.created_at, lang)}</span>
                              <span className="muted push">{m.expected_return || ""}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </aside>
            </div>
          </>
        )}

        {loaded && view === "water" && (
          <WaterView t={t} lang={lang} active={activeMoves} returned={returnedMoves} onReturned={markReturned} onNew={() => setModal({ type: "launch", vesselId: "" })} />
        )}
        {loaded && view === "vessels" && (
          <VesselsView t={t} vessels={vessels} stateOf={stateOf} codeOf={codeOf} counts={counts} isAdmin={isAdmin}
            onOpen={openVessel} onNew={() => setModal({ type: "vessel", vessel: null })}
            onEdit={(v) => setModal({ type: "vessel", vessel: v })} onDelete={(v) => setModal({ type: "delete", vessel: v })} onExport={exportExcel} />
        )}
        {loaded && view === "history" && <HistoryView t={t} lang={lang} history={history} onExport={exportExcel} />}
        {loaded && view === "overview" && (
          <OverviewView t={t} lang={lang} counts={counts} unassigned={unassigned.length} freeSlots={slots.length - occupied.size} slotsTotal={slots.length}
            history={history} urgent={vessels.filter((v) => v.urgent && v.status !== "away")} codeOf={codeOf} onOpen={openVessel} />
        )}
        {loaded && view === "users" && isAdmin && <UsersView t={t} users={users} meId={me.user_id} setRole={setRole} />}
      </main>

      <nav className="tabbar" aria-label="Menu">
        {nav.map(([id, label]) => (
          <button key={id} type="button" className={"tab" + (view === id ? " active" : "")} aria-current={view === id ? "page" : undefined}
            onClick={() => { if (editMode) leaveEdit(); setView(id); }}>
            <Icon name={id} size={22} /><span>{label}</span>
          </button>
        ))}
      </nav>

      {modal?.type === "vessel" && <VesselForm t={t} vessel={modal.vessel} onSave={saveVessel} onClose={() => setModal(null)} notify={notify} />}
      {modal?.type === "launch" && (
        <LaunchForm t={t} vessels={vessels.filter((v) => !waterIds.has(v.id) && v.status !== "away")} vesselId={modal.vesselId} onSave={launch} onClose={() => setModal(null)} />
      )}
      {modal?.type === "delete" && (
        <Modal title={`${t.del}: ${modal.vessel.name}`} onClose={() => setModal(null)}
          footer={<><button type="button" className="btn" onClick={() => setModal(null)}>{t.cancel}</button><button type="button" className="btn danger-solid" onClick={() => deleteVessel(modal.vessel)}>{t.yesDelete}</button></>}>
          <p>{t.confirmDelete}</p>
        </Modal>
      )}
    </div>
  );
}

const isTodayStr = (d) => !!d && new Date(d).toDateString() === new Date().toDateString();

function StatePill({ t, state }) {
  return <span className={"pill " + state}>{state === "away" ? t.away : state === "water" ? t.inWater : state === "work" ? t.work : t.berth}</span>;
}

/* ── Κάρτα σκάφους ───────────────────────────────────────────────────────── */
function VesselCard({ t, lang, v, state, code, photoUrl, isAdmin, moving, move, onLaunch, onReturned, onMove, onUnassign, onToggleWork, onAway, onBack, awaySince, onEdit, onDelete, onClose }) {
  return (
    <div className="card pad vessel-card">
      <div className="photo">{photoUrl ? <img src={photoUrl} alt={v.name} /> : <span>{t.noPhoto}</span>}</div>
      <div className="row wrap">
        <h2 className="vessel-name">{v.name}</h2>
        <StatePill t={t} state={state} />
        {v.urgent && <span className="pill urgent">{t.urgent}</span>}
        <button type="button" className="icon-btn plain push" aria-label={t.cancel} onClick={onClose}><Icon name="close" /></button>
      </div>
      <dl className="facts">
        <div><dt>{t.slot}</dt><dd>{state === "away" ? "—" : code || t.noSlot}</dd></div>
        <div><dt>{t.owner}</dt><dd>{v.owner || "—"}</dd></div>
        <div><dt>{t.trailerPlate}</dt><dd>{v.trailer_plate || "—"}</dd></div>
        <div><dt>{t.registry}</dt><dd>{v.registry || "—"}</dd></div>
      </dl>
      {v.notes && <p className="muted small">{v.notes}</p>}
      {move && <p className="muted small">{t.since} {fmtDT(move.out_time || move.created_at, lang)}{move.expected_return ? ` · ${t.expectedReturn}: ${move.expected_return}` : ""}</p>}
      {state === "away" ? (
        <>
          <p className="note">{t.awayNote}{awaySince ? ` ${t.awaySince} ${fmtDT(awaySince, lang)}` : ""}</p>
          <button type="button" className="btn primary big" onClick={onBack}>{t.bringBack}</button>
        </>
      ) : (
        <>
          {state === "water"
            ? <button type="button" className="btn accent big" onClick={() => onReturned(move)}>{t.returned}</button>
            : <button type="button" className="btn accent big" onClick={onLaunch}>{t.launch}</button>}
          <div className="row wrap">
            <button type="button" className={"btn grow" + (moving ? " primary" : "")} onClick={onMove}>{moving ? t.cancel : t.move}</button>
            <button type="button" className="btn grow" onClick={onToggleWork}>{v.status === "work" ? t.unmarkWork : t.markWork}</button>
          </div>
          {code && <button type="button" className="btn" onClick={onUnassign}>{t.removeFromSlot}</button>}
          {state !== "water" && <button type="button" className="btn" onClick={onAway}>{t.markAway}</button>}
        </>
      )}
      {isAdmin && (
        <div className="row">
          <button type="button" className="btn grow" onClick={onEdit}>{t.edit}</button>
          <button type="button" className="btn grow danger" onClick={onDelete}>{t.del}</button>
        </div>
      )}
    </div>
  );
}

/* ── Πάνελ επεξεργασίας θέσεων ───────────────────────────────────────────── */
function SlotPanel({ t, slot, occupiedBy, addArmed, setAddArmed, patchLocal, save, duplicate, remove, changePlan, resetPlan, hasCustomPlan }) {
  const fileRef = useRef(null);
  const [code, setCode] = useState("");
  useEffect(() => { setCode(slot?.code || ""); }, [slot?.id, slot?.code]);
  const commitCode = () => { const c = code.trim(); if (slot && c && c !== slot.code) save(slot.id, { code: c }); else setCode(slot?.code || ""); };
  const num = (key, min, max, step) => (
    <input className="input" type="number" min={min} max={max} step={step} value={slot[key]}
      onChange={(e) => patchLocal(slot.id, { [key]: Number(e.target.value) })}
      onBlur={(e) => { const n = Math.min(max, Math.max(min, Number(e.target.value) || min)); save(slot.id, { [key]: n }); }} />
  );
  return (
    <>
      <div className="card pad">
        <h2>{t.editSlots}</h2>
        <button type="button" className={"btn big" + (addArmed ? " accent" : " primary")} onClick={() => setAddArmed(!addArmed)}>{addArmed ? t.cancel : t.newSlot}</button>
        <p className="muted small">{addArmed ? t.newSlotHint : t.slotPick}</p>
      </div>
      {slot && (
        <div className="card pad">
          <Field label={t.slotCode}>
            <input className="input" value={code} onChange={(e) => setCode(e.target.value)} onBlur={commitCode} onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }} />
          </Field>
          <Field label={`${t.angle}: ${Math.round(slot.angle)}°`}>
            <input type="range" min="-180" max="180" step="1" value={slot.angle}
              onChange={(e) => patchLocal(slot.id, { angle: Number(e.target.value) })}
              onPointerUp={(e) => save(slot.id, { angle: Number(e.target.value) })}
              onKeyUp={(e) => save(slot.id, { angle: Number(e.target.value) })} />
          </Field>
          <div className="row">
            <Field label={t.length}>{num("length", 20, 200, 1)}</Field>
            <Field label={t.width}>{num("width", 8, 80, 1)}</Field>
          </div>
          {occupiedBy && <p className="muted small">{t.vessel}: {occupiedBy.name}</p>}
          <div className="row">
            <button type="button" className="btn grow" onClick={() => duplicate(slot)}>{t.duplicate}</button>
            <button type="button" className="btn grow danger" onClick={() => remove(slot)}>{t.del}</button>
          </div>
        </div>
      )}
      <div className="card pad">
        <h2>{t.changePlan}</h2>
        <p className="muted small">{t.planNote}</p>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { changePlan(e.target.files[0]); e.target.value = ""; }} />
        <div className="row">
          <button type="button" className="btn grow" onClick={() => fileRef.current.click()}>{t.changePlan}</button>
          {hasCustomPlan && <button type="button" className="btn grow" onClick={resetPlan}>{t.defaultPlan}</button>}
        </div>
      </div>
    </>
  );
}

/* ── Στο νερό ────────────────────────────────────────────────────────────── */
function WaterView({ t, lang, active, returned, onReturned, onNew }) {
  return (
    <>
      <div className="page-head"><h1>{t.navWater}</h1><button type="button" className="btn accent" onClick={onNew}>{t.launchTitle}</button></div>
      <section className="card">
        <h2 className="card-title">{t.waterNow} · {active.length}</h2>
        {active.length === 0 ? <p className="empty">{t.noneInWater}</p> : (
          <div className="table-wrap"><table className="tbl">
            <thead><tr><th>{t.vessel}</th><th>{t.owner}</th><th>{t.outTime}</th><th>{t.expectedReturn}</th><th>{t.notes}</th><th><span className="sr-only">{t.actions}</span></th></tr></thead>
            <tbody>{active.map((m) => (
              <tr key={m.id}>
                <td><strong>{m.vessel_name}</strong></td><td>{m.owner || "—"}</td>
                <td>{isTodayStr(m.out_time || m.created_at) ? fmtTime(m.out_time || m.created_at, lang) : fmtDT(m.out_time || m.created_at, lang)}</td>
                <td>{m.expected_return || "—"}</td><td>{m.notes || "—"}</td>
                <td className="right"><button type="button" className="btn small primary" onClick={() => onReturned(m)}>{t.returned}</button></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </section>
      {returned.length > 0 && (
        <section className="card">
          <h2 className="card-title">{t.returnedToday} · {returned.length}</h2>
          <div className="table-wrap"><table className="tbl">
            <thead><tr><th>{t.vessel}</th><th>{t.owner}</th><th>{t.outTime}</th><th>{t.returnTime}</th></tr></thead>
            <tbody>{returned.map((m) => (
              <tr key={m.id}><td><strong>{m.vessel_name}</strong></td><td>{m.owner || "—"}</td><td>{fmtDT(m.out_time || m.created_at, lang)}</td><td>{fmtTime(m.returned_time, lang)}</td></tr>
            ))}</tbody>
          </table></div>
        </section>
      )}
    </>
  );
}

/* ── Λίστα σκαφών ────────────────────────────────────────────────────────── */
function VesselsView({ t, vessels, stateOf, codeOf, counts, isAdmin, onOpen, onNew, onEdit, onDelete, onExport }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const rows = vessels.filter((v) => {
    const s = q.trim().toLowerCase();
    const hit = !s || [v.name, v.owner, v.trailer_plate, v.registry, codeOf(v)].some((x) => (x || "").toLowerCase().includes(s));
    return hit && (filter === "all" ? stateOf(v) !== "away" : stateOf(v) === filter);
  });
  return (
    <>
      <div className="page-head">
        <h1>{t.navVessels}</h1>
        <label className="searchbox"><Icon name="search" size={16} /><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.search} aria-label={t.search} /></label>
        <button type="button" className="btn" onClick={onExport}>{t.exportExcel}</button>
        {isAdmin && <button type="button" className="btn primary" onClick={onNew}>{t.newVessel}</button>}
      </div>
      <div className="chips">
        {[["all", t.inYard], ["berth", t.berth], ["water", t.inWater], ["work", t.work], ["away", t.away]].map(([k, label]) => (
          <button key={k} type="button" className={"chip" + (filter === k ? " on" : "")} onClick={() => setFilter(k)}>{label} · {counts[k]}</button>
        ))}
      </div>
      <section className="card">
        {rows.length === 0 ? <p className="empty">{vessels.length === 0 ? t.noVessels : t.noResults}</p> : (
          <div className="table-wrap"><table className="tbl">
            <thead><tr><th>{t.vessel}</th><th>{t.slot}</th><th>{t.status}</th><th>{t.owner}</th><th>{t.trailerPlate}</th><th>{t.registry}</th><th><span className="sr-only">{t.actions}</span></th></tr></thead>
            <tbody>{rows.map((v) => (
              <tr key={v.id}>
                <td><button type="button" className="link strong" onClick={() => onOpen(v.id)}>{v.name}</button>{v.urgent && <span className="pill urgent gap">{t.urgent}</span>}</td>
                <td>{stateOf(v) === "away" ? "—" : codeOf(v) || <span className="muted">{t.noSlot}</span>}</td>
                <td><StatePill t={t} state={stateOf(v)} /></td>
                <td>{v.owner || "—"}</td><td>{v.trailer_plate || "—"}</td><td>{v.registry || "—"}</td>
                <td className="right nowrap">{isAdmin && <><button type="button" className="btn small" onClick={() => onEdit(v)}>{t.edit}</button> <button type="button" className="btn small danger" onClick={() => onDelete(v)}>{t.del}</button></>}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </section>
      <p className="muted small">{t.shown} {rows.length} {t.of} {vessels.length}</p>
    </>
  );
}

/* ── Ιστορικό ────────────────────────────────────────────────────────────── */
function HistoryView({ t, lang, history, onExport }) {
  const [q, setQ] = useState("");
  const s = q.trim().toLowerCase();
  const rows = history.filter((h) => !s || [h.vessel_name, h.action, h.details, h.user_email].some((x) => (x || "").toLowerCase().includes(s)));
  return (
    <>
      <div className="page-head">
        <h1>{t.navHistory}</h1>
        <label className="searchbox"><Icon name="search" size={16} /><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.search} aria-label={t.search} /></label>
        <button type="button" className="btn" onClick={onExport}>{t.exportExcel}</button>
      </div>
      <section className="card">
        {rows.length === 0 ? <p className="empty">{history.length === 0 ? t.noHistory : t.noResults}</p> : (
          <div className="table-wrap"><table className="tbl">
            <thead><tr><th>{t.date}</th><th>{t.vessel}</th><th>{t.action}</th><th>{t.details}</th><th>{t.user}</th></tr></thead>
            <tbody>{rows.map((h) => (
              <tr key={h.id}><td className="nowrap">{fmtDT(h.created_at, lang)}</td><td><strong>{h.vessel_name || "—"}</strong></td><td>{h.action}</td><td>{h.details || "—"}</td><td className="muted">{h.user_email}</td></tr>
            ))}</tbody>
          </table></div>
        )}
      </section>
    </>
  );
}

/* ── Επισκόπηση ──────────────────────────────────────────────────────────── */
function OverviewView({ t, lang, counts, unassigned, freeSlots, slotsTotal, history, urgent, codeOf, onOpen }) {
  const tiles = [[t.total, counts.all], [t.berth, counts.berth], [t.inWater, counts.water], [t.work, counts.work], [t.noSlot, unassigned], [t.freeSlots, `${freeSlots} / ${slotsTotal}`]];
  return (
    <>
      <div className="page-head"><h1>{t.navOverview}</h1></div>
      <div className="tiles">{tiles.map(([label, val]) => <div key={label} className="card tile"><strong>{val}</strong><span>{label}</span></div>)}</div>
      {urgent.length > 0 && (
        <section className="card pad">
          <h2>{t.needsAttention}</h2>
          <div className="list">{urgent.map((v) => (
            <button key={v.id} type="button" className="list-row" onClick={() => onOpen(v.id)}><strong>{v.name}</strong><span className="muted">{codeOf(v) || t.noSlot}</span><span className="muted push">{v.notes || ""}</span></button>
          ))}</div>
        </section>
      )}
      <section className="card pad">
        <h2>{t.recent}</h2>
        {history.length === 0 ? <p className="muted">{t.noHistory}</p> : (
          <div className="list">{history.slice(0, 10).map((h) => (
            <div key={h.id} className="list-static"><strong>{h.vessel_name || "—"}</strong><span>{h.action}{h.details ? ` · ${h.details}` : ""}</span><span className="muted push">{fmtDT(h.created_at, lang)}</span></div>
          ))}</div>
        )}
      </section>
    </>
  );
}

/* ── Χρήστες ─────────────────────────────────────────────────────────────── */
function UsersView({ t, users, meId, setRole }) {
  const pending = users.filter((u) => u.role === "pending");
  const members = users.filter((u) => u.role !== "pending");
  return (
    <>
      <div className="page-head"><h1>{t.navUsers}</h1></div>
      {pending.length > 0 && (
        <section className="card pad">
          <h2>{t.pendingUsers} · {pending.length}</h2>
          <div className="list">{pending.map((u) => (
            <div key={u.user_id} className="list-static">
              <strong>{u.full_name || u.email}</strong><span className="muted">{u.email}</span>
              <button type="button" className="btn small primary push" onClick={() => setRole(u, "employee")}>{t.approve}</button>
            </div>
          ))}</div>
        </section>
      )}
      <section className="card">
        <h2 className="card-title">{t.members} · {members.length}</h2>
        <div className="table-wrap"><table className="tbl">
          <thead><tr><th>{t.fullName}</th><th>{t.email}</th><th>{t.role}</th></tr></thead>
          <tbody>{members.map((u) => (
            <tr key={u.user_id}>
              <td><strong>{u.full_name || "—"}</strong>{u.user_id === meId && <span className="muted"> ({t.you})</span>}</td>
              <td>{u.email || "—"}</td>
              <td>
                <select className="input compact" value={u.role} disabled={u.user_id === meId} aria-label={t.role} onChange={(e) => setRole(u, e.target.value)}>
                  <option value="admin">{t.admin}</option><option value="employee">{t.employee}</option><option value="pending">{t.noAccess}</option>
                </select>
              </td>
            </tr>
          ))}</tbody>
        </table></div>
      </section>
    </>
  );
}

/* ── Παράθυρα ────────────────────────────────────────────────────────────── */
function Modal({ title, children, footer, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head"><h2>{title}</h2><button type="button" className="icon-btn plain" aria-label="Close" onClick={onClose}><Icon name="close" /></button></div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

function VesselForm({ t, vessel, onSave, onClose, notify }) {
  const [form, setForm] = useState({
    id: vessel?.id || null, name: vessel?.name || "", trailer_plate: vessel?.trailer_plate || "", registry: vessel?.registry || "",
    owner: vessel?.owner || "", notes: vessel?.notes || "", urgent: !!vessel?.urgent, photo_path: vessel?.photo_path || null,
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function pick(e) {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { notify(t.photoTooBig, "error"); return; }
    setFile(f); setPreview(URL.createObjectURL(f));
  }
  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setBusy(true);
    await onSave(form, file);
    setBusy(false);
  }
  return (
    <Modal title={vessel ? t.editVessel : t.newVessel} onClose={onClose}
      footer={<><button type="button" className="btn" onClick={onClose}>{t.cancel}</button><button type="submit" form="vessel-form" className="btn primary" disabled={busy || !form.name.trim()}>{busy ? t.wait : vessel ? t.save : t.add}</button></>}>
      <form id="vessel-form" className="form" onSubmit={submit}>
        <Field label={t.name + " *"}><input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} required autoFocus /></Field>
        <div className="grid2">
          <Field label={t.owner}><input className="input" value={form.owner} onChange={(e) => set("owner", e.target.value)} /></Field>
          <Field label={t.trailerPlate}><input className="input" value={form.trailer_plate} onChange={(e) => set("trailer_plate", e.target.value)} /></Field>
          <Field label={t.registry}><input className="input" value={form.registry} onChange={(e) => set("registry", e.target.value)} /></Field>
          <div className="field">
            <span className="field-label">{t.photo}</span>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={pick} />
            <button type="button" className="btn" onClick={() => fileRef.current.click()}>{file ? file.name : t.choosePhoto}</button>
          </div>
        </div>
        {preview && <img className="preview" src={preview} alt="" />}
        <Field label={t.notes}><textarea className="input" rows="3" value={form.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
        <label className="check"><input type="checkbox" checked={form.urgent} onChange={(e) => set("urgent", e.target.checked)} /><span>{t.urgent}</span></label>
      </form>
    </Modal>
  );
}

function LaunchForm({ t, vessels, vesselId, onSave, onClose }) {
  const [id, setId] = useState(vesselId || "");
  const [expected, setExpected] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    if (!id) return;
    setBusy(true); await onSave(id, expected.trim(), notes.trim()); setBusy(false);
  }
  return (
    <Modal title={t.launchTitle} onClose={onClose}
      footer={<><button type="button" className="btn" onClick={onClose}>{t.cancel}</button><button type="submit" form="launch-form" className="btn accent" disabled={busy || !id}>{busy ? t.wait : t.launch}</button></>}>
      <form id="launch-form" className="form" onSubmit={submit}>
        <Field label={t.vessel}>
          <select className="input" value={id} onChange={(e) => setId(e.target.value)} required>
            <option value="">{t.chooseVessel}</option>
            {vessels.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </Field>
        <Field label={t.expectedReturn}><input className="input" value={expected} onChange={(e) => setExpected(e.target.value)} placeholder={t.returnPlaceholder} /></Field>
        <Field label={t.notes}><textarea className="input" rows="2" value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      </form>
    </Modal>
  );
}

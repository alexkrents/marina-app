import { useEffect, useMemo, useRef, useState } from "react";

// Περίγραμμα θέσης σε σχήμα σκάφους, με την πλώρη προς τα δεξιά.
export function slotPath(L, W) {
  const a = L / 2, b = W / 2;
  return `M${-a + 3},${-b} L${L * 0.12},${-b} Q${L * 0.4},${-b} ${a},0 Q${L * 0.4},${b} ${L * 0.12},${b} L${-a + 3},${b} Q${-a},${b} ${-a},${b - 3} L${-a},${-b + 3} Q${-a},${-b} ${-a + 3},${-b} Z`;
}

const COLORS = {
  berth: { fill: "#0B2545", text: "#FFFFFF", stroke: "#0B2545", dash: null },
  water: { fill: "#FFFFFF", text: "#1D4E89", stroke: "#1D4E89", dash: "4 3" },
  work: { fill: "#FFE8D6", text: "#8A3A00", stroke: "#C2500A", dash: null },
};

export default function MapView({
  plan, slots, vessels, isVisible, stateOf, selectedId, onSelectVessel, onMoveVessel, movingVessel,
  editMode, addArmed, selectedSlotId, onSelectSlot, onAddSlot, onUpdateSlot, t,
}) {
  const svgRef = useRef(null);
  const drag = useRef(null);
  const [view, setView] = useState({ cx: plan.w / 2, cy: plan.h / 2, w: plan.w });
  const [box, setBox] = useState({ w: 800, ar: plan.w / plan.h }); // πλάτος σε pixel και αναλογία του χώρου του χάρτη
  const fitted = useRef("");
  const [ghost, setGhost] = useState(null);
  const [slotDrag, setSlotDrag] = useState(null);

  // Όλη η κάτοψη στον διαθέσιμο χώρο. Σε στενή οθόνη ξεκινά πιο κοντά, για να διαβάζονται τα ονόματα.
  function fitView(ar, close) {
    const par = plan.w / plan.h;
    let w = ar >= par ? plan.h * ar : plan.w;
    if (close && ar < par * 0.8) w = Math.max(plan.w * 0.62, plan.h * ar);
    return { cx: plan.w / 2, cy: plan.h / 2, w };
  }

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const measure = () => {
      const r = svg.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const ar = r.width / r.height;
      setBox({ w: r.width, ar });
      const key = `${plan.url}|${plan.w}|${plan.h}`;
      if (fitted.current !== key) { fitted.current = key; setView(fitView(ar, true)); }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(svg);
    return () => ro.disconnect();
  }, [plan.url, plan.w, plan.h]);

  const upp = view.w / box.w; // μονάδες κάτοψης ανά pixel οθόνης
  const vbH = view.w / box.ar;
  const viewBox = `${view.cx - view.w / 2} ${view.cy - vbH / 2} ${view.w} ${vbH}`;

  const bySlot = useMemo(() => {
    const m = new Map();
    vessels.forEach((v) => { if (v.slot_id) m.set(v.slot_id, v); });
    return m;
  }, [vessels]);

  function toPlan(e) {
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    return { x: p.x, y: p.y };
  }

  function zoomed(v, p, factor) {
    const maxW = fitView(box.ar, false).w * 1.15;
    const w = Math.min(maxW, Math.max(plan.w / 10, v.w / factor));
    const k = w / v.w;
    return { cx: p.x - (p.x - v.cx) * k, cy: p.y - (p.y - v.cy) * k, w };
  }
  const zoomBy = (factor) => setView((v) => zoomed(v, { x: v.cx, y: v.cy }, factor));
  const resetView = () => setView(fitView(box.ar, false));

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e) => {
      e.preventDefault();
      const p = toPlan(e);
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      setView((v) => zoomed(v, p, factor));
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [plan.w, plan.h, box.ar]);

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    const p = toPlan(e);
    const vEl = e.target.closest ? e.target.closest("[data-vessel]") : null;
    const sEl = e.target.closest ? e.target.closest("[data-slot]") : null;
    const d = { sx: e.clientX, sy: e.clientY, moved: false, view0: view, upp0: upp, kind: "pan" };
    if (editMode) {
      if (sEl) {
        const s = slots.find((x) => x.id === sEl.dataset.slot);
        if (s) { d.kind = "slot"; d.id = s.id; d.off = { x: p.x - s.x, y: p.y - s.y }; onSelectSlot(s.id); }
      }
    } else if (vEl) {
      d.kind = "vessel"; d.id = vEl.dataset.vessel;
    } else if (sEl) {
      d.kind = "slotClick"; d.id = sEl.dataset.slot;
    }
    drag.current = d;
    try { svgRef.current.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  }

  function onPointerMove(e) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) < 5) return;
    d.moved = true;
    if (d.kind === "vessel") {
      setGhost({ id: d.id, ...toPlan(e) });
    } else if (d.kind === "slot") {
      const p = toPlan(e);
      setSlotDrag({ id: d.id, x: p.x - d.off.x, y: p.y - d.off.y });
    } else {
      setView({ ...d.view0, cx: d.view0.cx - dx * d.upp0, cy: d.view0.cy - dy * d.upp0 });
    }
  }

  function nearestFreeSlot(p, vesselId) {
    let best = null, bestD = 48;
    slots.forEach((s) => {
      const occ = bySlot.get(s.id);
      if (occ && occ.id !== vesselId) return;
      const dist = Math.hypot(s.x - p.x, s.y - p.y);
      if (dist < bestD) { best = s; bestD = dist; }
    });
    return best;
  }

  function onPointerUp(e) {
    const d = drag.current;
    drag.current = null;
    try { svgRef.current.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    if (!d) return;
    const p = toPlan(e);
    if (d.kind === "vessel") {
      setGhost(null);
      const v = vessels.find((x) => x.id === d.id);
      if (!v) return;
      if (!d.moved) { onSelectVessel(v.id); return; }
      const target = nearestFreeSlot(p, v.id);
      if (target && target.id !== v.slot_id) onMoveVessel(v, target.id);
    } else if (d.kind === "slot") {
      if (d.moved) onUpdateSlot(d.id, { x: Math.round((p.x - d.off.x) * 10) / 10, y: Math.round((p.y - d.off.y) * 10) / 10 });
      setSlotDrag(null);
    } else if (d.kind === "slotClick") {
      if (d.moved) return;
      const occ = bySlot.get(d.id);
      if (occ) onSelectVessel(occ.id);
      else if (movingVessel) onMoveVessel(movingVessel, d.id);
    } else if (!d.moved) {
      if (editMode) { if (addArmed) onAddSlot({ x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 }); else onSelectSlot(null); }
      else onSelectVessel(null);
    }
  }

  const fs = Math.max(10, Math.min(14, 10.5 * upp));
  const hintTarget = !editMode && (ghost || movingVessel);

  return (
    <div className="map-wrap">
      <svg
        ref={svgRef}
        className={"map-svg" + (addArmed && editMode ? " adding" : "")}
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="img"
        aria-label={t.navMap}
      >
        <image href={plan.url} x="0" y="0" width={plan.w} height={plan.h} preserveAspectRatio="none" />

        {slots.map((s0) => {
          const s = slotDrag && slotDrag.id === s0.id ? { ...s0, x: slotDrag.x, y: slotDrag.y } : s0;
          const occ = bySlot.get(s.id);
          const sel = editMode && selectedSlotId === s.id;
          const free = !occ;
          const target = hintTarget && free;
          return (
            <g key={s.id} data-slot={s.id} style={{ cursor: editMode ? "move" : free && movingVessel ? "pointer" : "default" }}>
              <path
                d={slotPath(s.length, s.width)}
                transform={`translate(${s.x} ${s.y}) rotate(${s.angle})`}
                fill={sel ? "#FFE8D6" : target ? "#FFF3E8" : "#FFFFFF"}
                stroke={sel || target ? "#C2500A" : "#7F92AE"}
                strokeWidth={sel ? 2 : 1.1}
                strokeLinejoin="round"
              />
              {(free || editMode) && (
                <text x={s.x} y={s.y + 2.4} fontSize="6.800" fontWeight="700" fill={sel ? "#8A3A00" : "#7B8CA6"} textAnchor="middle" style={{ pointerEvents: "none", userSelect: "none" }}>
                  {s.code}
                </text>
              )}
            </g>
          );
        })}

        {!editMode && vessels.map((v) => {
          const s = slots.find((x) => x.id === v.slot_id);
          if (!s || (isVisible && !isVisible(v))) return null;
          const dragging = ghost && ghost.id === v.id;
          const c = COLORS[stateOf(v)];
          const w = Math.max(30, v.name.length * fs * 0.6 + 14);
          const h = fs + 9;
          const pos = dragging ? ghost : s;
          return (
            <g key={v.id} data-vessel={v.id} transform={`translate(${pos.x} ${pos.y})`} style={{ cursor: "grab" }} opacity={dragging ? 0.85 : 1}>
              {selectedId === v.id && <rect x={-w / 2 - 4} y={-h / 2 - 4} width={w + 8} height={h + 8} rx={h / 2 + 4} fill="rgba(194,80,10,0.4)" />}
              <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={c.fill} stroke={c.stroke} strokeWidth="1.5" strokeDasharray={c.dash || undefined} />
              <text y={fs * 0.35} fontSize={fs} fontWeight="600" fill={c.text} textAnchor="middle" style={{ pointerEvents: "none", userSelect: "none" }}>
                {v.name}
              </text>
              {v.urgent && <circle cx={w / 2 - 3} cy={-h / 2 + 2} r="4" fill="#C81E1E" stroke="#FFFFFF" strokeWidth="1.2" />}
            </g>
          );
        })}
      </svg>

      <div className="map-zoom">
        <button type="button" className="icon-btn" aria-label={t.zoomIn} onClick={() => zoomBy(1.3)}>+</button>
        <button type="button" className="icon-btn" aria-label={t.zoomOut} onClick={() => zoomBy(1 / 1.3)}>−</button>
        <button type="button" className="icon-btn" aria-label={t.zoomReset} title={t.zoomReset} onClick={resetView}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
        </button>
      </div>
    </div>
  );
}

// ProgramPage — single-day sacrament-meeting program editor

function StatusToggle({ status, onToggle, title }) {
  return (
    <button
      type="button"
      className="status-toggle"
      data-status={status}
      aria-label={title || "Toggle status"}
      title={
        status === "confirmed" ? "Confirmed — click to mark not confirmed" :
        status === "unconfirmed" ? "Not confirmed — click to mark confirmed" :
        "Empty — add an assignment"
      }
      onClick={onToggle}
    >
      {status === "confirmed" && <Icon name="check" size={14}/>}
    </button>
  );
}

function StatusSelect({ status, onChange }) {
  return (
    <select
      className="status-select"
      data-value={status === "confirmed" ? "confirmed" : "unconfirmed"}
      value={status === "confirmed" ? "confirmed" : "unconfirmed"}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="unconfirmed">Not confirmed</option>
      <option value="confirmed">Confirmed</option>
    </select>
  );
}

function AssignRow({ label, value, placeholder, status, onValue, onStatus }) {
  const effectiveStatus = !value ? "empty" : status;
  const toggle = () => {
    if (!value) return;
    onStatus(status === "confirmed" ? "unconfirmed" : "confirmed");
  };
  return (
    <div className="assign-row">
      <div className="assign-row__label">{label}</div>
      <input
        className="assign-row__input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onValue(e.target.value)}
      />
      <div style={{display:"inline-flex", alignItems:"center", justifyContent:"center"}}>
        <StatusToggle status={effectiveStatus} onToggle={toggle}/>
        <StatusSelect status={effectiveStatus} onChange={(v) => { if (value) onStatus(v); }}/>
      </div>
    </div>
  );
}

/* ============ Hymn picker: type # or title, opens a combobox ============ */
function HymnPicker({ label, value, suggestions, placeholder, onChange, onClear }) {
  // value: { number: null|int, title: "" }
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [focused, setFocused] = React.useState(-1);
  const ref = React.useRef(null);
  const inputRef = React.useRef(null);

  const hasValue = value && value.number;
  const display = hasValue
    ? `${value.number}  ·  ${value.title}`
    : "";

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onEsc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const q = query.trim().toLowerCase();
  const results = React.useMemo(() => {
    if (!q) {
      // Default list = category suggestions + top N
      const sugSet = new Set(suggestions || []);
      const sug = HYMNS.filter(h => sugSet.has(h.number));
      const rest = HYMNS.filter(h => !sugSet.has(h.number));
      return [...sug, ...rest].slice(0, 40);
    }
    if (/^\d+$/.test(q)) {
      const n = Number(q);
      return HYMNS.filter(h => String(h.number).startsWith(q)).slice(0, 40)
        .concat(HYMNS.filter(h => h.number === n && !String(h.number).startsWith(q)));
    }
    return HYMNS.filter(h => h.title.toLowerCase().includes(q)).slice(0, 40);
  }, [q, suggestions]);

  const pick = (h) => {
    onChange(h);
    setOpen(false);
    setQuery("");
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setFocused((i) => Math.min(i+1, results.length-1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setFocused((i) => Math.max(i-1, 0)); }
    else if (e.key === "Enter" && focused >= 0 && results[focused]) { e.preventDefault(); pick(results[focused]); }
  };

  return (
    <div className="hymn-row" ref={ref}>
      <div className="hymn-row__label">{label}</div>
      <div className="hymn-pick" style={{gridColumn: "2 / span 2"}}>
        <div className={"hymn-pick__btn" + (open ? " is-open" : "") + (hasValue ? " has-value" : "")}
          onClick={() => { setOpen(true); setTimeout(() => inputRef.current && inputRef.current.focus(), 0); }}>
          {hasValue ? (
            <>
              <span className="hymn-pick__num">{value.number}</span>
              <span className="hymn-pick__title">{value.title}</span>
              <button
                type="button"
                className="hymn-pick__clear"
                title="Clear"
                aria-label="Clear hymn"
                onClick={(e) => { e.stopPropagation(); onClear(); setQuery(""); }}
              >
                <Icon name="x" size={12}/>
              </button>
            </>
          ) : (
            <span className="hymn-pick__placeholder">{placeholder}</span>
          )}
          <span className="hymn-pick__caret"><Icon name="chevron-down" size={13}/></span>
        </div>
        {open && (
          <div className="hymn-pick__pop">
            <div className="hymn-pick__search">
              <input
                ref={inputRef}
                className="hymn-pick__input"
                placeholder="Search by number or title"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setFocused(0); }}
                onKeyDown={onKeyDown}
              />
            </div>
            {!q && suggestions && suggestions.length > 0 && (
              <div className="hymn-pick__section-label">Suggested</div>
            )}
            <div className="hymn-pick__list">
              {results.length === 0 && (
                <div className="hymn-pick__empty">No matches — try a different number or word.</div>
              )}
              {results.map((h, i) => (
                <button
                  key={h.number}
                  type="button"
                  className={"hymn-pick__item" + (focused === i ? " is-focused" : "") + (hasValue && h.number === value.number ? " is-selected" : "")}
                  onMouseEnter={() => setFocused(i)}
                  onClick={() => pick(h)}
                >
                  <span className="hymn-pick__item-num">{h.number}</span>
                  <span className="hymn-pick__item-title">{h.title}</span>
                  {hasValue && h.number === value.number && (
                    <Icon name="check" size={12}/>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============ Mid-item: rest hymn | musical number | none ============ */
function MidItem({ mode, setMode, restHymn, musical, setRestHymn, setMusical }) {
  return (
    <div className="mid-item">
      <div className="mid-item__head">
        <span className="mid-item__label">Between sacrament & speakers</span>
        <div className="seg" role="tablist">
          <button
            role="tab"
            className={mode === "rest" ? "is-on" : ""}
            onClick={() => setMode("rest")}
          >Rest hymn</button>
          <button
            role="tab"
            className={mode === "musical" ? "is-on" : ""}
            onClick={() => setMode("musical")}
          >Musical number</button>
          <button
            role="tab"
            className={mode === "none" ? "is-on" : ""}
            onClick={() => setMode("none")}
          >None</button>
        </div>
      </div>
      {mode === "rest" && (
        <HymnPicker
          label="Rest hymn"
          value={restHymn}
          suggestions={REST_SUGGESTIONS}
          placeholder="Pick a hymn"
          onChange={(h) => setRestHymn({ number: h.number, title: h.title })}
          onClear={() => setRestHymn({ number: null, title: "" })}
        />
      )}
      {mode === "musical" && (
        <div className="assign-row" style={{borderBottom: 0, paddingTop: 4, paddingBottom: 0}}>
          <div className="assign-row__label">Performer</div>
          <input
            className="assign-row__input"
            value={musical.performer}
            placeholder="e.g. Primary chorus"
            onChange={(e) => setMusical({ performer: e.target.value })}
          />
          <div/>
        </div>
      )}
      {mode === "none" && (
        <div className="mid-item__helper" style={{paddingLeft: 0, marginTop: 0}}>
          Nothing planned between the sacrament and speakers.
        </div>
      )}
    </div>
  );
}

/* ============ Speakers (reorderable) ============ */
function SpeakerList({ speakers, midMode, midLabel, onReorder }) {
  // Renders speakers PLUS a single placeholder row for the mid item if active.
  // The placeholder is pinned visually between the first and second speaker.
  // Drag-to-reorder using HTML5 drag events.
  const [draggingIdx, setDraggingIdx] = React.useState(null);
  const [overIdx, setOverIdx] = React.useState(null);

  const onDragStart = (i) => (e) => {
    setDraggingIdx(i);
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", String(i)); } catch (_) {}
  };
  const onDragOver = (i) => (e) => {
    e.preventDefault();
    setOverIdx(i);
  };
  const onDragEnd = () => { setDraggingIdx(null); setOverIdx(null); };
  const onDrop = (i) => (e) => {
    e.preventDefault();
    if (draggingIdx == null || draggingIdx === i) { onDragEnd(); return; }
    const next = [...speakers];
    const [moved] = next.splice(draggingIdx, 1);
    next.splice(i, 0, moved);
    onReorder(next);
    onDragEnd();
  };

  const move = (i, delta) => {
    const j = i + delta;
    if (j < 0 || j >= speakers.length) return;
    const next = [...speakers];
    [next[i], next[j]] = [next[j], next[i]];
    onReorder(next);
  };

  // Figure out where to show the placeholder: after the first speaker by default.
  const placeholderAt = speakers.length >= 1 ? 1 : 0;

  const rows = [];
  speakers.forEach((s, i) => {
    if (i === placeholderAt && midMode !== "none") {
      rows.push(
        <li key={"mid"} className="sp-row sp-row--mid" aria-label="Musical interlude">
          <div className="sp-row__num">♪</div>
          <div className="sp-row__who">
            <div className="sp-row__name" style={{fontFamily:"var(--font-serif)", fontStyle:"italic", fontWeight:500, color:"var(--bordeaux-deep)"}}>
              {midLabel}
            </div>
            <div className="sp-row__topic" style={{color:"var(--walnut-3)", fontStyle:"normal", fontFamily:"var(--font-mono)", fontSize:10, letterSpacing:".1em", textTransform:"uppercase"}}>
              Musical interlude
            </div>
          </div>
          <div/>
          <div/>
        </li>
      );
    }
    const isDragging = draggingIdx === i;
    const isOver = overIdx === i && draggingIdx !== null && draggingIdx !== i;
    rows.push(
      <li
        key={"s"+i}
        className={"sp-row sp-row--draggable" + (isDragging ? " is-dragging" : "") + (isOver ? " is-over" : "")}
        draggable
        onDragStart={onDragStart(i)}
        onDragOver={onDragOver(i)}
        onDragEnd={onDragEnd}
        onDrop={onDrop(i)}
      >
        <div className="sp-row__drag" title="Drag to reorder">
          <span className="sp-row__num">{String(i+1).padStart(2, "0")}</span>
          <span className="sp-row__grip" aria-hidden>⠿</span>
        </div>
        <div className="sp-row__who">
          <div className="sp-row__name">{s.name}</div>
          <div className="sp-row__topic">{s.topic || <span style={{color:"var(--walnut-3)", fontStyle:"normal"}}>No topic assigned</span>}</div>
        </div>
        <div className={"sp-row__state" + (s.state === "confirmed" ? " is-confirmed" : s.state === "invited" ? " is-invited" : "")}>
          {s.state}
        </div>
        <div className="sp-row__order" role="group" aria-label="Reorder speaker">
          <button className="sp-row__order-btn" title="Move up" onClick={() => move(i, -1)} disabled={i === 0}>▲</button>
          <button className="sp-row__order-btn" title="Move down" onClick={() => move(i, +1)} disabled={i === speakers.length - 1}>▼</button>
        </div>
      </li>
    );
  });
  // Placeholder goes at end if there are 0 speakers but midMode is active
  if (speakers.length === 0 && midMode !== "none") {
    rows.push(
      <li key="mid-only" className="sp-row sp-row--mid">
        <div className="sp-row__num">♪</div>
        <div className="sp-row__who">
          <div className="sp-row__name" style={{fontFamily:"var(--font-serif)", fontStyle:"italic", fontWeight:500, color:"var(--bordeaux-deep)"}}>{midLabel}</div>
          <div className="sp-row__topic" style={{color:"var(--walnut-3)", fontStyle:"normal", fontFamily:"var(--font-mono)", fontSize:10, letterSpacing:".1em", textTransform:"uppercase"}}>Musical interlude</div>
        </div>
        <div/>
        <div/>
      </li>
    );
  }

  return <ul className="speakers">{rows}</ul>;
}

function ProgramPage({ initial }) {
  const [prog, setProg] = React.useState(() => initial);

  const setNested = (group, key, v) => setProg({ ...prog, [group]: { ...prog[group], [key]: v } });
  const setRoot = (k, v) => setProg({ ...prog, [k]: v });

  // derived
  const needs = [];
  const unconfirmed = [];
  const assignments = [
    ["Opening prayer", prog.prayers.opening],
    ["Benediction", prog.prayers.closing],
    ["Chorister", prog.music.chorister],
    ["Pianist", prog.music.pianist],
    ["Sacrament bread", prog.sacrament.bread],
    ["Blesser 1", prog.sacrament.blesser1],
    ["Blesser 2", prog.sacrament.blesser2],
  ];
  assignments.forEach(([label, a]) => {
    if (!a.name) needs.push(`${label} — not assigned`);
    else if (a.status !== "confirmed") unconfirmed.push(`${label} — not confirmed`);
  });

  if (!prog.presiding) needs.push("Presiding authority");
  if (!prog.conducting) needs.push("Conducting");

  const speakersNeeded = Math.max(0, 2 - prog.speakers.length);
  if (speakersNeeded > 0) needs.unshift(`${speakersNeeded} more speaker${speakersNeeded===1?"":"s"} needed`);
  if (!prog.hymns.opening.number) needs.push("Opening hymn");
  if (!prog.hymns.sacrament.number) needs.push("Sacrament hymn");
  if (!prog.hymns.closing.number) needs.push("Closing hymn");
  if (prog.mid.mode === "rest" && !prog.mid.rest.number) needs.push("Rest hymn");
  if (prog.mid.mode === "musical" && !prog.mid.musical.performer) needs.push("Musical number — performer");

  const totalItems = assignments.length + 2 /*presiding/conducting*/ + 2 /*speakers count target*/ + 3 /*hymns*/ + (prog.mid.mode !== "none" ? 1 : 0);
  const done = Math.max(0, totalItems - needs.length - unconfirmed.length);
  const ready = needs.length === 0 && unconfirmed.length === 0;

  const railSections = [
    { id:"sec-overview",  label:"Approval", done: ready },
    { id:"sec-leaders",   label:"Leaders",
      done: Boolean(prog.presiding && prog.conducting) },
    { id:"sec-prayers",   label:"Prayers",
      done: prog.prayers.opening.name && prog.prayers.closing.name },
    { id:"sec-music",     label:"Music",
      done: prog.music.chorister.name && prog.music.pianist.name },
    { id:"sec-sacrament", label:"Sacrament",
      done: prog.sacrament.bread.name && prog.sacrament.blesser1.name && prog.sacrament.blesser2.name },
    { id:"sec-speakers",  label:"Speakers", count: prog.speakers.length,
      done: prog.speakers.length >= 2 },
    { id:"sec-hymns",     label:"Hymns & music",
      done: prog.hymns.opening.number && prog.hymns.sacrament.number && prog.hymns.closing.number },
    { id:"sec-notes",     label:"Announcements", done: true },
    { id:"sec-comments",  label:"Comments", count: prog.comments.length, done: true },
  ];

  const [activeRail, setActiveRail] = React.useState("sec-overview");
  React.useEffect(() => {
    const onScroll = () => {
      let current = railSections[0].id;
      for (const s of railSections) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top < 140) current = s.id;
      }
      setActiveRail(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [prog]);

  const dateLong = prog.date.toLocaleDateString("en-US", {
    weekday:"long", month:"long", day:"numeric", year:"numeric"
  });

  const midLabel =
    prog.mid.mode === "rest"
      ? (prog.mid.rest.number
          ? `Rest hymn · ${prog.mid.rest.number} — ${prog.mid.rest.title}`
          : "Rest hymn — pick a hymn")
      : prog.mid.mode === "musical"
        ? (prog.mid.musical.performer
            ? `Musical number · ${prog.mid.musical.performer}`
            : "Musical number — add performer")
        : "";

  return (
    <>
      <div className="topbar">
        <div className="topbar__brand">
          <img src="assets/logo-monogram.svg" alt=""/>
          <div className="topbar__brand-name">Steward</div>
        </div>
        <div className="topbar__spacer"/>
        <div className="topbar__avatar">ST</div>
      </div>

      <div className="prog-shell">
        <div>
          <button className="crumb" onClick={() => location.href='Schedule.html'}>
            ← Schedule
          </button>
          <div className="prog-head">
            <div className="prog-head__l">
              <div className="prog-head__eyebrow">Sacrament meeting · Program</div>
              <h1 className="prog-head__title">{dateLong}</h1>
              <div className="prog-head__sub">
                <span className="prog-head__pill">Regular</span>
              </div>
            </div>
            <div className="prog-head__r">
              <button className="icon-btn" title="Print program">
                <Icon name="printer" size={16}/>
              </button>
              <button className="icon-btn" title="More actions">
                <span style={{letterSpacing:"0.04em"}}>···</span>
              </button>
            </div>
          </div>

          {/* Approval */}
          <section id="sec-overview" className={"approval" + (ready ? " approval--ready" : "")}>
            <div className="approval__head">
              <span className="approval__mark">
                {ready ? <Icon name="check" size={12}/> : <Icon name="alert" size={12}/>}
                {ready ? "Ready for approval" : "Approval — draft"}
              </span>
              <span className="approval__meta">{done}/{totalItems} complete</span>
            </div>
            {!ready ? (
              <>
                <div className="approval__title">Still needed before approval</div>
                <ul className="approval__list">
                  {needs.slice(0, 10).map((n, i) => (
                    <li key={"n"+i}><span className="bullet"/>{n}</li>
                  ))}
                  {unconfirmed.slice(0, 4).map((n, i) => (
                    <li key={"u"+i}><span className="bullet" style={{borderStyle:"dashed"}}/>{n}</li>
                  ))}
                </ul>
                <div className="approval__foot">
                  <button className="btn" disabled={!ready}>Request approval</button>
                  <span style={{fontFamily:"var(--font-serif)", fontStyle:"italic", fontSize:13, color:"var(--walnut-3)"}}>
                    Bishop will be notified by email.
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="approval__title">All items assigned and confirmed.</div>
                <div className="approval__foot">
                  <button className="btn btn--success">
                    <Icon name="check" size={12}/> Request approval
                  </button>
                  <span style={{fontFamily:"var(--font-serif)", fontStyle:"italic", fontSize:13, color:"var(--walnut-3)"}}>
                    Bishop will be notified by email.
                  </span>
                </div>
              </>
            )}
          </section>

          {/* Leaders (presiding + conducting) */}
          <section id="sec-leaders" className="section">
            <div className="section__head">
              <span className="section__label">Leaders</span>
              <div className="status-legend">
                <span className="status-legend__item">
                  <span className="status-legend__dot status-legend__dot--empty"/> Empty
                </span>
                <span className="status-legend__item">
                  <span className="status-legend__dot"/> Not confirmed
                </span>
                <span className="status-legend__item">
                  <span className="status-legend__dot status-legend__dot--confirmed"/> Confirmed
                </span>
              </div>
            </div>
            <div className="assign-grid">
              <div className="assign-row">
                <div className="assign-row__label">Presiding</div>
                <input
                  className="assign-row__input"
                  value={prog.presiding}
                  placeholder="e.g. Bishop Reeves"
                  onChange={(e) => setRoot("presiding", e.target.value)}
                />
                <div/>
              </div>
              <div className="assign-row">
                <div className="assign-row__label">Conducting</div>
                <input
                  className="assign-row__input"
                  value={prog.conducting}
                  placeholder="e.g. Brother Tan"
                  onChange={(e) => setRoot("conducting", e.target.value)}
                />
                <div/>
              </div>
            </div>
          </section>

          {/* Prayers */}
          <section id="sec-prayers" className="section">
            <div className="section__head">
              <span className="section__label">Prayers</span>
            </div>
            <div className="assign-grid">
              <AssignRow
                label="Opening"
                value={prog.prayers.opening.name}
                status={prog.prayers.opening.status}
                placeholder="Who will give the opening prayer?"
                onValue={(v) => setNested("prayers", "opening", { ...prog.prayers.opening, name: v })}
                onStatus={(s) => setNested("prayers", "opening", { ...prog.prayers.opening, status: s })}
              />
              <AssignRow
                label="Benediction"
                value={prog.prayers.closing.name}
                status={prog.prayers.closing.status}
                placeholder="Who will give the benediction?"
                onValue={(v) => setNested("prayers", "closing", { ...prog.prayers.closing, name: v })}
                onStatus={(s) => setNested("prayers", "closing", { ...prog.prayers.closing, status: s })}
              />
            </div>
          </section>

          {/* Music */}
          <section id="sec-music" className="section">
            <div className="section__head">
              <span className="section__label">Music</span>
              <button className="section__helper" onClick={() => {
                setProg({
                  ...prog,
                  music: {
                    chorister: { name: "Sister Lindy Voss", status: "confirmed" },
                    pianist:   { name: "Brother Luke Haan", status: "confirmed" },
                  },
                });
              }}>Copy from last week</button>
            </div>
            <div className="assign-grid">
              <AssignRow
                label="Chorister"
                value={prog.music.chorister.name}
                status={prog.music.chorister.status}
                placeholder="Chorister name"
                onValue={(v) => setNested("music", "chorister", { ...prog.music.chorister, name: v })}
                onStatus={(s) => setNested("music", "chorister", { ...prog.music.chorister, status: s })}
              />
              <AssignRow
                label="Pianist"
                value={prog.music.pianist.name}
                status={prog.music.pianist.status}
                placeholder="Pianist name"
                onValue={(v) => setNested("music", "pianist", { ...prog.music.pianist, name: v })}
                onStatus={(s) => setNested("music", "pianist", { ...prog.music.pianist, status: s })}
              />
            </div>
          </section>

          {/* Sacrament */}
          <section id="sec-sacrament" className="section">
            <div className="section__head">
              <span className="section__label">Sacrament</span>
              <button className="section__helper" onClick={() => {
                setProg({
                  ...prog,
                  sacrament: {
                    bread:    { name: "Deacons quorum", status: "confirmed" },
                    blesser1: { name: "Priest · Eli Cowan", status: "unconfirmed" },
                    blesser2: { name: "Priest · Sam Jeppson", status: "unconfirmed" },
                  },
                });
              }}>Request from YM president</button>
            </div>
            <div className="assign-grid">
              <AssignRow
                label="Bread"
                value={prog.sacrament.bread.name}
                status={prog.sacrament.bread.status}
                placeholder="Quorum or individual"
                onValue={(v) => setNested("sacrament", "bread", { ...prog.sacrament.bread, name: v })}
                onStatus={(s) => setNested("sacrament", "bread", { ...prog.sacrament.bread, status: s })}
              />
              <div/>
              <AssignRow
                label="Blesser 1"
                value={prog.sacrament.blesser1.name}
                status={prog.sacrament.blesser1.status}
                placeholder="First blesser"
                onValue={(v) => setNested("sacrament", "blesser1", { ...prog.sacrament.blesser1, name: v })}
                onStatus={(s) => setNested("sacrament", "blesser1", { ...prog.sacrament.blesser1, status: s })}
              />
              <AssignRow
                label="Blesser 2"
                value={prog.sacrament.blesser2.name}
                status={prog.sacrament.blesser2.status}
                placeholder="Second blesser"
                onValue={(v) => setNested("sacrament", "blesser2", { ...prog.sacrament.blesser2, name: v })}
                onStatus={(s) => setNested("sacrament", "blesser2", { ...prog.sacrament.blesser2, status: s })}
              />
            </div>
          </section>

          {/* Speakers (reorderable) */}
          <section id="sec-speakers" className="section">
            <div className="section__head">
              <span className="section__label">Speakers</span>
              <span className="section__count">{prog.speakers.length}</span>
              <span style={{marginLeft: "auto", display: "inline-flex", gap: 10, alignItems:"center"}}>
                <span style={{fontFamily:"var(--font-serif)", fontStyle:"italic", fontSize:12.5, color:"var(--walnut-3)"}}>
                  Drag to reorder
                </span>
                <button className="section__helper" onClick={() => location.href="Schedule.html"}>
                  Edit on schedule →
                </button>
              </span>
            </div>
            {prog.speakers.length === 0 && prog.mid.mode === "none" ? (
              <div className="empty-note">No speakers yet. Assign from the schedule view.</div>
            ) : (
              <SpeakerList
                speakers={prog.speakers}
                midMode={prog.mid.mode}
                midLabel={midLabel}
                onReorder={(next) => setRoot("speakers", next)}
              />
            )}
          </section>

          {/* Hymns + musical number */}
          <section id="sec-hymns" className="section">
            <div className="section__head">
              <span className="section__label">Hymns & music</span>
            </div>
            <div className="hymns">
              <HymnPicker
                label="Opening"
                value={prog.hymns.opening}
                suggestions={OPENING_SUGGESTIONS}
                placeholder="Pick a hymn"
                onChange={(h) => setNested("hymns", "opening", { number: h.number, title: h.title })}
                onClear={() => setNested("hymns", "opening", { number: null, title: "" })}
              />
              <HymnPicker
                label="Sacrament"
                value={prog.hymns.sacrament}
                suggestions={SACRAMENT_NUMS}
                placeholder="Pick a sacrament hymn"
                onChange={(h) => setNested("hymns", "sacrament", { number: h.number, title: h.title })}
                onClear={() => setNested("hymns", "sacrament", { number: null, title: "" })}
              />
              <MidItem
                mode={prog.mid.mode}
                setMode={(m) => setNested("mid", "mode", m)}
                restHymn={prog.mid.rest}
                setRestHymn={(v) => setNested("mid", "rest", v)}
                musical={prog.mid.musical}
                setMusical={(v) => setNested("mid", "musical", v)}
              />
              <HymnPicker
                label="Closing"
                value={prog.hymns.closing}
                suggestions={CLOSING_SUGGESTIONS}
                placeholder="Pick a closing hymn"
                onChange={(h) => setNested("hymns", "closing", { number: h.number, title: h.title })}
                onClear={() => setNested("hymns", "closing", { number: null, title: "" })}
              />
            </div>
          </section>

          {/* Announcements */}
          <section id="sec-notes" className="section">
            <div className="section__head">
              <span className="section__label">Business & announcements</span>
            </div>
            <div className="ta-row">
              <div className="ta-row__label">Ward business <span className="ta-row__opt">Optional</span></div>
              <textarea
                className="ta"
                placeholder="Callings to sustain, changes in records, etc."
                value={prog.notes.ward}
                onChange={(e) => setNested("notes", "ward", e.target.value)}
              />
            </div>
            <div className="ta-row">
              <div className="ta-row__label">Stake business <span className="ta-row__opt">Optional</span></div>
              <textarea
                className="ta"
                placeholder="Anything from the stake presidency to be presented."
                value={prog.notes.stake}
                onChange={(e) => setNested("notes", "stake", e.target.value)}
              />
            </div>
            <div className="ta-row">
              <div className="ta-row__label">Announcements <span className="ta-row__opt">Optional</span></div>
              <textarea
                className="ta"
                placeholder="e.g. Youth temple trip — Saturday, May 23"
                value={prog.notes.announcements}
                onChange={(e) => setNested("notes", "announcements", e.target.value)}
              />
              <div className="ta-row__helper">
                Shown on the congregation print only when the announcements toggle is on.
              </div>
              <label className="toggle">
                <input type="checkbox"
                  checked={prog.notes.showAnnouncements}
                  onChange={(e) => setNested("notes", "showAnnouncements", e.target.checked)}
                />
                <span className="toggle__switch"/>
                <span className="toggle__label">Include announcements on printed program</span>
              </label>
            </div>
          </section>

          {/* Comments */}
          <section id="sec-comments" className="section">
            <details className="comments" open>
              <summary>Comments <span style={{color:"var(--walnut-3)", fontFamily:"var(--font-mono)", fontSize:11, letterSpacing:".08em"}}>({prog.comments.length})</span></summary>
              {prog.comments.length === 0 ? (
                <div className="comments__empty">No comments yet.</div>
              ) : (
                <div style={{display:"flex", flexDirection:"column", gap:10, marginBottom:10}}>
                  {prog.comments.map((c, i) => (
                    <div key={i} style={{padding:"8px 10px", background:"var(--parchment)", borderRadius:6}}>
                      <div style={{fontFamily:"var(--font-mono)", fontSize:10, letterSpacing:".08em", color:"var(--walnut-3)", textTransform:"uppercase"}}>{c.who} · {c.when}</div>
                      <div style={{fontSize:13.5, color:"var(--walnut)", marginTop:3}}>{c.text}</div>
                    </div>
                  ))}
                </div>
              )}
              <div className="comment-input">
                <textarea placeholder="Leave a note for the bishopric to review before approval."/>
                <button className="btn">Post comment</button>
              </div>
            </details>
          </section>
        </div>

        <nav className="rail" aria-label="Program sections">
          <div className="rail__label">In this program</div>
          {railSections.map((s) => (
            <a key={s.id} href={"#" + s.id} className={activeRail === s.id ? "is-active" : ""}>
              <span className={"rail__dot" + (s.done ? " is-done" : "")}/>
              <span>{s.label}</span>
              {s.count != null && <span className="rail__count">{s.count}</span>}
            </a>
          ))}
        </nav>
      </div>

      <div className="savebar">
        <div className="savebar__status">
          <span className="savebar__dot"/>
          Autosaved · just now
        </div>
        <div className="savebar__spacer"/>
        <button className="btn btn--ghost">Preview print</button>
        <button className="btn">Save as draft</button>
        <button className={"btn " + (ready ? "btn--success" : "btn--primary")} disabled={!ready}>
          {ready ? <><Icon name="check" size={12}/> Request approval</> : `Finish ${needs.length + unconfirmed.length} item${(needs.length+unconfirmed.length)===1?"":"s"} to submit`}
        </button>
      </div>
    </>
  );
}

window.ProgramPage = ProgramPage;

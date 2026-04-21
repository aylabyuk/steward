// SundayCard — one Sunday in the schedule (summary + inline editor)
function SundayCard({ sunday, isOpen, onToggle, onUpdate, assignFlow }) {
  const { date, kind, speakers } = sunday;
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef(null);
  React.useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    const onEsc = (e) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onEsc); };
  }, [menuOpen]);

  const setKind = (k) => {
    const clearSpeakers = k === "fast" || k === "stake" || k === "general";
    onUpdate({ ...sunday, kind: k, speakers: clearSpeakers ? [] : sunday.speakers });
    setMenuOpen(false);
  };
  const isFast = kind === "fast";
  const isStake = kind === "stake";
  const isGeneral = kind === "general";
  const noSpeakerKind = isFast || isStake || isGeneral;
  const hasConfirmed = speakers.some(s => s.state === "confirmed");
  const days = daysUntil(date);
  const isPast = days < 0;
  const isSoon = days >= 0 && days < 7;
  const hasUnconfirmed = speakers.some(s => s.state !== "confirmed");
  const showNotice = isSoon && !noSpeakerKind && hasUnconfirmed && speakers.length > 0;

  const kindLabel = isFast ? "Fast Sunday"
    : isStake ? "Stake Conference"
    : isGeneral ? "General Conference"
    : null;

  const kindBodyText = isFast ? "No assigned speakers — member testimonies."
    : isStake ? "No local program — stake-wide session."
    : isGeneral ? "No local program — broadcast from Salt Lake."
    : null;

  const kindBodyLabel = isFast ? "Testimony meeting"
    : isStake ? "Stake-wide session"
    : isGeneral ? "Broadcast session"
    : null;

  const updateSpeaker = (i, s) => {
    const next = [...speakers]; next[i] = s;
    onUpdate({ ...sunday, speakers: next });
  };
  const removeSpeaker = (i) => {
    const next = speakers.filter((_, idx) => idx !== i);
    onUpdate({ ...sunday, speakers: next });
  };
  const addSpeaker = () => {
    const next = [...speakers, { name:"", email:"", topic:"", role:"Member", state:"planned" }];
    onUpdate({ ...sunday, speakers: next });
    if (!isOpen) onToggle();
  };

  const cls = [
    "sun",
    isFast ? "is-fast" : "",
    isStake ? "is-stake" : "",
    isGeneral ? "is-general" : "",
    isPast ? "is-past" : "",
    isOpen ? "is-open" : "",
  ].join(" ").trim();

  return (
    <div className={cls}>
      <div className="sun__head">
        <button
          className="sun__date-btn"
          onClick={() => { /* navigate to detail — stub */ }}
          aria-label={`Open details for ${fmtDate(date)}`}
        >
          <div className="sun__date">{fmtDate(date)}</div>
          <div className={"sun__countdown" + (isSoon ? " is-soon" : "")}>
            {fmtCountdown(date)}
          </div>
        </button>
        {kindLabel && <div className="sun__kind">{kindLabel}</div>}
        <div className="sun__menu" ref={menuRef}>
          <button
            className="sun__menu-btn"
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Sunday options"
            aria-expanded={menuOpen}
          >
            <span className="sun__menu-dots">⋯</span>
          </button>
          {menuOpen && (
            <div className="sun__menu-pop" role="menu">
              <div className="sun__menu-eyebrow">Sunday type</div>
              {[
                ["regular", "Regular"],
                ["fast", "Fast Sunday"],
                ["stake", "Stake Conference"],
                ["general", "General Conference"],
              ].map(([k, label]) => {
                const wouldClear = (k === "fast" || k === "stake" || k === "general");
                const disabled = wouldClear && hasConfirmed && kind !== k;
                return (
                  <button
                    key={k}
                    role="menuitemradio"
                    aria-checked={kind === k}
                    aria-disabled={disabled}
                    disabled={disabled}
                    className={"sun__menu-item" + (kind === k ? " is-active" : "") + (disabled ? " is-disabled" : "")}
                    onClick={() => { if (!disabled) setKind(k); }}
                    title={disabled ? "Remove confirmed speakers first" : undefined}
                  >
                    <span className="sun__menu-mark">{kind === k ? "●" : ""}</span>
                    <span>{label}</span>
                  </button>
                );
              })}
              {hasConfirmed && (
                <div className="sun__menu-note">
                  <Icon name="alert" size={11}/>
                  <span>Locked — remove confirmed speakers to change.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showNotice && (
        <div className="notice">
          <span className="notice__dot"/>
          <span>Short notice — confirm speakers directly.</span>
        </div>
      )}

      <div className="sun__body">
        {noSpeakerKind ? (
          <>
            <div className="fast-stamp">
              <span className="fast-stamp__icon">✦</span>
              <span className="fast-stamp__label">{kindBodyLabel}</span>
            </div>
            <p className="sun__body-text">{kindBodyText}</p>
          </>
        ) : speakers.length === 0 ? (
          <>
            <div className="sun__empty">No speakers yet.</div>
            <button className="add-link" onClick={assignFlow === "inline" ? addSpeaker : onToggle}>
              <span className="plus"><Icon name="plus" size={10}/></span>
              Add speaker
            </button>
          </>
        ) : (
          <>
            <ul className="sp-list">
              {speakers.map((s, i) => (
                <li key={i} className={"sp is-clickable"} onClick={() => !isOpen && onToggle()}>
                  <div className="sp__num">{String(i+1).padStart(2,"0")}</div>
                  <div className="sp__who">
                    <div className="sp__name">{s.name || <span style={{color:"var(--walnut-3)"}}>Unnamed</span>}</div>
                    <div className={"sp__topic" + (!s.topic ? " is-empty" : "")}>
                      {s.topic || "No topic yet"}
                    </div>
                  </div>
                  <div className={`sp__state state-${s.state}`}>
                    <span className="sp__state-dot"/>
                    {s.state}
                  </div>
                </li>
              ))}
            </ul>
            <button className="add-link" onClick={assignFlow === "inline" ? addSpeaker : onToggle}>
              <span className="plus"><Icon name="plus" size={10}/></span>
              Add speaker
            </button>
          </>
        )}
      </div>

      {isOpen && !noSpeakerKind && assignFlow === "inline" && (
        <div className="editor">
          <div className="editor__eyebrow">
            <span>Editing — {fmtDate(date)}</span>
            <button className="close" onClick={onToggle}>Close</button>
          </div>

          {speakers.length === 0 && (
            <div className="sun__empty" style={{marginBottom:10}}>Add the first speaker below.</div>
          )}

          {speakers.map((s, i) => (
            <SpeakerEditor
              key={i}
              index={i}
              speaker={s}
              sundayDate={date}
              onChange={(ns) => updateSpeaker(i, ns)}
              onRemove={() => removeSpeaker(i)}
            />
          ))}

          <div className="editor__foot">
            <button className="btn" onClick={addSpeaker}>
              <Icon name="plus" size={12}/> Add another speaker
            </button>
            <div className="spacer"/>
            {speakers.some(s => s.email && s.state === "invited") && (
              <button className="btn btn--send">
                <Icon name="send" size={12}/> Send reminders
              </button>
            )}
            <button className="btn btn--primary" onClick={onToggle}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

window.SundayCard = SundayCard;

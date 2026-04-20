// Slide-over + Modal variants for the "assign flow" tweak. Both wrap SpeakerEditor list.
function AssignSheet({ sunday, onClose, onUpdate }) {
  if (!sunday) return null;
  const { date, speakers } = sunday;
  const update = (i, s) => {
    const next = [...speakers]; next[i] = s;
    onUpdate({ ...sunday, speakers: next });
  };
  const remove = (i) => onUpdate({ ...sunday, speakers: speakers.filter((_,idx)=>idx!==i) });
  const add = () => onUpdate({ ...sunday, speakers: [...speakers, { name:"", email:"", topic:"", role:"Member", state:"planned" }]});

  return (
    <>
      <div className="sheet-scrim" onClick={onClose}/>
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="sheet__head">
          <div>
            <div style={{fontFamily:"var(--font-mono)", fontSize:10, letterSpacing:".14em", textTransform:"uppercase", color:"var(--brass-deep)"}}>
              Sacrament meeting
            </div>
            <div className="sheet__title">{fmtDate(date)}</div>
          </div>
          <button className="sheet__close" onClick={onClose}>Close</button>
        </div>
        <div className="sheet__body">
          {speakers.length === 0 && (
            <div className="sun__empty" style={{marginBottom:10}}>No speakers yet. Add one below.</div>
          )}
          {speakers.map((s,i) => (
            <SpeakerEditor key={i} index={i} speaker={s} sundayDate={date}
              onChange={ns => update(i, ns)}
              onRemove={() => remove(i)}/>
          ))}
          <button className="btn" onClick={add}>
            <Icon name="plus" size={12}/> Add speaker
          </button>
        </div>
        <div className="sheet__foot">
          {speakers.some(s => s.email && s.state === "invited") && (
            <button className="btn btn--send"><Icon name="send" size={12}/> Send reminders</button>
          )}
          <button className="btn btn--primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </>
  );
}

function AssignModal({ sunday, onClose, onUpdate }) {
  if (!sunday) return null;
  const { date, speakers } = sunday;
  const update = (i, s) => { const n=[...speakers]; n[i]=s; onUpdate({...sunday, speakers:n}); };
  const remove = (i) => onUpdate({...sunday, speakers: speakers.filter((_,idx)=>idx!==i)});
  const add = () => onUpdate({...sunday, speakers: [...speakers, {name:"",email:"",topic:"",role:"Member",state:"planned"}]});

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__head">
          <div>
            <div style={{fontFamily:"var(--font-mono)", fontSize:10, letterSpacing:".14em", textTransform:"uppercase", color:"var(--brass-deep)"}}>Assign speakers</div>
            <div className="modal__title">{fmtDate(date)}</div>
          </div>
          <div style={{flex:1}}/>
          <button className="sheet__close" onClick={onClose}>Close</button>
        </div>
        <div className="modal__body" style={{maxHeight:"70vh", overflowY:"auto"}}>
          {speakers.length === 0 && (
            <div className="sun__empty" style={{marginBottom:10}}>No speakers yet.</div>
          )}
          {speakers.map((s,i) => (
            <SpeakerEditor key={i} index={i} speaker={s} sundayDate={date}
              onChange={ns => update(i, ns)} onRemove={() => remove(i)}/>
          ))}
          <button className="btn" onClick={add}>
            <Icon name="plus" size={12}/> Add speaker
          </button>
        </div>
        <div className="modal__foot">
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" onClick={onClose}>Save</button>
        </div>
      </div>
    </div>
  );
}

window.AssignSheet = AssignSheet;
window.AssignModal = AssignModal;

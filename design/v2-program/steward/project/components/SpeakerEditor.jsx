// SpeakerEditor — inline edit form for one speaker
function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function SpeakerEditor({ index, speaker, sundayDate, onChange, onRemove }) {
  const set = (k, v) => onChange({ ...speaker, [k]: v });
  const [confirming, setConfirming] = React.useState(false);

  const mailto = () => {
    if (!speaker.email) return;
    const dateStr = sundayDate
      ? sundayDate.toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric", year:"numeric" })
      : "the upcoming Sunday";
    const subject = `Invitation to speak — ${dateStr}`;
    const body = [
      `Dear ${speaker.name || "Brother/Sister"},`,
      ``,
      `The bishopric would like to invite you to speak in sacrament meeting on ${dateStr}.`,
      speaker.topic ? `\nTopic: ${speaker.topic}` : "",
      `\nPlease let us know if this date works for you.`,
      ``,
      `Thank you,`,
      `The bishopric`,
    ].filter(Boolean).join("\n");
    window.location.href = `mailto:${speaker.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setConfirming(true);
  };

  const printLetter = () => {
    const dateStr = sundayDate
      ? sundayDate.toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric", year:"numeric" })
      : "an upcoming Sunday";
    const today = new Date().toLocaleDateString("en-US", { month:"long", day:"numeric", year:"numeric" });
    const greeting = speaker.name ? `Dear ${speaker.name},` : `Dear Brother or Sister,`;
    const topicLine = speaker.topic
      ? `We have prayerfully considered a topic for your remarks: <em>${escapeHtml(speaker.topic)}</em>. We trust the Spirit will guide you as you prepare.`
      : `You are welcome to speak on a topic of your own choosing, as prompted by the Spirit.`;
    const html = `<!doctype html>
<html><head>
<meta charset="utf-8"/>
<title>Invitation to speak — ${escapeHtml(speaker.name || "Speaker")}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
<style>
  :root {
    --walnut: #3a2519;
    --walnut-2: #5b3d2a;
    --walnut-3: #8a6a55;
    --parchment: #f4ead8;
    --brass: #c9a15a;
    --brass-deep: #8a6d2e;
    --bordeaux: #8b2e2a;
    --border: #d8c8a8;
    --chalk: #fdfaf2;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #e6ddc7; }
  body {
    font-family: 'Cormorant Garamond', Georgia, serif;
    color: var(--walnut);
    padding: 40px 20px;
    min-height: 100vh;
    display: flex; justify-content: center; align-items: flex-start;
  }
  .sheet {
    width: 8.5in; min-height: 11in;
    background: var(--chalk);
    padding: 1.1in 1.1in 1in;
    box-shadow: 0 12px 40px rgba(58,37,25,.18), 0 2px 8px rgba(58,37,25,.08);
    position: relative;
    overflow: hidden;
  }
  .sheet::before {
    content: "";
    position: absolute; inset: 0.5in;
    border: 1px solid rgba(201,161,90,.35);
    pointer-events: none;
  }
  .head {
    text-align: center;
    padding-bottom: 28px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 44px;
    position: relative;
  }
  .head__rule {
    display: flex; align-items: center; justify-content: center; gap: 14px;
    margin-bottom: 14px;
  }
  .head__rule::before, .head__rule::after {
    content: ""; height: 1px; flex: 0 0 60px; background: var(--brass);
  }
  .head__ornament {
    width: 36px; height: 36px;
    border: 1px solid var(--brass);
    border-radius: 50%;
    display: inline-flex; align-items: center; justify-content: center;
    color: var(--brass-deep);
    font-size: 18px;
  }
  .head__ward {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: .3em;
    text-transform: uppercase;
    color: var(--walnut-3);
    margin-bottom: 8px;
  }
  .head__title {
    font-size: 28px;
    font-weight: 500;
    font-style: italic;
    color: var(--walnut);
    letter-spacing: -.01em;
  }
  .head__sub {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: .22em;
    text-transform: uppercase;
    color: var(--walnut-3);
    margin-top: 10px;
  }
  .date {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px; letter-spacing: .14em; text-transform: uppercase;
    color: var(--walnut-3);
    margin-bottom: 28px;
  }
  .greeting {
    font-size: 20px;
    font-weight: 500;
    margin: 0 0 20px;
  }
  p {
    font-size: 16.5px;
    line-height: 1.65;
    margin: 0 0 16px;
    color: var(--walnut-2);
  }
  .callout {
    margin: 28px 0;
    padding: 22px 26px;
    background: linear-gradient(180deg, rgba(224,190,135,.18), rgba(224,190,135,.04));
    border-left: 2px solid var(--brass);
    border-radius: 0 4px 4px 0;
  }
  .callout__label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9.5px; letter-spacing: .22em; text-transform: uppercase;
    color: var(--brass-deep);
    margin-bottom: 8px;
  }
  .callout__date {
    font-size: 22px;
    font-weight: 500;
    font-style: italic;
    color: var(--walnut);
  }
  .sign {
    margin-top: 50px;
  }
  .sign__closing { margin-bottom: 52px; font-size: 16.5px; }
  .sign__line {
    border-bottom: 1px solid var(--walnut-3);
    width: 280px;
    margin-bottom: 6px;
  }
  .sign__who {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px; letter-spacing: .18em; text-transform: uppercase;
    color: var(--walnut-3);
  }
  .foot {
    margin-top: 60px;
    padding-top: 18px;
    border-top: 1px solid var(--border);
    font-family: 'JetBrains Mono', monospace;
    font-size: 9.5px; letter-spacing: .18em; text-transform: uppercase;
    color: var(--walnut-3);
    text-align: center;
  }
  em { color: var(--bordeaux); font-style: italic; }
  .toolbar {
    position: fixed; top: 12px; right: 12px;
    display: flex; gap: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    z-index: 100;
  }
  .toolbar button {
    background: var(--walnut); color: var(--chalk);
    border: 0; padding: 9px 14px; border-radius: 4px;
    letter-spacing: .12em; text-transform: uppercase;
    cursor: pointer; font-family: inherit; font-size: inherit;
  }
  .toolbar button.ghost {
    background: var(--chalk); color: var(--walnut);
    border: 1px solid var(--border);
  }
  @media print {
    body { background: white; padding: 0; }
    .sheet { box-shadow: none; width: 100%; min-height: auto; padding: 0.8in 1in; }
    .toolbar { display: none; }
    @page { size: letter; margin: 0.5in; }
  }
</style>
</head>
<body>
<div class="toolbar">
  <button class="ghost" onclick="window.close()">Close</button>
  <button onclick="window.print()">Print</button>
</div>
<div class="sheet">
  <div class="head">
    <div class="head__rule">
      <span class="head__ornament">✦</span>
    </div>
    <div class="head__ward">Sacrament Meeting</div>
    <div class="head__title">Invitation to Speak</div>
    <div class="head__sub">From the Bishopric</div>
  </div>
  <div class="date">${escapeHtml(today)}</div>
  <p class="greeting">${escapeHtml(greeting)}</p>
  <p>The bishopric has prayerfully considered the needs of our ward, and we feel inspired to invite you to speak in sacrament meeting.</p>
  <div class="callout">
    <div class="callout__label">Assigned Sunday</div>
    <div class="callout__date">${escapeHtml(dateStr)}</div>
  </div>
  <p>${topicLine}</p>
  <p>We ask that your remarks be approximately <strong>twelve to fifteen minutes</strong> in length, and grounded in the scriptures and the words of living prophets.</p>
  <p>Please let a member of the bishopric know if this invitation works for you, or if you would prefer a different Sunday. We are grateful for your willingness to serve.</p>
  <div class="sign">
    <p class="sign__closing">With gratitude,</p>
    <div class="sign__line"></div>
    <div class="sign__who">The Bishopric</div>
  </div>
  <div class="foot">✦ &nbsp; And all things whatsoever ye shall ask in prayer, believing, ye shall receive &nbsp; ✦</div>
</div>
<script>window.addEventListener('load', () => setTimeout(() => window.print(), 400));</script>
</body></html>`;
    const w = window.open("", "_blank", "width=900,height=1100");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    setConfirming(true);
  };

  const markInvited = () => {
    set("state", "invited");
    setConfirming(false);
  };

  return (
    <div className="edit-sp">
      <div className="edit-sp__head">
        <div className="edit-sp__num">Speaker · {String(index + 1).padStart(2, "0")}</div>
        <button className="edit-sp__close" aria-label="Remove speaker" onClick={onRemove}>
          <Icon name="x" size={14}/>
        </button>
      </div>
      <div className="state-pills state-pills--row" role="radiogroup" aria-label="Speaker state">
        {STATE_OPTIONS.map(s => (
          <button
            key={s.id}
            role="radio"
            aria-checked={speaker.state === s.id}
            className={(speaker.state === s.id ? `is-on on-${s.id}` : "")}
            onClick={() => { set("state", s.id); setConfirming(false); }}
          >{s.label}</button>
        ))}
      </div>

      {/* Invite action strip, only meaningful in planned state */}
      {speaker.state === "planned" && (
        <div className="invite-action">
          {confirming ? (
            <>
              <div className="invite-action__msg">
                <Icon name="mail" size={14}/>
                <span>Did you deliver the invitation?</span>
              </div>
              <div className="invite-action__btns">
                <button className="btn btn--ghost" onClick={() => setConfirming(false)}>Not yet</button>
                <button className="btn btn--primary" onClick={markInvited}>
                  <Icon name="check" size={12}/> Yes, mark invited
                </button>
              </div>
            </>
          ) : speaker.email ? (
            <>
              <div className="invite-action__msg">
                <Icon name="mail" size={14}/>
                <span>Send invitation to <strong>{speaker.email}</strong></span>
              </div>
              <div className="invite-action__btns">
                <button className="btn" onClick={markInvited}>Mark invited</button>
                <button className="btn" onClick={printLetter}>
                  <Icon name="printer" size={12}/> Print letter
                </button>
                <button className="btn btn--primary" onClick={mailto}>
                  <Icon name="send" size={12}/> Send email
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="invite-action__msg invite-action__msg--quiet">
                <span>No email on file — deliver a printed letter or reach out directly.</span>
              </div>
              <div className="invite-action__btns">
                <button className="btn" onClick={markInvited}>
                  <Icon name="check" size={12}/> Mark invited
                </button>
                <button className="btn btn--primary" onClick={printLetter}>
                  <Icon name="printer" size={12}/> Print letter
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="field-grid">
        <label className="fg fg-full">
          <span className="fg__label">Name</span>
          <input
            className="fg__input"
            placeholder="e.g. Sister Hannah Reeves"
            value={speaker.name}
            onChange={e => set("name", e.target.value)}
          />
        </label>

        <label className="fg fg-full">
          <span className="fg__label">Email<span className="opt">— optional</span></span>
          <input
            className="fg__input"
            type="email"
            placeholder="name@example.com"
            value={speaker.email}
            onChange={e => set("email", e.target.value)}
          />
        </label>

        <label className="fg fg-full">
          <span className="fg__label">Topic</span>
          <input
            className="fg__input"
            placeholder="e.g. On the still, small voice"
            value={speaker.topic}
            onChange={e => set("topic", e.target.value)}
          />
        </label>

        <div className="fg fg-full">
          <span className="fg__label">Role</span>
          <div className="chips">
            {ROLE_OPTIONS.map(r => (
              <button
                key={r}
                className={"chip" + (speaker.role === r ? " is-on" : "")}
                onClick={() => set("role", r)}
              >{r}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

window.SpeakerEditor = SpeakerEditor;

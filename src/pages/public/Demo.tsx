import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Self-playing cinematic product demo. 20-second loop, four scenes.
// Built to be screen-recorded (QuickTime, Cmd+Shift+5) → CapCut → socials.
// No auth, no data fetch, pure choreography, so it never breaks on camera.

const css = `
.demo-stage{position:fixed;inset:0;background:linear-gradient(160deg,#1e3a8a 0%,#152a63 55%,#0d1b40 100%);overflow:hidden;display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
.demo-stage::before{content:"";position:absolute;top:-160px;right:-160px;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle,rgba(34,211,238,.28) 0%,rgba(34,211,238,0) 70%)}
.demo-stage::after{content:"";position:absolute;bottom:-180px;left:-140px;width:480px;height:480px;border-radius:50%;background:radial-gradient(circle,rgba(37,99,235,.25) 0%,rgba(37,99,235,0) 70%)}

.demo-wordmark{position:absolute;top:34px;left:0;right:0;text-align:center;font-size:15px;font-weight:800;letter-spacing:.02em;color:#fff;z-index:5}
.demo-wordmark span{color:#22d3ee}
.demo-exit{position:absolute;top:30px;right:26px;z-index:6;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);color:#c7d2e8;border-radius:8px;padding:6px 14px;font-size:12px;cursor:pointer}

.demo-loop{position:relative;width:min(92vw,860px);height:min(72vh,520px);z-index:2}

/* each scene: fade in → hold → fade out inside the 20s master loop */
.scene{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;opacity:0;animation:sceneCycle 20s infinite}
.scene-1{animation-delay:0s}
.scene-2{animation-delay:5s}
.scene-3{animation-delay:10s}
.scene-4{animation-delay:15s}
@keyframes sceneCycle{0%{opacity:0;transform:translateY(14px)}3%{opacity:1;transform:translateY(0)}22%{opacity:1;transform:translateY(0)}25%,100%{opacity:0;transform:translateY(-14px)}}

.demo-caption{font-size:clamp(26px,4.2vw,44px);font-weight:800;color:#fff;text-align:center;letter-spacing:-.01em;line-height:1.15}
.demo-caption .teal{color:#22d3ee}
.demo-sub{font-size:clamp(13px,1.6vw,16px);color:#93a7cc;text-align:center;margin-top:-14px}

/* ── shared card look ── */
.demo-card{background:#fff;border-radius:16px;box-shadow:0 24px 60px rgba(4,10,30,.5);padding:26px;width:min(84vw,560px)}

/* Scene 1: bureau pick */
.bureau-row{display:flex;gap:14px;justify-content:center}
.bureau-chip{flex:1;text-align:center;padding:20px 10px;border-radius:12px;border:2px solid #e5e7eb;font-weight:800;font-size:clamp(13px,1.8vw,17px);color:#334155;background:#fff;transition:.3s}
.bureau-chip.ex{animation:pickChip 20s infinite}
@keyframes pickChip{0%,6%{border-color:#e5e7eb;background:#fff;color:#334155;transform:scale(1)}10%,22%{border-color:#1e40af;background:#1e40af;color:#fff;transform:scale(1.06);box-shadow:0 10px 24px rgba(30,64,175,.45)}25%,100%{border-color:#e5e7eb;background:#fff;color:#334155;transform:scale(1)}}

/* Scene 2: reuse toggle */
.toggle-row{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:18px 20px;border:1.5px solid #e5e7eb;border-radius:12px}
.toggle-label{font-weight:700;color:#0f1117;font-size:clamp(14px,1.9vw,17px)}
.toggle-hint{font-size:12.5px;color:#6b7280;margin-top:3px}
.demo-switch{width:58px;height:32px;border-radius:999px;background:#e5e7eb;position:relative;flex-shrink:0;animation:switchOn 20s infinite}
.demo-switch::after{content:"";position:absolute;top:3px;left:3px;width:26px;height:26px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.25);animation:knobOn 20s infinite}
@keyframes switchOn{0%,31%{background:#e5e7eb}35%,47%{background:#0891b2}50%,100%{background:#e5e7eb}}
@keyframes knobOn{0%,31%{transform:translateX(0)}35%,47%{transform:translateX(26px)}50%,100%{transform:translateX(0)}}

/* Scene 3: results cascade */
.result-stack{display:flex;flex-direction:column;gap:12px;width:min(84vw,560px)}
.result-card{background:#fff;border-radius:14px;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 16px 40px rgba(4,10,30,.45);opacity:0}
.result-card .name{font-weight:800;color:#0f1117;font-size:clamp(13px,1.8vw,16px)}
.result-card .badges{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap}
.demo-badge{font-size:10.5px;font-weight:700;padding:3px 9px;border-radius:999px}
.b-green{background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0}
.b-teal{background:#ecfeff;color:#0e7490;border:1px solid #a5f3fc}
.b-navy{background:#1e40af;color:#fff}
.score{font-weight:900;color:#1e40af;font-size:clamp(16px,2.4vw,20px);text-align:right}
.score small{display:block;font-size:9px;color:#6b7280;font-weight:700;letter-spacing:.06em}
.rc-1{animation:cardIn 20s infinite;animation-delay:0s}
.rc-2{animation:cardIn2 20s infinite}
.rc-3{animation:cardIn3 20s infinite}
@keyframes cardIn{0%,52%{opacity:0;transform:translateY(18px)}55%,72%{opacity:1;transform:translateY(0)}75%,100%{opacity:0}}
@keyframes cardIn2{0%,54%{opacity:0;transform:translateY(18px)}57%,72%{opacity:1;transform:translateY(0)}75%,100%{opacity:0}}
@keyframes cardIn3{0%,56%{opacity:0;transform:translateY(18px)}59%,72%{opacity:1;transform:translateY(0)}75%,100%{opacity:0}}

/* Scene 4: closing */
.demo-cta-btn{background:#0891b2;color:#fff;font-weight:800;font-size:clamp(14px,2vw,17px);padding:14px 34px;border-radius:12px;border:none;box-shadow:0 14px 36px rgba(8,145,178,.45);animation:pulse 2.2s infinite}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.045)}}
.demo-price{color:#7dd3fc;font-weight:700;font-size:13px}

/* progress dots */
.demo-dots{position:absolute;bottom:30px;left:0;right:0;display:flex;gap:8px;justify-content:center;z-index:5}
.dot{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.25)}
.dot-1{animation:dotOn 20s infinite}
.dot-2{animation:dotOn 20s infinite;animation-delay:5s}
.dot-3{animation:dotOn 20s infinite;animation-delay:10s}
.dot-4{animation:dotOn 20s infinite;animation-delay:15s}
@keyframes dotOn{0%{background:rgba(255,255,255,.25)}2%,24%{background:#22d3ee}26%,100%{background:rgba(255,255,255,.25)}}
`

export default function Demo() {
  const navigate = useNavigate()
  useEffect(() => {
    document.title = 'Intelligent Funding, Product Demo'
  }, [])

  return (
    <div className="demo-stage">
      <style>{css}</style>
      <div className="demo-wordmark">INTELLIGENT <span>FUNDING</span></div>
      <button className="demo-exit" onClick={() => navigate('/')}>Exit demo</button>

      <div className="demo-loop">
        {/* Scene 1, pick your bureau */}
        <div className="scene scene-1">
          <div className="demo-caption">Every lender pulls <span className="teal">one bureau.</span></div>
          <div className="demo-sub">Pick where your credit is strongest.</div>
          <div className="demo-card">
            <div className="bureau-row">
              <div className="bureau-chip ex">Experian</div>
              <div className="bureau-chip">Equifax</div>
              <div className="bureau-chip">TransUnion</div>
            </div>
          </div>
        </div>

        {/* Scene 2, inquiry reuse */}
        <div className="scene scene-2">
          <div className="demo-caption">One hard pull. <span className="teal">Multiple approvals.</span></div>
          <div className="demo-sub">Filter for institutions that reuse your inquiry.</div>
          <div className="demo-card">
            <div className="toggle-row">
              <div>
                <div className="toggle-label">Inquiry Reuse Only</div>
                <div className="toggle-hint">Institutions that approve multiple products on one pull</div>
              </div>
              <div className="demo-switch" />
            </div>
          </div>
        </div>

        {/* Scene 3, verified results */}
        <div className="scene scene-3">
          <div className="demo-caption">Verified. <span className="teal">Not guessed.</span></div>
          <div className="demo-sub">50+ institutions · growing weekly · checked against official sources</div>
          <div className="result-stack">
            {/* Real data: scene 1 picks Experian, so every result here MUST be a verified Experian puller */}
            <div className="result-card rc-1">
              <div>
                <div className="name">Bank of America</div>
                <div className="badges">
                  <span className="demo-badge b-green">✓ Inquiry Reuse, 30 Days</span>
                  <span className="demo-badge b-teal">✓ Soft Pull</span>
                  <span className="demo-badge b-navy">Experian</span>
                </div>
              </div>
              <div className="score">670+<small>MIN SCORE</small></div>
            </div>
            <div className="result-card rc-2">
              <div>
                <div className="name">Patelco Credit Union</div>
                <div className="badges">
                  <span className="demo-badge b-green">✓ Inquiry Reuse, 30 Days</span>
                  <span className="demo-badge b-navy">Experian</span>
                </div>
              </div>
              <div className="score">640+<small>MIN SCORE</small></div>
            </div>
            <div className="result-card rc-3">
              <div>
                <div className="name">Service Credit Union</div>
                <div className="badges">
                  <span className="demo-badge b-green">✓ Inquiry Reuse, 30 Days</span>
                  <span className="demo-badge b-navy">Experian</span>
                </div>
              </div>
              <div className="score">630+<small>MIN SCORE</small></div>
            </div>
          </div>
        </div>

        {/* Scene 4, close */}
        <div className="scene scene-4">
          <div className="demo-caption">Stack by Bureau.<br /><span className="teal">Get Funded by Design.</span></div>
          <button className="demo-cta-btn" onClick={() => navigate('/signup')}>Start for $1</button>
          <div className="demo-price">7 days full access · cancel anytime · intelligentfunding.org</div>
        </div>
      </div>

      <div className="demo-dots">
        <div className="dot dot-1" /><div className="dot dot-2" /><div className="dot dot-3" /><div className="dot dot-4" />
      </div>
    </div>
  )
}

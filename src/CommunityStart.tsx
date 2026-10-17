import { SIGNUP_PATH } from "./Home";
const DISCORD_INVITE_URL = "https://discord.gg/kU7Z6ReJM";
export default function CommunityStart() { return <>
<style>{`
.rb .phero{text-align:center;padding:52px 0 8px}
.rb .phero .sec-k{margin-bottom:10px}
.rb .phero h1{font-size:34px;line-height:1.05}
@media(min-width:860px){.rb .phero h1{font-size:52px}}
.rb .phero .lede{margin-top:18px}
.rb .steps{display:grid;grid-template-columns:1fr;gap:16px;margin-top:34px}
@media(min-width:760px){.rb .steps{grid-template-columns:1fr 1fr}}
.rb .step{position:relative;border:1px solid rgba(255,255,255,.08);background:#0a0b10;border-radius:18px;padding:22px 22px 22px 66px}
.rb .step .num{position:absolute;left:20px;top:22px;width:34px;height:34px;border-radius:11px;display:grid;place-items:center;font-weight:900;color:#0b0d12;background:linear-gradient(135deg,#5ec8ff,#1f6fa8)}
.rb .step h4{font-size:16px;font-weight:800}
.rb .step p{color:rgba(255,255,255,.6);font-size:13.5px;line-height:1.6;margin-top:7px}
.rb .rules{list-style:none;padding:0;margin:26px auto 0;max-width:640px;text-align:left}
.rb .rules li{position:relative;padding:12px 12px 12px 44px;border:1px solid rgba(255,255,255,.08);background:#0a0b10;border-radius:14px;margin-bottom:10px;font-size:14.5px;color:rgba(255,255,255,.82);line-height:1.55}
.rb .rules li b{color:#fff}
/* Decorative tick, so gold — see the note on the same rule in Home. */
.rb .rules li::before{content:"✓";position:absolute;left:16px;top:12px;color:#5ec8ff;font-weight:900;font-size:16px}
.rb .ranks{display:grid;grid-template-columns:1fr;gap:12px;margin-top:26px}
@media(min-width:640px){.rb .ranks{grid-template-columns:1fr 1fr 1fr}}
.rb .rank{border:1px solid rgba(255,255,255,.1);background:#0a0b10;border-radius:16px;padding:20px;text-align:center}
.rb .rank .rn{font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}
.rb .rank .rv{font-size:26px;font-weight:900;margin-top:6px;font-variant-numeric:tabular-nums}
.rb .rank .rd{font-size:12.5px;color:rgba(255,255,255,.5);margin-top:6px;line-height:1.5}
.rb .rank.s{border-color:rgba(168,164,154,.4)}.rb .rank.s .rn,.rb .rank.s .rv{color:#ded9cf}
.rb .rank.g{border-color:rgba(63,159,224,.4)}.rb .rank.g .rn,.rb .rank.g .rv{color:#7fd4ff}
.rb .rank.v{border-color:rgba(42,128,189,.45)}.rb .rank.v .rn,.rb .rank.v .rv{color:#8cc0e3}
.rb .lead-in{max-width:680px;margin:16px auto 0;text-align:center;color:rgba(255,255,255,.62);font-size:15.5px;line-height:1.7}
.rb .discord-panel{margin-top:44px;padding:clamp(24px,5vw,48px);border:1px solid rgba(94,200,255,.22);border-radius:24px;background:linear-gradient(135deg,rgba(94,200,255,.07),rgba(255,255,255,.015))}
.rb .discord-panel .edu-grid{align-items:stretch}
.rb .discord-panel .ecard{background:rgba(0,0,0,.24)}
.rb .community-status{display:inline-block;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#9bdcff;border:1px solid rgba(94,200,255,.3);border-radius:99px;padding:5px 9px}
.rb .community-status.soon{color:rgba(255,255,255,.65);border-color:rgba(255,255,255,.18)}
.rb .discord-panel .ecard h3{font-size:18px;font-weight:800;margin-top:16px}
.rb .onboarding{scroll-margin-top:90px}
.rb .onboarding .step a{margin-top:18px}
@media(min-width:960px){.rb .onboarding .steps{grid-template-columns:repeat(3,1fr)}}
`}</style>
      <section className="discord-panel" aria-labelledby="discord-heading">
        <div className="sec-k">What's inside the Discord?</div>
        <h2 id="discord-heading">One community. More ways to learn and trade.</h2>
        <p className="sub">Join our free Discord to connect with Anthony and traders of every level, access free learning resources, and get step-by-step guidance through everything Pulse offers.</p>
        <div className="edu-grid">
          <div className="ecard">
            <span className="community-status">100% free to join</span>
            <h3>Free community &amp; group chat</h3>
            <p>Connect with Anthony and traders of every level. Ask questions, share ideas, and learn together.</p>
          </div>
          <div className="ecard">
            <span className="community-status">Learn · Explore · Get set up</span>
            <h3>Your trading toolkit &amp; Pulse benefits</h3>
            <p><strong>Free course</strong> — beginner lessons through Pulse University. No funding required.</p>
            <p><strong>Free gold signals</strong> — guidance for active, funded Pulse accounts. Our community requires $250 in trading capital—not a signals fee.</p>
            <p><strong>PAMM investing &amp; 10× instant funding accounts</strong> — explore Pulse’s options and learn how to get started.</p>
            <p><strong>Free trading indicator</strong> — our charting tool with setup instructions.</p>
          </div>
          <div className="ecard">
            <span className="community-status soon">Coming soon · Premium</span>
            <h3>Premium access</h3>
            <p>Premium private chat, premium signals, and 1-on-1 coaching are coming soon. Access details will be shared when they launch.</p>
          </div>
        </div>
        <p className="lead-in"><strong>Discord is 100% free to join.</strong> Broker features have separate funding requirements, costs, eligibility, and risks.</p>
      </section>

      <section className="onboarding" id="start-here" aria-labelledby="start-heading">
        <div className="sec-k">Start here</div>
        <h2 id="start-heading">Your next steps, in order</h2>
        <p className="sub">Join the community first. Then use our broker link to create your account and come back to connect with the group.</p>
        <div className="steps">
          <div className="step"><div className="num">1</div><h4>Join the free Discord</h4><p>Open our Discord invite and join Copy the Rich Trades. Keep this page open so you can come back for step 2.</p><a className="btn sm" href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer">1. Join Discord ↗</a></div>
          <div className="step"><div className="num">2</div><h4>Create your broker account</h4><p>Already joined Discord? Use the button below to register on Pulse Markets. Registration takes place on the broker's website.</p><a className="btn sm" href={SIGNUP_PATH} target="_blank" rel="noopener noreferrer">2. Open Broker Account ↗</a></div>
          <div className="step"><div className="num">3</div><h4>Come back &amp; say hello</h4><p>Return to Discord, introduce yourself, and tell us your experience level and what you'd like to learn. Keep account details and passwords private.</p><a className="ghost sm" href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer">3. Return to Discord ↗</a></div>
        </div>
        <p className="lead-in">The Discord group chat is 100% free. Broker registration is separate.</p>
      </section>

</>; }

import { useCallback, useRef } from 'react';
import './DuckAnimation.css';

// Web Audio API sound generators — no audio files needed
const audioCtxRef = { current: null };
const getAudioContext = () => {
  if (!audioCtxRef.current) {
    audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Resume if suspended (browser autoplay policy)
  if (audioCtxRef.current.state === 'suspended') {
    audioCtxRef.current.resume();
  }
  return audioCtxRef.current;
};

const playQuack = () => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Two quick quack tones for a cartoon duck sound
    for (let i = 0; i < 2; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800 - i * 200, now + i * 0.1);
      osc.frequency.exponentialRampToValueAtTime(300, now + i * 0.1 + 0.12);

      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      filter.Q.value = 2;

      gain.gain.setValueAtTime(0.15, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.15);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.2);
    }
  } catch (e) {
    // Audio not available — fail silently
  }
};

const playChaChing = () => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // First "cha" — metallic hit
    const cha = ctx.createOscillator();
    const chaGain = ctx.createGain();
    cha.type = 'square';
    cha.frequency.setValueAtTime(2200, now);
    cha.frequency.exponentialRampToValueAtTime(1200, now + 0.06);
    chaGain.gain.setValueAtTime(0.12, now);
    chaGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    cha.connect(chaGain);
    chaGain.connect(ctx.destination);
    cha.start(now);
    cha.stop(now + 0.1);

    // "Ching" — bright ring
    const ching = ctx.createOscillator();
    const chingGain = ctx.createGain();
    ching.type = 'sine';
    ching.frequency.setValueAtTime(3500, now + 0.1);
    ching.frequency.exponentialRampToValueAtTime(2800, now + 0.5);
    chingGain.gain.setValueAtTime(0.1, now + 0.1);
    chingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    ching.connect(chingGain);
    chingGain.connect(ctx.destination);
    ching.start(now + 0.1);
    ching.stop(now + 0.65);

    // Shimmer overtone
    const shimmer = ctx.createOscillator();
    const shimGain = ctx.createGain();
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(5200, now + 0.12);
    shimmer.frequency.exponentialRampToValueAtTime(4000, now + 0.45);
    shimGain.gain.setValueAtTime(0.04, now + 0.12);
    shimGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    shimmer.connect(shimGain);
    shimGain.connect(ctx.destination);
    shimmer.start(now + 0.12);
    shimmer.stop(now + 0.55);
  } catch (e) {
    // Audio not available — fail silently
  }
};

function DuckAnimation() {
  const quackCooldown = useRef(false);
  const chingCooldown = useRef(false);

  const handleDuckHover = useCallback(() => {
    if (quackCooldown.current) return;
    quackCooldown.current = true;
    playQuack();
    setTimeout(() => { quackCooldown.current = false; }, 600);
  }, []);

  const handleBagHover = useCallback(() => {
    if (chingCooldown.current) return;
    chingCooldown.current = true;
    playChaChing();
    setTimeout(() => { chingCooldown.current = false; }, 800);
  }, []);

  return (
    <div className="duck-scene">
      {/* Pixel art duck with animated dive poses */}
      <div className="pixel-duck" onMouseEnter={handleDuckHover}>
        {/* Standing/walking duck body */}
        <div className="duck-pixels duck-standing">
          {/* Row 1 - top of head */}
          <div className="pixel yellow" style={{gridColumn: '4/6', gridRow: 1}}></div>
          {/* Row 2 - head */}
          <div className="pixel yellow" style={{gridColumn: '3/7', gridRow: 2}}></div>
          {/* Row 3 - head with eye */}
          <div className="pixel yellow" style={{gridColumn: '3/7', gridRow: 3}}></div>
          <div className="pixel black eye" style={{gridColumn: 5, gridRow: 3}}></div>
          {/* Row 4 - head with beak */}
          <div className="pixel yellow" style={{gridColumn: '2/6', gridRow: 4}}></div>
          <div className="pixel orange beak" style={{gridColumn: '6/8', gridRow: 4}}></div>
          {/* Row 5 - neck/body top */}
          <div className="pixel yellow body-top" style={{gridColumn: '2/6', gridRow: 5}}></div>
          {/* Row 6 - body with wing */}
          <div className="pixel yellow body-mid" style={{gridColumn: '1/6', gridRow: 6}}></div>
          <div className="pixel dark-yellow wing-static" style={{gridColumn: '2/4', gridRow: 6}}></div>
          {/* Row 7 - body bottom */}
          <div className="pixel yellow body-bottom" style={{gridColumn: '1/6', gridRow: 7}}></div>
          {/* Row 8 - tail bump */}
          <div className="pixel yellow tail" style={{gridColumn: '1/3', gridRow: 8}}></div>
          {/* Row 9 - legs */}
          <div className="pixel orange leg-left" style={{gridColumn: 3, gridRow: 8}}></div>
          <div className="pixel orange leg-right" style={{gridColumn: 5, gridRow: 8}}></div>
          {/* Row 10 - feet */}
          <div className="pixel orange foot-left" style={{gridColumn: '2/4', gridRow: 9}}></div>
          <div className="pixel orange foot-right" style={{gridColumn: '4/6', gridRow: 9}}></div>
        </div>

        {/* Diving duck body — streamlined, head-first, legs tucked */}
        <div className="duck-pixels duck-diving">
          {/* Streamlined horizontal dive body - 9 cols x 5 rows */}
          {/* Row 1: beak tip + head top */}
          <div className="pixel orange" style={{gridColumn: '8/10', gridRow: 1}}></div>
          <div className="pixel yellow" style={{gridColumn: '5/8', gridRow: 1}}></div>
          {/* Row 2: head + eye + beak + body start */}
          <div className="pixel orange" style={{gridColumn: '9/10', gridRow: 2}}></div>
          <div className="pixel yellow" style={{gridColumn: '4/9', gridRow: 2}}></div>
          <div className="pixel black" style={{gridColumn: 7, gridRow: 2}}></div>
          {/* Row 3: main body (widest) */}
          <div className="pixel yellow" style={{gridColumn: '2/9', gridRow: 3}}></div>
          <div className="pixel dark-yellow" style={{gridColumn: '3/5', gridRow: 3}}></div>
          {/* Row 4: body bottom + tucked feet hint */}
          <div className="pixel yellow" style={{gridColumn: '3/8', gridRow: 3}}></div>
          <div className="pixel yellow" style={{gridColumn: '2/8', gridRow: 4}}></div>
          <div className="pixel orange" style={{gridColumn: '2/3', gridRow: 4}}></div>
          {/* Row 5: tail */}
          <div className="pixel yellow" style={{gridColumn: '1/4', gridRow: 5}}></div>
        </div>

        {/* Diving wings - shown during flight */}
        <div className="dive-wings">
          <div className="pixel dark-yellow dive-wing-up"></div>
          <div className="pixel dark-yellow dive-wing-down"></div>
        </div>
      </div>

      {/* RETRO PIXEL MONEY BAG - Video game style */}
      <div className="pixel-money-bag" onMouseEnter={handleBagHover}>
        <div className="bag-pixels">
          {/* Row 1: Tie/knot top */}
          <div className="pixel bag-tie" style={{gridColumn: '5/7', gridRow: 1}}></div>
          {/* Row 2: Tie knot */}
          <div className="pixel bag-tie" style={{gridColumn: '4/8', gridRow: 2}}></div>
          {/* Row 3: Gathered top with string */}
          <div className="pixel bag-string" style={{gridColumn: 3, gridRow: 2}}></div>
          <div className="pixel bag-string" style={{gridColumn: 9, gridRow: 2}}></div>
          <div className="pixel bag-dark" style={{gridColumn: '4/8', gridRow: 3}}></div>
          {/* Row 4: Neck opening */}
          <div className="pixel bag-main" style={{gridColumn: '3/9', gridRow: 4}}></div>
          <div className="pixel bag-highlight" style={{gridColumn: '4/6', gridRow: 4}}></div>
          {/* Row 5: Upper body */}
          <div className="pixel bag-main" style={{gridColumn: '2/10', gridRow: 5}}></div>
          <div className="pixel bag-highlight" style={{gridColumn: '3/5', gridRow: 5}}></div>
          {/* Row 6: Middle with $ sign area */}
          <div className="pixel bag-main" style={{gridColumn: '1/11', gridRow: 6}}></div>
          <div className="pixel bag-highlight" style={{gridColumn: '2/4', gridRow: 6}}></div>
          {/* Row 7: Middle body */}
          <div className="pixel bag-main" style={{gridColumn: '1/11', gridRow: 7}}></div>
          <div className="pixel bag-highlight" style={{gridColumn: '2/4', gridRow: 7}}></div>
          {/* Row 8: Lower body */}
          <div className="pixel bag-main" style={{gridColumn: '1/11', gridRow: 8}}></div>
          <div className="pixel bag-shadow" style={{gridColumn: '8/10', gridRow: 8}}></div>
          {/* Row 9: Bottom bulge */}
          <div className="pixel bag-main" style={{gridColumn: '2/10', gridRow: 9}}></div>
          <div className="pixel bag-shadow" style={{gridColumn: '7/9', gridRow: 9}}></div>
          {/* Row 10: Bottom edge */}
          <div className="pixel bag-dark" style={{gridColumn: '3/9', gridRow: 10}}></div>
        </div>

        {/* Pixel dollar sign built from blocks */}
        <div className="bag-dollar-pixel">
          <div className="dollar-row dollar-row-1"></div>
          <div className="dollar-row dollar-row-2"></div>
          <div className="dollar-row dollar-row-3"></div>
          <div className="dollar-row dollar-row-4"></div>
          <div className="dollar-row dollar-row-5"></div>
          <div className="dollar-stem"></div>
        </div>

        {/* Splash effects - pixel style money flying out */}
        <div className="splash-effects">
          <div className="pixel-bill bill-1"><span>$</span></div>
          <div className="pixel-bill bill-2"><span>$</span></div>
          <div className="pixel-bill bill-3"><span>$</span></div>
          <div className="pixel-coin coin-1"></div>
          <div className="pixel-coin coin-2"></div>
          <div className="pixel-coin coin-3"></div>
          <div className="pixel-coin coin-4"></div>
        </div>
      </div>
    </div>
  );
}

export default DuckAnimation;

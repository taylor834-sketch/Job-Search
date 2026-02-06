import './DuckAnimation.css';

function DuckAnimation() {
  return (
    <div className="duck-scene">
      {/* Pixel art duck that waddles, jumps with flapping wings, stretches into dive */}
      <div className="pixel-duck">
        {/* Duck built with pixel blocks */}
        <div className="duck-pixels">
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

        {/* Diving wings - shown during flight */}
        <div className="dive-wings">
          <div className="pixel dark-yellow dive-wing-up"></div>
          <div className="pixel dark-yellow dive-wing-down"></div>
        </div>
      </div>

      {/* RETRO PIXEL MONEY BAG - Video game style */}
      <div className="pixel-money-bag">
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

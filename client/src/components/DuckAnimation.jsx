import './DuckAnimation.css';

function DuckAnimation() {
  return (
    <div className="duck-scene">
      {/* Pixel art duck that waddles, jumps with flapping wings, and dives into the bag */}
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
          <div className="pixel orange" style={{gridColumn: '6/8', gridRow: 4}}></div>
          {/* Row 5 - body top with wing */}
          <div className="pixel yellow" style={{gridColumn: '1/6', gridRow: 5}}></div>
          {/* Wing - will animate during flight */}
          <div className="wing-container">
            <div className="pixel dark-yellow wing wing-up" style={{gridColumn: '1/3', gridRow: 5}}></div>
            <div className="pixel dark-yellow wing wing-mid" style={{gridColumn: '1/4', gridRow: 6}}></div>
            <div className="pixel dark-yellow wing wing-down" style={{gridColumn: '2/4', gridRow: 7}}></div>
          </div>
          {/* Row 6 - body */}
          <div className="pixel yellow" style={{gridColumn: '1/6', gridRow: 6}}></div>
          {/* Row 7 - body bottom */}
          <div className="pixel yellow" style={{gridColumn: '1/6', gridRow: 7}}></div>
          {/* Row 8 - legs */}
          <div className="pixel orange leg-left" style={{gridColumn: 2, gridRow: 8}}></div>
          <div className="pixel orange leg-right" style={{gridColumn: 4, gridRow: 8}}></div>
          {/* Row 9 - feet */}
          <div className="pixel orange foot-left" style={{gridColumn: '2/4', gridRow: 9}}></div>
          <div className="pixel orange foot-right" style={{gridColumn: '4/6', gridRow: 9}}></div>
        </div>
      </div>

      {/* Pixel art BANK HEIST money bag */}
      <div className="pixel-money-bag">
        <div className="bag-pixels">
          {/* Gathered top / rope tie - distinctive bank bag look */}
          <div className="pixel tan rope" style={{gridColumn: '5/6', gridRow: 1}}></div>
          <div className="pixel tan rope" style={{gridColumn: '5/6', gridRow: 2}}></div>
          {/* Knot at top */}
          <div className="pixel brown-dark" style={{gridColumn: '3/4', gridRow: 2}}></div>
          <div className="pixel brown-dark" style={{gridColumn: '7/8', gridRow: 2}}></div>
          {/* Gathered neck */}
          <div className="pixel burlap" style={{gridColumn: '4/7', gridRow: 3}}></div>
          {/* Bag body - wider burlap sack shape */}
          <div className="pixel burlap" style={{gridColumn: '3/8', gridRow: 4}}></div>
          <div className="pixel burlap-light" style={{gridColumn: '4/5', gridRow: 4}}></div>
          <div className="pixel burlap" style={{gridColumn: '2/9', gridRow: 5}}></div>
          <div className="pixel burlap-light" style={{gridColumn: '3/5', gridRow: 5}}></div>
          <div className="pixel burlap" style={{gridColumn: '1/10', gridRow: 6}}></div>
          <div className="pixel burlap-light" style={{gridColumn: '2/4', gridRow: 6}}></div>
          <div className="pixel burlap" style={{gridColumn: '1/10', gridRow: 7}}></div>
          <div className="pixel burlap-light" style={{gridColumn: '2/4', gridRow: 7}}></div>
          <div className="pixel burlap" style={{gridColumn: '1/10', gridRow: 8}}></div>
          {/* Bulging bottom */}
          <div className="pixel burlap" style={{gridColumn: '2/9', gridRow: 9}}></div>
          <div className="pixel burlap-dark" style={{gridColumn: '3/8', gridRow: 9}}></div>
        </div>

        {/* Big dollar sign on bag - bank heist style */}
        <div className="bag-dollar-text">$</div>

        {/* Splash effects - pixel style money flying out */}
        <div className="splash-effects">
          <div className="pixel-bill bill-1">
            <span>$</span>
          </div>
          <div className="pixel-bill bill-2">
            <span>$</span>
          </div>
          <div className="pixel-bill bill-3">
            <span>$</span>
          </div>

          <div className="pixel-coin coin-1"></div>
          <div className="pixel-coin coin-2"></div>
          <div className="pixel-coin coin-3"></div>
          <div className="pixel-coin coin-4"></div>

          <div className="pixel-dollar-sign ds-1">$</div>
          <div className="pixel-dollar-sign ds-2">$</div>
          <div className="pixel-dollar-sign ds-3">$</div>
          <div className="pixel-dollar-sign ds-4">$</div>
          <div className="pixel-dollar-sign ds-5">$</div>
        </div>
      </div>
    </div>
  );
}

export default DuckAnimation;

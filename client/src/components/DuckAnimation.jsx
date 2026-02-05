import './DuckAnimation.css';

function DuckAnimation() {
  return (
    <div className="duck-scene">
      {/* Pixel art duck that waddles and dives into the bag */}
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
          {/* Row 5 - body top */}
          <div className="pixel yellow" style={{gridColumn: '1/6', gridRow: 5}}></div>
          {/* Row 6 - body */}
          <div className="pixel yellow" style={{gridColumn: '1/6', gridRow: 6}}></div>
          <div className="pixel dark-yellow wing" style={{gridColumn: '2/4', gridRow: 6}}></div>
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

      {/* Pixel art money bag */}
      <div className="pixel-money-bag">
        <div className="bag-pixels">
          {/* Opening at top */}
          <div className="pixel dark-brown" style={{gridColumn: '3/8', gridRow: 1}}></div>
          {/* Tie */}
          <div className="pixel tan" style={{gridColumn: '4/7', gridRow: 2}}></div>
          {/* Bag body rows */}
          <div className="pixel brown" style={{gridColumn: '2/9', gridRow: 3}}></div>
          <div className="pixel brown" style={{gridColumn: '1/10', gridRow: 4}}></div>
          <div className="pixel brown" style={{gridColumn: '1/10', gridRow: 5}}></div>
          <div className="pixel green dollar-sign" style={{gridColumn: '4/7', gridRow: 5}}></div>
          <div className="pixel brown" style={{gridColumn: '1/10', gridRow: 6}}></div>
          <div className="pixel brown" style={{gridColumn: '1/10', gridRow: 7}}></div>
          <div className="pixel brown" style={{gridColumn: '2/9', gridRow: 8}}></div>
        </div>

        {/* Dollar sign overlay */}
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

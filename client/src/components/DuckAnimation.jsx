import './DuckAnimation.css';

function DuckAnimation() {
  return (
    <div className="duck-scene">
      {/* The duck that waddles across (facing right) */}
      <div className="duck">
        <div className="duck-body">
          <div className="duck-head">
            <div className="duck-eye"></div>
            <div className="duck-beak"></div>
          </div>
          <div className="duck-wing"></div>
        </div>
        <div className="duck-legs">
          <div className="duck-leg left"></div>
          <div className="duck-leg right"></div>
        </div>
      </div>

      {/* Bank robbery money bag on the right */}
      <div className="money-bag">
        {/* Splash effects - money flying out when duck jumps in */}
        <div className="splash-container">
          {/* Dollar bills flying */}
          <div className="money-bill bill-1"></div>
          <div className="money-bill bill-2"></div>
          <div className="money-bill bill-3"></div>

          {/* Dollar signs flying */}
          <div className="splash-dollar dollar-1">$</div>
          <div className="splash-dollar dollar-2">$</div>
          <div className="splash-dollar dollar-3">$</div>
          <div className="splash-dollar dollar-4">$</div>
          <div className="splash-dollar dollar-5">$</div>

          {/* Coins flying */}
          <div className="splash-coin coin-1"></div>
          <div className="splash-coin coin-2"></div>
          <div className="splash-coin coin-3"></div>
        </div>

        {/* The bag itself */}
        <div className="bag-opening"></div>
        <div className="bag-tie"></div>
        <div className="bag-body">
          <div className="bag-dollar">$</div>
        </div>
      </div>
    </div>
  );
}

export default DuckAnimation;

import './DuckAnimation.css';

function DuckAnimation() {
  return (
    <div className="duck-scene">
      {/* The duck that walks across */}
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

      {/* Money pool on the right side */}
      <div className="money-pool">
        <div className="money-splash"></div>
        <div className="coin coin-1">$</div>
        <div className="coin coin-2">$</div>
        <div className="coin coin-3">$</div>
        <div className="money-wave"></div>
        <div className="money-surface"></div>
      </div>
    </div>
  );
}

export default DuckAnimation;

export default function PlaceholderCard({ title }) {
    return (
      <div className="card">
        <div className="card-header">
          <h2>{title}</h2>
        </div>
        <div className="placeholder-card-body">
          <div className="placeholder-card-icon">🚧</div>
          <p className="placeholder-card-text">Coming Soon</p>
        </div>
      </div>
    )
  }
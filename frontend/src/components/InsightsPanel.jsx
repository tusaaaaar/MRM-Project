function InsightBadge({ tone = "neutral" }) {
  const toneMap = {
    positive: { icon: "✓", className: "insight-badge--positive" },
    warning: { icon: "!", className: "insight-badge--warning" },
    neutral: { icon: "•", className: "insight-badge--neutral" },
  }

  const { icon, className } = toneMap[tone] || toneMap.neutral

  return <span className={`insight-badge ${className}`}>{icon}</span>
}

export default function InsightsPanel({
  title = "AI-Ready Insights",
  description = "Rule-based observations that can later be replaced by AI-generated analysis.",
  items = [],
  tone = "neutral",
}) {
  const safeItems = Array.isArray(items) ? items : []

  return (
    <aside className="insights-card">
      <div className="insights-card__header">
        <p className="eyebrow">AI-READY INSIGHTS</p>
        <h3>{title}</h3>
        <p className="insights-card__description">{description}</p>
      </div>

      <ul className="insights-list">
        {safeItems.length > 0 ? (
          safeItems.map((item, index) => (
            <li key={`${item}-${index}`} className="insights-list__item">
              <InsightBadge tone={tone} />
              <span>{item}</span>
            </li>
          ))
        ) : (
          <li className="insights-list__item insights-list__item--empty">
            <InsightBadge tone="neutral" />
            <span>No insights available yet for this validation view.</span>
          </li>
        )}
      </ul>
    </aside>
  )
}

import { useState, useRef, useId } from "react";

/**
 * Sidebar — primary navigation rail for the Credit Risk console.
 * Light theme, matched to the dashboard's white/gray surface palette.
 * Designed to sit flush against the viewport: full height, no outer
 * margin, so the parent layout just needs `display:flex` with this
 * as the first child and the page content as the second.
 */

const NAV_ITEMS = [
  {
    id: "data-quality",
    label: "Data Quality",
    sub: "Assessment",
    icon: <DataQualityIcon />,
  },
  {
    id: "model-monitoring",
    label: "Model Validation",
    sub: "& Monitoring",
    icon: <MonitoringIcon />,
  },
];

export default function Sidebar({ activePage, onNavigate }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const itemRefs = useRef({});
  const headingId = useId();

  function handleKeyNav(e, index) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const delta = e.key === "ArrowDown" ? 1 : -1;
    const next = (index + delta + NAV_ITEMS.length) % NAV_ITEMS.length;
    itemRefs.current[NAV_ITEMS[next].id]?.focus();
  }

  return (
    <aside
      className={`cr-sidebar ${isCollapsed ? "is-collapsed" : ""}`}
      aria-label="Primary"
    >
      <div className="cr-sidebar__header">
        <button
          type="button"
          className="cr-icon-btn cr-sidebar__toggle"
          onClick={() => setIsCollapsed((c) => !c)}
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          <MenuIcon />
        </button>

        <div className="cr-sidebar__brand">
          <div className="cr-sidebar__mark" aria-hidden="true">
            MRM
          </div>
          {/* <p className="cr-sidebar__name"> MRM </p> */}
        </div>
      </div>

      <nav className="cr-sidebar__nav" aria-labelledby={headingId}>
        <p id={headingId} className="cr-sidebar__section-label">
          Main menu
        </p>

        <ul className="cr-sidebar__list" role="list">
          {NAV_ITEMS.map((item, index) => {
            const isActive = activePage === item.id;
            const showTooltip = isCollapsed && hoveredId === item.id;
            return (
              <li key={item.id} className="cr-sidebar__item-wrap">
                <button
                  type="button"
                  ref={(el) => (itemRefs.current[item.id] = el)}
                  className={`cr-sidebar__item ${isActive ? "is-active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => onNavigate(item.id)}
                  onKeyDown={(e) => handleKeyNav(e, index)}
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onFocus={() => setHoveredId(item.id)}
                  onBlur={() => setHoveredId(null)}
                >
                  <span className="cr-sidebar__accent" aria-hidden="true" />
                  <span className="cr-sidebar__icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="cr-sidebar__label-group">
                    <span className="cr-sidebar__label">{item.label}</span>
                    <span className="cr-sidebar__sublabel">{item.sub}</span>
                  </span>
                </button>

                {showTooltip && (
                  <span className="cr-sidebar__tooltip" role="tooltip">
                    {item.label} {item.sub}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="cr-sidebar__status" title="System status: operational">
        <span className="cr-sidebar__status-dot" aria-hidden="true">
          <span className="cr-sidebar__status-ring" />
        </span>
        <span className="cr-sidebar__status-text">
          <span className="cr-sidebar__status-line">Systems nominal</span>
          <span className="cr-sidebar__status-sub">Synced just now</span>
        </span>
      </div>

      <style>{CSS}</style>
    </aside>
  );
}

/* ---------------------------------- Icons ---------------------------------- */

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M3 6h14M3 10h14M3 14h14"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DataQualityIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M3 12.5 7 8l3 3 7-7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 4h-4M17 4v4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MonitoringIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect
        x="3"
        y="3"
        width="14"
        height="14"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.6"
        opacity="0.5"
      />
      <path
        d="M6 12.5 8.3 9l2 2.4L14.5 7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ---------------------------------- Styles ---------------------------------- */

const CSS = `
.cr-sidebar {
  --bg: #ffffff;
  --hover: #f1f5f9;
  --active-fill: #eef2ff;
  --border: #e2e8f0;
  --text: #0f172a;
  --muted: #64748b;
  --muted-dim: #94a3b8;
  --accent: #10b981;
  --accent-soft: #d1fae5;
  --accent-text: #047857;
  --focus: #3b82f6;
  --radius: 10px;
  --speed: 220ms;
  --ease: cubic-bezier(0.4, 0, 0.2, 1);

  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: sticky;
  top: 0;
  background: var(--bg);
  border-right: 1px solid var(--border);
  font-family: "Inter", -apple-system, "Segoe UI", sans-serif;
  transition: width var(--speed) var(--ease);
  overflow: hidden;
  box-sizing: border-box;
}

.cr-sidebar.is-collapsed {
  width: 76px;
}

/* ---------- Header ---------- */

.cr-sidebar__header {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 64px;
  padding: 0 14px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border);
}

.cr-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  transition: background var(--speed) var(--ease), color var(--speed) var(--ease);
}

.cr-icon-btn:hover {
  background: var(--hover);
  color: var(--text);
}

.cr-icon-btn:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

.cr-sidebar__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
}

.cr-sidebar__mark {
  flex-shrink: 0;
  width: 45px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 650;
  letter-spacing: 0.03em;
  background: var(--accent-soft);
  color: var(--accent-text);
}
cr-sidebar.is-collapsed .cr-sidebar__mark {
  flex-shrink: 0;
  width: 45px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 650;
  letter-spacing: 0.03em;
  background: var(--accent-soft);
  color: var(--accent-text);
}

.cr-sidebar__name {
  margin: 0;
  font-size: 14.5px;
  font-weight: 600;
  color: var(--text);
  opacity: 1;
  transition: opacity 150ms var(--ease);
}

.cr-sidebar.is-collapsed .cr-sidebar__name {
  opacity: 0;
}

/* ---------- Nav ---------- */

.cr-sidebar__nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-top: 18px;
  overflow-y: auto;
  overflow-x: hidden;
}

.cr-sidebar__section-label {
  margin: 0 0 8px;
  padding: 0 22px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted-dim);
  white-space: nowrap;
  opacity: 1;
  transition: opacity 150ms var(--ease);
}

.cr-sidebar.is-collapsed .cr-sidebar__section-label {
  opacity: 0;
}

.cr-sidebar__list {
  list-style: none;
  margin: 0;
  padding: 0 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cr-sidebar__item-wrap {
  position: relative;
}

.cr-sidebar__item {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 10px;
  border: none;
  border-radius: var(--radius);
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: background var(--speed) var(--ease), color var(--speed) var(--ease);
}

.cr-sidebar__item:hover {
  background: var(--hover);
  color: var(--text);
}

.cr-sidebar__item:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

.cr-sidebar__item.is-active {
  background: var(--active-fill);
  color: var(--text);
}

.cr-sidebar__accent {
  position: absolute;
  left: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 0;
  border-radius: 0 3px 3px 0;
  background: var(--accent);
  transition: height var(--speed) var(--ease);
}

.cr-sidebar__item.is-active .cr-sidebar__accent {
  height: 22px;
}

.cr-sidebar__icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cr-sidebar__item.is-active .cr-sidebar__icon {
  color: var(--accent-text);
}

.cr-sidebar__label-group {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  white-space: nowrap;
  opacity: 1;
  transition: opacity 150ms var(--ease);
}

.cr-sidebar.is-collapsed .cr-sidebar__label-group {
  opacity: 0;
  width: 0;
}

.cr-sidebar__label {
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1.2;
}

.cr-sidebar__sublabel {
  font-size: 11px;
  font-weight: 400;
  line-height: 1.2;
  color: var(--muted-dim);
}

.cr-sidebar__item.is-active .cr-sidebar__sublabel {
  color: var(--muted);
}

.cr-sidebar__tooltip {
  position: absolute;
  left: calc(100% + 10px);
  top: 50%;
  transform: translateY(-50%);
  white-space: nowrap;
  background: #1e293b;
  color: #f8fafc;
  font-size: 12.5px;
  font-weight: 500;
  padding: 6px 10px;
  border-radius: 7px;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.25);
  z-index: 20;
  pointer-events: none;
}

/* ---------- Status ---------- */

.cr-sidebar__status {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 16px 20px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
}

.cr-sidebar__status-dot {
  position: relative;
  flex-shrink: 0;
  width: 9px;
  height: 9px;
}

.cr-sidebar__status-dot::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--accent);
}

.cr-sidebar__status-ring {
  position: absolute;
  inset: -5px;
  border-radius: 50%;
  border: 1px solid var(--accent);
  opacity: 0.5;
  animation: cr-pulse 2.4s ease-out infinite;
}

@keyframes cr-pulse {
  0% { transform: scale(0.6); opacity: 0.6; }
  80% { transform: scale(1.9); opacity: 0; }
  100% { transform: scale(1.9); opacity: 0; }
}

.cr-sidebar__status-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  opacity: 1;
  transition: opacity 150ms var(--ease);
}

.cr-sidebar.is-collapsed .cr-sidebar__status-text {
  opacity: 0;
}

.cr-sidebar__status-line {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text);
}

.cr-sidebar__status-sub {
  font-size: 11px;
  color: var(--muted-dim);
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  .cr-sidebar, .cr-sidebar * {
    transition-duration: 0.001ms !important;
    animation-duration: 0.001ms !important;
  }
}
`;
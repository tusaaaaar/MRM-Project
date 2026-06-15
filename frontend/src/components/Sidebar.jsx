export default function Sidebar({ activePage, onNavigate }) {
  const navItems = [
    { id: "data-quality",  label: "Data Quality Assessment", icon: "◈" },
    { id: "dashboard",     label: "Dashboard",               icon: "▦" },
    { id: "scorecard",     label: "Scorecard Analytics",     icon: "◉" },
  ];

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">CR</div>
          <div>
            <p className="sidebar-brand">Credit Risk</p>
            <p className="sidebar-brand-sub">Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <p className="sidebar-nav-label">Main Menu</p>
        <ul className="sidebar-nav-list">
          {navItems.map((item) => (
            <li key={item.id}>
              <a href="#"
                onClick={(e) => { e.preventDefault(); onNavigate(item.id); }}
                className={activePage === item.id ? "sidebar-nav-item sidebar-nav-item--active" : "sidebar-nav-item"}>
                <span className="sidebar-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-dot" />
        <span className="sidebar-footer-text">System Online</span>
      </div>
    </aside>
  );
}
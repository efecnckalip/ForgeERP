function Sidebar({ activePage, setActivePage }) {
  const menuItems = [
    { name: "Dashboard", icon: "📊" },
    { name: "İş Takibi", icon: "🛠️" },
    { name: "Müşteriler", icon: "👥" },
    { name: "Teklifler", icon: "📄" },
  ];

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logoBox}>
        <div style={styles.logo}>F</div>
        <div>
          <h2 style={styles.brand}>ForgeERP</h2>
          <p style={styles.subBrand}>by EFE CNC</p>
        </div>
      </div>

      <nav style={styles.nav}>
        {menuItems.map((item) => {
          const isActive = activePage === item.name;

          return (
            <button
              key={item.name}
              style={{
                ...styles.navButton,
                ...(isActive ? styles.activeButton : {}),
              }}
              onClick={() => setActivePage(item.name)}
            >
              <span style={styles.icon}>{item.icon}</span>
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      <div style={styles.footer}>
        <p style={styles.footerTitle}>EFE CNC KALIP</p>
        <p style={styles.footerText}>Atölye ERP Sistemi</p>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: "260px",
    minHeight: "100vh",
    background: "#020617",
    borderRight: "1px solid #1e293b",
    color: "white",
    padding: "24px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
  },
  logoBox: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "34px",
  },
  logo: {
    width: "44px",
    height: "44px",
    borderRadius: "14px",
    background: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    fontSize: "22px",
  },
  brand: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "900",
  },
  subBrand: {
    margin: "4px 0 0",
    color: "#94a3b8",
    fontSize: "13px",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  navButton: {
    width: "100%",
    background: "transparent",
    color: "#cbd5e1",
    border: "1px solid transparent",
    borderRadius: "14px",
    padding: "13px 14px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    textAlign: "left",
  },
  activeButton: {
    background: "#0f172a",
    color: "white",
    border: "1px solid #1e293b",
  },
  icon: {
    width: "22px",
    display: "inline-flex",
    justifyContent: "center",
  },
  footer: {
    marginTop: "auto",
    borderTop: "1px solid #1e293b",
    paddingTop: "18px",
  },
  footerTitle: {
    margin: 0,
    fontSize: "13px",
    fontWeight: "900",
    color: "#e5e7eb",
  },
  footerText: {
    margin: "6px 0 0",
    fontSize: "12px",
    color: "#64748b",
  },
};

export default Sidebar;
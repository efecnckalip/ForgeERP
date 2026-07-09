import { BarChart3, KeyRound, Users, CreditCard, Package, Activity, Settings } from "lucide-react";

const menu = [
  { key: "dashboard", label: "Dashboard", icon: BarChart3 },
  { key: "licenses", label: "Lisanslar", icon: KeyRound },
  { key: "customers", label: "Müşteriler", icon: Users },
  { key: "payments", label: "Ödemeler", icon: CreditCard },
  { key: "plans", label: "Paketler", icon: Package },
  { key: "logs", label: "Loglar", icon: Activity },
  { key: "settings", label: "Ayarlar", icon: Settings },
];

export default function Sidebar({ page, setPage }) {
  return (
    <aside style={styles.sidebar}>
      <div style={styles.brandBox}>
        <div style={styles.logo}>F</div>
        <div>
          <div style={styles.brand}>ForgeHub</div>
          <div style={styles.subBrand}>Admin Control</div>
        </div>
      </div>

      <nav style={styles.nav}>
        {menu.map((item) => {
          const Icon = item.icon;
          const active = page === item.key;

          return (
            <button
              key={item.key}
              onClick={() => setPage(item.key)}
              style={{
                ...styles.navItem,
                ...(active ? styles.navItemActive : {}),
              }}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div style={styles.footer}>
        <div style={styles.footerTitle}>ForgeERP Cloud</div>
        <div style={styles.footerText}>License Center v1.0</div>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: 260,
    minWidth: 260,
    height: "100vh",
    background: "linear-gradient(180deg, #020617 0%, #0f172a 100%)",
    borderRight: "1px solid rgba(148,163,184,0.15)",
    padding: 22,
    display: "flex",
    flexDirection: "column",
  },
  brandBox: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 34,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    background: "linear-gradient(135deg, #38bdf8, #6366f1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    fontSize: 22,
    color: "white",
    boxShadow: "0 12px 30px rgba(56,189,248,0.25)",
  },
  brand: {
    fontSize: 20,
    fontWeight: 800,
    letterSpacing: "-0.03em",
  },
  subBrand: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  navItem: {
    width: "100%",
    border: "none",
    background: "transparent",
    color: "#cbd5e1",
    padding: "13px 14px",
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    gap: 12,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 700,
    textAlign: "left",
  },
  navItemActive: {
    background: "rgba(56,189,248,0.12)",
    color: "#ffffff",
    boxShadow: "inset 0 0 0 1px rgba(56,189,248,0.22)",
  },
  footer: {
    marginTop: "auto",
    padding: 16,
    borderRadius: 18,
    background: "rgba(15,23,42,0.85)",
    border: "1px solid rgba(148,163,184,0.15)",
  },
  footerTitle: {
    fontSize: 13,
    fontWeight: 800,
  },
  footerText: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
  },
};
import {
  BarChart3,
  Briefcase,
  Building2,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Factory,
  Gauge,
  Package,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  UserRound,
} from "lucide-react";

function Sidebar({ activePage, setActivePage }) {
  const menuItems = [
    { name: "Dashboard", icon: BarChart3, tag: "Genel" },
    { name: "İş Takibi", icon: Briefcase, tag: "MES" },
    { name: "Müşteriler", icon: Building2, tag: "CRM" },
    { name: "Teklifler", icon: ClipboardList, tag: "Satış" },
    { name: "Üretim", icon: Factory, tag: "Atölye" },
    { name: "Stok", icon: Package, tag: "Depo" },
    { name: "Satın Alma", icon: ShoppingCart, tag: "Tedarik" },
    { name: "Finans", icon: CircleDollarSign, tag: "Para" },
    { name: "Ayarlar", icon: Settings, tag: "Sistem" },
  ];

  return (
    <aside style={styles.sidebar}>
      <div style={styles.topGlow} />

      <div style={styles.logoBox}>
        <div style={styles.logo}>
          <Sparkles size={22} />
        </div>

        <div>
          <h2 style={styles.brand}>ForgeERP</h2>
          <p style={styles.subBrand}>by EFE CNC</p>
        </div>
      </div>

      <div style={styles.statusCard}>
        <div style={styles.statusHeader}>
          <div>
            <p style={styles.statusLabel}>Atölye Durumu</p>
            <h3 style={styles.statusTitle}>Sistem Aktif</h3>
          </div>

          <div style={styles.liveDot} />
        </div>

        <div style={styles.machineRow}>
          <Gauge size={17} />
          <span>Sistem</span>
          <strong>Hazır</strong>
        </div>
      </div>

      <nav style={styles.nav}>
        <p style={styles.menuTitle}>MENÜ</p>

        {menuItems.map((item) => {
          const isActive = activePage === item.name;
          const Icon = item.icon;

          return (
            <button
              key={item.name}
              onClick={() => setActivePage(item.name)}
              style={{
                ...styles.navButton,
                ...(isActive ? styles.activeButton : {}),
              }}
            >
              <span
                style={{
                  ...styles.iconBox,
                  ...(isActive ? styles.activeIconBox : {}),
                }}
              >
                <Icon size={19} />
              </span>

              <span style={styles.navText}>{item.name}</span>

              <span
                style={{
                  ...styles.tag,
                  ...(isActive ? styles.activeTag : {}),
                }}
              >
                {item.tag}
              </span>

              {isActive && <ChevronRight size={18} style={styles.arrow} />}
            </button>
          );
        })}
      </nav>

      <div style={styles.bottom}>
        <div style={styles.securityBox}>
          <ShieldCheck size={18} />
          <div>
            <p style={styles.securityTitle}>Local Storage</p>
            <p style={styles.securityText}>Veriler cihazda saklanıyor</p>
          </div>
        </div>

        <div style={styles.userCard}>
          <div style={styles.avatar}>
            <UserRound size={20} />
          </div>

          <div>
            <p style={styles.userName}>Yasin Kulak</p>
            <p style={styles.userRole}>EFE CNC KALIP</p>
          </div>
        </div>

        <p style={styles.version}>ForgeERP v0.2 UI Kit</p>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: "292px",
    minHeight: "100vh",
    background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
    borderRight: "1px solid #e2e8f0",
    color: "#0f172a",
    padding: "22px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    overflow: "hidden",
    boxShadow: "18px 0 45px rgba(15, 23, 42, 0.06)",
  },

  topGlow: {
    position: "absolute",
    top: "-120px",
    left: "-80px",
    width: "260px",
    height: "260px",
    background: "rgba(37, 99, 235, 0.13)",
    borderRadius: "999px",
    filter: "blur(20px)",
  },

  logoBox: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "22px",
  },

  logo: {
    width: "50px",
    height: "50px",
    borderRadius: "18px",
    background: "linear-gradient(135deg, #2563eb, #4f46e5)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 14px 30px rgba(37, 99, 235, 0.28)",
  },

  brand: {
    margin: 0,
    fontSize: "23px",
    fontWeight: "950",
    letterSpacing: "-0.6px",
    color: "#020617",
  },

  subBrand: {
    margin: "3px 0 0",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "700",
  },

  statusCard: {
    position: "relative",
    border: "1px solid #dbeafe",
    background: "linear-gradient(135deg, #eff6ff, #ffffff)",
    borderRadius: "24px",
    padding: "16px",
    marginBottom: "22px",
    boxShadow: "0 12px 30px rgba(37, 99, 235, 0.08)",
  },

  statusHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  statusLabel: {
    margin: 0,
    fontSize: "12px",
    fontWeight: "800",
    color: "#64748b",
  },

  statusTitle: {
    margin: "4px 0 0",
    fontSize: "17px",
    fontWeight: "950",
    color: "#0f172a",
  },

  liveDot: {
    width: "12px",
    height: "12px",
    borderRadius: "999px",
    background: "#22c55e",
    boxShadow: "0 0 0 7px rgba(34, 197, 94, 0.14)",
  },

  machineRow: {
    marginTop: "14px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "10px 12px",
    fontSize: "13px",
    color: "#475569",
    fontWeight: "800",
  },

  nav: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: "7px",
  },

  menuTitle: {
    margin: "0 0 6px",
    paddingLeft: "8px",
    fontSize: "11px",
    fontWeight: "950",
    letterSpacing: "1.2px",
    color: "#94a3b8",
  },

  navButton: {
    width: "100%",
    minHeight: "48px",
    padding: "8px 10px",
    borderRadius: "17px",
    border: "1px solid transparent",
    background: "transparent",
    color: "#475569",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "14px",
    fontWeight: "850",
    transition: "all 0.18s ease",
    textAlign: "left",
  },

  activeButton: {
    background: "linear-gradient(135deg, #2563eb, #4f46e5)",
    border: "1px solid #2563eb",
    color: "#ffffff",
    boxShadow: "0 14px 28px rgba(37, 99, 235, 0.22)",
  },

  iconBox: {
    width: "34px",
    height: "34px",
    borderRadius: "13px",
    background: "#f1f5f9",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  activeIconBox: {
    background: "rgba(255,255,255,0.18)",
    color: "#ffffff",
  },

  navText: {
    flex: 1,
  },

  tag: {
    fontSize: "10px",
    fontWeight: "950",
    color: "#94a3b8",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "999px",
    padding: "4px 7px",
  },

  activeTag: {
    color: "#ffffff",
    background: "rgba(255,255,255,0.16)",
    border: "1px solid rgba(255,255,255,0.22)",
  },

  arrow: {
    marginLeft: "-4px",
  },

  bottom: {
    marginTop: "auto",
    position: "relative",
  },

  securityBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    borderRadius: "18px",
    padding: "12px",
    color: "#2563eb",
    marginBottom: "12px",
  },

  securityTitle: {
    margin: 0,
    fontSize: "12px",
    fontWeight: "950",
    color: "#0f172a",
  },

  securityText: {
    margin: "2px 0 0",
    fontSize: "11px",
    fontWeight: "700",
    color: "#94a3b8",
  },

  userCard: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    borderRadius: "20px",
    padding: "12px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
  },

  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "15px",
    background: "#0f172a",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  userName: {
    margin: 0,
    fontSize: "13px",
    fontWeight: "950",
    color: "#0f172a",
  },

  userRole: {
    margin: "3px 0 0",
    fontSize: "11px",
    fontWeight: "800",
    color: "#64748b",
  },

  version: {
    margin: "12px 0 0",
    textAlign: "center",
    fontSize: "11px",
    fontWeight: "800",
    color: "#94a3b8",
  },
};

export default Sidebar;
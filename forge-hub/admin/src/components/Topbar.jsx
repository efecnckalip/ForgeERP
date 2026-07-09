import { ShieldCheck, Bell, Search } from "lucide-react";

export default function Topbar() {
  const today = new Date().toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <header style={styles.topbar}>
      <div>
        <div style={styles.title}>ForgeHub Admin</div>
        <div style={styles.subtitle}>
          Lisans, demo ve müşteri kontrol merkezi
        </div>
      </div>

      <div style={styles.right}>
        <div style={styles.searchBox}>
          <Search size={16} />
          <span>Hızlı arama yakında</span>
        </div>

        <div style={styles.dateBox}>{today}</div>

        <button style={styles.iconButton}>
          <Bell size={18} />
        </button>

        <div style={styles.status}>
          <ShieldCheck size={17} />
          <span>ForgeHub Online</span>
        </div>
      </div>
    </header>
  );
}

const styles = {
  topbar: {
    height: 86,
    minHeight: 86,
    padding: "0 30px",
    borderBottom: "1px solid rgba(148,163,184,0.15)",
    background: "rgba(15,23,42,0.82)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backdropFilter: "blur(14px)",
  },
  title: {
    fontSize: 22,
    fontWeight: 900,
    letterSpacing: "-0.04em",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#94a3b8",
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  searchBox: {
    height: 40,
    padding: "0 14px",
    borderRadius: 14,
    background: "rgba(2,6,23,0.55)",
    border: "1px solid rgba(148,163,184,0.16)",
    color: "#94a3b8",
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  dateBox: {
    height: 40,
    padding: "0 14px",
    borderRadius: 14,
    background: "rgba(2,6,23,0.55)",
    border: "1px solid rgba(148,163,184,0.16)",
    color: "#e2e8f0",
    fontSize: 13,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    border: "1px solid rgba(148,163,184,0.16)",
    background: "rgba(2,6,23,0.55)",
    color: "#e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  status: {
    height: 40,
    padding: "0 14px",
    borderRadius: 14,
    background: "rgba(34,197,94,0.10)",
    border: "1px solid rgba(34,197,94,0.22)",
    color: "#86efac",
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 800,
  },
};
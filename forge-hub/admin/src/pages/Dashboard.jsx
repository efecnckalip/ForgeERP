import { useEffect, useState } from "react";
import { KeyRound, ShieldCheck, Clock, Ban, Server } from "lucide-react";
import Card from "../components/Card";
import api from "../services/api";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [serverOnline, setServerOnline] = useState(false);

  async function loadDashboard() {
    try {
      const home = await api.get("/");
      setServerOnline(home.data?.status === "online");

      const res = await api.get("/license/list");
      setData(res.data);
    } catch (error) {
      setServerOnline(false);
      console.error("Dashboard yüklenemedi:", error);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const summary = data?.summary || {
    total: 0,
    active: 0,
    demo: 0,
    cancelled: 0,
    enterprise: 0,
  };

  const licenses = data?.licenses || [];
  const lastLicenses = [...licenses].slice(-5).reverse();

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.h1}>Dashboard</h1>
          <p style={styles.p}>
            ForgeHub lisans, demo ve cihaz durum özeti
          </p>
        </div>

        <button onClick={loadDashboard} style={styles.refreshButton}>
          Yenile
        </button>
      </div>

      <div style={styles.grid}>
        <Card
          title="Toplam Lisans"
          value={summary.total}
          subtitle="ForgeHub kayıtlı lisans"
          color="#38bdf8"
        />
        <Card
          title="Aktif Lisans"
          value={summary.active}
          subtitle="Kullanıma açık"
          color="#22c55e"
        />
        <Card
          title="Demo Lisans"
          value={summary.demo}
          subtitle="Deneme kullanıcıları"
          color="#f59e0b"
        />
        <Card
          title="İptal Edilen"
          value={summary.cancelled}
          subtitle="Kapatılmış lisanslar"
          color="#ef4444"
        />
      </div>

      <div style={styles.contentGrid}>
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.h2}>Son Lisanslar</h2>
              <p style={styles.small}>En son oluşturulan 5 lisans</p>
            </div>
            <KeyRound size={20} color="#38bdf8" />
          </div>

          <div style={styles.list}>
            {lastLicenses.length === 0 ? (
              <div style={styles.empty}>Henüz lisans yok.</div>
            ) : (
              lastLicenses.map((license) => (
                <div key={license.licenseKey} style={styles.licenseRow}>
                  <div>
                    <div style={styles.company}>{license.companyName}</div>
                    <div style={styles.key}>{license.licenseKey}</div>
                  </div>

                  <div style={styles.rowRight}>
                    <span style={styles.plan}>{license.plan}</span>
                    <span
                      style={{
                        ...styles.status,
                        ...(license.status === "ACTIVE"
                          ? styles.active
                          : license.status === "CANCELLED"
                          ? styles.cancelled
                          : styles.suspended),
                      }}
                    >
                      {license.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.h2}>Sistem Durumu</h2>
              <p style={styles.small}>ForgeHub servis kontrolü</p>
            </div>
            <Server size={20} color="#22c55e" />
          </div>

          <div style={styles.statusList}>
            <StatusItem
              icon={<ShieldCheck size={19} />}
              label="API Sunucusu"
              value={serverOnline ? "Online" : "Offline"}
              good={serverOnline}
            />

            <StatusItem
              icon={<KeyRound size={19} />}
              label="Lisans Motoru"
              value="Aktif"
              good
            />

            <StatusItem
              icon={<Clock size={19} />}
              label="Demo Kontrol"
              value="Aktif"
              good
            />

            <StatusItem
              icon={<Ban size={19} />}
              label="İptal Sistemi"
              value="Aktif"
              good
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function StatusItem({ icon, label, value, good }) {
  return (
    <div style={styles.statusItem}>
      <div style={styles.statusIcon}>{icon}</div>
      <div>
        <div style={styles.statusLabel}>{label}</div>
        <div style={{ ...styles.statusValue, color: good ? "#86efac" : "#fca5a5" }}>
          {value}
        </div>
      </div>
    </div>
  );
}

const styles = {
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  h1: {
    margin: 0,
    fontSize: 30,
    fontWeight: 900,
    letterSpacing: "-0.04em",
  },
  p: {
    margin: "8px 0 0",
    color: "#94a3b8",
    fontSize: 14,
  },
  refreshButton: {
    border: "1px solid rgba(56,189,248,0.28)",
    background: "rgba(56,189,248,0.12)",
    color: "#bae6fd",
    padding: "11px 16px",
    borderRadius: 14,
    cursor: "pointer",
    fontWeight: 800,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 18,
    marginBottom: 18,
  },
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "1.4fr 0.9fr",
    gap: 18,
  },
  panel: {
    background: "#111827",
    border: "1px solid rgba(148,163,184,0.15)",
    borderRadius: 20,
    padding: 22,
  },
  panelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  h2: {
    margin: 0,
    fontSize: 18,
    fontWeight: 900,
  },
  small: {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: 13,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  empty: {
    padding: 20,
    borderRadius: 16,
    background: "rgba(15,23,42,0.6)",
    color: "#94a3b8",
    textAlign: "center",
  },
  licenseRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderRadius: 16,
    background: "rgba(15,23,42,0.7)",
    border: "1px solid rgba(148,163,184,0.10)",
  },
  company: {
    fontSize: 14,
    fontWeight: 900,
  },
  key: {
    marginTop: 5,
    fontSize: 12,
    color: "#64748b",
    fontFamily: "monospace",
  },
  rowRight: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  plan: {
    fontSize: 12,
    fontWeight: 900,
    color: "#bae6fd",
    padding: "6px 9px",
    borderRadius: 999,
    background: "rgba(56,189,248,0.10)",
  },
  status: {
    fontSize: 11,
    fontWeight: 900,
    padding: "6px 9px",
    borderRadius: 999,
  },
  active: {
    color: "#86efac",
    background: "rgba(34,197,94,0.10)",
  },
  cancelled: {
    color: "#fca5a5",
    background: "rgba(239,68,68,0.10)",
  },
  suspended: {
    color: "#fde68a",
    background: "rgba(245,158,11,0.10)",
  },
  statusList: {
    display: "grid",
    gap: 12,
  },
  statusItem: {
    display: "flex",
    gap: 12,
    padding: 15,
    borderRadius: 16,
    background: "rgba(15,23,42,0.7)",
    border: "1px solid rgba(148,163,184,0.10)",
  },
  statusIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    background: "rgba(56,189,248,0.10)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#7dd3fc",
  },
  statusLabel: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: 700,
  },
  statusValue: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: 900,
  },
};
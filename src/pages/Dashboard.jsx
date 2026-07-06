function Dashboard() {
  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Dashboard</h1>
      <p style={styles.subtitle}>Atölyenin genel durumunu buradan takip et.</p>

      <div style={styles.statsGrid}>
        <Stat title="Aktif İş" value="24" color="#2563eb" />
        <Stat title="Üretimde" value="8" color="#16a34a" />
        <Stat title="Bu Hafta Bitecek" value="5" color="#f59e0b" />
        <Stat title="Bekleyen Tahsilat" value="267.000 ₺" color="#7c3aed" />
      </div>

      <div style={styles.mainGrid}>
        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Aylık İş & Tahsilat Grafiği</h2>
          <div style={styles.fakeChart}>
            <div style={styles.lineBlue}></div>
            <div style={styles.lineGreen}></div>
          </div>
        </section>

        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>İş Durum Dağılımı</h2>

          <div style={styles.statusRow}>
            <div style={styles.circle}>
              <strong>24</strong>
              <span>Toplam İş</span>
            </div>

            <div style={styles.statusList}>
              <p><b style={{ color: "#ef4444" }}>●</b> Geciken <strong>4</strong></p>
              <p><b style={{ color: "#3b82f6" }}>●</b> Üretimde <strong>8</strong></p>
              <p><b style={{ color: "#f59e0b" }}>●</b> Bu Hafta <strong>5</strong></p>
            </div>
          </div>
        </section>

        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Finansal Özet</h2>
          <Box title="Toplam İş" value="363.000 ₺" />
          <Box title="Tahsil Edilen" value="96.000 ₺" green />
          <Box title="Bekleyen" value="267.000 ₺" orange />
        </section>
      </div>

      <section style={styles.tablePanel}>
        <h2 style={styles.panelTitle}>Acil / Yakın İşler</h2>

        <table style={styles.table}>
          <thead>
            <tr>
              <th>İş No</th>
              <th>Müşteri</th>
              <th>İş</th>
              <th>Durum</th>
              <th>Teslim</th>
              <th>Tutar</th>
              <th>Öncelik</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>EFE-26-001</td>
              <td>DEMKA</td>
              <td>Dövme Kalıbı</td>
              <td>CNC</td>
              <td>12.07.2026</td>
              <td>185.000 ₺</td>
              <td>Acil</td>
            </tr>
            <tr>
              <td>EFE-26-002</td>
              <td>FORMELL</td>
              <td>Melamin Kalıbı</td>
              <td>CAM</td>
              <td>15.07.2026</td>
              <td>82.000 ₺</td>
              <td>Yüksek</td>
            </tr>
            <tr>
              <td>EFE-26-003</td>
              <td>KÜTAHYA PORSELEN</td>
              <td>Porselen Kalıp</td>
              <td>Tasarım</td>
              <td>18.07.2026</td>
              <td>96.000 ₺</td>
              <td>Orta</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Stat({ title, value, color }) {
  return (
    <div style={styles.statCard}>
      <p style={styles.statTitle}>{title}</p>
      <h2 style={styles.statValue}>{value}</h2>
      <div style={{ ...styles.glow, background: color }} />
    </div>
  );
}

function Box({ title, value, green, orange }) {
  return (
    <div style={styles.box}>
      <p style={styles.boxTitle}>{title}</p>
      <h3
        style={{
          ...styles.boxValue,
          color: green ? "#22c55e" : orange ? "#f59e0b" : "white",
        }}
      >
        {value}
      </h3>
    </div>
  );
}

const styles = {
  page: {
    padding: "40px",
    color: "white",
  },
  title: {
    fontSize: "34px",
    margin: 0,
  },
  subtitle: {
    color: "#94a3b8",
    marginTop: "8px",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "18px",
    marginTop: "30px",
  },
  statCard: {
    position: "relative",
    overflow: "hidden",
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "20px",
    padding: "24px",
    minHeight: "120px",
  },
  statTitle: {
    color: "#93c5fd",
    margin: 0,
  },
  statValue: {
    fontSize: "32px",
    margin: "12px 0 0",
  },
  glow: {
    position: "absolute",
    right: "-30px",
    bottom: "-30px",
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    opacity: 0.35,
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "2fr 1.5fr 1fr",
    gap: "18px",
    marginTop: "18px",
  },
  panel: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "20px",
    padding: "22px",
  },
  panelTitle: {
    margin: "0 0 18px",
    fontSize: "20px",
  },
  fakeChart: {
    height: "180px",
    position: "relative",
    borderTop: "1px solid #1e293b",
  },
  lineBlue: {
    position: "absolute",
    left: "40px",
    right: "30px",
    top: "70px",
    height: "3px",
    background: "#3b82f6",
    borderRadius: "20px",
  },
  lineGreen: {
    position: "absolute",
    left: "40px",
    right: "30px",
    top: "115px",
    height: "3px",
    background: "#22c55e",
    borderRadius: "20px",
  },
  statusRow: {
    display: "flex",
    alignItems: "center",
    gap: "30px",
  },
  circle: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    background: "#2563eb",
    display: "grid",
    placeItems: "center",
    textAlign: "center",
  },
  statusList: {
    lineHeight: "2",
    flex: 1,
  },
  box: {
    background: "#111827",
    border: "1px solid #1e293b",
    borderRadius: "16px",
    padding: "18px",
    marginBottom: "12px",
  },
  boxTitle: {
    color: "#93c5fd",
    margin: 0,
  },
  boxValue: {
    margin: "8px 0 0",
    fontSize: "22px",
  },
  tablePanel: {
    marginTop: "18px",
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "20px",
    padding: "22px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
};

export default Dashboard;
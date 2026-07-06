import { useMemo, useState } from "react";
import customers from "../data/customers";

function Customers() {
  const [search, setSearch] = useState("");

  const filteredCustomers = useMemo(() => {
    const text = search.toLowerCase().trim();

    if (!text) return customers;

    return customers.filter((customer) => {
      return (
        customer.companyName.toLowerCase().includes(text) ||
        customer.contactPerson.toLowerCase().includes(text) ||
        customer.city.toLowerCase().includes(text) ||
        customer.sector.toLowerCase().includes(text) ||
        customer.status.toLowerCase().includes(text)
      );
    });
  }, [search]);

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.status === "Aktif").length;
  const potentialCustomers = customers.filter((c) => c.status === "Potansiyel").length;
  const passiveCustomers = customers.filter((c) => c.status === "Pasif").length;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Müşteriler</h1>
          <p style={styles.subtitle}>
            Firma bilgileri, yetkililer ve müşteri iş geçmişi.
          </p>
        </div>

        <button style={styles.addButton}>+ Yeni Müşteri</button>
      </div>

      <div style={styles.statsGrid}>
        <StatCard title="Toplam Müşteri" value={totalCustomers} />
        <StatCard title="Aktif" value={activeCustomers} />
        <StatCard title="Potansiyel" value={potentialCustomers} />
        <StatCard title="Pasif" value={passiveCustomers} danger />
      </div>

      <div style={styles.toolbar}>
        <input
          style={styles.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Müşteri, şehir, sektör veya durum ara..."
        />

        <span style={styles.resultText}>
          {filteredCustomers.length} müşteri listeleniyor
        </span>
      </div>

      <div style={styles.grid}>
        {filteredCustomers.map((customer) => (
          <div key={customer.id} style={styles.card}>
            <div style={styles.cardTop}>
              <span style={styles.customerId}>{customer.id}</span>
              <span style={{ ...styles.badge, ...getStatusStyle(customer.status) }}>
                {customer.status}
              </span>
            </div>

            <h2 style={styles.companyName}>{customer.companyName}</h2>
            <p style={styles.sector}>{customer.sector}</p>

            <div style={styles.divider} />

            <div style={styles.infoGrid}>
              <Info label="Yetkili" value={customer.contactPerson} />
              <Info label="Telefon" value={customer.phone} />
              <Info label="E-posta" value={customer.email} />
              <Info label="Şehir" value={customer.city} />
              <Info label="Aktif İş" value={customer.activeJobs} />
              <Info label="Toplam İş" value={customer.totalJobs} />
            </div>

            <div style={styles.lastJob}>
              <span>Son İş Tarihi</span>
              <strong>{formatDate(customer.lastJobDate)}</strong>
            </div>

            <p style={styles.notes}>{customer.notes}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ title, value, danger }) {
  return (
    <div style={styles.statCard}>
      <p style={styles.statTitle}>{title}</p>
      <h3 style={{ ...styles.statValue, color: danger ? "#f87171" : "white" }}>
        {value}
      </h3>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p style={styles.infoLabel}>{label}</p>
      <p style={styles.infoValue}>{value}</p>
    </div>
  );
}

function getStatusStyle(status) {
  if (status === "Aktif") return { background: "#14532d", color: "#86efac" };
  if (status === "Potansiyel") return { background: "#1e3a8a", color: "#93c5fd" };
  if (status === "Pasif") return { background: "#7f1d1d", color: "#fecaca" };
  return { background: "#334155", color: "#cbd5e1" };
}

function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("tr-TR");
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#020617",
    color: "white",
    padding: "40px",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
  },
  title: {
    fontSize: "34px",
    margin: 0,
    fontWeight: "800",
  },
  subtitle: {
    color: "#94a3b8",
    marginTop: "8px",
    marginBottom: 0,
  },
  addButton: {
    background: "#2563eb",
    color: "white",
    border: 0,
    borderRadius: "14px",
    padding: "12px 18px",
    fontWeight: "800",
    cursor: "pointer",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginTop: "28px",
  },
  statCard: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "18px",
    padding: "18px",
  },
  statTitle: {
    color: "#94a3b8",
    margin: 0,
    fontSize: "14px",
  },
  statValue: {
    margin: "10px 0 0",
    fontSize: "30px",
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginTop: "26px",
    flexWrap: "wrap",
  },
  search: {
    width: "min(520px, 100%)",
    background: "#0f172a",
    color: "white",
    border: "1px solid #1e293b",
    borderRadius: "14px",
    padding: "13px 16px",
    outline: "none",
    fontSize: "14px",
  },
  resultText: {
    color: "#94a3b8",
    fontSize: "14px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))",
    gap: "20px",
    marginTop: "24px",
  },
  card: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "22px",
    padding: "22px",
    boxShadow: "0 18px 45px rgba(0,0,0,0.25)",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },
  customerId: {
    color: "#60a5fa",
    fontWeight: "800",
    fontSize: "14px",
  },
  badge: {
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },
  companyName: {
    marginTop: "20px",
    marginBottom: "6px",
    fontSize: "22px",
    lineHeight: "1.25",
  },
  sector: {
    color: "#94a3b8",
    margin: 0,
  },
  divider: {
    height: "1px",
    background: "#1e293b",
    margin: "20px 0",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "14px",
  },
  infoLabel: {
    margin: 0,
    color: "#64748b",
    fontSize: "12px",
  },
  infoValue: {
    margin: "5px 0 0",
    color: "#e5e7eb",
    fontSize: "14px",
    fontWeight: "700",
    wordBreak: "break-word",
  },
  lastJob: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    marginTop: "20px",
    padding: "14px",
    background: "#020617",
    border: "1px solid #1e293b",
    borderRadius: "14px",
    color: "#cbd5e1",
    fontSize: "14px",
  },
  notes: {
    marginTop: "16px",
    marginBottom: 0,
    color: "#94a3b8",
    lineHeight: "1.5",
    fontSize: "14px",
  },
};

export default Customers;
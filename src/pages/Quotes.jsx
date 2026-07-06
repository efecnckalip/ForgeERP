import { useMemo, useState } from "react";
import quotes from "../data/quotes";

function Quotes() {
  const [search, setSearch] = useState("");

  const filteredQuotes = useMemo(() => {
    const text = search.toLowerCase().trim();

    if (!text) return quotes;

    return quotes.filter((quote) => {
      return (
        quote.id.toLowerCase().includes(text) ||
        quote.customer.toLowerCase().includes(text) ||
        quote.partName.toLowerCase().includes(text) ||
        quote.material.toLowerCase().includes(text) ||
        quote.status.toLowerCase().includes(text)
      );
    });
  }, [search]);

  const totalQuotes = quotes.length;
  const waitingQuotes = quotes.filter((q) => q.status === "Bekliyor").length;
  const approvedQuotes = quotes.filter((q) => q.status === "Onaylandı").length;
  const rejectedQuotes = quotes.filter((q) => q.status === "Reddedildi").length;
  const totalAmount = quotes.reduce((sum, q) => sum + q.totalPrice, 0);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Teklifler</h1>
          <p style={styles.subtitle}>
            Müşteri tekliflerini, durumlarını ve toplam tutarları takip et.
          </p>
        </div>

        <button style={styles.addButton}>+ Yeni Teklif</button>
      </div>

      <div style={styles.statsGrid}>
        <StatCard title="Toplam Teklif" value={totalQuotes} />
        <StatCard title="Bekleyen" value={waitingQuotes} />
        <StatCard title="Onaylanan" value={approvedQuotes} success />
        <StatCard title="Reddedilen" value={rejectedQuotes} danger />
        <StatCard title="Toplam Tutar" value={formatMoney(totalAmount)} wide />
      </div>

      <div style={styles.toolbar}>
        <input
          style={styles.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Teklif no, müşteri, parça, malzeme veya durum ara..."
        />

        <span style={styles.resultText}>
          {filteredQuotes.length} teklif listeleniyor
        </span>
      </div>

      <div style={styles.grid}>
        {filteredQuotes.map((quote) => (
          <div key={quote.id} style={styles.card}>
            <div style={styles.cardTop}>
              <span style={styles.quoteId}>{quote.id}</span>
              <span style={{ ...styles.badge, ...getStatusStyle(quote.status) }}>
                {quote.status}
              </span>
            </div>

            <h2 style={styles.partName}>{quote.partName}</h2>
            <p style={styles.customer}>{quote.customer}</p>

            <div style={styles.divider} />

            <div style={styles.infoGrid}>
              <Info label="Malzeme" value={quote.material} />
              <Info label="Adet" value={quote.quantity} />
              <Info label="Birim Fiyat" value={formatMoney(quote.unitPrice)} />
              <Info label="Toplam" value={formatMoney(quote.totalPrice)} highlight />
              <Info label="Teklif Tarihi" value={formatDate(quote.quoteDate)} />
              <Info label="Geçerlilik" value={formatDate(quote.validUntil)} />
              <Info label="Teslim Süresi" value={quote.deliveryTime} />
              <Info label="Sorumlu" value={quote.responsible} />
            </div>

            <div style={styles.totalBox}>
              <span>Teklif Tutarı</span>
              <strong>{formatMoney(quote.totalPrice)}</strong>
            </div>

            <p style={styles.notes}>{quote.notes}</p>

            <div style={styles.actions}>
              <button style={styles.secondaryButton}>Düzenle</button>
              <button style={styles.primaryButton}>PDF</button>
              <button style={styles.successButton}>İşe Dönüştür</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ title, value, danger, success, wide }) {
  return (
    <div style={{ ...styles.statCard, ...(wide ? styles.statCardWide : {}) }}>
      <p style={styles.statTitle}>{title}</p>
      <h3
        style={{
          ...styles.statValue,
          color: danger ? "#f87171" : success ? "#86efac" : "white",
          fontSize: wide ? "24px" : "30px",
        }}
      >
        {value}
      </h3>
    </div>
  );
}

function Info({ label, value, highlight }) {
  return (
    <div>
      <p style={styles.infoLabel}>{label}</p>
      <p style={{ ...styles.infoValue, color: highlight ? "#86efac" : "#e5e7eb" }}>
        {value}
      </p>
    </div>
  );
}

function getStatusStyle(status) {
  if (status === "Onaylandı") return { background: "#14532d", color: "#86efac" };
  if (status === "Bekliyor") return { background: "#713f12", color: "#fde68a" };
  if (status === "Reddedildi") return { background: "#7f1d1d", color: "#fecaca" };
  return { background: "#334155", color: "#cbd5e1" };
}

function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("tr-TR");
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString("tr-TR")} ₺`;
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
  statCardWide: {
    gridColumn: "span 2",
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
    width: "min(560px, 100%)",
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
    gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
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
  quoteId: {
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
  partName: {
    marginTop: "20px",
    marginBottom: "6px",
    fontSize: "22px",
    lineHeight: "1.25",
  },
  customer: {
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
    fontSize: "14px",
    fontWeight: "800",
    wordBreak: "break-word",
  },
  totalBox: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    marginTop: "20px",
    padding: "15px",
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
  actions: {
    display: "flex",
    gap: "10px",
    marginTop: "18px",
    flexWrap: "wrap",
  },
  secondaryButton: {
    background: "#334155",
    color: "white",
    border: 0,
    borderRadius: "12px",
    padding: "10px 14px",
    fontWeight: "800",
    cursor: "pointer",
  },
  primaryButton: {
    background: "#2563eb",
    color: "white",
    border: 0,
    borderRadius: "12px",
    padding: "10px 14px",
    fontWeight: "800",
    cursor: "pointer",
  },
  successButton: {
    background: "#16a34a",
    color: "white",
    border: 0,
    borderRadius: "12px",
    padding: "10px 14px",
    fontWeight: "800",
    cursor: "pointer",
  },
};

export default Quotes;
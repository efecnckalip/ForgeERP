import jobs from "../data/jobs";

function Jobs() {
  return (
    <div style={styles.page}>
      <h1 style={styles.title}>İş Takibi</h1>
      <p style={styles.subtitle}>
        Atölyedeki işleri, durumları ve teslim tarihlerini buradan takip et.
      </p>

      <div style={styles.grid}>
        {jobs.map((job) => (
          <div key={job.id} style={styles.card}>
            <div style={styles.top}>
              <span style={styles.jobId}>{job.id}</span>
              <span style={styles.status}>{job.status}</span>
            </div>

            <h2 style={styles.project}>{job.project}</h2>
            <p style={styles.customer}>{job.customer}</p>

            <div style={styles.info}>
              <p><b>Parça:</b> {job.partName}</p>
              <p><b>Malzeme:</b> {job.material}</p>
              <p><b>Adet:</b> {job.quantity}</p>
              <p><b>Operasyon:</b> {job.operation}</p>
              <p><b>Sorumlu:</b> {job.responsible}</p>
              <p><b>Teslim:</b> {job.dueDate}</p>
              <p><b>Öncelik:</b> {job.priority}</p>
            </div>

            <div style={styles.progressWrap}>
              <div style={styles.progressText}>
                <span>İlerleme</span>
                <span>{job.progress}%</span>
              </div>

              <div style={styles.progressBar}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${job.progress}%`,
                  }}
                />
              </div>
            </div>

            <p style={styles.notes}>{job.notes}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#020617",
    color: "white",
    padding: "40px",
    fontFamily: "Arial, sans-serif",
  },
  title: {
    fontSize: "34px",
    margin: 0,
  },
  subtitle: {
    color: "#94a3b8",
    marginTop: "8px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
    marginTop: "30px",
  },
  card: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "20px",
    padding: "22px",
  },
  top: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },
  jobId: {
    color: "#60a5fa",
    fontWeight: "bold",
  },
  status: {
    background: "#1d4ed8",
    color: "white",
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "bold",
  },
  project: {
    marginTop: "22px",
    marginBottom: "6px",
    fontSize: "22px",
  },
  customer: {
    color: "#94a3b8",
    margin: 0,
  },
  info: {
    marginTop: "18px",
    lineHeight: "1.8",
    color: "#e5e7eb",
    fontSize: "14px",
  },
  progressWrap: {
    marginTop: "20px",
  },
  progressText: {
    display: "flex",
    justifyContent: "space-between",
    color: "#cbd5e1",
    fontSize: "14px",
    marginBottom: "8px",
  },
  progressBar: {
    height: "10px",
    background: "#1e293b",
    borderRadius: "999px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "#22c55e",
    borderRadius: "999px",
  },
  notes: {
    marginTop: "18px",
    color: "#94a3b8",
    lineHeight: "1.5",
  },
};

export default Jobs;
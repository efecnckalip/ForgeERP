import { useEffect, useState } from "react";

const API_URL = "http://localhost:3000";

export default function App() {
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    customerName: "",
    companyName: "",
    email: "",
    licenseType: "demo",
    demoDays: 7,
    deviceLimit: 1,
  });

  async function loadLicenses() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/license/list`);
      const data = await res.json();
      setLicenses(Array.isArray(data) ? data : data.licenses || []);
    } catch (err) {
      alert("Lisanslar alınamadı.");
    } finally {
      setLoading(false);
    }
  }

  async function createLicense(e) {
    e.preventDefault();

    try {
      const res = await fetch(`${API_URL}/license/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          demoDays: Number(form.demoDays),
          deviceLimit: Number(form.deviceLimit),
        }),
      });

      if (!res.ok) throw new Error();

      setForm({
        customerName: "",
        companyName: "",
        email: "",
        licenseType: "demo",
        demoDays: 7,
        deviceLimit: 1,
      });

      await loadLicenses();
      alert("Lisans oluşturuldu.");
    } catch {
      alert("Lisans oluşturulamadı.");
    }
  }

  async function updateStatus(licenseKey, status) {
    try {
      await fetch(`${API_URL}/license/${licenseKey}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      await loadLicenses();
    } catch {
      alert("Durum güncellenemedi.");
    }
  }

  async function extendDemo(licenseKey, days) {
    try {
      await fetch(`${API_URL}/license/${licenseKey}/extend-demo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      });

      await loadLicenses();
    } catch {
      alert("Demo uzatılamadı.");
    }
  }

  async function resetDevices(licenseKey) {
    try {
      const res = await fetch(`${API_URL}/license/${licenseKey}/reset-devices`, {
        method: "POST",
      });

      if (!res.ok) {
        alert("Backend reset-devices route henüz yok. Sonraki adımda ekleyeceğiz.");
        return;
      }

      await loadLicenses();
    } catch {
      alert("Cihazlar sıfırlanamadı.");
    }
  }

  useEffect(() => {
    loadLicenses();
  }, []);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">FH</div>
        <h1>ForgeHub</h1>
        <p>Admin Panel v1.0</p>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h2>Lisans Yönetimi</h2>
            <span>ForgeERP lisanslarını buradan yönet</span>
          </div>

          <button onClick={loadLicenses}>
            {loading ? "Yükleniyor..." : "Yenile"}
          </button>
        </header>

        <section className="card">
          <h3>Yeni Lisans Oluştur</h3>

          <form onSubmit={createLicense} className="form">
            <input
              placeholder="Müşteri adı"
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              required
            />

            <input
              placeholder="Firma adı"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            />

            <input
              placeholder="E-posta"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <select
              value={form.licenseType}
              onChange={(e) => setForm({ ...form, licenseType: e.target.value })}
            >
              <option value="demo">Demo</option>
              <option value="paid">Ücretli</option>
            </select>

            <input
              type="number"
              placeholder="Demo gün"
              value={form.demoDays}
              onChange={(e) => setForm({ ...form, demoDays: e.target.value })}
            />

            <input
              type="number"
              placeholder="Cihaz limiti"
              value={form.deviceLimit}
              onChange={(e) => setForm({ ...form, deviceLimit: e.target.value })}
            />

            <button type="submit">Lisans Oluştur</button>
          </form>
        </section>

        <section className="card">
          <h3>Lisanslar</h3>

          <div className="table">
            <div className="row head">
              <span>Müşteri</span>
              <span>Lisans</span>
              <span>Durum</span>
              <span>Demo</span>
              <span>Cihaz</span>
              <span>İşlem</span>
            </div>

            {licenses.length === 0 && (
              <div className="empty">Henüz lisans yok.</div>
            )}

            {licenses.map((license) => (
              <div className="row" key={license.licenseKey}>
                <span>
                  <b>{license.customerName || "-"}</b>
                  <small>{license.companyName || "-"}</small>
                </span>

                <span>
                  <code>{license.licenseKey}</code>
                </span>

                <span>
                  <strong className={license.status === "active" ? "active" : "cancelled"}>
                    {license.status}
                  </strong>
                </span>

                <span>{license.demoDays ?? "-"} gün</span>

                <span>
                  {(license.devices?.length || 0)} / {license.deviceLimit || 1}
                </span>

                <span className="actions">
                  <button onClick={() => extendDemo(license.licenseKey, 2)}>+2</button>
                  <button onClick={() => extendDemo(license.licenseKey, 7)}>+7</button>
                  <button onClick={() => extendDemo(license.licenseKey, 30)}>+30</button>

                  <button onClick={() => updateStatus(license.licenseKey, "cancelled")}>
                    İptal
                  </button>

                  <button onClick={() => updateStatus(license.licenseKey, "active")}>
                    Aktif
                  </button>

                  <button onClick={() => resetDevices(license.licenseKey)}>
                    Cihaz Sıfırla
                  </button>
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
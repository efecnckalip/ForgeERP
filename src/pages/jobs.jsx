import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "forge_jobs";

const statusLabels = {
  active: "Aktif",
  waiting: "Bekleyen",
  production: "Üretimde",
  completed: "Tamamlanan",
};

const statusStyles = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  waiting: "bg-amber-50 text-amber-700 border-amber-200",
  production: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-slate-100 text-slate-700 border-slate-200",
};

const statusLine = {
  active: "bg-emerald-400",
  waiting: "bg-amber-400",
  production: "bg-blue-400",
  completed: "bg-slate-400",
};

function money(value) {
  return Number(value || 0).toLocaleString("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  });
}

function safe(v) {
  return v || "—";
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function createJobNo() {
  return `JOB-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
}

function getStoredJobs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveStoredJobs(jobs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
}

function normalizeStatus(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("üret") || s.includes("production")) return "production";
  if (s.includes("tamam") || s.includes("completed")) return "completed";
  if (s.includes("bek") || s.includes("waiting")) return "waiting";
  return "active";
}

function normalizeJob(job) {
  const rawId = job.id || job.jobNo || crypto.randomUUID();

  return {
    ...job,
    id: rawId,
    jobNo: job.jobNo || rawId,
    title: job.title || job.jobName || job.partName || job.name || "İsimsiz İş",
    customer: job.customer || job.customerName || "Müşteri Yok",
    status: normalizeStatus(job.status),
    quoteNo: job.quoteNo || job.quoteId || job.offerNo,
    quoteTotal: job.quoteTotal || job.totalPrice || job.price || job.amount || 0,
    quoteType: job.quoteType || job.offerType || "Manuel İş",
    material: job.material || job.materialName,
    materialType: job.materialType || job.materialOwner || job.materialSource,
    deadline: job.deadline || "",
    createdAt: job.createdAt || todayISO(),
  };
}

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState("all");
  const [selectedJob, setSelectedJob] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    title: "",
    customer: "",
    status: "active",
    deadline: "",
    price: "",
    material: "",
    materialType: "",
  });

  useEffect(() => {
    setJobs(getStoredJobs().map(normalizeJob));
  }, []);

  const stats = useMemo(
    () => ({
      all: jobs.length,
      active: jobs.filter((j) => j.status === "active").length,
      waiting: jobs.filter((j) => j.status === "waiting").length,
      production: jobs.filter((j) => j.status === "production").length,
      delayed: jobs.filter(
        (j) => j.deadline && j.deadline < todayISO() && j.status !== "completed"
      ).length,
      completed: jobs.filter((j) => j.status === "completed").length,
    }),
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    if (filter === "all") return jobs;
    if (filter === "delayed") {
      return jobs.filter(
        (j) => j.deadline && j.deadline < todayISO() && j.status !== "completed"
      );
    }
    return jobs.filter((j) => j.status === filter);
  }, [jobs, filter]);

  function handleCreateJob(e) {
    e.preventDefault();

    const newJob = normalizeJob({
      id: crypto.randomUUID(),
      jobNo: createJobNo(),
      title: form.title,
      customer: form.customer,
      status: form.status,
      deadline: form.deadline,
      quoteTotal: Number(form.price || 0),
      amount: Number(form.price || 0),
      totalPrice: Number(form.price || 0),
      material: form.material,
      materialType: form.materialType,
      source: "manual",
      quoteType: "Manuel İş",
      createdAt: todayISO(),
    });

    const updatedJobs = [newJob, ...jobs];

    setJobs(updatedJobs);
    saveStoredJobs(updatedJobs);
    setSelectedJob(newJob);
    setShowModal(false);

    setForm({
      title: "",
      customer: "",
      status: "active",
      deadline: "",
      price: "",
      material: "",
      materialType: "",
    });
  }

  function updateStatus(id, status) {
    const updatedJobs = jobs.map((job) =>
      job.id === id ? { ...job, status } : job
    );

    setJobs(updatedJobs);
    saveStoredJobs(updatedJobs);

    if (selectedJob?.id === id) {
      setSelectedJob((prev) => ({ ...prev, status }));
    }
  }

  function handleDeleteJob(id) {
    if (!window.confirm("Bu işi silmek istediğine emin misin?")) return;

    const updatedJobs = jobs.filter((job) => job.id !== id);

    setJobs(updatedJobs);
    saveStoredJobs(updatedJobs);

    if (selectedJob?.id === id) setSelectedJob(null);
  }

  const detailJob =
    selectedJob && jobs.some((job) => job.id === selectedJob.id)
      ? selectedJob
      : filteredJobs[0];

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">İş Takibi</h1>
          <p className="text-sm text-slate-500">
            Tekliften işe çevrilen işler, üretim durumu ve teklif detayları
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="h-11 px-5 rounded-2xl bg-slate-900 text-white text-sm font-bold shadow-sm hover:bg-slate-800 transition"
        >
          + Yeni İş
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <Card title="Tüm İşler" value={stats.all} active={filter === "all"} onClick={() => setFilter("all")} />
        <Card title="Aktif İş" value={stats.active} active={filter === "active"} onClick={() => setFilter("active")} />
        <Card title="Bekleyen" value={stats.waiting} active={filter === "waiting"} onClick={() => setFilter("waiting")} />
        <Card title="Üretimde" value={stats.production} active={filter === "production"} onClick={() => setFilter("production")} />
        <Card title="Geciken" value={stats.delayed} active={filter === "delayed"} onClick={() => setFilter("delayed")} />
        <Card title="Tamamlanan" value={stats.completed} active={filter === "completed"} onClick={() => setFilter("completed")} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">İş Listesi</h2>
              <p className="text-xs text-slate-400 mt-1">
                {filteredJobs.length} kayıt listeleniyor
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowModal(true)}
                className="text-xs font-bold text-white bg-slate-900 rounded-full px-4 py-2 hover:bg-slate-800"
              >
                + Manuel İş
              </button>

              <span className="text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-100 rounded-full px-3 py-1">
                MES İş Akışı
              </span>
            </div>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              Bu filtrede iş bulunamadı.
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className={`group relative rounded-3xl border p-5 cursor-pointer transition-all ${
                    detailJob?.id === job.id
                      ? "bg-blue-50/60 border-blue-200 shadow-sm"
                      : "bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200 hover:shadow-sm"
                  }`}
                >
                  <div className={`absolute left-0 top-5 bottom-5 w-1 rounded-r-full ${statusLine[job.status]}`} />

                  <div className="flex justify-between gap-5 pl-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="rounded-xl bg-slate-900 text-white text-xs font-bold px-3 py-1">
                          {safe(job.jobNo)}
                        </span>

                        <span className={`text-xs px-2.5 py-1 rounded-full border ${statusStyles[job.status]}`}>
                          {statusLabels[job.status]}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base truncate">
                        {safe(job.title)}
                      </h3>

                      <p className="text-sm text-slate-500 mt-1">
                        Müşteri:{" "}
                        <span className="font-semibold text-slate-700">
                          {safe(job.customer)}
                        </span>
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                        <MiniInfo label="Teklif No" value={safe(job.quoteNo)} />
                        <MiniInfo label="Tutar" value={money(job.quoteTotal)} strong />
                        <MiniInfo label="Malzeme" value={safe(job.material)} />
                        <MiniInfo label="Tip" value={safe(job.materialType)} />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 items-end">
                      <select
                        value={job.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateStatus(job.id, e.target.value)}
                        className="h-10 border border-slate-200 rounded-xl px-3 text-sm bg-white shadow-sm"
                      >
                        <option value="active">Aktif</option>
                        <option value="waiting">Bekleyen</option>
                        <option value="production">Üretimde</option>
                        <option value="completed">Tamamlanan</option>
                      </select>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteJob(job.id);
                        }}
                        className="h-9 px-4 rounded-xl text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100 border border-red-100"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <JobDetail job={detailJob} />
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateJob}
            className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Manuel İş Oluştur
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Teklifsiz gelen işleri buradan üretime al.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                ×
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="İş Adı">
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" />
              </Field>

              <Field label="Müşteri">
                <input required value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} className="input" />
              </Field>

              <Field label="Fiyat / Tutar">
                <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input" placeholder="Örn: 25000" />
              </Field>

              <Field label="Durum">
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input">
                  <option value="active">Aktif</option>
                  <option value="waiting">Bekleyen</option>
                  <option value="production">Üretimde</option>
                  <option value="completed">Tamamlanan</option>
                </select>
              </Field>

              <Field label="Teslim Tarihi">
                <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="input" />
              </Field>

              <Field label="Malzeme">
                <input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} className="input" />
              </Field>

              <Field label="Malzeme Tipi">
                <select value={form.materialType} onChange={(e) => setForm({ ...form, materialType: e.target.value })} className="input">
                  <option value="">Seç</option>
                  <option value="Müşteri Malzemesi">Müşteri Malzemesi</option>
                  <option value="Firma Malzemesi">Firma Malzemesi</option>
                  <option value="Tedarik Edilecek">Tedarik Edilecek</option>
                </select>
              </Field>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button type="button" onClick={() => setShowModal(false)} className="h-11 px-5 rounded-2xl bg-white border border-slate-200 text-slate-600 font-bold">
                Vazgeç
              </button>

              <button type="submit" className="h-11 px-6 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800">
                İşi Kaydet
              </button>
            </div>
          </form>
        </div>
      )}

      <style>{`
        .input {
          width: 100%;
          height: 44px;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 0 14px;
          font-size: 14px;
          outline: none;
          background: white;
        }
        .input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }
      `}</style>
    </div>
  );
}

function Card({ title, value, active, onClick }) {
  return (
    <button onClick={onClick} className={`bg-white border rounded-2xl p-4 text-left shadow-sm transition ${active ? "border-blue-400 ring-2 ring-blue-100" : "border-slate-200 hover:border-slate-300"}`}>
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <p className="text-xs font-bold text-slate-500 mb-2">{label}</p>
      {children}
    </label>
  );
}

function MiniInfo({ label, value, strong }) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2 min-w-0">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className={`text-sm truncate ${strong ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}>
        {value}
      </p>
    </div>
  );
}

function JobDetail({ job }) {
  if (!job) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
        <h2 className="font-semibold text-slate-900">İş Detayı</h2>
        <p className="text-sm text-slate-400 mt-4">Detay görmek için bir iş seç.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 h-fit sticky top-6">
      <div className="rounded-3xl bg-slate-900 text-white p-5 mb-5">
        <p className="text-xs text-slate-300">Seçili İş</p>
        <h2 className="text-lg font-bold mt-1">{safe(job.title)}</h2>
        <p className="text-sm text-slate-300 mt-1">{safe(job.customer)}</p>
        <div className="mt-4 text-2xl font-bold">{money(job.quoteTotal)}</div>
      </div>

      <div className={`mb-5 inline-flex text-xs px-3 py-1.5 rounded-full border ${statusStyles[job.status]}`}>
        {statusLabels[job.status]}
      </div>

      <div className="space-y-3 text-sm">
        <Row label="İş No" value={safe(job.jobNo)} />
        <Row label="Müşteri" value={safe(job.customer)} />
        <Row label="Durum" value={safe(statusLabels[job.status])} />
        <Row label="Teslim Tarihi" value={safe(job.deadline)} />

        <div className="pt-5 mt-5 border-t border-slate-100">
          <h3 className="font-semibold text-slate-900 mb-4">Teklif Bilgileri</h3>
          <Row label="Teklif No" value={safe(job.quoteNo)} />
          <Row label="Teklif Tutarı" value={money(job.quoteTotal)} />
          <Row label="Teklif Türü" value={safe(job.quoteType)} />
          <Row label="Malzeme" value={safe(job.material)} />
          <Row label="Malzeme Tipi" value={safe(job.materialType)} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900 text-right break-all">{value}</span>
    </div>
  );
}
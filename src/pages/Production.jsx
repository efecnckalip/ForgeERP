import { useEffect, useMemo, useState } from "react";

const JOBS_KEY = "forge_jobs";
const PRODUCTION_KEY = "forge_production_flow";

const defaultOperations = [
  "Malzeme Hazır",
  "Kesme",
  "Freze",
  "Delik Delme",
  "Taşlama",
  "Kalite Kontrol",
  "Sevkiyat",
];

function getJobs() {
  try {
    return JSON.parse(localStorage.getItem(JOBS_KEY)) || [];
  } catch {
    return [];
  }
}

function getProductionFlow() {
  try {
    return JSON.parse(localStorage.getItem(PRODUCTION_KEY)) || {};
  } catch {
    return {};
  }
}

function saveProductionFlow(flow) {
  localStorage.setItem(PRODUCTION_KEY, JSON.stringify(flow));
}

function safe(value) {
  return value || "—";
}

function money(value) {
  return Number(value || 0).toLocaleString("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  });
}

function getJobId(job) {
  return job.id || job.jobNo;
}

function createFlowForJob(job, savedFlow) {
  const id = getJobId(job);

  if (savedFlow[id]) {
    return savedFlow[id];
  }

  return {
    operations: defaultOperations.map((name) => ({
      name,
      completed: false,
    })),
    note: "",
    machine: "AWEA BM1200",
    operator: "",
  };
}

function getProgress(flow) {
  if (!flow?.operations?.length) return 0;

  const completed = flow.operations.filter((op) => op.completed).length;
  return Math.round((completed / flow.operations.length) * 100);
}

export default function Production() {
  const [jobs, setJobs] = useState([]);
  const [flows, setFlows] = useState({});
  const [selectedJobId, setSelectedJobId] = useState(null);

  useEffect(() => {
    const loadedJobs = getJobs();
    const savedFlow = getProductionFlow();

    const nextFlows = {};
    loadedJobs.forEach((job) => {
      const id = getJobId(job);
      if (id) nextFlows[id] = createFlowForJob(job, savedFlow);
    });

    setJobs(loadedJobs);
    setFlows(nextFlows);
    saveProductionFlow(nextFlows);

    if (loadedJobs[0]) {
      setSelectedJobId(getJobId(loadedJobs[0]));
    }
  }, []);

  const activeJobs = useMemo(() => {
    return jobs.filter((job) => job.status !== "completed");
  }, [jobs]);

  const selectedJob = useMemo(() => {
    return jobs.find((job) => getJobId(job) === selectedJobId);
  }, [jobs, selectedJobId]);

  const selectedFlow = selectedJob ? flows[getJobId(selectedJob)] : null;

  const stats = useMemo(() => {
    const progresses = jobs.map((job) => {
      const flow = flows[getJobId(job)];
      return getProgress(flow);
    });

    const avg =
      progresses.length > 0
        ? Math.round(progresses.reduce((a, b) => a + b, 0) / progresses.length)
        : 0;

    return {
      total: jobs.length,
      active: activeJobs.length,
      completed: progresses.filter((p) => p === 100).length,
      average: avg,
    };
  }, [jobs, flows, activeJobs.length]);

  function updateFlow(jobId, newFlow) {
    const updated = {
      ...flows,
      [jobId]: newFlow,
    };

    setFlows(updated);
    saveProductionFlow(updated);
  }

  function toggleOperation(index) {
    if (!selectedJob || !selectedFlow) return;

    const jobId = getJobId(selectedJob);

    const updatedOperations = selectedFlow.operations.map((op, i) =>
      i === index ? { ...op, completed: !op.completed } : op
    );

    updateFlow(jobId, {
      ...selectedFlow,
      operations: updatedOperations,
    });
  }

  function updateField(field, value) {
    if (!selectedJob || !selectedFlow) return;

    const jobId = getJobId(selectedJob);

    updateFlow(jobId, {
      ...selectedFlow,
      [field]: value,
    });
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Üretim MES</h1>
          <p className="text-sm text-slate-500">
            İş emirleri, operasyon akışı ve üretim ilerleme takibi
          </p>
        </div>

        <div className="h-11 px-5 rounded-2xl bg-slate-900 text-white text-sm font-bold flex items-center">
          AWEA BM1200 Hazır
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Toplam İş" value={stats.total} />
        <StatCard title="Aktif Üretim" value={stats.active} />
        <StatCard title="Tamamlanan Akış" value={stats.completed} />
        <StatCard title="Ortalama İlerleme" value={`%${stats.average}`} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Üretimdeki İşler</h2>
            <p className="text-xs text-slate-400 mt-1">
              İş seç, operasyonları yönet
            </p>
          </div>

          {jobs.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-sm">
              Henüz üretime alınmış iş yok.
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {jobs.map((job) => {
                const id = getJobId(job);
                const flow = flows[id];
                const progress = getProgress(flow);
                const active = selectedJobId === id;

                return (
                  <button
                    key={id}
                    onClick={() => setSelectedJobId(id)}
                    className={`w-full text-left rounded-3xl border p-4 transition ${
                      active
                        ? "bg-blue-50 border-blue-200 shadow-sm"
                        : "bg-white border-slate-100 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white bg-slate-900 rounded-xl px-3 py-1 inline-flex">
                          {safe(job.jobNo || id)}
                        </p>

                        <h3 className="font-bold text-slate-900 mt-3 truncate">
                          {safe(job.title || job.jobName || job.partName)}
                        </h3>

                        <p className="text-sm text-slate-500 mt-1 truncate">
                          {safe(job.customer || job.customerName)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xl font-bold text-slate-900">
                          %{progress}
                        </p>
                        <p className="text-xs text-slate-400">ilerleme</p>
                      </div>
                    </div>

                    <div className="mt-4 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-slate-900 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          {!selectedJob || !selectedFlow ? (
            <div className="p-10 text-slate-400 text-sm">
              Üretim detayı için bir iş seç.
            </div>
          ) : (
            <>
              <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-400">
                    ÜRETİM EMRİ
                  </p>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">
                    {safe(selectedJob.title || selectedJob.jobName)}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {safe(selectedJob.customer || selectedJob.customerName)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-3xl font-black text-slate-900">
                    %{getProgress(selectedFlow)}
                  </p>
                  <p className="text-xs text-slate-400">tamamlandı</p>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Info label="İş No" value={safe(selectedJob.jobNo)} />
                <Info label="Teklif Tutarı" value={money(selectedJob.quoteTotal)} />
                <Info label="Malzeme" value={safe(selectedJob.material)} />
              </div>

              <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Makine">
                  <input
                    value={selectedFlow.machine}
                    onChange={(e) => updateField("machine", e.target.value)}
                    className="input"
                  />
                </Field>

                <Field label="Operatör">
                  <input
                    value={selectedFlow.operator}
                    onChange={(e) => updateField("operator", e.target.value)}
                    className="input"
                    placeholder="Operatör adı"
                  />
                </Field>
              </div>

              <div className="px-6 pb-6">
                <h3 className="font-bold text-slate-900 mb-4">
                  Operasyon Akışı
                </h3>

                <div className="space-y-3">
                  {selectedFlow.operations.map((operation, index) => (
                    <button
                      key={operation.name}
                      onClick={() => toggleOperation(index)}
                      className={`w-full rounded-2xl border p-4 flex items-center justify-between transition ${
                        operation.completed
                          ? "bg-emerald-50 border-emerald-200"
                          : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black ${
                            operation.completed
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {operation.completed ? "✓" : index + 1}
                        </div>

                        <div className="text-left">
                          <p className="font-bold text-slate-900">
                            {operation.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {operation.completed
                              ? "Tamamlandı"
                              : "Bekliyor"}
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-bold text-slate-400">
                        Operasyon
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-6 pb-6">
                <Field label="Üretim Notu">
                  <textarea
                    value={selectedFlow.note}
                    onChange={(e) => updateField("note", e.target.value)}
                    className="textarea"
                    placeholder="Örn: Parça bağlandı, ilk operasyon başladı..."
                  />
                </Field>
              </div>
            </>
          )}
        </div>
      </div>

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

        .textarea {
          width: 100%;
          min-height: 90px;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 14px;
          font-size: 14px;
          outline: none;
          background: white;
          resize: vertical;
        }

        .input:focus,
        .textarea:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }
      `}</style>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-bold text-slate-900 mt-1">{value}</p>
    </div>
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
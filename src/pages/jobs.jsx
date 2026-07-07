import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  LayoutGrid,
  Table,
  Briefcase,
  CalendarDays,
  Factory,
  Trash2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Activity,
  X,
  Save,
  FileText,
  ListChecks,
} from "lucide-react";

const STORAGE_KEY = "forge_jobs";

const statuses = ["Bekliyor", "CAM", "CNC", "Kontrol", "Tamamlandı"];

const statusColors = {
  Bekliyor: "bg-amber-50 text-amber-700 border-amber-200",
  CAM: "bg-purple-50 text-purple-700 border-purple-200",
  CNC: "bg-blue-50 text-blue-700 border-blue-200",
  Kontrol: "bg-cyan-50 text-cyan-700 border-cyan-200",
  Tamamlandı: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const emptyForm = {
  customer: "",
  part: "",
  status: "Bekliyor",
  priority: "Normal",
  machine: "AWEA BM1200",
  deadline: "",
};

const defaultOperations = [
  { id: "op-1", title: "Malzeme hazırlandı", done: false, hours: 0.5 },
  { id: "op-2", title: "CAM programı hazırlandı", done: false, hours: 1.5 },
  { id: "op-3", title: "Tezgaha bağlandı", done: false, hours: 0.5 },
  { id: "op-4", title: "CNC kaba işleme", done: false, hours: 3 },
  { id: "op-5", title: "CNC finiş işleme", done: false, hours: 2 },
  { id: "op-6", title: "Ölçüm / kontrol", done: false, hours: 0.5 },
];

const machineMultiplier = {
  "AWEA BM1200": 1,
  "CNC Torna": 0.85,
  "Kalıp Taşlama": 1.2,
};

function calcProgress(operations = []) {
  if (!operations.length) return 0;
  const done = operations.filter((op) => op.done).length;
  return Math.round((done / operations.length) * 100);
}

function calcHours(job) {
  const total = (job.operations || []).reduce(
    (sum, op) => sum + Number(op.hours || 0),
    0
  );

  const multiplier = machineMultiplier[job.machine] || 1;
  return Math.round(total * multiplier * 10) / 10;
}

function normalizeJob(job) {
  const operations =
    Array.isArray(job.operations) && job.operations.length > 0
      ? job.operations.map((op, index) => ({
          id: op.id || `op-${Date.now()}-${index}`,
          title: op.title || op.text || "Operasyon",
          done: Boolean(op.done),
          hours: Number(op.hours || 1),
        }))
      : defaultOperations;

  return {
    ...job,
    note: job.note || "",
    operations,
    progress: calcProgress(operations),
    estimatedHours: calcHours({ ...job, operations }),
  };
}

export default function Jobs() {
  const [jobs, setJobs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return parsed.map(normalizeJob);
    } catch {
      return [];
    }
  });

  const [view, setView] = useState("kanban");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tümü");
  const [priorityFilter, setPriorityFilter] = useState("Tümü");
  const [machineFilter, setMachineFilter] = useState("Tümü");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [detailJob, setDetailJob] = useState(null);
  const [newOperation, setNewOperation] = useState("");
  const [newOperationHours, setNewOperationHours] = useState(1);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  }, [jobs]);

  const stats = useMemo(() => {
    const active = jobs.filter((j) => j.status !== "Tamamlandı").length;
    const waiting = jobs.filter((j) => j.status === "Bekliyor").length;
    const production = jobs.filter(
      (j) => j.status === "CAM" || j.status === "CNC"
    ).length;
    const completed = jobs.filter((j) => j.status === "Tamamlandı").length;

    const today = new Date().toISOString().slice(0, 10);
    const delayed = jobs.filter(
      (j) => j.deadline && j.deadline < today && j.status !== "Tamamlandı"
    ).length;

    return { active, waiting, production, delayed, completed };
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const text = `${job.customer} ${job.part} ${job.code}`.toLowerCase();

      return (
        text.includes(search.toLowerCase()) &&
        (statusFilter === "Tümü" || job.status === statusFilter) &&
        (priorityFilter === "Tümü" || job.priority === priorityFilter) &&
        (machineFilter === "Tümü" || job.machine === machineFilter)
      );
    });
  }, [jobs, search, statusFilter, priorityFilter, machineFilter]);

  const openModal = () => {
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setForm(emptyForm);
    setIsModalOpen(false);
  };

  const saveJob = () => {
    if (!form.customer.trim() || !form.part.trim()) {
      alert("Müşteri ve parça adı boş olamaz kanka.");
      return;
    }

    const newJob = normalizeJob({
      id: Date.now(),
      code: `JOB-2026-${String(jobs.length + 1).padStart(3, "0")}`,
      customer: form.customer,
      part: form.part,
      status: form.status,
      priority: form.priority,
      machine: form.machine,
      deadline: form.deadline || new Date().toISOString().slice(0, 10),
      note: "",
      operations: defaultOperations,
    });

    setJobs([newJob, ...jobs]);
    closeModal();
  };

  const deleteJob = (id) => {
    const ok = confirm("Bu işi silmek istiyor musun?");
    if (!ok) return;

    setJobs(jobs.filter((job) => job.id !== id));
    setDetailJob(null);
  };

  const updateStatus = (id, status) => {
    setJobs(
      jobs.map((job) =>
        job.id === id ? normalizeJob({ ...job, status }) : job
      )
    );
  };

  const openDetail = (job) => {
    setDetailJob(normalizeJob(job));
    setNewOperation("");
    setNewOperationHours(1);
  };

  const saveDetailJob = () => {
    if (!detailJob.customer.trim() || !detailJob.part.trim()) {
      alert("Müşteri ve parça adı boş olamaz kanka.");
      return;
    }

    const updatedJob = normalizeJob(detailJob);
    setJobs(jobs.map((job) => (job.id === updatedJob.id ? updatedJob : job)));
    setDetailJob(null);
  };

  const updateDetail = (changes) => {
    const updated = normalizeJob({ ...detailJob, ...changes });
    setDetailJob(updated);
  };

  const toggleOperation = (operationId) => {
    updateDetail({
      operations: detailJob.operations.map((op) =>
        op.id === operationId ? { ...op, done: !op.done } : op
      ),
    });
  };

  const deleteOperation = (operationId) => {
    updateDetail({
      operations: detailJob.operations.filter((op) => op.id !== operationId),
    });
  };

  const addOperation = () => {
    if (!newOperation.trim()) return;

    const op = {
      id: `op-${Date.now()}`,
      title: newOperation.trim(),
      done: false,
      hours: Number(newOperationHours || 1),
    };

    updateDetail({
      operations: [...detailJob.operations, op],
    });

    setNewOperation("");
    setNewOperationHours(1);
  };

  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-bold text-blue-600 shadow-sm">
            <Briefcase size={14} />
            ForgeERP Üretim
          </div>

          <h1 className="mt-3 text-3xl font-black text-slate-950">
            İş Takibi 3.4
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Operasyon, süre tahmini ve üretim ilerleme takibi.
          </p>
        </div>

        <button
          onClick={openModal}
          className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
        >
          <Plus size={18} />
          Yeni İş
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Aktif İş" value={stats.active} note="Devam eden işler" icon={<Activity size={20} />} />
        <StatCard title="Bekleyen" value={stats.waiting} note="Başlamayı bekleyenler" icon={<Clock size={20} />} />
        <StatCard title="Üretimde" value={stats.production} note="CAM / CNC hattı" icon={<Factory size={20} />} />
        <StatCard title="Geciken" value={stats.delayed} note="Termin riski" icon={<AlertTriangle size={20} />} />
        <StatCard title="Tamamlanan" value={stats.completed} note="Kapanmış işler" icon={<CheckCircle2 size={20} />} />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Search size={18} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="İş, müşteri, parça ara..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="xl:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none">
            <option>Tümü</option>
            {statuses.map((s) => <option key={s}>{s}</option>)}
          </select>

          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="xl:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none">
            <option>Tümü</option>
            <option>Düşük</option>
            <option>Normal</option>
            <option>Yüksek</option>
            <option>Kritik</option>
          </select>

          <select value={machineFilter} onChange={(e) => setMachineFilter(e.target.value)} className="xl:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none">
            <option>Tümü</option>
            <option>AWEA BM1200</option>
            <option>CNC Torna</option>
            <option>Kalıp Taşlama</option>
          </select>

          <div className="xl:col-span-2 flex gap-2">
            <button onClick={() => setView("table")} className={`flex-1 rounded-2xl px-4 py-3 text-sm font-bold ${view === "table" ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-600 border border-slate-200"}`}>
              <Table size={16} className="inline mr-2" />
              Tablo
            </button>

            <button onClick={() => setView("kanban")} className={`flex-1 rounded-2xl px-4 py-3 text-sm font-bold ${view === "kanban" ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-600 border border-slate-200"}`}>
              <LayoutGrid size={16} className="inline mr-2" />
              Kanban
            </button>
          </div>
        </div>
      </div>

      {view === "kanban" ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
          {statuses.map((status) => {
            const statusJobs = filteredJobs.filter((job) => job.status === status);

            return (
              <div key={status} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusColors[status]}`}>
                    {status}
                  </span>
                  <span className="text-sm font-bold text-slate-400">{statusJobs.length}</span>
                </div>

                <div className="space-y-3">
                  {statusJobs.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-400">
                      Kayıt yok
                    </div>
                  ) : (
                    statusJobs.map((job) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        onOpen={openDetail}
                        onDelete={deleteJob}
                        onStatusChange={updateStatus}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-5 py-4">Kod</th>
                <th className="px-5 py-4">Müşteri</th>
                <th className="px-5 py-4">Parça</th>
                <th className="px-5 py-4">Durum</th>
                <th className="px-5 py-4">Öncelik</th>
                <th className="px-5 py-4">Makine</th>
                <th className="px-5 py-4">Termin</th>
                <th className="px-5 py-4">Süre</th>
                <th className="px-5 py-4">İşlem</th>
              </tr>
            </thead>

            <tbody>
              {filteredJobs.map((job) => (
                <tr
                  key={job.id}
                  onClick={() => openDetail(job)}
                  className="border-t border-slate-100 cursor-pointer hover:bg-slate-50"
                >
                  <td className="px-5 py-4 font-black text-slate-900">{job.code}</td>
                  <td className="px-5 py-4 text-slate-600">{job.customer}</td>
                  <td className="px-5 py-4 text-slate-600">{job.part}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusColors[job.status]}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{job.priority}</td>
                  <td className="px-5 py-4 text-slate-600">{job.machine}</td>
                  <td className="px-5 py-4 text-slate-600">{job.deadline}</td>
                  <td className="px-5 py-4 font-bold text-blue-600">{job.estimatedHours} saat</td>
                  <td className="px-5 py-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteJob(job.id);
                      }}
                      className="rounded-xl bg-red-50 p-2 text-red-500 hover:bg-red-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredJobs.length === 0 && (
                <tr>
                  <td colSpan="9" className="px-5 py-10 text-center text-slate-400">
                    Henüz kayıtlı iş yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <NewJobModal
          form={form}
          setForm={setForm}
          closeModal={closeModal}
          saveJob={saveJob}
        />
      )}

      {detailJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black text-blue-600">
                  <FileText size={14} />
                  {detailJob.code}
                </div>

                <h2 className="mt-3 text-2xl font-black text-slate-950">
                  İş Detayı / AI Süre Tahmini
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Operasyon ekle, süre ver, sistem toplam süreyi hesaplasın.
                </p>
              </div>

              <button
                onClick={() => setDetailJob(null)}
                className="rounded-2xl bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              <InfoBox title="Tahmini Süre" value={`${detailJob.estimatedHours} saat`} />
              <InfoBox title="İlerleme" value={`%${detailJob.progress}`} />
              <InfoBox
                title="Operasyon"
                value={`${detailJob.operations.filter((op) => op.done).length} / ${detailJob.operations.length}`}
              />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Müşteri">
                <input value={detailJob.customer} onChange={(e) => updateDetail({ customer: e.target.value })} className="input" />
              </Field>

              <Field label="Parça / İş Adı">
                <input value={detailJob.part} onChange={(e) => updateDetail({ part: e.target.value })} className="input" />
              </Field>

              <Field label="Durum">
                <select value={detailJob.status} onChange={(e) => updateDetail({ status: e.target.value })} className="input">
                  {statuses.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>

              <Field label="Öncelik">
                <select value={detailJob.priority} onChange={(e) => updateDetail({ priority: e.target.value })} className="input">
                  <option>Düşük</option>
                  <option>Normal</option>
                  <option>Yüksek</option>
                  <option>Kritik</option>
                </select>
              </Field>

              <Field label="Makine">
                <select value={detailJob.machine} onChange={(e) => updateDetail({ machine: e.target.value })} className="input">
                  <option>AWEA BM1200</option>
                  <option>CNC Torna</option>
                  <option>Kalıp Taşlama</option>
                </select>
              </Field>

              <Field label="Termin">
                <input type="date" value={detailJob.deadline} onChange={(e) => updateDetail({ deadline: e.target.value })} className="input" />
              </Field>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-700">
                  <FileText size={18} />
                  Notlar
                </div>

                <textarea
                  value={detailJob.note}
                  onChange={(e) => updateDetail({ note: e.target.value })}
                  placeholder="Bu işle ilgili not yaz..."
                  className="min-h-44 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none"
                />
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-700">
                  <ListChecks size={18} />
                  Operasyon Checklist
                </div>

                <div className="space-y-2">
                  {detailJob.operations.map((op) => (
                    <div key={op.id} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3">
                      <input
                        type="checkbox"
                        checked={op.done}
                        onChange={() => toggleOperation(op.id)}
                        className="h-5 w-5"
                      />

                      <input
                        value={op.title}
                        onChange={(e) =>
                          updateDetail({
                            operations: detailJob.operations.map((item) =>
                              item.id === op.id ? { ...item, title: e.target.value } : item
                            ),
                          })
                        }
                        className={`flex-1 bg-transparent text-sm font-bold outline-none ${
                          op.done ? "line-through text-slate-400" : "text-slate-700"
                        }`}
                      />

                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={op.hours}
                        onChange={(e) =>
                          updateDetail({
                            operations: detailJob.operations.map((item) =>
                              item.id === op.id ? { ...item, hours: Number(e.target.value) } : item
                            ),
                          })
                        }
                        className="w-20 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-center text-sm font-bold outline-none"
                      />

                      <span className="text-xs font-bold text-slate-400">saat</span>

                      <button
                        onClick={() => deleteOperation(op.id)}
                        className="rounded-xl bg-red-50 p-2 text-red-500 hover:bg-red-100"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-12 gap-2">
                  <input
                    value={newOperation}
                    onChange={(e) => setNewOperation(e.target.value)}
                    placeholder="Yeni operasyon adı..."
                    className="col-span-7 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none"
                  />

                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={newOperationHours}
                    onChange={(e) => setNewOperationHours(e.target.value)}
                    className="col-span-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center text-sm font-bold outline-none"
                  />

                  <button
                    onClick={addOperation}
                    className="col-span-3 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700"
                  >
                    + Ekle
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-slate-100 pt-5">
              <button
                onClick={() => deleteJob(detailJob.id)}
                className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-5 py-3 text-sm font-bold text-red-600 hover:bg-red-100"
              >
                <Trash2 size={18} />
                İşi Sil
              </button>

              <div className="flex gap-3">
                <button onClick={() => setDetailJob(null)} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
                  İptal
                </button>

                <button onClick={saveDetailJob} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700">
                  <Save size={18} />
                  Değişiklikleri Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .input {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid rgb(226 232 240);
          background: rgb(248 250 252);
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          outline: none;
        }
      `}</style>
    </div>
  );
}

function NewJobModal({ form, setForm, closeModal, saveJob }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-2xl font-black text-slate-950">Yeni İş Emri</h2>
            <p className="mt-1 text-sm text-slate-500">
              Müşteri, parça, makine ve termin bilgisini gir.
            </p>
          </div>

          <button onClick={closeModal} className="rounded-2xl bg-slate-100 p-2 text-slate-500 hover:bg-slate-200">
            <X size={20} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Müşteri">
            <input value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} placeholder="ABC Plastik" className="input" />
          </Field>

          <Field label="Parça / İş Adı">
            <input value={form.part} onChange={(e) => setForm({ ...form, part: e.target.value })} placeholder="Kapak kalıbı" className="input" />
          </Field>

          <Field label="Durum">
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input">
              {statuses.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>

          <Field label="Öncelik">
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="input">
              <option>Düşük</option>
              <option>Normal</option>
              <option>Yüksek</option>
              <option>Kritik</option>
            </select>
          </Field>

          <Field label="Makine">
            <select value={form.machine} onChange={(e) => setForm({ ...form, machine: e.target.value })} className="input">
              <option>AWEA BM1200</option>
              <option>CNC Torna</option>
              <option>Kalıp Taşlama</option>
            </select>
          </Field>

          <Field label="Termin">
            <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="input" />
          </Field>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={closeModal} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
            İptal
          </button>

          <button onClick={saveJob} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700">
            <Save size={18} />
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function InfoBox({ title, value }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
        {title}
      </p>
      <h3 className="mt-2 text-2xl font-black text-slate-950">{value}</h3>
    </div>
  );
}

function StatCard({ title, value, note, icon }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-black text-slate-500">{title}</p>
          <h3 className="mt-3 text-3xl font-black text-slate-950">{value}</h3>
        </div>

        <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">{icon}</div>
      </div>

      <p className="mt-4 text-xs font-semibold text-slate-400">{note}</p>
    </div>
  );
}

function JobCard({ job, onOpen, onDelete, onStatusChange }) {
  const doneOps = job.operations?.filter((op) => op.done).length || 0;
  const totalOps = job.operations?.length || 0;

  return (
    <div
      onClick={() => onOpen(job)}
      className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black text-blue-600">{job.code}</p>
          <h3 className="mt-1 text-base font-black text-slate-950">{job.part}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">{job.customer}</p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(job.id);
          }}
          className="rounded-xl bg-red-50 p-2 text-red-500 hover:bg-red-100"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-500">
          {job.priority}
        </span>

        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black text-blue-600">
          {job.estimatedHours} saat
        </span>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
          <span className="flex items-center gap-2 text-slate-500">
            <Factory size={15} />
            Makine
          </span>
          <strong className="text-slate-800">{job.machine}</strong>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
          <span className="flex items-center gap-2 text-slate-500">
            <CalendarDays size={15} />
            Termin
          </span>
          <strong className="text-slate-800">{job.deadline}</strong>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs font-bold">
          <span className="text-slate-500">
            Operasyon {doneOps}/{totalOps}
          </span>
          <span className="text-slate-900">%{job.progress}</span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-blue-600" style={{ width: `${job.progress}%` }} />
        </div>
      </div>

      <select
        value={job.status}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onStatusChange(job.id, e.target.value)}
        className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 outline-none"
      >
        {statuses.map((status) => <option key={status}>{status}</option>)}
      </select>
    </div>
  );
}
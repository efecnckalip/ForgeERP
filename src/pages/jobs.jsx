/* ForgeERP Jobs v5 Enterprise */
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Edit3,
  Factory,
  FileText,
  Filter,
  ListChecks,
  PackageCheck,
  Plus,
  Printer,
  Search,
  ShieldCheck,
  Timer,
  Trash2,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import {
  getJobs,
  addJob,
  updateJob,
  deleteJob,
  getActivePeriod,
} from "../utils/storage";
import { getCurrentPeriod, getRecentPeriods } from "../utils/period";
import { printDeliveryNoteDocument } from "../services/documentService";

const finalStatuses = ["completed", "delivered", "cancelled"];

const statusLabels = {
  waiting: "Bekleyen",
  production: "Üretimde",
  quality: "Kalite",
  ready: "Hazır",
  delivered: "Teslim Edildi",
  completed: "Tamamlandı",
  cancelled: "İptal",
};

const statusStyles = {
  waiting: "border-amber-200 bg-amber-50 text-amber-700",
  production: "border-blue-200 bg-blue-50 text-blue-700",
  quality: "border-violet-200 bg-violet-50 text-violet-700",
  ready: "border-cyan-200 bg-cyan-50 text-cyan-700",
  delivered: "border-slate-200 bg-slate-100 text-slate-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-red-200 bg-red-50 text-red-700",
};

const statusLine = {
  waiting: "bg-amber-400",
  production: "bg-blue-500",
  quality: "bg-violet-500",
  ready: "bg-cyan-500",
  delivered: "bg-slate-400",
  completed: "bg-emerald-500",
  cancelled: "bg-red-500",
};

const emptyForm = {
  title: "",
  customer: "",
  status: "waiting",
  deadline: "",
  price: "",
  material: "",
  materialType: "",
  machineName: "",
  operator: "",
  quoteNo: "",
  description: "",
};

function todayISO() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function money(value) {
  return Number(value || 0).toLocaleString("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  });
}

function safe(value) {
  return value || "—";
}

function createJobNo() {
  return `JOB-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
}

function normalizeDateISO(value) {
  if (!value) return "";
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const iso = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const tr = raw.match(/^(\d{2})[./-](\d{2})[./-](\d{4})$/);
  if (tr) return `${tr[3]}-${tr[2]}-${tr[1]}`;
  return "";
}

function formatDate(date) {
  const iso = normalizeDateISO(date);
  if (!iso) return "—";
  return new Date(`${iso}T12:00:00`).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateLong(date) {
  const iso = normalizeDateISO(date);
  if (!iso) return "—";
  return new Date(`${iso}T12:00:00`).toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function daysLeft(deadline) {
  const iso = normalizeDateISO(deadline);
  if (!iso) return null;
  const today = new Date(`${todayISO()}T12:00:00`);
  const target = new Date(`${iso}T12:00:00`);
  return Math.round((target - today) / 86400000);
}

function normalizeStatus(status) {
  const value = String(status || "").trim().toLowerCase();
  if (!value) return "waiting";
  if (value === "active" || value.includes("aktif")) return "waiting";
  if (value === "waiting" || value.includes("bek")) return "waiting";
  if (value === "production" || value.includes("üret") || value.includes("uret")) return "production";
  if (value === "quality" || value.includes("kalite")) return "quality";
  if (value === "ready" || value.includes("hazır") || value.includes("hazir")) return "ready";
  if (value === "delivered" || value.includes("teslim")) return "delivered";
  if (value === "completed" || value.includes("tamam")) return "completed";
  if (value === "cancelled" || value.includes("iptal")) return "cancelled";
  return "waiting";
}

function normalizeJob(job) {
  const id = job.id || job.jobNo || crypto.randomUUID();

  return {
    ...job,
    id,
    jobNo: job.jobNo || id,
    title: job.title || job.jobName || job.partName || job.name || "İsimsiz İş",
    customer: job.customer || job.customerName || "Müşteri Yok",
    status: normalizeStatus(job.status),
    quoteNo: job.quoteNo || job.quoteId || job.offerNo || "",
    quoteTotal: Number(job.quoteTotal || job.totalPrice || job.price || job.amount || 0),
    quoteType: job.quoteType || job.offerType || "Manuel İş",
    material: job.material || job.materialName || "",
    materialType: job.materialType || job.materialOwner || job.materialSource || "",
    deadline: normalizeDateISO(job.deadline || job.dueDate || job.deliveryDate || ""),
    machineName: job.machineName || job.machine || "",
    operator: job.operator || "",
    progress: Number(job.progress || 0),
    description: job.description || job.note || job.notes || "",
    createdAt: job.createdAt || new Date().toISOString(),
    period: job.period || "",
    periodKey: job.periodKey || "",
    monthName: job.monthName || "",
    year: job.year || "",
    month: job.month || "",
    operations: Array.isArray(job.operations) ? job.operations : [],
  };
}

function getJobPeriodKey(job) {
  if (job.periodKey) return job.periodKey;
  if (job.createdAt) {
    const d = new Date(job.createdAt);
    if (!Number.isNaN(d.getTime())) {
      return `${d.getFullYear()}_${String(d.getMonth() + 1).padStart(2, "0")}`;
    }
  }
  return "";
}

function isFinal(status) {
  return finalStatuses.includes(status);
}

function progressForStatus(status) {
  if (status === "waiting") return 10;
  if (status === "production") return 45;
  if (status === "quality") return 70;
  if (status === "ready") return 85;
  if (status === "delivered") return 95;
  if (status === "completed") return 100;
  if (status === "cancelled") return 0;
  return 0;
}

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [detailTab, setDetailTab] = useState("general");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(() =>
    getActivePeriod(getCurrentPeriod()).periodKey
  );
  const [selectedJob, setSelectedJob] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);

  function refreshJobs() {
    setJobs(getJobs().map(normalizeJob));
  }

  useEffect(() => {
    refreshJobs();
    const events = [
      "storage",
      "forgeerp:jobs-updated",
      "forgeerp:quotes-updated",
      "forgeerp:schedule-updated",
      "forgeerp:period-changed",
    ];
    events.forEach((eventName) => window.addEventListener(eventName, refreshJobs));
    return () => events.forEach((eventName) => window.removeEventListener(eventName, refreshJobs));
  }, []);

  useEffect(() => {
    function onKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        document.getElementById("jobs-global-search")?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const periods = useMemo(() => {
    const recent = getRecentPeriods(12);
    const keys = new Set(recent.map((period) => period.periodKey));
    jobs.forEach((job) => {
      const key = getJobPeriodKey(job);
      if (key) keys.add(key);
    });

    return Array.from(keys)
      .map((key) => {
        const [year, month] = key.split("_");
        const date = new Date(Number(year), Number(month) - 1, 1);
        return {
          periodKey: key,
          label: date.toLocaleDateString("tr-TR", { month: "long", year: "numeric" }),
          sort: `${year}_${month}`,
        };
      })
      .sort((a, b) => b.sort.localeCompare(a.sort));
  }, [jobs]);

  const periodJobs = useMemo(
    () => jobs.filter((job) => getJobPeriodKey(job) === selectedPeriod),
    [jobs, selectedPeriod]
  );

  const stats = useMemo(() => {
    const today = todayISO();
    const active = periodJobs.filter((job) => !isFinal(job.status));
    const completed = periodJobs.filter((job) => ["completed", "delivered"].includes(job.status));
    return {
      all: periodJobs.length,
      active: active.length,
      waiting: periodJobs.filter((job) => job.status === "waiting").length,
      production: periodJobs.filter((job) => job.status === "production").length,
      quality: periodJobs.filter((job) => job.status === "quality").length,
      ready: periodJobs.filter((job) => job.status === "ready").length,
      delayed: periodJobs.filter((job) => job.deadline && job.deadline < today && !isFinal(job.status)).length,
      completed: completed.length,
      totalAmount: periodJobs.reduce((sum, job) => sum + Number(job.quoteTotal || 0), 0),
      completionRate: periodJobs.length ? Math.round((completed.length / periodJobs.length) * 100) : 0,
      avgProgress: periodJobs.length ? Math.round(periodJobs.reduce((s, job) => s + Number(job.progress || progressForStatus(job.status)), 0) / periodJobs.length) : 0,
    };
  }, [periodJobs]);

  const filteredJobs = useMemo(() => {
    const today = todayISO();
    const q = search.trim().toLowerCase();

    return periodJobs.filter((job) => {
      if (filter === "active" && isFinal(job.status)) return false;
      if (filter === "delayed" && !(job.deadline && job.deadline < today && !isFinal(job.status))) return false;
      if (!["all", "active", "delayed"].includes(filter) && job.status !== filter) return false;

      if (!q) return true;
      return [job.jobNo, job.title, job.customer, job.machineName, job.operator, job.quoteNo, job.material]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [periodJobs, filter, search]);

  const detailJob =
    selectedJob && periodJobs.some((job) => job.id === selectedJob.id)
      ? periodJobs.find((job) => job.id === selectedJob.id)
      : filteredJobs[0] || null;

  const todayJobs = useMemo(() => periodJobs.filter((job) => job.deadline === todayISO()), [periodJobs]);
  const delayedJobs = useMemo(() => periodJobs.filter((job) => job.deadline && job.deadline < todayISO() && !isFinal(job.status)), [periodJobs]);
  const machineRows = useMemo(() => {
    const map = new Map();
    periodJobs.forEach((job) => {
      const key = job.machineName || "Makine Atanmamış";
      if (!map.has(key)) map.set(key, { machine: key, count: 0, production: 0, value: 0, firstJob: job });
      const row = map.get(key);
      if (!row.firstJob || job.status === "production") row.firstJob = job;
      row.count += 1;
      row.value += Number(job.quoteTotal || 0);
      if (job.status === "production") row.production += 1;
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [periodJobs]);

  function createPayload(sourceForm) {
    return {
      title: sourceForm.title,
      customer: sourceForm.customer,
      status: sourceForm.status,
      deadline: sourceForm.deadline,
      quoteTotal: Number(sourceForm.price || 0),
      price: Number(sourceForm.price || 0),
      material: sourceForm.material,
      materialType: sourceForm.materialType,
      machineName: sourceForm.machineName,
      machine: sourceForm.machineName,
      operator: sourceForm.operator,
      quoteNo: sourceForm.quoteNo,
      description: sourceForm.description,
    };
  }

  function handleCreateJob(e) {
    e.preventDefault();
    const now = new Date().toISOString();
    const currentPeriod = getCurrentPeriod();
    const newJob = {
      id: crypto.randomUUID(),
      jobNo: createJobNo(),
      ...createPayload(form),
      source: "manual",
      quoteType: "Manuel İş",
      createdAt: now,
      period: currentPeriod.period,
      periodKey: currentPeriod.periodKey,
      year: currentPeriod.year,
      month: currentPeriod.month,
      monthName: currentPeriod.monthName,
    };

    const updatedJobs = addJob(newJob).map(normalizeJob);
    const normalized = normalizeJob(newJob);
    setJobs(updatedJobs);
    setSelectedPeriod(currentPeriod.periodKey);
    setSelectedJob(normalized);
    setShowCreateModal(false);
    setForm(emptyForm);
  }

  function handleUpdateStatus(id, status) {
    const updated = updateJob(id, {
      status,
      progress: progressForStatus(status),
      updatedAt: new Date().toISOString(),
    }).map(normalizeJob);
    setJobs(updated);
    if (selectedJob?.id === id) setSelectedJob(updated.find((job) => job.id === id) || null);
  }

  function openEditJob(job) {
    const normalized = normalizeJob(job);
    setEditingJob(normalized);
    setEditForm({
      title: normalized.title || "",
      customer: normalized.customer || "",
      status: normalized.status || "waiting",
      deadline: normalized.deadline || "",
      price: normalized.quoteTotal || normalized.price || "",
      material: normalized.material || "",
      materialType: normalized.materialType || "",
      machineName: normalized.machineName || "",
      operator: normalized.operator || "",
      quoteNo: normalized.quoteNo || "",
      description: normalized.description || "",
    });
    setShowEditModal(true);
  }

  function closeEditJob() {
    setShowEditModal(false);
    setEditingJob(null);
    setEditForm(emptyForm);
  }

  function handleEditJob(e) {
    e.preventDefault();
    if (!editingJob?.id) return;
    const payload = {
      ...createPayload(editForm),
      updatedAt: new Date().toISOString(),
      progress: progressForStatus(editForm.status),
    };
    const updated = updateJob(editingJob.id, payload).map(normalizeJob);
    const updatedJob = updated.find((job) => job.id === editingJob.id) || null;
    setJobs(updated);
    setSelectedJob(updatedJob);
    closeEditJob();
  }

  function handleDeleteJob(id) {
    if (!window.confirm("Bu işi silmek istediğine emin misin?")) return;
    const updated = deleteJob(id).map(normalizeJob);
    setJobs(updated);
    if (selectedJob?.id === id) setSelectedJob(null);
  }

  const cards = [
    { key: "all", title: "Tüm İşler", value: stats.all, icon: <ListChecks size={20} />, tone: "blue", note: "%100" },
    { key: "active", title: "Aktif İş", value: stats.active, icon: <Activity size={20} />, tone: "amber", note: `${stats.all ? Math.round((stats.active / stats.all) * 100) : 0}%` },
    { key: "waiting", title: "Bekleyen", value: stats.waiting, icon: <Clock size={20} />, tone: "amber", note: "Üretime alınacak" },
    { key: "production", title: "Üretimde", value: stats.production, icon: <Factory size={20} />, tone: "violet", note: "Makinedeki işler" },
    { key: "quality", title: "Kalite", value: stats.quality, icon: <ShieldCheck size={20} />, tone: "cyan", note: "Kontroldeki işler" },
    { key: "ready", title: "Hazır", value: stats.ready, icon: <PackageCheck size={20} />, tone: "emerald", note: "Teslime hazır" },
    { key: "delayed", title: "Geciken", value: stats.delayed, icon: <AlertTriangle size={20} />, tone: "red", note: "Riskli işler" },
    { key: "completed", title: "Tamamlanan", value: stats.completed, icon: <CheckCircle2 size={20} />, tone: "slate", note: `${stats.completionRate}%` },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-5 text-slate-900">
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950">İş Takibi</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">Üretim akışı, termin takibi, makine ataması ve iş geçmişi.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="jobs-global-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ara (Ctrl + K)"
              className="h-10 w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-3 text-sm font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowShortcuts((prev) => !prev)}
              className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Kısayollar <ChevronDown size={15} />
            </button>
            {showShortcuts && (
              <div className="absolute right-0 top-12 z-20 w-80 overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-200/70">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">Hızlı İşlemler</p>
                  <p className="mt-1 text-sm font-black text-slate-900">İş Takibi Kısayolları</p>
                </div>

                <div className="py-2">
                  <Shortcut
                    icon={<Plus size={17} />}
                    label="Yeni iş oluştur"
                    desc="Manuel yeni üretim işi aç"
                    onClick={() => { setShowCreateModal(true); setShowShortcuts(false); }}
                  />
                  <Shortcut
                    icon={<CalendarDays size={17} />}
                    label="Bugün teslimleri göster"
                    desc={`${todayJobs.length} iş bugün teslim listesinde`}
                    onClick={() => { setFilter("all"); setSearch(""); setSelectedJob(todayJobs[0] || null); setShowShortcuts(false); }}
                  />
                  <Shortcut
                    icon={<AlertTriangle size={17} />}
                    label="Geciken işleri filtrele"
                    desc={`${delayedJobs.length} riskli iş var`}
                    danger
                    onClick={() => { setFilter("delayed"); setShowShortcuts(false); }}
                  />
                  <Shortcut
                    icon={<Factory size={17} />}
                    label="Üretimdeki işleri filtrele"
                    desc="Makinedeki aktif işleri göster"
                    onClick={() => { setFilter("production"); setShowShortcuts(false); }}
                  />
                </div>

                <div className="border-t border-slate-100 pt-2">
                  <Shortcut
                    icon={<Printer size={17} />}
                    label="Sevk formu yazdır"
                    desc={detailJob ? `${detailJob.jobNo} için belge hazırla` : "Önce bir iş seç"}
                    onClick={() => { detailJob && printDeliveryNoteDocument(detailJob); setShowShortcuts(false); }}
                  />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex h-10 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white shadow-sm hover:bg-slate-800"
          >
            <Plus size={16} /> Yeni İş
          </button>
        </div>
      </div>

      <div className="mb-4 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr_1fr_1fr_0.8fr]">
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-slate-50 p-5">
            <div className="absolute right-4 top-4 rounded-2xl bg-blue-600/10 p-3 text-blue-600">
              <CalendarDays size={22} />
            </div>
            <p className="text-xs font-black uppercase tracking-wide text-blue-600">Aktif Dönem</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">{periods.find((p) => p.periodKey === selectedPeriod)?.label || "Bu Ay"}</h2>
            <p className="mt-2 text-sm font-bold text-slate-600">Dönem içi tüm işler ve üretim akışı</p>
          </div>
          <TopMetric icon={<Briefcase size={20} />} label="Toplam İş" value={stats.all} desc="Dönem içi kayıt" />
          <TopMetric icon={<Wallet size={20} />} label="Toplam Tutar" value={money(stats.totalAmount)} desc="İş toplamı" />
          <TopMetric icon={<BarChart3 size={20} />} label="Ortalama İlerleme" value={`%${stats.avgProgress}`} desc="Tahmini üretim" />
          <div className="flex items-center justify-center border-l border-slate-100 p-5">
            <select
              value={selectedPeriod}
              onChange={(e) => { setSelectedPeriod(e.target.value); setSelectedJob(null); setFilter("all"); }}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 outline-none"
            >
              {periods.map((period) => <option key={period.periodKey} value={period.periodKey}>{period.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <EnterpriseQuickPanels
        todayJobs={todayJobs}
        delayedJobs={delayedJobs}
        machineRows={machineRows}
        productionCount={stats.production}
        onDelayed={() => { setFilter("delayed"); setSelectedJob(delayedJobs[0] || null); }}
        onToday={() => { setFilter("all"); setSelectedJob(todayJobs[0] || null); }}
        onProduction={() => { setFilter("production"); setSelectedJob(periodJobs.find((job) => job.status === "production") || null); }}
        onMachine={(job) => setSelectedJob(job)}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        {cards.map((card) => (
          <StatusCard
            key={card.key}
            card={card}
            active={filter === card.key}
            total={stats.all}
            onClick={() => { setFilter(card.key); setSelectedJob(null); }}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">İş Akış Listesi</h2>
              <p className="mt-1 text-xs font-semibold text-slate-400">{filteredJobs.length} kayıt listeleniyor • Her satır detay açar.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setFilter("delayed")} className="rounded-2xl border border-red-100 bg-red-50 px-4 py-2 text-xs font-black text-red-600 hover:bg-red-100">Risk</button>
              <button onClick={() => setShowCreateModal(true)} className="rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white hover:bg-slate-800">+ Manuel İş</button>
            </div>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="p-14 text-center text-sm font-semibold text-slate-400">Bu filtreye uygun iş bulunamadı.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredJobs.map((job) => (
                <JobRow
                  key={job.id}
                  job={job}
                  selected={detailJob?.id === job.id}
                  onSelect={() => { setSelectedJob(job); setDetailTab("general"); }}
                  onStatusChange={(status) => handleUpdateStatus(job.id, status)}
                  onEdit={() => openEditJob(job)}
                  onDelete={() => handleDeleteJob(job.id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <JobDetail job={detailJob} tab={detailTab} setTab={setDetailTab} onEdit={openEditJob} />
        </div>
      </div>

      {showCreateModal && (
        <JobFormModal
          title="Yeni İş Oluştur"
          subtitle="Yeni iş bugünün dönemine otomatik kaydedilir."
          form={form}
          setForm={setForm}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateJob}
          submitText="İşi Kaydet"
        />
      )}

      {showEditModal && editingJob && (
        <JobFormModal
          title={`İşi Düzenle • ${safe(editingJob.jobNo)}`}
          subtitle="Tekliften gelen işi bozmadan üretim bilgilerini güncelle."
          form={editForm}
          setForm={setEditForm}
          onClose={closeEditJob}
          onSubmit={handleEditJob}
          submitText="Değişiklikleri Kaydet"
          editing
        />
      )}

      <style>{`
        .input {
          width: 100%;
          height: 42px;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 0 12px;
          font-size: 14px;
          font-weight: 700;
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

function Shortcut({ icon, label, desc, danger, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-blue-50 ${
        danger ? "hover:bg-red-50" : ""
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition group-hover:scale-105 ${
          danger
            ? "bg-red-50 text-red-600 group-hover:bg-red-100"
            : "bg-blue-50 text-blue-600 group-hover:bg-blue-100"
        }`}
      >
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black text-slate-900">{label}</span>
        {desc && (
          <span className="mt-0.5 block truncate text-xs font-semibold text-slate-400">
            {desc}
          </span>
        )}
      </span>

      <ChevronRight
        size={15}
        className={`shrink-0 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100 ${
          danger ? "text-red-500" : "text-blue-500"
        }`}
      />
    </button>
  );
}

function TopMetric({ icon, label, value, desc }) {
  return (
    <div className="flex items-center gap-4 border-l border-slate-100 p-5">
      <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">{icon}</div>
      <div>
        <p className="text-xs font-black text-slate-400">{label}</p>
        <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
        <p className="mt-0.5 text-xs font-semibold text-slate-400">{desc}</p>
      </div>
    </div>
  );
}

function StatusCard({ card, active, total, onClick }) {
  const colors = {
    blue: "text-blue-600 bg-blue-50",
    amber: "text-amber-600 bg-amber-50",
    violet: "text-violet-600 bg-violet-50",
    cyan: "text-cyan-600 bg-cyan-50",
    emerald: "text-emerald-600 bg-emerald-50",
    red: "text-red-600 bg-red-50",
    slate: "text-slate-600 bg-slate-100",
  };
  const percent = total ? Math.round((Number(card.value || 0) / total) * 100) : 0;

  return (
    <button onClick={onClick} className={`rounded-3xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${active ? "border-blue-400 ring-2 ring-blue-100" : "border-slate-200"}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-500">{card.title}</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{card.value}</p>
        </div>
        <div className={`rounded-2xl p-3 ${colors[card.tone] || colors.blue}`}>{card.icon}</div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${statusLine[card.key] || "bg-blue-500"}`} style={{ width: `${Math.max(6, percent)}%` }} />
      </div>
      <p className="mt-2 text-xs font-bold text-slate-400">{card.note}</p>
    </button>
  );
}

function JobRow({ job, selected, onSelect, onStatusChange, onEdit, onDelete }) {
  const left = daysLeft(job.deadline);
  const delayed = left !== null && left < 0 && !isFinal(job.status);
  const progress = Number(job.progress || progressForStatus(job.status));

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`grid w-full cursor-pointer grid-cols-1 gap-3 p-4 text-left transition hover:bg-blue-50/50 xl:grid-cols-[1.1fr_1.2fr_0.85fr_0.75fr_0.7fr_0.65fr_90px] xl:items-center ${selected ? "bg-blue-50" : "bg-white"}`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="rounded-xl bg-slate-950 px-3 py-1 text-xs font-black text-white">{safe(job.jobNo)}</span>
          {delayed && <span className="rounded-xl bg-red-50 px-2 py-1 text-xs font-black text-red-600">Gecikti</span>}
        </div>
        <p className="mt-2 truncate text-sm font-black text-slate-950">{safe(job.title)}</p>
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-black text-slate-900">{safe(job.customer)}</p>
        <p className="mt-1 truncate text-xs font-semibold text-slate-400">{safe(job.quoteNo)} • {safe(job.quoteType)}</p>
      </div>

      <div>
        <p className="text-xs font-black text-slate-400">Makine</p>
        <p className="mt-1 text-sm font-black text-slate-900">{safe(job.machineName)}</p>
      </div>

      <div>
        <p className="text-xs font-black text-slate-400">Termin</p>
        <p className={`mt-1 text-sm font-black ${delayed ? "text-red-600" : "text-slate-900"}`}>{formatDate(job.deadline)}</p>
      </div>

      <div>
        <p className="text-xs font-black text-slate-400">Tutar</p>
        <p className="mt-1 text-sm font-black text-slate-950">{money(job.quoteTotal)}</p>
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        <select value={job.status} onChange={(e) => onStatusChange(e.target.value)} className={`h-9 rounded-xl border px-2 text-xs font-black ${statusStyles[job.status] || statusStyles.waiting}`}>
          <option value="waiting">Bekleyen</option>
          <option value="production">Üretimde</option>
          <option value="quality">Kalite</option>
          <option value="ready">Hazır</option>
          <option value="delivered">Teslim Edildi</option>
          <option value="completed">Tamamlandı</option>
          <option value="cancelled">İptal</option>
        </select>
      </div>

      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        <button onClick={onEdit} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"><Edit3 size={15} /></button>
        <button onClick={onDelete} className="rounded-xl border border-red-100 bg-red-50 p-2 text-red-600 hover:bg-red-100"><Trash2 size={15} /></button>
      </div>

      <div className="xl:col-span-7">
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-slate-950" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
        </div>
      </div>
    </div>
  );
}

function JobDetail({ job, tab, setTab, onEdit }) {
  if (!job) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-black text-slate-900">İş Detayı</h2>
        <p className="mt-4 text-sm text-slate-400">Detay görmek için bir iş seç.</p>
      </div>
    );
  }

  const progress = Number(job.progress || progressForStatus(job.status));
  const tabs = [
    { key: "general", label: "Genel" },
    { key: "operations", label: "Operasyon" },
    { key: "documents", label: "Belgeler" },
    { key: "history", label: "Geçmiş" },
  ];

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-5">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wide text-blue-600">Seçili İş</p>
            <h2 className="mt-1 truncate text-xl font-black text-slate-950">{safe(job.jobNo)}</h2>
            <p className="mt-1 truncate text-sm font-semibold text-slate-600">{safe(job.title)}</p>
          </div>
          <button onClick={() => onEdit(job)} className="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-black text-white hover:bg-slate-800">Düzenle</button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <MiniLight label="Müşteri" value={safe(job.customer)} />
          <MiniLight label="Tutar" value={money(job.quoteTotal)} />
        </div>
        <div className="mt-4">
          <div className="mb-2 flex justify-between text-xs font-black text-slate-500"><span>İlerleme</span><span className="text-slate-950">%{progress}</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-slate-950" style={{ width: `${progress}%` }} /></div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 rounded-2xl bg-slate-50 p-1">
        {tabs.map((item) => (
          <button key={item.key} onClick={() => setTab(item.key)} className={`rounded-xl px-3 py-2 text-xs font-black transition ${tab === item.key ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}>{item.label}</button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "general" && <GeneralTab job={job} />}
        {tab === "operations" && <OperationsTab job={job} />}
        {tab === "documents" && <DocumentsTab job={job} />}
        {tab === "history" && <HistoryTab job={job} />}
      </div>
    </div>
  );
}

function GeneralTab({ job }) {
  return (
    <div className="space-y-3 text-sm">
      <InfoRow label="Durum" value={statusLabels[job.status] || safe(job.status)} />
      <InfoRow label="Müşteri" value={safe(job.customer)} />
      <InfoRow label="Makine" value={safe(job.machineName)} />
      <InfoRow label="Operatör" value={safe(job.operator)} />
      <InfoRow label="Termin" value={formatDateLong(job.deadline)} />
      <InfoRow label="Teklif No" value={safe(job.quoteNo)} />
      <InfoRow label="Malzeme" value={safe(job.material)} />
      <InfoRow label="Malzeme Tipi" value={safe(job.materialType)} />
      <InfoRow label="Not" value={safe(job.description)} />
    </div>
  );
}

function OperationsTab({ job }) {
  const operations = Array.isArray(job.operations) ? job.operations : [];
  if (operations.length === 0) {
    return <EmptyBox text="Bu işte operasyon kaydı yok. Tekliften operasyon gelirse burada görünür." />;
  }
  return (
    <div className="space-y-2">
      {operations.map((op, index) => (
        <div key={`${op.name}-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-black text-slate-950">{safe(op.name)}</p>
              <p className="mt-1 text-xs font-semibold text-slate-400">{safe(op.machine)} • {safe(op.hours)} saat</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">{money(Number(op.hours || 0) * Number(op.hourlyRate || 0))}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function DocumentsTab({ job }) {
  return (
    <div className="space-y-3">
      <button onClick={() => printDeliveryNoteDocument(job)} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 text-sm font-black text-white hover:bg-slate-800"><Printer size={16} /> Sevk Formu / İrsaliye Yazdır</button>
      <EmptyBox text="Dosya, resim ve revizyon geçmişi bu sekmeye bağlanacak." />
    </div>
  );
}

function HistoryTab({ job }) {
  const items = [
    { time: job.createdAt, title: "İş oluşturuldu", desc: `${safe(job.jobNo)} sisteme kaydedildi.` },
    { time: job.updatedAt, title: "Son güncelleme", desc: "İş bilgileri güncellendi." },
  ].filter((item) => item.time);

  return (
    <div className="space-y-2">
      {items.length === 0 ? <EmptyBox text="Henüz hareket kaydı yok." /> : items.map((item, index) => (
        <div key={index} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <p className="text-xs font-black text-blue-600">{new Date(item.time).toLocaleString("tr-TR")}</p>
          <p className="mt-1 font-black text-slate-950">{item.title}</p>
          <p className="text-xs font-semibold text-slate-500">{item.desc}</p>
        </div>
      ))}
    </div>
  );
}


function EnterpriseQuickPanels({ todayJobs, delayedJobs, machineRows, productionCount, onDelayed, onToday, onProduction, onMachine }) {
  const firstMachine = machineRows[0];

  return (
    <div className="mb-4 grid grid-cols-1 gap-3 xl:grid-cols-[0.9fr_0.9fr_1.25fr]">
      <button onClick={onDelayed} className="rounded-[24px] border border-red-100 bg-red-50 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-red-500">Patron Uyarısı</p>
            <h3 className="mt-1 text-lg font-black text-red-700">{delayedJobs.length} geciken iş</h3>
            <p className="mt-1 text-xs font-bold text-red-500">{delayedJobs[0] ? `${delayedJobs[0].jobNo} • ${safe(delayedJobs[0].customer)}` : "Risk görünmüyor"}</p>
          </div>
          <div className="rounded-2xl bg-white p-3 text-red-600"><AlertTriangle size={20} /></div>
        </div>
      </button>

      <button onClick={onToday} className="rounded-[24px] border border-amber-100 bg-amber-50 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-amber-600">Bugün Teslim</p>
            <h3 className="mt-1 text-lg font-black text-amber-800">{todayJobs.length} iş</h3>
            <p className="mt-1 text-xs font-bold text-amber-600">{todayJobs[0] ? `${todayJobs[0].jobNo} • ${safe(todayJobs[0].customer)}` : "Bugün teslim yok"}</p>
          </div>
          <div className="rounded-2xl bg-white p-3 text-amber-600"><CalendarDays size={20} /></div>
        </div>
      </button>

      <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase text-slate-400">Makine Dağılımı</p>
            <h3 className="mt-1 text-lg font-black text-slate-950">{productionCount} iş üretimde</h3>
          </div>
          <button onClick={onProduction} className="rounded-2xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-600 hover:bg-blue-100">Üretimde</button>
        </div>
        {machineRows.length === 0 ? (
          <EmptyMini text="Makine ataması yok." />
        ) : (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            {machineRows.slice(0, 3).map((row) => (
              <button key={row.machine} onClick={() => onMachine?.(row.firstJob)} className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left hover:border-blue-200 hover:bg-blue-50">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-black text-slate-950">{row.machine}</p>
                  <span className="rounded-full bg-white px-2 py-1 text-xs font-black text-slate-500">{row.count}</span>
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-400">{row.production} üretimde • {money(row.value)}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SidePanel({ todayJobs, delayedJobs, machineRows, setFilter, setSelectedJob }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 xl:grid-cols-1">
      <MiniPanel title="Patron Uyarıları" icon={<AlertTriangle size={16} />}>
        <AlertLine label="Geciken İş" value={delayedJobs.length} danger onClick={() => setFilter("delayed")} />
        <AlertLine label="Bugün Teslim" value={todayJobs.length} onClick={() => setSelectedJob(todayJobs[0] || null)} />
      </MiniPanel>
      <MiniPanel title="Makine Dağılımı" icon={<Factory size={16} />}>
        {machineRows.length === 0 ? <EmptyMini text="Makine ataması yok." /> : machineRows.slice(0, 4).map((row) => <MachineMini key={row.machine} row={row} />)}
      </MiniPanel>
      <MiniPanel title="Bugün Teslim" icon={<CalendarDays size={16} />}>
        {todayJobs.length === 0 ? <EmptyMini text="Bugün teslim yok." /> : todayJobs.slice(0, 4).map((job) => <TodayMini key={job.id} job={job} onClick={() => setSelectedJob(job)} />)}
      </MiniPanel>
    </div>
  );
}

function JobFormModal({ title, subtitle, form, setForm, onSubmit, onClose, submitText }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <form onSubmit={onSubmit} className="w-full max-w-4xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="text-xl font-black text-slate-950">{title}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-2xl bg-slate-100 p-3 text-slate-500 hover:bg-slate-200"><X size={18} /></button>
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
          <Field label="İş Adı"><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" /></Field>
          <Field label="Müşteri"><input required value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} className="input" /></Field>
          <Field label="Teklif No"><input value={form.quoteNo} onChange={(e) => setForm({ ...form, quoteNo: e.target.value })} className="input" /></Field>
          <Field label="Fiyat / Tutar"><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input" placeholder="Örn: 25000" /></Field>
          <Field label="Durum"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input"><option value="waiting">Bekleyen</option><option value="production">Üretimde</option><option value="quality">Kalite</option><option value="ready">Hazır</option><option value="delivered">Teslim Edildi</option><option value="completed">Tamamlandı</option><option value="cancelled">İptal</option></select></Field>
          <Field label="Teslim Tarihi"><input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="input" /></Field>
          <Field label="Makine"><input value={form.machineName} onChange={(e) => setForm({ ...form, machineName: e.target.value })} className="input" placeholder="Örn: BM1200" /></Field>
          <Field label="Operatör"><input value={form.operator} onChange={(e) => setForm({ ...form, operator: e.target.value })} className="input" placeholder="Örn: Ahmet" /></Field>
          <Field label="Malzeme"><input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} className="input" /></Field>
          <Field label="Malzeme Tipi"><select value={form.materialType} onChange={(e) => setForm({ ...form, materialType: e.target.value })} className="input"><option value="">Seç</option><option value="Müşteri Malzemesi">Müşteri Malzemesi</option><option value="Firma Malzemesi">Firma Malzemesi</option><option value="Tedarik Edilecek">Tedarik Edilecek</option></select></Field>
          <div className="md:col-span-2"><Field label="Açıklama / Not"><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="min-h-[92px] w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-bold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" placeholder="Operasyon, bağlama, müşteri notu..." /></Field></div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 p-5">
          <button type="button" onClick={onClose} className="h-11 rounded-2xl border border-slate-200 bg-white px-5 font-black text-slate-600">Vazgeç</button>
          <button type="submit" className="h-11 rounded-2xl bg-slate-950 px-6 font-black text-white hover:bg-slate-800">{submitText}</button>
        </div>
      </form>
    </div>
  );
}

function MiniDark({ label, value }) {
  return <div className="rounded-2xl bg-white/10 p-3"><p className="text-xs font-black text-slate-400">{label}</p><p className="mt-1 truncate font-black text-white">{value}</p></div>;
}
function MiniLight({ label, value }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-3"><p className="text-xs font-black text-slate-400">{label}</p><p className="mt-1 truncate font-black text-slate-950">{value}</p></div>;
}
function InfoRow({ label, value }) {
  return <div className="flex justify-between gap-4 border-b border-slate-100 pb-2"><span className="font-semibold text-slate-500">{label}</span><span className="break-all text-right font-black text-slate-950">{value}</span></div>;
}
function EmptyBox({ text }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-400">{text}</div>;
}
function MiniPanel({ title, icon, children }) {
  return <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm"><div className="mb-3 flex items-center justify-between"><h3 className="font-black text-slate-950">{title}</h3><span className="rounded-xl bg-slate-50 p-2 text-slate-500">{icon}</span></div>{children}</div>;
}
function AlertLine({ label, value, danger, onClick }) {
  return <button onClick={onClick} className={`mb-2 flex w-full items-center justify-between rounded-2xl border p-3 text-left ${danger ? "border-red-100 bg-red-50 text-red-700" : "border-slate-100 bg-slate-50 text-slate-700"}`}><span className="font-black">{label}</span><strong>{value}</strong></button>;
}
function MachineMini({ row }) {
  return <div className="mb-2 rounded-2xl border border-slate-100 bg-slate-50 p-3"><div className="flex justify-between gap-3"><strong className="truncate text-slate-950">{row.machine}</strong><span className="font-black text-slate-500">{row.count}</span></div><p className="mt-1 text-xs font-semibold text-slate-400">{row.production} üretimde • {money(row.value)}</p></div>;
}
function TodayMini({ job, onClick }) {
  return <button onClick={onClick} className="mb-2 w-full rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left hover:border-blue-200 hover:bg-blue-50"><p className="text-xs font-black text-blue-600">{safe(job.jobNo)}</p><p className="mt-1 truncate font-black text-slate-950">{safe(job.customer)}</p><p className="text-xs font-semibold text-slate-400">{safe(job.title)}</p></button>;
}
function Field({ label, children }) {
  return <label className="block"><p className="mb-2 text-xs font-black text-slate-500">{label}</p>{children}</label>;
}

function EmptyMini({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs font-bold text-slate-400">
      {text}
    </div>
  );
}

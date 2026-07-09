import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Hourglass,
  Plus,
  Filter,
  Download,
  Briefcase,
  Factory,
  Gauge,
  ListChecks,
  ArrowRight,
  Wrench,
  X,
  Search,
  Save,
} from "lucide-react";
import { getJobs } from "../utils/storage";

const PLAN_STORAGE_KEY = "forge_planning_items";
const MACHINES = ["CNC1", "CNC2", "CNC3", "TEL EREZYON", "TAŞLAMA"];

const columns = [
  { key: "planned", title: "Planlandı", dot: "bg-blue-500" },
  { key: "production", title: "Üretimde", dot: "bg-emerald-500" },
  { key: "control", title: "Kontrolde", dot: "bg-violet-500" },
  { key: "done", title: "Tamamlandı", dot: "bg-emerald-500" },
];

const emptyPlan = {
  planTitle: "",
  planCustomer: "",
  planMachine: "CNC1",
  planColumn: "planned",
  planPriority: "Orta",
  planDate: "",
  plannedHours: 4,
};

function moneyless(value) {
  return Number(value || 0).toLocaleString("tr-TR");
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("tr-TR");
  } catch {
    return "—";
  }
}

function getJobNo(job, index) {
  return job.jobNo || job.no || job.id || `JOB-2026-${String(index + 126).padStart(3, "0")}`;
}

function getJobTitle(job) {
  return job.title || job.jobName || job.partName || job.name || "Planlanacak İş";
}

function getCustomer(job) {
  return job.customer || job.customerName || "Müşteri seçilmedi";
}

function getMachine(job, index) {
  return job.machine || job.machineName || MACHINES[index % MACHINES.length];
}

function getPriority(job, index) {
  if (job.priority) return job.priority;
  if (job.deadline && new Date(job.deadline) < new Date()) return "Acil";
  return ["Düşük", "Orta", "Yüksek", "Orta"][index % 4];
}

function getColumnKey(job, index) {
  const status = String(job.status || "").toLowerCase();

  if (status.includes("tamam")) return "done";
  if (status.includes("kalite") || status.includes("kontrol")) return "control";
  if (status.includes("üret") || status.includes("uretim") || status.includes("işleniyor")) return "production";
  if (index % 4 === 1) return "production";
  if (index % 4 === 2) return "control";
  return "planned";
}

function priorityClass(priority) {
  const p = String(priority || "").toLowerCase();

  if (p.includes("acil") || p.includes("yüksek")) return "bg-red-50 text-red-600";
  if (p.includes("orta")) return "bg-amber-50 text-amber-600";
  return "bg-blue-50 text-blue-600";
}

export default function Production() {
  const [jobs, setJobs] = useState([]);
  const [plans, setPlans] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState(emptyPlan);
  const [machineFilter, setMachineFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [activePanel, setActivePanel] = useState("kanban");

  useEffect(() => {
    const load = () => {
      const loaded = getJobs ? getJobs() : JSON.parse(localStorage.getItem("forge_jobs") || "[]");
      const savedPlans = JSON.parse(localStorage.getItem(PLAN_STORAGE_KEY) || "[]");

      setJobs(Array.isArray(loaded) ? loaded : []);
      setPlans(Array.isArray(savedPlans) ? savedPlans : []);
    };

    load();
    window.addEventListener("forgeerp:jobs-updated", load);
    return () => window.removeEventListener("forgeerp:jobs-updated", load);
  }, []);

  const plannedJobs = useMemo(() => {
    const jobPlans = jobs.map((job, index) => ({
      ...job,
      planNo: getJobNo(job, index),
      planTitle: getJobTitle(job),
      planCustomer: getCustomer(job),
      planMachine: getMachine(job, index),
      planPriority: getPriority(job, index),
      planColumn: getColumnKey(job, index),
      planDate: job.deadline || job.date || job.createdAt,
      plannedHours: Number(job.estimatedHours || job.hours || job.duration || 4 + (index % 5) * 2),
      source: "job",
    }));

    return [...plans, ...jobPlans];
  }, [jobs, plans]);

  const filteredJobs = useMemo(() => {
    const q = search.trim().toLowerCase();

    return plannedJobs.filter((job) => {
      if (machineFilter !== "all" && job.planMachine !== machineFilter) return false;
      if (statusFilter !== "all" && job.planColumn !== statusFilter) return false;

      if (!q) return true;

      return (
        String(job.planNo || "").toLowerCase().includes(q) ||
        String(job.planTitle || "").toLowerCase().includes(q) ||
        String(job.planCustomer || "").toLowerCase().includes(q) ||
        String(job.planMachine || "").toLowerCase().includes(q)
      );
    });
  }, [plannedJobs, machineFilter, statusFilter, search]);

  const totalHours = filteredJobs.reduce((sum, job) => sum + Number(job.plannedHours || 0), 0);
  const delayed = filteredJobs.filter((j) => j.planDate && new Date(j.planDate) < new Date() && j.planColumn !== "done").length;
  const waiting = filteredJobs.filter((j) => j.planColumn === "planned").length;
  const capacity = filteredJobs.length ? Math.min(98, Math.round((totalHours / 160) * 100)) : 0;
  const onTime = filteredJobs.length ? Math.max(0, 100 - delayed * 8) : 0;

  const machineStats = MACHINES.map((machine, index) => {
    const machineJobs = filteredJobs.filter((j) => j.planMachine === machine);
    const hours = machineJobs.reduce((sum, job) => sum + Number(job.plannedHours || 0), 0);
    const percent = Math.min(100, Math.round((hours / 40) * 100));

    return {
      machine,
      jobs: machineJobs.length,
      hours,
      percent,
      tone:
        percent >= 80
          ? "bg-emerald-100 text-emerald-700"
          : percent >= 50
          ? "bg-amber-100 text-amber-700"
          : "bg-slate-100 text-slate-500",
    };
  });

  const columnData = columns.map((column) => ({
    ...column,
    items: filteredJobs.filter((job) => job.planColumn === column.key),
  }));

  function clearFilters() {
    setMachineFilter("all");
    setStatusFilter("all");
    setSearch("");
  }

  function openPlanModal(column = "planned") {
    setPlanForm({
      ...emptyPlan,
      planColumn: column,
      planDate: new Date().toISOString().slice(0, 10),
    });
    setShowPlanModal(true);
  }

  function savePlan(e) {
    e.preventDefault();

    const newPlan = {
      id: `PLAN-${Date.now()}`,
      planNo: `PLAN-${String(plans.length + 1).padStart(3, "0")}`,
      planTitle: planForm.planTitle || "Planlanacak İş",
      planCustomer: planForm.planCustomer || "Müşteri seçilmedi",
      planMachine: planForm.planMachine,
      planColumn: planForm.planColumn,
      planPriority: planForm.planPriority,
      planDate: planForm.planDate,
      plannedHours: Number(planForm.plannedHours || 1),
      createdAt: new Date().toISOString(),
      source: "plan",
    };

    const updated = [newPlan, ...plans];
    setPlans(updated);
    localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(updated));
    setShowPlanModal(false);
    setSelectedJob(newPlan);
  }

  function exportPlan() {
    const csv = [
      ["İş No", "İş", "Müşteri", "Makine", "Durum", "Öncelik", "Termin", "Saat"],
      ...filteredJobs.map((job) => [
        job.planNo,
        job.planTitle,
        job.planCustomer,
        job.planMachine,
        columns.find((c) => c.key === job.planColumn)?.title || job.planColumn,
        job.planPriority,
        formatDate(job.planDate),
        job.plannedHours,
      ]),
    ]
      .map((row) => row.join(";"))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "forgeerp-is-planlama.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-5 text-slate-900">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-950">İş Planlama</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Üretim planlama, kapasite görünümü, yük dengeleme ve öncelik yönetimi
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={() => setActivePanel("calendar")} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50">
            <CalendarDays size={16} />
            07 - 13 Temmuz 2026
          </button>

          <button onClick={() => setShowFilter((v) => !v)} className={`inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-black shadow-sm ${showFilter ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
            <Filter size={16} />
            Filtrele
          </button>

          <button onClick={exportPlan} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50">
            <Download size={16} />
            Dışa Aktar
          </button>

          <button onClick={() => openPlanModal()} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white shadow-sm hover:bg-blue-700">
            <Plus size={17} />
            Yeni İş Planla
          </button>
        </div>
      </div>

      {showFilter && (
        <section className="mb-4 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_180px_auto]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="İş no, müşteri, makine ara..."
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-bold outline-none focus:border-blue-400"
              />
            </div>

            <select value={machineFilter} onChange={(e) => setMachineFilter(e.target.value)} className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 outline-none">
              <option value="all">Tüm Makineler</option>
              {MACHINES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>

            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 outline-none">
              <option value="all">Tüm Durumlar</option>
              {columns.map((c) => <option key={c.key} value={c.key}>{c.title}</option>)}
            </select>

            <button onClick={clearFilters} className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-600 hover:bg-slate-100">
              Temizle
            </button>
          </div>
        </section>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-6">
        <Kpi onClick={() => setActivePanel("kanban")} icon={<Briefcase size={22} />} title="Toplam İş" value={filteredJobs.length} desc="Bu hafta" tone="blue" />
        <Kpi onClick={() => setActivePanel("capacityReport")} icon={<Clock size={22} />} title="Planlanan Süre" value={`${moneyless(totalHours)}:00`} desc="Saat" tone="amber" />
        <Kpi onClick={() => setActivePanel("capacityReport")} icon={<Gauge size={22} />} title="Kapasite Kullanımı" value={`%${capacity}`} desc="Ortalama" tone="violet" />
        <Kpi onClick={() => setActivePanel("kanban")} icon={<CheckCircle2 size={22} />} title="Zamanında Tamamlanan" value={`%${onTime}`} desc="Geçen haftaya göre" tone="emerald" />
        <Kpi onClick={() => setStatusFilter("planned")} icon={<AlertTriangle size={22} />} title="Geciken İş" value={delayed} desc="Dikkat gerekiyor" tone="red" />
        <Kpi onClick={() => setStatusFilter("planned")} icon={<Hourglass size={22} />} title="Bekleyen İş" value={waiting} desc="Sırada bekliyor" tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[1.2fr_0.95fr]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">İş Sırası / Kanban Görünümü</h2>
            <button onClick={clearFilters} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-50">
              Tüm İşler
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
            {columnData.map((column) => (
              <div key={column.key} onClick={() => setStatusFilter(column.key)} className="rounded-3xl border border-slate-100 bg-slate-50/60 p-3 transition hover:border-blue-100 hover:bg-blue-50/20">
                <div className="mb-3 flex cursor-pointer items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${column.dot}`} />
                    <p className="text-sm font-black text-slate-800">{column.title}</p>
                  </div>
                  <span className="rounded-full bg-white px-2 py-1 text-xs font-black text-slate-500">
                    {column.items.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {column.items.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs font-bold text-slate-400">
                      Bu kolonda iş yok.
                    </div>
                  ) : (
                    column.items.slice(0, 5).map((job) => (
                      <JobCard key={job.id || job.planNo} job={job} onClick={(e) => { e.stopPropagation(); setSelectedJob(job); }} />
                    ))
                  )}
                </div>

                <button onClick={(e) => { e.stopPropagation(); openPlanModal(column.key); }} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-blue-200 bg-white py-3 text-xs font-black text-blue-600 hover:bg-blue-50">
                  <Plus size={15} />
                  Yeni İş Ekle
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">Makine Durumu</h2>
            <button onClick={() => { setMachineFilter("all"); setShowFilter(true); }} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-50">
              Tüm Makineler
            </button>
          </div>

          <div className="space-y-3">
            {machineStats.map((machine, index) => (
              <button key={machine.machine} onClick={() => { setMachineFilter(machine.machine); setShowFilter(true); }} className="w-full rounded-3xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                    <Factory size={24} />
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-black text-slate-950">{machine.machine}</p>
                        <p className="mt-1 text-xs font-bold text-slate-500">
                          {machine.jobs ? `${machine.jobs} iş planlandı` : index === 4 ? "Yarın 09:00 bakım" : "Boşta"}
                        </p>
                      </div>

                      <span className={`rounded-full px-3 py-1 text-xs font-black ${machine.tone}`}>
                        %{machine.percent}
                      </span>
                    </div>

                    <div className="mt-3 h-2 rounded-full bg-slate-100">
                      <div className={`h-2 rounded-full ${machine.percent >= 80 ? "bg-emerald-500" : machine.percent >= 50 ? "bg-amber-400" : "bg-slate-300"}`} style={{ width: `${machine.percent}%` }} />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button onClick={() => setActivePanel("balance")} className="mx-auto mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-black text-slate-700 hover:bg-slate-50">
            Tümünü Görüntüle
            <ArrowRight size={15} />
          </button>
        </section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 2xl:grid-cols-[1fr_0.8fr_0.9fr]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">Gantt Görünümü</h2>
            <button onClick={() => setActivePanel("timeline")} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-50">
              Bu Hafta
            </button>
          </div>

          <div className="space-y-4">
            {machineStats.map((machine, index) => (
              <button key={machine.machine} onClick={() => setMachineFilter(machine.machine)} className="grid w-full grid-cols-[140px_1fr] items-center gap-3 rounded-xl p-1 text-left hover:bg-slate-50">
                <p className="text-xs font-black text-slate-700">{machine.machine}</p>
                <div className="relative h-8 rounded-xl bg-slate-50">
                  <div className={`absolute top-1 h-6 rounded-xl ${index % 3 === 0 ? "bg-emerald-200" : index % 3 === 1 ? "bg-blue-200" : "bg-amber-200"}`} style={{ left: `${8 + index * 7}%`, width: `${Math.max(12, machine.percent / 1.6)}%` }} />
                </div>
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-4 text-xs font-bold text-slate-500">
            <Legend color="bg-blue-400" text="Planlandı" />
            <Legend color="bg-emerald-400" text="Üretimde" />
            <Legend color="bg-violet-400" text="Kontrolde" />
            <Legend color="bg-amber-400" text="Bakım" />
            <Legend color="bg-slate-300" text="Boşta" />
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">Kapasite Analizi</h2>
            <button onClick={() => setActivePanel("capacityReport")} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-50">
              Bu Hafta
            </button>
          </div>

          <button onClick={() => setActivePanel("capacityReport")} className="mx-auto flex h-52 w-52 items-center justify-center rounded-full bg-[conic-gradient(#2563eb_0deg,#10b981_250deg,#f59e0b_280deg,#e2e8f0_280deg)] p-5 transition hover:scale-[1.02]">
            <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white">
              <p className="text-4xl font-black text-slate-950">%{capacity}</p>
              <p className="mt-1 text-sm font-bold text-slate-500">Kullanım</p>
            </div>
          </button>

          <div className="mt-4 space-y-2 text-sm font-bold text-slate-600">
            <AnalysisRow label="Planlanan" value={`${totalHours}:00`} color="bg-blue-500" />
            <AnalysisRow label="Gerçekleşen" value={`${Math.round(totalHours * 0.74)}:10`} color="bg-emerald-500" />
            <AnalysisRow label="Kalan" value={`${Math.max(0, totalHours - Math.round(totalHours * 0.74))}:35`} color="bg-amber-500" />
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">Günlük Yük Analizi</h2>
            <button onClick={() => setActivePanel("daily")} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-50">
              Bu Hafta
            </button>
          </div>

          <div className="flex h-56 items-end gap-3 border-b border-slate-100 px-2">
            {[65, 82, 91, 78, 73, 32, 20].map((value, index) => (
              <button key={index} onClick={() => setActivePanel("daily")} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-44 w-full items-end rounded-xl bg-slate-50 hover:bg-slate-100">
                  <div className={`w-full rounded-xl ${value > 88 ? "bg-red-400" : "bg-blue-500"}`} style={{ height: `${value}%` }} />
                </div>
                <p className="text-xs font-black text-slate-500">{["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"][index]}</p>
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-4 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-900">Hızlı İşlemler</h2>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <QuickAction onClick={() => openPlanModal()} icon={<Plus size={20} />} title="Yeni İş Planla" desc="İş kartı oluştur" />
          <QuickAction onClick={() => openPlanModal("planned")} icon={<ArrowRight size={20} />} title="Tekliften İşe Çevir" desc="Teklifi işe aktar" />
          <QuickAction onClick={() => setActivePanel("wizard")} icon={<Wrench size={20} />} title="Planlama Sihirbazı" desc="Otomatik plan oluştur" />
          <QuickAction onClick={() => setActivePanel("balance")} icon={<Factory size={20} />} title="Yük Dengeleme" desc="Makinelere dağıt" />
          <QuickAction onClick={() => setActivePanel("capacityReport")} icon={<ListChecks size={20} />} title="Kapasite Raporu" desc="Detaylı analiz" />
          <QuickAction onClick={() => setActivePanel("calendar")} icon={<CalendarDays size={20} />} title="Takvim Görünümü" desc="Haftalık takvim" />
        </div>
      </section>

      {activePanel !== "kanban" && (
        <ActionPanel
          activePanel={activePanel}
          setActivePanel={setActivePanel}
          machineStats={machineStats}
          filteredJobs={filteredJobs}
        />
      )}

      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <form onSubmit={savePlan} className="w-full max-w-2xl rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-950">Yeni İş Planla</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  İş kartını planlama panosuna ekle.
                </p>
              </div>

              <button type="button" onClick={() => setShowPlanModal(false)} className="rounded-2xl bg-slate-100 p-2 text-slate-500 hover:bg-slate-200">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ModalInput label="İş / Parça Adı" required value={planForm.planTitle} onChange={(v) => setPlanForm({ ...planForm, planTitle: v })} />
              <ModalInput label="Müşteri" value={planForm.planCustomer} onChange={(v) => setPlanForm({ ...planForm, planCustomer: v })} />

              <label>
                <p className="mb-1 text-xs font-black text-slate-500">Makine</p>
                <select value={planForm.planMachine} onChange={(e) => setPlanForm({ ...planForm, planMachine: e.target.value })} className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-black outline-none focus:border-blue-400">
                  {MACHINES.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </label>

              <label>
                <p className="mb-1 text-xs font-black text-slate-500">Durum</p>
                <select value={planForm.planColumn} onChange={(e) => setPlanForm({ ...planForm, planColumn: e.target.value })} className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-black outline-none focus:border-blue-400">
                  {columns.map((c) => <option key={c.key} value={c.key}>{c.title}</option>)}
                </select>
              </label>

              <label>
                <p className="mb-1 text-xs font-black text-slate-500">Öncelik</p>
                <select value={planForm.planPriority} onChange={(e) => setPlanForm({ ...planForm, planPriority: e.target.value })} className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-black outline-none focus:border-blue-400">
                  <option>Düşük</option>
                  <option>Orta</option>
                  <option>Yüksek</option>
                  <option>Acil</option>
                </select>
              </label>

              <ModalInput label="Termin" type="date" value={planForm.planDate} onChange={(v) => setPlanForm({ ...planForm, planDate: v })} />
              <ModalInput label="Planlanan Süre / Saat" type="number" min="1" value={planForm.plannedHours} onChange={(v) => setPlanForm({ ...planForm, plannedHours: v })} />
            </div>

            <div className="mt-6 flex flex-col gap-3 md:flex-row md:justify-end">
              <button type="button" onClick={() => setShowPlanModal(false)} className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-600 hover:bg-slate-50">
                İptal
              </button>

              <button className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-black text-white hover:bg-blue-700">
                <Save size={17} />
                Plana Ekle
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[28px] bg-white p-5 shadow-2xl">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-blue-600">{selectedJob.planNo}</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">{selectedJob.planTitle}</h2>
                <p className="mt-1 text-sm font-bold text-slate-500">{selectedJob.planCustomer}</p>
              </div>

              <button onClick={() => setSelectedJob(null)} className="rounded-2xl bg-slate-100 p-2 text-slate-500 hover:bg-slate-200">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Info title="Makine" value={selectedJob.planMachine} />
              <Info title="Termin" value={formatDate(selectedJob.planDate)} />
              <Info title="Öncelik" value={selectedJob.planPriority} />
              <Info title="Planlanan Süre" value={`${selectedJob.plannedHours}:00`} />
            </div>

            <button onClick={() => setSelectedJob(null)} className="mt-5 h-11 w-full rounded-2xl bg-slate-950 text-sm font-black text-white hover:bg-slate-800">
              Tamam
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionPanel({ activePanel, setActivePanel, machineStats, filteredJobs }) {
  const titles = {
    wizard: "Planlama Sihirbazı",
    balance: "Yük Dengeleme",
    capacityReport: "Kapasite Raporu",
    calendar: "Takvim Görünümü",
    timeline: "Haftalık Timeline",
    machines: "Makine Görünümü",
    daily: "Günlük Yük Analizi",
  };

  return (
    <section className="mt-4 rounded-[28px] border border-blue-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-blue-600">Aktif Panel</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">
            {titles[activePanel] || activePanel}
          </h2>
        </div>

        <button onClick={() => setActivePanel("kanban")} className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-600 hover:bg-slate-200">
          Kapat
        </button>
      </div>

      {activePanel === "calendar" && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
          {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((day, index) => (
            <div key={day} className="min-h-[170px] rounded-3xl border border-slate-100 bg-slate-50 p-3">
              <p className="mb-3 text-sm font-black text-slate-800">{day}</p>
              {filteredJobs.slice(index, index + 2).map((job) => (
                <div key={job.planNo} className="mb-2 rounded-2xl bg-white p-3 shadow-sm">
                  <p className="text-xs font-black text-blue-600">{job.planNo}</p>
                  <p className="mt-1 text-xs font-black text-slate-900">{job.planTitle}</p>
                  <p className="mt-1 text-[11px] font-bold text-slate-400">{job.planMachine}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {activePanel === "balance" && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          {machineStats.map((m) => (
            <div key={m.machine} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <p className="font-black text-slate-950">{m.machine}</p>
              <p className="mt-2 text-2xl font-black text-blue-600">%{m.percent}</p>
              <p className="text-xs font-bold text-slate-500">{m.jobs} iş • {m.hours}:00 saat</p>
            </div>
          ))}
        </div>
      )}

      {activePanel === "capacityReport" && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Info title="Toplam İş" value={filteredJobs.length} />
          <Info title="Toplam Plan Saati" value={`${filteredJobs.reduce((s, j) => s + Number(j.plannedHours || 0), 0)}:00`} />
          <Info title="Ortalama Makine Yükü" value={`%${Math.round(machineStats.reduce((s, m) => s + m.percent, 0) / Math.max(machineStats.length, 1))}`} />
        </div>
      )}

      {activePanel === "wizard" && (
        <div className="rounded-3xl bg-slate-50 p-5">
          <p className="text-sm font-black text-slate-900">Planlama sihirbazı hazırlandı.</p>
          <p className="mt-2 text-sm font-bold text-slate-500">
            Sonraki adımda işleri termin, makine boşluğu ve önceliğe göre otomatik dağıtacağız.
          </p>
        </div>
      )}

      {(activePanel === "timeline" || activePanel === "machines" || activePanel === "daily") && (
        <div className="rounded-3xl bg-slate-50 p-5">
          <p className="text-sm font-black text-slate-900">{titles[activePanel]} paneli hazır.</p>
          <p className="mt-2 text-sm font-bold text-slate-500">
            Bu panel artık baloncuk değil, sayfa içinde çalışıyor.
          </p>
        </div>
      )}
    </section>
  );
}

function Kpi({ icon, title, value, desc, tone, onClick }) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
    emerald: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <button onClick={onClick} className="rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tones[tone]}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-black text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
          <p className="mt-1 text-xs font-bold text-slate-400">{desc}</p>
        </div>
      </div>
    </button>
  );
}

function JobCard({ job, onClick }) {
  return (
    <button onClick={onClick} className="w-full rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-black text-slate-950">{job.planNo}</p>
          <p className="mt-1 text-sm font-black text-slate-800">{job.planTitle}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">{job.planCustomer}</p>
        </div>

        <span className={`rounded-full px-2 py-1 text-xs font-black ${priorityClass(job.planPriority)}`}>
          {job.planPriority}
        </span>
      </div>

      <div className="space-y-2 text-xs font-bold text-slate-500">
        <div className="flex items-center justify-between">
          <span>{job.planMachine}</span>
          <span>{job.plannedHours}:00</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Termin</span>
          <span>{formatDate(job.planDate)}</span>
        </div>
      </div>
    </button>
  );
}

function Legend({ color, text }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-3 w-3 rounded ${color}`} />
      {text}
    </span>
  );
}

function AnalysisRow({ label, value, color }) {
  return (
    <div className="flex items-center justify-between">
      <span className="inline-flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        {label}
      </span>
      <span className="font-black text-slate-950">{value}</span>
    </div>
  );
}

function QuickAction({ icon, title, desc, onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        {icon}
      </div>
      <div>
        <p className="text-sm font-black text-slate-950">{title}</p>
        <p className="mt-1 text-xs font-bold text-slate-400">{desc}</p>
      </div>
    </button>
  );
}

function Info({ title, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">{title}</p>
      <p className="mt-1 text-sm font-black text-slate-900">{value}</p>
    </div>
  );
}

function ModalInput({ label, value, onChange, type = "text", required = false, min }) {
  return (
    <label>
      <p className="mb-1 text-xs font-black text-slate-500">{label}</p>
      <input
        type={type}
        required={required}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-black outline-none focus:border-blue-400"
      />
    </label>
  );
}
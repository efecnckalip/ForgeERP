import { useMemo, useState } from "react";
import {
  CalendarDays,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Factory,
  Search,
  ListChecks,
} from "lucide-react";

const JOBS_KEY = "forgeerp_jobs";

function readJobs() {
  try {
    const saved = localStorage.getItem(JOBS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function formatDate(date) {
  if (!date) return "Termin yok";
  return new Date(date).toLocaleDateString("tr-TR");
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function ProductionPlanning() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");

  const jobs = useMemo(() => readJobs(), []);

  const today = todayISO();
  const weekEnd = addDaysISO(7);

  const normalizedJobs = useMemo(() => {
    return jobs.map((job) => ({
      id: job.id || job.jobNo || "-",
      jobNo: job.jobNo || job.id || "-",
      customer: job.customer || job.customerName || "Müşteri yok",
      title: job.title || job.jobName || job.name || "İş adı yok",
      deadline: job.deadline || job.deliveryDate || job.dueDate || "",
      status: job.status || "Planlanmadı",
      machine: job.machine || job.machineName || "Makine seçilmedi",
      priority: job.priority || "Normal",
    }));
  }, [jobs]);

  const stats = {
    total: normalizedJobs.length,
    today: normalizedJobs.filter((j) => j.deadline === today).length,
    week: normalizedJobs.filter(
      (j) => j.deadline && j.deadline >= today && j.deadline <= weekEnd
    ).length,
    delayed: normalizedJobs.filter(
      (j) => j.deadline && j.deadline < today && j.status !== "Tamamlandı"
    ).length,
    unplanned: normalizedJobs.filter(
      (j) => !j.deadline || j.machine === "Makine seçilmedi"
    ).length,
  };

  const filteredJobs = normalizedJobs.filter((job) => {
    const q = search.toLowerCase();

    const matchesSearch =
      job.jobNo.toLowerCase().includes(q) ||
      job.customer.toLowerCase().includes(q) ||
      job.title.toLowerCase().includes(q) ||
      job.machine.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (activeFilter === "today") return job.deadline === today;
    if (activeFilter === "week")
      return job.deadline && job.deadline >= today && job.deadline <= weekEnd;
    if (activeFilter === "delayed")
      return job.deadline && job.deadline < today && job.status !== "Tamamlandı";
    if (activeFilter === "unplanned")
      return !job.deadline || job.machine === "Makine seçilmedi";

    return true;
  });

  const cards = [
    {
      key: "all",
      title: "Toplam İş",
      value: stats.total,
      icon: ListChecks,
    },
    {
      key: "today",
      title: "Bugün",
      value: stats.today,
      icon: CalendarDays,
    },
    {
      key: "week",
      title: "Bu Hafta",
      value: stats.week,
      icon: Clock,
    },
    {
      key: "delayed",
      title: "Geciken",
      value: stats.delayed,
      icon: AlertTriangle,
    },
    {
      key: "unplanned",
      title: "Planlanmamış",
      value: stats.unplanned,
      icon: Factory,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Üretim Planlama / Takvim Merkezi
        </h1>
        <p className="text-sm text-slate-500">
          Aktif işleri termin, makine ve plan durumuna göre takip et.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          const active = activeFilter === card.key;

          return (
            <button
              key={card.key}
              onClick={() => setActiveFilter(card.key)}
              className={`rounded-2xl border p-4 text-left transition ${
                active
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <span
                  className={`text-sm ${
                    active ? "text-slate-200" : "text-slate-500"
                  }`}
                >
                  {card.title}
                </span>
                <Icon size={18} />
              </div>
              <div className="text-2xl font-bold">{card.value}</div>
            </button>
          );
        })}
      </div>

      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-semibold">Plan Listesi</h2>
          <p className="text-sm text-slate-500">
            Seçili filtreye göre {filteredJobs.length} iş gösteriliyor.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İş, müşteri, makine ara..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-400"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="grid grid-cols-12 border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <div className="col-span-2">İş No</div>
          <div className="col-span-3">İş / Müşteri</div>
          <div className="col-span-2">Termin</div>
          <div className="col-span-2">Makine</div>
          <div className="col-span-2">Durum</div>
          <div className="col-span-1 text-right">Öncelik</div>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Bu filtreye uygun üretim planı bulunamadı.
          </div>
        ) : (
          filteredJobs.map((job) => {
            const isDelayed =
              job.deadline && job.deadline < today && job.status !== "Tamamlandı";

            return (
              <div
                key={job.id}
                className="grid grid-cols-12 items-center border-b border-slate-100 px-4 py-4 text-sm last:border-b-0 hover:bg-slate-50"
              >
                <div className="col-span-2 font-semibold text-slate-800">
                  {job.jobNo}
                </div>

                <div className="col-span-3">
                  <div className="font-medium text-slate-900">{job.title}</div>
                  <div className="text-xs text-slate-500">{job.customer}</div>
                </div>

                <div className="col-span-2">
                  <span
                    className={
                      isDelayed ? "font-semibold text-red-600" : "text-slate-700"
                    }
                  >
                    {formatDate(job.deadline)}
                  </span>
                </div>

                <div className="col-span-2 text-slate-700">{job.machine}</div>

                <div className="col-span-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {job.status === "Tamamlandı" && <CheckCircle2 size={13} />}
                    {job.status}
                  </span>
                </div>

                <div className="col-span-1 text-right text-xs font-semibold text-slate-600">
                  {job.priority}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
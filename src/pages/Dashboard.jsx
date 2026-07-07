import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock,
  Factory,
  FileText,
  Timer,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { getJobs, getQuotes, getActivePeriod } from "../utils/storage";
import { getCurrentPeriod } from "../utils/period";

const MACHINE_KEY = "forgeerp_machines";

const statusLabels = {
  active: "Aktif",
  waiting: "Bekleyen",
  production: "Üretimde",
  quality: "Kalite",
  ready: "Hazır",
  delivered: "Teslim",
  completed: "Tamamlanan",
};

const statusColors = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  waiting: "bg-amber-50 text-amber-700 border-amber-200",
  production: "bg-blue-50 text-blue-700 border-blue-200",
  quality: "bg-violet-50 text-violet-700 border-violet-200",
  ready: "bg-cyan-50 text-cyan-700 border-cyan-200",
  delivered: "bg-slate-100 text-slate-700 border-slate-200",
  completed: "bg-slate-100 text-slate-700 border-slate-200",
};

const machineStatusLabels = {
  idle: "Boş",
  production: "Üretimde",
  maintenance: "Bakımda",
  passive: "Pasif",
};

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

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function dateText(date) {
  return date.toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function timeText(date) {
  return date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function normalizeStatus(status) {
  const s = String(status || "").toLowerCase();

  if (s.includes("üret") || s.includes("production")) return "production";
  if (s.includes("kalite") || s.includes("quality")) return "quality";
  if (s.includes("hazır") || s.includes("ready")) return "ready";
  if (s.includes("teslim") || s.includes("delivered")) return "delivered";
  if (s.includes("tamam") || s.includes("completed")) return "completed";
  if (s.includes("bek") || s.includes("waiting")) return "waiting";
  if (s.includes("aktif") || s.includes("active")) return "active";

  return "active";
}

function normalizeJob(job) {
  const id = job.id || job.jobNo || crypto.randomUUID();

  return {
    ...job,
    id,
    jobNo: job.jobNo || id,
    title:
      job.title ||
      job.jobName ||
      job.part ||
      job.partName ||
      job.productName ||
      "İsimsiz İş",
    customer: job.customer || job.customerName || "Müşteri Yok",
    status: normalizeStatus(job.status),
    quoteTotal: job.quoteTotal || job.price || job.totalPrice || job.amount || 0,
    deadline: job.deadline || job.dueDate || "",
    progress: Number(job.progress || 0),
    machineName: job.machineName || job.machine || "",
    operator: job.operator || "",
    createdAt: job.createdAt || "",
  };
}

function readMachines() {
  try {
    return JSON.parse(localStorage.getItem(MACHINE_KEY)) || [];
  } catch {
    return [];
  }
}

function quoteAmount(quote) {
  return Number(quote?.totals?.grandTotal || quote?.quoteTotal || quote?.price || 0);
}

export default function Dashboard() {
  const [now, setNow] = useState(new Date());
  const [jobs, setJobs] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [machines, setMachines] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  const activePeriod = getActivePeriod(getCurrentPeriod());

  function refreshData() {
    setJobs(getJobs().map(normalizeJob).filter((job) => job.id));
    setQuotes(getQuotes());
    setMachines(readMachines());
  }

  useEffect(() => {
    refreshData();

    const refreshEvents = [
      "storage",
      "forgeerp:jobs-updated",
      "forgeerp:quotes-updated",
      "forgeerp:machines-updated",
      "forgeerp:schedule-updated",
    ];

    refreshEvents.forEach((eventName) => window.addEventListener(eventName, refreshData));

    return () => {
      refreshEvents.forEach((eventName) => window.removeEventListener(eventName, refreshData));
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const periodJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (!activePeriod?.periodKey) return true;

      if (job.periodKey) {
        return job.periodKey === activePeriod.periodKey;
      }

      if (job.createdAt) {
        return String(job.createdAt).slice(0, 7) === activePeriod.periodKey;
      }

      return false;
    });
  }, [jobs, activePeriod]);

  const periodQuotes = useMemo(() => {
    return quotes.filter((quote) => {
      if (!activePeriod?.periodKey) return true;

      if (quote.periodKey) {
        return quote.periodKey === activePeriod.periodKey;
      }

      if (quote.createdAt) {
        return String(quote.createdAt).slice(0, 7) === activePeriod.periodKey;
      }

      return false;
    });
  }, [quotes, activePeriod]);

  const today = todayISO();

  const lists = useMemo(() => {
    const active = periodJobs.filter((job) => job.status === "active");
    const waiting = periodJobs.filter((job) => job.status === "waiting");
    const production = periodJobs.filter((job) => job.status === "production");
    const quality = periodJobs.filter((job) => job.status === "quality");
    const completed = periodJobs.filter(
      (job) => job.status === "completed" || job.status === "delivered"
    );
    const delayed = periodJobs.filter(
      (job) => job.deadline && job.deadline < today && !["completed", "delivered"].includes(job.status)
    );
    const todayDelivery = periodJobs.filter(
      (job) => job.deadline === today && job.status !== "completed"
    );

    return { active, waiting, production, quality, completed, delayed, todayDelivery };
  }, [periodJobs, today]);

  const metrics = useMemo(() => {
    const quoteTotal = periodQuotes.reduce((sum, quote) => sum + quoteAmount(quote), 0);
    const jobTotal = periodJobs.reduce((sum, job) => sum + Number(job.quoteTotal || 0), 0);
    const convertedQuotes = periodQuotes.filter((quote) => quote.status === "İşe Çevrildi");
    const productionMachines = machines.filter((machine) => machine.status === "production").length;
    const machineOccupancy = machines.length
      ? Math.round((productionMachines / machines.length) * 100)
      : 0;

    return {
      quoteTotal,
      jobTotal,
      convertedQuoteCount: convertedQuotes.length,
      machineOccupancy,
      productionMachines,
      idleMachines: machines.filter((machine) => machine.status === "idle").length,
      maintenanceMachines: machines.filter((machine) => machine.status === "maintenance").length,
    };
  }, [periodQuotes, periodJobs, machines]);

  const activities = useMemo(() => {
    const jobActivities = periodJobs.slice(0, 4).map((job) => ({
      id: `job-${job.id}`,
      time: job.createdAt,
      title: "İş oluşturuldu",
      desc: `${safe(job.jobNo)} • ${safe(job.customer)}`,
    }));

    const quoteActivities = periodQuotes.slice(0, 4).map((quote) => ({
      id: `quote-${quote.id}`,
      time: quote.createdAt,
      title: "Teklif kaydedildi",
      desc: `${safe(quote.id)} • ${safe(quote.customer)}`,
    }));

    return [...jobActivities, ...quoteActivities]
      .sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0))
      .slice(0, 6);
  }, [periodJobs, periodQuotes]);

  const maxChart = Math.max(
    lists.active.length,
    lists.waiting.length,
    lists.production.length,
    lists.quality.length,
    lists.completed.length,
    1
  );

  const selectedJobs = selectedList ? lists[selectedList.key] || [] : [];

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="inline-flex rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-black text-blue-600 shadow-sm">
            ForgeERP by EFE CNC
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            Dashboard
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Atölye kontrol merkezi, canlı üretim, teklif dönüşleri ve risk takibi.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <TopInfo title="Aktif Dönem" value={activePeriod?.label || "Bu Ay"} />
          <TopInfo title={dateText(now)} value={timeText(now)} dark />
        </div>
      </div>

      <div className="mb-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_2fr] xl:items-center">
          <div>
            <p className="text-sm font-black text-slate-400">Bugünün Özeti</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
              Merhaba Yasin
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              {lists.waiting.length} iş başlamayı bekliyor, {lists.production.length} iş üretimde, {lists.delayed.length} iş riskte.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <HeroMini title="Bugün Teslim" value={lists.todayDelivery.length} icon={<CalendarDays size={18} />} />
            <HeroMini title="Geciken" value={lists.delayed.length} icon={<AlertTriangle size={18} />} danger />
            <HeroMini title="Makine Doluluk" value={`%${metrics.machineOccupancy}`} icon={<Factory size={18} />} />
            <HeroMini title="Bu Ay Ciro" value={money(metrics.jobTotal)} icon={<Wallet size={18} />} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard title="Aktif İş" value={lists.active.length} note="Devam eden işler" icon={<Activity size={20} />} onClick={() => setSelectedList({ key: "active", title: "Aktif İşler" })} />
        <MetricCard title="Bekleyen" value={lists.waiting.length} note="Başlamayı bekleyen" icon={<Clock size={20} />} onClick={() => setSelectedList({ key: "waiting", title: "Bekleyen İşler" })} />
        <MetricCard title="Üretimde" value={lists.production.length} note="Makinedeki işler" icon={<Factory size={20} />} onClick={() => setSelectedList({ key: "production", title: "Üretimdeki İşler" })} />
        <MetricCard title="Teklif" value={periodQuotes.length} note={money(metrics.quoteTotal)} icon={<FileText size={20} />} onClick={() => setSelectedList({ key: "quotes", title: "Bu Dönem Teklifler" })} />
        <MetricCard title="Makine" value={`%${metrics.machineOccupancy}`} note={`${metrics.productionMachines} üretimde`} icon={<Zap size={20} />} />
        <MetricCard title="Risk" value={lists.delayed.length} note="Geciken işler" icon={<AlertTriangle size={20} />} danger onClick={() => setSelectedList({ key: "delayed", title: "Riskteki İşler" })} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_1fr_1fr]">
        <Panel title="Dönem Özeti" icon={<Wallet size={18} />}>
          <SummaryRow label="Bu Dönem İş" value={periodJobs.length} />
          <SummaryRow label="Bu Dönem Teklif" value={periodQuotes.length} />
          <SummaryRow label="İşe Çevrilen Teklif" value={metrics.convertedQuoteCount} />
          <SummaryRow label="Teklif Toplamı" value={money(metrics.quoteTotal)} />
          <SummaryRow label="İşe Dönüşen Tutar" value={money(metrics.jobTotal)} />
        </Panel>

        <Panel title="İş Durum Grafiği" icon={<BarChart3 size={18} />}>
          <ChartBar label="Aktif" value={lists.active.length} max={maxChart} />
          <ChartBar label="Bekleyen" value={lists.waiting.length} max={maxChart} />
          <ChartBar label="Üretimde" value={lists.production.length} max={maxChart} />
          <ChartBar label="Kalite" value={lists.quality.length} max={maxChart} />
          <ChartBar label="Tamamlanan" value={lists.completed.length} max={maxChart} />
        </Panel>

        <Panel title="Risk & Takip" icon={<TrendingUp size={18} />}>
          <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white p-3 text-amber-600">
                <AlertTriangle size={24} />
              </div>
              <div>
                <p className="text-sm font-black text-amber-700">Geciken İş</p>
                <p className="text-3xl font-black text-amber-900">{lists.delayed.length}</p>
              </div>
            </div>
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-500">
            {lists.waiting.length > 0
              ? `${lists.waiting.length} iş başlamayı bekliyor. Sıradaki adım üretime alma veya makine ataması.`
              : "Bekleyen iş yok. Atölye akışı temiz görünüyor."}
          </p>
        </Panel>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Panel title="Makine Parkı" icon={<Factory size={18} />}>
          {machines.length === 0 ? (
            <EmptyText text="Henüz makine tanımlanmadı. Makineler sayfasından makine ekleyince burada canlı görünecek." />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {machines.slice(0, 6).map((machine) => (
                <MachineCard key={machine.id} machine={machine} />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Son Hareketler" icon={<Timer size={18} />}>
          {activities.length === 0 ? (
            <EmptyText text="Henüz aktivite yok." />
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <ActivityRow key={activity.id} activity={activity} />
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr]">
        <Panel title="Son İşler" icon={<Briefcase size={18} />}>
          {periodJobs.length === 0 ? (
            <EmptyText text="Bu dönemde henüz iş kaydı yok." />
          ) : (
            <div className="space-y-3">
              {periodJobs.slice(0, 5).map((job) => (
                <JobLine key={job.id} job={job} onClick={() => setSelectedJob(job)} />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Son Teklifler" icon={<FileText size={18} />}>
          {periodQuotes.length === 0 ? (
            <EmptyText text="Bu dönemde henüz teklif kaydı yok." />
          ) : (
            <div className="space-y-3">
              {periodQuotes.slice(0, 5).map((quote) => (
                <QuoteLine key={quote.id} quote={quote} />
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="mt-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">Genel Durum</h2>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          {lists.waiting.length > 0
            ? `${lists.waiting.length} iş başlamayı bekliyor. Sıradaki adım üretime alma veya makine ataması.`
            : "Sistem dengeli çalışıyor. Yeni teklif veya üretim planlaması bekleniyor."}
        </p>
      </div>

      {selectedList && selectedList.key !== "quotes" && (
        <JobModal
          title={selectedList.title}
          jobs={selectedJobs}
          onClose={() => setSelectedList(null)}
          onSelect={(job) => setSelectedJob(job)}
        />
      )}

      {selectedList?.key === "quotes" && (
        <QuoteModal
          title={selectedList.title}
          quotes={periodQuotes}
          onClose={() => setSelectedList(null)}
        />
      )}

      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )}
    </div>
  );
}

function TopInfo({ title, value, dark }) {
  return (
    <div
      className={`rounded-3xl border p-4 shadow-sm ${
        dark
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-900"
      }`}
    >
      <p className={`text-xs font-black ${dark ? "text-slate-300" : "text-slate-400"}`}>
        {title}
      </p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}

function HeroMini({ title, value, icon, danger }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <div className={`rounded-2xl p-3 ${danger ? "bg-red-50 text-red-600" : "bg-white text-blue-600"}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-black text-slate-400">{title}</p>
          <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, note, icon, danger, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-3xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        danger ? "border-red-100" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-500">{title}</p>
          <h3 className="mt-2 text-2xl font-black text-slate-950">{value}</h3>
        </div>
        <div className={`rounded-2xl p-3 ${danger ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
          {icon}
        </div>
      </div>
      <p className="mt-3 text-xs font-semibold text-slate-400">{note}</p>
    </button>
  );
}

function Panel({ title, icon, children }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-950">{title}</h2>
        <div className="rounded-2xl bg-slate-50 p-2 text-slate-500">{icon}</div>
      </div>
      {children}
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-3 text-sm">
      <span className="font-semibold text-slate-500">{label}</span>
      <strong className="text-slate-950">{value}</strong>
    </div>
  );
}

function ChartBar({ label, value, max }) {
  const width = Math.max(6, (value / max) * 100);

  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-black text-slate-600">{label}</span>
        <span className="font-black text-slate-950">{value}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-slate-900" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function MachineCard({ machine }) {
  const production = machine.status === "production";
  const maintenance = machine.status === "maintenance";

  return (
    <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-slate-950">{safe(machine.name)}</p>
          <p className="mt-1 text-xs font-bold text-slate-400">{safe(machine.type)}</p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-black ${
            production
              ? "border-blue-200 bg-blue-50 text-blue-700"
              : maintenance
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {machineStatusLabels[machine.status] || safe(machine.status)}
        </span>
      </div>

      {production ? (
        <div className="mt-4 rounded-2xl bg-white p-3">
          <p className="text-xs font-black text-slate-400">Çalışan İş</p>
          <p className="mt-1 font-black text-slate-900">{safe(machine.activeJobNo)}</p>
          <p className="text-xs font-semibold text-slate-500">{safe(machine.activeJobTitle)}</p>
        </div>
      ) : (
        <p className="mt-4 text-sm font-semibold text-slate-500">
          {maintenance ? "Bakım / kontrol sürecinde." : "Makine boşta veya plan bekliyor."}
        </p>
      )}
    </div>
  );
}

function ActivityRow({ activity }) {
  const time = activity.time
    ? new Date(activity.time).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
    : "—";

  return (
    <div className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <div className="rounded-xl bg-white px-2 py-1 text-xs font-black text-slate-500">
        {time}
      </div>
      <div>
        <p className="font-black text-slate-900">{activity.title}</p>
        <p className="text-sm font-semibold text-slate-500">{activity.desc}</p>
      </div>
    </div>
  );
}

function JobLine({ job, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black text-blue-600">{safe(job.jobNo)}</p>
          <p className="mt-1 font-black text-slate-950">{safe(job.title)}</p>
          <p className="text-sm font-semibold text-slate-500">{safe(job.customer)}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusColors[job.status]}`}>
          {statusLabels[job.status] || safe(job.status)}
        </span>
      </div>
    </button>
  );
}

function QuoteLine({ quote }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black text-blue-600">{safe(quote.id)}</p>
          <p className="mt-1 font-black text-slate-950">{safe(quote.title)}</p>
          <p className="text-sm font-semibold text-slate-500">{safe(quote.customer)}</p>
        </div>
        <p className="font-black text-slate-950">{money(quoteAmount(quote))}</p>
      </div>
    </div>
  );
}

function EmptyText({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-400">
      {text}
    </div>
  );
}

function JobModal({ title, jobs, onClose, onSelect }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-2xl font-black text-slate-950">{title}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">Toplam {jobs.length} iş bulundu.</p>
          </div>
          <button onClick={onClose} className="rounded-2xl bg-slate-100 px-3 py-2 font-black text-slate-500 hover:bg-slate-200">×</button>
        </div>

        {jobs.length === 0 ? (
          <EmptyText text="Bu grupta iş yok." />
        ) : (
          <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-2">
            {jobs.map((job) => <JobLine key={job.id} job={job} onClick={() => onSelect?.(job)} />)}
          </div>
        )}
      </div>
    </div>
  );
}


function JobDetailModal({ job, onClose }) {
  const operations = Array.isArray(job.operations) ? job.operations : [];
  const createdDate = job.createdAt
    ? new Date(job.createdAt).toLocaleDateString("tr-TR")
    : "—";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <p className="text-xs font-black text-slate-400">İŞ DETAYI</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">
              {safe(job.jobNo)}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {safe(job.title)} • {safe(job.customer)}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-2xl bg-slate-100 px-3 py-2 font-black text-slate-500 hover:bg-slate-200"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <DetailBox label="Durum" value={statusLabels[job.status] || safe(job.status)} />
          <DetailBox label="Teklif No" value={safe(job.quoteNo)} />
          <DetailBox label="Tutar" value={money(job.quoteTotal)} />
          <DetailBox label="Makine" value={safe(job.machineName)} />
          <DetailBox label="Operatör" value={safe(job.operator)} />
          <DetailBox label="Termin" value={safe(job.deadline)} />
          <DetailBox label="Malzeme" value={safe(job.material)} />
          <DetailBox label="Malzeme Tipi" value={safe(job.materialType)} />
          <DetailBox label="Oluşturma" value={createdDate} />
        </div>

        <div className="mt-5 rounded-3xl border border-slate-100 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-black text-slate-950">Operasyonlar</h3>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500">
              {operations.length} operasyon
            </span>
          </div>

          {operations.length === 0 ? (
            <EmptyText text="Bu işte operasyon kaydı yok." />
          ) : (
            <div className="space-y-2">
              {operations.map((op, index) => (
                <div
                  key={`${op.name}-${index}`}
                  className="grid grid-cols-1 gap-2 rounded-2xl bg-white p-3 text-sm md:grid-cols-[1.3fr_1fr_0.7fr_0.8fr]"
                >
                  <div>
                    <p className="text-xs font-black text-slate-400">Operasyon</p>
                    <p className="font-black text-slate-900">{safe(op.name)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400">Makine</p>
                    <p className="font-black text-slate-900">{safe(op.machine)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400">Saat</p>
                    <p className="font-black text-slate-900">{safe(op.hours)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400">Saatlik</p>
                    <p className="font-black text-slate-900">{money(op.hourlyRate)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs font-black">
            <span className="text-slate-500">İlerleme</span>
            <span className="text-slate-900">%{Number(job.progress || 0)}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-900"
              style={{ width: `${Number(job.progress || 0)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailBox({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <p className="text-xs font-black text-slate-400">{label}</p>
      <p className="mt-1 font-black text-slate-950">{value}</p>
    </div>
  );
}


function QuoteModal({ title, quotes, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-2xl font-black text-slate-950">{title}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">Toplam {quotes.length} teklif bulundu.</p>
          </div>
          <button onClick={onClose} className="rounded-2xl bg-slate-100 px-3 py-2 font-black text-slate-500 hover:bg-slate-200">×</button>
        </div>

        {quotes.length === 0 ? (
          <EmptyText text="Bu dönemde teklif yok." />
        ) : (
          <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-2">
            {quotes.map((quote) => <QuoteLine key={quote.id} quote={quote} />)}
          </div>
        )}
      </div>
    </div>
  );
}

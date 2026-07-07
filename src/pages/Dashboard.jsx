import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  Factory,
  CalendarDays,
  TrendingUp,
  Wallet,
  BarChart3,
} from "lucide-react";
import { getJobs, getQuotes, getActivePeriod } from "../utils/storage";
import { getCurrentPeriod } from "../utils/period";

const statusLabels = {
  active: "Aktif",
  waiting: "Bekleyen",
  production: "Üretimde",
  completed: "Tamamlanan",
};

const statusStyles = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  waiting: "border-amber-200 bg-amber-50 text-amber-700",
  production: "border-blue-200 bg-blue-50 text-blue-700",
  completed: "border-slate-200 bg-slate-100 text-slate-700",
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

function normalizeStatus(status) {
  const s = String(status || "").toLowerCase();

  if (s.includes("üret") || s.includes("production")) return "production";
  if (s.includes("tamam") || s.includes("completed")) return "completed";
  if (s.includes("bek") || s.includes("waiting")) return "waiting";
  if (s.includes("aktif") || s.includes("active")) return "active";

  return "active";
}

function getPeriodFromDate(date) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function normalizeJob(job) {
  const id = job.id || job.jobNo;
  const status = normalizeStatus(job.status);
  const progress =
    status === "completed"
      ? 100
      : Math.max(0, Math.min(100, Number(job.progress || 0)));

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
    status,
    quoteTotal: job.quoteTotal || job.price || job.totalPrice || job.amount || 0,
    quoteNo: job.quoteNo || job.quoteId || job.offerNo || "",
    quoteType: job.quoteType || job.offerType || "",
    deadline: job.deadline || job.dueDate || "",
    material: job.material || job.materialName || "",
    materialType: job.materialType || job.materialOwner || job.materialSource || "",
    machine: job.machine || job.machineName || "",
    priority: job.priority || "Normal",
    progress,
    createdAt: job.createdAt || job.date || "",
    periodKey: job.periodKey || getPeriodFromDate(job.createdAt || job.date),
  };
}

function normalizeQuote(quote) {
  return {
    ...quote,
    id: quote.id || quote.quoteNo,
    customer: quote.customer || quote.customerName || "Müşteri Yok",
    title: quote.title || quote.jobName || quote.partName || "İsimsiz Teklif",
    total: quote.totals?.grandTotal || quote.quoteTotal || quote.price || 0,
    status: quote.status || "Beklemede",
    createdAt: quote.createdAt || quote.date || "",
    periodKey: quote.periodKey || getPeriodFromDate(quote.createdAt || quote.date),
  };
}

function formatClock(date) {
  return date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDate(date) {
  return date.toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function buildInsight(lists, periodJobs, periodQuotes) {
  if (lists.delayed.length > 0) {
    return `${lists.delayed.length} işin termini geçmiş görünüyor. Önce geciken işleri kapatmak iyi olur.`;
  }

  if (lists.production.length > 0) {
    return `${lists.production.length} iş üretimde. Bugünün odağı üretimdeki işleri tamamlamaya almak.`;
  }

  if (lists.waiting.length > 0) {
    return `${lists.waiting.length} iş başlamayı bekliyor. Sıradaki adım üretime alma veya makine ataması.`;
  }

  if (periodJobs.length === 0 && periodQuotes.length === 0) {
    return "Bu dönemde henüz kayıt yok. Teklif veya manuel iş ekleyince burası dolacak.";
  }

  return "Bu dönem dengeli görünüyor. Kritik gecikme yok.";
}

export default function Dashboard() {
  const [selectedType, setSelectedType] = useState(null);
  const [now, setNow] = useState(new Date());
  const [jobs, setJobs] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [activePeriod, setActivePeriod] = useState(() =>
    getActivePeriod(getCurrentPeriod())
  );

  function loadData() {
    setJobs(getJobs().map(normalizeJob).filter((job) => job.id));
    setQuotes(getQuotes().map(normalizeQuote).filter((quote) => quote.id));
    setActivePeriod(getActivePeriod(getCurrentPeriod()));
  }

  useEffect(() => {
    loadData();

    const events = [
      "forgeerp:jobs-updated",
      "forgeerp:quotes-updated",
      "forgeerp:period-changed",
      "storage",
      "focus",
    ];

    events.forEach((eventName) => window.addEventListener(eventName, loadData));

    return () => {
      events.forEach((eventName) =>
        window.removeEventListener(eventName, loadData)
      );
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const today = todayISO();

  const periodJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (!activePeriod?.periodKey) return true;
      return !job.periodKey || job.periodKey === activePeriod.periodKey;
    });
  }, [jobs, activePeriod]);

  const periodQuotes = useMemo(() => {
    return quotes.filter((quote) => {
      if (!activePeriod?.periodKey) return true;
      return !quote.periodKey || quote.periodKey === activePeriod.periodKey;
    });
  }, [quotes, activePeriod]);

  const lists = useMemo(
    () => ({
      active: periodJobs.filter((job) => job.status === "active"),
      waiting: periodJobs.filter((job) => job.status === "waiting"),
      production: periodJobs.filter((job) => job.status === "production"),
      delayed: periodJobs.filter(
        (job) =>
          job.deadline && job.deadline < today && job.status !== "completed"
      ),
      completed: periodJobs.filter((job) => job.status === "completed"),
    }),
    [periodJobs, today]
  );

  const selectedJobs = selectedType ? lists[selectedType.key] || [] : [];

  const quoteTotal = periodQuotes.reduce(
    (sum, quote) => sum + Number(quote.total || 0),
    0
  );

  const jobTotal = periodJobs.reduce(
    (sum, job) => sum + Number(job.quoteTotal || job.price || 0),
    0
  );

  const approvedQuotes = periodQuotes.filter(
    (quote) => quote.status === "İşe Çevrildi"
  ).length;

  const maxChartValue = Math.max(
    lists.active.length,
    lists.waiting.length,
    lists.production.length,
    lists.completed.length,
    1
  );

  const insight = buildInsight(lists, periodJobs, periodQuotes);

  const recentJobs = [...periodJobs]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  const recentQuotes = [...periodQuotes]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm">
            ForgeERP by EFE CNC
          </div>

          <h1 className="mt-3 text-3xl font-black text-slate-950">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Atölye özeti, aktif dönem, teklif dönüşleri ve iş durumu.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <TopInfo title="Aktif Dönem" value={activePeriod?.label || "Bu Ay"} />
          <TopInfo title={formatDate(now)} value={formatClock(now)} dark />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Aktif İş"
          value={lists.active.length}
          note="Devam eden işler"
          icon={<Activity size={21} />}
          onClick={() => setSelectedType({ key: "active", title: "Aktif İşler" })}
        />

        <StatCard
          title="Bekleyen İş"
          value={lists.waiting.length}
          note="Başlamayı bekleyen işler"
          icon={<Clock size={21} />}
          onClick={() => setSelectedType({ key: "waiting", title: "Bekleyen İşler" })}
        />

        <StatCard
          title="Üretimde"
          value={lists.production.length}
          note="Operasyondaki işler"
          icon={<Factory size={21} />}
          onClick={() => setSelectedType({ key: "production", title: "Üretimdeki İşler" })}
        />

        <StatCard
          title="Tamamlanan"
          value={lists.completed.length}
          note="Kapanmış işler"
          icon={<CheckCircle2 size={21} />}
          onClick={() => setSelectedType({ key: "completed", title: "Tamamlanan İşler" })}
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel title="Dönem Özeti" icon={<Wallet size={18} />}>
          <SummaryRow label="Bu Dönem İş" value={periodJobs.length} />
          <SummaryRow label="Bu Dönem Teklif" value={periodQuotes.length} />
          <SummaryRow label="İşe Çevrilen Teklif" value={approvedQuotes} />
          <SummaryRow label="Teklif Toplamı" value={money(quoteTotal)} />
          <SummaryRow label="İşe Dönüşen Tutar" value={money(jobTotal)} />
        </Panel>

        <Panel title="İş Durum Grafiği" icon={<BarChart3 size={18} />}>
          <ChartBar label="Aktif" value={lists.active.length} max={maxChartValue} />
          <ChartBar label="Bekleyen" value={lists.waiting.length} max={maxChartValue} />
          <ChartBar label="Üretimde" value={lists.production.length} max={maxChartValue} />
          <ChartBar label="Tamamlanan" value={lists.completed.length} max={maxChartValue} />
        </Panel>

        <Panel title="Risk & Takip" icon={<TrendingUp size={18} />}>
          <BigRisk value={lists.delayed.length} />
          <p className="mt-3 text-sm text-slate-500">{insight}</p>
        </Panel>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Son İşler" icon={<Factory size={18} />}>
          {recentJobs.length === 0 ? (
            <EmptyState text="Bu dönemde henüz iş kaydı yok." />
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <MiniJob key={job.id} job={job} />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Son Teklifler" icon={<Wallet size={18} />}>
          {recentQuotes.length === 0 ? (
            <EmptyState text="Bu dönemde henüz teklif kaydı yok." />
          ) : (
            <div className="space-y-3">
              {recentQuotes.map((quote) => (
                <MiniQuote key={quote.id} quote={quote} />
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">Genel Durum</h2>
        <p className="mt-2 text-sm text-slate-500">{insight}</p>
      </div>

      {selectedType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  {selectedType.title}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Toplam {selectedJobs.length} iş bulundu.
                </p>
              </div>

              <button
                onClick={() => setSelectedType(null)}
                className="rounded-2xl bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            {selectedJobs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-slate-400">
                Bu grupta iş yok kanka.
              </div>
            ) : (
              <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-2">
                {selectedJobs.map((job) => (
                  <JobModalCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </div>
        </div>
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
      <p className={`text-xs font-bold ${dark ? "text-slate-300" : "text-slate-400"}`}>
        {title}
      </p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}

function StatCard({ title, value, note, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-black text-slate-500">{title}</p>
          <h3 className="mt-3 text-3xl font-black text-slate-950">{value}</h3>
        </div>

        <div className="rounded-2xl bg-slate-50 p-3 text-slate-700">
          {icon}
        </div>
      </div>

      <p className="mt-4 text-xs font-semibold text-slate-400">{note}</p>
    </button>
  );
}

function Panel({ title, icon, children }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-950">{title}</h2>
        <div className="rounded-2xl bg-slate-50 p-2 text-slate-500">
          {icon}
        </div>
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
    <div className="mb-4 last:mb-0">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-bold text-slate-600">{label}</span>
        <span className="font-black text-slate-950">{value}</span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-slate-900"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function BigRisk({ value }) {
  return (
    <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-white p-3 text-amber-600">
          <AlertTriangle size={24} />
        </div>

        <div>
          <p className="text-sm font-bold text-amber-700">Geciken İş</p>
          <p className="text-3xl font-black text-amber-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function MiniJob({ job }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black text-slate-500">{safe(job.jobNo)}</p>
          <h3 className="truncate text-sm font-black text-slate-950">{safe(job.title)}</h3>
          <p className="truncate text-xs font-semibold text-slate-500">{safe(job.customer)}</p>
        </div>

        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${statusStyles[job.status]}`}>
          {statusLabels[job.status]}
        </span>
      </div>
    </div>
  );
}

function MiniQuote({ quote }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black text-slate-500">{safe(quote.id)}</p>
          <h3 className="truncate text-sm font-black text-slate-950">{safe(quote.title)}</h3>
          <p className="truncate text-xs font-semibold text-slate-500">{safe(quote.customer)}</p>
        </div>

        <div className="text-right">
          <p className="text-sm font-black text-slate-950">{money(quote.total)}</p>
          <p className="text-[11px] font-bold text-slate-400">{safe(quote.status)}</p>
        </div>
      </div>
    </div>
  );
}

function JobModalCard({ job }) {
  const detailItems = [
    { label: "Teklif", value: job.quoteNo },
    { label: "Malzeme", value: job.material },
    { label: "Malzeme Tipi", value: job.materialType },
    { label: "Termin", value: job.deadline, icon: <CalendarDays size={15} /> },
    { label: "Makine", value: job.machine || "Henüz atanmadı", icon: <Factory size={15} /> },
    { label: "Tutar", value: money(job.quoteTotal) },
  ].filter((item) => item.value && item.value !== "—");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black text-slate-500">{safe(job.jobNo)}</p>
          <h3 className="mt-1 text-lg font-black text-slate-950">{safe(job.title)}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">{safe(job.customer)}</p>
        </div>

        <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusStyles[job.status]}`}>
          {statusLabels[job.status]}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {detailItems.map((item) => (
          <InfoBox key={item.label} icon={item.icon} label={item.label} value={item.value} />
        ))}
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs font-bold">
          <span className="text-slate-500">İlerleme</span>
          <span className="text-slate-900">%{job.progress}</span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-slate-900"
            style={{ width: `${job.progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function InfoBox({ icon, label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <p className="flex items-center gap-2 text-xs font-bold text-slate-400">
        {icon}
        {label}
      </p>

      <p className="mt-1 text-sm font-black text-slate-800">{value || "-"}</p>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-400">
      {text}
    </div>
  );
}

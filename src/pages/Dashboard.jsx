import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  FileText,
  Plus,
  ShoppingCart,
  Wallet,
  Wrench,
  BarChart3,
  Zap,
} from "lucide-react";

const today = new Date();
const todayISO = today.toISOString().slice(0, 10);

const readLS = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const money = (v) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(Number(v || 0));

const isToday = (d) => d && String(d).slice(0, 10) === todayISO;
const isPast = (d) => d && String(d).slice(0, 10) < todayISO;

export default function Dashboard({ setActivePage }) {
  const [calendarMode, setCalendarMode] = useState("Hafta");
  const [rates, setRates] = useState({
    loading: true,
    usd: null,
    eur: null,
    gold: null,
  });

  const go = (page) => {
    if (typeof setActivePage === "function") setActivePage(page);
  };

  useEffect(() => {
    async function loadRates() {
      try {
        const fxRes = await fetch("https://open.er-api.com/v6/latest/USD");
        const fx = await fxRes.json();

        let goldValue = null;
        try {
          const goldRes = await fetch("https://api.genelpara.com/embed/altin.json");
          const gold = await goldRes.json();
          goldValue = gold?.GA?.satis || gold?.ALTIN?.satis || null;
        } catch {
          goldValue = null;
        }

        setRates({
          loading: false,
          usd: fx?.rates?.TRY || null,
          eur: fx?.rates?.TRY && fx?.rates?.EUR ? fx.rates.TRY / fx.rates.EUR : null,
          gold: goldValue,
        });
      } catch {
        setRates({ loading: false, usd: null, eur: null, gold: null });
      }
    }

    loadRates();
  }, []);

  const data = useMemo(() => {
    const jobs = readLS("forge_jobs", []);
    const quotes = readLS("forge_quotes", []);
    const purchases = readLS("forge_purchases", []);
    const customers = readLS("forge_customers", []);
    const finance = readLS("forge_finance", {
      cash: 0,
      receivables: [],
      payables: [],
    });

    return {
      jobs: Array.isArray(jobs) ? jobs : [],
      quotes: Array.isArray(quotes) ? quotes : [],
      purchases: Array.isArray(purchases) ? purchases : [],
      customers: Array.isArray(customers) ? customers : [],
      finance: finance || {},
    };
  }, []);

  const stats = useMemo(() => {
    const receivables = data.finance.receivables || [];
    const payables = data.finance.payables || [];

    const activeJobs = data.jobs.filter((j) => j.status !== "Tamamlandı");
    const waitingJobs = data.jobs.filter((j) => j.status === "Bekliyor");
    const delayedJobs = data.jobs.filter(
      (j) => isPast(j.deadline || j.deliveryDate) && j.status !== "Tamamlandı"
    );
    const todayJobs = data.jobs.filter((j) => isToday(j.deadline || j.deliveryDate));

    const pendingQuotes = data.quotes.filter(
      (q) => q.status === "Bekliyor" || q.status === "Taslak"
    );
    const approvalQuotes = data.quotes.filter(
      (q) => q.status === "Onay Bekliyor" || q.status === "Müşteri Onayı"
    );
    const monthQuoteTotal = data.quotes
      .filter((q) => String(q.date || q.createdAt || "").slice(0, 7) === todayISO.slice(0, 7))
      .reduce((s, q) => s + Number(q.total || q.amount || q.price || 0), 0);

    const waitingPurchases = data.purchases.filter(
      (p) => p.status === "Bekliyor" || p.status === "Sipariş"
    );
    const notReceived = data.purchases.filter(
      (p) => p.received === false || p.status === "Teslim Alınmadı"
    );
    const nearDue = data.purchases.filter((p) => isToday(p.dueDate || p.paymentDate));

    const todayReceivable = receivables
      .filter((x) => isToday(x.dueDate || x.date))
      .reduce((s, x) => s + Number(x.amount || x.total || 0), 0);

    const todayPayable = payables
      .filter((x) => isToday(x.dueDate || x.date))
      .reduce((s, x) => s + Number(x.amount || x.total || 0), 0);

    const overdueReceivables = receivables.filter(
      (x) => isPast(x.dueDate || x.date) && x.status !== "Ödendi"
    );
    const overduePayables = payables.filter(
      (x) => isPast(x.dueDate || x.date) && x.status !== "Ödendi"
    );

    return {
      activeJobs,
      waitingJobs,
      delayedJobs,
      todayJobs,
      pendingQuotes,
      approvalQuotes,
      monthQuoteTotal,
      waitingPurchases,
      notReceived,
      nearDue,
      todayReceivable,
      todayPayable,
      overdueReceivables,
      overduePayables,
      overdueReceivableTotal: overdueReceivables.reduce(
        (s, x) => s + Number(x.amount || x.total || 0),
        0
      ),
      overduePayableTotal: overduePayables.reduce(
        (s, x) => s + Number(x.amount || x.total || 0),
        0
      ),
      cash: Number(data.finance.cash || data.finance.balance || 0),
    };
  }, [data]);

  const recent = [
    ...data.quotes.slice(-3).map((x) => ({
      type: "Teklifler",
      text: `Teklif kaydı - ${x.quoteNo || x.customer || "Yeni teklif"}`,
      page: "Teklifler",
    })),
    ...data.purchases.slice(-3).map((x) => ({
      type: "Satın Alma",
      text: `Satın alma kaydı - ${x.supplier || x.name || "Yeni sipariş"}`,
      page: "Satın Alma",
    })),
    ...data.jobs.slice(-3).map((x) => ({
      type: "İş Takibi",
      text: `İş kaydı - ${x.jobNo || x.name || "Yeni iş"}`,
      page: "İş Takibi",
    })),
  ].slice(-7).reverse();

  return (
    <div className="min-h-screen bg-[#f7f9fc] p-5 text-slate-900">
      <header className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Merhaba, Yasin 👋</h1>
          <p className="mt-1 text-sm text-slate-500">
            ForgeERP kontrol merkezi, tüm süreçlerin tek ekranında.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-xs font-black">
              CANLI KURLAR <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>

            <div className="grid grid-cols-3 gap-5 text-sm">
              <Rate label="USD/TRY" value={rates.usd} loading={rates.loading} />
              <Rate label="EUR/TRY" value={rates.eur} loading={rates.loading} />
              <Rate label="ALTIN/GR" value={rates.gold} loading={rates.loading} />
            </div>
          </div>

          <button onClick={() => go("Risk")} className="relative rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <Bell size={20} />
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-black text-white">
              3
            </span>
          </button>

          <button
            onClick={() => go("Dashboard")}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center shadow-sm"
          >
            <p className="text-xs font-bold text-slate-500">9 Temmuz 2026</p>
            <p className="text-xs text-slate-500">Çarşamba</p>
            <p className="mt-1 text-xl font-black">14:30:25</p>
          </button>
        </div>
      </header>

      <section className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <TopCard title="Bugün Bize Ödenecekler" value={money(stats.todayReceivable)} sub="Tahsilat" icon={CircleDollarSign} color="green" onClick={() => go("Finans")} />
        <TopCard title="Bugün Bizim Ödeyeceklerimiz" value={money(stats.todayPayable)} sub="Ödeme" icon={Wallet} color="blue" onClick={() => go("Finans")} />
        <TopCard title="Vadesi Geçen Tahsilatlar" value={money(stats.overdueReceivableTotal)} sub={`${stats.overdueReceivables.length} tahsilat`} icon={AlertTriangle} color="red" onClick={() => go("Finans")} />
        <TopCard title="Vadesi Geçen Borçlar" value={money(stats.overduePayableTotal)} sub={`${stats.overduePayables.length} borç`} icon={AlertTriangle} color="orange" onClick={() => go("Finans")} />
        <TopCard title="Güncel Kasa Bakiyesi" value={money(stats.cash)} sub="Kasa bakiyesi" icon={Wallet} color="purple" onClick={() => go("Finans")} />
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 xl:col-span-5">
          <ModuleCard
            title="Üretim"
            icon={BriefcaseBusiness}
            button="Üretime Git"
            onClick={() => go("Üretim")}
            rows={[
              ["Aktif İşler", stats.activeJobs.length, "green"],
              ["Bekleyen İşler", stats.waitingJobs.length, "orange"],
              ["Geciken İşler", stats.delayedJobs.length, "red"],
              ["Bugün Teslim Edilecek", stats.todayJobs.length, "blue"],
            ]}
          />

          <ModuleCard
            title="Teklifler"
            icon={FileText}
            button="Tekliflere Git"
            onClick={() => go("Teklifler")}
            rows={[
              ["Bekleyen Teklifler", stats.pendingQuotes.length, "blue"],
              ["Onay Bekleyen Teklifler", stats.approvalQuotes.length, "orange"],
              ["Bu Ay Teklif Tutarı", money(stats.monthQuoteTotal), "gray"],
            ]}
          />

          <ModuleCard
            title="Satın Alma"
            icon={ShoppingCart}
            button="Satın Almalara Git"
            onClick={() => go("Satın Alma")}
            rows={[
              ["Bekleyen Satın Almalar", stats.waitingPurchases.length, "purple"],
              ["Teslim Alınmayan Siparişler", stats.notReceived.length, "orange"],
              ["Yaklaşan Vadeler", stats.nearDue.length, "red"],
            ]}
          />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black text-blue-700">İş Takvimi</h2>
            <div className="flex gap-2">
              {["Gün", "Hafta", "Ay", "Ajanda"].map((m) => (
                <button
                  key={m}
                  onClick={() => setCalendarMode(m)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                    calendarMode === m
                      ? "bg-blue-600 text-white"
                      : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <CalendarMock onClick={() => go("İş Takibi")} />

          <div className="mt-4 flex flex-wrap justify-center gap-5 text-xs font-bold text-slate-500">
            <Legend color="bg-emerald-500" text="Aktif İş" />
            <Legend color="bg-amber-500" text="Bekleyen İş" />
            <Legend color="bg-red-500" text="Geciken İş" />
            <Legend color="bg-blue-500" text="Bugün Teslim" />
            <Legend color="bg-purple-500" text="Tamamlanan İş" />
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-black text-blue-700">Hızlı Erişim</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Quick title="Yeni İş" sub="İş Takibi" onClick={() => go("İş Takibi")} />
          <Quick title="Yeni Teklif" sub="Teklifler" onClick={() => go("Teklifler")} />
          <Quick title="Yeni Müşteri" sub="Müşteriler" onClick={() => go("Müşteriler")} />
          <Quick title="Tahsilat Ekle" sub="Finans" onClick={() => go("Finans")} />
          <Quick title="Makine Bakım" sub="Makineler" onClick={() => go("Makineler")} />
          <Quick title="Üretim Planı" sub="Üretim" onClick={() => go("Üretim")} />
        </div>
      </section>

      <section className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-12">
        <BottomCard title="Son Hareketler" className="xl:col-span-3">
          <div className="space-y-3">
            {(recent.length ? recent : [{ text: "Henüz hareket yok", type: "ERP", page: "Dashboard" }]).map((r, i) => (
              <button key={i} onClick={() => go(r.page)} className="flex w-full items-center gap-3 rounded-2xl bg-slate-50 p-3 text-left transition hover:bg-blue-50">
                <div className="rounded-xl bg-white p-2 text-blue-600">
                  <Clock size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-black">{r.text}</p>
                  <p className="text-xs text-slate-500">{r.type}</p>
                </div>
                <ArrowRight size={15} />
              </button>
            ))}
          </div>
        </BottomCard>

        <BottomCard title="İş Durumu Özeti" className="xl:col-span-3">
          <button onClick={() => go("İş Takibi")} className="flex w-full items-center justify-center gap-7">
            <div className="flex h-32 w-32 items-center justify-center rounded-full border-[16px] border-emerald-500">
              <div className="text-center">
                <p className="text-2xl font-black">{data.jobs.length}</p>
                <p className="text-xs font-bold text-slate-500">Toplam İş</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <SummaryDot color="bg-emerald-500" label="Aktif" value={stats.activeJobs.length} />
              <SummaryDot color="bg-amber-500" label="Bekleyen" value={stats.waitingJobs.length} />
              <SummaryDot color="bg-red-500" label="Geciken" value={stats.delayedJobs.length} />
              <SummaryDot color="bg-slate-400" label="Tamamlanan" value="0" />
            </div>
          </button>
        </BottomCard>

        <BottomCard title="Finans Durum Grafiği (Bu Ay)" className="xl:col-span-3">
          <button onClick={() => go("Finans")} className="flex h-44 w-full items-end gap-2">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="flex flex-1 items-end gap-1">
                <div className="w-full rounded-t bg-emerald-400" style={{ height: `${25 + ((i * 17) % 90)}px` }} />
                <div className="w-full rounded-t bg-red-400" style={{ height: `${10 + ((i * 9) % 50)}px` }} />
              </div>
            ))}
          </button>
        </BottomCard>

        <BottomCard title="Yaklaşan Vadeler" className="xl:col-span-2">
          <Due onClick={() => go("Finans")} name="ABC Ltd. - Tahsilat" amount="₺75.000" date="10 Temmuz" />
          <Due onClick={() => go("Finans")} name="XYZ A.Ş. - Ödeme" amount="₺45.000" date="11 Temmuz" />
          <Due onClick={() => go("Finans")} name="DEF Makina - Ödeme" amount="₺60.000" date="12 Temmuz" />
        </BottomCard>

        <BottomCard title="Risk & Takip" className="xl:col-span-1">
          <Risk onClick={() => go("İş Takibi")} text="Geciken İşler" value={stats.delayedJobs.length} />
          <Risk onClick={() => go("Finans")} text="Geciken Tahsilatlar" value={stats.overdueReceivables.length} />
          <Risk onClick={() => go("Finans")} text="Geciken Borçlar" value={stats.overduePayables.length} />
          <Risk onClick={() => go("Satın Alma")} text="Bakım Yaklaşan" value="0" />
        </BottomCard>
      </section>

      <p className="py-5 text-center text-xs font-semibold text-slate-400">
        ForgeERP by EFE CNC - Enterprise Resource Planning System
      </p>
    </div>
  );
}

function Rate({ label, value, loading }) {
  return (
    <button className="text-left">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="font-black">
        {loading ? "..." : value ? Number(value).toLocaleString("tr-TR", { maximumFractionDigits: 2 }) : "Bağlantı yok"}
      </p>
      <p className="text-xs font-bold text-emerald-500">Canlı</p>
    </button>
  );
}

function TopCard({ title, value, sub, icon: Icon, color, onClick }) {
  const colors = {
    green: "bg-emerald-100 text-emerald-600",
    blue: "bg-blue-100 text-blue-600",
    red: "bg-red-100 text-red-600",
    orange: "bg-orange-100 text-orange-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <button onClick={onClick} className="rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className={`mb-4 inline-flex rounded-2xl p-3 ${colors[color]}`}>
        <Icon size={22} />
      </div>
      <p className="text-xs font-black uppercase text-slate-500">{title}</p>
      <h3 className="mt-2 text-2xl font-black">{value}</h3>
      <p className="mt-1 text-sm font-semibold text-slate-500">{sub}</p>
    </button>
  );
}

function ModuleCard({ title, icon: Icon, rows, button, onClick }) {
  const dot = {
    green: "bg-emerald-500",
    orange: "bg-amber-500",
    red: "bg-red-500",
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    gray: "bg-slate-400",
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
        <Icon className="text-blue-600" size={22} />
        <h2 className="text-lg font-black">{title}</h2>
      </div>

      <div className="space-y-5">
        {rows.map(([label, value, color]) => (
          <button key={label} onClick={onClick} className="flex w-full items-center justify-between rounded-xl text-left transition hover:bg-slate-50">
            <div className="flex items-center gap-3">
              <span className={`h-3 w-3 rounded-full ${dot[color]}`} />
              <p className="text-sm font-bold">{label}</p>
            </div>
            <p className="font-black">{value}</p>
          </button>
        ))}
      </div>

      <button onClick={onClick} className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 py-3 text-sm font-black text-blue-600 transition hover:bg-blue-600 hover:text-white">
        {button} <ArrowRight size={16} />
      </button>
    </div>
  );
}

function CalendarMock({ onClick }) {
  const days = ["Pzt 6", "Sal 7", "Çar 8", "Per 9", "Cum 10", "Cmt 11", "Paz 12"];
  const jobs = [
    ["ABC Otomotiv", "08:30 - 11:00", "bg-emerald-100 border-emerald-300", 1, 1],
    ["XYZ Ltd.", "10:00 - 12:00", "bg-amber-100 border-amber-300", 2, 2],
    ["DEF Makina", "10:00 - 13:00", "bg-purple-100 border-purple-300", 3, 2],
    ["GHI Kalıp", "14:00 - 17:30", "bg-red-100 border-red-300", 3, 5],
    ["JKL Otomotiv", "09:30 - 12:30", "bg-blue-100 border-blue-300", 4, 2],
    ["MNO Ltd.", "12:30 - 16:30", "bg-emerald-100 border-emerald-300", 5, 4],
  ];

  return (
    <button onClick={onClick} className="w-full overflow-hidden rounded-2xl border border-slate-200 text-left">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {days.map((d) => (
          <div key={d} className="border-r border-slate-200 p-3 text-center text-xs font-black last:border-r-0">{d}</div>
        ))}
      </div>

      <div className="relative grid h-[210px] grid-cols-7 bg-white">
        {days.map((d) => (
          <div key={d} className="border-r border-slate-100 last:border-r-0" />
        ))}

        {jobs.map(([name, hour, cls, col, row], i) => (
          <div key={i} className={`absolute rounded-xl border p-2 text-[11px] font-bold ${cls}`} style={{ left: `${((col - 1) / 7) * 100 + 1}%`, top: `${row * 31}px`, width: "12.2%" }}>
            <p>İş-2026-{1025 + i}</p>
            <p>{name}</p>
            <p className="text-slate-500">{hour}</p>
          </div>
        ))}
      </div>
    </button>
  );
}

function Legend({ color, text }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {text}
    </div>
  );
}

function Quick({ title, sub, onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-1 hover:shadow-lg">
      <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
        <Plus size={18} />
      </div>
      <div>
        <p className="text-sm font-black text-blue-700">{title}</p>
        <p className="text-xs text-slate-500">{sub}</p>
      </div>
    </button>
  );
}

function BottomCard({ title, children, className = "" }) {
  return (
    <div className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <h2 className="mb-4 text-lg font-black">{title}</h2>
      {children}
    </div>
  );
}

function SummaryDot({ color, label, value }) {
  return (
    <div className="flex items-center justify-between gap-8">
      <div className="flex items-center gap-2">
        <span className={`h-3 w-3 rounded-full ${color}`} />
        <span className="font-bold text-slate-600">{label}</span>
      </div>
      <span className="font-black">{value}</span>
    </div>
  );
}

function Due({ name, amount, date, onClick }) {
  return (
    <button onClick={onClick} className="mb-3 w-full rounded-2xl bg-slate-50 p-3 text-left transition hover:bg-blue-50">
      <p className="text-xs font-black">{name}</p>
      <div className="mt-1 flex justify-between text-xs font-bold text-slate-500">
        <span>{amount}</span>
        <span>{date}</span>
      </div>
    </button>
  );
}

function Risk({ text, value, onClick }) {
  return (
    <button onClick={onClick} className="mb-3 flex w-full items-center justify-between rounded-2xl bg-slate-50 p-3 text-left transition hover:bg-red-50">
      <p className="text-xs font-black">{text}</p>
      <span className="font-black text-red-600">{value}</span>
    </button>
  );
}
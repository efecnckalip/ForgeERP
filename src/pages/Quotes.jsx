import { useMemo, useState } from "react";
import {
  getCurrentPeriod,
  getRecentPeriods,
  getStorageKey,
} from "../utils/period";

const materials = [
  "Çelik",
  "Alüminyum",
  "Bakır",
  "Bronz",
  "Paslanmaz",
  "Pirinç",
  "Plastik",
  "Döküm",
  "Diğer",
];

const operationDefaults = {
  "CNC Freze": 1500,
  "CNC Torna": 1400,
  "Tel Erezyon": 1700,
  "Hızlı Delik": 1600,
  Taşlama: 1300,
  "Erezyon (Bakır)": 1800,
  "Kalite Kontrol": 900,
};

const emptyOperation = {
  name: "CNC Freze",
  hours: 1,
  hourlyRate: operationDefaults["CNC Freze"],
};

const emptyQuote = {
  customer: "",
  title: "",
  quoteType: "İşçilik",
  material: "Çelik",
  materialType: "Plaka / Blok",
  materialOwner: "Bizden",
  weight: "",
  kgPrice: "",
  extraCost: "",
  profitRate: 25,
  note: "",
};

function toNumber(value) {
  const number = Number(String(value).replace(",", "."));
  return Number.isFinite(number) ? number : 0;
}

function currency(value) {
  return `${Number(value || 0).toLocaleString("tr-TR")} ₺`;
}

function readStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function writeStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

export default function Quotes() {
  const periods = getRecentPeriods(12);

  const [activePeriod, setActivePeriod] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("forgeerp_active_period")) || getCurrentPeriod();
    } catch {
      return getCurrentPeriod();
    }
  });

  const [quote, setQuote] = useState(emptyQuote);
  const [operations, setOperations] = useState([emptyOperation]);
  const [savedQuotes, setSavedQuotes] = useState(() => readStorage("forgeerp_quotes"));

  const hasMaterial = quote.quoteType === "İşçilik + Malzeme";

  const periodQuotes = useMemo(() => {
    return savedQuotes.filter((item) => item.periodKey === activePeriod.periodKey);
  }, [savedQuotes, activePeriod]);

  const totals = useMemo(() => {
    const operationTotal = operations.reduce(
      (sum, op) => sum + toNumber(op.hours) * toNumber(op.hourlyRate),
      0
    );

    const materialTotal =
      hasMaterial && quote.materialOwner === "Bizden"
        ? toNumber(quote.weight) * toNumber(quote.kgPrice)
        : 0;

    const extraCost = toNumber(quote.extraCost);
    const costTotal = operationTotal + materialTotal + extraCost;
    const profit = costTotal * (toNumber(quote.profitRate) / 100);
    const grandTotal = costTotal + profit;

    return {
      operationTotal,
      materialTotal,
      extraCost,
      costTotal,
      profit,
      grandTotal,
    };
  }, [quote, operations, hasMaterial]);

  function changePeriod(periodKey) {
    const selected = periods.find((p) => p.periodKey === periodKey);
    if (!selected) return;

    setActivePeriod(selected);
    writeStorage("forgeerp_active_period", selected);
    window.dispatchEvent(new Event("forgeerp:period-changed"));
  }

  function updateQuote(field, value) {
    setQuote((prev) => ({ ...prev, [field]: value }));
  }

  function updateOperation(index, field, value) {
    setOperations((prev) =>
      prev.map((op, i) => {
        if (i !== index) return op;

        if (field === "name") {
          return {
            ...op,
            name: value,
            hourlyRate: operationDefaults[value] || op.hourlyRate,
          };
        }

        return { ...op, [field]: value };
      })
    );
  }

  function addOperation() {
    setOperations((prev) => [...prev, { ...emptyOperation }]);
  }

  function removeOperation(index) {
    setOperations((prev) => prev.filter((_, i) => i !== index));
  }

  function saveQuote() {
    const newQuote = {
      id: `Q-${new Date().getFullYear()}-${String(savedQuotes.length + 1).padStart(3, "0")}`,
      ...quote,
      operations,
      totals,
      status: "Beklemede",
      createdAt: new Date().toISOString(),

      period: activePeriod.period,
      periodKey: activePeriod.periodKey,
      year: activePeriod.year,
      month: activePeriod.month,
      monthName: activePeriod.monthName,
    };

    const updatedAllQuotes = [newQuote, ...savedQuotes];
    const periodKey = getStorageKey("quotes", activePeriod);
    const updatedPeriodQuotes = [newQuote, ...readStorage(periodKey)];

    setSavedQuotes(updatedAllQuotes);
    writeStorage("forgeerp_quotes", updatedAllQuotes);
    writeStorage(periodKey, updatedPeriodQuotes);

    setQuote(emptyQuote);
    setOperations([{ ...emptyOperation }]);
  }

  function convertToJob(item) {
    const jobs = readStorage("forgeerp_jobs");

    const newJob = {
      id: `JOB-${new Date().getFullYear()}-${String(jobs.length + 1).padStart(3, "0")}`,
      customer: item.customer || "Müşteri seçilmedi",
      title: item.title || "Tekliften Gelen İş",

      material:
        item.quoteType === "İşçilik + Malzeme"
          ? item.material
          : "Müşteri Malzemesi / İşçilik",
      materialType: item.materialType,
      materialOwner: item.materialOwner,

      quoteNo: item.id,
      quoteType: item.quoteType,
      quoteTotal: item.totals?.grandTotal || 0,
      price: item.totals?.grandTotal || 0,

      operations: item.operations || [],
      status: "Beklemede",
      priority: "Normal",
      createdAt: new Date().toISOString(),
      date: new Date().toISOString(),

      period: item.period,
      periodKey: item.periodKey,
      year: item.year,
      month: item.month,
      monthName: item.monthName,
    };

    const updatedJobs = [newJob, ...jobs];
    const jobPeriodKey = getStorageKey("jobs", { periodKey: newJob.periodKey });

    writeStorage("forgeerp_jobs", updatedJobs);
    writeStorage("jobs", updatedJobs);
    writeStorage(jobPeriodKey, [newJob, ...readStorage(jobPeriodKey)]);

    window.dispatchEvent(new Event("forgeerp:jobs-updated"));

    const updatedQuotes = savedQuotes.map((q) =>
      q.id === item.id ? { ...q, status: "İşe Çevrildi" } : q
    );

    setSavedQuotes(updatedQuotes);
    writeStorage("forgeerp_quotes", updatedQuotes);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teklifler</h1>
          <p className="mt-1 text-sm text-slate-500">
            İşçilik veya işçilik + malzeme olarak profesyonel teklif oluştur.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-2 text-xs font-semibold text-slate-400">Aktif Dönem</p>
          <select
            value={activePeriod.periodKey}
            onChange={(e) => changePeriod(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-slate-400"
          >
            {periods.map((period) => (
              <option key={period.periodKey} value={period.periodKey}>
                {period.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <PeriodCard title="Bu Dönem Teklif" value={periodQuotes.length} />
        <PeriodCard
          title="Bu Dönem Toplam"
          value={currency(periodQuotes.reduce((s, q) => s + Number(q.totals?.grandTotal || 0), 0))}
        />
        <PeriodCard
          title="İşe Çevrilen"
          value={periodQuotes.filter((q) => q.status === "İşe Çevrildi").length}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">Teklif Bilgileri</h2>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Input label="Müşteri" value={quote.customer} onChange={(v) => updateQuote("customer", v)} />
              <Input label="İş / Parça Adı" value={quote.title} onChange={(v) => updateQuote("title", v)} />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">Teklif Türü</h2>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <QuoteTypeButton
                active={quote.quoteType === "İşçilik"}
                title="İşçilik"
                desc="Sadece operasyon ve ek maliyet hesaplanır."
                onClick={() => updateQuote("quoteType", "İşçilik")}
              />

              <QuoteTypeButton
                active={quote.quoteType === "İşçilik + Malzeme"}
                title="İşçilik + Malzeme"
                desc="Malzeme bilgisi teklife eklenir."
                onClick={() => updateQuote("quoteType", "İşçilik + Malzeme")}
              />
            </div>
          </section>

          {hasMaterial && (
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-bold">Malzeme Hesabı</h2>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                <Select label="Malzeme Tipi" value={quote.materialType} onChange={(v) => updateQuote("materialType", v)} options={["Plaka / Blok", "Çap / Mil", "Hazır Parça", "Diğer"]} />
                <Select label="Malzeme Seç" value={quote.material} onChange={(v) => updateQuote("material", v)} options={materials} />
                <Select label="Malzeme Kime Ait" value={quote.materialOwner} onChange={(v) => updateQuote("materialOwner", v)} options={["Bizden", "Müşteri"]} />
                <Input label="Ağırlık / Kg" type="number" value={quote.weight} onChange={(v) => updateQuote("weight", v)} />
                <Input label="Kg Fiyatı" type="number" value={quote.kgPrice} onChange={(v) => updateQuote("kgPrice", v)} disabled={quote.materialOwner === "Müşteri"} />
              </div>

              {quote.materialOwner === "Müşteri" && (
                <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                  Malzeme müşteriye ait seçildi. Malzeme bilgisi teklifte görünür,
                  fakat maliyet toplamına eklenmez.
                </p>
              )}
            </section>
          )}

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Operasyonlar</h2>

              <button onClick={addOperation} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                + Operasyon
              </button>
            </div>

            <div className="space-y-3">
              {operations.map((op, index) => (
                <div key={index} className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[1.5fr_1fr_1fr_auto]">
                  <Select label="Operasyon" value={op.name} onChange={(v) => updateOperation(index, "name", v)} options={Object.keys(operationDefaults)} />
                  <Input label="Saat" type="number" value={op.hours} onChange={(v) => updateOperation(index, "hours", v)} />
                  <Input label="Saatlik Fiyat" type="number" value={op.hourlyRate} onChange={(v) => updateOperation(index, "hourlyRate", v)} />

                  <button
                    onClick={() => removeOperation(index)}
                    disabled={operations.length === 1}
                    className="mt-6 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 disabled:opacity-40"
                  >
                    Sil
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">Ek Bilgiler</h2>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Input label="Ek Maliyet" type="number" value={quote.extraCost} onChange={(v) => updateQuote("extraCost", v)} />
              <Input label="Kâr Oranı %" type="number" value={quote.profitRate} onChange={(v) => updateQuote("profitRate", v)} />
            </div>

            <label className="mt-4 block">
              <span className="mb-1 block text-sm font-semibold text-slate-600">Not</span>
              <textarea
                value={quote.note}
                onChange={(e) => updateQuote("note", e.target.value)}
                className="min-h-[90px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
              />
            </label>
          </section>
        </div>

        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold">Teklif Özeti</h2>

          <SummaryRow label="Dönem" value={activePeriod.label} />
          <SummaryRow label="Teklif Türü" value={quote.quoteType} />
          <SummaryRow label="Operasyon" value={currency(totals.operationTotal)} />

          {hasMaterial && (
            <SummaryRow
              label={quote.materialOwner === "Bizden" ? "Malzeme" : "Malzeme (Müşteri)"}
              value={currency(totals.materialTotal)}
            />
          )}

          <SummaryRow label="Ek Maliyet" value={currency(totals.extraCost)} />
          <SummaryRow label="Ara Toplam" value={currency(totals.costTotal)} />
          <SummaryRow label="Kâr" value={currency(totals.profit)} />

          <div className="mt-4 rounded-2xl bg-slate-900 p-4 text-white">
            <p className="text-sm text-slate-300">Toplam Teklif</p>
            <h3 className="mt-1 text-3xl font-bold">{currency(totals.grandTotal)}</h3>
          </div>

          <button
            onClick={saveQuote}
            className="mt-4 w-full rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700"
          >
            Teklifi Kaydet
          </button>
        </aside>
      </div>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <h2 className="text-lg font-bold">Kayıtlı Teklifler</h2>
            <p className="text-sm text-slate-400">{activePeriod.label} dönemi gösteriliyor</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-4">Teklif No</th>
                <th className="px-5 py-4">Dönem</th>
                <th className="px-5 py-4">Müşteri</th>
                <th className="px-5 py-4">İş</th>
                <th className="px-5 py-4">Tür</th>
                <th className="px-5 py-4">Malzeme</th>
                <th className="px-5 py-4">Tutar</th>
                <th className="px-5 py-4">Durum</th>
                <th className="px-5 py-4">İşlem</th>
              </tr>
            </thead>

            <tbody>
              {periodQuotes.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-5 py-10 text-center text-sm text-slate-500">
                    Bu dönemde kayıtlı teklif yok.
                  </td>
                </tr>
              ) : (
                periodQuotes.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold">{item.id}</td>
                    <td className="px-5 py-4">{item.monthName ? `${item.monthName} ${item.year}` : "-"}</td>
                    <td className="px-5 py-4">{item.customer || "-"}</td>
                    <td className="px-5 py-4">{item.title || "-"}</td>
                    <td className="px-5 py-4">{item.quoteType || "İşçilik"}</td>
                    <td className="px-5 py-4">
                      {item.quoteType === "İşçilik + Malzeme"
                        ? `${item.material} / ${item.materialType}`
                        : "-"}
                    </td>
                    <td className="px-5 py-4 font-semibold">{currency(item.totals?.grandTotal)}</td>
                    <td className="px-5 py-4">{item.status}</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => convertToJob(item)}
                        disabled={item.status === "İşe Çevrildi"}
                        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
                      >
                        İşe Çevir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function PeriodCard({ title, value }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function QuoteTypeButton({ active, title, desc, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      <div className="font-bold">{title}</div>
      <div className="mt-1 text-sm opacity-75">{desc}</div>
    </button>
  );
}

function Input({ label, value, onChange, type = "text", disabled = false }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-600">{label}</span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 disabled:bg-slate-100 disabled:text-slate-400"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-600">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <strong className="text-slate-900">{value}</strong>
    </div>
  );
}
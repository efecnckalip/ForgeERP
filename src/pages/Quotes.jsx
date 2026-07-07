import { useMemo, useRef, useState } from "react";
import {
  Search,
  UserPlus,
  Phone,
  Mail,
  Copy,
  Eye,
  Trash2,
  FileText,
  Briefcase,
  DollarSign,
  Upload,
  CalendarDays,
  Download,
} from "lucide-react";
import { getCurrentPeriod, getRecentPeriods } from "../utils/period";
import { printQuoteDocument } from "../services/documentService";
import {
  addFiles,
  deleteFile,
  formatFileSize,
  getFilesByOwner,
  isImageFile,
} from "../services/fileService";
import {
  getQuotes,
  addQuote,
  updateQuote as updateStoredQuote,
  addJob,
  getActivePeriod,
  setActivePeriod as saveActivePeriod,
  getCustomers,
  addCustomer,
} from "../utils/storage";

const materials = {
  Çelik: 7.85,
  Alüminyum: 2.7,
  Bakır: 8.96,
  Bronz: 8.8,
  Paslanmaz: 7.9,
  Pirinç: 8.5,
  Plastik: 1.2,
  Döküm: 7.2,
  Diğer: 7.85,
};

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
  machine: "",
  hours: 1,
  hourlyRate: 1500,
};

const emptyQuote = {
  customer: "",
  customerId: "",
  customerAuthorized: "",
  customerPhone: "",
  customerEmail: "",
  customerAddress: "",
  customerTaxNo: "",
  customerTaxOffice: "",
  title: "",
  quoteType: "İşçilik",
  material: "Çelik",
  materialType: "Plaka / Blok",
  materialOwner: "Bizden",
  width: "",
  length: "",
  height: "",
  diameter: "",
  density: materials["Çelik"],
  kgPrice: "",
  extraCost: "",
  profitRate: 25,
  note: "",
  deliveryTime: "",
  paymentTerm: "",
};

const emptyCustomer = {
  name: "",
  authorized: "",
  phone: "",
  email: "",
  taxNo: "",
  taxOffice: "",
  address: "",
  sector: "",
  note: "",
};

function toNumber(value) {
  const n = Number(String(value || 0).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function currency(value) {
  return `${Number(value || 0).toLocaleString("tr-TR", {
    maximumFractionDigits: 1,
  })} ₺`;
}

function safe(value) {
  return value || "—";
}

function createQuoteNo(count) {
  return `Q-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;
}

function createJobNo() {
  return `JOB-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
}

function calcWeight(quote) {
  const density = toNumber(quote.density);

  if (quote.materialType === "Çap / Mil") {
    const d = toNumber(quote.diameter);
    const l = toNumber(quote.length);
    return (Math.PI * Math.pow(d / 2, 2) * l * density) / 1_000_000;
  }

  return (
    (toNumber(quote.width) * toNumber(quote.length) * toNumber(quote.height) * density) /
    1_000_000
  );
}

function statusBadge(status) {
  if (status === "İşe Çevrildi") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "Gönderildi") return "bg-blue-50 text-blue-700 border-blue-200";
  if (status === "Reddedildi") return "bg-red-50 text-red-700 border-red-200";
  return "bg-slate-50 text-slate-600 border-slate-200";
}

export default function Quotes() {
  const periods = getRecentPeriods(12);

  const [activePeriod, setActivePeriod] = useState(() =>
    getActivePeriod(getCurrentPeriod())
  );
  const [quote, setQuote] = useState(emptyQuote);
  const [operations, setOperations] = useState([{ ...emptyOperation }]);
  const [savedQuotes, setSavedQuotes] = useState(() => getQuotes());
  const [customers, setCustomers] = useState(() => getCustomers());
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerPanel, setShowCustomerPanel] = useState(false);
  const [newCustomer, setNewCustomer] = useState(emptyCustomer);
  const [draftFileOwnerId, setDraftFileOwnerId] = useState(() => crypto.randomUUID());
  const [uploadedFiles, setUploadedFiles] = useState(() => []);
  const fileInputRef = useRef(null);

  const hasMaterial = quote.quoteType === "İşçilik + Malzeme";
  const materialWeight = useMemo(() => calcWeight(quote), [quote]);

  const periodQuotes = useMemo(() => {
    return savedQuotes.filter((q) => q.periodKey === activePeriod.periodKey);
  }, [savedQuotes, activePeriod]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      [c.name, c.authorized, c.phone, c.email, c.sector]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [customers, customerSearch]);

  const totals = useMemo(() => {
    const operationTotal = operations.reduce(
      (sum, op) => sum + toNumber(op.hours) * toNumber(op.hourlyRate),
      0
    );

    const materialTotal =
      hasMaterial && quote.materialOwner === "Bizden"
        ? materialWeight * toNumber(quote.kgPrice)
        : 0;

    const extraCost = toNumber(quote.extraCost);
    const costTotal = operationTotal + materialTotal + extraCost;
    const profit = costTotal * (toNumber(quote.profitRate) / 100);
    const grandTotal = costTotal + profit;
    const vat = grandTotal * 0.2;
    const totalWithVat = grandTotal + vat;

    return {
      operationTotal,
      materialWeight,
      materialTotal,
      extraCost,
      costTotal,
      profit,
      grandTotal,
      vat,
      totalWithVat,
      operationHours: operations.reduce((s, op) => s + toNumber(op.hours), 0),
    };
  }, [operations, quote, hasMaterial, materialWeight]);

  const stats = useMemo(() => {
    const quoteTotal = periodQuotes.reduce(
      (s, q) => s + Number(q.totals?.grandTotal || 0),
      0
    );

    return {
      count: periodQuotes.length,
      total: quoteTotal,
      converted: periodQuotes.filter((q) => q.status === "İşe Çevrildi").length,
    };
  }, [periodQuotes]);

  function changePeriod(periodKey) {
    const selected = periods.find((p) => p.periodKey === periodKey);
    if (!selected) return;
    setActivePeriod(selected);
    saveActivePeriod(selected);
    setSelectedQuote(null);
  }

  function updateForm(field, value) {
    setQuote((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "material") next.density = materials[value] || 7.85;
      return next;
    });
  }

  function selectCustomer(customerId) {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) {
      setQuote((prev) => ({ ...prev, customer: "", customerId: "" }));
      return;
    }

    setQuote((prev) => ({
      ...prev,
      customerId: customer.id,
      customer: customer.name,
      customerAuthorized: customer.authorized || "",
      customerPhone: customer.phone || "",
      customerEmail: customer.email || "",
      customerAddress: customer.address || "",
      customerTaxNo: customer.taxNo || "",
      customerTaxOffice: customer.taxOffice || "",
    }));
  }

  function handleAddCustomer(e) {
    e.preventDefault();
    const updated = addCustomer(newCustomer);
    setCustomers(updated);
    const created = updated[0];
    if (created) selectCustomer(created.id);
    setNewCustomer(emptyCustomer);
    setShowCustomerPanel(false);
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

  function removeOperation(index) {
    if (operations.length === 1) return;
    setOperations(operations.filter((_, i) => i !== index));
  }

  async function handleFileUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const updatedFiles = await addFiles({
      ownerType: "quote",
      ownerId: draftFileOwnerId,
      files,
    });

    setUploadedFiles(
      updatedFiles.filter(
        (file) => file.ownerType === "quote" && file.ownerId === draftFileOwnerId
      )
    );

    event.target.value = "";
  }

  function removeUploadedFile(fileId) {
    const updatedFiles = deleteFile(fileId);

    setUploadedFiles(
      updatedFiles.filter(
        (file) => file.ownerType === "quote" && file.ownerId === draftFileOwnerId
      )
    );
  }

  function getQuoteFiles(item) {
    if (!item?.fileOwnerId) return [];
    return getFilesByOwner(item.fileOwnerType || "quote", item.fileOwnerId);
  }

  function saveQuote() {
    const newQuote = {
      id: createQuoteNo(savedQuotes.length),
      ...quote,
      calculatedWeight: totals.materialWeight,
      operations,
      totals,
      status: "Beklemede",
      fileOwnerType: "quote",
      fileOwnerId: draftFileOwnerId,
      fileCount: uploadedFiles.length,
      createdAt: new Date().toISOString(),
      period: activePeriod.period,
      periodKey: activePeriod.periodKey,
      year: activePeriod.year,
      month: activePeriod.month,
      monthName: activePeriod.monthName,
    };

    const updated = addQuote(newQuote);
    setSavedQuotes(updated);
    setSelectedQuote(newQuote);
    setQuote(emptyQuote);
    setOperations([{ ...emptyOperation }]);
    setUploadedFiles([]);
    setDraftFileOwnerId(crypto.randomUUID());
  }

  function convertToJob(item) {
    if (item.status === "İşe Çevrildi") return;
    const jobNo = createJobNo();

    const newJob = {
      id: jobNo,
      jobNo,
      customer: item.customer || "Müşteri seçilmedi",
      customerId: item.customerId || "",
      title: item.title || "Tekliften Gelen İş",
      material: item.material,
      materialType: item.materialType,
      materialOwner: item.materialOwner,
      quoteNo: item.id,
      quoteType: item.quoteType,
      quoteTotal: item.totals?.grandTotal || 0,
      price: item.totals?.grandTotal || 0,
      operations: item.operations || [],
      status: "waiting",
      createdAt: new Date().toISOString(),
      period: item.period,
      periodKey: item.periodKey,
      year: item.year,
      month: item.month,
      monthName: item.monthName,
    };

    addJob(newJob);

    const updatedQuotes = updateStoredQuote(item.id, {
      status: "İşe Çevrildi",
      convertedJobNo: jobNo,
    });

    setSavedQuotes(updatedQuotes);
    setSelectedQuote({ ...item, status: "İşe Çevrildi", convertedJobNo: jobNo });
  }

  function printQuote(item) {
    printQuoteDocument(item);
  }

  function copyQuoteNo(value) {
    navigator.clipboard?.writeText(value || "");
  }

  function createBlobUrl(file) {
    if (!file?.dataUrl) return null;

    const parts = file.dataUrl.split(",");
    if (parts.length < 2) return null;

    const mime =
      parts[0].match(/data:(.*);base64/)?.[1] ||
      file.type ||
      "application/octet-stream";

    const byteCharacters = atob(parts[1]);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mime });

    return URL.createObjectURL(blob);
  }

  function openUploadedFile(file) {
    if (!file?.dataUrl) return;

    if (isImageFile(file)) {
      const win = window.open(file.dataUrl, "_blank");
      if (!win) alert("Dosya açılamadı. Pop-up izni ver.");
      return;
    }

    const url = createBlobUrl(file);
    if (!url) return;

    const win = window.open(url, "_blank");
    if (!win) alert("Dosya açılamadı. Pop-up izni ver.");

    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  function downloadUploadedFile(file) {
    if (!file?.dataUrl) return;

    const url = createBlobUrl(file) || file.dataUrl;
    const link = document.createElement("a");

    link.href = url;
    link.download = file.name || "forgeerp-dosya";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (url.startsWith("blob:")) {
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
  }

  function findQuoteStorageKey() {
    const knownKeys = ["forgeerp_quotes", "forge_quotes", "quotes"];

    for (const key of knownKeys) {
      if (localStorage.getItem(key)) return key;
    }

    for (const key of Object.keys(localStorage)) {
      try {
        const value = JSON.parse(localStorage.getItem(key));
        if (
          Array.isArray(value) &&
          value.some((item) => String(item?.id || "").startsWith("Q-"))
        ) {
          return key;
        }
      } catch {
        // JSON olmayan localStorage kayıtlarını geç.
      }
    }

    return "forgeerp_quotes";
  }

  function persistQuotes(updatedQuotes) {
    localStorage.setItem(findQuoteStorageKey(), JSON.stringify(updatedQuotes));
    window.dispatchEvent(new Event("forgeerp:quotes-updated"));
  }

  function deleteSavedQuote(item) {
    if (!window.confirm(`${item.id} teklifini silmek istediğine emin misin?`)) return;

    getQuoteFiles(item).forEach((file) => deleteFile(file.id));

    const updatedQuotes = savedQuotes.filter((quoteItem) => quoteItem.id !== item.id);

    setSavedQuotes(updatedQuotes);
    persistQuotes(updatedQuotes);

    if (selectedQuote?.id === item.id) {
      setSelectedQuote(null);
    }
  }

  function removeQuoteFile(fileId, item) {
    deleteFile(fileId);

    const remainingFiles = getFilesByOwner(
      item.fileOwnerType || "quote",
      item.fileOwnerId
    );

    const updatedQuotes = updateStoredQuote(item.id, {
      fileCount: remainingFiles.length,
    });

    setSavedQuotes(updatedQuotes);

    if (selectedQuote?.id === item.id) {
      setSelectedQuote({
        ...item,
        fileCount: remainingFiles.length,
      });
    }
  }


  return (
    <div className="min-h-screen bg-slate-50 p-5 text-slate-900">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950">Teklifler</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Ölçülü malzeme hesabı, CRM bağlantısı, operasyon maliyeti ve teklif arşivi
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <MiniStat icon={<FileText size={18} />} title="Bu Dönem Teklif" value={stats.count} />
          <MiniStat icon={<DollarSign size={18} />} title="Bu Dönem Toplam" value={currency(stats.total)} />
          <MiniStat icon={<Briefcase size={18} />} title="İşe Çevrilen" value={stats.converted} />
          <select
            value={activePeriod.periodKey}
            onChange={(e) => changePeriod(e.target.value)}
            className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black shadow-sm outline-none"
          >
            {periods.map((p) => (
              <option key={p.periodKey} value={p.periodKey}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_330px]">
        <div className="space-y-4">
          <section className="panel">
            <div className="mb-3 flex items-center justify-between">
              <h2>Teklif Bilgileri</h2>
              <button onClick={() => setShowCustomerPanel(true)} className="btn-light text-blue-700">
                <UserPlus size={14} /> Yeni Müşteri
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.2fr_1fr_220px]">
              <Field label="Müşteri">
                <select
                  value={quote.customerId}
                  onChange={(e) => selectCustomer(e.target.value)}
                  className="input"
                >
                  <option value="">Müşteri seç</option>
                  {filteredCustomers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="İş / Parça Adı">
                <input
                  value={quote.title}
                  onChange={(e) => updateForm("title", e.target.value)}
                  className="input"
                  placeholder="Örn: Kalıp plakası"
                />
              </Field>

              <Field label="Teklif No">
                <div className="relative">
                  <input className="input pr-10" readOnly value={createQuoteNo(savedQuotes.length)} />
                  <button
                    type="button"
                    onClick={() => copyQuoteNo(createQuoteNo(savedQuotes.length))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-2 text-blue-600 hover:bg-blue-50"
                  >
                    <Copy size={15} />
                  </button>
                </div>
              </Field>
            </div>

            {quote.customer && (
              <div className="mt-3 grid grid-cols-1 gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-3 md:grid-cols-3">
                <SmallInfo icon={<UserPlus size={14} />} value={safe(quote.customerAuthorized)} />
                <SmallInfo icon={<Phone size={14} />} value={safe(quote.customerPhone)} />
                <SmallInfo icon={<Mail size={14} />} value={safe(quote.customerEmail)} />
              </div>
            )}
          </section>

          <section className="panel">
            <h2>Teklif Türü</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <TypeButton
                active={quote.quoteType === "İşçilik"}
                title="İşçilik"
                desc="Sadece işçilik maliyetini hesapla"
                onClick={() => updateForm("quoteType", "İşçilik")}
              />
              <TypeButton
                active={quote.quoteType === "İşçilik + Malzeme"}
                title="İşçilik + Malzeme"
                desc="İşçilik ve malzeme maliyetini birlikte hesapla"
                onClick={() => updateForm("quoteType", "İşçilik + Malzeme")}
              />
            </div>
          </section>

          {hasMaterial && (
            <section className="panel">
              <div className="mb-3 flex items-center justify-between">
                <h2>Malzeme Ölçü Hesabı</h2>
                <div className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-black text-white">
                  {totals.materialWeight.toFixed(2)} kg
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <Select label="Malzeme" value={quote.material} onChange={(v) => updateForm("material", v)} options={Object.keys(materials)} />
                <Select label="Tip" value={quote.materialType} onChange={(v) => updateForm("materialType", v)} options={["Plaka / Blok", "Çap / Mil", "Hazır Parça", "Diğer"]} />
                <Select label="Sahibi" value={quote.materialOwner} onChange={(v) => updateForm("materialOwner", v)} options={["Bizden", "Müşteri"]} />
                <Input label="Yoğunluk" type="number" value={quote.density} onChange={(v) => updateForm("density", v)} />
              </div>

              {quote.materialType === "Çap / Mil" ? (
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <Input label="Çap Ø mm" type="number" value={quote.diameter} onChange={(v) => updateForm("diameter", v)} />
                  <Input label="Boy mm" type="number" value={quote.length} onChange={(v) => updateForm("length", v)} />
                  <Input label="Kg Fiyatı" type="number" value={quote.kgPrice} onChange={(v) => updateForm("kgPrice", v)} />
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
                  <Input label="En mm" type="number" value={quote.width} onChange={(v) => updateForm("width", v)} />
                  <Input label="Boy mm" type="number" value={quote.length} onChange={(v) => updateForm("length", v)} />
                  <Input label="Kalınlık mm" type="number" value={quote.height} onChange={(v) => updateForm("height", v)} />
                  <Input label="Kg Fiyatı" type="number" value={quote.kgPrice} onChange={(v) => updateForm("kgPrice", v)} />
                </div>
              )}
            </section>
          )}

          <section className="panel">
            <div className="mb-3 flex items-center justify-between">
              <h2>Operasyonlar</h2>
              <button onClick={() => setOperations([...operations, { ...emptyOperation }])} className="btn-dark">
                + Operasyon Ekle
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="grid grid-cols-[1.2fr_1fr_0.8fr_1fr_0.7fr_44px] bg-slate-50 px-3 py-2 text-[11px] font-black uppercase text-slate-400">
                <span>Operasyon</span>
                <span>Makine</span>
                <span>Saat</span>
                <span>Saatlik Ücret</span>
                <span>Tutar</span>
                <span></span>
              </div>

              {operations.map((op, index) => (
                <div key={index} className="grid grid-cols-[1.2fr_1fr_0.8fr_1fr_0.7fr_44px] items-center gap-2 border-t border-slate-100 p-3">
                  <select value={op.name} onChange={(e) => updateOperation(index, "name", e.target.value)} className="input">
                    {Object.keys(operationDefaults).map((name) => <option key={name}>{name}</option>)}
                  </select>
                  <input value={op.machine} onChange={(e) => updateOperation(index, "machine", e.target.value)} className="input" placeholder="Makine" />
                  <input type="number" value={op.hours} onChange={(e) => updateOperation(index, "hours", e.target.value)} className="input" />
                  <input type="number" value={op.hourlyRate} onChange={(e) => updateOperation(index, "hourlyRate", e.target.value)} className="input" />
                  <b className="text-right text-sm">{currency(toNumber(op.hours) * toNumber(op.hourlyRate))}</b>
                  <button onClick={() => removeOperation(index)} className="rounded-xl border border-red-100 bg-red-50 p-2 text-red-600 hover:bg-red-100">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}

              <div className="grid grid-cols-2 border-t border-slate-100 bg-slate-50 px-4 py-3 text-sm font-black">
                <span>Toplam Operasyon Saati: {totals.operationHours} Saat</span>
                <span className="text-right">Toplam İşçilik Tutarı: {currency(totals.operationTotal)}</span>
              </div>
            </div>
          </section>

          <section className="panel">
            <h2>Ek Bilgiler</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Input label="Ek Maliyet" type="number" value={quote.extraCost} onChange={(v) => updateForm("extraCost", v)} />
              <Input label="Kâr Oranı %" type="number" value={quote.profitRate} onChange={(v) => updateForm("profitRate", v)} />
            </div>
          </section>

          <section className="panel">
            <div className="mb-3 flex items-center justify-between">
              <h2>Kayıtlı Teklifler</h2>
              <div className="relative w-80 max-w-full">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="input pl-9"
                  placeholder="Müşteri ara..."
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-left text-[11px] uppercase text-slate-500">
                    <th className="p-3">No</th>
                    <th className="p-3">Müşteri</th>
                    <th className="p-3">İş / Parça Adı</th>
                    <th className="p-3">Tür</th>
                    <th className="p-3">Toplam</th>
                    <th className="p-3">Tarih</th>
                    <th className="p-3">Durum</th>
                    <th className="p-3">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {periodQuotes.length === 0 ? (
                    <tr><td colSpan="8" className="p-10 text-center text-slate-400">Bu dönemde kayıtlı teklif yok.</td></tr>
                  ) : periodQuotes.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-slate-50">
                      <td className="p-3 font-black">{item.id}</td>
                      <td className="p-3">{safe(item.customer)}</td>
                      <td className="p-3">{safe(item.title)}</td>
                      <td className="p-3">{safe(item.quoteType)}</td>
                      <td className="p-3 font-black">{currency(item.totals?.grandTotal)}</td>
                      <td className="p-3">{item.createdAt ? new Date(item.createdAt).toLocaleDateString("tr-TR") : "—"}</td>
                      <td className="p-3"><span className={`rounded-full border px-2 py-1 text-xs font-black ${statusBadge(item.status)}`}>{safe(item.status)}</span></td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button onClick={() => setSelectedQuote(item)} className="icon-btn"><Eye size={15} /></button>
                          <button onClick={() => printQuote(item)} className="icon-btn"><FileText size={15} /></button>
                          <button onClick={() => convertToJob(item)} disabled={item.status === "İşe Çevrildi"} className="btn-dark disabled:bg-slate-300">İşe Çevir</button>
                          <button onClick={() => deleteSavedQuote(item)} className="icon-btn-danger"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="panel sticky top-5">
            <h2>Teklif Özeti</h2>
            <Summary label="İşçilik" value={currency(totals.operationTotal)} />
            <Summary label="Malzeme Kg" value={`${totals.materialWeight.toFixed(2)} kg`} />
            <Summary label="Malzeme" value={currency(totals.materialTotal)} />
            <Summary label="Ek Maliyet" value={currency(totals.extraCost)} />
            <Summary label="Kâr" value={currency(totals.profit)} />

            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-black text-blue-600">Toplam Teklif Tutarı</p>
              <h3 className="mt-1 text-3xl font-black text-blue-700">{currency(totals.grandTotal)}</h3>
            </div>

            <Summary label="KDV (%20)" value={currency(totals.vat)} />
            <div className="mt-2 flex justify-between rounded-2xl bg-emerald-50 p-3 text-sm font-black text-emerald-700">
              <span>Genel Toplam</span>
              <span>{currency(totals.totalWithVat)}</span>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp,.pdf,.step,.stp,.stl,.dwg,.dxf,.zip"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-28 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-slate-500 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
              >
                <Upload size={30} />
                <span className="mt-2 text-sm font-black">Parça Görseli / Dosya Yükle</span>
                <span className="mt-1 text-xs font-semibold text-slate-400">
                  JPG, PNG, PDF, STEP, STL, DWG, DXF, ZIP
                </span>
              </button>

              {uploadedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {uploadedFiles.map((file) => (
                    <FilePreview
                      key={file.id}
                      file={file}
                      onOpen={() => openUploadedFile(file)}
                      onDownload={() => downloadUploadedFile(file)}
                      onDelete={() => removeUploadedFile(file.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            <button onClick={saveQuote} className="mt-4 h-11 w-full rounded-2xl bg-emerald-600 text-sm font-black text-white hover:bg-emerald-700">
              Teklifi Kaydet
            </button>
            <button
              onClick={() =>
                printQuote({
                  ...quote,
                  id: createQuoteNo(savedQuotes.length),
                  operations,
                  totals,
                  fileOwnerType: "quote",
                  fileOwnerId: draftFileOwnerId,
                  fileCount: uploadedFiles.length,
                  createdAt: new Date().toISOString(),
                  monthName: activePeriod.monthName,
                  year: activePeriod.year,
                })
              }
              className="mt-3 h-11 w-full rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              PDF Oluştur
            </button>
          </section>
        </aside>
      </div>

      {selectedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-black text-slate-400">TEKLİF DETAYI</p>
                <h2 className="mt-1 text-2xl font-black">{selectedQuote.id}</h2>
                <p className="text-sm text-slate-500">{safe(selectedQuote.customer)} / {safe(selectedQuote.title)}</p>
              </div>
              <button onClick={() => setSelectedQuote(null)} className="rounded-2xl bg-slate-100 p-2 hover:bg-slate-200">×</button>
            </div>
            <div className="grid grid-cols-3 gap-3 py-4">
              <Detail label="Toplam" value={currency(selectedQuote.totals?.grandTotal)} />
              <Detail label="Ağırlık" value={`${Number(selectedQuote.calculatedWeight || 0).toFixed(2)} kg`} />
              <Detail label="Dosya" value={`${getQuoteFiles(selectedQuote).length} adet`} />
            </div>

            {getQuoteFiles(selectedQuote).length > 0 && (
              <div className="mb-4 space-y-2 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                {getQuoteFiles(selectedQuote).map((file) => (
                  <FilePreview
                    key={file.id}
                    file={file}
                    onOpen={() => openUploadedFile(file)}
                    onDownload={() => downloadUploadedFile(file)}
                    onDelete={() => removeQuoteFile(file.id, selectedQuote)}
                  />
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button onClick={() => printQuote(selectedQuote)} className="btn-light">PDF / Yazdır</button>
              <button onClick={() => convertToJob(selectedQuote)} disabled={selectedQuote.status === "İşe Çevrildi"} className="btn-dark disabled:bg-slate-300">İşe Çevir</button>
              <button onClick={() => deleteSavedQuote(selectedQuote)} className="btn-danger">Teklifi Sil</button>
            </div>
          </div>
        </div>
      )}

      {showCustomerPanel && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm">
          <form onSubmit={handleAddCustomer} className="h-full w-full max-w-md bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-slate-400">CRM</p>
                <h2 className="text-2xl font-black">Yeni Müşteri</h2>
              </div>
              <button type="button" onClick={() => setShowCustomerPanel(false)} className="rounded-2xl bg-slate-100 p-2"><Trash2 size={16} /></button>
            </div>
            <div className="space-y-3">
              <Input required label="Firma Adı" value={newCustomer.name} onChange={(v) => setNewCustomer({ ...newCustomer, name: v })} />
              <Input label="Yetkili" value={newCustomer.authorized} onChange={(v) => setNewCustomer({ ...newCustomer, authorized: v })} />
              <Input label="Telefon" value={newCustomer.phone} onChange={(v) => setNewCustomer({ ...newCustomer, phone: v })} />
              <Input label="E-posta" value={newCustomer.email} onChange={(v) => setNewCustomer({ ...newCustomer, email: v })} />
              <Input label="Vergi No" value={newCustomer.taxNo} onChange={(v) => setNewCustomer({ ...newCustomer, taxNo: v })} />
              <Input label="Vergi Dairesi" value={newCustomer.taxOffice} onChange={(v) => setNewCustomer({ ...newCustomer, taxOffice: v })} />
              <button className="h-11 w-full rounded-2xl bg-slate-900 font-black text-white">Kaydet</button>
            </div>
          </form>
        </div>
      )}

      <style>{`
        .panel { border: 1px solid #e2e8f0; background: white; border-radius: 22px; padding: 18px; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04); }
        .panel h2 { font-size: 16px; font-weight: 900; margin-bottom: 10px; color: #0f172a; }
        .input { width: 100%; height: 42px; border: 1px solid #e2e8f0; border-radius: 14px; padding: 0 12px; font-size: 13px; font-weight: 700; outline: none; background: white; }
        .input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.10); }
        .btn-dark { display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: 12px; background: #0f172a; color: white; padding: 8px 12px; font-size: 12px; font-weight: 900; }
        .btn-light { display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: 12px; background: white; border: 1px solid #e2e8f0; color: #334155; padding: 8px 12px; font-size: 12px; font-weight: 900; }
        .icon-btn { display: inline-flex; height: 34px; width: 34px; align-items: center; justify-content: center; border-radius: 12px; border: 1px solid #e2e8f0; color: #2563eb; background: white; }
        .icon-btn:hover { background: #eff6ff; }
        .icon-btn-danger { display: inline-flex; height: 34px; width: 34px; align-items: center; justify-content: center; border-radius: 12px; border: 1px solid #fee2e2; color: #dc2626; background: #fff; }
        .icon-btn-danger:hover { background: #fef2f2; }
        .btn-danger { display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: 12px; background: #fef2f2; border: 1px solid #fee2e2; color: #dc2626; padding: 8px 12px; font-size: 12px; font-weight: 900; }
        .btn-danger:hover { background: #fee2e2; }
      `}</style>
    </div>
  );
}

function FilePreview({ file, onOpen, onDownload, onDelete }) {
  const image = isImageFile(file);

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2">
      <button
        type="button"
        onClick={onOpen}
        className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 hover:ring-2 hover:ring-blue-100"
        title="Dosyayı aç"
      >
        {image ? (
          <img
            src={file.dataUrl}
            alt={file.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <FileText size={20} className="text-slate-400" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-black text-slate-800">{file.name}</p>
        <p className="text-[11px] font-semibold uppercase text-slate-400">
          {file.extension || "file"} • {formatFileSize(file.size || 0)}
        </p>
      </div>

      {onOpen && (
        <button
          type="button"
          onClick={onOpen}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-blue-600 hover:bg-blue-50"
        >
          Aç
        </button>
      )}

      {onDownload && (
        <button
          type="button"
          onClick={onDownload}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50"
        >
          <span className="inline-flex items-center gap-1">
            <Download size={13} /> İndir
          </span>
        </button>
      )}

      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="rounded-xl p-2 text-red-500 hover:bg-red-50"
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
}

function MiniStat({ icon, title, value }) {
  return (
    <div className="flex min-w-[190px] items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">{icon}</div>
      <div>
        <p className="text-xs font-bold text-slate-500">{title}</p>
        <p className="text-xl font-black text-slate-950">{value}</p>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label>
      <p className="mb-1 text-xs font-bold text-slate-500">{label}</p>
      {children}
    </label>
  );
}

function Input({ label, value, onChange, type = "text", required = false }) {
  return (
    <Field label={label}>
      <input required={required} type={type} value={value} onChange={(e) => onChange(e.target.value)} className="input" />
    </Field>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <Field label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input">
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </Field>
  );
}

function SmallInfo({ icon, value }) {
  return <div className="flex items-center gap-2 text-xs font-black text-slate-600">{icon}{value}</div>;
}

function TypeButton({ active, title, desc, onClick }) {
  return (
    <button onClick={onClick} className={`rounded-2xl border p-4 text-left transition ${active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
      <p className="font-black">{title}</p>
      <p className={`mt-1 text-xs font-semibold ${active ? "text-slate-300" : "text-slate-500"}`}>{desc}</p>
    </button>
  );
}

function Summary({ label, value }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-2.5 text-sm">
      <span className="font-semibold text-slate-500">{label}</span>
      <b>{value}</b>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-1 font-black text-slate-900">{value}</p>
    </div>
  );
}

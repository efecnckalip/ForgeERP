import { useEffect, useMemo, useState } from "react";
import {
  Star,
  Search,
  Filter,
  Edit2,
  Trash2,
  Save,
  X,
  Plus,
  User,
  Phone,
  Mail,
  Building2,
  FileText,
  Briefcase,
  Wallet,
  TrendingUp,
  CalendarDays,
  Eye,
  MapPin,
  Landmark,
  Clock,
} from "lucide-react";
import {
  getCustomers,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  getQuotes,
  getJobs,
} from "../utils/storage";

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
  status: "active",
  isFavorite: false,
};

const filterLabels = {
  all: "Tümü",
  favorite: "Favoriler",
  active: "Aktif",
  passive: "Pasif",
  quoted: "Teklifli",
  worked: "İşli",
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

function sameName(a, b) {
  return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
}

function getQuoteAmount(q) {
  return Number(q?.totals?.grandTotal || q?.quoteTotal || q?.price || 0);
}

function getJobAmount(j) {
  return Number(j?.quoteTotal || j?.totalPrice || j?.price || j?.amount || 0);
}

function formatDate(value) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleDateString("tr-TR");
  } catch {
    return "—";
  }
}

function getCustomerMetrics(customer, quotes, jobs) {
  const customerQuotes = quotes.filter((q) => sameName(q.customer, customer.name));
  const customerJobs = jobs.filter((j) => sameName(j.customer, customer.name));

  const quoteTotal = customerQuotes.reduce((sum, q) => sum + getQuoteAmount(q), 0);
  const jobTotal = customerJobs.reduce((sum, j) => sum + getJobAmount(j), 0);
  const converted = customerQuotes.filter((q) => q.status === "İşe Çevrildi").length;

  const successRate = customerQuotes.length
    ? Math.round((converted / customerQuotes.length) * 100)
    : 0;

  const lastQuote = [...customerQuotes].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  )[0];

  const lastJob = [...customerJobs].sort(
    (a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0)
  )[0];

  const lastActivityDate = lastQuote?.createdAt || lastJob?.createdAt || customer.createdAt;

  return {
    quotes: customerQuotes,
    jobs: customerJobs,
    quoteCount: customerQuotes.length,
    jobCount: customerJobs.length,
    quoteTotal,
    jobTotal,
    successRate,
    lastQuote,
    lastJob,
    lastActivityDate,
  };
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("quotes");
  const [showDrawer, setShowDrawer] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState(null);
  const [form, setForm] = useState(emptyCustomer);

  function loadData() {
    const loadedCustomers = getCustomers().map((customer) => ({
      ...emptyCustomer,
      ...customer,
      status: customer.status || "active",
      isFavorite: Boolean(customer.isFavorite),
    }));

    setCustomers(loadedCustomers);
    setQuotes(getQuotes());
    setJobs(getJobs());

    if (!selectedId && loadedCustomers[0]) {
      setSelectedId(loadedCustomers[0].id);
    }
  }

  useEffect(() => {
    loadData();

    const reload = () => loadData();

    window.addEventListener("forgeerp:customers-updated", reload);
    window.addEventListener("forgeerp:quotes-updated", reload);
    window.addEventListener("forgeerp:jobs-updated", reload);

    return () => {
      window.removeEventListener("forgeerp:customers-updated", reload);
      window.removeEventListener("forgeerp:quotes-updated", reload);
      window.removeEventListener("forgeerp:jobs-updated", reload);
    };
  }, []);

  const enrichedCustomers = useMemo(() => {
    return customers.map((customer) => ({
      ...customer,
      metrics: getCustomerMetrics(customer, quotes, jobs),
    }));
  }, [customers, quotes, jobs]);

  const globalStats = useMemo(() => {
    return {
      total: enrichedCustomers.length,
      favorite: enrichedCustomers.filter((c) => c.isFavorite).length,
      quoted: enrichedCustomers.filter((c) => c.metrics.quoteCount > 0).length,
      worked: enrichedCustomers.filter((c) => c.metrics.jobCount > 0).length,
    };
  }, [enrichedCustomers]);

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();

    return enrichedCustomers
      .filter((customer) => {
        if (activeFilter === "favorite" && !customer.isFavorite) return false;
        if (activeFilter === "active" && customer.status !== "active") return false;
        if (activeFilter === "passive" && customer.status !== "passive") return false;
        if (activeFilter === "quoted" && customer.metrics.quoteCount === 0) return false;
        if (activeFilter === "worked" && customer.metrics.jobCount === 0) return false;

        if (!q) return true;

        return (
          String(customer.name || "").toLowerCase().includes(q) ||
          String(customer.authorized || "").toLowerCase().includes(q) ||
          String(customer.phone || "").toLowerCase().includes(q) ||
          String(customer.email || "").toLowerCase().includes(q) ||
          String(customer.sector || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
        return String(a.name || "").localeCompare(String(b.name || ""), "tr");
      });
  }, [enrichedCustomers, search, activeFilter]);

  const selectedCustomer =
    enrichedCustomers.find((c) => c.id === selectedId) ||
    filteredCustomers[0] ||
    enrichedCustomers[0];

  const selectedMetrics = selectedCustomer?.metrics || {
    quotes: [],
    jobs: [],
    quoteCount: 0,
    jobCount: 0,
    quoteTotal: 0,
    jobTotal: 0,
    successRate: 0,
  };

  useEffect(() => {
    if (selectedCustomer && !selectedId) {
      setSelectedId(selectedCustomer.id);
    }
  }, [selectedCustomer, selectedId]);

  function openNewCustomer() {
    setForm(emptyCustomer);
    setShowDrawer(true);
  }

  function handleAddCustomer(e) {
    e.preventDefault();

    const updated = addCustomer(form);
    const normalized = updated.map((customer) => ({
      ...emptyCustomer,
      ...customer,
      status: customer.status || "active",
      isFavorite: Boolean(customer.isFavorite),
    }));

    setCustomers(normalized);
    setSelectedId(normalized[0]?.id || null);
    setForm(emptyCustomer);
    setShowDrawer(false);
  }

  function startEdit() {
    if (!selectedCustomer) return;
    setDraft({ ...selectedCustomer });
    setEditMode(true);
  }

  function cancelEdit() {
    setDraft(null);
    setEditMode(false);
  }

  function saveEdit() {
    if (!draft) return;

    const updated = updateCustomer(draft.id, draft);
    setCustomers(updated);
    setSelectedId(draft.id);
    setEditMode(false);
    setDraft(null);
  }

  function updateDraft(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  function toggleFavorite(customer = selectedCustomer) {
    if (!customer) return;

    const updated = updateCustomer(customer.id, {
      isFavorite: !customer.isFavorite,
    });

    setCustomers(updated);
  }

  function handleDelete() {
    if (!selectedCustomer) return;
    if (!window.confirm("Bu müşteriyi silmek istediğine emin misin?")) return;

    const updated = deleteCustomer(selectedCustomer.id);
    setCustomers(updated);
    setSelectedId(updated[0]?.id || null);
    setEditMode(false);
  }

  const detailCustomer = editMode && draft ? draft : selectedCustomer;

  return (
    <div className="min-h-screen bg-slate-50 p-5 text-slate-900">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-950">Müşteriler</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            CRM kartları, hızlı arama, teklif geçmişi, iş geçmişi ve müşteri performansı
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <TopStat
            title="Toplam Müşteri"
            value={globalStats.total}
            active={activeFilter === "all"}
            onClick={() => setActiveFilter("all")}
          />
          <TopStat
            title="Favori Müşteri"
            value={globalStats.favorite}
            active={activeFilter === "favorite"}
            onClick={() => setActiveFilter("favorite")}
            tone="amber"
          />
          <TopStat
            title="Teklifli"
            value={globalStats.quoted}
            active={activeFilter === "quoted"}
            onClick={() => setActiveFilter("quoted")}
            tone="blue"
          />
          <TopStat
            title="İşli"
            value={globalStats.worked}
            active={activeFilter === "worked"}
            onClick={() => setActiveFilter("worked")}
            tone="emerald"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[1.05fr_1.15fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-bold outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                placeholder="Müşteri ara..."
              />
            </div>

            <button className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 hover:bg-slate-50">
              <Filter size={17} />
              Filtrele
            </button>

            <button
              onClick={openNewCustomer}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-sm font-black text-white hover:bg-slate-800"
            >
              <Plus size={17} />
              Yeni Müşteri
            </button>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {Object.entries(filterLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`rounded-xl border px-4 py-2 text-xs font-black transition ${
                  activeFilter === key
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-100">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="w-10 px-3 py-3"></th>
                  <th className="px-3 py-3">Firma Adı</th>
                  <th className="px-3 py-3">Yetkili</th>
                  <th className="px-3 py-3">Telefon</th>
                  <th className="px-3 py-3 text-center">Teklif</th>
                  <th className="px-3 py-3 text-center">İş</th>
                  <th className="px-3 py-3 text-right">Ciro</th>
                  <th className="px-3 py-3 text-right">Son İşlem</th>
                  <th className="w-8 px-3 py-3"></th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-12 text-center text-sm font-bold text-slate-400">
                      Aramaya uygun müşteri bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => {
                    const active = selectedCustomer?.id === customer.id;

                    return (
                      <tr
                        key={customer.id}
                        onClick={() => {
                          setSelectedId(customer.id);
                          setEditMode(false);
                        }}
                        className={`cursor-pointer border-b border-slate-100 transition ${
                          active ? "bg-blue-50/70" : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="px-3 py-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(customer);
                            }}
                            className={`transition ${
                              customer.isFavorite ? "text-amber-400" : "text-slate-300 hover:text-amber-400"
                            }`}
                          >
                            <Star size={17} fill={customer.isFavorite ? "currentColor" : "none"} />
                          </button>
                        </td>
                        <td className="px-3 py-3 font-black text-slate-900">{safe(customer.name)}</td>
                        <td className="px-3 py-3 font-semibold text-slate-700">{safe(customer.authorized)}</td>
                        <td className="px-3 py-3 font-semibold text-slate-600">{safe(customer.phone)}</td>
                        <td className="px-3 py-3 text-center font-black text-blue-600">{customer.metrics.quoteCount}</td>
                        <td className="px-3 py-3 text-center font-black text-emerald-600">{customer.metrics.jobCount}</td>
                        <td className="px-3 py-3 text-right font-black text-slate-900">{money(customer.metrics.jobTotal)}</td>
                        <td className="px-3 py-3 text-right font-semibold text-slate-500">
                          {formatDate(customer.metrics.lastActivityDate)}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-400">
                          <Eye size={16} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm font-bold text-slate-500">
            <span>Toplam {filteredCustomers.length} kayıt</span>
            <span>{filterLabels[activeFilter]}</span>
          </div>
        </section>

        <section className="space-y-4">
          {!detailCustomer ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-400 shadow-sm">
              Detay için müşteri seç.
            </div>
          ) : (
            <>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <button
                        onClick={() => toggleFavorite()}
                        className={`transition ${
                          selectedCustomer?.isFavorite ? "text-amber-400" : "text-slate-300 hover:text-amber-400"
                        }`}
                      >
                        <Star size={20} fill={selectedCustomer?.isFavorite ? "currentColor" : "none"} />
                      </button>
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                        Müşteri Kartı
                      </p>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          detailCustomer.status === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {detailCustomer.status === "active" ? "Aktif" : "Pasif"}
                      </span>
                    </div>

                    <h2 className="text-2xl font-black text-slate-950">{safe(detailCustomer.name)}</h2>
                    <p className="mt-2 text-sm font-semibold text-slate-400">—</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!editMode ? (
                      <button
                        onClick={startEdit}
                        className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
                      >
                        <Edit2 size={16} />
                        Düzenle
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={saveEdit}
                          className="inline-flex h-10 items-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-black text-white hover:bg-emerald-700"
                        >
                          <Save size={16} />
                          Kaydet
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
                        >
                          <X size={16} />
                          İptal
                        </button>
                      </>
                    )}

                    <button
                      onClick={handleDelete}
                      className="inline-flex h-10 items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 text-sm font-black text-red-600 hover:bg-red-100"
                    >
                      <Trash2 size={16} />
                      Sil
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
                  <DetailField icon={<User size={18} />} label="Yetkili" value={detailCustomer.authorized} editable={editMode} onChange={(v) => updateDraft("authorized", v)} />
                  <DetailField icon={<Building2 size={18} />} label="Sektör" value={detailCustomer.sector} editable={editMode} onChange={(v) => updateDraft("sector", v)} />
                  <DetailField icon={<Phone size={18} />} label="Telefon" value={detailCustomer.phone} editable={editMode} onChange={(v) => updateDraft("phone", v)} />
                  <DetailField icon={<Landmark size={18} />} label="Vergi Dairesi" value={detailCustomer.taxOffice} editable={editMode} onChange={(v) => updateDraft("taxOffice", v)} />
                  <DetailField icon={<Mail size={18} />} label="E-posta" value={detailCustomer.email} editable={editMode} onChange={(v) => updateDraft("email", v)} />
                  <DetailField icon={<FileText size={18} />} label="Vergi No" value={detailCustomer.taxNo} editable={editMode} onChange={(v) => updateDraft("taxNo", v)} />
                  <DetailField icon={<MapPin size={18} />} label="Adres" value={detailCustomer.address} editable={editMode} onChange={(v) => updateDraft("address", v)} wide />
                  <DetailField icon={<FileText size={18} />} label="Not" value={detailCustomer.note} editable={editMode} onChange={(v) => updateDraft("note", v)} wide />
                </div>

                {editMode && (
                  <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <label>
                      <p className="mb-1 text-xs font-bold text-slate-500">Firma Adı</p>
                      <input
                        value={draft?.name || ""}
                        onChange={(e) => updateDraft("name", e.target.value)}
                        className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-400"
                      />
                    </label>

                    <label>
                      <p className="mb-1 text-xs font-bold text-slate-500">Durum</p>
                      <select
                        value={draft?.status || "active"}
                        onChange={(e) => updateDraft("status", e.target.value)}
                        className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-400"
                      >
                        <option value="active">Aktif</option>
                        <option value="passive">Pasif</option>
                      </select>
                    </label>
                  </div>
                )}

                <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-6">
                  <MetricCard icon={<FileText size={20} />} label="Toplam Teklif" value={selectedMetrics.quoteCount} />
                  <MetricCard icon={<Briefcase size={20} />} label="Toplam İş" value={selectedMetrics.jobCount} tone="green" />
                  <MetricCard icon={<Wallet size={20} />} label="Toplam Ciro" value={money(selectedMetrics.jobTotal)} tone="purple" />
                  <MetricCard icon={<TrendingUp size={20} />} label="Başarı Oranı" value={`%${selectedMetrics.successRate}`} tone="amber" />
                  <MetricCard icon={<ClockIcon />} label="Son Teklif" value={formatDate(selectedMetrics.lastQuote?.createdAt)} />
                  <MetricCard icon={<CalendarDays size={20} />} label="Son İş" value={formatDate(selectedMetrics.lastJob?.createdAt)} tone="green" />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex flex-wrap gap-5 border-b border-slate-100">
                  <TabButton active={activeTab === "quotes"} onClick={() => setActiveTab("quotes")}>Teklif Geçmişi</TabButton>
                  <TabButton active={activeTab === "jobs"} onClick={() => setActiveTab("jobs")}>İş Geçmişi</TabButton>
                  <TabButton active={activeTab === "notes"} onClick={() => setActiveTab("notes")}>Notlar</TabButton>
                  <TabButton active={activeTab === "files"} onClick={() => setActiveTab("files")}>Dosyalar</TabButton>
                  <TabButton active={activeTab === "activities"} onClick={() => setActiveTab("activities")}>Aktiviteler</TabButton>
                </div>

                {activeTab === "quotes" && (
                  <HistoryTable
                    emptyTitle="Henüz teklif bulunamadı."
                    emptyDesc="Bu müşteriye ait teklif oluşturduğunda burada görünecek."
                    rows={selectedMetrics.quotes.map((q) => ({
                      code: q.id,
                      date: formatDate(q.createdAt),
                      title: q.title,
                      amount: money(getQuoteAmount(q)),
                      status: q.status,
                    }))}
                  />
                )}

                {activeTab === "jobs" && (
                  <HistoryTable
                    emptyTitle="Henüz iş bulunamadı."
                    emptyDesc="Bu müşteriye ait işler burada listelenecek."
                    rows={selectedMetrics.jobs.map((j) => ({
                      code: j.jobNo || j.id,
                      date: formatDate(j.createdAt),
                      title: j.title || j.jobName,
                      amount: money(getJobAmount(j)),
                      status: j.status,
                    }))}
                  />
                )}

                {activeTab === "notes" && (
                  <EmptyBox title="Notlar" desc={safe(selectedCustomer.note)} />
                )}

                {activeTab === "files" && (
                  <EmptyBox title="Dosya bulunamadı." desc="Müşteriye ait dosyalar ileride burada listelenecek." />
                )}

                {activeTab === "activities" && (
                  <EmptyBox title="Aktivite bulunamadı." desc="Müşteriye ait aktiviteler burada listelenecek." />
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {showDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm">
          <form
            onSubmit={handleAddCustomer}
            className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl"
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-950">Yeni Müşteri</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  CRM kartı oluştur, teklif ve iş geçmişi bu karta bağlansın.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowDrawer(false)}
                className="rounded-2xl bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <DrawerInput required label="Firma Adı" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <DrawerInput label="Yetkili" value={form.authorized} onChange={(v) => setForm({ ...form, authorized: v })} />
              <DrawerInput label="Telefon" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              <DrawerInput label="E-posta" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
              <DrawerInput label="Sektör" value={form.sector} onChange={(v) => setForm({ ...form, sector: v })} />
              <DrawerInput label="Vergi No" value={form.taxNo} onChange={(v) => setForm({ ...form, taxNo: v })} />
              <DrawerInput label="Vergi Dairesi" value={form.taxOffice} onChange={(v) => setForm({ ...form, taxOffice: v })} />

              <label>
                <p className="mb-1 text-xs font-bold text-slate-500">Adres</p>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="min-h-[86px] w-full rounded-2xl border border-slate-200 p-4 text-sm font-bold outline-none focus:border-blue-400"
                />
              </label>

              <label>
                <p className="mb-1 text-xs font-bold text-slate-500">Not</p>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="min-h-[86px] w-full rounded-2xl border border-slate-200 p-4 text-sm font-bold outline-none focus:border-blue-400"
                />
              </label>

              <button className="h-12 w-full rounded-2xl bg-slate-900 text-sm font-black text-white hover:bg-slate-800">
                Müşteri Kaydet
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function TopStat({ title, value, active, onClick, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-50 text-slate-700",
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  return (
    <button
      onClick={onClick}
      className={`min-w-[132px] rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        active ? "border-blue-400 ring-4 ring-blue-50" : "border-slate-200"
      }`}
    >
      <div className={`mb-2 inline-flex rounded-xl px-2 py-1 text-xs font-black ${tones[tone]}`}>
        {title}
      </div>
      <p className="text-2xl font-black text-slate-950">{value}</p>
    </button>
  );
}

function DetailField({ icon, label, value, editable, onChange, wide }) {
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <div className="flex gap-3">
        <div className="pt-1 text-slate-500">{icon}</div>
        <div className="flex-1">
          <p className="text-xs font-bold text-slate-500">{label}</p>
          {editable ? (
            <textarea
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 p-3 text-sm font-bold outline-none focus:border-blue-400"
            />
          ) : (
            <p className="mt-1 whitespace-pre-wrap text-sm font-black text-slate-900">
              {safe(value)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    purple: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm">
      <div className={`mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}>
        {icon}
      </div>
      <p className="text-base font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">{label}</p>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`border-b-2 px-1 pb-3 text-sm font-black transition ${
        active
          ? "border-blue-600 text-blue-600"
          : "border-transparent text-slate-500 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}

function HistoryTable({ rows, emptyTitle, emptyDesc }) {
  if (!rows.length) {
    return <EmptyBox title={emptyTitle} desc={emptyDesc} />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <th className="px-4 py-3">No</th>
            <th className="px-4 py-3">Tarih</th>
            <th className="px-4 py-3">İş</th>
            <th className="px-4 py-3">Tutar</th>
            <th className="px-4 py-3">Durum</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.code} className="border-b border-slate-100 last:border-b-0">
              <td className="px-4 py-3 font-black text-blue-600">{safe(row.code)}</td>
              <td className="px-4 py-3 font-semibold text-slate-600">{safe(row.date)}</td>
              <td className="px-4 py-3 font-black text-slate-900">{safe(row.title)}</td>
              <td className="px-4 py-3 font-black text-slate-900">{safe(row.amount)}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                  {safe(row.status)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyBox({ title, desc }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-10 text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400">
        <FileText size={24} />
      </div>
      <p className="font-black text-slate-700">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm font-semibold text-slate-400">{desc}</p>
    </div>
  );
}

function DrawerInput({ label, value, onChange, required = false }) {
  return (
    <label>
      <p className="mb-1 text-xs font-bold text-slate-500">{label}</p>
      <input
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-400"
      />
    </label>
  );
}

function ClockIcon() {
  return <Clock size={20} />;
}

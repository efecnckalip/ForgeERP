import { useMemo, useState } from "react";
import {
  Plus,
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Search,
  Banknote,
  CreditCard,
  ReceiptText,
  X,
  Edit3,
  CalendarDays,
  Users,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const STORAGE_KEY = "forge_finance";

const todayISO = () => new Date().toISOString().slice(0, 10);

const money = (value) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const newId = () =>
  window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `FIN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const emptyForm = {
  type: "Gelir",
  category: "Tahsilat",
  title: "",
  company: "",
  amount: "",
  date: todayISO(),
  dueDate: "",
  status: "Bekliyor",
  method: "Kasa",
  note: "",
};

const getMonthRange = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const start = new Date(y, m, 1).toISOString().slice(0, 10);
  const end = new Date(y, m + 1, 0).toISOString().slice(0, 10);
  return { start, end };
};

export default function Finance() {
  const monthRange = getMonthRange();

  const [records, setRecords] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeView, setActiveView] = useState("Tümü");
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState(monthRange);

  const saveRecords = (next) => {
    setRecords(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const openCreate = (type = "Gelir", category = "Tahsilat") => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      type,
      category,
      status: "Bekliyor",
      date: todayISO(),
    });
    setShowModal(true);
  };

  const openEdit = (record) => {
    setEditingId(record.id);
    setForm({
      type: record.type || "Gelir",
      category: record.category || "Tahsilat",
      title: record.title || "",
      company: record.company || "",
      amount: record.amount || "",
      date: record.date || todayISO(),
      dueDate: record.dueDate || "",
      status: record.status || "Bekliyor",
      method: record.method || "Kasa",
      note: record.note || "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(false);
  };

  const submitRecord = () => {
    if (!form.title.trim()) {
      alert("Açıklama girmelisin.");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      alert("Geçerli bir tutar girmelisin.");
      return;
    }

    if (editingId) {
      const next = records.map((item) =>
        item.id === editingId
          ? {
              ...item,
              ...form,
              amount: Number(form.amount),
              updatedAt: new Date().toISOString(),
            }
          : item
      );
      saveRecords(next);
      closeModal();
      return;
    }

    const record = {
      id: newId(),
      ...form,
      amount: Number(form.amount),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveRecords([record, ...records]);
    closeModal();
  };

  const deleteRecord = (id) => {
    const ok = window.confirm(
      "Bu finans kaydı silinsin mi? Kasa, tahsilat ve borç özetleri güncellenecek."
    );
    if (!ok) return;

    saveRecords(records.filter((item) => item.id !== id));
  };

  const toggleStatus = (id) => {
    const next = records.map((item) =>
      item.id === id
        ? {
            ...item,
            status: item.status === "Ödendi" ? "Bekliyor" : "Ödendi",
            updatedAt: new Date().toISOString(),
          }
        : item
    );
    saveRecords(next);
  };

  const inPeriod = (item) => {
    const d = item.date || item.createdAt?.slice(0, 10);
    return d >= period.start && d <= period.end;
  };

  const periodRecords = useMemo(() => {
    return records.filter(inPeriod);
  }, [records, period]);

  const summary = useMemo(() => {
    const paidIncome = periodRecords
      .filter((item) => item.type === "Gelir" && item.status === "Ödendi")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const paidExpense = periodRecords
      .filter((item) => item.type === "Gider" && item.status === "Ödendi")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const receivable = periodRecords
      .filter((item) => item.type === "Gelir" && item.status !== "Ödendi")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const debt = periodRecords
      .filter((item) => item.type === "Gider" && item.status !== "Ödendi")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const overdue = periodRecords.filter(
      (item) =>
        item.dueDate && item.dueDate < todayISO() && item.status !== "Ödendi"
    );

    const todayDue = periodRecords.filter(
      (item) => item.dueDate === todayISO() && item.status !== "Ödendi"
    );

    return {
      cash: paidIncome - paidExpense,
      paidIncome,
      paidExpense,
      receivable,
      debt,
      overdue,
      todayDue,
    };
  }, [periodRecords]);

  const filteredRecords = useMemo(() => {
    const q = search.toLowerCase().trim();

    return periodRecords.filter((item) => {
      const searchOk =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.company.toLowerCase().includes(q) ||
        item.method.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);

      const viewOk =
        activeView === "Tümü" ||
        (activeView === "Kasa" && item.status === "Ödendi") ||
        (activeView === "Tahsil Edilen" &&
          item.type === "Gelir" &&
          item.status === "Ödendi") ||
        (activeView === "Ödenen Gider" &&
          item.type === "Gider" &&
          item.status === "Ödendi") ||
        (activeView === "Bekleyen Tahsilat" &&
          item.type === "Gelir" &&
          item.status !== "Ödendi") ||
        (activeView === "Bekleyen Borç" &&
          item.type === "Gider" &&
          item.status !== "Ödendi") ||
        (activeView === "Vadesi Geçen" &&
          item.dueDate &&
          item.dueDate < todayISO() &&
          item.status !== "Ödendi") ||
        (activeView === "Bugün" &&
          item.dueDate === todayISO() &&
          item.status !== "Ödendi") ||
        item.type === activeView ||
        item.status === activeView;

      return searchOk && viewOk;
    });
  }, [periodRecords, activeView, search]);

  const cards = [
    {
      title: "Kasa",
      value: money(summary.cash),
      desc: "Tahsil edilen - ödenen",
      icon: Wallet,
      view: "Kasa",
    },
    {
      title: "Tahsil Edilen",
      value: money(summary.paidIncome),
      desc: "Bu dönem toplam",
      icon: TrendingUp,
      view: "Tahsil Edilen",
    },
    {
      title: "Ödenen Gider",
      value: money(summary.paidExpense),
      desc: "Bu dönem toplam",
      icon: TrendingDown,
      view: "Ödenen Gider",
    },
    {
      title: "Bekleyen Tahsilat",
      value: money(summary.receivable),
      desc: "Alacaklar",
      icon: Users,
      view: "Bekleyen Tahsilat",
    },
    {
      title: "Bekleyen Borç",
      value: money(summary.debt),
      desc: "Ödenecekler",
      icon: Building2,
      view: "Bekleyen Borç",
    },
    {
      title: "Vadesi Geçen",
      value: summary.overdue.length,
      desc: "Acil takip",
      icon: AlertTriangle,
      view: "Vadesi Geçen",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            ForgeERP by EFE CNC
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            Finance Enterprise
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gelir, gider, kasa, tahsilat, borç, müşteri finansı ve vade takibi.
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <CalendarDays size={17} className="text-slate-500" />
            <input
              type="date"
              value={period.start}
              onChange={(e) => setPeriod({ ...period, start: e.target.value })}
              className="bg-transparent text-sm font-semibold outline-none"
            />
            <span className="text-slate-400">-</span>
            <input
              type="date"
              value={period.end}
              onChange={(e) => setPeriod({ ...period, end: e.target.value })}
              className="bg-transparent text-sm font-semibold outline-none"
            />
          </div>

          <button
            onClick={() => openCreate("Gelir", "Tahsilat")}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus size={18} />
            Yeni İşlem
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        {cards.map((card) => {
          const Icon = card.icon;
          const active = activeView === card.view;

          return (
            <button
              key={card.title}
              onClick={() => setActiveView(card.view)}
              className={`rounded-3xl border p-5 text-left shadow-sm transition ${
                active
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white hover:-translate-y-0.5 hover:shadow-md"
              }`}
            >
              <div
                className={`mb-4 inline-flex rounded-2xl p-3 ${
                  active ? "bg-white/10" : "bg-slate-100"
                }`}
              >
                <Icon size={20} />
              </div>
              <p
                className={`text-sm font-medium ${
                  active ? "text-slate-200" : "text-slate-500"
                }`}
              >
                {card.title}
              </p>
              <h2 className="mt-1 text-2xl font-bold">{card.value}</h2>
              <p
                className={`mt-1 text-xs ${
                  active ? "text-slate-300" : "text-slate-400"
                }`}
              >
                {card.desc}
              </p>
            </button>
          );
        })}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel title="Vadesi Geçen Tahsilatlar">
          {summary.overdue.length === 0 ? (
            <EmptySmall text="Geciken kayıt yok." />
          ) : (
            summary.overdue.slice(0, 3).map((item) => (
              <MiniRow key={item.id} item={item} onClick={() => openEdit(item)} />
            ))
          )}
        </Panel>

        <Panel title="Bugün Ödenecekler">
          {summary.todayDue.length === 0 ? (
            <EmptySmall text="Bugün vadesi olan kayıt yok." />
          ) : (
            summary.todayDue.slice(0, 3).map((item) => (
              <MiniRow key={item.id} item={item} onClick={() => openEdit(item)} />
            ))
          )}
        </Panel>

        <Panel title="Hızlı İşlem">
          <div className="grid grid-cols-2 gap-3">
            <QuickButton
              icon={ArrowUpRight}
              title="Gelir Ekle"
              desc="Tahsilat"
              onClick={() => openCreate("Gelir", "Tahsilat")}
            />
            <QuickButton
              icon={ArrowDownRight}
              title="Gider Ekle"
              desc="Ödeme"
              onClick={() => openCreate("Gider", "Gider")}
            />
            <QuickButton
              icon={Banknote}
              title="Kasa"
              desc="Nakit giriş/çıkış"
              onClick={() => setActiveView("Kasa")}
            />
            <QuickButton
              icon={CreditCard}
              title="Borçlar"
              desc="Bekleyen borç"
              onClick={() => setActiveView("Bekleyen Borç")}
            />
          </div>
        </Panel>
      </div>

      <div className="mb-4 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {[
            "Tümü",
            "Gelir",
            "Gider",
            "Bekliyor",
            "Ödendi",
            "Bugün",
            "Vadesi Geçen",
          ].map((item) => (
            <button
              key={item}
              onClick={() => setActiveView(item)}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                activeView === item
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="absolute left-4 top-3.5 text-slate-400" size={17} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Firma, açıklama, kategori ara..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden grid-cols-12 border-b border-slate-200 bg-slate-50 px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500 lg:grid">
          <div className="col-span-3">Açıklama</div>
          <div className="col-span-2">Firma</div>
          <div className="col-span-1">Tip</div>
          <div className="col-span-1">Kategori</div>
          <div className="col-span-1">Tutar</div>
          <div className="col-span-1">Tarih</div>
          <div className="col-span-1">Vade</div>
          <div className="col-span-1">Durum</div>
          <div className="col-span-1 text-right">İşlem</div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <div className="mb-4 rounded-3xl bg-slate-100 p-5">
              <ReceiptText size={34} className="text-slate-500" />
            </div>
            <h3 className="text-lg font-bold">Kayıt bulunamadı</h3>
            <p className="mt-1 max-w-md text-sm text-slate-500">
              Seçili tarih veya filtrede finans kaydı görünmüyor.
            </p>
          </div>
        ) : (
          filteredRecords.map((item) => {
            const overdue =
              item.dueDate &&
              item.dueDate < todayISO() &&
              item.status !== "Ödendi";

            return (
              <div
                key={item.id}
                className="grid grid-cols-1 gap-3 border-b border-slate-100 px-5 py-4 text-sm transition hover:bg-slate-50 lg:grid-cols-12 lg:items-center"
              >
                <div
                  onClick={() => openEdit(item)}
                  className="cursor-pointer lg:col-span-3"
                >
                  <p className="font-bold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Güncelleme: {item.updatedAt?.slice(0, 10) || "-"}
                  </p>
                </div>

                <div className="text-slate-600 lg:col-span-2">
                  {item.company || "-"}
                </div>

                <div className="lg:col-span-1">
                  <Badge
                    text={item.type}
                    tone={item.type === "Gelir" ? "green" : "red"}
                  />
                </div>

                <div className="text-slate-500 lg:col-span-1">
                  {item.category || "-"}
                </div>

                <div className="font-bold lg:col-span-1">
                  {money(item.amount)}
                </div>

                <div className="text-slate-500 lg:col-span-1">
                  {item.date || "-"}
                </div>

                <div className="lg:col-span-1">
                  <span
                    className={`rounded-xl px-2 py-1 text-xs font-bold ${
                      overdue
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {item.dueDate || "-"}
                  </span>
                </div>

                <div className="lg:col-span-1">
                  <button
                    onClick={() => toggleStatus(item.id)}
                    className={`inline-flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-bold transition ${
                      item.status === "Ödendi"
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <CheckCircle2 size={13} />
                    {item.status}
                  </button>
                </div>

                <div className="flex justify-end gap-2 lg:col-span-1">
                  <button
                    onClick={() => openEdit(item)}
                    className="rounded-xl p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                    title="Düzenle"
                  >
                    <Edit3 size={17} />
                  </button>

                  <button
                    onClick={() => deleteRecord(item.id)}
                    className="rounded-xl p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                    title="Sil"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">
                  {editingId ? "Finans Kaydını Düzenle" : "Yeni Finans Kaydı"}
                </h2>
                <p className="text-sm text-slate-500">
                  Gelir, gider, tahsilat, borç ve vade bilgilerini yönet.
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-2xl bg-slate-100 p-3 text-slate-600 hover:bg-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InputLabel label="Kayıt Tipi">
                <select
                  value={form.type}
                  onChange={(e) => {
                    const type = e.target.value;
                    setForm({
                      ...form,
                      type,
                      category: type === "Gelir" ? "Tahsilat" : "Gider",
                    });
                  }}
                  className="inputBox"
                >
                  <option>Gelir</option>
                  <option>Gider</option>
                </select>
              </InputLabel>

              <InputLabel label="Durum">
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value })
                  }
                  className="inputBox"
                >
                  <option>Bekliyor</option>
                  <option>Ödendi</option>
                </select>
              </InputLabel>

              <InputLabel label="Kategori">
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="inputBox"
                >
                  {form.type === "Gelir" ? (
                    <>
                      <option>Tahsilat</option>
                      <option>Müşteri Ödemesi</option>
                      <option>Peşinat</option>
                      <option>Diğer Gelir</option>
                    </>
                  ) : (
                    <>
                      <option>Gider</option>
                      <option>Tedarikçi Borcu</option>
                      <option>Hammadde</option>
                      <option>Maaş</option>
                      <option>Kira</option>
                      <option>Elektrik</option>
                      <option>Takım</option>
                      <option>Diğer Gider</option>
                    </>
                  )}
                </select>
              </InputLabel>

              <InputLabel label="Ödeme Tipi">
                <select
                  value={form.method}
                  onChange={(e) =>
                    setForm({ ...form, method: e.target.value })
                  }
                  className="inputBox"
                >
                  <option>Kasa</option>
                  <option>Banka</option>
                  <option>Kredi Kartı</option>
                  <option>Çek / Senet</option>
                  <option>Diğer</option>
                </select>
              </InputLabel>

              <InputLabel label="Açıklama">
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                  placeholder="Örn: ABC Kalıp tahsilatı"
                  className="inputBox"
                />
              </InputLabel>

              <InputLabel label="Firma / Kişi">
                <input
                  value={form.company}
                  onChange={(e) =>
                    setForm({ ...form, company: e.target.value })
                  }
                  placeholder="Örn: ABC Otomotiv"
                  className="inputBox"
                />
              </InputLabel>

              <InputLabel label="Tutar">
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) =>
                    setForm({ ...form, amount: e.target.value })
                  }
                  placeholder="0"
                  className="inputBox"
                />
              </InputLabel>

              <InputLabel label="İşlem Tarihi">
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="inputBox"
                />
              </InputLabel>

              <InputLabel label="Vade Tarihi">
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm({ ...form, dueDate: e.target.value })
                  }
                  className="inputBox"
                />
              </InputLabel>

              <div className="md:col-span-2">
                <InputLabel label="Not">
                  <textarea
                    value={form.note}
                    onChange={(e) =>
                      setForm({ ...form, note: e.target.value })
                    }
                    placeholder="Ek açıklama..."
                    rows={3}
                    className="inputBox resize-none"
                  />
                </InputLabel>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200"
              >
                Vazgeç
              </button>

              <button
                onClick={submitRecord}
                className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800"
              >
                {editingId ? "Güncelle" : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .inputBox {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid rgb(226 232 240);
          background: rgb(248 250 252);
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          outline: none;
          transition: 0.2s ease;
        }

        .inputBox:focus {
          border-color: rgb(100 116 139);
          background: white;
        }
      `}</style>
    </div>
  );
}

function InputLabel({ label, children }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-bold text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function Panel({ title, children }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-slate-900">{title}</h3>
        <span className="text-xs font-bold text-blue-600">Tümünü Gör</span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function MiniRow({ item, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-2xl p-3 text-left transition hover:bg-slate-50"
    >
      <div>
        <p className="font-bold text-slate-900">{item.company || item.title}</p>
        <p className="text-xs text-slate-500">{item.dueDate || "-"}</p>
      </div>
      <p
        className={`font-bold ${
          item.type === "Gelir" ? "text-emerald-600" : "text-rose-600"
        }`}
      >
        {money(item.amount)}
      </p>
    </button>
  );
}

function QuickButton({ icon: Icon, title, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:bg-white hover:shadow-sm"
    >
      <div className="mb-3 inline-flex rounded-2xl bg-white p-3 shadow-sm">
        <Icon size={18} />
      </div>
      <p className="font-bold text-slate-900">{title}</p>
      <p className="text-xs text-slate-500">{desc}</p>
    </button>
  );
}

function Badge({ text, tone }) {
  const cls =
    tone === "green"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-rose-50 text-rose-700";

  return (
    <span className={`rounded-xl px-3 py-1 text-xs font-bold ${cls}`}>
      {text}
    </span>
  );
}

function EmptySmall({ text }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-400">
      {text}
    </div>
  );
}
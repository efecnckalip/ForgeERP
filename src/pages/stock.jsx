import { useMemo, useState } from "react";
import {
  Package,
  Plus,
  ArrowDown,
  ArrowUp,
  AlertTriangle,
  Warehouse,
  Search,
  Filter,
  Eye,
  BarChart3,
  ClipboardList,
  MapPin,
  Truck,
  X,
  Save,
  Zap,
  Trash2,
  Pencil,
} from "lucide-react";

const STOCK_KEY = "forge_stock_items";
const MOVEMENT_KEY = "forge_stock_movements";

const initialStock = [
  {
    id: "STK-001",
    code: "HAM-0012",
    name: "S235JR Sac 10mm",
    category: "Hammadde",
    unit: "kg",
    qty: 1250,
    min: 500,
    warehouse: "Ana Depo",
    shelf: "A-01",
    supplier: "ABC Metal",
  },
  {
    id: "STK-002",
    code: "HAM-0008",
    name: "Alüminyum Profil 30x30",
    category: "Hammadde",
    unit: "mt",
    qty: 320,
    min: 200,
    warehouse: "Ana Depo",
    shelf: "A-04",
    supplier: "XYZ Alüminyum",
  },
  {
    id: "STK-003",
    code: "TKM-0045",
    name: "Freze Ø12mm HSS",
    category: "Takım",
    unit: "adet",
    qty: 8,
    min: 10,
    warehouse: "Takım Depo",
    shelf: "T-02",
    supplier: "Kesici Takımcı",
  },
];

const readLS = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeLS = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const money = (v) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(Number(v || 0));

export default function Stock() {
  const [items, setItems] = useState(() => readLS(STOCK_KEY, initialStock));
  const [movements, setMovements] = useState(() => readLS(MOVEMENT_KEY, []));
  const [activeTab, setActiveTab] = useState("Tümü");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [movementQty, setMovementQty] = useState("");

  const emptyForm = {
    code: "",
    name: "",
    category: "Hammadde",
    unit: "adet",
    qty: "",
    min: "",
    warehouse: "Ana Depo",
    shelf: "",
    supplier: "",
  };

  const [form, setForm] = useState(emptyForm);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const tabOk = activeTab === "Tümü" || item.category === activeTab;
      const text = `${item.code} ${item.name} ${item.category} ${item.warehouse}`.toLowerCase();
      return tabOk && text.includes(search.toLowerCase());
    });
  }, [items, activeTab, search]);

  const criticalItems = items.filter((item) => Number(item.qty) <= Number(item.min));
  const totalValue = items.reduce((sum, item) => sum + Number(item.qty || 0) * 1000, 0);
  const warehouses = [...new Set(items.map((i) => i.warehouse).filter(Boolean))];

  const saveItems = (next) => {
    setItems(next);
    writeLS(STOCK_KEY, next);
  };

  const saveMovements = (next) => {
    setMovements(next);
    writeLS(MOVEMENT_KEY, next);
  };

  const addMovement = (type, item, qty) => {
    const next = [
      {
        id: Date.now(),
        type,
        item: item.name,
        code: item.code,
        qty,
        unit: item.unit,
        date: new Date().toLocaleString("tr-TR"),
      },
      ...movements,
    ];
    saveMovements(next);
  };

  const openNew = () => {
    setForm(emptyForm);
    setSelectedItem(null);
    setModal("new");
  };

  const openEdit = (item) => {
    setSelectedItem(item);
    setForm(item);
    setModal("edit");
  };

  const openDetail = (item) => {
    setSelectedItem(item);
    setModal("detail");
  };

  const openMovement = (type, item = null) => {
    setSelectedItem(item);
    setMovementQty("");
    setModal(type);
  };

  const saveStock = () => {
    if (!form.code || !form.name) {
      alert("Stok kodu ve stok adı zorunlu.");
      return;
    }

    if (modal === "edit" && selectedItem) {
      const updatedItem = {
        ...form,
        id: selectedItem.id,
        qty: Number(form.qty || 0),
        min: Number(form.min || 0),
      };

      const next = items.map((i) => (i.id === selectedItem.id ? updatedItem : i));
      saveItems(next);
      addMovement("Stok Düzenlendi", updatedItem, updatedItem.qty);
      setModal(null);
      return;
    }

    const newItem = {
      ...form,
      id: `STK-${Date.now()}`,
      qty: Number(form.qty || 0),
      min: Number(form.min || 0),
    };

    saveItems([newItem, ...items]);
    addMovement("Yeni Stok", newItem, newItem.qty);
    setModal(null);
  };

  const saveMovement = () => {
    const qty = Number(movementQty || 0);

    if (!selectedItem) {
      alert("Önce stok seç.");
      return;
    }

    if (!qty || qty <= 0) {
      alert("Geçerli miktar gir.");
      return;
    }

    const isOut = modal === "out";

    if (isOut && qty > Number(selectedItem.qty)) {
      alert("Çıkış miktarı mevcut stoktan fazla olamaz.");
      return;
    }

    const next = items.map((item) => {
      if (item.id !== selectedItem.id) return item;
      return {
        ...item,
        qty: isOut ? Number(item.qty) - qty : Number(item.qty) + qty,
      };
    });

    const updatedSelected = next.find((i) => i.id === selectedItem.id);

    saveItems(next);
    addMovement(isOut ? "Stok Çıkışı" : "Stok Girişi", selectedItem, qty);
    setSelectedItem(updatedSelected);
    setModal(null);
  };

  const deleteItem = (item) => {
    const ok = window.confirm(
      `${item.name} stok kaydı silinsin mi?\n\nBu işlem stok listesinden kaldırır. Geçmiş stok hareketleri kalır.`
    );

    if (!ok) return;

    const next = items.filter((i) => i.id !== item.id);
    saveItems(next);
    addMovement("Stok Silindi", item, item.qty);
    setModal(null);
  };

  const clearDemo = () => {
    const ok = window.confirm("Tüm stok kayıtları silinsin mi?");
    if (!ok) return;
    saveItems([]);
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] p-6 text-slate-900">
      <header className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Stok Yönetimi</h1>
          <p className="mt-1 text-sm text-slate-500">
            Hammadde, takım, depo, raf ve kritik stok seviyelerini yönetin.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={openNew} className="flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700">
            <Plus size={18} /> Yeni Stok Ekle
          </button>

          <button onClick={() => openMovement("in")} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black shadow-sm transition hover:bg-slate-50">
            <ArrowDown size={18} /> Stok Girişi
          </button>

          <button onClick={() => openMovement("out")} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black shadow-sm transition hover:bg-slate-50">
            <ArrowUp size={18} /> Stok Çıkışı
          </button>
        </div>
      </header>

      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <TopCard title="Toplam Stok Kalemi" value={items.length} sub="Kayıtlı stok" icon={Package} color="blue" />
        <TopCard title="Toplam Stok Değeri" value={money(totalValue)} sub="Tahmini değer" icon={BarChart3} color="green" />
        <TopCard title="Kritik Stoklar" value={criticalItems.length} sub="Minimum altında" icon={AlertTriangle} color="red" />
        <TopCard title="Bekleyen Siparişler" value="0" sub="Tedarik bekliyor" icon={Truck} color="orange" />
        <TopCard title="Aktif Depo" value={warehouses.length} sub="Depo sayısı" icon={Warehouse} color="blue" />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-8">
          <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-xl font-black">Stok Listesi</h2>
              <p className="text-sm text-slate-500">Satıra veya ikonlara tıklayarak işlem yap.</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <Search size={18} className="text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Stok ara..."
                  className="w-48 bg-transparent text-sm outline-none"
                />
              </div>

              <button onClick={() => alert("Filtre için kategori sekmelerini kullan.")} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black shadow-sm transition hover:bg-slate-50">
                <Filter size={18} /> Filtrele
              </button>

              <button onClick={clearDemo} className="flex items-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-black text-red-600 shadow-sm transition hover:bg-red-50">
                <Trash2 size={18} /> Temizle
              </button>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {["Tümü", "Hammadde", "Takım", "Yarı Mamul", "Diğer"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-xl px-4 py-2 text-sm font-black transition ${
                  activeTab === tab
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-4">Stok Kodu</th>
                  <th className="p-4">Stok Adı</th>
                  <th className="p-4">Kategori</th>
                  <th className="p-4">Miktar</th>
                  <th className="p-4">Min.</th>
                  <th className="p-4">Depo</th>
                  <th className="p-4">Durum</th>
                  <th className="p-4">İşlemler</th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.map((item) => {
                  const critical = Number(item.qty) <= Number(item.min);

                  return (
                    <tr
                      key={item.id}
                      onClick={() => openDetail(item)}
                      className="cursor-pointer border-t border-slate-100 transition hover:bg-blue-50"
                    >
                      <td className="p-4 font-black">{item.code}</td>
                      <td className="p-4 font-bold">{item.name}</td>
                      <td className="p-4">
                        <Badge text={item.category} type={item.category} />
                      </td>
                      <td className={`p-4 font-black ${critical ? "text-red-600" : "text-emerald-600"}`}>
                        {item.qty} {item.unit}
                      </td>
                      <td className="p-4 font-bold text-red-500">{item.min}</td>
                      <td className="p-4">
                        <p className="font-bold">{item.warehouse}</p>
                        <p className="text-xs text-slate-500">{item.shelf}</p>
                      </td>
                      <td className="p-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${
                          critical ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
                        }`}>
                          {critical ? "Kritik" : "Yeterli"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <IconButton title="Detay" icon={Eye} onClick={() => openDetail(item)} />
                          <IconButton title="Giriş" icon={ArrowDown} onClick={() => openMovement("in", item)} />
                          <IconButton title="Çıkış" icon={ArrowUp} onClick={() => openMovement("out", item)} />
                          <IconButton title="Düzenle" icon={Pencil} onClick={() => openEdit(item)} />
                          <IconButton danger title="Sil" icon={Trash2} onClick={() => deleteItem(item)} />
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-sm font-bold text-slate-400">
                      Stok kaydı bulunamadı. Yeni stok ekleyebilirsin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6 xl:col-span-4">
          <Panel title="Kritik Stoklar" icon={AlertTriangle}>
            <div className="space-y-3">
              {criticalItems.length ? (
                criticalItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => openDetail(item)}
                    className="w-full rounded-2xl bg-red-50 p-4 text-left transition hover:bg-red-100"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-black">{item.code}</p>
                      <p className="font-black text-red-600">{item.qty} {item.unit}</p>
                    </div>
                    <p className="mt-1 text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-slate-500">Minimum: {item.min}</p>
                  </button>
                ))
              ) : (
                <Empty text="Kritik stok yok." />
              )}
            </div>
          </Panel>

          <Panel title="Son Stok Hareketleri" icon={ClipboardList}>
            <div className="space-y-3">
              {movements.length ? (
                movements.slice(0, 6).map((m) => (
                  <div key={m.id} className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-black">{m.type}</p>
                      <p className="font-black">{m.qty} {m.unit}</p>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-600">{m.item}</p>
                    <p className="text-xs text-slate-400">{m.date}</p>
                  </div>
                ))
              ) : (
                <Empty text="Henüz stok hareketi yok." />
              )}
            </div>
          </Panel>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel title="Stok Dağılımı" icon={BarChart3}>
          <CategoryRows items={items} />
        </Panel>

        <Panel title="Depo / Raf Özeti" icon={MapPin}>
          <div className="space-y-3">
            {warehouses.length ? (
              warehouses.map((w) => (
                <button key={w} onClick={() => setSearch(w)} className="w-full rounded-2xl bg-slate-50 p-4 text-left transition hover:bg-blue-50">
                  <p className="font-black">{w}</p>
                  <p className="text-sm text-slate-500">{items.filter((i) => i.warehouse === w).length} stok kalemi</p>
                </button>
              ))
            ) : (
              <Empty text="Depo kaydı yok." />
            )}
          </div>
        </Panel>

        <Panel title="Hızlı İşlemler" icon={Zap}>
          <div className="grid grid-cols-2 gap-3">
            <Quick text="Stok Girişi" icon={ArrowDown} onClick={() => openMovement("in")} />
            <Quick text="Stok Çıkışı" icon={ArrowUp} onClick={() => openMovement("out")} />
            <Quick text="Yeni Stok" icon={Plus} onClick={openNew} />
            <Quick text="Sayım" icon={ClipboardList} onClick={() => alert("Stok sayımı sonraki sürümde.")} />
          </div>
        </Panel>
      </section>

      {(modal === "new" || modal === "edit") && (
        <Modal title={modal === "new" ? "Yeni Stok Ekle" : "Stok Düzenle"} onClose={() => setModal(null)}>
          <StockForm form={form} setForm={setForm} />
          <button onClick={saveStock} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3 text-sm font-black text-white transition hover:bg-blue-700">
            <Save size={18} /> Kaydet
          </button>
        </Modal>
      )}

      {(modal === "in" || modal === "out") && (
        <Modal title={modal === "in" ? "Stok Girişi" : "Stok Çıkışı"} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <label className="block">
              <p className="mb-1 text-sm font-black text-slate-600">İşlem yapılacak stok</p>
              <select
                value={selectedItem?.id || ""}
                onChange={(e) => {
                  const item = items.find((x) => x.id === e.target.value);
                  setSelectedItem(item || null);
                }}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-blue-500"
              >
                <option value="">Stok seç...</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} - {item.name} / Mevcut: {item.qty} {item.unit}
                  </option>
                ))}
              </select>
            </label>

            {items.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm font-bold text-slate-400">
                Önce yeni stok eklemen gerekiyor.
              </div>
            )}

            {selectedItem && (
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold text-slate-500">Seçili Stok</p>
                <p className="font-black">{selectedItem.name}</p>
                <p className="text-sm text-slate-500">
                  Mevcut: {selectedItem.qty} {selectedItem.unit}
                </p>
              </div>
            )}

            <Input
              label={`Miktar ${selectedItem ? `(${selectedItem.unit})` : ""}`}
              type="number"
              value={movementQty}
              onChange={setMovementQty}
            />

            <button
              onClick={saveMovement}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3 text-sm font-black text-white transition hover:bg-blue-700"
            >
              <Save size={18} /> İşlemi Kaydet
            </button>
          </div>
        </Modal>
      )}

      {modal === "detail" && selectedItem && (
        <Modal title="Stok Detayı" onClose={() => setModal(null)}>
          <div className="space-y-3">
            <Detail label="Stok Kodu" value={selectedItem.code} />
            <Detail label="Stok Adı" value={selectedItem.name} />
            <Detail label="Kategori" value={selectedItem.category} />
            <Detail label="Miktar" value={`${selectedItem.qty} ${selectedItem.unit}`} />
            <Detail label="Minimum Seviye" value={selectedItem.min} />
            <Detail label="Depo" value={selectedItem.warehouse} />
            <Detail label="Raf" value={selectedItem.shelf || "-"} />
            <Detail label="Tedarikçi" value={selectedItem.supplier || "-"} />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button onClick={() => openMovement("in", selectedItem)} className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black shadow-sm transition hover:bg-slate-50">
              <ArrowDown size={18} /> Giriş
            </button>
            <button onClick={() => openMovement("out", selectedItem)} className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black shadow-sm transition hover:bg-slate-50">
              <ArrowUp size={18} /> Çıkış
            </button>
            <button onClick={() => openEdit(selectedItem)} className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black shadow-sm transition hover:bg-slate-50">
              <Pencil size={18} /> Düzenle
            </button>
            <button onClick={() => deleteItem(selectedItem)} className="flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700">
              <Trash2 size={18} /> Sil
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function TopCard({ title, value, sub, icon: Icon, color }) {
  const colors = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-emerald-100 text-emerald-600",
    red: "bg-red-100 text-red-600",
    orange: "bg-orange-100 text-orange-600",
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-500">{title}</p>
          <h2 className="mt-2 text-3xl font-black">{value}</h2>
          <p className="mt-1 text-sm text-slate-500">{sub}</p>
        </div>
        <div className={`rounded-2xl p-4 ${colors[color]}`}>
          <Icon size={28} />
        </div>
      </div>
    </div>
  );
}

function Badge({ text, type }) {
  const styles = {
    Hammadde: "bg-blue-50 text-blue-700 border-blue-200",
    Takım: "bg-purple-50 text-purple-700 border-purple-200",
    "Yarı Mamul": "bg-orange-50 text-orange-700 border-orange-200",
    Diğer: "bg-slate-50 text-slate-700 border-slate-200",
  };

  return (
    <span className={`rounded-lg border px-3 py-1 text-xs font-black ${styles[type] || styles.Diğer}`}>
      {text}
    </span>
  );
}

function IconButton({ icon: Icon, onClick, danger = false, title }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`rounded-xl border p-2 transition ${
        danger ? "border-red-200 text-red-600 hover:bg-red-50" : "border-slate-200 hover:bg-blue-50"
      }`}
    >
      <Icon size={16} />
    </button>
  );
}

function Panel({ title, icon: Icon, children }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <Icon className="text-blue-600" size={22} />
        <h2 className="text-lg font-black">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Empty({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm font-bold text-slate-400">
      {text}
    </div>
  );
}

function CategoryRows({ items }) {
  const cats = ["Hammadde", "Takım", "Yarı Mamul", "Diğer"];

  return (
    <div className="space-y-3">
      {cats.map((cat) => {
        const count = items.filter((i) => i.category === cat).length;
        return (
          <div key={cat} className="rounded-2xl bg-slate-50 p-4">
            <div className="flex justify-between">
              <p className="font-black">{cat}</p>
              <p className="font-black">{count}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Quick({ text, icon: Icon, onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-1 hover:shadow-lg">
      <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
        <Icon size={18} />
      </div>
      <p className="text-sm font-black">{text}</p>
    </button>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-black">{title}</h2>
          <button onClick={onClose} className="rounded-xl bg-slate-100 p-2 hover:bg-slate-200">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function StockForm({ form, setForm }) {
  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Input label="Stok Kodu" value={form.code} onChange={(v) => update("code", v)} />
      <Input label="Stok Adı" value={form.name} onChange={(v) => update("name", v)} />
      <Select label="Kategori" value={form.category} onChange={(v) => update("category", v)} options={["Hammadde", "Takım", "Yarı Mamul", "Diğer"]} />
      <Select label="Birim" value={form.unit} onChange={(v) => update("unit", v)} options={["adet", "kg", "mt", "lt", "paket"]} />
      <Input label="Mevcut Miktar" type="number" value={form.qty} onChange={(v) => update("qty", v)} />
      <Input label="Minimum Seviye" type="number" value={form.min} onChange={(v) => update("min", v)} />
      <Input label="Depo" value={form.warehouse} onChange={(v) => update("warehouse", v)} />
      <Input label="Raf" value={form.shelf} onChange={(v) => update("shelf", v)} />
      <Input label="Tedarikçi" value={form.supplier} onChange={(v) => update("supplier", v)} />
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <p className="mb-1 text-sm font-black text-slate-600">{label}</p>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block">
      <p className="mb-1 text-sm font-black text-slate-600">{label}</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}
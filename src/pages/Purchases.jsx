import { useMemo, useState } from "react";
import {
  Plus, Search, Wallet, Clock, Truck, CheckCircle2, XCircle, Eye, X,
  Save, CreditCard, PackageCheck, RotateCcw, Trash2, Building2,
  ShoppingCart, Pencil
} from "lucide-react";

const STORAGE_KEY = "forge_purchases_enterprise_v4";

function money(v) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(Number(v || 0));
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysLate(date) {
  if (!date) return 0;
  const diff = Math.floor((new Date(todayISO()) - new Date(date)) / 86400000);
  return diff > 0 ? diff : 0;
}

function paymentStatus(total, paid) {
  if (Number(paid) >= Number(total) && Number(total) > 0) return "Ödendi";
  if (Number(paid) > 0) return "Kısmi Ödeme";
  return "Ödenmedi";
}

function Badge({ children, type = "gray" }) {
  const c = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    red: "bg-red-50 text-red-700 border-red-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    gray: "bg-slate-50 text-slate-600 border-slate-200",
  };
  return <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${c[type]}`}>{children}</span>;
}

export default function Purchases() {
  const [purchases, setPurchases] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [tab, setTab] = useState("orders");
  const [quickFilter, setQuickFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [payAmount, setPayAmount] = useState("");

  const emptyForm = {
    supplier: "",
    phone: "",
    email: "",
    city: "",
    category: "Malzeme",
    item: "",
    qty: 1,
    unit: "Adet",
    unitPrice: 0,
    paid: 0,
    orderDate: todayISO(),
    deliveryDate: todayISO(),
    dueDate: todayISO(),
    status: "Teslim Bekliyor",
    note: "",
  };

  const [form, setForm] = useState(emptyForm);

  function persist(next) {
    setPurchases(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function totalOf(f) {
    return Number(f.qty || 0) * Number(f.unitPrice || 0);
  }

  const suppliers = useMemo(() => {
    const map = {};
    purchases.forEach((p) => {
      const debt = Math.max(0, Number(p.total) - Number(p.paid));
      const lateDebt = daysLate(p.dueDate || p.deliveryDate) > 0 ? debt : 0;

      if (!map[p.supplier]) {
        map[p.supplier] = {
          supplier: p.supplier,
          phone: p.phone || "-",
          email: p.email || "-",
          city: p.city || "-",
          total: 0,
          paid: 0,
          debt: 0,
          lateDebt: 0,
          count: 0,
          lastOrder: p.orderDate,
        };
      }

      map[p.supplier].total += Number(p.total || 0);
      map[p.supplier].paid += Number(p.paid || 0);
      map[p.supplier].debt += debt;
      map[p.supplier].lateDebt += lateDebt;
      map[p.supplier].count += 1;
      if (p.orderDate > map[p.supplier].lastOrder) map[p.supplier].lastOrder = p.orderDate;
    });

    return Object.values(map).sort((a, b) => b.debt - a.debt);
  }, [purchases]);

  const stats = useMemo(() => {
    const debt = purchases.reduce((s, p) => s + Math.max(0, p.total - p.paid), 0);
    const late = purchases.reduce((s, p) => {
      const d = Math.max(0, p.total - p.paid);
      return daysLate(p.dueDate || p.deliveryDate) > 0 ? s + d : s;
    }, 0);

    return {
      debt,
      late,
      waiting: purchases.filter((p) => p.status === "Teslim Bekliyor").length,
      delivered: purchases.filter((p) => p.status === "Teslim Alındı").length,
      suppliers: suppliers.length,
      total: purchases.reduce((s, p) => s + Number(p.total || 0), 0),
    };
  }, [purchases, suppliers]);

  const filtered = purchases.filter((p) => {
    const text = `${p.id} ${p.supplier} ${p.item} ${p.category}`.toLowerCase();
    const q = text.includes(query.toLowerCase());

    if (tab === "debts") return q && p.total - p.paid > 0;
    if (tab === "delivered") return q && p.status === "Teslim Alındı";
    if (tab === "cancelled") return q && p.status === "İptal";

    if (quickFilter === "waiting") return q && p.status === "Teslim Bekliyor";
    if (quickFilter === "delivered") return q && p.status === "Teslim Alındı";
    if (quickFilter === "debt") return q && p.total - p.paid > 0;
    if (quickFilter === "late") return q && daysLate(p.dueDate || p.deliveryDate) > 0 && p.total - p.paid > 0;

    return q;
  });

  function go(targetTab, filter = "all") {
    setTab(targetTab);
    setQuickFilter(filter);
  }

  function openCreate() {
    setForm(emptyForm);
    setSelected(null);
    setModal("create");
  }

  function openEdit(p) {
    setSelected(p);
    setForm({
      ...emptyForm,
      ...p,
      dueDate: p.dueDate || p.deliveryDate || todayISO(),
    });
    setModal("edit");
  }

  function saveCreate() {
    if (!form.supplier || !form.item || Number(form.qty) <= 0) {
      alert("Tedarikçi, ürün ve adet zorunlu.");
      return;
    }

    const item = {
      ...form,
      id: `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
      qty: Number(form.qty),
      unitPrice: Number(form.unitPrice),
      paid: Number(form.paid),
      total: totalOf(form),
    };

    persist([item, ...purchases]);
    setModal(null);
  }

  function saveEdit() {
    if (!selected) return;

    const updated = {
      ...form,
      id: selected.id,
      qty: Number(form.qty),
      unitPrice: Number(form.unitPrice),
      paid: Number(form.paid),
      total: totalOf(form),
    };

    persist(purchases.map((p) => (p.id === selected.id ? updated : p)));
    setSelected(updated);
    setModal("order");
  }

  function setDelivered(p, delivered) {
    persist(purchases.map((x) =>
      x.id === p.id ? { ...x, status: delivered ? "Teslim Alındı" : "Teslim Bekliyor" } : x
    ));
    if (selected?.id === p.id) setSelected({ ...selected, status: delivered ? "Teslim Alındı" : "Teslim Bekliyor" });
  }

  function openPayment(p) {
    setSelected(p);
    setPayAmount("");
    setModal("payment");
  }

  function savePayment() {
    const amount = Number(payAmount || 0);
    if (amount <= 0) return alert("Geçerli ödeme tutarı gir.");

    const next = purchases.map((p) =>
      p.id === selected.id
        ? { ...p, paid: Math.min(Number(p.total), Number(p.paid) + amount) }
        : p
    );

    persist(next);
    setSelected(next.find((p) => p.id === selected.id));
    setModal("order");
  }

  function deleteOrder(p) {
    if (!confirm(`${p.id} silinsin mi?`)) return;
    persist(purchases.filter((x) => x.id !== p.id));
    setModal(null);
  }

  function deleteSupplier(supplier) {
    const ok = confirm(
      `${supplier} tedarikçisi silinsin mi?\n\nBu tedarikçiye ait TÜM siparişler, borçlar ve ödeme kayıtları silinecek. Emin misin?`
    );
    if (!ok) return;
    persist(purchases.filter((p) => p.supplier !== supplier));
    setModal(null);
  }

  function openOrder(p) {
    setSelected(p);
    setModal("order");
  }

  function openSupplier(s) {
    setSelected(s);
    setModal("supplier");
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-900 p-6">
      <div className="max-w-[1600px] mx-auto space-y-5">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">ForgeERP / Tedarikçi Yönetimi & Borç Takibi</p>
            <h1 className="text-2xl font-black mt-1">Satın Alma</h1>
          </div>

          <button onClick={openCreate} className="btn-primary">
            <Plus size={18} /> Yeni Satın Alma
          </button>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <Kpi onClick={() => go("debts", "debt")} icon={<Wallet />} title="Toplam Borç" value={money(stats.debt)} sub="Kalan borç" tone="red" />
          <Kpi onClick={() => go("debts", "late")} icon={<Clock />} title="Vadesi Geçmiş" value={money(stats.late)} sub="Geciken borç" tone="red" />
          <Kpi onClick={() => go("orders", "waiting")} icon={<Truck />} title="Teslim Bekleyen" value={stats.waiting} sub="Aktif sipariş" tone="orange" />
          <Kpi onClick={() => go("delivered", "delivered")} icon={<PackageCheck />} title="Teslim Alınan" value={stats.delivered} sub="Tamamlanan" tone="green" />
          <Kpi onClick={() => go("suppliers")} icon={<Building2 />} title="Tedarikçi" value={stats.suppliers} sub="Firma" tone="blue" />
          <Kpi onClick={() => go("orders", "all")} icon={<ShoppingCart />} title="Toplam Alım" value={money(stats.total)} sub="Tüm kayıtlar" tone="blue" />
        </section>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex flex-wrap border-b border-slate-200">
            {[
              ["orders", "Siparişler"],
              ["suppliers", "Tedarikçiler"],
              ["debts", "Borç Takibi"],
              ["delivered", "Teslim Alınanlar"],
              ["cancelled", "İptaller"],
            ].map(([k, t]) => (
              <button
                key={k}
                onClick={() => {
                  setTab(k);
                  setQuickFilter("all");
                }}
                className={`px-5 py-4 text-sm font-bold border-b-2 ${
                  tab === k ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab !== "suppliers" && (
            <div className="p-4">
              <div className="relative max-w-xl">
                <Search size={17} className="absolute left-3 top-3 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="input pl-10"
                  placeholder="Sipariş no, tedarikçi, ürün ara..."
                />
              </div>
            </div>
          )}
        </div>

        {tab === "suppliers" ? (
          <Suppliers suppliers={suppliers} onView={openSupplier} onDelete={deleteSupplier} />
        ) : (
          <Orders
            rows={filtered}
            onView={openOrder}
            onEdit={openEdit}
            onPay={openPayment}
            onDelivered={(p) => setDelivered(p, true)}
            onNotDelivered={(p) => setDelivered(p, false)}
          />
        )}
      </div>

      {(modal === "create" || modal === "edit") && (
        <Modal title={modal === "create" ? "Yeni Satın Alma" : "Satın Alma Düzenle"} onClose={() => setModal(null)}>
          <PurchaseForm form={form} setForm={setForm} totalOf={totalOf} />
          <div className="flex justify-end gap-3 mt-6">
            <button className="btn-light" onClick={() => setModal(null)}>Vazgeç</button>
            <button className="btn-primary" onClick={modal === "create" ? saveCreate : saveEdit}>
              <Save size={17} /> Kaydet
            </button>
          </div>
        </Modal>
      )}

      {modal === "payment" && selected && (
        <Modal title="Ödeme Gir" onClose={() => setModal(null)}>
          <Info label="Tedarikçi" value={selected.supplier} />
          <Info label="Kalan Borç" value={money(selected.total - selected.paid)} danger />
          <div className="mt-4">
            <Field label="Ödeme Tutarı">
              <input type="number" className="input" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
            </Field>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button className="btn-light" onClick={() => setModal("order")}>Vazgeç</button>
            <button className="btn-primary" onClick={savePayment}><CreditCard size={17} /> Kaydet</button>
          </div>
        </Modal>
      )}

      {modal === "order" && selected && (
        <Modal title={selected.id} onClose={() => setModal(null)}>
          <div className="grid grid-cols-2 gap-4">
            <Info label="Tedarikçi" value={selected.supplier} />
            <Info label="Ürün" value={selected.item} />
            <Info label="Adet" value={`${selected.qty} ${selected.unit}`} />
            <Info label="Birim Fiyat" value={money(selected.unitPrice)} />
            <Info label="Toplam" value={money(selected.total)} />
            <Info label="Kalan Borç" value={money(selected.total - selected.paid)} danger />
            <Info label="Teslim Tarihi" value={selected.deliveryDate} />
            <Info label="Vade Tarihi" value={selected.dueDate || selected.deliveryDate} />
            <Info label="Durum" value={selected.status} />
            <Info label="Ödeme" value={paymentStatus(selected.total, selected.paid)} />
          </div>

          <div className="flex flex-wrap justify-end gap-3 mt-6">
            <button className="btn-primary" onClick={() => openPayment(selected)}><CreditCard size={17} /> Ödeme Gir</button>
            <button className="btn-light" onClick={() => openEdit(selected)}><Pencil size={17} /> Düzenle</button>
            <button className="btn-success" onClick={() => setDelivered(selected, true)}><CheckCircle2 size={17} /> Teslim Alındı</button>
            <button className="btn-warning" onClick={() => setDelivered(selected, false)}><XCircle size={17} /> Teslim Alınmadı</button>
            <button className="btn-light" onClick={() => persist(purchases.map((p) => p.id === selected.id ? { ...p, status: "İptal" } : p))}><RotateCcw size={17} /> İptal</button>
            <button className="btn-danger" onClick={() => deleteOrder(selected)}><Trash2 size={17} /> Sil</button>
          </div>
        </Modal>
      )}

      {modal === "supplier" && selected && (
        <Modal title={selected.supplier} onClose={() => setModal(null)}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Info label="Toplam Alım" value={money(selected.total)} />
            <Info label="Ödenen" value={money(selected.paid)} />
            <Info label="Kalan Borç" value={money(selected.debt)} danger />
            <Info label="Sipariş" value={selected.count} />
          </div>

          <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-sm">
            <div><b>Telefon:</b> {selected.phone}</div>
            <div><b>E-posta:</b> {selected.email}</div>
            <div><b>Şehir:</b> {selected.city}</div>
            <div><b>Son Sipariş:</b> {selected.lastOrder}</div>
          </div>

          <div className="flex justify-end mt-6">
            <button className="btn-danger" onClick={() => deleteSupplier(selected.supplier)}>
              <Trash2 size={17} /> Tedarikçiyi Sil
            </button>
          </div>
        </Modal>
      )}

      <style>{`
        .input{width:100%;height:44px;border:1px solid #e2e8f0;border-radius:12px;padding:0 12px;outline:none;background:white}
        .input:focus{border-color:#60a5fa}
        .btn-primary{min-height:42px;padding:0 16px;border-radius:12px;background:#2563eb;color:white;font-weight:800;display:inline-flex;align-items:center;justify-content:center;gap:8px;transition:.15s}
        .btn-primary:hover{background:#1d4ed8;transform:translateY(-1px)}
        .btn-light{min-height:42px;padding:0 16px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;font-weight:800;display:inline-flex;align-items:center;justify-content:center;gap:8px;transition:.15s}
        .btn-light:hover{background:#eef2ff;border-color:#c7d2fe;color:#1d4ed8;transform:translateY(-1px)}
        .btn-success{min-height:42px;padding:0 16px;border-radius:12px;background:#ecfdf5;border:1px solid #a7f3d0;color:#047857;font-weight:800;display:inline-flex;align-items:center;justify-content:center;gap:8px;transition:.15s}
        .btn-success:hover{background:#10b981;color:white;border-color:#10b981;transform:translateY(-1px)}
        .btn-warning{min-height:42px;padding:0 16px;border-radius:12px;background:#fff7ed;border:1px solid #fed7aa;color:#c2410c;font-weight:800;display:inline-flex;align-items:center;justify-content:center;gap:8px;transition:.15s}
        .btn-warning:hover{background:#f97316;color:white;border-color:#f97316;transform:translateY(-1px)}
        .btn-danger{min-height:42px;padding:0 16px;border-radius:12px;background:#fee2e2;color:#b91c1c;font-weight:800;display:inline-flex;align-items:center;justify-content:center;gap:8px;transition:.15s}
        .btn-danger:hover{background:#ef4444;color:white;transform:translateY(-1px)}
      `}</style>
    </div>
  );
}

function PurchaseForm({ form, setForm, totalOf }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Tedarikçi"><input className="input" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} /></Field>
      <Field label="Telefon"><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
      <Field label="E-posta"><input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
      <Field label="Şehir"><input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>

      <Field label="Kategori">
        <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          <option>Malzeme</option><option>Kesici Takım</option><option>Sarf</option><option>Bakım</option><option>Hizmet</option>
        </select>
      </Field>

      <Field label="Ürün / Hizmet"><input className="input" value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })} /></Field>
      <Field label="Adet / Miktar"><input type="number" className="input" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} /></Field>

      <Field label="Birim">
        <select className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
          <option>Adet</option><option>Kg</option><option>Metre</option><option>Takım</option><option>Paket</option><option>Saat</option>
        </select>
      </Field>

      <Field label="Birim Fiyat"><input type="number" className="input" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} /></Field>
      <Field label="Toplam"><input className="input bg-slate-50 font-bold" value={money(totalOf(form))} readOnly /></Field>
      <Field label="Ödenen"><input type="number" className="input" value={form.paid} onChange={(e) => setForm({ ...form, paid: e.target.value })} /></Field>
      <Field label="Teslim Tarihi"><input type="date" className="input" value={form.deliveryDate} onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })} /></Field>
      <Field label="Vade Tarihi"><input type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></Field>

      <div className="md:col-span-2">
        <Field label="Not"><input className="input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
      </div>
    </div>
  );
}

function Orders({ rows, onView, onEdit, onPay, onDelivered, onNotDelivered }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex justify-between">
        <h2 className="font-black">Satın Alma Siparişleri</h2>
        <span className="text-sm text-slate-500">{rows.length} kayıt</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="p-4 text-left">Sipariş</th>
              <th className="p-4 text-left">Tedarikçi</th>
              <th className="p-4 text-left">Ürün</th>
              <th className="p-4 text-left">Adet</th>
              <th className="p-4 text-left">Vade</th>
              <th className="p-4 text-left">Toplam</th>
              <th className="p-4 text-left">Borç</th>
              <th className="p-4 text-left">Ödeme</th>
              <th className="p-4 text-left">Durum</th>
              <th className="p-4 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const pay = paymentStatus(p.total, p.paid);
              return (
                <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="p-4 font-bold text-blue-600">{p.id}</td>
                  <td className="p-4 font-bold">{p.supplier}</td>
                  <td className="p-4">{p.item}</td>
                  <td className="p-4">{p.qty} {p.unit}</td>
                  <td className="p-4">
                    <div>{p.dueDate || p.deliveryDate}</div>
                    {daysLate(p.dueDate || p.deliveryDate) > 0 && p.total - p.paid > 0 && (
                      <div className="text-xs text-red-600 font-bold">{daysLate(p.dueDate || p.deliveryDate)} gün geçti</div>
                    )}
                  </td>
                  <td className="p-4 font-bold">{money(p.total)}</td>
                  <td className="p-4 font-black text-red-600">{money(p.total - p.paid)}</td>
                  <td className="p-4">
                    <Badge type={pay === "Ödendi" ? "green" : pay === "Kısmi Ödeme" ? "orange" : "red"}>{pay}</Badge>
                  </td>
                  <td className="p-4">
                    <Badge type={p.status === "Teslim Alındı" ? "green" : p.status === "İptal" ? "red" : "orange"}>{p.status}</Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <Icon icon={<Eye size={16} />} onClick={() => onView(p)} />
                      <Icon icon={<Pencil size={16} />} onClick={() => onEdit(p)} />
                      <Icon icon={<CreditCard size={16} />} onClick={() => onPay(p)} />
                      <Icon icon={<CheckCircle2 size={16} />} onClick={() => onDelivered(p)} kind="success" />
                      <Icon icon={<XCircle size={16} />} onClick={() => onNotDelivered(p)} kind="warning" />
                    </div>
                  </td>
                </tr>
              );
            })}

            {rows.length === 0 && (
              <tr>
                <td colSpan="10" className="p-10 text-center text-slate-500">Henüz kayıt yok.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Suppliers({ suppliers, onView, onDelete }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
      <h2 className="font-black text-lg mb-4">Tedarikçiler</h2>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {suppliers.map((s) => (
          <div key={s.supplier} className="border border-slate-200 rounded-2xl p-5">
            <div className="flex justify-between gap-3">
              <div>
                <h3 className="font-black">{s.supplier}</h3>
                <p className="text-sm text-slate-500">{s.city}</p>
              </div>

              <div className="flex gap-2">
                <button className="btn-light" onClick={() => onView(s)}>
                  <Eye size={16} /> Detay
                </button>
                <button className="btn-danger" onClick={() => onDelete(s.supplier)}>
                  <Trash2 size={16} /> Sil
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-5">
              <Mini label="Toplam" value={money(s.total)} />
              <Mini label="Ödenen" value={money(s.paid)} />
              <Mini label="Borç" value={money(s.debt)} danger />
            </div>
          </div>
        ))}

        {suppliers.length === 0 && <Empty text="Henüz tedarikçi yok. Yeni satın alma ekleyince burada görünecek." />}
      </div>
    </div>
  );
}

function Kpi({ icon, title, value, sub, tone, onClick }) {
  const c = {
    red: "text-red-600 bg-red-50",
    orange: "text-orange-600 bg-orange-50",
    green: "text-emerald-600 bg-emerald-50",
    blue: "text-blue-600 bg-blue-50",
  };

  return (
    <button
      onClick={onClick}
      className="text-left bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex gap-3 hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c[tone]}`}>{icon}</div>
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <h3 className={`font-black text-xl ${c[tone]?.split(" ")[0]}`}>{value}</h3>
        <p className="text-xs text-slate-500">{sub}</p>
      </div>
    </button>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-slate-200 flex justify-between sticky top-0 bg-white">
          <h2 className="font-black">{title}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <label><div className="text-sm font-bold text-slate-600 mb-2">{label}</div>{children}</label>;
}

function Info({ label, value, danger }) {
  return <div className="p-4 rounded-xl bg-slate-50 border border-slate-200"><p className="text-xs text-slate-500">{label}</p><b className={danger ? "text-red-600" : ""}>{value}</b></div>;
}

function Icon({ icon, onClick, kind }) {
  const cls =
    kind === "success"
      ? "hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
      : kind === "warning"
      ? "hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300"
      : "hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300";

  return (
    <button
      onClick={onClick}
      className={`w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center transition ${cls}`}
    >
      {icon}
    </button>
  );
}

function Mini({ label, value, danger }) {
  return <div className="p-3 rounded-xl bg-slate-50 border border-slate-200"><p className="text-xs text-slate-500">{label}</p><b className={danger ? "text-red-600" : ""}>{value}</b></div>;
}

function Empty({ text }) {
  return <div className="p-8 text-center text-slate-500">{text}</div>;
}
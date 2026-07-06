import React, { useEffect, useMemo, useState } from "react";
import {
  Package,
  Plus,
  Search,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Box,
  Wallet,
} from "lucide-react";

const STORAGE_KEY = "forgeerp_stock_items";

const starterStock = [
  {
    id: 1,
    code: "TK-001",
    name: "Karbür Freze Ø10",
    category: "Kesici Takımlar",
    brand: "YG-1",
    location: "A-01",
    quantity: 8,
    minQuantity: 5,
    unitPrice: 850,
  },
  {
    id: 2,
    code: "TK-002",
    name: "Karbür Freze Ø12",
    category: "Kesici Takımlar",
    brand: "Taegutec",
    location: "A-01",
    quantity: 2,
    minQuantity: 5,
    unitPrice: 1100,
  },
  {
    id: 3,
    code: "HM-001",
    name: "4140 Islah Çeliği",
    category: "Hammadde",
    brand: "Yerel",
    location: "Malzeme Rafı",
    quantity: 120,
    minQuantity: 50,
    unitPrice: 95,
  },
];

function Stock() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    code: "",
    name: "",
    category: "Kesici Takımlar",
    brand: "",
    location: "",
    quantity: "",
    minQuantity: "",
    unitPrice: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      setItems(JSON.parse(saved));
    } else {
      setItems(starterStock);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(starterStock));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const money = (value) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    }).format(value || 0);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const text = `${item.code} ${item.name} ${item.category} ${item.brand} ${item.location}`;
      return text.toLowerCase().includes(search.toLowerCase());
    });
  }, [items, search]);

  const summary = useMemo(() => {
    const totalItems = items.length;

    const criticalItems = items.filter(
      (item) => Number(item.quantity) <= Number(item.minQuantity)
    ).length;

    const totalValue = items.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
      0
    );

    const totalQuantity = items.reduce(
      (sum, item) => sum + Number(item.quantity),
      0
    );

    return {
      totalItems,
      criticalItems,
      totalValue,
      totalQuantity,
    };
  }, [items]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.code || !form.name) return;

    const newItem = {
      id: Date.now(),
      ...form,
      quantity: Number(form.quantity || 0),
      minQuantity: Number(form.minQuantity || 0),
      unitPrice: Number(form.unitPrice || 0),
    };

    setItems([newItem, ...items]);

    setForm({
      code: "",
      name: "",
      category: "Kesici Takımlar",
      brand: "",
      location: "",
      quantity: "",
      minQuantity: "",
      unitPrice: "",
    });
  };

  const deleteItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const getStatus = (item) => {
    if (Number(item.quantity) <= Number(item.minQuantity)) {
      return {
        text: "Kritik",
        className: "bg-red-500/10 text-red-400",
        icon: AlertTriangle,
      };
    }

    if (Number(item.quantity) <= Number(item.minQuantity) * 1.5) {
      return {
        text: "Azaldı",
        className: "bg-yellow-500/10 text-yellow-400",
        icon: AlertTriangle,
      };
    }

    return {
      text: "Yeterli",
      className: "bg-emerald-500/10 text-emerald-400",
      icon: CheckCircle,
    };
  };

  const cards = [
    {
      title: "Toplam Stok Kalemi",
      value: summary.totalItems,
      icon: Package,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      title: "Toplam Adet",
      value: summary.totalQuantity,
      icon: Box,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Kritik Stok",
      value: summary.criticalItems,
      icon: AlertTriangle,
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
    {
      title: "Stok Değeri",
      value: money(summary.totalValue),
      icon: Wallet,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 p-6">
      <div className="mb-6">
        <p className="text-sm text-slate-400">ForgeERP by EFE CNC</p>
        <h1 className="text-3xl font-bold tracking-tight">Stok Yönetimi</h1>
        <p className="text-slate-400 mt-1">
          Takım, hammadde, sarf ve atölye stoklarını buradan takip et.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="bg-[#111c33] border border-slate-800 rounded-2xl p-5 shadow-lg"
            >
              <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center mb-4`}>
                <Icon className={`w-6 h-6 ${card.color}`} />
              </div>

              <p className="text-sm text-slate-400">{card.title}</p>
              <h2 className="text-2xl font-bold mt-1">{card.value}</h2>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 bg-[#111c33] border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <Plus className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold">Yeni Stok Kartı</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="Stok Kodu"
              className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
            />

            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ürün Adı"
              className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
            />

            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
            >
              <option>Kesici Takımlar</option>
              <option>Tutucular</option>
              <option>Hammadde</option>
              <option>Standart Elemanlar</option>
              <option>Sarf Malzemeler</option>
              <option>Ölçü Aletleri</option>
            </select>

            <input
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              placeholder="Marka"
              className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
            />

            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Raf / Lokasyon"
              className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={form.quantity}
                onChange={(e) =>
                  setForm({ ...form, quantity: e.target.value })
                }
                placeholder="Adet"
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
              />

              <input
                type="number"
                value={form.minQuantity}
                onChange={(e) =>
                  setForm({ ...form, minQuantity: e.target.value })
                }
                placeholder="Min. Adet"
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <input
              type="number"
              value={form.unitPrice}
              onChange={(e) =>
                setForm({ ...form, unitPrice: e.target.value })
              }
              placeholder="Birim Fiyat"
              className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
            />

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 transition rounded-xl py-3 font-bold"
            >
              Stok Kartı Ekle
            </button>
          </form>
        </div>

        <div className="xl:col-span-2 bg-[#111c33] border border-slate-800 rounded-2xl p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl font-bold">Stok Listesi</h2>
              <p className="text-sm text-slate-400">
                Takım, malzeme ve sarf kayıtları
              </p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Stok ara..."
                className="bg-[#0f172a] border border-slate-700 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-blue-500 w-full md:w-72"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="text-left py-3">Kod</th>
                  <th className="text-left py-3">Ürün</th>
                  <th className="text-left py-3">Kategori</th>
                  <th className="text-left py-3">Raf</th>
                  <th className="text-right py-3">Adet</th>
                  <th className="text-right py-3">Min</th>
                  <th className="text-right py-3">Değer</th>
                  <th className="text-center py-3">Durum</th>
                  <th className="text-right py-3">Sil</th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.map((item) => {
                  const status = getStatus(item);
                  const StatusIcon = status.icon;

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-slate-800 hover:bg-slate-800/40 transition"
                    >
                      <td className="py-4 font-bold text-blue-400">
                        {item.code}
                      </td>

                      <td className="py-4">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-slate-500">
                          {item.brand || "-"}
                        </div>
                      </td>

                      <td className="py-4 text-slate-300">{item.category}</td>
                      <td className="py-4 text-slate-300">{item.location}</td>

                      <td className="py-4 text-right font-bold">
                        {item.quantity}
                      </td>

                      <td className="py-4 text-right text-slate-400">
                        {item.minQuantity}
                      </td>

                      <td className="py-4 text-right font-bold text-yellow-400">
                        {money(Number(item.quantity) * Number(item.unitPrice))}
                      </td>

                      <td className="py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${status.className}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {status.text}
                        </span>
                      </td>

                      <td className="py-4 text-right">
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan="9" className="py-10 text-center text-slate-500">
                      Stok kaydı bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Stock;
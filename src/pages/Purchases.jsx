import React, { useEffect, useMemo, useState } from "react";
import {
  ShoppingCart,
  Plus,
  Search,
  Trash2,
  Truck,
  Clock,
  CheckCircle,
  AlertTriangle,
  Wallet,
  PackageCheck,
  Filter,
} from "lucide-react";

import {
  purchasesData,
  purchaseStatuses,
  purchasePriorities,
  purchaseCategories,
} from "../data/purchases";

const STORAGE_KEY = "forgeerp_purchases";

function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tümü");

  const [form, setForm] = useState({
    orderNo: "",
    supplier: "",
    itemName: "",
    category: "Kesici Takımlar",
    quantity: "",
    unitPrice: "",
    requestDate: new Date().toISOString().slice(0, 10),
    expectedDate: "",
    status: "Talep",
    priority: "Orta",
    note: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      setPurchases(JSON.parse(saved));
    } else {
      setPurchases(purchasesData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(purchasesData));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(purchases));
  }, [purchases]);

  const money = (value) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    }).format(value || 0);

  const filteredPurchases = useMemo(() => {
    return purchases.filter((item) => {
      const text = `${item.orderNo} ${item.supplier} ${item.itemName} ${item.category} ${item.status} ${item.priority}`;
      const matchesSearch = text.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "Tümü" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [purchases, search, statusFilter]);

  const summary = useMemo(() => {
    const totalOrders = purchases.length;

    const waiting = purchases.filter(
      (x) => x.status === "Talep" || x.status === "Teslim Bekleniyor"
    ).length;

    const completed = purchases.filter(
      (x) => x.status === "Teslim Alındı"
    ).length;

    const totalValue = purchases.reduce(
      (sum, x) => sum + Number(x.total || Number(x.quantity) * Number(x.unitPrice)),
      0
    );

    return {
      totalOrders,
      waiting,
      completed,
      totalValue,
    };
  }, [purchases]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.orderNo || !form.supplier || !form.itemName) return;

    const quantity = Number(form.quantity || 0);
    const unitPrice = Number(form.unitPrice || 0);

    const newPurchase = {
      id: Date.now(),
      ...form,
      quantity,
      unitPrice,
      total: quantity * unitPrice,
    };

    setPurchases([newPurchase, ...purchases]);

    setForm({
      orderNo: "",
      supplier: "",
      itemName: "",
      category: "Kesici Takımlar",
      quantity: "",
      unitPrice: "",
      requestDate: new Date().toISOString().slice(0, 10),
      expectedDate: "",
      status: "Talep",
      priority: "Orta",
      note: "",
    });
  };

  const deletePurchase = (id) => {
    setPurchases(purchases.filter((item) => item.id !== id));
  };

  const updateStatus = (id, newStatus) => {
    setPurchases(
      purchases.map((item) =>
        item.id === id ? { ...item, status: newStatus } : item
      )
    );
  };

  const getStatusStyle = (status) => {
    if (status === "Teslim Alındı") {
      return {
        className: "bg-emerald-500/10 text-emerald-400",
        icon: CheckCircle,
      };
    }

    if (status === "Sipariş Verildi") {
      return {
        className: "bg-blue-500/10 text-blue-400",
        icon: Truck,
      };
    }

    if (status === "Teslim Bekleniyor") {
      return {
        className: "bg-yellow-500/10 text-yellow-400",
        icon: Clock,
      };
    }

    if (status === "İptal") {
      return {
        className: "bg-red-500/10 text-red-400",
        icon: AlertTriangle,
      };
    }

    return {
      className: "bg-purple-500/10 text-purple-400",
      icon: ShoppingCart,
    };
  };

  const getPriorityClass = (priority) => {
    if (priority === "Acil") return "bg-red-500/20 text-red-300";
    if (priority === "Yüksek") return "bg-orange-500/20 text-orange-300";
    if (priority === "Orta") return "bg-yellow-500/20 text-yellow-300";
    return "bg-emerald-500/20 text-emerald-300";
  };

  const cards = [
    {
      title: "Toplam Satın Alma",
      value: summary.totalOrders,
      icon: ShoppingCart,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      title: "Bekleyen Talep",
      value: summary.waiting,
      icon: Clock,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
    },
    {
      title: "Teslim Alınan",
      value: summary.completed,
      icon: PackageCheck,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Toplam Sipariş Değeri",
      value: money(summary.totalValue),
      icon: Wallet,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 p-6">
      <div className="mb-6">
        <p className="text-sm text-slate-400">ForgeERP by EFE CNC</p>
        <h1 className="text-3xl font-bold tracking-tight">Satın Alma</h1>
        <p className="text-slate-400 mt-1">
          Takım, hammadde, sarf ve atölye ihtiyaçlarını buradan takip et.
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
              <div
                className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center mb-4`}
              >
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
            <h2 className="text-xl font-bold">Yeni Satın Alma</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              value={form.orderNo}
              onChange={(e) => setForm({ ...form, orderNo: e.target.value })}
              placeholder="Sipariş No / Talep No"
              className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
            />

            <input
              value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              placeholder="Tedarikçi"
              className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
            />

            <input
              value={form.itemName}
              onChange={(e) => setForm({ ...form, itemName: e.target.value })}
              placeholder="Ürün / Malzeme"
              className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
            />

            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
            >
              {purchaseCategories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={form.quantity}
                onChange={(e) =>
                  setForm({ ...form, quantity: e.target.value })
                }
                placeholder="Adet / Miktar"
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
              />

              <input
                type="number"
                value={form.unitPrice}
                onChange={(e) =>
                  setForm({ ...form, unitPrice: e.target.value })
                }
                placeholder="Birim Fiyat"
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={form.requestDate}
                onChange={(e) =>
                  setForm({ ...form, requestDate: e.target.value })
                }
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
              />

              <input
                type="date"
                value={form.expectedDate}
                onChange={(e) =>
                  setForm({ ...form, expectedDate: e.target.value })
                }
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
              >
                {purchaseStatuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>

              <select
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: e.target.value })
                }
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
              >
                {purchasePriorities.map((priority) => (
                  <option key={priority}>{priority}</option>
                ))}
              </select>
            </div>

            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Not"
              rows="3"
              className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500 resize-none"
            />

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 transition rounded-xl py-3 font-bold"
            >
              Satın Alma Kaydı Ekle
            </button>
          </form>
        </div>

        <div className="xl:col-span-2 bg-[#111c33] border border-slate-800 rounded-2xl p-5">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl font-bold">Satın Alma Listesi</h2>
              <p className="text-sm text-slate-400">
                Talep, sipariş ve teslim alma süreçleri
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Satın alma ara..."
                  className="bg-[#0f172a] border border-slate-700 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-blue-500 w-full md:w-72"
                />
              </div>

              <div className="relative">
                <Filter className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[#0f172a] border border-slate-700 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-blue-500 w-full md:w-56"
                >
                  <option>Tümü</option>
                  {purchaseStatuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {filteredPurchases.map((item) => {
              const statusStyle = getStatusStyle(item.status);
              const StatusIcon = statusStyle.icon;

              return (
                <div
                  key={item.id}
                  className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 hover:border-blue-500/50 transition"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-blue-400 font-bold">
                          {item.orderNo}
                        </span>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityClass(
                            item.priority
                          )}`}
                        >
                          {item.priority}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold">{item.itemName}</h3>
                      <p className="text-sm text-slate-400 mt-1">
                        {item.supplier} • {item.category}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${statusStyle.className}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {item.status}
                      </span>

                      <button
                        onClick={() => deletePurchase(item.id)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 text-sm">
                    <div>
                      <p className="text-slate-500">Miktar</p>
                      <p className="font-bold mt-1">{item.quantity}</p>
                    </div>

                    <div>
                      <p className="text-slate-500">Birim Fiyat</p>
                      <p className="font-bold mt-1">{money(item.unitPrice)}</p>
                    </div>

                    <div>
                      <p className="text-slate-500">Toplam</p>
                      <p className="font-bold text-yellow-400 mt-1">
                        {money(item.total)}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Beklenen Teslim</p>
                      <p className="font-bold mt-1">
                        {item.expectedDate || "-"}
                      </p>
                    </div>
                  </div>

                  {item.note && (
                    <div className="mt-4 bg-[#111c33] border border-slate-800 rounded-xl p-3 text-sm text-slate-300">
                      {item.note}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {purchaseStatuses.map((status) => (
                      <button
                        key={status}
                        onClick={() => updateStatus(item.id, status)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold border transition ${
                          item.status === status
                            ? "bg-blue-600 border-blue-500 text-white"
                            : "bg-transparent border-slate-700 text-slate-400 hover:text-white hover:border-blue-500"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            {filteredPurchases.length === 0 && (
              <div className="py-16 text-center text-slate-500">
                Satın alma kaydı bulunamadı.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Purchases;
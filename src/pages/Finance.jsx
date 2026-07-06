import React, { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  CalendarDays,
  Banknote,
  CreditCard,
  AlertCircle,
} from "lucide-react";

const STORAGE_KEY = "forgeerp_finance_transactions";

const starterTransactions = [
  {
    id: 1,
    date: "2026-07-06",
    type: "income",
    category: "Tahsilat",
    title: "ABC Otomotiv - Kalıp avansı",
    amount: 45000,
    status: "paid",
    method: "Banka",
  },
  {
    id: 2,
    date: "2026-07-06",
    type: "expense",
    category: "Takım",
    title: "Freze ve karbür uç alımı",
    amount: 12500,
    status: "paid",
    method: "Kredi Kartı",
  },
  {
    id: 3,
    date: "2026-07-08",
    type: "income",
    category: "Bekleyen Tahsilat",
    title: "XYZ Makina - İş bedeli",
    amount: 28000,
    status: "pending",
    method: "Banka",
  },
  {
    id: 4,
    date: "2026-07-10",
    type: "expense",
    category: "Kira",
    title: "Atölye kira ödemesi",
    amount: 36000,
    status: "pending",
    method: "Banka",
  },
];

function Finance() {
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: "income",
    category: "",
    title: "",
    amount: "",
    status: "paid",
    method: "Banka",
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      setTransactions(JSON.parse(saved));
    } else {
      setTransactions(starterTransactions);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(starterTransactions));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }, [transactions]);

  const money = (value) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    }).format(value || 0);

  const summary = useMemo(() => {
    const paidIncome = transactions
      .filter((x) => x.type === "income" && x.status === "paid")
      .reduce((sum, x) => sum + Number(x.amount), 0);

    const paidExpense = transactions
      .filter((x) => x.type === "expense" && x.status === "paid")
      .reduce((sum, x) => sum + Number(x.amount), 0);

    const pendingIncome = transactions
      .filter((x) => x.type === "income" && x.status === "pending")
      .reduce((sum, x) => sum + Number(x.amount), 0);

    const pendingExpense = transactions
      .filter((x) => x.type === "expense" && x.status === "pending")
      .reduce((sum, x) => sum + Number(x.amount), 0);

    return {
      paidIncome,
      paidExpense,
      cash: paidIncome - paidExpense,
      pendingIncome,
      pendingExpense,
    };
  }, [transactions]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.title || !form.amount) return;

    const newTransaction = {
      id: Date.now(),
      ...form,
      amount: Number(form.amount),
    };

    setTransactions([newTransaction, ...transactions]);

    setForm({
      date: new Date().toISOString().slice(0, 10),
      type: "income",
      category: "",
      title: "",
      amount: "",
      status: "paid",
      method: "Banka",
    });
  };

  const deleteTransaction = (id) => {
    setTransactions(transactions.filter((x) => x.id !== id));
  };

  const cards = [
    {
      title: "Kasa Bakiyesi",
      value: money(summary.cash),
      icon: Wallet,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      title: "Toplam Gelir",
      value: money(summary.paidIncome),
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Toplam Gider",
      value: money(summary.paidExpense),
      icon: TrendingDown,
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
    {
      title: "Bekleyen Tahsilat",
      value: money(summary.pendingIncome),
      icon: Banknote,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 p-6">
      <div className="mb-6">
        <p className="text-sm text-slate-400">ForgeERP by EFE CNC</p>
        <h1 className="text-3xl font-bold tracking-tight">Finans Yönetimi</h1>
        <p className="text-slate-400 mt-1">
          Gelir, gider, kasa ve bekleyen ödemeleri buradan takip et.
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
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${card.bg}`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
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
            <h2 className="text-xl font-bold">Yeni Finans Hareketi</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-slate-400">Tarih</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full mt-1 bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400">İşlem Tipi</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full mt-1 bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="income">Gelir</option>
                <option value="expense">Gider</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-slate-400">Başlık</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Örn: Kalıp tahsilatı"
                className="w-full mt-1 bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400">Kategori</label>
              <input
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
                placeholder="Örn: Kira, Takım, Tahsilat"
                className="w-full mt-1 bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400">Tutar</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="Örn: 25000"
                className="w-full mt-1 bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400">Durum</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full mt-1 bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="paid">Ödendi</option>
                <option value="pending">Bekliyor</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-slate-400">Ödeme Yöntemi</label>
              <select
                value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value })}
                className="w-full mt-1 bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
              >
                <option>Banka</option>
                <option>Nakit</option>
                <option>Kredi Kartı</option>
                <option>Çek / Senet</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 transition rounded-xl py-3 font-bold"
            >
              Kaydet
            </button>
          </form>
        </div>

        <div className="xl:col-span-2 bg-[#111c33] border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold">Finans Hareketleri</h2>
              <p className="text-sm text-slate-400">
                Gelir, gider ve bekleyen ödemeler listesi
              </p>
            </div>

            <div className="hidden md:flex items-center gap-2 text-sm text-slate-400">
              <CalendarDays className="w-4 h-4" />
              Toplam {transactions.length} kayıt
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="text-left py-3">Tarih</th>
                  <th className="text-left py-3">İşlem</th>
                  <th className="text-left py-3">Kategori</th>
                  <th className="text-left py-3">Yöntem</th>
                  <th className="text-right py-3">Tutar</th>
                  <th className="text-center py-3">Durum</th>
                  <th className="text-right py-3">Sil</th>
                </tr>
              </thead>

              <tbody>
                {transactions.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-800 hover:bg-slate-800/40 transition"
                  >
                    <td className="py-4 text-slate-300">{item.date}</td>

                    <td className="py-4">
                      <div className="font-medium">{item.title}</div>
                      <div
                        className={
                          item.type === "income"
                            ? "text-emerald-400 text-xs"
                            : "text-red-400 text-xs"
                        }
                      >
                        {item.type === "income" ? "Gelir" : "Gider"}
                      </div>
                    </td>

                    <td className="py-4 text-slate-300">
                      {item.category || "-"}
                    </td>

                    <td className="py-4">
                      <div className="inline-flex items-center gap-1 text-slate-300">
                        <CreditCard className="w-4 h-4" />
                        {item.method}
                      </div>
                    </td>

                    <td
                      className={
                        item.type === "income"
                          ? "py-4 text-right font-bold text-emerald-400"
                          : "py-4 text-right font-bold text-red-400"
                      }
                    >
                      {item.type === "income" ? "+" : "-"}
                      {money(item.amount)}
                    </td>

                    <td className="py-4 text-center">
                      {item.status === "paid" ? (
                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold">
                          Ödendi
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-bold inline-flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Bekliyor
                        </span>
                      )}
                    </td>

                    <td className="py-4 text-right">
                      <button
                        onClick={() => deleteTransaction(item.id)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}

                {transactions.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-10 text-center text-slate-500">
                      Henüz finans hareketi yok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
              <p className="text-sm text-slate-400">Bekleyen Gider</p>
              <h3 className="text-xl font-bold text-red-400 mt-1">
                {money(summary.pendingExpense)}
              </h3>
            </div>

            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
              <p className="text-sm text-slate-400">Bekleyen Tahsilat</p>
              <h3 className="text-xl font-bold text-yellow-400 mt-1">
                {money(summary.pendingIncome)}
              </h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Finance;
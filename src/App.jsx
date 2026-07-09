import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import Quotes from "./pages/Quotes";
import Customers from "./pages/Customers";
import Machines from "./pages/Machines";
import Production from "./pages/Production";
import Purchases from "./pages/Purchases";
import Finance from "./pages/Finance";

function PlaceholderPage({ title }) {
  return (
    <div className="p-8">
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="text-slate-500 mt-2">
          Bu sayfa light/pro temaya sırayla geçirilecek.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  const renderPage = () => {
    switch (activePage) {
      case "Dashboard":
        return <Dashboard />;

      case "İş Takibi":
        return <Jobs />;

      case "Üretim":
        return <Production />;

      case "Müşteriler":
        return <Customers />;

      case "Teklifler":
        return <Quotes />;

      case "Makineler":
        return <Machines />;

      case "Satın Alma":
        return <Purchases />;

      case "Finans":
        return <Finance />;

      case "Stok":
        return <PlaceholderPage title="Stok" />;

      case "Ayarlar":
        return <PlaceholderPage title="Ayarlar" />;

      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />

      <main className="flex-1 min-h-screen overflow-y-auto">
        {renderPage()}
      </main>
    </div>
  );
}


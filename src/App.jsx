import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import Customers from "./pages/Customers";
import Quotes from "./pages/Quotes";
import Finance from "./pages/Finance";
import Stock from "./pages/Stock";
import Production from "./pages/Production";
import Purchases from "./pages/Purchases";
import Sidebar from "./components/Sidebar";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  return (
    <div style={styles.layout}>
      <Sidebar activePage={activePage} setActivePage={setActivePage} />

      <main style={styles.content}>
        {activePage === "Dashboard" && <Dashboard />}
        {activePage === "İş Takibi" && <Jobs />}
        {activePage === "Müşteriler" && <Customers />}
        {activePage === "Teklifler" && <Quotes />}
        {activePage === "Finans" && <Finance />}
        {activePage === "Stok" && <Stock />}
        {activePage === "Üretim" && <Production />}
        {activePage === "Satın Alma" && <Purchases />}
      </main>
    </div>
  );
}

const styles = {
  layout: {
    display: "flex",
    minHeight: "100vh",
    background: "#020617",
  },
  content: {
    flex: 1,
    overflow: "auto",
  },
};

export default App;
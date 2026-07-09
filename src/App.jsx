import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Factory,
  Hammer,
  Package,
  FlaskConical,
  CircleDot,
  Armchair,
  Settings2,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Clock,
  LockKeyhole,
} from "lucide-react";

import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import Quotes from "./pages/Quotes";
import Customers from "./pages/Customers";
import Machines from "./pages/Machines";
import Production from "./pages/Production";
import Purchases from "./pages/Purchases";
import Finance from "./pages/Finance";
import Stock from "./pages/Stock";
import Settings from "./pages/Settings";

const KEYS = {
  profile: "forge_profile",
  company: "forge_company",
  modules: "forge_modules",
  labels: "forge_labels",
  settings: "forge_settings",
  license: "forge_license",
};

const TRIAL_DAYS = 7;

function readJson(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function daysBetween(start, end) {
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor((end - start) / oneDay);
}

function getLicenseState() {
  const now = new Date();
  const saved = readJson(KEYS.license, null);

  if (!saved) {
    const trial = {
      mode: "trial",
      startedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      status: "active",
    };

    writeJson(KEYS.license, trial);

    return {
      ...trial,
      daysLeft: TRIAL_DAYS,
      expired: false,
    };
  }

  const expiresAt = new Date(saved.expiresAt);
  const expired = now > expiresAt;
  const daysLeft = Math.max(0, TRIAL_DAYS - daysBetween(new Date(saved.startedAt), now));

  return {
    ...saved,
    expired,
    daysLeft,
  };
}

function activateLicense(key) {
  const clean = key.trim().toUpperCase();

  const licensePlans = {
    "FORGE-30-DEMO": 30,
    "FORGE-90-DEMO": 90,
    "FORGE-365-DEMO": 365,
  };

  if (!licensePlans[clean]) return false;

  const now = new Date();
  const days = licensePlans[clean];

  writeJson(KEYS.license, {
    mode: "licensed",
    key: clean,
    startedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
  });

  return true;
}

const sectorProfiles = [
  {
    id: "cnc",
    title: "CNC İşleme",
    icon: Factory,
    desc: "Makine, operasyon, malzeme ve iş takibi odaklı.",
    labels: {
      job: "İş",
      quote: "Teklif",
      customer: "Müşteri",
      material: "Malzeme",
      machine: "Makine",
      operation: "Operasyon",
      stock: "Stok",
      delivery: "Termin",
    },
  },
  {
    id: "mold",
    title: "Kalıp İmalatı",
    icon: Hammer,
    desc: "Kalıp, parça, operasyon ve üretim planlama odaklı.",
    labels: {
      job: "Kalıp İşi",
      quote: "Kalıp Teklifi",
      customer: "Müşteri",
      material: "Çelik",
      machine: "Makine",
      operation: "Kalıp Operasyonu",
      stock: "Malzeme Stoku",
      delivery: "Teslim Tarihi",
    },
  },
  {
    id: "rawmaterial",
    title: "Hammadde",
    icon: Package,
    desc: "Kg, ton, ürün, depo ve sevkiyat odaklı.",
    labels: {
      job: "Sipariş",
      quote: "Fiyat Teklifi",
      customer: "Cari",
      material: "Ürün",
      machine: "Depo",
      operation: "Sevkiyat",
      stock: "Hammadde Stoku",
      delivery: "Sevkiyat Tarihi",
    },
  },
  {
    id: "chemical",
    title: "Yağ / Kimya",
    icon: FlaskConical,
    desc: "Litre, bidon, varil, yoğunluk ve ürün bazlı satış.",
    labels: {
      job: "Sipariş",
      quote: "Kimyasal Teklif",
      customer: "Bayi / Müşteri",
      material: "Ürün",
      machine: "Depo",
      operation: "Dolum / Sevkiyat",
      stock: "Kimyasal Stok",
      delivery: "Teslim Tarihi",
    },
  },
  {
    id: "polyurethane",
    title: "Poliüretan",
    icon: CircleDot,
    desc: "Çap, genişlik, shore, kg ve döküm hesapları.",
    labels: {
      job: "Döküm İşi",
      quote: "Poliüretan Teklif",
      customer: "Müşteri",
      material: "Poliüretan",
      machine: "Kalıp",
      operation: "Döküm",
      stock: "Poliüretan Stok",
      delivery: "Teslim Tarihi",
    },
  },
  {
    id: "furniture",
    title: "Mobilya",
    icon: Armchair,
    desc: "Model, renk, kumaş, ölçü ve teslimat odaklı.",
    labels: {
      job: "Sipariş",
      quote: "Mobilya Teklifi",
      customer: "Müşteri",
      material: "Ürün / Kumaş",
      machine: "Atölye",
      operation: "Üretim",
      stock: "Ürün Stoku",
      delivery: "Teslim Tarihi",
    },
  },
  {
    id: "general",
    title: "Genel Üretim",
    icon: Settings2,
    desc: "Her sektöre uyarlanabilir sade üretim profili.",
    labels: {
      job: "İş",
      quote: "Teklif",
      customer: "Müşteri",
      material: "Ürün",
      machine: "Birim",
      operation: "İşlem",
      stock: "Stok",
      delivery: "Teslim Tarihi",
    },
  },
  {
    id: "custom",
    title: "Özel Yapılandırma",
    icon: Sparkles,
    desc: "Alan isimleri ve hesaplama yapısı sonradan ayarlanabilir.",
    labels: {
      job: "İş",
      quote: "Teklif",
      customer: "Müşteri",
      material: "Ürün / Malzeme",
      machine: "Kaynak",
      operation: "İşlem",
      stock: "Stok",
      delivery: "Termin",
    },
  },
];

export default function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [licenseState, setLicenseState] = useState(() => getLicenseState());
  const [setupDone, setSetupDone] = useState(() => Boolean(localStorage.getItem(KEYS.profile)));

  const appState = useMemo(() => {
    return {
      profile: readJson(KEYS.profile, null),
      company: readJson(KEYS.company, null),
      modules: readJson(KEYS.modules, null),
      labels: readJson(KEYS.labels, null),
      settings: readJson(KEYS.settings, null),
      license: licenseState,
    };
  }, [licenseState, setupDone]);

  useEffect(() => {
    document.title = "ForgeERP Enterprise";
  }, []);

  if (licenseState.expired) {
    return (
      <LicenseGate
        licenseState={licenseState}
        onActivated={() => setLicenseState(getLicenseState())}
      />
    );
  }

  if (!setupDone) {
    return <AdaptiveSetup onFinish={() => setSetupDone(true)} />;
  }

  const pages = {
    Dashboard: <Dashboard />,
    "İş Takibi": <Jobs />,
    Jobs: <Jobs />,
    Müşteriler: <Customers />,
    Customers: <Customers />,
    Teklifler: <Quotes />,
    Quotes: <Quotes />,
    Makineler: <Machines />,
    Machines: <Machines />,
    Üretim: <Production />,
    Production: <Production />,
    "Satın Alma": <Purchases />,
    Purchases: <Purchases />,
    Finans: <Finance />,
    Finance: <Finance />,
    Stok: <Stock />,
    Stock: <Stock />,
    Ayarlar: <Settings />,
    Settings: <Settings />,
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <LicenseBar license={appState.license} profile={appState.profile} />
      <div className="flex min-h-screen">
        <Sidebar activePage={activePage} setActivePage={setActivePage} />
        <main className="flex-1 overflow-auto p-6 pt-16">
          {pages[activePage] || <Dashboard />}
        </main>
      </div>
    </div>
  );
}

function LicenseBar({ license, profile }) {
  return (
    <div className="fixed left-0 right-0 top-0 z-40 flex h-10 items-center justify-between border-b border-slate-200 bg-white/90 px-6 text-xs font-black backdrop-blur">
      <div className="flex items-center gap-2 text-slate-600">
        <ShieldCheck size={15} />
        ForgeERP v1.0 Enterprise
        <span className="text-slate-300">•</span>
        {profile?.title || "Adaptive Engine"}
      </div>

      <div className="flex items-center gap-2 text-slate-600">
        <Clock size={15} />
        {license.mode === "trial"
          ? `Trial: ${license.daysLeft} gün kaldı`
          : `Lisanslı: ${new Date(license.expiresAt).toLocaleDateString("tr-TR")}`}
      </div>
    </div>
  );
}

function LicenseGate({ licenseState, onActivated }) {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");

  function submit() {
    const ok = activateLicense(key);

    if (!ok) {
      setError("Lisans anahtarı geçersiz.");
      return;
    }

    setError("");
    onActivated();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
      <div className="w-full max-w-xl rounded-[32px] border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-slate-950">
          <LockKeyhole size={30} />
        </div>

        <p className="text-sm font-black uppercase tracking-[0.25em] text-slate-400">
          Lisans Gerekli
        </p>
        <h1 className="mt-3 text-4xl font-black">Trial süresi doldu.</h1>
        <p className="mt-4 leading-7 text-slate-300">
          ForgeERP demo süresi tamamlandı. Devam etmek için süreli lisans anahtarı girin.
        </p>

        <div className="mt-7 rounded-3xl bg-white p-4 text-slate-950">
          <label className="mb-2 block text-sm font-black text-slate-600">
            Lisans Anahtarı
          </label>
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="FORGE-30-DEMO"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg font-black outline-none"
          />

          {error && <p className="mt-3 text-sm font-bold text-red-600">{error}</p>}

          <button
            onClick={submit}
            className="mt-5 w-full rounded-2xl bg-slate-950 px-5 py-3 font-black text-white hover:bg-slate-800"
          >
            Lisansı Etkinleştir
          </button>
        </div>

        <div className="mt-5 rounded-2xl bg-white/10 p-4 text-sm text-slate-300">
          Demo anahtarları: <b>FORGE-30-DEMO</b>, <b>FORGE-90-DEMO</b>,{" "}
          <b>FORGE-365-DEMO</b>
        </div>
      </div>
    </div>
  );
}

function AdaptiveSetup({ onFinish }) {
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState("");
  const [selectedSector, setSelectedSector] = useState("cnc");
  const [currency, setCurrency] = useState("TRY");

  const selectedProfile = useMemo(
    () => sectorProfiles.find((p) => p.id === selectedSector) || sectorProfiles[0],
    [selectedSector]
  );

  function finishSetup() {
    const now = new Date().toISOString();

    const company = {
      name: companyName.trim() || "EFE CNC",
      authorized: "",
      phone: "",
      email: "",
      taxOffice: "",
      taxNumber: "",
      address: "",
      logo: "",
      createdAt: now,
      updatedAt: now,
    };

    const profile = {
      id: selectedProfile.id,
      title: selectedProfile.title,
      description: selectedProfile.desc,
      createdAt: now,
      updatedAt: now,
    };

    const modules = {
      dashboard: true,
      jobs: true,
      customers: true,
      quotes: true,
      machines: true,
      production: true,
      purchases: true,
      finance: true,
      stock: true,
      settings: true,
    };

    const settings = {
      currency,
      vatRate: 20,
      withholdingRate: 0,
      theme: "Light",
      activeYear: new Date().getFullYear(),
      activeMonth: new Date().getMonth() + 1,
      license: {
        product: "ForgeERP Enterprise",
        licensedTo: company.name,
        version: "1.0.0",
        build: "1001",
        branch: "document-engine-v2",
        engine: "Adaptive Engine v1",
      },
      lastSetupAt: now,
    };

    writeJson(KEYS.company, company);
    writeJson(KEYS.profile, profile);
    writeJson(KEYS.modules, modules);
    writeJson(KEYS.labels, selectedProfile.labels);
    writeJson(KEYS.settings, settings);

    onFinish();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#1e40af55,transparent_35%),radial-gradient(circle_at_bottom_right,#0f766e44,transparent_35%)]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-6xl rounded-[32px] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-lg">
                <span className="text-2xl font-black">F</span>
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">ForgeERP</h1>
                <p className="text-sm text-slate-300">by EFE CNC • Adaptive Engine</p>
              </div>
            </div>

            <div className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-slate-200">
              Adım {step} / 4
            </div>
          </div>

          <div className="overflow-hidden rounded-[28px] bg-white text-slate-950 shadow-xl">
            {step === 1 && (
              <SetupPanel
                eyebrow="Hoş geldiniz"
                title="ForgeERP işletmenize göre kendini yapılandırır."
                desc="İlk kurulumda birkaç bilgi alacağız. Sonra sistem sektörünüze uygun şekilde açılacak."
              >
                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  <InfoCard title="Sektöre Uyum" desc="CNC, hammadde, kimya, poliüretan ve daha fazlası." />
                  <InfoCard title="Tek Altyapı" desc="Aynı ERP, farklı sektörlerde farklı davranır." />
                  <InfoCard title="Demo Gücü" desc="Müşteriye ilk açılışta profesyonel deneyim sunar." />
                </div>

                <div className="mt-8 flex justify-end">
                  <PrimaryButton onClick={() => setStep(2)}>
                    Başlayalım <ArrowRight size={18} />
                  </PrimaryButton>
                </div>
              </SetupPanel>
            )}

            {step === 2 && (
              <SetupPanel
                eyebrow="Firma"
                title="Firmanızın adını yazın."
                desc="Bu bilgi lisans, firma kartı ve sistem ayarlarında kullanılacak."
              >
                <div className="mt-8 max-w-xl">
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Firma adı
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <Building2 size={20} className="text-slate-500" />
                    <input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Örn: EFE CNC KALIP"
                      className="w-full bg-transparent text-lg font-semibold outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-between">
                  <SecondaryButton onClick={() => setStep(1)}>Geri</SecondaryButton>
                  <PrimaryButton onClick={() => setStep(3)}>
                    Devam <ArrowRight size={18} />
                  </PrimaryButton>
                </div>
              </SetupPanel>
            )}

            {step === 3 && (
              <SetupPanel
                eyebrow="Sektör Profili"
                title="ForgeERP hangi sektöre hitap etsin?"
                desc="Bu seçim teklif, stok, üretim ve dashboard terimlerinin temelini oluşturacak."
              >
                <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {sectorProfiles.map((profile) => {
                    const Icon = profile.icon;
                    const active = selectedSector === profile.id;

                    return (
                      <button
                        key={profile.id}
                        onClick={() => setSelectedSector(profile.id)}
                        className={`rounded-3xl border p-5 text-left transition-all hover:-translate-y-1 hover:shadow-xl ${
                          active
                            ? "border-slate-950 bg-slate-950 text-white shadow-xl"
                            : "border-slate-200 bg-white text-slate-900 hover:border-slate-400"
                        }`}
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <div
                            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                              active ? "bg-white text-slate-950" : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            <Icon size={23} />
                          </div>
                          {active && <CheckCircle2 size={22} />}
                        </div>
                        <h3 className="font-black">{profile.title}</h3>
                        <p className={`mt-2 text-sm ${active ? "text-slate-300" : "text-slate-500"}`}>
                          {profile.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-8 flex justify-between">
                  <SecondaryButton onClick={() => setStep(2)}>Geri</SecondaryButton>
                  <PrimaryButton onClick={() => setStep(4)}>
                    Devam <ArrowRight size={18} />
                  </PrimaryButton>
                </div>
              </SetupPanel>
            )}

            {step === 4 && (
              <SetupPanel
                eyebrow="Son Kontrol"
                title="ForgeERP kuruluma hazır."
                desc="Seçimlerin kaydedilecek ve sistem normal ERP ekranına geçecek."
              >
                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  <SummaryCard label="Firma" value={companyName || "EFE CNC"} />
                  <SummaryCard label="Sektör" value={selectedProfile.title} />
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-bold text-slate-500">Para Birimi</p>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-black outline-none"
                    >
                      <option value="TRY">TRY / ₺</option>
                      <option value="USD">USD / $</option>
                      <option value="EUR">EUR / €</option>
                      <option value="GBP">GBP / £</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white">
                  <p className="text-sm font-bold text-slate-300">Adaptive Engine alanları</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    {Object.entries(selectedProfile.labels).map(([key, value]) => (
                      <div key={key} className="rounded-2xl bg-white/10 px-4 py-3">
                        <p className="text-xs uppercase text-slate-400">{key}</p>
                        <p className="font-bold">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 flex justify-between">
                  <SecondaryButton onClick={() => setStep(3)}>Geri</SecondaryButton>
                  <PrimaryButton onClick={finishSetup}>
                    ForgeERP'yi Başlat <ArrowRight size={18} />
                  </PrimaryButton>
                </div>
              </SetupPanel>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SetupPanel({ eyebrow, title, desc, children }) {
  return (
    <section className="p-8 md:p-10">
      <p className="mb-3 text-sm font-black uppercase tracking-[0.25em] text-slate-500">
        {eyebrow}
      </p>
      <h2 className="max-w-3xl text-3xl font-black tracking-tight md:text-5xl">
        {title}
      </h2>
      <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-500">
        {desc}
      </p>
      {children}
    </section>
  );
}

function InfoCard({ title, desc }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="font-black">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{desc}</p>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-3 text-xl font-black">{value}</p>
    </div>
  );
}

function PrimaryButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800"
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl border border-slate-200 bg-white px-6 py-3 font-black text-slate-700 transition hover:bg-slate-50"
    >
      {children}
    </button>
  );
}
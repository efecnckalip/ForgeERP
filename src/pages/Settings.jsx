import { useMemo, useRef, useState } from "react";
import {
  Building2,
  ImagePlus,
  Users,
  ShieldCheck,
  CalendarDays,
  Percent,
  Coins,
  Download,
  Upload,
  Database,
  FileJson,
  Server,
  BadgeCheck,
  Trash2,
  Plus,
  Save,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

const COMPANY_KEY = "forge_company";
const USERS_KEY = "forge_users";
const ROLES_KEY = "forge_roles";
const PERIOD_KEY = "forge_period";
const SETTINGS_KEY = "forge_settings";
const PROFILE_KEY = "forge_profile";
const LABELS_KEY = "forge_labels";

const FORGE_KEYS = [
  "forge_company",
  "forge_users",
  "forge_roles",
  "forge_period",
  "forge_settings",
  "forge_profile",
  "forge_labels",
  "forge_modules",
  "forge_jobs",
  "forge_quotes",
  "forge_customers",
  "forge_machines",
  "forge_production",
  "forge_purchases",
  "forge_finance",
  "forge_stock",
];

const defaultCompany = {
  name: "EFE CNC KALIP",
  authorized: "Yasin Kulak",
  phone: "",
  email: "",
  taxOffice: "",
  taxNumber: "",
  address: "",
  logo: "",
};

const defaultUsers = [
  { id: 1, name: "Yasin Kulak", role: "Admin", active: true },
  { id: 2, name: "Operatör", role: "Operatör", active: true },
  { id: 3, name: "Muhasebe", role: "Muhasebe", active: true },
];

const defaultRoles = {
  Admin: {
    Dashboard: true,
    Jobs: true,
    CRM: true,
    Quotes: true,
    Machines: true,
    Production: true,
    Purchases: true,
    Finance: true,
    Stock: true,
    Settings: true,
  },
  Operatör: {
    Dashboard: true,
    Jobs: true,
    CRM: true,
    Quotes: true,
    Machines: true,
    Production: true,
    Purchases: false,
    Finance: false,
    Stock: true,
    Settings: false,
  },
  Muhasebe: {
    Dashboard: true,
    Jobs: false,
    CRM: true,
    Quotes: true,
    Machines: false,
    Production: false,
    Purchases: true,
    Finance: true,
    Stock: false,
    Settings: false,
  },
};

const defaultSettings = {
  vatRate: 20,
  withholdingRate: 0,
  currency: "TRY",
  lastBackupAt: "",
  lastRestoreAt: "",
  license: {
    product: "ForgeERP Enterprise",
    licensedTo: "EFE CNC",
    version: "1.0.0",
    build: "1001",
    branch: "document-engine-v2",
  },
};

function readJson(key, fallback) {
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

export default function Settings() {
  const importRef = useRef(null);
  const logoRef = useRef(null);

  const [company, setCompany] = useState(() => readJson(COMPANY_KEY, defaultCompany));
  const [users, setUsers] = useState(() => readJson(USERS_KEY, defaultUsers));
  const [roles, setRoles] = useState(() => readJson(ROLES_KEY, defaultRoles));
  const [period, setPeriod] = useState(() =>
    readJson(PERIOD_KEY, {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
    })
  );
  const [settings, setSettings] = useState(() => readJson(SETTINGS_KEY, defaultSettings));
  const [profile] = useState(() => readJson(PROFILE_KEY, { title: "CNC İşleme", id: "cnc" }));
  const [labels] = useState(() => readJson(LABELS_KEY, {}));

  const [toast, setToast] = useState("");
  const [newUser, setNewUser] = useState({ name: "", role: "Operatör" });
  const [confirmClear, setConfirmClear] = useState(false);
  const [showStorageDetails, setShowStorageDetails] = useState(false);
  const [showRoleDetails, setShowRoleDetails] = useState(false);
  const [showAdaptiveDetails, setShowAdaptiveDetails] = useState(false);

  const storageStats = useMemo(() => {
    return FORGE_KEYS.map((key) => {
      const raw = localStorage.getItem(key);
      let count = 0;

      try {
        const parsed = raw ? JSON.parse(raw) : null;
        if (Array.isArray(parsed)) count = parsed.length;
        else if (parsed && typeof parsed === "object") count = Object.keys(parsed).length;
      } catch {
        count = raw ? 1 : 0;
      }

      return {
        key,
        exists: Boolean(raw),
        count,
        sizeKb: raw ? raw.length / 1024 : 0,
        size: raw ? `${(raw.length / 1024).toFixed(1)} KB` : "0 KB",
      };
    });
  }, [toast]);

  const storageSummary = useMemo(() => {
    return {
      totalSize: `${storageStats.reduce((s, x) => s + x.sizeKb, 0).toFixed(1)} KB`,
      totalRecords: storageStats.reduce((s, x) => s + x.count, 0),
      activeGroups: storageStats.filter((x) => x.exists).length,
    };
  }, [storageStats]);

  function notify(message) {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  }

  function saveCompany() {
    writeJson(COMPANY_KEY, { ...company, updatedAt: new Date().toISOString() });
    notify("Firma bilgileri kaydedildi.");
  }

  function saveSettings() {
    const now = new Date().toISOString();

    writeJson(COMPANY_KEY, { ...company, updatedAt: now });
    writeJson(SETTINGS_KEY, { ...settings, updatedAt: now });
    writeJson(PERIOD_KEY, period);
    writeJson(ROLES_KEY, roles);
    writeJson(USERS_KEY, users);

    notify("Tüm ayarlar kaydedildi.");
  }

  function addUser() {
    if (!newUser.name.trim()) return notify("Kullanıcı adı boş olamaz.");

    const item = {
      id: Date.now(),
      name: newUser.name.trim(),
      role: newUser.role,
      active: true,
    };

    const next = [item, ...users];
    setUsers(next);
    writeJson(USERS_KEY, next);
    setNewUser({ name: "", role: "Operatör" });
    notify("Kullanıcı eklendi.");
  }

  function deleteUser(id) {
    if (!window.confirm("Bu kullanıcı silinsin mi?")) return;
    const next = users.filter((u) => u.id !== id);
    setUsers(next);
    writeJson(USERS_KEY, next);
    notify("Kullanıcı silindi.");
  }

  function toggleRole(role, module) {
    const next = {
      ...roles,
      [role]: {
        ...roles[role],
        [module]: !roles[role][module],
      },
    };

    setRoles(next);
    writeJson(ROLES_KEY, next);
  }

  function handleLogo(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const next = { ...company, logo: reader.result };
      setCompany(next);
      writeJson(COMPANY_KEY, next);
      notify("Logo kaydedildi.");
    };
    reader.readAsDataURL(file);
  }

  function buildBackup() {
    const data = {
      app: "ForgeERP",
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      keys: {},
    };

    FORGE_KEYS.forEach((key) => {
      const value = localStorage.getItem(key);
      if (value !== null) data.keys[key] = value;
    });

    return data;
  }

  function downloadJson(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  }

  function backupNow() {
    const now = new Date().toISOString();
    const nextSettings = { ...settings, lastBackupAt: now };

    setSettings(nextSettings);
    writeJson(SETTINGS_KEY, nextSettings);

    downloadJson(`forgeerp-v1-backup-${now.slice(0, 10)}.json`, buildBackup());
    notify("Yedek indirildi.");
  }

  function exportData() {
    downloadJson(`forgeerp-data-${new Date().toISOString().slice(0, 10)}.json`, buildBackup());
    notify("Veriler dışa aktarıldı.");
  }

  function importData(file) {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);

        if (!parsed.keys || typeof parsed.keys !== "object") {
          notify("Geçersiz yedek dosyası.");
          return;
        }

        Object.entries(parsed.keys).forEach(([key, value]) => {
          if (key.startsWith("forge_")) localStorage.setItem(key, value);
        });

        const now = new Date().toISOString();
        const nextSettings = {
          ...readJson(SETTINGS_KEY, defaultSettings),
          lastRestoreAt: now,
        };

        writeJson(SETTINGS_KEY, nextSettings);
        notify("Yedek geri yüklendi. Sayfa yenileniyor.");

        setTimeout(() => window.location.reload(), 900);
      } catch {
        notify("JSON okunamadı.");
      }
    };

    reader.readAsText(file);
  }

  function clearKey(key) {
    if (!window.confirm(`${key} verisi temizlensin mi?`)) return;
    localStorage.removeItem(key);
    notify(`${key} temizlendi.`);
  }

  function clearAllData() {
    FORGE_KEYS.forEach((key) => localStorage.removeItem(key));
    notify("Tüm ForgeERP verileri temizlendi.");
    setTimeout(() => window.location.reload(), 900);
  }

  const roleModules = Object.keys(defaultRoles.Admin);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {toast && (
        <div className="fixed right-6 top-6 z-50 flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-2xl">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-slate-500">
            ForgeERP v1.0 Enterprise
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Ayarlar</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Firma, kullanıcı, yetki, yedekleme, lisans ve sistem yönetimi.
          </p>
        </div>

        <button
          onClick={saveSettings}
          className="flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800"
        >
          <Save size={18} />
          Ayarları Kaydet
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2" icon={Building2} title="Firma Bilgileri">
          <div className="grid gap-3 md:grid-cols-2">
            <Input label="Firma Adı" value={company.name} onChange={(v) => setCompany({ ...company, name: v })} />
            <Input label="Yetkili" value={company.authorized} onChange={(v) => setCompany({ ...company, authorized: v })} />
            <Input label="Telefon" value={company.phone} onChange={(v) => setCompany({ ...company, phone: v })} />
            <Input label="E-Mail" value={company.email} onChange={(v) => setCompany({ ...company, email: v })} />
            <Input label="Vergi Dairesi" value={company.taxOffice} onChange={(v) => setCompany({ ...company, taxOffice: v })} />
            <Input label="Vergi No" value={company.taxNumber} onChange={(v) => setCompany({ ...company, taxNumber: v })} />
          </div>

          <div className="mt-3">
            <Input label="Adres" value={company.address} onChange={(v) => setCompany({ ...company, address: v })} />
          </div>

          <div className="mt-4 flex justify-end">
            <button onClick={saveCompany} className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white">
              Firma Bilgilerini Kaydet
            </button>
          </div>
        </Card>

        <Card icon={ImagePlus} title="Logo Yönetimi">
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
            {company.logo ? (
              <img src={company.logo} alt="Firma Logo" className="max-h-24 object-contain" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-950 text-4xl font-black text-white">
                F
              </div>
            )}

            <input
              ref={logoRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              className="hidden"
              onChange={(e) => handleLogo(e.target.files?.[0])}
            />

            <button
              onClick={() => logoRef.current?.click()}
              className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black transition hover:bg-slate-100"
            >
              Logo Seç
            </button>

            <p className="mt-2 text-center text-xs font-medium text-slate-500">
              PNG, JPG veya SVG desteklenir.
            </p>
          </div>
        </Card>

        <Card className="xl:col-span-3" icon={SettingsIcon} title="Adaptive Engine">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                Aktif Sektör
              </p>
              <h3 className="mt-1 text-xl font-black">{profile.title}</h3>
              <p className="mt-1 text-sm font-bold text-slate-500">
                Sektör profili ve alan isimleri.
              </p>
            </div>

            <button
              onClick={() => setShowAdaptiveDetails(!showAdaptiveDetails)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              {showAdaptiveDetails ? "Detayları Gizle" : "Detayları Göster"}
            </button>
          </div>

          {showAdaptiveDetails && (
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              {Object.entries(labels).map(([key, value]) => (
                <div key={key} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-black uppercase text-slate-400">{key}</p>
                  <p className="mt-1 text-sm font-black">{value}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="xl:col-span-2" icon={Users} title="Kullanıcılar">
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_160px_auto]">
            <input
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              placeholder="Yeni kullanıcı adı"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold outline-none"
            />
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold outline-none"
            >
              <option>Admin</option>
              <option>Operatör</option>
              <option>Muhasebe</option>
            </select>
            <button onClick={addUser} className="flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white">
              <Plus size={16} />
              Ekle
            </button>
          </div>

          <div className="space-y-2">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <p className="font-black">{user.name}</p>
                  <p className="text-xs font-bold text-slate-500">{user.role}</p>
                </div>
                <button
                  onClick={() => deleteUser(user.id)}
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-bold text-red-600 hover:bg-red-100"
                >
                  Sil
                </button>
              </div>
            ))}
          </div>
        </Card>

        <Card icon={CalendarDays} title="Aktif Dönem">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Yıl" type="number" value={period.year} onChange={(v) => setPeriod({ ...period, year: Number(v) })} />
            <Select
              label="Ay"
              value={period.month}
              onChange={(v) => setPeriod({ ...period, month: Number(v) })}
              options={[
                [1, "Ocak"], [2, "Şubat"], [3, "Mart"], [4, "Nisan"],
                [5, "Mayıs"], [6, "Haziran"], [7, "Temmuz"], [8, "Ağustos"],
                [9, "Eylül"], [10, "Ekim"], [11, "Kasım"], [12, "Aralık"],
              ]}
            />
          </div>
        </Card>

        <Card className="xl:col-span-3" icon={ShieldCheck} title="Yetkiler">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500">
                Admin, Operatör ve Muhasebe rol yetkileri.
              </p>
              <p className="mt-1 text-xs font-bold text-slate-400">
                Detaylar sadece ihtiyaç halinde açılır.
              </p>
            </div>

            <button
              onClick={() => setShowRoleDetails(!showRoleDetails)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              {showRoleDetails ? "Yetkileri Gizle" : "Yetkileri Göster"}
            </button>
          </div>

          {showRoleDetails && (
            <div className="mt-4 overflow-auto">
              <table className="w-full min-w-[760px] border-separate border-spacing-y-1 text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500">
                    <th className="px-3 py-1.5">Modül</th>
                    <th className="px-3 py-1.5">Admin</th>
                    <th className="px-3 py-1.5">Operatör</th>
                    <th className="px-3 py-1.5">Muhasebe</th>
                  </tr>
                </thead>
                <tbody>
                  {roleModules.map((module) => (
                    <tr key={module} className="bg-slate-50">
                      <td className="rounded-l-2xl px-3 py-2 font-black">{module}</td>
                      {["Admin", "Operatör", "Muhasebe"].map((role) => (
                        <td key={role} className="px-3 py-2 last:rounded-r-2xl">
                          <button
                            onClick={() => toggleRole(role, module)}
                            className={`rounded-xl px-3 py-1.5 text-xs font-black ${
                              roles?.[role]?.[module]
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-200 text-slate-500"
                            }`}
                          >
                            {roles?.[role]?.[module] ? "Açık" : "Kapalı"}
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card icon={Percent} title="Vergi / KDV">
          <div className="grid grid-cols-2 gap-3">
            <Input label="KDV %" type="number" value={settings.vatRate} onChange={(v) => setSettings({ ...settings, vatRate: Number(v) })} />
            <Input label="Stopaj %" type="number" value={settings.withholdingRate} onChange={(v) => setSettings({ ...settings, withholdingRate: Number(v) })} />
          </div>
        </Card>

        <Card icon={Coins} title="Para Birimi">
          <Select
            label="Varsayılan Para Birimi"
            value={settings.currency}
            onChange={(v) => setSettings({ ...settings, currency: v })}
            options={[
              ["TRY", "TRY / ₺"],
              ["USD", "USD / $"],
              ["EUR", "EUR / €"],
              ["GBP", "GBP / £"],
            ]}
          />
        </Card>

        <Card icon={Download} title="Yedek Al">
          <p className="text-sm font-medium text-slate-500">
            Tüm ForgeERP localStorage verilerini JSON yedek olarak indirir.
          </p>
          <button onClick={backupNow} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white">
            <Download size={16} />
            Yedek Oluştur
          </button>
          <p className="mt-2 text-xs font-bold text-slate-400">
            Son yedek: {settings.lastBackupAt ? new Date(settings.lastBackupAt).toLocaleString("tr-TR") : "Yok"}
          </p>
        </Card>

        <Card icon={Upload} title="Yedekten Geri Yükle">
          <p className="text-sm font-medium text-slate-500">
            Daha önce alınmış ForgeERP JSON yedeğini geri yükler.
          </p>
          <input
            ref={importRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => importData(e.target.files?.[0])}
          />
          <button onClick={() => importRef.current?.click()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black">
            <Upload size={16} />
            JSON Seç ve Yükle
          </button>
          <p className="mt-2 text-xs font-bold text-slate-400">
            Son geri yükleme: {settings.lastRestoreAt ? new Date(settings.lastRestoreAt).toLocaleString("tr-TR") : "Yok"}
          </p>
        </Card>

        <Card icon={FileJson} title="Verileri Dışa Aktar">
          <p className="text-sm font-medium text-slate-500">
            Demo verisini taşımak veya arşivlemek için dışa aktar.
          </p>
          <button onClick={exportData} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white">
            <FileJson size={16} />
            JSON Dışa Aktar
          </button>
        </Card>

        <Card className="xl:col-span-2" icon={Database} title="Veri Durumu">
          <div className="grid gap-3 md:grid-cols-3">
            <InfoLine label="Toplam Alan" value={storageSummary.totalSize} />
            <InfoLine label="Aktif Kayıt" value={storageSummary.totalRecords} />
            <InfoLine label="Veri Grubu" value={storageSummary.activeGroups} />
          </div>

          <button
            onClick={() => setShowStorageDetails(!showStorageDetails)}
            className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            {showStorageDetails ? "Detayları Gizle" : "Detayları Göster"}
          </button>

          {showStorageDetails && (
            <div className="mt-4 space-y-2">
              {storageStats.map((item) => (
                <div
                  key={item.key}
                  className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-black">{item.key}</p>
                    <p className="text-[11px] font-bold text-slate-500">
                      {item.exists ? "Aktif veri var" : "Veri yok"}
                    </p>
                  </div>
                  <span className="rounded-xl bg-white px-3 py-1.5 text-xs font-black">{item.count}</span>
                  <span className="rounded-xl bg-white px-3 py-1.5 text-xs font-black">{item.size}</span>
                  <button
                    onClick={() => clearKey(item.key)}
                    className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100"
                  >
                    Temizle
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card icon={Server} title="Sistem Bilgisi">
          <InfoLine label="Uygulama" value="ForgeERP" />
          <InfoLine label="Sürüm" value="v1.0 Enterprise" />
          <InfoLine label="Branch" value="document-engine-v2" />
          <InfoLine label="Veri Katmanı" value="LocalStorage" />
          <InfoLine label="Adaptive Engine" value={profile.title} />
        </Card>

        <Card icon={BadgeCheck} title="Lisans Bilgisi">
          <div className="rounded-3xl bg-slate-950 p-4 text-white">
            <p className="text-sm font-bold text-slate-400">Licensed To</p>
            <h3 className="mt-1 text-xl font-black">
              {company.name || settings.license?.licensedTo || "EFE CNC"}
            </h3>
            <div className="mt-4 space-y-1.5 text-sm font-bold text-slate-300">
              <p>Product: {settings.license?.product || "ForgeERP Enterprise"}</p>
              <p>Version: {settings.license?.version || "1.0.0"}</p>
              <p>Build: {settings.license?.build || "1001"}</p>
            </div>
          </div>
        </Card>

        <Card className="xl:col-span-3" icon={BadgeCheck} title="ForgeERP Hakkında">
          <div className="rounded-[28px] bg-slate-950 p-6 text-white">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
                  ForgeERP Enterprise
                </p>
                <h2 className="mt-3 text-4xl font-black tracking-tight">
                  ForgeERP v1.0.0
                </h2>

                <div className="mt-5 inline-flex rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white">
                  Designed & Developed by Yasin Kulak
                </div>

                <p className="mt-5 max-w-2xl text-sm font-medium leading-7 text-slate-300">
                  EFE CNC için geliştirilmeye başlandı. Bugün üretim işletmelerine uyum
                  sağlayabilen adaptif bir ERP platformuna dönüşüyor.
                </p>
              </div>

              <div className="rounded-3xl bg-white/10 px-5 py-4 text-right">
                <p className="text-xs font-black uppercase text-slate-400">Build</p>
                <p className="mt-1 text-3xl font-black">1001</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <AboutItem label="Version" value="1.0.0" />
              <AboutItem label="Branch" value="document-engine-v2" />
              <AboutItem label="Document Engine" value="2.0" />
              <AboutItem label="Adaptive Engine" value="1.0" />
              <AboutItem label="Database" value="LocalStorage Engine" />
              <AboutItem label="Framework" value="React + Vite" />
              <AboutItem label="UI" value="Tailwind CSS" />
              <AboutItem label="License" value="Enterprise" />
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {[
                "Dashboard Enterprise",
                "Jobs Enterprise",
                "CRM Pro",
                "Quotes Pro v2",
                "Machines Enterprise",
                "Production Planning",
                "Purchases Enterprise v4",
                "Finance Enterprise v2",
                "Stock Enterprise Basic v1",
                "Settings Enterprise",
                "Document Engine 2.0",
                "Adaptive Engine",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3"
                >
                  <span className="text-sm font-bold text-slate-200">{item}</span>
                  <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-black text-emerald-300">
                    LOCK
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-white/10 pt-5 text-sm text-slate-300">
              <p>
                <b className="text-white">Powered by:</b> EFE CNC
              </p>
              <p className="mt-4 text-xs text-slate-500">
                © 2026 ForgeERP Enterprise. All Rights Reserved.
              </p>
            </div>
          </div>
        </Card>

        <Card className="xl:col-span-3" icon={Trash2} title="Veri Temizleme">
          <div className="rounded-3xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-4">
              <AlertTriangle className="mt-1 text-red-600" />
              <div>
                <h3 className="text-xl font-black text-red-700">
                  Dikkat: Bu işlem geri alınamaz.
                </h3>
                <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-red-600">
                  Tüm müşteriler, işler, teklifler, üretim, satın alma, finans, stok,
                  ayarlar ve firma bilgileri temizlenir. Demo öncesi mutlaka yedek alın.
                </p>
              </div>
            </div>

            {!confirmClear ? (
              <button
                onClick={() => setConfirmClear(true)}
                className="mt-4 rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-black text-white hover:bg-red-700"
              >
                Veri Temizleme Panelini Aç
              </button>
            ) : (
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={clearAllData}
                  className="flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-black text-white hover:bg-red-700"
                >
                  <Trash2 size={16} />
                  Evet, Tüm Verileri Sil
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-slate-700"
                >
                  <X size={16} />
                  İptal
                </button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Card({ icon: Icon, title, children, className = "" }) {
  return (
    <section className={`rounded-3xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
          <Icon size={18} />
        </div>
        <h2 className="text-base font-black">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Input({ label, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-black text-slate-600">{label}</span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold outline-none transition focus:border-slate-400 focus:bg-white"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-black text-slate-600">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold outline-none transition focus:border-slate-400 focus:bg-white"
      >
        {options.map(([val, text]) => (
          <option key={val} value={val}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}

function InfoLine({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-2.5">
      <span className="text-xs font-bold text-slate-500">{label}</span>
      <span className="text-sm font-black">{value}</span>
    </div>
  );
}

function AboutItem({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/10 px-4 py-3">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function SettingsIcon(props) {
  return <RefreshCw {...props} />;
}
import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "forgeerp_machines";

const emptyMachine = {
  name: "",
  type: "CNC İşleme",
  status: "idle",
  operator: "",
  note: "",
};

const statusLabels = {
  idle: "Boş",
  production: "Üretimde",
  maintenance: "Bakımda",
  passive: "Pasif",
};

const statusStyles = {
  idle: "bg-emerald-50 text-emerald-700 border-emerald-200",
  production: "bg-blue-50 text-blue-700 border-blue-200",
  maintenance: "bg-amber-50 text-amber-700 border-amber-200",
  passive: "bg-slate-100 text-slate-600 border-slate-200",
};

function readMachines() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveMachines(machines) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(machines));
  window.dispatchEvent(new Event("forgeerp:machines-updated"));
}

function safe(value) {
  return value || "—";
}

export default function Machines() {
  const [machines, setMachines] = useState([]);
  const [form, setForm] = useState(emptyMachine);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    setMachines(readMachines());
  }, []);

  const stats = useMemo(
    () => ({
      total: machines.length,
      idle: machines.filter((m) => m.status === "idle").length,
      production: machines.filter((m) => m.status === "production").length,
      maintenance: machines.filter((m) => m.status === "maintenance").length,
    }),
    [machines]
  );

  const filteredMachines = useMemo(() => {
    if (filter === "all") return machines;
    return machines.filter((m) => m.status === filter);
  }, [machines, filter]);

  function addMachine(e) {
    e.preventDefault();

    const newMachine = {
      id: crypto.randomUUID(),
      ...form,
      createdAt: new Date().toISOString(),
    };

    const updated = [newMachine, ...machines];
    setMachines(updated);
    saveMachines(updated);
    setForm(emptyMachine);
  }

  function updateMachine(id, changes) {
    const updated = machines.map((machine) =>
      machine.id === id ? { ...machine, ...changes } : machine
    );

    setMachines(updated);
    saveMachines(updated);
  }

  function deleteMachine(id) {
    if (!window.confirm("Bu makineyi silmek istediğine emin misin?")) return;

    const updated = machines.filter((machine) => machine.id !== id);
    setMachines(updated);
    saveMachines(updated);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mb-6">
        <h1 className="text-2xl font-black">Makineler</h1>
        <p className="text-sm text-slate-500">
          Atölyedeki makineleri, durumlarını ve operatör bilgisini yönet.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <Stat title="Toplam Makine" value={stats.total} active={filter === "all"} onClick={() => setFilter("all")} />
        <Stat title="Boş" value={stats.idle} active={filter === "idle"} onClick={() => setFilter("idle")} />
        <Stat title="Üretimde" value={stats.production} active={filter === "production"} onClick={() => setFilter("production")} />
        <Stat title="Bakımda" value={stats.maintenance} active={filter === "maintenance"} onClick={() => setFilter("maintenance")} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_1fr]">
        <form
          onSubmit={addMachine}
          className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 className="mb-4 text-lg font-black">Yeni Makine</h2>

          <div className="space-y-4">
            <Field label="Makine Adı">
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
                placeholder="Örn: AWEA BM1200"
              />
            </Field>

            <Field label="Makine Türü">
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="input"
              >
                <option>CNC İşleme</option>
                <option>CNC Torna</option>
                <option>Dik İşleme</option>
                <option>Tel Erezyon</option>
                <option>Taşlama</option>
                <option>Ölçüm</option>
                <option>Diğer</option>
              </select>
            </Field>

            <Field label="Durum">
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="input"
              >
                <option value="idle">Boş</option>
                <option value="production">Üretimde</option>
                <option value="maintenance">Bakımda</option>
                <option value="passive">Pasif</option>
              </select>
            </Field>

            <Field label="Operatör">
              <input
                value={form.operator}
                onChange={(e) => setForm({ ...form, operator: e.target.value })}
                className="input"
                placeholder="Örn: Yasin"
              />
            </Field>

            <Field label="Not">
              <textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="textarea"
                placeholder="Bakım, kapasite, özel not..."
              />
            </Field>

            <button className="h-11 w-full rounded-2xl bg-slate-900 text-sm font-black text-white hover:bg-slate-800">
              Makine Ekle
            </button>
          </div>
        </form>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-lg font-black">Makine Listesi</h2>
            <p className="text-sm text-slate-400">
              {filteredMachines.length} kayıt listeleniyor
            </p>
          </div>

          {filteredMachines.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              Bu filtrede makine bulunamadı.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-2">
              {filteredMachines.map((machine) => (
                <div
                  key={machine.id}
                  className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">
                        {safe(machine.name)}
                      </h3>
                      <p className="text-sm font-semibold text-slate-500">
                        {safe(machine.type)}
                      </p>
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-black ${statusStyles[machine.status]}`}
                    >
                      {statusLabels[machine.status]}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Info label="Operatör" value={safe(machine.operator)} />
                    <Info label="Durum" value={statusLabels[machine.status]} />
                  </div>

                  {machine.note && (
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">
                      {machine.note}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <select
                      value={machine.status}
                      onChange={(e) =>
                        updateMachine(machine.id, { status: e.target.value })
                      }
                      className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold"
                    >
                      <option value="idle">Boş</option>
                      <option value="production">Üretimde</option>
                      <option value="maintenance">Bakımda</option>
                      <option value="passive">Pasif</option>
                    </select>

                    <button
                      onClick={() => deleteMachine(machine.id)}
                      className="h-9 rounded-xl border border-red-100 bg-red-50 px-3 text-xs font-bold text-red-600 hover:bg-red-100"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .input {
          width: 100%;
          height: 42px;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 0 12px;
          font-size: 14px;
          outline: none;
          background: white;
        }

        .textarea {
          width: 100%;
          min-height: 90px;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 12px;
          font-size: 14px;
          outline: none;
          resize: vertical;
        }

        .input:focus,
        .textarea:focus {
          border-color: #0f172a;
        }
      `}</style>
    </div>
  );
}

function Stat({ title, value, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition ${
        active
          ? "border-slate-900 ring-2 ring-slate-100"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <p className="mb-1 text-xs font-bold text-slate-500">{label}</p>
      {children}
    </label>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-900">{value}</p>
    </div>
  );
}
import { useMemo, useState } from "react";
import {
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  Factory,
  CalendarDays,
} from "lucide-react";

const STORAGE_KEY = "forge_jobs";

export default function Dashboard() {
  const [selectedType, setSelectedType] = useState(null);

  const jobs = useMemo(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  const lists = {
    active: jobs.filter((j) => j.status !== "Tamamlandı"),
    waiting: jobs.filter((j) => j.status === "Bekliyor"),
    delayed: jobs.filter(
      (j) => j.deadline && j.deadline < today && j.status !== "Tamamlandı"
    ),
    completed: jobs.filter((j) => j.status === "Tamamlandı"),
  };

  const selectedJobs = selectedType ? lists[selectedType.key] : [];

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-8">
        <div className="inline-flex rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-bold text-blue-600 shadow-sm">
          ForgeERP by EFE CNC
        </div>

        <h1 className="mt-3 text-3xl font-black text-slate-950">
          Dashboard
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Atölye üretim durumu ve genel iş takibi.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Aktif İş"
          value={lists.active.length}
          note="Devam eden işler"
          icon={<Activity size={22} />}
          onClick={() => setSelectedType({ key: "active", title: "Aktif İşler" })}
        />

        <StatCard
          title="Bekleyen İş"
          value={lists.waiting.length}
          note="Başlamayı bekleyen işler"
          icon={<Clock size={22} />}
          onClick={() =>
            setSelectedType({ key: "waiting", title: "Bekleyen İşler" })
          }
        />

        <StatCard
          title="Geciken İş"
          value={lists.delayed.length}
          note="Termin geçmiş işler"
          icon={<AlertTriangle size={22} />}
          onClick={() =>
            setSelectedType({ key: "delayed", title: "Geciken İşler" })
          }
        />

        <StatCard
          title="Tamamlanan"
          value={lists.completed.length}
          note="Kapanmış işler"
          icon={<CheckCircle2 size={22} />}
          onClick={() =>
            setSelectedType({ key: "completed", title: "Tamamlanan İşler" })
          }
        />
      </div>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">
          Genel Durum
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Üretim sayfasına iş ekledikçe buradaki kartlar otomatik güncellenir.
          Kartlara tıklayınca ilgili işler listelenir.
        </p>
      </div>

      {selectedType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  {selectedType.title}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Toplam {selectedJobs.length} iş bulundu.
                </p>
              </div>

              <button
                onClick={() => setSelectedType(null)}
                className="rounded-2xl bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            {selectedJobs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-slate-400">
                Bu grupta iş yok kanka.
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {selectedJobs.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-black text-blue-600">
                          {job.code}
                        </p>

                        <h3 className="mt-1 text-lg font-black text-slate-950">
                          {job.part}
                        </h3>

                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          {job.customer}
                        </p>
                      </div>

                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-600">
                        {job.status}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                      <InfoBox
                        icon={<Factory size={15} />}
                        label="Makine"
                        value={job.machine}
                      />

                      <InfoBox
                        icon={<CalendarDays size={15} />}
                        label="Termin"
                        value={job.deadline}
                      />

                      <InfoBox
                        label="Öncelik"
                        value={job.priority}
                      />
                    </div>

                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-500">İlerleme</span>
                        <span className="text-slate-900">%{job.progress}</span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, note, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-black text-slate-500">{title}</p>
          <h3 className="mt-3 text-3xl font-black text-slate-950">
            {value}
          </h3>
        </div>

        <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
          {icon}
        </div>
      </div>

      <p className="mt-4 text-xs font-semibold text-slate-400">{note}</p>
    </button>
  );
}

function InfoBox({ icon, label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <p className="flex items-center gap-2 text-xs font-bold text-slate-400">
        {icon}
        {label}
      </p>

      <p className="mt-1 text-sm font-black text-slate-800">
        {value || "-"}
      </p>
    </div>
  );
}
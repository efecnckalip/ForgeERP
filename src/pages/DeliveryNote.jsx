import { useMemo, useState } from "react";
import {
  Truck,
  Plus,
  Search,
  Printer,
  Trash2,
  Eye,
  X,
  Building2,
  CalendarDays,
  PackageCheck,
  FileText,
  ClipboardCheck,
  User,
  MapPin,
} from "lucide-react";

const DELIVERY_STORAGE_KEY = "forge_delivery_notes_v2";
const COMPANY_STORAGE_KEY = "forge_company_profile";

const DEFAULT_COMPANY_PROFILE = {
  name: "Firma Ünvanı",
  subtitle: "ForgeERP by EFE CNC",
  address: "",
  phone: "",
  email: "",
  website: "",
  taxOffice: "",
  taxNumber: "",
  logoUrl: "",
  footer: "Bu belge ForgeERP Document Engine 2.0 ile oluşturulmuştur.",
};

function getCompanyProfile() {
  try {
    const saved = localStorage.getItem(COMPANY_STORAGE_KEY);
    if (!saved) return DEFAULT_COMPANY_PROFILE;

    return {
      ...DEFAULT_COMPANY_PROFILE,
      ...JSON.parse(saved),
    };
  } catch {
    return DEFAULT_COMPANY_PROFILE;
  }
}

const emptyForm = {
  customer: "",
  customerAddress: "",
  customerPhone: "",
  deliveryNo: "",
  date: new Date().toISOString().slice(0, 10),
  vehiclePlate: "",
  driverName: "",
  receiverName: "",
  deliveryType: "Standart Sevk",
  relatedJobNo: "",
  relatedQuoteNo: "",
  material: "",
  description: "",
  items: [{ name: "", material: "", quantity: "1", unit: "Adet", note: "" }],
};

export default function DeliveryNote() {
  const company = getCompanyProfile();

  const [notes, setNotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(DELIVERY_STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });

  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [selectedNote, setSelectedNote] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const text = `${note.customer} ${note.deliveryNo} ${note.relatedJobNo} ${note.relatedQuoteNo}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [notes, search]);

  const thisMonthCount = notes.filter(
    (n) => n.date?.slice(0, 7) === new Date().toISOString().slice(0, 7)
  ).length;

  const customerCount = new Set(notes.map((n) => n.customer).filter(Boolean)).size;

  function saveNotes(nextNotes) {
    setNotes(nextNotes);
    localStorage.setItem(DELIVERY_STORAGE_KEY, JSON.stringify(nextNotes));
  }

  function createDeliveryNo() {
    const year = new Date().getFullYear();
    const next = notes.length + 1;
    return `SVK-${year}-${String(next).padStart(4, "0")}`;
  }

  function openNewForm() {
    setForm({
      ...emptyForm,
      deliveryNo: createDeliveryNo(),
      date: new Date().toISOString().slice(0, 10),
    });
    setShowForm(true);
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateItem(index, field, value) {
    const nextItems = [...form.items];
    nextItems[index][field] = value;
    setForm({ ...form, items: nextItems });
  }

  function addItem() {
    setForm({
      ...form,
      items: [
        ...form.items,
        { name: "", material: "", quantity: "1", unit: "Adet", note: "" },
      ],
    });
  }

  function removeItem(index) {
    const nextItems = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items: nextItems.length ? nextItems : emptyForm.items });
  }

  function saveForm() {
    if (!form.customer.trim()) {
      alert("Müşteri adı zorunlu.");
      return;
    }

    const newNote = {
      id: crypto.randomUUID(),
      ...form,
      createdAt: new Date().toISOString(),
      status: "Kayıtlı",
    };

    const nextNotes = [newNote, ...notes];
    saveNotes(nextNotes);
    setSelectedNote(newNote);
    setShowForm(false);
  }

  function deleteNote(id) {
    const ok = confirm("Bu sevk formu silinsin mi?");
    if (!ok) return;

    const nextNotes = notes.filter((note) => note.id !== id);
    saveNotes(nextNotes);

    if (selectedNote?.id === id) {
      setSelectedNote(null);
    }
  }

  function printSelected() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-neutral-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Header onNew={openNewForm} />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Toplam Evrak" value={notes.length} icon={<FileText size={21} />} />
          <StatCard title="Bu Ay" value={thisMonthCount} icon={<CalendarDays size={21} />} />
          <StatCard title="Müşteri" value={customerCount} icon={<Building2 size={21} />} />
          <StatCard title="Motor" value="Doc 2.0" icon={<ClipboardCheck size={21} />} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <aside className="xl:col-span-4 bg-white rounded-[28px] border border-neutral-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-neutral-100">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-neutral-400" size={18} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Sevk no, müşteri, iş no ara..."
                  className="w-full h-11 pl-10 pr-4 rounded-2xl bg-neutral-100 border border-neutral-200 outline-none focus:bg-white focus:border-neutral-900 transition"
                />
              </div>
            </div>

            <div className="max-h-[620px] overflow-auto divide-y divide-neutral-100">
              {filteredNotes.length === 0 ? (
                <EmptyList />
              ) : (
                filteredNotes.map((note) => (
                  <div key={note.id} className="p-5 hover:bg-neutral-50 transition">
                    <div className="flex items-start justify-between gap-3">
                      <button
                        onClick={() => setSelectedNote(note)}
                        className="text-left flex-1"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{note.deliveryNo}</span>
                          <span className="text-[11px] px-2 py-1 rounded-full bg-neutral-900 text-white">
                            {note.status || "Kayıtlı"}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-700 mt-1">{note.customer}</p>
                        <p className="text-xs text-neutral-400 mt-1">
                          {note.date} · {note.items?.length || 0} kalem
                        </p>
                      </button>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedNote(note)}
                          className="w-9 h-9 rounded-xl border border-neutral-200 flex items-center justify-center hover:bg-white"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="w-9 h-9 rounded-xl border border-neutral-200 flex items-center justify-center hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>

          <main className="xl:col-span-8">
            {selectedNote ? (
              <DeliveryPreview note={selectedNote} company={company} onPrint={printSelected} />
            ) : (
              <NoSelection onNew={openNewForm} />
            )}
          </main>
        </div>
      </div>

      {showForm && (
        <FormModal
          form={form}
          updateField={updateField}
          updateItem={updateItem}
          addItem={addItem}
          removeItem={removeItem}
          onClose={() => setShowForm(false)}
          onSave={saveForm}
        />
      )}

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }

          #delivery-print, #delivery-print * {
            visibility: visible;
          }

          #delivery-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            box-shadow: none;
            border: none;
            border-radius: 0;
          }

          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function Header({ onNew }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-neutral-950 text-white flex items-center justify-center shadow-sm">
          <Truck size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Premium Sevk Formu</h1>
          <p className="text-sm text-neutral-500">
            Document Engine 2.0 · İrsaliye / Teslim Evrakı
          </p>
        </div>
      </div>

      <button
        onClick={onNew}
        className="h-11 px-5 rounded-2xl bg-neutral-950 text-white flex items-center justify-center gap-2 hover:bg-neutral-800 transition shadow-sm"
      >
        <Plus size={18} />
        Yeni Sevk Formu
      </button>
    </div>
  );
}

function DeliveryPreview({ note, company, onPrint }) {
  return (
    <div className="bg-white rounded-[28px] border border-neutral-200 shadow-sm overflow-hidden">
      <div className="no-print p-5 border-b border-neutral-100 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">{note.deliveryNo}</h2>
          <p className="text-sm text-neutral-500">{note.customer}</p>
        </div>

        <button
          onClick={onPrint}
          className="h-10 px-4 rounded-2xl bg-neutral-950 text-white flex items-center gap-2"
        >
          <Printer size={17} />
          Yazdır / PDF
        </button>
      </div>

      <div id="delivery-print" className="p-8 bg-white">
        <div className="border border-neutral-200 rounded-[26px] overflow-hidden">
          <div className="p-7 flex items-start justify-between border-b-4 border-neutral-950">
            <div className="flex gap-4 items-center">
              <div className="w-24 h-24 rounded-3xl border border-neutral-200 bg-neutral-50 flex items-center justify-center overflow-hidden">
                {company.logoUrl ? (
                  <img
                    src={company.logoUrl}
                    alt={company.name}
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <span className="text-xs font-semibold text-neutral-400">LOGO</span>
                )}
              </div>

              <div>
                <h1 className="text-2xl font-bold text-neutral-950">
                  {company.name || "Firma Ünvanı"}
                </h1>
                <p className="text-sm text-neutral-500">{company.subtitle}</p>
                <p className="text-sm mt-2">{company.address || "Firma adresi ayarlardan girilecek"}</p>
                <p className="text-sm">
                  {[company.phone, company.email, company.website].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-neutral-500">DOCUMENT ENGINE 2.0</p>
              <h2 className="text-3xl font-bold tracking-tight mt-1">SEVK FORMU</h2>
              <p className="text-sm mt-3">No: {note.deliveryNo}</p>
              <p className="text-sm">Tarih: {note.date}</p>
            </div>
          </div>

          <div className="p-7">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PremiumInfo icon={<Building2 size={18} />} title="Müşteri" value={note.customer} sub={note.customerPhone} />
              <PremiumInfo icon={<Truck size={18} />} title="Sevk Tipi" value={note.deliveryType} sub={note.vehiclePlate || "Plaka girilmedi"} />
              <PremiumInfo icon={<ClipboardCheck size={18} />} title="Bağlantı" value={note.relatedJobNo || "İş no yok"} sub={note.relatedQuoteNo || "Teklif no yok"} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              <InfoBox title="Teslimat Adresi" icon={<MapPin size={17} />}>
                {note.customerAddress || "-"}
              </InfoBox>
              <InfoBox title="Teslim Bilgileri" icon={<User size={17} />}>
                <p>Şoför: {note.driverName || "-"}</p>
                <p>Teslim Alan: {note.receiverName || "-"}</p>
              </InfoBox>
            </div>

            <table className="w-full mt-7 border-collapse text-sm">
              <thead>
                <tr className="bg-neutral-950 text-white">
                  <th className="border border-neutral-950 p-3 text-left w-12">#</th>
                  <th className="border border-neutral-950 p-3 text-left">Ürün / Parça</th>
                  <th className="border border-neutral-950 p-3 text-left w-32">Malzeme</th>
                  <th className="border border-neutral-950 p-3 text-left w-24">Adet</th>
                  <th className="border border-neutral-950 p-3 text-left">Açıklama</th>
                </tr>
              </thead>
              <tbody>
                {note.items.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-neutral-200 p-3">{index + 1}</td>
                    <td className="border border-neutral-200 p-3 font-medium">{item.name || "-"}</td>
                    <td className="border border-neutral-200 p-3">{item.material || note.material || "-"}</td>
                    <td className="border border-neutral-200 p-3">{item.quantity || "-"}</td>
                    <td className="border border-neutral-200 p-3">{item.note || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {note.description && (
              <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm">
                <b>Sevk Notu</b>
                <p className="mt-1 text-neutral-700">{note.description}</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-6 mt-14 text-center text-sm">
              <Signature title="Teslim Eden" />
              <Signature title="Teslim Alan" />
              <Signature title="Kaşe / İmza" />
            </div>

            <div className="mt-8 pt-4 border-t border-neutral-200 flex items-center justify-between text-[11px] text-neutral-500">
              <span>
                Vergi Dairesi: {company.taxOffice || "-"} · Vergi No: {company.taxNumber || "-"}
              </span>
              <span>{company.footer}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormModal({
  form,
  updateField,
  updateItem,
  addItem,
  removeItem,
  onClose,
  onSave,
}) {
  return (
    <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-6xl rounded-[30px] shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Yeni Premium Sevk Formu</h2>
            <p className="text-sm text-neutral-500">Müşteri, sevk ve ürün bilgilerini doldur.</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-2xl hover:bg-neutral-100">
            <X size={22} className="mx-auto" />
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-auto space-y-6">
          <Section title="Evrak Bilgileri">
            <Input label="Sevk No" value={form.deliveryNo} onChange={(v) => updateField("deliveryNo", v)} />
            <Input label="Tarih" type="date" value={form.date} onChange={(v) => updateField("date", v)} />
            <Select
              label="Sevk Tipi"
              value={form.deliveryType}
              onChange={(v) => updateField("deliveryType", v)}
              options={["Standart Sevk", "Numune Sevki", "Tamir / Revizyon", "Üretim Teslim", "Kısmi Teslim"]}
            />
            <Input label="İlgili İş No" value={form.relatedJobNo} onChange={(v) => updateField("relatedJobNo", v)} />
            <Input label="İlgili Teklif No" value={form.relatedQuoteNo} onChange={(v) => updateField("relatedQuoteNo", v)} />
            <Input label="Genel Malzeme" value={form.material} onChange={(v) => updateField("material", v)} />
          </Section>

          <Section title="Müşteri Bilgileri">
            <Input label="Müşteri / Firma" value={form.customer} onChange={(v) => updateField("customer", v)} />
            <Input label="Telefon" value={form.customerPhone} onChange={(v) => updateField("customerPhone", v)} />
            <InputWide label="Adres" value={form.customerAddress} onChange={(v) => updateField("customerAddress", v)} />
          </Section>

          <Section title="Sevk Bilgileri">
            <Input label="Araç Plakası" value={form.vehiclePlate} onChange={(v) => updateField("vehiclePlate", v)} />
            <Input label="Şoför" value={form.driverName} onChange={(v) => updateField("driverName", v)} />
            <Input label="Teslim Alan" value={form.receiverName} onChange={(v) => updateField("receiverName", v)} />
            <InputWide label="Açıklama" value={form.description} onChange={(v) => updateField("description", v)} />
          </Section>

          <div className="bg-neutral-50 rounded-3xl border border-neutral-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Sevk Edilen Ürünler</h3>
              <button onClick={addItem} className="h-10 px-4 rounded-2xl bg-neutral-950 text-white text-sm">
                Ürün Ekle
              </button>
            </div>

            <div className="space-y-3">
              {form.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2">
                  <input
                    className="col-span-12 md:col-span-4 h-11 rounded-2xl border border-neutral-200 bg-white px-3 outline-none"
                    placeholder="Ürün / Parça adı"
                    value={item.name}
                    onChange={(e) => updateItem(index, "name", e.target.value)}
                  />
                  <input
                    className="col-span-6 md:col-span-2 h-11 rounded-2xl border border-neutral-200 bg-white px-3 outline-none"
                    placeholder="Malzeme"
                    value={item.material}
                    onChange={(e) => updateItem(index, "material", e.target.value)}
                  />
                  <input
                    className="col-span-3 md:col-span-2 h-11 rounded-2xl border border-neutral-200 bg-white px-3 outline-none"
                    placeholder="Adet"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", e.target.value)}
                  />
                  <input
                    className="col-span-3 md:col-span-1 h-11 rounded-2xl border border-neutral-200 bg-white px-3 outline-none"
                    placeholder="Birim"
                    value={item.unit}
                    onChange={(e) => updateItem(index, "unit", e.target.value)}
                  />
                  <input
                    className="col-span-11 md:col-span-2 h-11 rounded-2xl border border-neutral-200 bg-white px-3 outline-none"
                    placeholder="Açıklama"
                    value={item.note}
                    onChange={(e) => updateItem(index, "note", e.target.value)}
                  />
                  <button
                    onClick={() => removeItem(index)}
                    className="col-span-1 h-11 rounded-2xl border border-neutral-200 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={16} className="mx-auto" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-neutral-100 flex justify-end gap-3">
          <button onClick={onClose} className="h-11 px-5 rounded-2xl border border-neutral-200">
            Vazgeç
          </button>
          <button onClick={onSave} className="h-11 px-5 rounded-2xl bg-neutral-950 text-white">
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white rounded-[26px] border border-neutral-200 shadow-sm p-5 flex items-center justify-between">
      <div>
        <p className="text-sm text-neutral-500">{title}</p>
        <p className="text-2xl font-semibold mt-1">{value}</p>
      </div>
      <div className="w-11 h-11 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-800">
        {icon}
      </div>
    </div>
  );
}

function EmptyList() {
  return (
    <div className="p-10 text-center">
      <Truck className="mx-auto text-neutral-300" size={42} />
      <p className="mt-3 font-medium">Henüz sevk formu yok</p>
      <p className="text-sm text-neutral-500 mt-1">Yeni evrak oluşturunca burada listelenir.</p>
    </div>
  );
}

function NoSelection({ onNew }) {
  return (
    <div className="bg-white rounded-[28px] border border-neutral-200 shadow-sm p-12 text-center min-h-[420px] flex flex-col items-center justify-center">
      <div className="w-20 h-20 rounded-3xl bg-neutral-100 flex items-center justify-center">
        <FileText size={38} className="text-neutral-400" />
      </div>
      <h2 className="mt-5 text-xl font-semibold">Evrak seçilmedi</h2>
      <p className="text-sm text-neutral-500 mt-2 max-w-md">
        Soldan bir sevk formu seçebilir veya yeni premium irsaliye oluşturabilirsin.
      </p>
      <button
        onClick={onNew}
        className="mt-6 h-11 px-5 rounded-2xl bg-neutral-950 text-white flex items-center gap-2"
      >
        <Plus size={18} />
        Yeni Sevk Formu
      </button>
    </div>
  );
}

function PremiumInfo({ icon, title, value, sub }) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex items-center gap-2 text-neutral-500 text-sm">
        {icon}
        {title}
      </div>
      <p className="font-semibold mt-2">{value || "-"}</p>
      <p className="text-xs text-neutral-500 mt-1">{sub || "-"}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-neutral-50 rounded-3xl border border-neutral-200 p-5">
      <h3 className="font-semibold mb-4">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{children}</div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-neutral-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full h-11 rounded-2xl border border-neutral-200 bg-white px-3 outline-none focus:border-neutral-950"
      />
    </label>
  );
}

function InputWide({ label, value, onChange }) {
  return (
    <label className="block md:col-span-3">
      <span className="text-sm font-medium text-neutral-600">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full h-11 rounded-2xl border border-neutral-200 bg-white px-3 outline-none focus:border-neutral-950"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-neutral-600">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full h-11 rounded-2xl border border-neutral-200 bg-white px-3 outline-none focus:border-neutral-950"
      >
        {options.map((opt) => (
          <option key={opt}>{opt}</option>
        ))}
      </select>
    </label>
  );
}

function InfoBox({ title, icon, children }) {
  return (
    <div className="rounded-3xl border border-neutral-200 p-4 text-sm">
      <div className="flex items-center gap-2 font-semibold mb-2">
        {icon}
        {title}
      </div>
      <div className="text-neutral-700 leading-relaxed">{children}</div>
    </div>
  );
}

function Signature({ title }) {
  return (
    <div>
      <div className="h-20 border-b border-neutral-400"></div>
      <p className="mt-2 font-medium">{title}</p>
    </div>
  );
}
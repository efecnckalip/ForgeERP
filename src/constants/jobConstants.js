export const JOB_STATUSES = [
  "Bekliyor",
  "CAM",
  "CNC",
  "Kontrol",
  "Tamamlandı",
  "Beklemede",
  "İptal",
];

export const JOB_PRIORITIES = [
  "Düşük",
  "Orta",
  "Yüksek",
  "Acil",
];

export const JOB_MACHINES = [
  "AWEA BM1200",
  "CNC Dik İşleme",
  "CNC Torna",
  "Kalıp Taşlama",
  "Manuel İşlem",
  "Dış Operasyon",
];

export const JOB_OPERATORS = [
  "Yasin",
  "Operatör 1",
  "Operatör 2",
  "CAM",
  "Dış Kaynak",
];

export const JOB_MATERIALS = [
  "2738",
  "4140",
  "4140 QT",
  "1.2311",
  "1.2344",
  "1.2083",
  "Alüminyum",
  "Paslanmaz",
  "Pirinç",
  "Plastik",
  "Diğer",
];

export const DEFAULT_JOB = {
  jobNo: "",
  customerId: "",
  customer: "",

  partName: "",
  drawingNo: "",
  revision: "",

  quantity: 1,
  material: "",

  machine: "",
  operator: "",

  priority: "Orta",
  status: "Bekliyor",

  startDate: "",
  dueDate: "",

  estimatedHours: 0,
  completedHours: 0,

  amount: 0,

  quoteId: "",
  orderNo: "",

  notes: "",
};
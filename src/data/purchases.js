export const purchaseStatuses = [
  "Talep",
  "Sipariş Verildi",
  "Teslim Bekleniyor",
  "Teslim Alındı",
  "İptal",
];

export const purchasePriorities = ["Düşük", "Orta", "Yüksek", "Acil"];

export const purchaseCategories = [
  "Kesici Takımlar",
  "Hammadde",
  "Sarf Malzemeler",
  "Standart Elemanlar",
  "Ölçü Aletleri",
  "Makine Bakım",
  "Diğer",
];

export const purchasesData = [
  {
    id: 1,
    orderNo: "PO-2026-001",
    supplier: "YG-1 Türkiye",
    itemName: "Karbür Freze Ø10",
    category: "Kesici Takımlar",
    quantity: 10,
    unitPrice: 850,
    total: 8500,
    requestDate: "2026-07-06",
    expectedDate: "2026-07-09",
    status: "Sipariş Verildi",
    priority: "Yüksek",
    note: "Stok kritik seviyede.",
  },
  {
    id: 2,
    orderNo: "PO-2026-002",
    supplier: "Yerel Çelikçi",
    itemName: "4140 Islah Çeliği",
    category: "Hammadde",
    quantity: 120,
    unitPrice: 95,
    total: 11400,
    requestDate: "2026-07-06",
    expectedDate: "2026-07-11",
    status: "Teslim Bekleniyor",
    priority: "Orta",
    note: "Kalıp işi için alınacak.",
  },
  {
    id: 3,
    orderNo: "PO-2026-003",
    supplier: "Taegutec",
    itemName: "Karbür Freze Ø12",
    category: "Kesici Takımlar",
    quantity: 5,
    unitPrice: 1100,
    total: 5500,
    requestDate: "2026-07-05",
    expectedDate: "2026-07-08",
    status: "Talep",
    priority: "Acil",
    note: "Üretim bekliyor.",
  },
];
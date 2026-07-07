// ForgeERP Period System 1.0
// Ay / yıl / dönem yönetimi merkezi dosyası

export const MONTHS_TR = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

export function getToday() {
  return new Date();
}

export function padMonth(month) {
  return String(month).padStart(2, "0");
}

export function getPeriodFromDate(date = new Date()) {
  const d = new Date(date);

  const year = d.getFullYear();
  const month = d.getMonth() + 1;

  return {
    year,
    month,
    monthName: MONTHS_TR[month - 1],
    period: `${year}-${padMonth(month)}`,
    periodKey: `${year}_${padMonth(month)}`,
    label: `${MONTHS_TR[month - 1]} ${year}`,
  };
}

export function getCurrentPeriod() {
  return getPeriodFromDate(new Date());
}

export function getStorageKey(moduleName, period) {
  const activePeriod = period || getCurrentPeriod();

  return `forgeerp_${moduleName}_${activePeriod.periodKey}`;
}

export function addPeriodToRecord(record, dateField = "createdAt") {
  const date = record?.[dateField] || new Date().toISOString();
  const periodData = getPeriodFromDate(date);

  return {
    ...record,
    createdAt: record.createdAt || new Date().toISOString(),
    period: periodData.period,
    periodKey: periodData.periodKey,
    year: periodData.year,
    month: periodData.month,
    monthName: periodData.monthName,
  };
}

export function getRecentPeriods(count = 12) {
  const periods = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    periods.push(getPeriodFromDate(d));
  }

  return periods;
}

export function isSamePeriod(date, period) {
  const datePeriod = getPeriodFromDate(date);
  return datePeriod.period === period.period;
}

export function formatDateTR(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
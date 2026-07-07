// ForgeERP Core 2.0
// Merkezi ERP hesaplama motoru
// Dashboard, Jobs, Quotes ve ileride Finance buradan beslenecek

export function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function formatMoney(value = 0) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export function formatDate(date) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function isJobCompleted(job) {
  return job?.status === "Tamamlandı";
}

export function isJobWaiting(job) {
  return job?.status === "Bekliyor";
}

export function isJobActive(job) {
  return job && !isJobCompleted(job);
}

export function isJobDelayed(job) {
  const today = getTodayISO();

  return Boolean(
    job?.deadline &&
      job.deadline < today &&
      !isJobCompleted(job)
  );
}

export function getJobsSummary(jobs = []) {
  const active = jobs.filter(isJobActive);
  const waiting = jobs.filter(isJobWaiting);
  const completed = jobs.filter(isJobCompleted);
  const delayed = jobs.filter(isJobDelayed);

  return {
    total: jobs.length,
    active,
    waiting,
    completed,
    delayed,
    activeCount: active.length,
    waitingCount: waiting.length,
    completedCount: completed.length,
    delayedCount: delayed.length,
  };
}

export function getQuotesSummary(quotes = []) {
  const totalAmount = quotes.reduce(
    (sum, quote) => sum + (Number(quote.totalPrice) || Number(quote.total) || 0),
    0
  );

  const approved = quotes.filter(
    (quote) => quote.status === "Onaylandı"
  );

  const pending = quotes.filter(
    (quote) => quote.status === "Bekliyor"
  );

  const rejected = quotes.filter(
    (quote) => quote.status === "Reddedildi"
  );

  return {
    total: quotes.length,
    totalAmount,
    approved,
    pending,
    rejected,
    approvedCount: approved.length,
    pendingCount: pending.length,
    rejectedCount: rejected.length,
  };
}

export function getRiskLevel(jobs = []) {
  const summary = getJobsSummary(jobs);

  if (summary.delayedCount >= 3) {
    return {
      level: "high",
      title: "Yüksek Risk",
      message: "Geciken işler artmış. Üretim takibi gerekli.",
    };
  }

  if (summary.waitingCount >= 3) {
    return {
      level: "medium",
      title: "Orta Risk",
      message: "Bekleyen işler yoğunlaşıyor. Planlama kontrol edilmeli.",
    };
  }

  return {
    level: "low",
    title: "Kontrol Altında",
    message: "İş akışı şu an dengeli görünüyor.",
  };
}

export function getERPPeriodSummary({ jobs = [], quotes = [] }) {
  const jobsSummary = getJobsSummary(jobs);
  const quotesSummary = getQuotesSummary(quotes);
  const risk = getRiskLevel(jobs);

  return {
    jobs: jobsSummary,
    quotes: quotesSummary,
    risk,
  };
}

export function getJobSourceLabel(job) {
  if (job?.quoteNo) return "Tekliften Gelen İş";
  return "Manuel Oluşturulan İş";
}

export function getJobAmount(job) {
  return Number(job?.quoteAmount || job?.totalPrice || job?.amount || 0);
}

export function sortByNewest(items = []) {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.date || 0);
    const dateB = new Date(b.createdAt || b.date || 0);

    return dateB - dateA;
  });
}
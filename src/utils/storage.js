// ForgeERP Storage Manager 1.0
// Tüm localStorage işlemleri tek merkezden yönetilir.

const KEYS = {
  jobs: "forgeerp_jobs",
  quotes: "forgeerp_quotes",
  activePeriod: "forgeerp_active_period",
};

export function readStorage(key, fallback = []) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function getJobs() {
  return readStorage(KEYS.jobs, []);
}

export function saveJobs(jobs) {
  writeStorage(KEYS.jobs, jobs);
  writeStorage("jobs", jobs);
  window.dispatchEvent(new Event("forgeerp:jobs-updated"));
}

export function addJob(job) {
  const jobs = getJobs();
  const updated = [job, ...jobs];

  saveJobs(updated);

  if (job.periodKey) {
    const periodKey = `forgeerp_jobs_${job.periodKey}`;
    const periodJobs = readStorage(periodKey, []);
    writeStorage(periodKey, [job, ...periodJobs]);
  }

  return updated;
}

export function updateJob(id, changes) {
  const jobs = getJobs();

  const updated = jobs.map((job) =>
    job.id === id ? { ...job, ...changes } : job
  );

  saveJobs(updated);

  Object.keys(localStorage).forEach((key) => {
    if (!key.startsWith("forgeerp_jobs_")) return;

    const periodJobs = readStorage(key, []);
    const updatedPeriodJobs = periodJobs.map((job) =>
      job.id === id ? { ...job, ...changes } : job
    );

    writeStorage(key, updatedPeriodJobs);
  });

  return updated;
}

export function deleteJob(id) {
  const jobs = getJobs();
  const updated = jobs.filter((job) => job.id !== id);

  saveJobs(updated);

  Object.keys(localStorage).forEach((key) => {
    if (!key.startsWith("forgeerp_jobs_")) return;

    const periodJobs = readStorage(key, []);
    const updatedPeriodJobs = periodJobs.filter((job) => job.id !== id);

    writeStorage(key, updatedPeriodJobs);
  });

  return updated;
}

export function getQuotes() {
  return readStorage(KEYS.quotes, []);
}

export function saveQuotes(quotes) {
  writeStorage(KEYS.quotes, quotes);
  window.dispatchEvent(new Event("forgeerp:quotes-updated"));
}

export function addQuote(quote) {
  const quotes = getQuotes();
  const updated = [quote, ...quotes];

  saveQuotes(updated);

  if (quote.periodKey) {
    const periodKey = `forgeerp_quotes_${quote.periodKey}`;
    const periodQuotes = readStorage(periodKey, []);
    writeStorage(periodKey, [quote, ...periodQuotes]);
  }

  return updated;
}

export function updateQuote(id, changes) {
  const quotes = getQuotes();

  const updated = quotes.map((quote) =>
    quote.id === id ? { ...quote, ...changes } : quote
  );

  saveQuotes(updated);

  Object.keys(localStorage).forEach((key) => {
    if (!key.startsWith("forgeerp_quotes_")) return;

    const periodQuotes = readStorage(key, []);
    const updatedPeriodQuotes = periodQuotes.map((quote) =>
      quote.id === id ? { ...quote, ...changes } : quote
    );

    writeStorage(key, updatedPeriodQuotes);
  });

  return updated;
}

export function getActivePeriod(fallback) {
  return readStorage(KEYS.activePeriod, fallback);
}

export function setActivePeriod(period) {
  writeStorage(KEYS.activePeriod, period);
  window.dispatchEvent(new Event("forgeerp:period-changed"));
}
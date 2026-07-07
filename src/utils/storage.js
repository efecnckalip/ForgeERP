// ForgeERP Storage Manager 2.0
// Tüm localStorage işlemleri tek merkezden yönetilir.
// Eski kayıt anahtarları da okunur, veri kaybı yaşanmaz.

const KEYS = {
  jobs: "forgeerp_jobs",
  oldJobs: "forge_jobs",
  legacyJobs: "jobs",

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

function uniqueById(items = []) {
  const map = new Map();

  items.forEach((item) => {
    if (!item) return;
    const id = item.id || item.jobNo || item.quoteNo;
    if (!id) return;
    map.set(id, { ...item, id });
  });

  return Array.from(map.values());
}

export function getJobs() {
  const main = readStorage(KEYS.jobs, []);
  const old = readStorage(KEYS.oldJobs, []);
  const legacy = readStorage(KEYS.legacyJobs, []);

  return uniqueById([...main, ...old, ...legacy]);
}

export function saveJobs(jobs) {
  const cleanJobs = uniqueById(jobs);

  writeStorage(KEYS.jobs, cleanJobs);
  writeStorage(KEYS.oldJobs, cleanJobs);
  writeStorage(KEYS.legacyJobs, cleanJobs);

  window.dispatchEvent(new Event("forgeerp:jobs-updated"));

  return cleanJobs;
}

export function addJob(job) {
  const jobs = getJobs();
  const updated = saveJobs([job, ...jobs]);

  if (job.periodKey) {
    const periodKey = `forgeerp_jobs_${job.periodKey}`;
    const periodJobs = readStorage(periodKey, []);
    writeStorage(periodKey, uniqueById([job, ...periodJobs]));
  }

  return updated;
}

export function updateJob(id, changes) {
  const jobs = getJobs();

  const updated = jobs.map((job) =>
    job.id === id || job.jobNo === id ? { ...job, ...changes } : job
  );

  saveJobs(updated);

  Object.keys(localStorage).forEach((key) => {
    if (!key.startsWith("forgeerp_jobs_")) return;

    const periodJobs = readStorage(key, []);
    const updatedPeriodJobs = periodJobs.map((job) =>
      job.id === id || job.jobNo === id ? { ...job, ...changes } : job
    );

    writeStorage(key, uniqueById(updatedPeriodJobs));
  });

  return updated;
}

export function deleteJob(id) {
  const jobs = getJobs();

  const updated = jobs.filter(
    (job) => job.id !== id && job.jobNo !== id
  );

  saveJobs(updated);

  Object.keys(localStorage).forEach((key) => {
    if (!key.startsWith("forgeerp_jobs_")) return;

    const periodJobs = readStorage(key, []);
    const updatedPeriodJobs = periodJobs.filter(
      (job) => job.id !== id && job.jobNo !== id
    );

    writeStorage(key, uniqueById(updatedPeriodJobs));
  });

  return updated;
}

export function getQuotes() {
  return readStorage(KEYS.quotes, []);
}

export function saveQuotes(quotes) {
  writeStorage(KEYS.quotes, quotes);
  window.dispatchEvent(new Event("forgeerp:quotes-updated"));
  return quotes;
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
// ===============================
// Machine Scheduling
// ===============================

const MACHINE_KEY = "forgeerp_machines";

export function getMachines() {
  return readStorage(MACHINE_KEY, []);
}

export function saveMachines(machines) {
  writeStorage(MACHINE_KEY, machines);
  window.dispatchEvent(new Event("forgeerp:machines-updated"));
}

export function updateMachine(id, changes) {
  const machines = getMachines();

  const updated = machines.map((machine) =>
    machine.id === id ? { ...machine, ...changes } : machine
  );

  saveMachines(updated);

  return updated;
}

export function assignJobToMachine(jobId, machineId) {
  const jobs = getJobs();
  const machines = getMachines();

  const selectedMachine = machines.find((m) => m.id === machineId);
  const selectedJob = jobs.find((j) => j.id === jobId || j.jobNo === jobId);

  if (!selectedMachine || !selectedJob) {
    return {
      jobs,
      machines,
      error: "İş veya makine bulunamadı.",
    };
  }

  const updatedJobs = jobs.map((job) =>
    job.id === jobId || job.jobNo === jobId
      ? {
          ...job,
          machineId: selectedMachine.id,
          machineName: selectedMachine.name,
          machine: selectedMachine.name,
          status: "production",
          assignedAt: new Date().toISOString(),
        }
      : job
  );

  const updatedMachines = machines.map((machine) =>
    machine.id === machineId
      ? {
          ...machine,
          status: "production",
          activeJobId: selectedJob.id || selectedJob.jobNo,
          activeJobNo: selectedJob.jobNo || selectedJob.id,
          activeJobTitle: selectedJob.title || selectedJob.jobName || "İsimsiz İş",
          activeCustomer: selectedJob.customer || selectedJob.customerName || "Müşteri Yok",
          assignedAt: new Date().toISOString(),
        }
      : machine
  );

  saveJobs(updatedJobs);
  saveMachines(updatedMachines);

  window.dispatchEvent(new Event("forgeerp:schedule-updated"));

  return {
    jobs: updatedJobs,
    machines: updatedMachines,
  };
}

export function clearMachineJob(machineId) {
  const machines = getMachines();

  const target = machines.find((machine) => machine.id === machineId);

  if (!target) {
    return machines;
  }

  const updatedMachines = machines.map((machine) =>
    machine.id === machineId
      ? {
          ...machine,
          status: "idle",
          activeJobId: "",
          activeJobNo: "",
          activeJobTitle: "",
          activeCustomer: "",
          assignedAt: "",
        }
      : machine
  );

  saveMachines(updatedMachines);

  window.dispatchEvent(new Event("forgeerp:schedule-updated"));

  return updatedMachines;
}
// ===============================
// Customers / CRM Lite
// ===============================

const CUSTOMER_KEY = "forgeerp_customers";

export function getCustomers() {
  return readStorage(CUSTOMER_KEY, []);
}

export function saveCustomers(customers) {
  writeStorage(CUSTOMER_KEY, customers);
  window.dispatchEvent(new Event("forgeerp:customers-updated"));
}

export function addCustomer(customer) {
  const customers = getCustomers();

  const newCustomer = {
    id: customer.id || crypto.randomUUID(),
    name: customer.name || "",
    authorized: customer.authorized || "",
    phone: customer.phone || "",
    email: customer.email || "",
    taxNo: customer.taxNo || "",
    taxOffice: customer.taxOffice || "",
    address: customer.address || "",
    sector: customer.sector || "",
    note: customer.note || "",
    createdAt: customer.createdAt || new Date().toISOString(),
  };

  const updated = [newCustomer, ...customers];
  saveCustomers(updated);

  return updated;
}

export function updateCustomer(id, changes) {
  const customers = getCustomers();

  const updated = customers.map((customer) =>
    customer.id === id ? { ...customer, ...changes } : customer
  );

  saveCustomers(updated);

  return updated;
}

export function deleteCustomer(id) {
  const customers = getCustomers();
  const updated = customers.filter((customer) => customer.id !== id);

  saveCustomers(updated);

  return updated;
}

export function findCustomerByName(name) {
  const customers = getCustomers();
  const target = String(name || "").trim().toLowerCase();

  return customers.find(
    (customer) => String(customer.name || "").trim().toLowerCase() === target
  );
}
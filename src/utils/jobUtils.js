import {
  JOB_PRIORITIES,
  JOB_STATUSES,
  DEFAULT_JOB,
} from "../constants/jobConstants";

export function createJob(data = {}) {
  return {
    ...DEFAULT_JOB,
    ...data,
  };
}

export function validateJob(job) {
  const errors = {};

  if (!job.jobNo?.trim()) {
    errors.jobNo = "İş numarası zorunludur.";
  }

  if (!job.customer?.trim()) {
    errors.customer = "Müşteri seçilmelidir.";
  }

  if (!job.partName?.trim()) {
    errors.partName = "Parça adı zorunludur.";
  }

  if (!job.material?.trim()) {
    errors.material = "Malzeme seçiniz.";
  }

  if (!job.machine?.trim()) {
    errors.machine = "Makine seçiniz.";
  }

  if (!job.status) {
    errors.status = "Durum seçiniz.";
  }

  if (!job.priority) {
    errors.priority = "Öncelik seçiniz.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function calculateProgress(job) {
  const estimated = Number(job.estimatedHours) || 0;
  const completed = Number(job.completedHours) || 0;

  if (estimated <= 0) return 0;

  return Math.min(
    100,
    Math.round((completed / estimated) * 100)
  );
}

export function isJobDelayed(job) {
  if (!job.dueDate) return false;

  if (job.status === "Tamamlandı") return false;

  const today = new Date();
  const due = new Date(job.dueDate);

  return due < today;
}

export function getPriorityColor(priority) {
  switch (priority) {
    case "Acil":
      return "danger";

    case "Yüksek":
      return "warning";

    case "Orta":
      return "primary";

    case "Düşük":
      return "success";

    default:
      return "default";
  }
}

export function getStatusColor(status) {
  switch (status) {
    case "Bekliyor":
      return "warning";

    case "CAM":
      return "purple";

    case "CNC":
      return "primary";

    case "Kontrol":
      return "cyan";

    case "Tamamlandı":
      return "success";

    case "İptal":
      return "danger";

    default:
      return "default";
  }
}

export function generateJobNumber(lastNumber = 0) {
  const year = new Date().getFullYear();

  const number = String(lastNumber + 1).padStart(4, "0");

  return `EFE-${year}-${number}`;
}

export function sortJobs(jobs, field = "dueDate") {
  return [...jobs].sort((a, b) => {
    if (!a[field]) return 1;
    if (!b[field]) return -1;

    return new Date(a[field]) - new Date(b[field]);
  });
}

export function filterJobs(jobs, filters = {}) {
  return jobs.filter((job) => {
    if (
      filters.status &&
      job.status !== filters.status
    ) {
      return false;
    }

    if (
      filters.priority &&
      job.priority !== filters.priority
    ) {
      return false;
    }

    if (
      filters.machine &&
      job.machine !== filters.machine
    ) {
      return false;
    }

    if (
      filters.customer &&
      job.customer !== filters.customer
    ) {
      return false;
    }

    return true;
  });
}

export {
  JOB_PRIORITIES,
  JOB_STATUSES,
};
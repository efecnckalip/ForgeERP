import BaseService from "./BaseService";

class JobsService extends BaseService {
  constructor() {
    super("jobs");
  }

  getActiveJobs() {
    return this.getAll().filter(
      (job) => job.status !== "Tamamlandı"
    );
  }

  getCompletedJobs() {
    return this.getAll().filter(
      (job) => job.status === "Tamamlandı"
    );
  }

  getWaitingJobs() {
    return this.getAll().filter(
      (job) => job.status === "Bekliyor"
    );
  }

  getProductionJobs() {
    return this.getAll().filter(
      (job) =>
        job.status === "Üretimde" ||
        job.status === "CNC" ||
        job.status === "CAM"
    );
  }

  getUrgentJobs() {
    return this.getAll().filter(
      (job) =>
        job.priority === "Acil" ||
        job.priority === "Yüksek"
    );
  }

  getByStatus(status) {
    return this.getAll().filter(
      (job) => job.status === status
    );
  }

  getByCustomer(customerName) {
    return this.getAll().filter(
      (job) => job.customer === customerName
    );
  }

  changeStatus(id, status) {
    return this.update(id, {
      status,
    });
  }

  getTotalAmount() {
    return this.getAll().reduce(
      (total, job) => total + (Number(job.amount) || 0),
      0
    );
  }
}

export default new JobsService();
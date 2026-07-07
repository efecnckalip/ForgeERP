import BaseService from "./BaseService";

class CustomersService extends BaseService {
  constructor() {
    super("customers");
  }

  getActiveCustomers() {
    return this.getAll().filter(
      (customer) => customer.status !== "Pasif"
    );
  }

  getPassiveCustomers() {
    return this.getAll().filter(
      (customer) => customer.status === "Pasif"
    );
  }

  findByName(name) {
    if (!name) return null;

    return this.getAll().find(
      (customer) =>
        customer.name?.toLowerCase() === name.toLowerCase()
    );
  }
}

export default new CustomersService();
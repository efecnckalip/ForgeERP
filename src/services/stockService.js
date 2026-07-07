import BaseService from "./BaseService";

class StockService extends BaseService {
  constructor() {
    super("stock");
  }

  getCriticalStock() {
    return this.getAll().filter(
      (item) => Number(item.quantity) <= Number(item.minStock)
    );
  }

  getLowStock() {
    return this.getAll().filter(
      (item) =>
        Number(item.quantity) > Number(item.minStock) &&
        Number(item.quantity) <= Number(item.minStock) * 2
    );
  }

  getInStock() {
    return this.getAll().filter(
      (item) => Number(item.quantity) > Number(item.minStock)
    );
  }

  getOutOfStock() {
    return this.getAll().filter(
      (item) => Number(item.quantity) <= 0
    );
  }

  getTotalItems() {
    return this.getAll().length;
  }

  getTotalStockValue() {
    return this.getAll().reduce((total, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;

      return total + qty * price;
    }, 0);
  }
}

export default new StockService();
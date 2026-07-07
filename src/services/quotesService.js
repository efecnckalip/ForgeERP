import BaseService from "./BaseService";

class QuotesService extends BaseService {
  constructor() {
    super("quotes");
  }

  getPendingQuotes() {
    return this.getAll().filter(
      (quote) => quote.status === "Bekliyor"
    );
  }

  getApprovedQuotes() {
    return this.getAll().filter(
      (quote) => quote.status === "Onaylandı"
    );
  }

  getRejectedQuotes() {
    return this.getAll().filter(
      (quote) => quote.status === "Reddedildi"
    );
  }

  getTotalAmount() {
    return this.getAll().reduce(
      (total, quote) => total + (Number(quote.amount) || 0),
      0
    );
  }
}

export default new QuotesService();
import { useEffect, useMemo, useState } from "react";
import AppContext from "../contexts/AppContext";

import BaseService from "../services/BaseService";
import jobsService from "../services/jobsService";
import customersService from "../services/customersService";
import quotesService from "../services/quotesService";
import stockService from "../services/stockService";

const productionService = new BaseService("production");
const financeService = new BaseService("finance");
const purchasesService = new BaseService("purchases");

export default function AppProvider({ children }) {
  const [jobs, setJobs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [stock, setStock] = useState([]);
  const [production, setProduction] = useState([]);
  const [finance, setFinance] = useState([]);
  const [purchases, setPurchases] = useState([]);

  const refreshAll = () => {
    setJobs(jobsService.getAll());
    setCustomers(customersService.getAll());
    setQuotes(quotesService.getAll());
    setStock(stockService.getAll());
    setProduction(productionService.getAll());
    setFinance(financeService.getAll());
    setPurchases(purchasesService.getAll());
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const createJob = (data) => {
    const item = jobsService.create(data);
    refreshAll();
    return item;
  };

  const updateJob = (id, data) => {
    const item = jobsService.update(id, data);
    refreshAll();
    return item;
  };

  const deleteJob = (id) => {
    jobsService.delete(id);
    refreshAll();
  };

  const createCustomer = (data) => {
    const item = customersService.create(data);
    refreshAll();
    return item;
  };

  const updateCustomer = (id, data) => {
    const item = customersService.update(id, data);
    refreshAll();
    return item;
  };

  const deleteCustomer = (id) => {
    customersService.delete(id);
    refreshAll();
  };

  const createQuote = (data) => {
    const item = quotesService.create(data);
    refreshAll();
    return item;
  };

  const updateQuote = (id, data) => {
    const item = quotesService.update(id, data);
    refreshAll();
    return item;
  };

  const deleteQuote = (id) => {
    quotesService.delete(id);
    refreshAll();
  };

  const createStockItem = (data) => {
    const item = stockService.create(data);
    refreshAll();
    return item;
  };

  const updateStockItem = (id, data) => {
    const item = stockService.update(id, data);
    refreshAll();
    return item;
  };

  const deleteStockItem = (id) => {
    stockService.delete(id);
    refreshAll();
  };

  const createProductionItem = (data) => {
    const item = productionService.create(data);
    refreshAll();
    return item;
  };

  const updateProductionItem = (id, data) => {
    const item = productionService.update(id, data);
    refreshAll();
    return item;
  };

  const deleteProductionItem = (id) => {
    productionService.delete(id);
    refreshAll();
  };

  const createFinanceItem = (data) => {
    const item = financeService.create(data);
    refreshAll();
    return item;
  };

  const updateFinanceItem = (id, data) => {
    const item = financeService.update(id, data);
    refreshAll();
    return item;
  };

  const deleteFinanceItem = (id) => {
    financeService.delete(id);
    refreshAll();
  };

  const createPurchase = (data) => {
    const item = purchasesService.create(data);
    refreshAll();
    return item;
  };

  const updatePurchase = (id, data) => {
    const item = purchasesService.update(id, data);
    refreshAll();
    return item;
  };

  const deletePurchase = (id) => {
    purchasesService.delete(id);
    refreshAll();
  };

  const dashboardStats = useMemo(() => {
    const activeJobs = jobs.filter((job) => job.status !== "Tamamlandı");
    const completedJobs = jobs.filter((job) => job.status === "Tamamlandı");
    const pendingQuotes = quotes.filter((quote) => quote.status === "Bekliyor");
    const approvedQuotes = quotes.filter((quote) => quote.status === "Onaylandı");

    const criticalStock = stock.filter(
      (item) => Number(item.quantity) <= Number(item.minStock)
    );

    const totalQuoteAmount = quotes.reduce(
      (total, quote) => total + (Number(quote.amount) || 0),
      0
    );

    const totalStockValue = stock.reduce((total, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      return total + quantity * unitPrice;
    }, 0);

    return {
      totalJobs: jobs.length,
      activeJobs: activeJobs.length,
      completedJobs: completedJobs.length,

      totalCustomers: customers.length,

      totalQuotes: quotes.length,
      pendingQuotes: pendingQuotes.length,
      approvedQuotes: approvedQuotes.length,
      totalQuoteAmount,

      totalStockItems: stock.length,
      criticalStock: criticalStock.length,
      totalStockValue,

      totalProduction: production.length,
      totalFinance: finance.length,
      totalPurchases: purchases.length,
    };
  }, [jobs, customers, quotes, stock, production, finance, purchases]);

  const value = useMemo(
    () => ({
      jobs,
      customers,
      quotes,
      stock,
      production,
      finance,
      purchases,

      dashboardStats,

      refreshAll,

      createJob,
      updateJob,
      deleteJob,

      createCustomer,
      updateCustomer,
      deleteCustomer,

      createQuote,
      updateQuote,
      deleteQuote,

      createStockItem,
      updateStockItem,
      deleteStockItem,

      createProductionItem,
      updateProductionItem,
      deleteProductionItem,

      createFinanceItem,
      updateFinanceItem,
      deleteFinanceItem,

      createPurchase,
      updatePurchase,
      deletePurchase,
    }),
    [
      jobs,
      customers,
      quotes,
      stock,
      production,
      finance,
      purchases,
      dashboardStats,
    ]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}
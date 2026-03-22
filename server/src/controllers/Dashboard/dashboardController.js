import {
  sendResponse,
  asyncHandler,
  statusType,
  getPrismaOrFail,
} from "../../utils/index.js";

// Helper: get year range
const getYearRange = (year) => {
  const y = parseInt(year) || new Date().getFullYear();
  const start = new Date(`${y}-01-01T00:00:00.000Z`);
  const end = new Date(`${y}-12-31T23:59:59.999Z`);
  return { start, end, year: y };
};

// Helper: month labels
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// Helper: build monthly buckets filled with zeros
const buildMonthBuckets = () =>
  MONTHS.map((month) => ({ month, salesQty: 0, purchaseQty: 0, salesAmount: 0, purchaseAmount: 0 }));

// ----------------------------------------------------------------
// 1. KPI Cards — totals for year
// ----------------------------------------------------------------
export const getDashboardKPIs = asyncHandler(async (req, res) => {
  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const { year } = req.query;
  const { start, end } = getYearRange(year);

  const [
    totalSalesAmount,
    totalPurchaseAmount,
    totalSalesInvoices,
    totalPurchaseInvoices,
    pendingSalesInvoices,
    totalCustomers,
    totalProducts,
    totalSuppliers,
  ] = await Promise.all([
    prisma.salesInvoice.aggregate({
      _sum: { finalAmount: true },
      where: { deleted: false, invoiceDate: { gte: start, lte: end } },
    }),
    prisma.purchaseInvoice.aggregate({
      _sum: { finalAmount: true },
      where: { deleted: false, invoiceDate: { gte: start, lte: end } },
    }),
    prisma.salesInvoice.count({
      where: { deleted: false, invoiceDate: { gte: start, lte: end } },
    }),
    prisma.purchaseInvoice.count({
      where: { deleted: false, invoiceDate: { gte: start, lte: end } },
    }),
    prisma.salesInvoice.count({
      where: { deleted: false, status: "Pending", invoiceDate: { gte: start, lte: end } },
    }),
    prisma.customer.count({ where: { deleted: false } }),
    prisma.product.count({ where: { deleted: false } }),
    prisma.supplier.count({ where: { deleted: false } }),
  ]);

  const salesAmount = totalSalesAmount._sum?.finalAmount || 0;
  const purchaseAmount = totalPurchaseAmount._sum?.finalAmount || 0;

  return sendResponse(
    res,
    true,
    {
      totalSalesAmount: salesAmount,
      totalPurchaseAmount: purchaseAmount,
      netRevenue: salesAmount - purchaseAmount,
      totalSalesInvoices,
      totalPurchaseInvoices,
      pendingSalesInvoices,
      totalCustomers,
      totalProducts,
      totalSuppliers,
    },
    "KPIs fetched successfully",
    statusType.OK,
  );
});

// ----------------------------------------------------------------
// 2. Monthly Trend — sales qty + purchase qty + amounts per month
// ----------------------------------------------------------------
export const getMonthlyTrend = asyncHandler(async (req, res) => {
  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const { year } = req.query;
  const { start, end } = getYearRange(year);

  // Fetch all sales and purchase invoices for the year
  const [salesInvoices, purchaseInvoices] = await Promise.all([
    prisma.salesInvoice.findMany({
      where: { deleted: false, invoiceDate: { gte: start, lte: end } },
      select: { invoiceDate: true, finalAmount: true, grossAmount: true },
    }),
    prisma.purchaseInvoice.findMany({
      where: { deleted: false, invoiceDate: { gte: start, lte: end } },
      select: { invoiceDate: true, finalAmount: true, grossAmount: true },
    }),
  ]);

  // Fetch monthly quantities from history tables
  const [salesHistories, purchaseHistories] = await Promise.all([
    prisma.salesHistory.findMany({
      where: { invoiceDate: { gte: start, lte: end } },
      select: { invoiceDate: true, aQty: true, totalAmount: true },
    }),
    prisma.purchaseHistory.findMany({
      where: { invoiceDate: { gte: start, lte: end } },
      select: { invoiceDate: true, aQty: true, totalAmount: true },
    }),
  ]);

  const buckets = buildMonthBuckets();

  // Aggregate sales invoice amounts by month
  for (const inv of salesInvoices) {
    const monthIdx = new Date(inv.invoiceDate).getMonth();
    buckets[monthIdx].salesAmount += inv.finalAmount || 0;
  }

  // Aggregate purchase invoice amounts by month
  for (const inv of purchaseInvoices) {
    const monthIdx = new Date(inv.invoiceDate).getMonth();
    buckets[monthIdx].purchaseAmount += inv.finalAmount || 0;
  }

  // Aggregate sales quantities from history
  for (const h of salesHistories) {
    const monthIdx = new Date(h.invoiceDate).getMonth();
    buckets[monthIdx].salesQty += h.aQty || 0;
  }

  // Aggregate purchase quantities from history
  for (const h of purchaseHistories) {
    const monthIdx = new Date(h.invoiceDate).getMonth();
    buckets[monthIdx].purchaseQty += h.aQty || 0;
  }

  // Round amounts
  const data = buckets.map((b) => ({
    ...b,
    salesAmount: Math.round(b.salesAmount * 100) / 100,
    purchaseAmount: Math.round(b.purchaseAmount * 100) / 100,
  }));

  return sendResponse(res, true, { trend: data }, "Monthly trend fetched", statusType.OK);
});

// ----------------------------------------------------------------
// 3. Inventory Summary — stock grouped by product group
// ----------------------------------------------------------------
export const getInventorySummary = asyncHandler(async (req, res) => {
  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Get all batches with product group info
  const batches = await prisma.batch.findMany({
    select: {
      openingStock: true,
      product: {
        select: {
          deleted: true,
          productGroup: { select: { id: true, name: true } },
        },
      },
    },
  });

  const groupMap = new Map();

  for (const batch of batches) {
    if (batch.product?.deleted) continue;
    const groupName = batch.product?.productGroup?.name || "Ungrouped";
    const groupId = batch.product?.productGroup?.id || 0;
    const key = `${groupId}:${groupName}`;

    if (!groupMap.has(key)) {
      groupMap.set(key, { name: groupName, totalStock: 0, productCount: 0 });
    }
    const entry = groupMap.get(key);
    entry.totalStock += batch.openingStock || 0;
    entry.productCount += 1;
  }

  const inventory = Array.from(groupMap.values())
    .sort((a, b) => b.totalStock - a.totalStock)
    .slice(0, 10); // top 10 groups

  return sendResponse(res, true, { inventory }, "Inventory summary fetched", statusType.OK);
});

// ----------------------------------------------------------------
// 4. Top Customers — by total revenue
// ----------------------------------------------------------------
export const getTopCustomers = asyncHandler(async (req, res) => {
  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const { year } = req.query;
  const { start, end } = getYearRange(year);

  const histories = await prisma.salesHistory.findMany({
    where: { invoiceDate: { gte: start, lte: end } },
    select: {
      totalAmount: true,
      aQty: true,
      customer: { select: { id: true, companyName: true, personName: true } },
    },
  });

  const customerMap = new Map();
  for (const h of histories) {
    if (!h.customer) continue;
    const key = h.customer.id;
    if (!customerMap.has(key)) {
      customerMap.set(key, {
        id: h.customer.id,
        name: h.customer.companyName || h.customer.personName || "Unknown",
        totalAmount: 0,
        totalQty: 0,
        invoiceCount: 0,
      });
    }
    const entry = customerMap.get(key);
    entry.totalAmount += h.totalAmount || 0;
    entry.totalQty += h.aQty || 0;
    entry.invoiceCount += 1;
  }

  const topCustomers = Array.from(customerMap.values())
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 5)
    .map((c) => ({ ...c, totalAmount: Math.round(c.totalAmount * 100) / 100 }));

  return sendResponse(res, true, { topCustomers }, "Top customers fetched", statusType.OK);
});

// ----------------------------------------------------------------
// 5. Top Products — by quantity sold
// ----------------------------------------------------------------
export const getTopProducts = asyncHandler(async (req, res) => {
  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const { year } = req.query;
  const { start, end } = getYearRange(year);

  const histories = await prisma.salesHistory.findMany({
    where: { invoiceDate: { gte: start, lte: end } },
    select: {
      aQty: true,
      totalAmount: true,
      product: { select: { id: true, description: true, productCode: true } },
    },
  });

  const productMap = new Map();
  for (const h of histories) {
    if (!h.product) continue;
    const key = h.product.id;
    if (!productMap.has(key)) {
      productMap.set(key, {
        id: h.product.id,
        name: h.product.description,
        productCode: h.product.productCode,
        totalQty: 0,
        totalAmount: 0,
      });
    }
    const entry = productMap.get(key);
    entry.totalQty += h.aQty || 0;
    entry.totalAmount += h.totalAmount || 0;
  }

  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.totalQty - a.totalQty)
    .slice(0, 5)
    .map((p) => ({ ...p, totalAmount: Math.round(p.totalAmount * 100) / 100 }));

  return sendResponse(res, true, { topProducts }, "Top products fetched", statusType.OK);
});

// ----------------------------------------------------------------
// 6. Salesman Performance
// ----------------------------------------------------------------
export const getSalesmanPerformance = asyncHandler(async (req, res) => {
  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const { year } = req.query;
  const { start, end } = getYearRange(year);

  const invoices = await prisma.salesInvoice.findMany({
    where: { deleted: false, invoiceDate: { gte: start, lte: end } },
    select: {
      finalAmount: true,
      salesman: { select: { id: true, name: true } },
    },
  });

  const salesmanMap = new Map();
  for (const inv of invoices) {
    if (!inv.salesman) continue;
    const key = inv.salesman.id;
    if (!salesmanMap.has(key)) {
      salesmanMap.set(key, {
        id: inv.salesman.id,
        name: inv.salesman.name,
        totalAmount: 0,
        invoiceCount: 0,
      });
    }
    const entry = salesmanMap.get(key);
    entry.totalAmount += inv.finalAmount || 0;
    entry.invoiceCount += 1;
  }

  const performance = Array.from(salesmanMap.values())
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .map((s) => ({ ...s, totalAmount: Math.round(s.totalAmount * 100) / 100 }));

  return sendResponse(res, true, { performance }, "Salesman performance fetched", statusType.OK);
});

// ----------------------------------------------------------------
// 7. Sales Status Distribution
// ----------------------------------------------------------------
export const getSalesStatusDistribution = asyncHandler(async (req, res) => {
  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const { year } = req.query;
  const { start, end } = getYearRange(year);

  const invoices = await prisma.salesInvoice.findMany({
    where: { deleted: false, invoiceDate: { gte: start, lte: end } },
    select: { status: true, finalAmount: true },
  });

  const statusMap = new Map();
  for (const inv of invoices) {
    const status = inv.status || "Unknown";
    if (!statusMap.has(status)) {
      statusMap.set(status, { status, count: 0, totalAmount: 0 });
    }
    const entry = statusMap.get(status);
    entry.count += 1;
    entry.totalAmount += inv.finalAmount || 0;
  }

  const distribution = Array.from(statusMap.values()).map((s) => ({
    ...s,
    totalAmount: Math.round(s.totalAmount * 100) / 100,
  }));

  return sendResponse(res, true, { distribution }, "Status distribution fetched", statusType.OK);
});

// ----------------------------------------------------------------
// 8. Recent Activity — last 5 sales + 5 purchases
// ----------------------------------------------------------------
export const getRecentActivity = asyncHandler(async (req, res) => {
  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const [recentSales, recentPurchases] = await Promise.all([
    prisma.salesInvoice.findMany({
      where: { deleted: false },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        invoiceNo: true,
        invoiceDate: true,
        finalAmount: true,
        status: true,
        createdAt: true,
        customer: { select: { companyName: true, personName: true } },
      },
    }),
    prisma.purchaseInvoice.findMany({
      where: { deleted: false },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        invoiceNo: true,
        invoiceDate: true,
        finalAmount: true,
        status: true,
        createdAt: true,
        supplier: { select: { name: true } },
      },
    }),
  ]);

  const sales = recentSales.map((s) => ({
    ...s,
    type: "sale",
    partyName: s.customer?.companyName || s.customer?.personName || "Unknown",
    finalAmount: Math.round((s.finalAmount || 0) * 100) / 100,
  }));

  const purchases = recentPurchases.map((p) => ({
    ...p,
    type: "purchase",
    partyName: p.supplier?.name || "Unknown",
    finalAmount: Math.round((p.finalAmount || 0) * 100) / 100,
  }));

  return sendResponse(res, true, { recentSales: sales, recentPurchases: purchases }, "Recent activity fetched", statusType.OK);
});

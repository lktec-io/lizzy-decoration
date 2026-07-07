import { pool } from '../config/db.js';

// branchIds: null (Super Admin, unrestricted) or an array of accessible branch IDs.
function branchFilter(column, branchIds) {
  if (!branchIds) return { clause: '', params: [] };
  if (branchIds.length === 0) return { clause: `AND 1 = 0`, params: [] }; // no accessible branches -> no rows
  return { clause: `AND ${column} IN (?)`, params: [branchIds] };
}

export async function getKpis(branchIds) {
  const sales = branchFilter('branch_id', branchIds);
  const expenses = branchFilter('branch_id', branchIds);
  const carwash = branchFilter('branch_id', branchIds);
  const inventory = branchFilter('i.branch_id', branchIds);
  const transfers = branchFilter('destination_branch_id', branchIds);
  const purchases = branchFilter('branch_id', branchIds);

  const [[todaySales]] = await pool.query(
    `SELECT COALESCE(SUM(total_amount), 0) AS value FROM sales
     WHERE status = 'completed' AND DATE(created_at) = CURDATE() ${sales.clause}`,
    sales.params,
  );

  const [[monthlySales]] = await pool.query(
    `SELECT COALESCE(SUM(total_amount), 0) AS value FROM sales
     WHERE status = 'completed' AND YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE()) ${sales.clause}`,
    sales.params,
  );

  const salesAliased = branchFilter('s.branch_id', branchIds);
  const profitQuery = (dateCondition) => `
    SELECT COALESCE(SUM(si.line_total - (si.quantity * p.buying_price)), 0) AS value
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    JOIN products p ON p.id = si.product_id
    WHERE s.status = 'completed' AND ${dateCondition}
    ${salesAliased.clause}
  `;
  const [[todayProfit]] = await pool.query(profitQuery('DATE(s.created_at) = CURDATE()'), salesAliased.params);
  const [[monthlyProfit]] = await pool.query(
    profitQuery('YEAR(s.created_at) = YEAR(CURDATE()) AND MONTH(s.created_at) = MONTH(CURDATE())'),
    salesAliased.params,
  );

  const [[totalCustomers]] = await pool.query(
    "SELECT COUNT(*) AS value FROM customers WHERE deleted_at IS NULL AND status = 'active'",
  );
  const [[totalSuppliers]] = await pool.query(
    "SELECT COUNT(*) AS value FROM suppliers WHERE deleted_at IS NULL AND status = 'active'",
  );
  const [[totalProducts]] = await pool.query(
    "SELECT COUNT(*) AS value FROM products WHERE deleted_at IS NULL AND status = 'active'",
  );

  const [[inventoryValue]] = await pool.query(
    `SELECT COALESCE(SUM(i.quantity * p.buying_price), 0) AS value
     FROM inventory i JOIN products p ON p.id = i.product_id
     WHERE 1 = 1 ${inventory.clause}`,
    inventory.params,
  );

  const [[lowStockCount]] = await pool.query(
    `SELECT COUNT(*) AS value FROM inventory i
     JOIN products p ON p.id = i.product_id
     WHERE i.quantity <= COALESCE(i.min_stock, p.min_stock) ${inventory.clause}`,
    inventory.params,
  );

  const [[todayExpenses]] = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS value FROM expenses WHERE expense_date = CURDATE() ${expenses.clause}`,
    expenses.params,
  );
  const [[monthlyExpenses]] = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS value FROM expenses
     WHERE YEAR(expense_date) = YEAR(CURDATE()) AND MONTH(expense_date) = MONTH(CURDATE()) ${expenses.clause}`,
    expenses.params,
  );

  const [[carwashRevenue]] = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS value FROM carwash_transactions
     WHERE DATE(created_at) = CURDATE() ${carwash.clause}`,
    carwash.params,
  );

  const [[pendingTransfers]] = await pool.query(
    `SELECT COUNT(*) AS value FROM stock_transfer_requests WHERE status = 'pending' ${transfers.clause}`,
    transfers.params,
  );
  const [[pendingPurchases]] = await pool.query(
    `SELECT COUNT(*) AS value FROM purchase_orders WHERE status = 'pending' ${purchases.clause}`,
    purchases.params,
  );

  return {
    todaySales: Number(todaySales.value),
    monthlySales: Number(monthlySales.value),
    todayProfit: Number(todayProfit.value),
    monthlyProfit: Number(monthlyProfit.value),
    totalCustomers: Number(totalCustomers.value),
    totalSuppliers: Number(totalSuppliers.value),
    totalProducts: Number(totalProducts.value),
    inventoryValue: Number(inventoryValue.value),
    lowStockCount: Number(lowStockCount.value),
    todayExpenses: Number(todayExpenses.value),
    monthlyExpenses: Number(monthlyExpenses.value),
    carwashRevenue: Number(carwashRevenue.value),
    pendingTransfers: Number(pendingTransfers.value),
    pendingPurchases: Number(pendingPurchases.value),
  };
}

const DAYS_BACK = 14;

export async function getSalesTrend(branchIds) {
  const filter = branchFilter('branch_id', branchIds);
  const [rows] = await pool.query(
    `SELECT DATE(created_at) AS date, COALESCE(SUM(total_amount), 0) AS value
     FROM sales
     WHERE status = 'completed' AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) ${filter.clause}
     GROUP BY DATE(created_at) ORDER BY date`,
    [DAYS_BACK, ...filter.params],
  );
  return rows;
}

export async function getRevenueTrend(branchIds) {
  const salesFilter = branchFilter('branch_id', branchIds);
  const carwashFilter = branchFilter('branch_id', branchIds);
  const [rows] = await pool.query(
    `SELECT date, SUM(value) AS value FROM (
       SELECT DATE(created_at) AS date, COALESCE(SUM(total_amount), 0) AS value
       FROM sales WHERE status = 'completed' AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) ${salesFilter.clause}
       GROUP BY DATE(created_at)
       UNION ALL
       SELECT DATE(created_at) AS date, COALESCE(SUM(amount), 0) AS value
       FROM carwash_transactions WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) ${carwashFilter.clause}
       GROUP BY DATE(created_at)
     ) combined
     GROUP BY date ORDER BY date`,
    [DAYS_BACK, ...salesFilter.params, DAYS_BACK, ...carwashFilter.params],
  );
  return rows;
}

export async function getExpenseTrend(branchIds) {
  const filter = branchFilter('branch_id', branchIds);
  const [rows] = await pool.query(
    `SELECT expense_date AS date, COALESCE(SUM(amount), 0) AS value
     FROM expenses
     WHERE expense_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY) ${filter.clause}
     GROUP BY expense_date ORDER BY expense_date`,
    [DAYS_BACK, ...filter.params],
  );
  return rows;
}

export async function getProfitTrend(branchIds) {
  const filter = branchFilter('s.branch_id', branchIds);
  const [rows] = await pool.query(
    `SELECT DATE_FORMAT(s.created_at, '%Y-%m') AS month,
            COALESCE(SUM(si.line_total - (si.quantity * p.buying_price)), 0) AS value
     FROM sale_items si
     JOIN sales s ON s.id = si.sale_id
     JOIN products p ON p.id = si.product_id
     WHERE s.status = 'completed' AND s.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH) ${filter.clause}
     GROUP BY month ORDER BY month`,
    filter.params,
  );
  return rows;
}

export async function getTopProducts(branchIds, limit = 5) {
  const filter = branchFilter('s.branch_id', branchIds);
  const [rows] = await pool.query(
    `SELECT p.id, p.name, SUM(si.quantity) AS quantity
     FROM sale_items si
     JOIN sales s ON s.id = si.sale_id
     JOIN products p ON p.id = si.product_id
     WHERE s.status = 'completed' ${filter.clause}
     GROUP BY p.id, p.name
     ORDER BY quantity DESC
     LIMIT ?`,
    [...filter.params, limit],
  );
  return rows;
}

export async function getBranchPerformance(branchIds) {
  const filter = branchFilter('b.id', branchIds);
  const [rows] = await pool.query(
    `SELECT b.id, b.name, COALESCE(SUM(s.total_amount), 0) AS value
     FROM branches b
     LEFT JOIN sales s ON s.branch_id = b.id AND s.status = 'completed'
       AND YEAR(s.created_at) = YEAR(CURDATE()) AND MONTH(s.created_at) = MONTH(CURDATE())
     WHERE b.deleted_at IS NULL AND b.status = 'active' ${filter.clause}
     GROUP BY b.id, b.name ORDER BY value DESC`,
    filter.params,
  );
  return rows;
}

export async function getInventorySummary(branchIds) {
  const filter = branchFilter('i.branch_id', branchIds);
  const [[row]] = await pool.query(
    `SELECT
       SUM(CASE WHEN i.quantity = 0 THEN 1 ELSE 0 END) AS outOfStock,
       SUM(CASE WHEN i.quantity > 0 AND i.quantity <= COALESCE(i.min_stock, p.min_stock) THEN 1 ELSE 0 END) AS lowStock,
       SUM(CASE WHEN i.quantity > COALESCE(i.min_stock, p.min_stock) THEN 1 ELSE 0 END) AS inStock
     FROM inventory i JOIN products p ON p.id = i.product_id
     WHERE 1 = 1 ${filter.clause}`,
    filter.params,
  );
  return {
    outOfStock: Number(row.outOfStock) || 0,
    lowStock: Number(row.lowStock) || 0,
    inStock: Number(row.inStock) || 0,
  };
}

export async function getCarwashSummary(branchIds) {
  const filter = branchFilter('ct.branch_id', branchIds);
  const [rows] = await pool.query(
    `SELECT cs.name, COALESCE(SUM(ct.amount), 0) AS value
     FROM carwash_services cs
     LEFT JOIN carwash_transactions ct ON ct.service_id = cs.id
       AND YEAR(ct.created_at) = YEAR(CURDATE()) AND MONTH(ct.created_at) = MONTH(CURDATE()) ${filter.clause}
     WHERE cs.deleted_at IS NULL
     GROUP BY cs.id, cs.name ORDER BY value DESC`,
    filter.params,
  );
  return rows;
}

import { ApiError } from '../utils/apiError.js';
import { getAccessibleBranchIds } from '../utils/branchScope.js';
import * as heldSaleRepository from '../repositories/heldSale.repository.js';
import * as branchRepository from '../repositories/branch.repository.js';

async function assertBranchAccess(user, branchId) {
  const branchIds = await getAccessibleBranchIds(user);
  if (branchIds !== null && !branchIds.includes(branchId)) {
    throw new ApiError(403, 'You do not have access to this branch');
  }
}

// Display number is derived from the row's own id at read time — no
// separate sequence table, no race condition, and it's stable for the
// life of the hold (a hold is never renumbered).
function withHoldNumber(row) {
  if (!row) return row;
  return { ...row, hold_number: `HOLD-${String(row.id).padStart(4, '0')}` };
}

export async function listHeldSales(query, user) {
  const branchIds = await getAccessibleBranchIds(user);
  const rows = await heldSaleRepository.findAll({
    branchId: query.branchId ? Number(query.branchId) : undefined,
    branchIds,
  });
  return rows.map(withHoldNumber);
}

export async function getHeldSale(id, user) {
  const held = await heldSaleRepository.findById(id);
  if (!held) throw new ApiError(404, 'Held sale not found');
  await assertBranchAccess(user, held.branch_id);
  return withHoldNumber(held);
}

// A hold is purely a cart snapshot — it never touches sales/sale_items/
// inventory, so nothing here needs a transaction. items/totalAmount are
// exactly what the POS cart already computed client-side; the server
// re-validates stock/pricing for real at the eventual checkout, not here.
export async function holdSale(data, actorId, user) {
  const branchId = Number(data.branchId);
  const branch = await branchRepository.findById(branchId);
  if (!branch) throw new ApiError(400, 'Selected branch does not exist');
  await assertBranchAccess(user, branchId);

  if (!data.items?.length) throw new ApiError(400, 'Cannot hold an empty cart');

  const cartDiscountAmount = Number(data.cartDiscountAmount) || 0;
  const itemsTotal = data.items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice) - (Number(item.discountAmount) || 0),
    0,
  );
  const totalAmount = Math.max(itemsTotal - cartDiscountAmount, 0);

  const cartData = {
    items: data.items,
    customerId: data.customerId || null,
    customerName: data.customerName || null,
    cartDiscountAmount,
    paymentMethod: data.paymentMethod || null,
    notes: data.notes || null,
  };

  const held = await heldSaleRepository.create({
    branchId,
    customerId: data.customerId || null,
    heldBy: actorId,
    cartData,
    itemsCount: data.items.length,
    totalAmount,
    notes: data.notes || null,
  });

  return withHoldNumber(held);
}

export async function deleteHeldSale(id, user) {
  const held = await heldSaleRepository.findById(id);
  if (!held) throw new ApiError(404, 'Held sale not found');
  await assertBranchAccess(user, held.branch_id);
  await heldSaleRepository.remove(id);
}

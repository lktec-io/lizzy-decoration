import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTrash2, FiCamera, FiPlus, FiMinus, FiClock, FiShoppingCart, FiUserPlus } from 'react-icons/fi';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import SearchInput from '../../components/common/SearchInput';
import QRScanner from '../../components/common/QRScanner';
import EmptyState from '../../components/common/EmptyState';
import { useAuth } from '../../hooks/useAuth';
import { usePermission } from '../../hooks/usePermission';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../hooks/useToast';
import * as productService from '../../services/productService';
import * as categoryService from '../../services/categoryService';
import * as branchService from '../../services/branchService';
import * as customerService from '../../services/customerService';
import * as saleService from '../../services/saleService';
import { formatCurrency } from '../../utils/formatCurrency';
import { splitFullName } from '../../utils/splitFullName';
import '../../styles/pages/POS.css';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'mpesa', label: 'M-Pesa' },
  { value: 'airtel_money', label: 'Airtel Money' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'card', label: 'Card' },
];

function POS() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canOverride = usePermission('sales.manage');
  const toast = useToast();

  const searchInputRef = useRef(null);
  // One idempotency key per checkout attempt — generated once when the
  // cart starts (here, mount) and regenerated only in clearCart() (which
  // runs both on an explicit "Clear Cart" and right after a successful
  // checkout), so a double-click/retry during ONE attempt always resends
  // the same key, but a genuinely new sale always gets a fresh one.
  const idempotencyKeyRef = useRef(crypto.randomUUID());
  const isCheckingOutRef = useRef(false);

  const [branchId, setBranchId] = useState(user?.branch_id || '');
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const [cart, setCart] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [cartDiscountAmount, setCartDiscountAmount] = useState('0');
  const [notes, setNotes] = useState('');
  const [payments, setPayments] = useState([{ method: 'cash', amount: '', referenceNumber: '' }]);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [clearCartConfirmOpen, setClearCartConfirmOpen] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const [quickCustomerOpen, setQuickCustomerOpen] = useState(false);
  const [quickCustomerName, setQuickCustomerName] = useState('');
  const [quickCustomerPhone, setQuickCustomerPhone] = useState('');
  const [quickCustomerError, setQuickCustomerError] = useState('');
  const [savingQuickCustomer, setSavingQuickCustomer] = useState(false);

  useEffect(() => {
    if (!user?.branch_id) {
      branchService.listActiveBranches().then(setBranches);
    }
    categoryService.listActiveCategories().then(setCategories);
    customerService.listActiveCustomers().then(setCustomers);
  }, [user]);

  const loadProducts = useCallback(() => {
    if (!branchId) return;
    setProductsLoading(true);
    productService
      .listSellableProducts({ branchId, search: debouncedSearch || undefined, categoryId: categoryId || undefined })
      .then(setProducts)
      .finally(() => setProductsLoading(false));
  }, [branchId, debouncedSearch, categoryId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching the product grid on branch/search/category change is standard data-fetching, not derived state
    loadProducts();
  }, [loadProducts]);

  const cartLine = (productId) => cart.find((line) => line.productId === productId);

  const addToCart = (product) => {
    const existing = cartLine(product.id);
    if (existing) {
      if (existing.quantity >= product.available_quantity) return;
      setCart((prev) => prev.map((line) => (line.productId === product.id ? { ...line, quantity: line.quantity + 1 } : line)));
      searchInputRef.current?.focus();
      return;
    }
    if (product.available_quantity < 1) return;
    setCart((prev) => [
      ...prev,
      {
        productId: product.id,
        name: product.name,
        code: product.code,
        unitPrice: Number(product.selling_price),
        originalPrice: Number(product.selling_price),
        availableQuantity: product.available_quantity,
        quantity: 1,
        discountAmount: 0,
      },
    ]);
    searchInputRef.current?.focus();
  };

  const updateLine = (productId, patch) => {
    setCart((prev) => prev.map((line) => (line.productId === productId ? { ...line, ...patch } : line)));
  };

  // Shared by the [-]/[+] stepper buttons and the direct-type number input
  // so both paths clamp to the same [1, availableQuantity] bounds.
  const setLineQuantity = (line, nextQuantity) => {
    const qty = Math.max(1, Math.min(line.availableQuantity, nextQuantity || 1));
    updateLine(line.productId, { quantity: qty });
  };

  const removeLine = (productId) => {
    setCart((prev) => prev.filter((line) => line.productId !== productId));
  };

  const clearCart = () => {
    setClearCartConfirmOpen(false);
    setCart([]);
    setCartDiscountAmount('0');
    setNotes('');
    setPayments([{ method: 'cash', amount: '', referenceNumber: '' }]);
    idempotencyKeyRef.current = crypto.randomUUID();
  };

  const subtotal = useMemo(() => cart.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0), [cart]);
  const itemDiscountTotal = useMemo(() => cart.reduce((sum, line) => sum + (Number(line.discountAmount) || 0), 0), [cart]);
  const resolvedCartDiscount = Number(cartDiscountAmount) || 0;
  const total = Math.max(0, subtotal - itemDiscountTotal - resolvedCartDiscount);
  const totalPaid = useMemo(() => payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0), [payments]);
  const balance = totalPaid - total;

  const addPaymentRow = () => setPayments((prev) => [...prev, { method: 'cash', amount: '', referenceNumber: '' }]);
  const removePaymentRow = (index) => setPayments((prev) => prev.filter((_, i) => i !== index));
  const updatePaymentRow = (index, patch) => {
    setPayments((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const handleScan = async (decodedText) => {
    setScanMessage('');
    let payload;
    try {
      payload = JSON.parse(decodedText);
    } catch {
      setScanMessage('Unrecognized QR code.');
      return;
    }

    try {
      const matches = await productService.listSellableProducts({ branchId, search: payload.code, limit: 1 });
      const match = matches.find((p) => p.id === payload.productId) || matches[0];
      if (!match) {
        setScanMessage(`"${payload.name}" is not available at this branch.`);
        return;
      }
      addToCart(match);
      setScanMessage(`Added "${match.name}" to cart.`);
    } catch {
      setScanMessage('Could not look up the scanned product.');
    }
  };

  const openQuickCustomer = () => {
    setQuickCustomerName('');
    setQuickCustomerPhone('');
    setQuickCustomerError('');
    setQuickCustomerOpen(true);
  };

  // Same two required fields the full Customer form already treats as
  // required (fullName, phone) — Quick Customer isn't a lighter validation
  // rule, it's the same create endpoint with the optional fields (email/
  // address/notes) simply never shown.
  const submitQuickCustomer = async () => {
    setQuickCustomerError('');
    if (!quickCustomerName.trim() || !quickCustomerPhone.trim()) {
      setQuickCustomerError('Name and phone are required.');
      return;
    }
    setSavingQuickCustomer(true);
    try {
      const { firstName, lastName } = splitFullName(quickCustomerName);
      const created = await customerService.createCustomer({ firstName, lastName, phone: quickCustomerPhone.trim() });
      setCustomers((prev) => [...prev, created]);
      setCustomerId(String(created.id));
      setQuickCustomerOpen(false);
      toast.success(`${quickCustomerName.trim()} added and selected.`);
    } catch (err) {
      setQuickCustomerError(err.response?.data?.message || 'Failed to add customer.');
    } finally {
      setSavingQuickCustomer(false);
    }
  };

  const handleCheckout = async () => {
    // isCheckingOutRef is checked synchronously (unlike the isCheckingOut
    // state used to disable the button, which only takes effect after the
    // next render) — closes the gap where two rapid clicks/taps both fire
    // before React re-renders with the button disabled. The server-side
    // idempotency key is the actual authority (see sale.service.js); this
    // is just the fastest possible client-side line of defense.
    if (isCheckingOutRef.current) return;
    isCheckingOutRef.current = true;

    setCheckoutError('');
    setIsCheckingOut(true);
    try {
      const payload = {
        idempotencyKey: idempotencyKeyRef.current,
        branchId: Number(branchId),
        customerId: customerId ? Number(customerId) : undefined,
        notes: notes || undefined,
        items: cart.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discountAmount: Number(line.discountAmount) || 0,
        })),
        cartDiscountAmount: resolvedCartDiscount || undefined,
        payments: payments
          .filter((p) => Number(p.amount) > 0)
          .map((p) => ({ method: p.method, amount: Number(p.amount), referenceNumber: p.referenceNumber || undefined })),
      };

      const sale = await saleService.checkout(payload);
      clearCart();
      navigate(`/pos/sales/${sale.id}`);
    } catch (err) {
      setCheckoutError(err.response?.data?.message || 'Checkout failed. Please try again.');
    } finally {
      setIsCheckingOut(false);
      isCheckingOutRef.current = false;
    }
  };

  const canCheckout = cart.length > 0 && branchId && totalPaid >= total && !isCheckingOut;

  return (
    <div className="pos-page">
      <div className="pos-catalog">
        <div className="pos-catalog-toolbar">
          <div className="pos-catalog-toolbar-row">
            {!user?.branch_id ? (
              <select className="form-control pos-branch-select" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                <option value="">Select a branch to sell from</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            ) : (
              <span className="badge badge-neutral">{user.branch_name}</span>
            )}
            <SearchInput ref={searchInputRef} value={search} onChange={setSearch} placeholder="Search by name or code..." />
            <button type="button" className="btn btn-secondary" onClick={() => { setScanMessage(''); setScannerOpen(true); }}>
              <FiCamera aria-hidden="true" /> Scan QR
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/pos/sales')}>
              <FiClock aria-hidden="true" /> Sale History
            </button>
          </div>
          <div className="pos-category-pills">
            <button type="button" className={`pos-category-pill ${!categoryId ? 'pos-category-pill-active' : ''}`} onClick={() => setCategoryId('')}>
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`pos-category-pill ${String(categoryId) === String(c.id) ? 'pos-category-pill-active' : ''}`}
                onClick={() => setCategoryId(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {!branchId ? (
          <div className="pos-scan-empty">Select a branch to view sellable products.</div>
        ) : productsLoading ? (
          <div className="flex items-center justify-center p-6"><span className="spinner" aria-label="Loading" /></div>
        ) : (
          <div className="pos-product-grid">
            {products.map((product) => {
              const inCartQty = cartLine(product.id)?.quantity || 0;
              const disabled = inCartQty >= product.available_quantity;
              return (
                <button
                  key={product.id}
                  type="button"
                  className="pos-product-card"
                  onClick={() => addToCart(product)}
                  disabled={disabled}
                >
                  <span className="pos-product-name">{product.name}</span>
                  <span className="pos-product-code">{product.code}</span>
                  <span className="pos-product-price">{formatCurrency(product.selling_price)}</span>
                  <span className="pos-product-stock">{product.available_quantity} in stock{inCartQty ? ` · ${inCartQty} in cart` : ''}</span>
                </button>
              );
            })}
            {products.length === 0 && <div className="pos-scan-empty">No sellable products found.</div>}
          </div>
        )}
      </div>

      <div className="pos-cart">
        <div className="pos-cart-header">
          <span className="card-title">Cart ({cart.length})</span>
          {cart.length > 0 && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setClearCartConfirmOpen(true)}>Clear Cart</button>
          )}
        </div>

        <div className="pos-cart-items">
          {cart.length === 0 ? (
            <EmptyState icon={FiShoppingCart} title="Cart is empty" description="Select products to begin a sale." />
          ) : (
            cart.map((line) => (
              <div className="pos-cart-line" key={line.productId}>
                <div className="pos-cart-line-top">
                  <span className="pos-cart-line-name">{line.name}</span>
                  <button type="button" className="btn btn-ghost btn-icon" onClick={() => removeLine(line.productId)} aria-label={`Remove ${line.name}`}>
                    <FiTrash2 />
                  </button>
                </div>
                <div className="pos-cart-line-controls">
                  <div className="pos-cart-line-field">
                    <label htmlFor={`qty-${line.productId}`}>Qty</label>
                    <div className="pos-qty-stepper">
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon pos-qty-stepper-btn"
                        onClick={() => setLineQuantity(line, line.quantity - 1)}
                        disabled={line.quantity <= 1}
                        aria-label={`Decrease quantity of ${line.name}`}
                      >
                        <FiMinus />
                      </button>
                      <input
                        id={`qty-${line.productId}`}
                        type="number"
                        min="1"
                        max={line.availableQuantity}
                        className="form-control pos-cart-qty-input"
                        value={line.quantity}
                        onChange={(e) => setLineQuantity(line, Number(e.target.value))}
                      />
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon pos-qty-stepper-btn"
                        onClick={() => setLineQuantity(line, line.quantity + 1)}
                        disabled={line.quantity >= line.availableQuantity}
                        aria-label={`Increase quantity of ${line.name}`}
                      >
                        <FiPlus />
                      </button>
                    </div>
                  </div>
                  <div className="pos-cart-line-field">
                    <label htmlFor={`price-${line.productId}`}>Price</label>
                    <input
                      id={`price-${line.productId}`}
                      type="number"
                      min="0"
                      step="0.01"
                      className="form-control pos-cart-price-input"
                      value={line.unitPrice}
                      disabled={!canOverride}
                      onChange={(e) => updateLine(line.productId, { unitPrice: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="pos-cart-line-field">
                    <label htmlFor={`discount-${line.productId}`}>Discount</label>
                    <input
                      id={`discount-${line.productId}`}
                      type="number"
                      min="0"
                      step="0.01"
                      className="form-control pos-cart-discount-input"
                      value={line.discountAmount}
                      onChange={(e) => updateLine(line.productId, { discountAmount: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <span className="pos-cart-line-total">{formatCurrency(line.quantity * line.unitPrice - (Number(line.discountAmount) || 0))}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pos-cart-footer">
          <div className="form-group">
            <div className="flex items-center justify-between">
              <label className="form-label" htmlFor="pos-customer" style={{ margin: 0 }}>Customer (Optional)</label>
              <button type="button" className="btn btn-ghost btn-sm" onClick={openQuickCustomer}>
                <FiUserPlus aria-hidden="true" /> Quick Add
              </button>
            </div>
            <select id="pos-customer" className="form-control" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Walk-in customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}{c.business_name ? ` (${c.business_name})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="pos-cart-discount">Cart Discount</label>
            <input
              id="pos-cart-discount"
              type="number"
              min="0"
              step="0.01"
              className="form-control"
              value={cartDiscountAmount}
              onChange={(e) => setCartDiscountAmount(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="pos-notes">Note (Optional)</label>
            <input
              id="pos-notes"
              type="text"
              className="form-control"
              placeholder="e.g. gift-wrapped"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div>
            <div className="pos-totals-row"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            {(itemDiscountTotal + resolvedCartDiscount) > 0 && (
              <div className="pos-totals-row"><span>Discount</span><span>-{formatCurrency(itemDiscountTotal + resolvedCartDiscount)}</span></div>
            )}
            <div className="pos-totals-row pos-totals-row-total"><span>Total</span><span>{formatCurrency(total)}</span></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="form-label" style={{ margin: 0 }}>Payment</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={addPaymentRow}>
                <FiPlus aria-hidden="true" /> Add Payment
              </button>
            </div>
            {payments.map((payment, index) => (
              <div className="pos-payment-row mb-2" key={index}>
                <select
                  className="form-control pos-payment-method"
                  value={payment.method}
                  onChange={(e) => updatePaymentRow(index, { method: e.target.value })}
                >
                  {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-control pos-payment-amount"
                  placeholder={payment.method === 'cash' ? 'Cash Received' : 'Amount'}
                  aria-label={payment.method === 'cash' ? 'Cash received' : 'Payment amount'}
                  value={payment.amount}
                  onChange={(e) => updatePaymentRow(index, { amount: e.target.value })}
                />
                {payment.method !== 'cash' && (
                  <input
                    type="text"
                    className="form-control pos-payment-reference"
                    placeholder="Reference #"
                    aria-label="Payment reference number"
                    value={payment.referenceNumber}
                    onChange={(e) => updatePaymentRow(index, { referenceNumber: e.target.value })}
                  />
                )}
                {payments.length > 1 && (
                  <button type="button" className="btn btn-ghost btn-icon" onClick={() => removePaymentRow(index)} aria-label="Remove payment">
                    <FiTrash2 />
                  </button>
                )}
              </div>
            ))}
            <div className="pos-totals-row">
              <span>{balance >= 0 ? 'Change' : 'Balance Due'}</span>
              <span>{formatCurrency(Math.abs(balance))}</span>
            </div>
          </div>

          {checkoutError && <div className="alert alert-danger" role="alert">{checkoutError}</div>}

          <button
            type="button"
            className={`btn btn-primary ${isCheckingOut ? 'btn-loading' : ''}`}
            disabled={!canCheckout}
            onClick={handleCheckout}
          >
            Complete Sale
          </button>
        </div>
      </div>

      <Modal open={scannerOpen} onClose={() => setScannerOpen(false)} title="Scan Product QR Code" size="sm">
        <QRScanner onScan={handleScan} onError={() => setScanMessage('Could not access the camera.')} />
        {scanMessage && <p className="text-sm text-secondary mt-2">{scanMessage}</p>}
      </Modal>

      <ConfirmDialog
        open={clearCartConfirmOpen}
        onClose={() => setClearCartConfirmOpen(false)}
        onConfirm={clearCart}
        title="Clear cart"
        message={`Remove all ${cart.length} item${cart.length === 1 ? '' : 's'} from the cart? This cannot be undone.`}
        confirmLabel="Clear Cart"
      />

      <Modal
        open={quickCustomerOpen}
        onClose={() => setQuickCustomerOpen(false)}
        title="Quick Add Customer"
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setQuickCustomerOpen(false)}>Cancel</button>
            <button
              type="button"
              className={`btn btn-primary ${savingQuickCustomer ? 'btn-loading' : ''}`}
              disabled={savingQuickCustomer}
              onClick={submitQuickCustomer}
            >
              Add &amp; Select
            </button>
          </>
        }
      >
        {quickCustomerError && <div className="alert alert-danger mb-4" role="alert">{quickCustomerError}</div>}
        <div className="form-group">
          <label className="form-label form-label-required" htmlFor="quick-customer-name">Full Name</label>
          <input
            id="quick-customer-name"
            className="form-control"
            value={quickCustomerName}
            onChange={(e) => setQuickCustomerName(e.target.value)}
            autoFocus
          />
        </div>
        <div className="form-group">
          <label className="form-label form-label-required" htmlFor="quick-customer-phone">Phone Number</label>
          <input
            id="quick-customer-phone"
            className="form-control"
            value={quickCustomerPhone}
            onChange={(e) => setQuickCustomerPhone(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}

export default POS;

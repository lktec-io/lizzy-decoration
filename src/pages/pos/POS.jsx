import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTrash2, FiCamera, FiPlus, FiMinus, FiClock, FiShoppingCart, FiUserPlus, FiPercent, FiPrinter, FiDownload, FiCheckCircle, FiX } from 'react-icons/fi';
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
import * as branchService from '../../services/branchService';
import * as customerService from '../../services/customerService';
import * as saleService from '../../services/saleService';
import { formatCurrency } from '../../utils/formatCurrency';
import { splitFullName } from '../../utils/splitFullName';
import '../../styles/pages/POS.css';

// Four cashier-facing payment buttons (spec). "Mobile Money" isn't a single
// backend value — the app still records M-Pesa vs Airtel Money separately
// for reporting — so it expands into a two-option sub-select on tap instead
// of collapsing to one generic value.
const PAYMENT_GROUPS = [
  { key: 'cash', label: 'Cash', method: 'cash' },
  { key: 'card', label: 'Card', method: 'card' },
  { key: 'transfer', label: 'Transfer', method: 'bank_transfer' },
  { key: 'mobile_money', label: 'Mobile Money', subOptions: [{ method: 'mpesa', label: 'M-Pesa' }, { method: 'airtel_money', label: 'Airtel Money' }] },
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
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const [cart, setCart] = useState([]);
  const [selectedLineId, setSelectedLineId] = useState(null);
  const [expandedDiscountLines, setExpandedDiscountLines] = useState(() => new Set());
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [mobileMoneyOpen, setMobileMoneyOpen] = useState(false);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [clearCartConfirmOpen, setClearCartConfirmOpen] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [receiptBusy, setReceiptBusy] = useState('');
  const receiptTimerRef = useRef(null);

  const [quickCustomerOpen, setQuickCustomerOpen] = useState(false);
  const [quickCustomerName, setQuickCustomerName] = useState('');
  const [quickCustomerPhone, setQuickCustomerPhone] = useState('');
  const [quickCustomerError, setQuickCustomerError] = useState('');
  const [savingQuickCustomer, setSavingQuickCustomer] = useState(false);

  const anyModalOpen = scannerOpen || quickCustomerOpen || clearCartConfirmOpen;

  useEffect(() => {
    if (!user?.branch_id) {
      branchService.listActiveBranches().then(setBranches);
    }
    customerService.listActiveCustomers().then(setCustomers);
  }, [user]);

  const loadProducts = useCallback(() => {
    if (!branchId) return;
    setProductsLoading(true);
    productService
      .listSellableProducts({ branchId, search: debouncedSearch || undefined })
      .then(setProducts)
      .finally(() => setProductsLoading(false));
  }, [branchId, debouncedSearch]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching the product grid on branch/search change is standard data-fetching, not derived state
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a new query invalidates whatever result the cashier had arrow-keyed to
    setHighlightedIndex(-1);
  }, [debouncedSearch]);

  const cartLine = (productId) => cart.find((line) => line.productId === productId);

  const addToCart = useCallback((product) => {
    setCart((prev) => {
      const existing = prev.find((line) => line.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.available_quantity) return prev;
        return prev.map((line) => (line.productId === product.id ? { ...line, quantity: line.quantity + 1 } : line));
      }
      if (product.available_quantity < 1) return prev;
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          code: product.code,
          unitPrice: Number(product.selling_price),
          availableQuantity: product.available_quantity,
          quantity: 1,
          discountAmount: 0,
        },
      ];
    });
    searchInputRef.current?.focus();
  }, []);

  // Makes hardware/keyboard-wedge barcode scanners "just work" through the
  // same search box a cashier types into — those devices type the full
  // code faster than the debounce window, then the product grid settles on
  // exactly one row whose code equals what was typed. A manual, partial
  // name search essentially never produces an exact code match, so this
  // never fires for ordinary typing.
  useEffect(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (!query || products.length === 0) return;
    const exact = products.find((p) => p.code.toLowerCase() === query);
    if (exact) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reacting to an external event (a completed scan resolving to a product) by updating the cart and clearing the box for the next scan, not deriving render state
      addToCart(exact);
      setSearch('');
    }
  }, [products, debouncedSearch, addToCart]);

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
    setSelectedLineId((prev) => (prev === productId ? null : prev));
  };

  const selectLine = (productId) => {
    setSelectedLineId((prev) => (prev === productId ? null : productId));
    // So a subsequent Delete keypress (guarded against firing while any
    // text input is focused) is actually free to remove the line instead
    // of being swallowed by the "don't delete while typing" guard.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  };

  const toggleDiscountEditor = (productId) => {
    setExpandedDiscountLines((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId); else next.add(productId);
      return next;
    });
  };

  const clearCart = () => {
    setClearCartConfirmOpen(false);
    setCart([]);
    setSelectedLineId(null);
    setExpandedDiscountLines(new Set());
    setCustomerId('');
    setPaymentMethod('cash');
    setMobileMoneyOpen(false);
    idempotencyKeyRef.current = crypto.randomUUID();
  };

  const subtotal = useMemo(() => cart.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0), [cart]);
  const discountTotal = useMemo(() => cart.reduce((sum, line) => sum + (Number(line.discountAmount) || 0), 0), [cart]);
  const total = Math.max(0, subtotal - discountTotal);

  const selectPaymentGroup = (group) => {
    if (group.subOptions) {
      setMobileMoneyOpen((prev) => !prev);
      return;
    }
    setMobileMoneyOpen(false);
    setPaymentMethod(group.method);
  };

  const selectMobileMoneyOption = (method) => {
    setPaymentMethod(method);
    setMobileMoneyOpen(false);
  };

  const isMobileMoneyMethod = paymentMethod === 'mpesa' || paymentMethod === 'airtel_money';

  const handleScan = async (decodedText) => {
    setScanMessage('');
    let code = null;
    let productIdHint = null;
    try {
      const payload = JSON.parse(decodedText);
      code = payload.code;
      productIdHint = payload.productId;
    } catch {
      // Not our self-printed QR JSON — treat the raw decoded text as a real
      // manufacturer barcode and match it directly against products.code.
      code = decodedText.trim();
    }
    if (!code) {
      setScanMessage('Unrecognized code.');
      return;
    }

    try {
      const matches = await productService.listSellableProducts({ branchId, search: code, limit: 5 });
      const match = matches.find((p) => p.code.toLowerCase() === code.toLowerCase())
        || matches.find((p) => p.id === productIdHint)
        || matches[0];
      if (!match) {
        setScanMessage(`No product found for "${code}".`);
        return;
      }
      addToCart(match);
      setScanMessage(`Added "${match.name}".`);
    } catch {
      setScanMessage('Could not look up the scanned product.');
    }
  };

  const handleScannerError = () => {
    setScannerOpen(false);
    setScanMessage('');
    toast.error('Camera unavailable — search or scan with a barcode scanner in the search box instead.');
    searchInputRef.current?.focus();
  };

  // Enter in the search box: a highlighted (arrow-keyed) result wins
  // outright. Otherwise this is almost always a hardware scanner that just
  // typed a full code faster than the debounce settled, or a cashier who
  // typed a few letters and hit Enter before the grid updated — a fresh,
  // un-debounced lookup keeps both cases correct instead of racing the
  // in-flight search.
  const handleSearchEnter = async () => {
    if (highlightedIndex >= 0 && products[highlightedIndex]) {
      addToCart(products[highlightedIndex]);
      setSearch('');
      setHighlightedIndex(-1);
      return;
    }

    const query = search.trim();
    if (!query || !branchId) return;
    try {
      const results = await productService.listSellableProducts({ branchId, search: query, limit: 5 });
      const match = results.find((p) => p.code.toLowerCase() === query.toLowerCase()) || results[0];
      if (match) {
        addToCart(match);
        setSearch('');
        setHighlightedIndex(-1);
      } else {
        toast.error(`No product found for "${query}".`);
      }
    } catch {
      toast.error('Product lookup failed.');
    }
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, products.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, -1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      handleSearchEnter();
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

  const canCheckout = cart.length > 0 && branchId && total > 0 && !isCheckingOut;

  const handleCheckout = useCallback(async () => {
    // isCheckingOutRef is checked synchronously (unlike the isCheckingOut
    // state used to disable the button, which only takes effect after the
    // next render) — closes the gap where two rapid clicks/taps/Enter
    // presses both fire before React re-renders with the button disabled.
    // The server-side idempotency key is the actual authority (see
    // sale.service.js); this is just the fastest possible client-side line
    // of defense.
    if (isCheckingOutRef.current) return;
    if (cart.length === 0 || !branchId || total <= 0) return;
    isCheckingOutRef.current = true;

    setCheckoutError('');
    setIsCheckingOut(true);
    try {
      const payload = {
        idempotencyKey: idempotencyKeyRef.current,
        branchId: Number(branchId),
        customerId: customerId ? Number(customerId) : undefined,
        items: cart.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discountAmount: Number(line.discountAmount) || 0,
        })),
        payments: [{ method: paymentMethod, amount: total }],
      };

      const sale = await saleService.checkout(payload);
      clearCart();
      // Deliberately NOT navigating away to the Sale Detail page — the spec
      // requires focus to return to the search box with no click needed,
      // which a page navigation would defeat. The receipt tray below is a
      // non-modal overlay (no backdrop, doesn't steal focus) so the search
      // box — refocused by clearCart()'s downstream effects — stays live
      // and typeable/scannable immediately while Print/Download/New Sale
      // remain one click away for whoever wants a physical receipt.
      setLastSale(sale);
      searchInputRef.current?.focus();
    } catch (err) {
      setCheckoutError(err.response?.data?.message || 'Checkout failed. Please try again.');
    } finally {
      setIsCheckingOut(false);
      isCheckingOutRef.current = false;
    }
  }, [cart, branchId, customerId, paymentMethod, total]);

  // The tray dismisses itself the moment the cashier starts the next sale
  // (first item lands back in the now-empty cart) — no click required to
  // get it out of the way — and as a fallback after a short delay in case
  // they step away without starting another sale.
  useEffect(() => {
    if (!lastSale) return undefined;
    if (cart.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- dismissing the tray in reaction to the cashier starting the next sale (cart refilling), not deriving it from a prop
      setLastSale(null);
      return undefined;
    }
    receiptTimerRef.current = setTimeout(() => setLastSale(null), 15000);
    return () => clearTimeout(receiptTimerRef.current);
  }, [lastSale, cart.length]);

  const dismissReceipt = () => {
    clearTimeout(receiptTimerRef.current);
    setLastSale(null);
  };

  const handlePrintReceipt = async () => {
    if (!lastSale) return;
    setReceiptBusy('print');
    try {
      await saleService.printReceipt(lastSale.id);
    } catch {
      toast.error('Failed to open the receipt.');
    } finally {
      setReceiptBusy('');
    }
  };

  const handleDownloadReceipt = async () => {
    if (!lastSale) return;
    setReceiptBusy('download');
    try {
      await saleService.downloadReceiptPdf(lastSale.id, lastSale.sale_number);
    } catch {
      toast.error('Failed to download the receipt.');
    } finally {
      setReceiptBusy('');
    }
  };

  // Production keyboard workflow: F2 refocuses search, F4 opens the
  // scanner, ESC clears the search box, Delete removes the selected cart
  // line, and Enter completes the sale — but only when focus isn't inside
  // a text field (the search box handles its own Enter in
  // handleSearchKeyDown, and a plain Enter while typing anywhere else,
  // e.g. the Quick Customer modal, must never accidentally fire checkout).
  // Suppressed entirely while any modal is open so ESC/Enter there do what
  // that modal expects, not this page's shortcuts underneath it.
  useEffect(() => {
    const handleGlobalKeyDown = (event) => {
      if (anyModalOpen) return;

      const tag = document.activeElement?.tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if (event.key === 'F2') {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (event.key === 'F4') {
        event.preventDefault();
        setScanMessage('');
        setScannerOpen(true);
        return;
      }
      if (event.key === 'Escape') {
        setSearch('');
        setHighlightedIndex(-1);
        searchInputRef.current?.focus();
        return;
      }
      if (event.key === 'Delete' && !isTyping && selectedLineId) {
        removeLine(selectedLineId);
        return;
      }
      if (event.key === 'Enter' && !isTyping) {
        event.preventDefault();
        handleCheckout();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [anyModalOpen, selectedLineId, handleCheckout]);

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
            <SearchInput
              ref={searchInputRef}
              value={search}
              onChange={setSearch}
              onKeyDown={handleSearchKeyDown}
              placeholder="Scan or search by name, barcode, or SKU (F2)"
            />
            <button type="button" className="btn btn-secondary" onClick={() => { setScanMessage(''); setScannerOpen(true); }}>
              <FiCamera aria-hidden="true" /> Scan Barcode
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/pos/sales')}>
              <FiClock aria-hidden="true" /> Sale History
            </button>
          </div>
        </div>

        {!branchId ? (
          <div className="pos-scan-empty">Select a branch to view sellable products.</div>
        ) : productsLoading ? (
          <div className="flex items-center justify-center p-6"><span className="spinner" aria-label="Loading" /></div>
        ) : (
          <div className="pos-product-grid">
            {products.map((product, index) => {
              const inCartQty = cartLine(product.id)?.quantity || 0;
              const disabled = inCartQty >= product.available_quantity;
              return (
                <button
                  key={product.id}
                  type="button"
                  className={`pos-product-card ${index === highlightedIndex ? 'pos-product-card-highlighted' : ''}`}
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
            <EmptyState icon={FiShoppingCart} title="Cart is empty" description="Scan or search for a product to begin." />
          ) : (
            cart.map((line) => {
              const lineTotal = line.quantity * line.unitPrice - (Number(line.discountAmount) || 0);
              const isSelected = selectedLineId === line.productId;
              const isExpanded = expandedDiscountLines.has(line.productId);
              return (
                <div className={`pos-cart-line ${isSelected ? 'pos-cart-line-selected' : ''}`} key={line.productId}>
                  <div className="pos-cart-line-top">
                    <button
                      type="button"
                      className="pos-cart-line-name"
                      onClick={() => selectLine(line.productId)}
                      aria-pressed={isSelected}
                      title="Select (Delete key removes)"
                    >
                      {line.name}
                    </button>
                    <div className="flex items-center gap-1">
                      {canOverride && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon"
                          onClick={() => toggleDiscountEditor(line.productId)}
                          aria-label={`Adjust price or discount for ${line.name}`}
                          title="Manager: adjust price / discount"
                        >
                          <FiPercent />
                        </button>
                      )}
                      <button type="button" className="btn btn-ghost btn-icon" onClick={() => removeLine(line.productId)} aria-label={`Remove ${line.name}`}>
                        <FiTrash2 />
                      </button>
                    </div>
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
                    <span className="pos-cart-line-price">{formatCurrency(line.unitPrice)}</span>
                    <span className="pos-cart-line-total">{formatCurrency(lineTotal)}</span>
                  </div>
                  {canOverride && isExpanded && (
                    <div className="pos-cart-line-override">
                      <div className="pos-cart-line-field">
                        <label htmlFor={`price-${line.productId}`}>Unit Price</label>
                        <input
                          id={`price-${line.productId}`}
                          type="number"
                          min="0"
                          step="0.01"
                          className="form-control pos-cart-price-input"
                          value={line.unitPrice}
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
                    </div>
                  )}
                </div>
              );
            })
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

          <div>
            <div className="pos-totals-row"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            {discountTotal > 0 && (
              <div className="pos-totals-row"><span>Discount</span><span>-{formatCurrency(discountTotal)}</span></div>
            )}
            <div className="pos-totals-row pos-totals-row-total"><span>Total</span><span>{formatCurrency(total)}</span></div>
          </div>

          <div>
            <span className="form-label" style={{ margin: 0 }}>Payment Method</span>
            <div className="pos-payment-groups">
              {PAYMENT_GROUPS.map((group) => {
                const isActive = group.subOptions ? isMobileMoneyMethod : paymentMethod === group.method;
                return (
                  <button
                    key={group.key}
                    type="button"
                    className={`pos-payment-group-btn ${isActive ? 'pos-payment-group-btn-active' : ''}`}
                    onClick={() => selectPaymentGroup(group)}
                  >
                    {group.label}
                  </button>
                );
              })}
            </div>
            {mobileMoneyOpen && (
              <div className="pos-payment-suboptions">
                {PAYMENT_GROUPS.find((g) => g.key === 'mobile_money').subOptions.map((option) => (
                  <button
                    key={option.method}
                    type="button"
                    className={`pos-payment-group-btn pos-payment-suboption-btn ${paymentMethod === option.method ? 'pos-payment-group-btn-active' : ''}`}
                    onClick={() => selectMobileMoneyOption(option.method)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
            {isMobileMoneyMethod && !mobileMoneyOpen && (
              <p className="text-xs text-secondary mt-1">
                {PAYMENT_GROUPS.find((g) => g.key === 'mobile_money').subOptions.find((o) => o.method === paymentMethod)?.label} selected
              </p>
            )}
          </div>

          {checkoutError && <div className="alert alert-danger" role="alert">{checkoutError}</div>}

          <button
            type="button"
            className={`btn btn-primary btn-lg ${isCheckingOut ? 'btn-loading' : ''}`}
            disabled={!canCheckout}
            onClick={handleCheckout}
          >
            Complete Sale
          </button>
        </div>
      </div>

      <Modal open={scannerOpen} onClose={() => setScannerOpen(false)} title="Scan Barcode" size="sm">
        <QRScanner onScan={handleScan} onError={handleScannerError} />
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

      {lastSale && (
        <div className="pos-receipt-tray" role="status">
          <div className="pos-receipt-tray-header">
            <FiCheckCircle className="pos-receipt-tray-icon" aria-hidden="true" />
            <div>
              <div className="pos-receipt-tray-title">Sale completed</div>
              <div className="pos-receipt-tray-subtitle">{lastSale.sale_number} · {formatCurrency(lastSale.total_amount)}</div>
            </div>
            <button type="button" className="btn btn-ghost btn-icon" onClick={dismissReceipt} aria-label="Dismiss receipt">
              <FiX />
            </button>
          </div>
          <div className="pos-receipt-tray-actions">
            <button type="button" className={`btn btn-secondary btn-sm ${receiptBusy === 'print' ? 'btn-loading' : ''}`} disabled={!!receiptBusy} onClick={handlePrintReceipt}>
              <FiPrinter aria-hidden="true" /> Print
            </button>
            <button type="button" className={`btn btn-secondary btn-sm ${receiptBusy === 'download' ? 'btn-loading' : ''}`} disabled={!!receiptBusy} onClick={handleDownloadReceipt}>
              <FiDownload aria-hidden="true" /> Download PDF
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={dismissReceipt}>
              New Sale
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default POS;

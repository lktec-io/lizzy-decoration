import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import * as purchaseService from '../../services/purchaseService';
import * as supplierService from '../../services/supplierService';
import * as branchService from '../../services/branchService';
import * as productService from '../../services/productService';
import { useToast } from '../../hooks/useToast';
import { formatCurrency } from '../../utils/formatCurrency';

function PurchaseForm() {
  const navigate = useNavigate();
  const toast = useToast();
  const [suppliers, setSuppliers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [formError, setFormError] = useState('');

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      supplierId: '',
      branchId: '',
      items: [{ productId: '', quantity: 1, buyingPrice: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');

  useEffect(() => {
    supplierService.listActiveSuppliers().then(setSuppliers);
    branchService.listActiveBranches().then(setBranches);
    productService.listProducts({ status: 'active', limit: 200 }).then((result) => setProducts(result.items));
  }, []);

  const total = watchedItems.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.buyingPrice) || 0;
    return sum + qty * price;
  }, 0);

  const onSubmit = async (values) => {
    setFormError('');
    const payload = {
      supplierId: Number(values.supplierId),
      branchId: Number(values.branchId),
      items: values.items.map((item) => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity),
        buyingPrice: Number(item.buyingPrice),
      })),
    };

    try {
      const purchase = await purchaseService.createPurchase(payload);
      toast.success('Purchase recorded.');
      navigate(`/purchases/${purchase.id}`, { replace: true });
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to record purchase.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">New Purchase</h1>
          <p className="page-subtitle">Receive stock from a supplier — inventory updates automatically on save</p>
        </div>
      </div>

      {formError && <div className="alert alert-danger mb-4" role="alert">{formError}</div>}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="card mb-5">
          <div className="card-header"><span className="card-title">Purchase Details</span></div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="supplierId">Supplier</label>
                <select id="supplierId" className={`form-control ${errors.supplierId ? 'form-control-error' : ''}`} {...register('supplierId', { required: 'Supplier is required' })}>
                  <option value="">Select a supplier</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {errors.supplierId && <span className="form-error">{errors.supplierId.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="branchId">Receiving Branch</label>
                <select id="branchId" className={`form-control ${errors.branchId ? 'form-control-error' : ''}`} {...register('branchId', { required: 'Branch is required' })}>
                  <option value="">Select a branch</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                {errors.branchId && <span className="form-error">{errors.branchId.message}</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-5">
          <div className="card-header">
            <span className="card-title">Items</span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => append({ productId: '', quantity: 1, buyingPrice: '' })}>
              <FiPlus aria-hidden="true" /> Add Line
            </button>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Buying Price</th>
                  <th>Line Total</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => {
                  const qty = Number(watchedItems[index]?.quantity) || 0;
                  const price = Number(watchedItems[index]?.buyingPrice) || 0;
                  return (
                    <tr key={field.id}>
                      <td>
                        <select className="form-control" {...register(`items.${index}.productId`, { required: true })}>
                          <option value="">Select product</option>
                          {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                        </select>
                      </td>
                      <td style={{ width: 100 }}>
                        <input type="number" min="1" className="form-control" {...register(`items.${index}.quantity`, { required: true, min: 1 })} />
                      </td>
                      <td style={{ width: 140 }}>
                        <input type="number" step="0.01" min="0" className="form-control" {...register(`items.${index}.buyingPrice`, { required: true, min: 0 })} />
                      </td>
                      <td className="text-sm">{formatCurrency(qty * price)}</td>
                      <td>
                        {fields.length > 1 && (
                          <button type="button" className="btn btn-ghost btn-icon" onClick={() => remove(index)} aria-label="Remove line">
                            <FiTrash2 />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="card-footer flex justify-end">
            <span className="text-lg font-semibold">Total: {formatCurrency(total)}</span>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/purchases')}>Cancel</button>
          <button type="submit" className={`btn btn-primary ${isSubmitting ? 'btn-loading' : ''}`} disabled={isSubmitting}>
            Save Purchase
          </button>
        </div>
      </form>
    </div>
  );
}

export default PurchaseForm;

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import * as transferService from '../../services/transferService';
import * as branchService from '../../services/branchService';
import * as inventoryService from '../../services/inventoryService';

function TransferForm() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [sourceStock, setSourceStock] = useState([]);
  const [formError, setFormError] = useState('');

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      sourceBranchId: '',
      destinationBranchId: '',
      items: [{ productId: '', quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');
  const sourceBranchId = watch('sourceBranchId');

  useEffect(() => {
    branchService.listActiveBranches().then(setBranches);
  }, []);

  useEffect(() => {
    if (!sourceBranchId) {
      setSourceStock([]);
      return;
    }
    inventoryService
      .listInventory({ branchId: sourceBranchId, limit: 200 })
      .then((result) => setSourceStock(result.items.filter((row) => row.available_quantity > 0)));
  }, [sourceBranchId]);

  const availableFor = (productId) => sourceStock.find((row) => String(row.product_id) === String(productId))?.available_quantity ?? 0;

  const onSubmit = async (values) => {
    setFormError('');
    const payload = {
      sourceBranchId: Number(values.sourceBranchId),
      destinationBranchId: Number(values.destinationBranchId),
      items: values.items.map((item) => ({ productId: Number(item.productId), quantity: Number(item.quantity) })),
    };

    try {
      const transfer = await transferService.createTransfer(payload);
      navigate(`/transfers/${transfer.id}`, { replace: true });
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create transfer.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">New Stock Transfer</h1>
          <p className="page-subtitle">Request stock movement between branches — a Manager must approve before inventory updates</p>
        </div>
      </div>

      {formError && <div className="alert alert-danger mb-4" role="alert">{formError}</div>}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="card mb-5">
          <div className="card-header"><span className="card-title">Transfer Details</span></div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="sourceBranchId">Source Branch</label>
                <select id="sourceBranchId" className={`form-control ${errors.sourceBranchId ? 'form-control-error' : ''}`} {...register('sourceBranchId', { required: 'Source branch is required' })}>
                  <option value="">Select a branch</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                {errors.sourceBranchId && <span className="form-error">{errors.sourceBranchId.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="destinationBranchId">Destination Branch</label>
                <select
                  id="destinationBranchId"
                  className={`form-control ${errors.destinationBranchId ? 'form-control-error' : ''}`}
                  {...register('destinationBranchId', {
                    required: 'Destination branch is required',
                    validate: (value) => String(value) !== String(sourceBranchId) || 'Destination must differ from source branch',
                  })}
                >
                  <option value="">Select a branch</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                {errors.destinationBranchId && <span className="form-error">{errors.destinationBranchId.message}</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-5">
          <div className="card-header">
            <span className="card-title">Items</span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => append({ productId: '', quantity: 1 })} disabled={!sourceBranchId}>
              <FiPlus aria-hidden="true" /> Add Line
            </button>
          </div>
          {!sourceBranchId ? (
            <div className="card-body">
              <p className="text-sm text-secondary">Select a source branch to see available stock.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Available</th>
                    <th>Quantity</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => {
                    const productId = watchedItems[index]?.productId;
                    const available = availableFor(productId);
                    const qty = Number(watchedItems[index]?.quantity) || 0;
                    const overLimit = productId && qty > available;
                    return (
                      <tr key={field.id}>
                        <td>
                          <select className="form-control" {...register(`items.${index}.productId`, { required: true })}>
                            <option value="">Select product</option>
                            {sourceStock.map((row) => (
                              <option key={row.product_id} value={row.product_id}>
                                {row.product_name} ({row.product_code})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="text-sm">{productId ? available : '—'}</td>
                        <td style={{ width: 100 }}>
                          <input
                            type="number"
                            min="1"
                            className={`form-control ${overLimit ? 'form-control-error' : ''}`}
                            {...register(`items.${index}.quantity`, { required: true, min: 1 })}
                          />
                          {overLimit && <span className="form-error">Exceeds available stock</span>}
                        </td>
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
          )}
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/transfers')}>Cancel</button>
          <button type="submit" className={`btn btn-primary ${isSubmitting ? 'btn-loading' : ''}`} disabled={isSubmitting}>
            Submit Transfer Request
          </button>
        </div>
      </form>
    </div>
  );
}

export default TransferForm;

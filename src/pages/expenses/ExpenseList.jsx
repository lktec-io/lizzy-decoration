import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiPlus, FiEdit2, FiTrash2, FiDollarSign } from 'react-icons/fi';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import SearchInput from '../../components/common/SearchInput';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import KPICard from '../../components/dashboard/KPICard';
import { useTable } from '../../hooks/useTable';
import { usePermission } from '../../hooks/usePermission';
import * as expenseService from '../../services/expenseService';
import * as branchService from '../../services/branchService';
import { formatCurrency } from '../../utils/formatCurrency';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-TZ', { dateStyle: 'medium' });
}

function ExpenseList() {
  const canCreate = usePermission('expenses.create');
  const canEdit = usePermission('expenses.edit');
  const canDelete = usePermission('expenses.delete');

  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);

  const fetchExpenses = useCallback((params) => expenseService.listExpenses(params), []);
  const { items, meta, loading, page, setPage, search, setSearch, filters, setFilters, refetch } = useTable(fetchExpenses);

  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { expenseCategoryId: '', branchId: '', amount: '', description: '', expenseDate: todayIso() } });

  useEffect(() => {
    expenseService.listExpenseCategories().then(setCategories);
    branchService.listActiveBranches().then(setBranches);
  }, []);

  const openCreate = () => {
    setEditing(null);
    reset({ expenseCategoryId: '', branchId: '', amount: '', description: '', expenseDate: todayIso() });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (expense) => {
    setEditing(expense);
    reset({
      expenseCategoryId: expense.expense_category_id,
      branchId: expense.branch_id,
      amount: expense.amount,
      description: expense.description || '',
      expenseDate: expense.expense_date,
    });
    setError('');
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    setError('');
    const payload = {
      expenseCategoryId: Number(values.expenseCategoryId),
      branchId: Number(values.branchId),
      amount: Number(values.amount),
      description: values.description || undefined,
      expenseDate: values.expenseDate,
    };
    try {
      if (editing) {
        await expenseService.updateExpense(editing.id, payload);
      } else {
        await expenseService.createExpense(payload);
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save expense.');
    }
  };

  const handleDelete = async () => {
    setActionError('');
    try {
      await expenseService.deleteExpense(deleting.id);
      refetch();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to delete expense.');
    }
  };

  const columns = [
    { key: 'expense_date', label: 'Date', render: (row) => formatDate(row.expense_date) },
    { key: 'category_name', label: 'Category' },
    { key: 'description', label: 'Description', render: (row) => row.description || '—' },
    { key: 'branch_name', label: 'Branch' },
    { key: 'paid_by', label: 'Recorded By', render: (row) => (row.paid_by_first_name ? `${row.paid_by_first_name} ${row.paid_by_last_name}` : '—') },
    { key: 'amount', label: 'Amount', render: (row) => formatCurrency(row.amount) },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="table-actions">
          {canEdit && (
            <button type="button" className="btn btn-ghost btn-icon" onClick={() => openEdit(row)} aria-label="Edit expense">
              <FiEdit2 />
            </button>
          )}
          {canDelete && (
            <button type="button" className="btn btn-ghost btn-icon" onClick={() => setDeleting(row)} aria-label="Delete expense">
              <FiTrash2 />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">Track branch operating expenses</p>
        </div>
        {canCreate && (
          <div className="page-actions">
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              <FiPlus aria-hidden="true" /> New Expense
            </button>
          </div>
        )}
      </div>

      <div className="mb-5">
        <KPICard icon={FiDollarSign} label="Total (filtered results)" value={meta.totalAmount || 0} formatter={(v) => formatCurrency(v)} />
      </div>

      {actionError && <div className="alert alert-danger mb-4" role="alert">{actionError}</div>}

      <div className="card">
        <div className="table-toolbar">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by description..." />
          <div className="flex items-center gap-3">
            <select
              className="form-control"
              value={filters.categoryId || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, categoryId: e.target.value || undefined }))}
            >
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              className="form-control"
              value={filters.branchId || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, branchId: e.target.value || undefined }))}
            >
              <option value="">All Branches</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <input
              type="date"
              className="form-control"
              value={filters.dateFrom || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value || undefined }))}
            />
            <input
              type="date"
              className="form-control"
              value={filters.dateTo || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value || undefined }))}
            />
          </div>
        </div>
        <Table columns={columns} rows={items} loading={loading} emptyMessage="No expenses recorded yet" />
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Expense' : 'New Expense'}
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" form="expense-form" className={`btn btn-primary ${isSubmitting ? 'btn-loading' : ''}`} disabled={isSubmitting}>
              {editing ? 'Save Changes' : 'Record Expense'}
            </button>
          </>
        }
      >
        {error && <div className="alert alert-danger mb-4" role="alert">{error}</div>}
        <form id="expense-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label className="form-label form-label-required" htmlFor="expenseCategoryId">Category</label>
            <select id="expenseCategoryId" className={`form-control ${errors.expenseCategoryId ? 'form-control-error' : ''}`} {...register('expenseCategoryId', { required: 'Category is required' })}>
              <option value="">Select a category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.expenseCategoryId && <span className="form-error">{errors.expenseCategoryId.message}</span>}
          </div>
          <div className="form-group">
            <label className="form-label form-label-required" htmlFor="branchId">Branch</label>
            <select id="branchId" className={`form-control ${errors.branchId ? 'form-control-error' : ''}`} {...register('branchId', { required: 'Branch is required' })}>
              <option value="">Select a branch</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {errors.branchId && <span className="form-error">{errors.branchId.message}</span>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="amount">Amount</label>
              <input id="amount" type="number" min="0" step="0.01" className={`form-control ${errors.amount ? 'form-control-error' : ''}`} {...register('amount', { required: 'Amount is required', min: { value: 0.01, message: 'Amount must be greater than zero' } })} />
              {errors.amount && <span className="form-error">{errors.amount.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="expenseDate">Date</label>
              <input id="expenseDate" type="date" className={`form-control ${errors.expenseDate ? 'form-control-error' : ''}`} {...register('expenseDate', { required: 'Date is required' })} />
              {errors.expenseDate && <span className="form-error">{errors.expenseDate.message}</span>}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="description">Description</label>
            <input id="description" className="form-control" {...register('description')} />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Expense"
        message={deleting ? `Delete this ${deleting.category_name} expense of ${formatCurrency(deleting.amount)}? This cannot be undone.` : ''}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

export default ExpenseList;

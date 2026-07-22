import { useEffect, useRef, useState } from 'react';
import { FiDownload, FiUpload, FiCheckCircle } from 'react-icons/fi';
import Modal from '../../components/common/Modal';
import * as purchaseService from '../../services/purchaseService';
import * as branchService from '../../services/branchService';
import { formatCurrency } from '../../utils/formatCurrency';

const STATUS_BADGE = { valid: 'badge-success', invalid: 'badge-danger' };

// Three-step wizard: pick a branch + upload a file (server parses and
// validates every row without writing anything yet) -> review the preview
// table (valid/invalid/duplicate flags, nothing imports until this is
// confirmed) -> commit and show the final summary. Closing at any step
// before "Confirm Import" leaves the database untouched.
function PurchaseImportModal({ open, onClose, onImported }) {
  const [step, setStep] = useState('select');
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState('');
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open) branchService.listActiveBranches().then(setBranches);
  }, [open]);

  const reset = () => {
    setStep('select');
    setFileName('');
    setPreview(null);
    setResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleDownloadTemplate = async () => {
    try {
      await purchaseService.downloadImportTemplate();
    } catch {
      setError('Failed to download the template.');
    }
  };

  const handleFileSelected = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setFileName(file.name);
    setLoading(true);
    try {
      const data = await purchaseService.previewImport(file);
      setPreview(data);
      setStep('preview');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to read the uploaded file.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await purchaseService.commitImport({ branchId: Number(branchId), rows: preview.rows });
      setResult(data);
      setStep('result');
      onImported?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to import the file.');
    } finally {
      setLoading(false);
    }
  };

  const validCount = preview?.summary.validRows || 0;

  return (
    <Modal open={open} onClose={handleClose} title="Import Purchases from Excel" size="lg">
      {error && <div className="alert alert-danger mb-4" role="alert">{error}</div>}

      {step === 'select' && (
        <div>
          <p className="text-sm text-secondary mb-4">
            Download the template, fill in your products, and upload it here. Nothing is imported until you review
            and confirm the preview.
          </p>

          <div className="form-group mb-4">
            <label className="form-label form-label-required" htmlFor="importBranch">Receiving Branch</label>
            <select id="importBranch" className="form-control" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              <option value="">Select a branch</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div className="form-row">
            <button type="button" className="btn btn-secondary" onClick={handleDownloadTemplate}>
              <FiDownload aria-hidden="true" /> Download Template
            </button>
            <button
              type="button"
              className={`btn btn-primary ${loading ? 'btn-loading' : ''}`}
              disabled={!branchId || loading}
              onClick={() => fileInputRef.current?.click()}
            >
              <FiUpload aria-hidden="true" /> Upload Filled Template
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              style={{ display: 'none' }}
              onChange={handleFileSelected}
            />
          </div>
          {!branchId && <p className="text-xs text-secondary mt-2">Select a branch before uploading.</p>}
        </div>
      )}

      {step === 'preview' && preview && (
        <div>
          <p className="text-sm text-secondary mb-3">{fileName}</p>
          <div className="form-row mb-4">
            <span className="badge badge-neutral">{preview.summary.totalRows} rows</span>
            <span className="badge badge-success">{preview.summary.validRows} valid</span>
            <span className="badge badge-danger">{preview.summary.invalidRows} invalid</span>
            <span className="badge badge-warning">{preview.summary.duplicateRows} duplicate</span>
            <span className="badge badge-neutral">{preview.summary.rowsToCreate} new products</span>
            <span className="badge badge-neutral">{preview.summary.rowsToUpdate} product updates</span>
          </div>

          <div className="table-wrapper mb-4" style={{ maxHeight: 360, overflowY: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Row</th><th>Product</th><th>Category</th><th>Supplier</th><th>Qty</th>
                  <th>Buying Price</th><th>Action</th><th>Status</th><th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr key={row.rowNumber}>
                    <td>{row.rowNumber}</td>
                    <td>{row.productName || '—'}</td>
                    <td>{row.category || '—'}</td>
                    <td>{row.supplier || '—'}</td>
                    <td>{row.quantity ?? '—'}</td>
                    <td>{row.buyingPrice != null ? formatCurrency(row.buyingPrice) : '—'}</td>
                    <td>{row.status === 'valid' ? (row.action === 'update' ? 'Update' : 'Create') : '—'}</td>
                    <td><span className={`badge ${STATUS_BADGE[row.status] || 'badge-neutral'}`}>{row.status}</span></td>
                    <td className="text-xs">
                      {[...row.errors, ...row.warnings].join('; ') || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={reset}>Start Over</button>
            <button
              type="button"
              className={`btn btn-primary ${loading ? 'btn-loading' : ''}`}
              disabled={validCount === 0 || loading}
              onClick={handleConfirmImport}
            >
              Confirm Import ({validCount} row{validCount === 1 ? '' : 's'})
            </button>
          </div>
        </div>
      )}

      {step === 'result' && result && (
        <div>
          <div className="text-center mb-4">
            <FiCheckCircle size={40} className="text-success" aria-hidden="true" />
            <h3 className="mt-2">Import Complete</h3>
          </div>
          <div className="form-row mb-4">
            <span className="badge badge-success">{result.rowsImported} imported</span>
            <span className="badge badge-neutral">{result.productsCreated} products created</span>
            <span className="badge badge-neutral">{result.productsUpdated} products updated</span>
            <span className="badge badge-warning">{result.rowsSkipped} skipped</span>
            <span className="badge badge-neutral">{result.purchaseOrdersCreated} purchase order(s)</span>
          </div>

          {result.errors.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold mb-2">Errors</p>
              <ul className="text-xs text-secondary">
                {result.errors.map((e) => <li key={`err-${e.row}`}>Row {e.row}: {e.message}</li>)}
              </ul>
            </div>
          )}
          {result.warnings.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold mb-2">Warnings</p>
              <ul className="text-xs text-secondary">
                {result.warnings.map((w, i) => <li key={`warn-${w.row}-${i}`}>Row {w.row}: {w.message}</li>)}
              </ul>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-primary" onClick={handleClose}>Done</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default PurchaseImportModal;

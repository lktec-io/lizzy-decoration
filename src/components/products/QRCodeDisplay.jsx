import { useEffect, useState } from 'react';
import { FiDownload, FiPrinter, FiRefreshCw } from 'react-icons/fi';
import * as qrCodeService from '../../services/qrCodeService';
import * as labelService from '../../services/labelService';
import '../../styles/components/QRCodeDisplay.css';

function QRCodeDisplay({ productId, productName }) {
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    qrCodeService.getProductQr(productId)
      .then((data) => { if (!cancelled) setQr(data); })
      .catch(() => { if (!cancelled) setError('Failed to load QR code.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [productId]);

  const handleRegenerate = async () => {
    setRegenerating(true);
    setError('');
    try {
      const data = await qrCodeService.regenerateProductQr(productId);
      setQr(data);
    } catch {
      setError('Failed to regenerate QR code.');
    } finally {
      setRegenerating(false);
    }
  };

  const handlePrint = async () => {
    setPrinting(true);
    setError('');
    try {
      await labelService.printSingleLabel(productId, { size: 'medium' });
    } catch {
      setError('Failed to generate label PDF.');
    } finally {
      setPrinting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <span className="spinner" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div>
      {error && <div className="alert alert-danger mb-4" role="alert">{error}</div>}
      <div className="flex items-center gap-5">
        {qr && (
          <div className="qr-code-preview">
            <img src={qr.qr_path} alt={`QR code for ${productName}`} />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <a href={qr?.qr_path} download className="btn btn-secondary btn-sm">
            <FiDownload aria-hidden="true" /> Download QR
          </a>
          <button type="button" className={`btn btn-secondary btn-sm ${printing ? 'btn-loading' : ''}`} onClick={handlePrint} disabled={printing}>
            <FiPrinter aria-hidden="true" /> Print Label
          </button>
          <button
            type="button"
            className={`btn btn-outline btn-sm ${regenerating ? 'btn-loading' : ''}`}
            onClick={handleRegenerate}
            disabled={regenerating}
          >
            <FiRefreshCw aria-hidden="true" /> Regenerate
          </button>
        </div>
      </div>
    </div>
  );
}

export default QRCodeDisplay;

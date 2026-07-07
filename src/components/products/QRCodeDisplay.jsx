import { useEffect, useState } from 'react';
import { FiDownload, FiPrinter, FiRefreshCw } from 'react-icons/fi';
import * as qrCodeService from '../../services/qrCodeService';
import '../../styles/components/QRCodeDisplay.css';

function QRCodeDisplay({ productId, productName, productCode }) {
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
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

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=400,height=500');
    printWindow.document.write(`
      <html>
        <head><title>${productName} — Label</title></head>
        <body style="text-align:center; font-family: sans-serif; padding: 24px;">
          <img src="${qr.qr_path}" alt="QR" style="width:220px;height:220px;" />
          <p style="font-weight:600; margin-top:12px;">${productName}</p>
          <p style="color:#555;">${productCode}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
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
            <FiDownload aria-hidden="true" /> Download
          </a>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handlePrint}>
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

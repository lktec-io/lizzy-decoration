import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import '../../styles/components/QRScanner.css';

const ELEMENT_ID = 'qr-scanner-viewport';

// Reusable camera QR scanner. Requires a secure context (HTTPS in
// production, or localhost in dev — see docs/PROJECT_PLAN.md §9) and
// browser camera permission. onScan receives the raw decoded QR text —
// callers are responsible for JSON.parse-ing the product payload.
function QRScanner({ onScan, onError }) {
  const scannerRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | starting | scanning | error

  useEffect(() => {
    const scanner = new Html5Qrcode(ELEMENT_ID);
    scannerRef.current = scanner;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- starting the camera is an external-system side effect, not a derived-state pattern
    setStatus('starting');

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          onScan(decodedText);
        },
        () => {
          // Fired continuously while no QR is in frame — not an error, ignore.
        },
      )
      .then(() => setStatus('scanning'))
      .catch((err) => {
        setStatus('error');
        onError?.(err);
      });

    return () => {
      if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
        scanner.stop().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scanner lifecycle is intentionally mount/unmount only
  }, []);

  return (
    <div className="qr-scanner">
      <div id={ELEMENT_ID} className="qr-scanner-viewport" />
      {status === 'starting' && <p className="text-sm text-secondary mt-2">Starting camera...</p>}
      {status === 'error' && (
        <p className="text-sm text-danger mt-2">
          Could not access the camera. Check browser permissions and that this page is served over HTTPS.
        </p>
      )}
    </div>
  );
}

export default QRScanner;

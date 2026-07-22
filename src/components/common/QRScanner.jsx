import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import '../../styles/components/QRScanner.css';

const ELEMENT_ID = 'qr-scanner-viewport';

// A code held in front of the camera gets detected on every frame (~10/sec)
// until it's moved away — without this, one physical scan would fire onScan
// (and add-to-cart) a dozen times. A different code scanned immediately
// after is never blocked; only the *same* code repeating within the window
// is treated as "still the same physical scan."
const SCAN_COOLDOWN_MS = 1800;
const FLASH_DURATION_MS = 350;

// Real retail products carry 1D barcodes (EAN/UPC/Code128), not this app's
// self-printed QR labels — restricting to QR_CODE (the previous config) meant
// a genuine supermarket barcode was never even recognized by the decoder,
// let alone matched to a product. useBarCodeDetectorIfSupported opts into
// the browser's native BarcodeDetector API where available, which is both
// faster and more reliable than the pure-JS decoder for 1D formats.
const SCAN_FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
];

function playBeep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 1200;
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.15);
    oscillator.onended = () => ctx.close();
  } catch {
    // A beep is feedback, not a requirement — a scan that can't play audio
    // (autoplay policy, no AudioContext) must still add the product.
  }
}

// Reusable camera scanner for both QR labels and real 1D barcodes. Requires
// a secure context (HTTPS in production, or localhost in dev — see
// docs/PROJECT_PLAN.md §9) and browser camera permission. onScan receives
// the raw decoded text for every physically-distinct scan (already
// deduplicated and beeped/flashed) — callers decide whether it's JSON
// (self-printed QR) or a plain barcode string.
function QRScanner({ onScan, onError }) {
  const scannerRef = useRef(null);
  const lastScanRef = useRef({ text: null, time: 0 });
  const [status, setStatus] = useState('idle'); // idle | starting | scanning | error
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const scanner = new Html5Qrcode(ELEMENT_ID, {
      formatsToSupport: SCAN_FORMATS,
      useBarCodeDetectorIfSupported: true,
    });
    scannerRef.current = scanner;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- starting the camera is an external-system side effect, not a derived-state pattern
    setStatus('starting');

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        (decodedText) => {
          const now = Date.now();
          const last = lastScanRef.current;
          if (decodedText === last.text && now - last.time < SCAN_COOLDOWN_MS) return;
          lastScanRef.current = { text: decodedText, time: now };

          playBeep();
          setFlash(true);
          setTimeout(() => setFlash(false), FLASH_DURATION_MS);
          onScan(decodedText);
        },
        () => {
          // Fired continuously while no code is in frame — not an error, ignore.
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
    <div className={`qr-scanner ${flash ? 'qr-scanner-flash' : ''}`}>
      <div id={ELEMENT_ID} className="qr-scanner-viewport" />
      {status === 'starting' && <p className="text-sm text-secondary mt-2">Starting camera...</p>}
      {status === 'scanning' && <p className="text-sm text-secondary mt-2">Ready — scan continuously, no need to touch the screen.</p>}
      {status === 'error' && (
        <p className="text-sm text-danger mt-2">
          Could not access the camera. Use the search box — a barcode scanner or keyboard input works there too.
        </p>
      )}
    </div>
  );
}

export default QRScanner;

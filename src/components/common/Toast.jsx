import { motion } from 'framer-motion';
import { FiCheckCircle, FiAlertTriangle, FiXCircle, FiInfo, FiX } from 'react-icons/fi';

const VARIANT_ICONS = {
  success: FiCheckCircle,
  warning: FiAlertTriangle,
  error: FiXCircle,
  info: FiInfo,
};

// Auto-dismiss duration mirrored here so the CSS progress-bar animation
// (toast-progress, in Toast.css) and the JS dismiss timer in
// ToastContext.jsx never drift apart.
export const TOAST_DURATION_MS = 4000;

function Toast({ id, variant = 'info', message, onDismiss }) {
  const Icon = VARIANT_ICONS[variant] || FiInfo;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 32, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 32, scale: 0.95 }}
      transition={{ duration: 0.18 }}
      className={`toast toast-${variant}`}
      role="status"
    >
      <Icon className="toast-icon" aria-hidden="true" />
      <span className="toast-message">{message}</span>
      <button type="button" className="toast-close" onClick={() => onDismiss(id)} aria-label="Dismiss notification">
        <FiX />
      </button>
      <motion.div
        className="toast-progress"
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: TOAST_DURATION_MS / 1000, ease: 'linear' }}
      />
    </motion.div>
  );
}

export default Toast;

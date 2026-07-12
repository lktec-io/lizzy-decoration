import { motion } from 'framer-motion';
import '../../styles/components/EmptyState.css';

// A react-icons/fi glyph in a soft colored circle + heading + helper text +
// optional action — matches how Linear/Stripe/Notion actually render empty
// states (no illustration library installed or needed).
function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <motion.div
      className="empty-state"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {Icon && (
        <div className="empty-state-icon">
          <Icon aria-hidden="true" />
        </div>
      )}
      {title && <p className="empty-state-title">{title}</p>}
      {description && <p className="empty-state-description">{description}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </motion.div>
  );
}

export default EmptyState;

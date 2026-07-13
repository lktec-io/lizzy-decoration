import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiMapPin } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/components/DashboardHero.css';

function useLiveClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(timer);
  }, []);

  return now;
}

function getGreeting(hour) {
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function DashboardHero() {
  const { user } = useAuth();
  const now = useLiveClock();

  const firstName = user?.first_name || 'there';
  const branchLabel = user?.branch_name || 'All Branches';
  const greeting = getGreeting(now.getHours());
  const dateLabel = now.toLocaleDateString('en-TZ', { weekday: 'short', day: 'numeric', month: 'short' });
  const timeLabel = now.toLocaleTimeString('en-TZ', { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div
      className="dashboard-hero"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className="dashboard-hero-orb" aria-hidden="true" />

      <motion.div className="dashboard-hero-greeting-block" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <span className="dashboard-hero-eyebrow">{greeting}</span>
        <h1 className="dashboard-hero-title">Welcome back, {firstName}</h1>
      </motion.div>

      <div className="dashboard-hero-meta">
        <span className="dashboard-hero-chip">{dateLabel}</span>
        <span className="dashboard-hero-chip dashboard-hero-chip-time">{timeLabel}</span>
        <span className="dashboard-hero-chip">
          <FiMapPin aria-hidden="true" /> {branchLabel}
        </span>
      </div>
    </motion.div>
  );
}

export default DashboardHero;

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
  const dateLabel = now.toLocaleDateString('en-TZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeLabel = now.toLocaleTimeString('en-TZ', { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div
      className="dashboard-hero"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className="dashboard-hero-orb dashboard-hero-orb-1" aria-hidden="true" />
      <span className="dashboard-hero-orb dashboard-hero-orb-2" aria-hidden="true" />
      <span className="dashboard-hero-orb dashboard-hero-orb-3" aria-hidden="true" />

      <div className="dashboard-hero-content">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.15 }}>
          <span className="dashboard-hero-greeting">{greeting}</span>
          <h1 className="dashboard-hero-title">
            Welcome Back, {firstName} <span aria-hidden="true">👋</span>
          </h1>
          <p className="dashboard-hero-tagline">Have a productive day.</p>
        </motion.div>

        <div className="dashboard-hero-meta">
          <span className="dashboard-hero-chip">{dateLabel}</span>
          <span className="dashboard-hero-chip dashboard-hero-chip-time">{timeLabel}</span>
          <span className="dashboard-hero-chip">
            <FiMapPin aria-hidden="true" /> {branchLabel}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default DashboardHero;

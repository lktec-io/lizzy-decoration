import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiMapPin } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
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

function getGreetingKey(hour) {
  if (hour < 12) return 'greeting.morning';
  if (hour < 17) return 'greeting.afternoon';
  return 'greeting.evening';
}

function DashboardHero() {
  const { t } = useTranslation('dashboard');
  const { user } = useAuth();
  const now = useLiveClock();

  const firstName = user?.first_name || 'there';
  const branchLabel = user?.branch_name || t('common:allBranches');
  const greeting = t(getGreetingKey(now.getHours()));
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
        <h1 className="dashboard-hero-title">{t('welcomeBack')}, <span className="dashboard-hero-name">{firstName}</span></h1>
        <p className="dashboard-hero-subtitle">{t('heroSubtitle')}</p>
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

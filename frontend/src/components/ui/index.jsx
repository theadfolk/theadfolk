import React from 'react';
export { Button } from './Button';

// Badge Component
export function Badge({ children, variant = 'default', icon: Icon }) {
  const styles = {
    default: { bg: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' },
    success: { bg: 'var(--success-bg)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.3)' },
    danger: { bg: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.3)' },
    warning: { bg: 'var(--warning-bg)', color: 'var(--warning)', border: '1px solid rgba(245,158,11,0.3)' },
    info: { bg: 'var(--info-bg)', color: 'var(--info)', border: '1px solid rgba(59,130,246,0.3)' },
  };
  const s = styles[variant] || styles.default;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.35rem',
      padding: '0.2rem 0.6rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      backgroundColor: s.bg,
      color: s.color,
      border: s.border,
      whiteSpace: 'nowrap'
    }}>
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
}

// Progress Bar
export function ProgressBar({ label, value, max = 100 }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  let color = 'var(--success)';
  if (value < 40) color = 'var(--danger)';
  else if (value < 70) color = 'var(--warning)';

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontWeight: 600, color }}>{value}/{max}</span>
      </div>
      <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '9999px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${percentage}%`,
          backgroundColor: color,
          borderRadius: '9999px',
          transition: 'width 0.5s ease-in-out'
        }} />
      </div>
    </div>
  );
}

// Stat Card
export function StatCard({ title, value, icon: Icon, subtitle }) {
  return (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: '12px',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{title}</h3>
        {Icon && <Icon size={20} color="var(--accent-color)" />}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
      {subtitle && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{subtitle}</div>}
    </div>
  );
}

// Loading Spinner
export function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
      <svg style={{ width: '32px', height: '32px', animation: 'spin 1s linear infinite', color: 'var(--accent-color)' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }}></circle>
        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" style={{ opacity: 0.75 }}></path>
      </svg>
    </div>
  );
}

// Empty State
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 2rem',
      textAlign: 'center',
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: '12px',
      border: '1px dashed var(--border-color)'
    }}>
      {Icon && <Icon size={48} color="var(--text-secondary)" style={{ marginBottom: '1rem', opacity: 0.5 }} />}
      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', marginBottom: '1.5rem' }}>{description}</p>
      {action}
    </div>
  );
}

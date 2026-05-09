import React, { useEffect, useState } from 'react';
import { Badge } from './ui';
import BrandScreeningPanel from './BrandScreeningPanel';
import { Clock, DollarSign, User, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DealCard({ deal }) {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState('');

  // Live countdown hook
  useEffect(() => {
    if (!deal.deadline) return;
    
    const calculateTimeLeft = () => {
      const difference = new Date(deal.deadline) - new Date();
      if (difference <= 0) return 'Expired';
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      
      if (days > 0) return `${days}d ${hours}h left`;
      return `${hours}h left`;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 60000); // update every minute
    return () => clearInterval(timer);
  }, [deal.deadline]);

  // Determine status color
  let statusVariant = 'default';
  if (deal.status === 'Confirmed') statusVariant = 'success';
  if (deal.status === 'Negotiating') statusVariant = 'warning';
  if (deal.status === 'Completed') statusVariant = 'info';

  const screening = deal.brand_screenings?.[0];
  const redFlags = deal.red_flags;

  return (
    <div 
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer'
      }}
      onClick={(e) => {
        // Prevent navigation if clicking inside the screening panel toggle
        if (e.target.closest('.no-nav')) return;
        navigate(`/deals/${deal.id}`);
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', marginBottom: '0.25rem' }}>
            {deal.brand_name || 'Unknown Brand'}
          </h3>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {deal.campaign_name || 'General Outreach'}
          </div>
        </div>
        <Badge variant={statusVariant}>{deal.status}</Badge>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <User size={14} /> <span style={{ color: 'white' }}>{deal.poc_name || 'Unknown POC'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <DollarSign size={14} /> <span style={{ color: 'white', fontWeight: 600 }}>{deal.rate || 'TBD'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <Calendar size={14} /> <span style={{ color: 'white' }}>{deal.deadline ? new Date(deal.deadline).toLocaleDateString() : 'TBD'}</span>
        </div>
        {timeLeft && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: timeLeft === 'Expired' ? 'var(--danger)' : 'var(--warning)' }}>
            <Clock size={14} /> <span>{timeLeft}</span>
          </div>
        )}
      </div>

      <div className="no-nav" onClick={e => e.stopPropagation()}>
        <BrandScreeningPanel screening={screening} redFlags={redFlags} />
      </div>
    </div>
  );
}

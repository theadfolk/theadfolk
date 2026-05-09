import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StatCard, Button, EmptyState, LoadingSpinner } from '../components/ui';
import DealCard from '../components/DealCard';
import { Briefcase, DollarSign, AlertOctagon, Filter, RefreshCw, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, api, dbUser, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterRec, setFilterRec] = useState('All');

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const res = await api.get('/deals');
      if (res.data.success) {
        setDeals(res.data.deals);
        setLastSynced(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load deals', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await api.post('/sync');
      addToast(res.data.message || 'Sync started!', 'success');
      // Auto-refresh after a delay to catch background updates
      setTimeout(fetchDeals, 5000);
      setTimeout(fetchDeals, 15000);
    } catch (err) {
      addToast(err.response?.data?.error || 'Sync failed', 'error');
    } finally {
      setSyncing(false);
    }
  };

  // Memoized stats
  const stats = useMemo(() => {
    let active = 0;
    let earnings = 0;
    let hardPass = 0;

    deals.forEach(deal => {
      // Active count (not completed/rejected)
      if (deal.status !== 'Completed') active++;
      
      // Hard Pass count
      if (deal.brand_screenings?.[0]?.recommendation === 'Hard Pass') hardPass++;

      // Earnings (parse rate string if confirmed)
      if (deal.status === 'Confirmed' && deal.rate) {
        // Extract numbers from strings like "$1,500"
        const numStr = deal.rate.replace(/[^0-9.]/g, '');
        const val = parseFloat(numStr);
        if (!isNaN(val)) earnings += val;
      }
    });

    return { active, earnings, hardPass };
  }, [deals]);

  // Filter deals
  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      if (filterStatus !== 'All' && deal.status !== filterStatus) return false;
      const rec = deal.brand_screenings?.[0]?.recommendation;
      if (filterRec !== 'All' && rec !== filterRec) return false;
      return true;
    });
  }, [deals, filterStatus, filterRec]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Welcome back, {user?.email}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Button variant="ghost" onClick={() => navigate('/settings')}>
            <Settings size={18} /> Settings
          </Button>
          <Button variant="ghost" onClick={() => { logout(); navigate('/login'); }}>
            <LogOut size={18} /> Sign Out
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {lastSynced ? `Synced: ${lastSynced}` : 'Not synced yet'}
            </span>
            <Button onClick={handleSync} isLoading={syncing}>
              <RefreshCw size={16} /> Sync Now
            </Button>
          </div>
        </div>
      </div>

      {/* Gmail Banner */}
      {!dbUser?.google_access_token && (
        <div style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: 'var(--warning)' }}>
            <strong>Action Required:</strong> You need to connect your Gmail to allow DealIQ to scan for deals.
          </div>
          <Button variant="secondary" onClick={() => navigate('/connect-gmail')}>Connect Gmail</Button>
        </div>
      )}

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <StatCard title="Active Deals" value={stats.active} icon={Briefcase} />
        <StatCard title="Confirmed Earnings" value={`$${stats.earnings.toLocaleString()}`} icon={DollarSign} subtitle="From deals marked Confirmed" />
        <StatCard title="Hard Pass Deals" value={stats.hardPass} icon={AlertOctagon} />
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <Filter size={18} color="var(--text-secondary)" />
        <select 
          value={filterStatus} 
          onChange={e => setFilterStatus(e.target.value)}
          style={{ background: 'var(--bg-color)', color: 'white', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '6px' }}
        >
          <option value="All">All Statuses</option>
          <option value="Outreach">Outreach</option>
          <option value="Negotiating">Negotiating</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Completed">Completed</option>
        </select>
        <select 
          value={filterRec} 
          onChange={e => setFilterRec(e.target.value)}
          style={{ background: 'var(--bg-color)', color: 'white', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '6px' }}
        >
          <option value="All">All AI Recommendations</option>
          <option value="Strong Fit">Strong Fit</option>
          <option value="Decent Fit">Decent Fit</option>
          <option value="Weak Fit">Weak Fit</option>
          <option value="Hard Pass">Hard Pass</option>
        </select>
      </div>

      {/* Deal Grid */}
      {deals.length === 0 ? (
        <EmptyState 
          icon={Briefcase} 
          title="No deals found" 
          description="Click 'Sync Now' to scan your inbox for new brand deals, or ensure your Gmail is connected."
        />
      ) : filteredDeals.length === 0 ? (
        <EmptyState 
          title="No deals match filters" 
          description="Try adjusting your status or recommendation filters to see more deals."
          action={<Button onClick={() => { setFilterStatus('All'); setFilterRec('All'); }}>Clear Filters</Button>}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {filteredDeals.map(deal => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      )}
    </div>
  );
}

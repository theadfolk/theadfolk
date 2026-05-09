import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button, Badge, ProgressBar, LoadingSpinner } from '../components/ui';
import { ArrowLeft, User, DollarSign, Calendar, Mail, Zap, ShieldCheck } from 'lucide-react';

export default function DealDetail() {
  const { id } = useParams();
  const { api } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeal();
  }, [id]);

  const fetchDeal = async () => {
    try {
      // In a real app we'd fetch the specific deal by ID, but since our API returns all deals,
      // we'll fetch all and find it. If we have a GET /deals/:id we'd use that.
      const res = await api.get('/deals');
      if (res.data.success) {
        const found = res.data.deals.find(d => d.id === id);
        if (found) setDeal(found);
        else addToast('Deal not found', 'error');
      }
    } catch (err) {
      addToast('Failed to load deal', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    try {
      // Update local optimistically
      setDeal(prev => ({ ...prev, status: newStatus }));
      
      const res = await api.patch(`/deals/${id}`, { status: newStatus });
      addToast('Status updated', 'success');
    } catch (err) {
      addToast('Failed to update status', 'error');
      fetchDeal(); // Revert
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!deal) return <div style={{ padding: '2rem', textAlign: 'center' }}>Deal not found</div>;

  const screening = deal.brand_screenings?.[0];
  const redFlags = deal.red_flags;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <Button variant="ghost" onClick={() => navigate('/dashboard')} style={{ marginBottom: '1.5rem', padding: '0' }}>
        <ArrowLeft size={16} /> Back to Dashboard
      </Button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0 }}>{deal.brand_name}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', margin: '0.5rem 0 0 0' }}>{deal.campaign_name}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Status:</span>
          <select 
            value={deal.status} 
            onChange={handleStatusChange}
            style={{ background: 'var(--bg-color)', color: 'white', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '6px', fontWeight: 600 }}
          >
            <option value="Outreach">Outreach</option>
            <option value="Negotiating">Negotiating</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Left Column: Deal Info */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>Deal Details</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '8px' }}><User size={20} color="var(--accent-color)" /></div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Point of Contact</div>
                <div style={{ fontWeight: 500 }}>{deal.poc_name} ({deal.poc_email})</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '8px' }}><DollarSign size={20} color="var(--accent-color)" /></div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Proposed Rate</div>
                <div style={{ fontWeight: 500 }}>{deal.rate || 'Not specified'}</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '8px' }}><Calendar size={20} color="var(--accent-color)" /></div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Deadline</div>
                <div style={{ fontWeight: 500 }}>{deal.deadline ? new Date(deal.deadline).toLocaleDateString() : 'Not specified'}</div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Deliverables</div>
              {deal.deliverables && deal.deliverables.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-primary)' }}>
                  {deal.deliverables.map((d, i) => <li key={i} style={{ marginBottom: '0.25rem' }}>{d}</li>)}
                </ul>
              ) : (
                <div style={{ color: 'var(--text-secondary)' }}>No deliverables extracted.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: AI Screening */}
        <div style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '12px', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', borderBottom: '1px solid rgba(139, 92, 246, 0.2)', paddingBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} color="var(--accent-color)" /> AI Brand Intelligence
          </h2>

          {!screening ? (
            <div style={{ color: 'var(--text-secondary)' }}>No AI screening data available for this deal. Upgrade to Pro for deep brand research.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {screening.recommendation && (
                  <Badge variant={screening.recommendation.includes('Fit') ? 'success' : 'danger'} icon={Zap}>
                    {screening.recommendation}
                  </Badge>
                )}
                {screening.is_business_email !== undefined && (
                  <Badge variant={screening.is_business_email ? 'success' : 'warning'} icon={Mail}>
                    {screening.is_business_email ? 'Verified Business Email' : 'Personal Email Used'}
                  </Badge>
                )}
              </div>

              <div>
                <ProgressBar label="Legitimacy Score" value={screening.legimacy_score} max={100} />
                <ProgressBar label="Synergy Score" value={screening.synergy_score} max={100} />
              </div>

              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Company Overview</div>
                <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.6 }}>{screening.brand_description || 'No description available.'}</p>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Industry</div>
                  <div style={{ fontWeight: 500 }}>{screening.industry || 'Unknown'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Size</div>
                  <div style={{ fontWeight: 500 }}>{screening.company_size || 'Unknown'}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Risk Analysis</div>
                {redFlags && redFlags.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--danger)' }}>
                    {redFlags.map((flag, idx) => <li key={idx} style={{ marginBottom: '0.25rem' }}>{flag}</li>)}
                  </ul>
                ) : (
                  <div style={{ color: 'var(--success)' }}>No red flags detected during screening.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

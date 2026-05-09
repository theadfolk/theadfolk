import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button, LoadingSpinner } from '../components/ui';
import { ArrowLeft, User, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { api, dbUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/profile');
      if (res.data.profile) {
        setNiche(res.data.profile.niche_description || '');
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/profile', { niche_description: niche });
      addToast('Profile saved successfully!', 'success');
    } catch (err) {
      addToast('Failed to save profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <Button variant="ghost" onClick={() => navigate('/dashboard')} style={{ marginBottom: '1.5rem', padding: '0' }}>
        <ArrowLeft size={16} /> Back to Dashboard
      </Button>

      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <User size={28} color="var(--accent-color)" /> Creator Profile
      </h1>

      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Content Niche & Audience</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
          Describe your channel's niche, target demographic, and general content style. 
          DealIQ's AI engine uses this information to calculate Synergy Scores for incoming brand deals,
          helping you filter out bad fits automatically.
        </p>

        <form onSubmit={handleSave}>
          <textarea
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="E.g., I create tech reviews and coding tutorials for beginner developers aged 18-35. My style is fast-paced and educational."
            rows={6}
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: '8px',
              background: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid var(--border-color)',
              color: 'white',
              fontSize: '0.95rem',
              outline: 'none',
              resize: 'vertical',
              marginBottom: '1rem'
            }}
          />
          <Button type="submit" isLoading={saving}>Save Profile</Button>
        </form>
      </div>

      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CreditCard size={20} color="var(--accent-color)" /> Billing & Subscription
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          You are currently on the <strong style={{ color: 'white', textTransform: 'uppercase' }}>{dbUser?.subscription_tier || 'Free'}</strong> tier.
        </p>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          To upgrade or manage your subscription, please use the Stripe portal (integration pending full dashboard deployment).
        </p>
      </div>
    </div>
  );
}

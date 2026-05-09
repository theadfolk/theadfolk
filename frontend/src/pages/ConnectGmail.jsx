import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui';

export default function ConnectGmail() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleConnect = () => {
    setLoading(true);
    // Determine the backend API URL. In dev with proxy it's just /auth, but here we redirect the full window
    // so we should use the VITE_API_URL directly.
    const apiUrl = import.meta.env.VITE_API_URL || '';
    window.location.href = `${apiUrl}/auth/google?userId=${user.id}`;
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem'
    }}>
      <div style={{
        background: 'rgba(17, 24, 39, 0.7)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '3rem',
        maxWidth: '500px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem auto'
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: '#ea4335'}}>
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
        </div>
        
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Connect your Gmail</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
          DealIQ securely scans your inbox for incoming brand deal opportunities, extracts key campaign details like rates and deadlines, and automatically tracks them on your dashboard.
        </p>

        <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', fontSize: '0.85rem', color: '#93c5fd', textAlign: 'left' }}>
          <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Privacy First</strong>
          We only scan for emails matching brand deal patterns. We never share, sell, or read your personal emails.
        </div>

        <Button onClick={handleConnect} isLoading={loading} style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}>
          Connect Gmail Account
        </Button>
      </div>
    </div>
  );
}

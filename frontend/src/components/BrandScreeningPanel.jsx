import React, { useState } from 'react';
import { Badge, ProgressBar, Button } from './ui';
import { ChevronDown, ChevronUp, AlertCircle, ShieldCheck, Mail, Zap, ExternalLink } from 'lucide-react';

export default function BrandScreeningPanel({ screening, redFlags }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!screening && (!redFlags || redFlags.length === 0)) {
    return (
      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          <AlertCircle size={14} /> No screening data available. Upgrade to Pro for AI analysis.
        </div>
      </div>
    );
  }

  // Determine recommendation color
  let recVariant = 'default';
  if (screening?.recommendation === 'Strong Fit') recVariant = 'success';
  if (screening?.recommendation === 'Decent Fit') recVariant = 'info';
  if (screening?.recommendation === 'Weak Fit') recVariant = 'warning';
  if (screening?.recommendation === 'Hard Pass') recVariant = 'danger';

  return (
    <div style={{ 
      marginTop: '1rem', 
      background: 'rgba(0,0,0,0.2)', 
      borderRadius: '8px', 
      border: '1px solid var(--border-color)',
      overflow: 'hidden'
    }}>
      {/* Header / Toggle */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          padding: '0.75rem 1rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          cursor: 'pointer',
          background: isOpen ? 'rgba(255,255,255,0.02)' : 'transparent'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldCheck size={16} color="var(--accent-color)" />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>AI Brand Screening</span>
          
          {/* Quick summary badges visible when closed */}
          {!isOpen && screening && (
            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '0.5rem' }}>
              <Badge variant={recVariant}>{screening.recommendation}</Badge>
              {redFlags?.length > 0 && <Badge variant="danger">{redFlags.length} Red Flags</Badge>}
            </div>
          )}
        </div>
        {isOpen ? <ChevronUp size={16} color="var(--text-secondary)" /> : <ChevronDown size={16} color="var(--text-secondary)" />}
      </div>

      {/* Expanded Content */}
      {isOpen && (
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Left Col: Scores */}
            <div>
              {screening?.legimacy_score !== undefined && (
                <ProgressBar label="Legitimacy Score" value={screening.legimacy_score} max={100} />
              )}
              {screening?.synergy_score !== undefined && (
                <ProgressBar label="Synergy Score" value={screening.synergy_score} max={100} />
              )}
              
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {screening?.is_business_email !== undefined && (
                  <Badge variant={screening.is_business_email ? 'success' : 'warning'} icon={Mail}>
                    {screening.is_business_email ? 'Business Email' : 'Personal Email'}
                  </Badge>
                )}
                {screening?.recommendation && (
                  <Badge variant={recVariant} icon={Zap}>
                    {screening.recommendation}
                  </Badge>
                )}
              </div>
            </div>

            {/* Right Col: Details */}
            <div>
              {screening?.company_size && (
                <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Size: </span>
                  {screening.company_size}
                </div>
              )}
              {screening?.industry && (
                <div style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Industry: </span>
                  {screening.industry}
                </div>
              )}
              
              {/* Red Flags */}
              <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Risk Analysis</div>
              {redFlags && redFlags.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--danger)', fontSize: '0.85rem' }}>
                  {redFlags.map((flag, idx) => <li key={idx}>{flag}</li>)}
                </ul>
              ) : (
                <div style={{ color: 'var(--success)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <ShieldCheck size={14} /> No red flags detected
                </div>
              )}
            </div>
          </div>
          
          <Button variant="secondary" style={{ width: '100%', fontSize: '0.85rem' }}>
            View Full Research <ExternalLink size={14} />
          </Button>
        </div>
      )}
    </div>
  );
}

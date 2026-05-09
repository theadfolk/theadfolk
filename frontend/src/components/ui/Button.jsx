import React from 'react';

export function Button({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  className = '', 
  disabled, 
  ...props 
}) {
  const baseStyles = "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  
  // Custom styles replicating Tailwind for our vanilla CSS setup
  const variants = {
    primary: "bg-[#8b5cf6] hover:bg-[#7c3aed] text-white",
    secondary: "bg-[#27272a] hover:bg-[#3f3f46] text-white border border-[#3f3f46]",
    danger: "bg-[rgba(239,68,68,0.15)] hover:bg-[rgba(239,68,68,0.25)] text-[#ef4444] border border-[rgba(239,68,68,0.2)]",
    ghost: "hover:bg-[#27272a] text-gray-300"
  };

  // Inline styles since we aren't using Tailwind
  const styleStr = {
    primary: { backgroundColor: 'var(--accent-color)', color: '#fff', border: 'none' },
    secondary: { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' },
    danger: { backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger)' },
    ghost: { backgroundColor: 'transparent', color: 'var(--text-secondary)', border: 'none' }
  };

  return (
    <button
      className={`${baseStyles} ${className}`}
      style={{
        ...styleStr[variant],
        padding: '0.5rem 1rem',
        borderRadius: '6px',
        cursor: (disabled || isLoading) ? 'not-allowed' : 'pointer',
        opacity: (disabled || isLoading) ? 0.6 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        fontWeight: 500,
        transition: 'all 0.2s'
      }}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin" style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }}></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" style={{ opacity: 0.75 }}></path>
        </svg>
      )}
      {children}
    </button>
  );
}

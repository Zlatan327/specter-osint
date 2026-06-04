'use client';

export default function AccountGrid({ accounts }) {
  if (!accounts || accounts.length === 0) {
    return (
      <div className="account-grid-empty">
        <p>No online platform profiles resolved for this username.</p>
        <style jsx>{`
          .account-grid-empty {
            padding: var(--space-8);
            text-align: center;
            background: rgba(17, 24, 39, 0.2);
            border: 1px dashed rgba(100, 116, 139, 0.2);
            border-radius: var(--radius-lg);
            color: var(--text-muted);
            font-style: italic;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="account-grid">
      {accounts.map((acct, idx) => (
        <a 
          key={idx} 
          href={acct.url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="account-card"
        >
          <div className="account-card__top">
            <span className="account-card__platform">{acct.platform}</span>
            <span className="account-card__arrow">↗</span>
          </div>
          <div className="account-card__username">@{acct.username || 'profile'}</div>
          <div className="account-card__category">{acct.category || 'social'}</div>
        </a>
      ))}

      <style jsx>{`
        .account-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: var(--space-4);
          width: 100%;
        }

        .account-card {
          display: flex;
          flex-direction: column;
          background: rgba(17, 24, 39, 0.4);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(100, 116, 139, 0.15);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          transition: all var(--transition-base);
          text-decoration: none;
        }

        .account-card:hover {
          border-color: var(--cyan);
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(6, 182, 212, 0.15);
        }

        .account-card__top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-2);
        }

        .account-card__platform {
          font-size: var(--text-sm);
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.01em;
        }

        .account-card__arrow {
          font-size: var(--text-xs);
          color: var(--text-muted);
          transition: transform var(--transition-base), color var(--transition-base);
        }

        .account-card:hover .account-card__arrow {
          transform: translate(2px, -2px);
          color: var(--cyan);
        }

        .account-card__username {
          font-size: var(--text-base);
          font-family: var(--font-mono);
          color: var(--cyan);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: var(--space-2);
        }

        .account-card__category {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          font-weight: 600;
          margin-top: auto;
        }
      `}</style>
    </div>
  );
}

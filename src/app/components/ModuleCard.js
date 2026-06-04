'use client';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'var(--text-muted)', dotClass: 'status-dot--pending', bg: 'transparent' },
  running: { label: 'Scanning...', color: 'var(--cyan)', dotClass: 'status-dot--running', bg: 'var(--cyan-subtle)' },
  complete: { label: 'Complete', color: 'var(--emerald)', dotClass: 'status-dot--complete', bg: 'var(--emerald-subtle)' },
  error: { label: 'Error', color: 'var(--red)', dotClass: 'status-dot--error', bg: 'var(--red-subtle)' },
  disabled: { label: 'Skipped', color: 'var(--text-muted)', dotClass: 'status-dot--disabled', bg: 'transparent' },
};

export default function ModuleCard({ name, icon, status = 'pending', duration, resultCount }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  return (
    <div className={`module-card module-card--${status}`}>
      <div className="module-card__header">
        <span className="module-card__icon">{icon || '📦'}</span>
        <div className={`status-dot ${config.dotClass}`} />
      </div>

      <div className="module-card__name">{name}</div>

      <div className="module-card__footer">
        <span className="module-card__status" style={{ color: config.color }}>
          {config.label}
        </span>
        {status === 'complete' && resultCount > 0 && (
          <span className="module-card__count badge badge--cyan">{resultCount}</span>
        )}
        {duration !== null && duration !== undefined && (
          <span className="module-card__duration">{(duration / 1000).toFixed(1)}s</span>
        )}
      </div>

      {status === 'running' && (
        <div className="module-card__progress">
          <div className="progress-bar progress-bar--indeterminate">
            <div className="progress-bar__fill" />
          </div>
        </div>
      )}

      <style jsx>{`
        .module-card {
          background: rgba(17, 24, 39, 0.5);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(100, 116, 139, 0.12);
          border-radius: var(--radius-lg);
          padding: var(--space-3) var(--space-4);
          transition: all var(--transition-base);
          position: relative;
          overflow: hidden;
          min-width: 140px;
        }

        .module-card:hover {
          border-color: rgba(100, 116, 139, 0.25);
          transform: translateY(-1px);
        }

        .module-card--running {
          border-color: var(--cyan-border);
          box-shadow: 0 0 15px rgba(6, 182, 212, 0.08);
          animation: moduleRunPulse 2s ease-in-out infinite;
        }

        .module-card--complete {
          border-color: var(--emerald-border);
        }

        .module-card--error {
          border-color: var(--red-border);
        }

        @keyframes moduleRunPulse {
          0%, 100% { box-shadow: 0 0 15px rgba(6, 182, 212, 0.08); }
          50% { box-shadow: 0 0 25px rgba(6, 182, 212, 0.15); }
        }

        .module-card__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-2);
        }

        .module-card__icon {
          font-size: var(--text-xl);
        }

        .module-card__name {
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: var(--space-2);
        }

        .module-card__footer {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          flex-wrap: wrap;
        }

        .module-card__status {
          font-size: var(--text-xs);
          font-weight: 500;
        }

        .module-card__count {
          font-size: 10px;
          padding: 1px 6px;
        }

        .module-card__duration {
          font-size: var(--text-xs);
          color: var(--text-muted);
          font-family: var(--font-mono);
          margin-left: auto;
        }

        .module-card__progress {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
        }
      `}</style>
    </div>
  );
}

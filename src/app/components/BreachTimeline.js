'use client';

export default function BreachTimeline({ breaches }) {
  if (!breaches || breaches.length === 0) {
    return (
      <div className="breach-empty">
        <p>No historical database breaches reported for this target.</p>
        <style jsx>{`
          .breach-empty {
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

  // Sort breaches by date descending
  const sortedBreaches = [...breaches].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="breach-timeline">
      <div className="breach-timeline__track" />
      <div className="breach-timeline__items">
        {sortedBreaches.map((item, idx) => {
          const dateStr = item.date ? new Date(item.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
          }) : 'Unknown Date';

          return (
            <div key={idx} className="breach-item">
              <div className="breach-item__marker" />
              <div className="breach-item__content">
                <div className="breach-item__header">
                  <h4 className="breach-item__title">{item.name}</h4>
                  <span className="breach-item__date font-mono">{dateStr}</span>
                </div>
                <div className="breach-item__meta">
                  <span className="badge badge--red">Leaked Entries: {item.pwnCount?.toLocaleString() || 'Unknown'}</span>
                </div>
                <div 
                  className="breach-item__description"
                  dangerouslySetInnerHTML={{ __html: item.description }}
                />
                {item.dataTypes && item.dataTypes.length > 0 && (
                  <div className="breach-item__data-types">
                    <span className="breach-item__data-types-label">Compromised Data:</span>
                    <div className="breach-item__tags">
                      {item.dataTypes.map((type, tIdx) => (
                        <span key={tIdx} className="badge badge--dark">{type}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .breach-timeline {
          position: relative;
          padding-left: var(--space-6);
        }

        .breach-timeline__track {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 7px;
          width: 2px;
          background: linear-gradient(180deg, var(--red) 0%, rgba(239, 68, 68, 0.1) 100%);
        }

        .breach-timeline__items {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .breach-item {
          position: relative;
        }

        .breach-item__marker {
          position: absolute;
          left: -23px;
          top: 6px;
          width: 16px;
          height: 16px;
          border-radius: var(--radius-full);
          background: #000;
          border: 3px solid var(--red);
          box-shadow: 0 0 10px var(--red-glow);
          z-index: 2;
        }

        .breach-item__content {
          background: rgba(17, 24, 39, 0.4);
          border: 1px solid rgba(100, 116, 139, 0.15);
          border-radius: var(--radius-lg);
          padding: var(--space-4) var(--space-5);
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          transition: border-color var(--transition-base);
        }

        .breach-item__content:hover {
          border-color: var(--red-border);
        }

        .breach-item__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: var(--space-2);
        }

        .breach-item__title {
          font-size: var(--text-base);
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .breach-item__date {
          font-size: var(--text-xs);
          color: var(--text-muted);
        }

        .breach-item__meta {
          display: flex;
          gap: var(--space-2);
        }

        .breach-item__description {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .breach-item__description :global(a) {
          color: var(--cyan);
          text-decoration: none;
        }

        .breach-item__description :global(a:hover) {
          text-decoration: underline;
        }

        .breach-item__data-types {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
          margin-top: var(--space-2);
          padding-top: var(--space-3);
          border-top: 1px solid rgba(100, 116, 139, 0.1);
        }

        .breach-item__data-types-label {
          font-size: var(--text-xs);
          font-weight: 600;
          color: var(--text-secondary);
        }

        .breach-item__tags {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
        }
      `}</style>
    </div>
  );
}

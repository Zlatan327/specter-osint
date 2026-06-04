'use client';

export default function DorkLinks({ dorks }) {
  if (!dorks || dorks.length === 0) return null;

  // Group dorks by category
  const categories = dorks.reduce((acc, dork) => {
    const cat = dork.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(dork);
    return acc;
  }, {});

  return (
    <div className="dork-links">
      <div className="dork-links__list">
        {Object.entries(categories).map(([category, items]) => (
          <div key={category} className="dork-links__category">
            <h3 className="dork-links__category-title">{category}</h3>
            <div className="dork-links__grid">
              {items.map((item, idx) => (
                <div key={idx} className="dork-card">
                  <div className="dork-card__header">
                    <span className="dork-card__label">{item.label}</span>
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="dork-card__link"
                    >
                      Search ⚡
                    </a>
                  </div>
                  <div className="dork-card__query font-mono">
                    {item.query}
                  </div>
                  <p className="dork-card__description">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .dork-links {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .dork-links__category {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          margin-bottom: var(--space-4);
        }

        .dork-links__category-title {
          font-size: var(--text-lg);
          font-weight: 700;
          color: var(--text-primary);
          border-bottom: 1px solid rgba(100, 116, 139, 0.15);
          padding-bottom: var(--space-2);
          margin: 0;
        }

        .dork-links__grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: var(--space-4);
        }

        .dork-card {
          background: rgba(17, 24, 39, 0.4);
          border: 1px solid rgba(100, 116, 139, 0.15);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          transition: border-color var(--transition-base);
        }

        .dork-card:hover {
          border-color: var(--cyan-border);
        }

        .dork-card__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .dork-card__label {
          font-size: var(--text-sm);
          font-weight: 700;
          color: var(--text-primary);
        }

        .dork-card__link {
          font-size: var(--text-xs);
          font-weight: 600;
          color: var(--cyan);
          text-decoration: none;
          padding: var(--space-1) var(--space-2);
          background: rgba(6, 182, 212, 0.1);
          border: 1px solid var(--cyan-border);
          border-radius: var(--radius-md);
          transition: all var(--transition-base);
        }

        .dork-card__link:hover {
          background: var(--cyan);
          color: #000;
          box-shadow: 0 0 10px rgba(6, 182, 212, 0.2);
        }

        .dork-card__query {
          font-size: var(--text-xs);
          background: rgba(0, 0, 0, 0.3);
          padding: var(--space-2);
          border-radius: var(--radius-md);
          border: 1px solid rgba(100, 116, 139, 0.1);
          color: var(--emerald);
          word-break: break-all;
          overflow-wrap: anywhere;
        }

        .dork-card__description {
          font-size: var(--text-xs);
          color: var(--text-muted);
          line-height: 1.4;
          margin: 0;
        }
      `}</style>
    </div>
  );
}

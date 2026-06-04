'use client';

export default function ProfileCard({ profile }) {
  if (!profile || !profile.identity) return null;

  const { names = [], emails = [], phones = [], locations = [], avatars = [], bios = [] } = profile.identity;
  
  // Pick primary details (highest confidence)
  const primaryAvatar = avatars.length > 0 ? avatars[0].value : null;
  const primaryName = names.length > 0 ? names[0].value : 'Unknown Entity';
  const primaryBio = bios.length > 0 ? bios[0].value : 'No bio information gathered.';
  
  return (
    <div className="profile-card">
      <div className="profile-card__accent-line" />
      <div className="profile-card__header">
        {primaryAvatar ? (
          <img src={primaryAvatar} alt="Avatar" className="profile-card__avatar" />
        ) : (
          <div className="profile-card__avatar profile-card__avatar--placeholder">
            <span>👤</span>
          </div>
        )}
        <div className="profile-card__meta">
          <h2 className="profile-card__name">{primaryName}</h2>
          <span className="badge badge--cyan">Confidence Score: {profile.overallScore || 0}%</span>
        </div>
      </div>

      <div className="profile-card__body">
        {primaryBio && (
          <p className="profile-card__bio">
            {primaryBio}
          </p>
        )}

        <div className="profile-card__details">
          {names.length > 1 && (
            <div className="profile-card__detail-item">
              <span className="profile-card__detail-label">Aliases:</span>
              <div className="profile-card__detail-tags">
                {names.slice(1).map((n, idx) => (
                  <span key={idx} className="badge" title={`Confidence: ${n.confidence * 100}% (Source: ${n.source})`}>
                    {n.value}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="profile-card__detail-item">
            <span className="profile-card__detail-label">Emails:</span>
            <div className="profile-card__detail-values">
              {emails.length > 0 ? emails.map((e, idx) => (
                <div key={idx} className="profile-card__detail-value">
                  <span className="font-mono">{e.value}</span>
                  <span className="profile-card__detail-meta">Source: {e.source} ({(e.confidence * 100).toFixed(0)}%)</span>
                </div>
              )) : <span className="profile-card__no-data">None found</span>}
            </div>
          </div>

          <div className="profile-card__detail-item">
            <span className="profile-card__detail-label">Phones:</span>
            <div className="profile-card__detail-values">
              {phones.length > 0 ? phones.map((p, idx) => (
                <div key={idx} className="profile-card__detail-value">
                  <span className="font-mono">{p.value}</span>
                  <span className="profile-card__detail-meta">Source: {p.source} ({(p.confidence * 100).toFixed(0)}%)</span>
                </div>
              )) : <span className="profile-card__no-data">None found</span>}
            </div>
          </div>

          <div className="profile-card__detail-item">
            <span className="profile-card__detail-label">Locations:</span>
            <div className="profile-card__detail-values">
              {locations.length > 0 ? locations.map((l, idx) => (
                <div key={idx} className="profile-card__detail-value">
                  <span>📍 {l.value}</span>
                  <span className="profile-card__detail-meta">Source: {l.source} ({(l.confidence * 100).toFixed(0)}%)</span>
                </div>
              )) : <span className="profile-card__no-data">None found</span>}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .profile-card {
          position: relative;
          background: rgba(17, 24, 39, 0.4);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(100, 116, 139, 0.15);
          border-radius: var(--radius-xl);
          padding: var(--space-6);
          overflow: hidden;
          transition: border-color var(--transition-base), box-shadow var(--transition-base);
        }

        .profile-card:hover {
          border-color: rgba(6, 182, 212, 0.3);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }

        .profile-card__accent-line {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--cyan), var(--emerald));
        }

        .profile-card__header {
          display: flex;
          align-items: center;
          gap: var(--space-5);
          margin-bottom: var(--space-6);
        }

        .profile-card__avatar {
          width: 80px;
          height: 80px;
          border-radius: var(--radius-lg);
          border: 2px solid var(--cyan-border);
          object-fit: cover;
          box-shadow: 0 0 15px rgba(6, 182, 212, 0.15);
        }

        .profile-card__avatar--placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(30, 41, 59, 0.5);
          width: 80px;
          height: 80px;
          border-radius: var(--radius-lg);
          border: 1px solid rgba(100, 116, 139, 0.2);
        }

        .profile-card__avatar--placeholder span {
          font-size: 32px;
        }

        .profile-card__meta {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .profile-card__name {
          font-size: var(--text-2xl);
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--text-primary);
          margin: 0;
        }

        .profile-card__body {
          display: flex;
          flex-direction: column;
          gap: var(--space-5);
        }

        .profile-card__bio {
          font-size: var(--text-base);
          line-height: 1.6;
          color: var(--text-secondary);
          margin: 0;
          padding-bottom: var(--space-4);
          border-bottom: 1px solid rgba(100, 116, 139, 0.1);
        }

        .profile-card__details {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .profile-card__detail-item {
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: var(--space-2);
        }

        .profile-card__detail-label {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .profile-card__detail-values {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .profile-card__detail-value {
          display: flex;
          flex-direction: column;
          font-size: var(--text-sm);
          color: var(--text-primary);
        }

        .profile-card__detail-meta {
          font-size: var(--text-xs);
          color: var(--text-muted);
          margin-top: 2px;
        }

        .profile-card__detail-tags {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
        }

        .profile-card__no-data {
          font-size: var(--text-sm);
          color: var(--text-muted);
          font-style: italic;
        }

        @media (max-width: 640px) {
          .profile-card__header {
            flex-direction: column;
            text-align: center;
            gap: var(--space-4);
          }

          .profile-card__detail-item {
            grid-template-columns: 1fr;
            gap: var(--space-1);
          }
        }
      `}</style>
    </div>
  );
}

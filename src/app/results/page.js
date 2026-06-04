'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { useInvestigation } from '../../hooks/useInvestigation.js';
import ModuleCard from '../components/ModuleCard.js';
import ProfileCard from '../components/ProfileCard.js';
import AccountGrid from '../components/AccountGrid.js';
import BreachTimeline from '../components/BreachTimeline.js';
import DorkLinks from '../components/DorkLinks.js';

function ResultsDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('query');
  const type = searchParams.get('type');

  const {
    state,
    modules,
    profile,
    error,
    startTime,
    totalDuration,
    statusMessage,
    startInvestigation,
    reset,
  } = useInvestigation();

  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (query && type) {
      startInvestigation(query, type);
    } else {
      router.push('/');
    }
    return () => reset();
  }, [query, type, startInvestigation, router, reset]);

  // Adjust active tab if it's invalid for this query type
  useEffect(() => {
    if (type !== 'phone' && (activeTab === 'financial' || activeTab === 'phone_intel')) {
      setActiveTab('overview');
    }
    if (type !== 'domain' && activeTab === 'domain_intel') {
      setActiveTab('overview');
    }
  }, [type, activeTab]);

  const handleExport = () => {
    if (!profile) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(profile, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `specter_report_${type}_${query.replace(/[^a-zA-Z0-9]/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (error) {
    return (
      <div className="error-panel">
        <h2 className="error-panel__title">⚠️ Investigation Aborted</h2>
        <p className="error-panel__message">{error}</p>
        <button className="error-panel__btn" onClick={() => router.push('/')}>
          Return to Terminal
        </button>
        <style jsx>{`
          .error-panel {
            max-width: 500px;
            margin: var(--space-12) auto;
            background: rgba(17, 24, 39, 0.4);
            border: 1px solid var(--red-border);
            padding: var(--space-6);
            border-radius: var(--radius-xl);
            text-align: center;
          }
          .error-panel__title {
            color: var(--red);
          }
          .error-panel__message {
            color: var(--text-secondary);
            margin-bottom: var(--space-6);
          }
          .error-panel__btn {
            background: var(--red);
            color: #fff;
            border: none;
            padding: var(--space-3) var(--space-6);
            border-radius: var(--radius-lg);
            cursor: pointer;
          }
        `}</style>
      </div>
    );
  }

  // Get phone lookup data helper
  const phoneLookupModule = modules['phone-lookup']?.data;
  const callerIdModule = modules['caller-id']?.data;
  const financialTrailModule = modules['financial-trail']?.data;
  const domainIntelModule = modules['domain-intel']?.data;

  return (
    <div className="dashboard">
      {/* Top Banner */}
      <header className="dashboard__header">
        <div className="dashboard__header-left">
          <button className="dashboard__back-btn" onClick={() => router.push('/')}>
            ← Back
          </button>
          <div className="dashboard__target">
            <span className="dashboard__target-label">Target:</span>
            <span className="dashboard__target-value font-mono">{query}</span>
            <span className="badge badge--cyan uppercase">{type}</span>
          </div>
        </div>

        <div className="dashboard__header-right">
          <div className="dashboard__status">
            <span className="dashboard__status-message">{statusMessage}</span>
            {totalDuration && (
              <span className="dashboard__duration font-mono">
                Duration: {(totalDuration / 1000).toFixed(1)}s
              </span>
            )}
          </div>
          {profile && (
            <button className="dashboard__export-btn" onClick={handleExport}>
              Export JSON 💾
            </button>
          )}
        </div>
      </header>

      {/* Main Grid */}
      <div className="dashboard__content">
        {/* Left Side - Module Status list */}
        <aside className="dashboard__sidebar">
          <h3 className="dashboard__sidebar-title">Pipeline Matrix</h3>
          <div className="dashboard__module-list">
            {Object.entries(modules).map(([key, mod]) => (
              <ModuleCard
                key={key}
                name={mod.name}
                icon={mod.icon}
                status={mod.status}
                duration={mod.duration}
                resultCount={mod.resultCount}
              />
            ))}
          </div>
        </aside>

        {/* Right Side - Tab Panels */}
        <main className="dashboard__main">
          {/* Tabs header */}
          <div className="dashboard__tabs">
            <button 
              className={`dashboard__tab ${activeTab === 'overview' ? 'dashboard__tab--active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`dashboard__tab ${activeTab === 'accounts' ? 'dashboard__tab--active' : ''}`}
              onClick={() => setActiveTab('accounts')}
            >
              Accounts {profile?.accounts?.length > 0 && `(${profile.accounts.length})`}
            </button>

            {type === 'phone' && (
              <>
                <button 
                  className={`dashboard__tab ${activeTab === 'phone_intel' ? 'dashboard__tab--active' : ''}`}
                  onClick={() => setActiveTab('phone_intel')}
                >
                  Phone Intelligence
                </button>
                <button 
                  className={`dashboard__tab ${activeTab === 'financial' ? 'dashboard__tab--active' : ''}`}
                  onClick={() => setActiveTab('financial')}
                >
                  Financial Trail
                </button>
              </>
            )}

            {type === 'domain' && (
              <button 
                className={`dashboard__tab ${activeTab === 'domain_intel' ? 'dashboard__tab--active' : ''}`}
                onClick={() => setActiveTab('domain_intel')}
              >
                Domain Intel
              </button>
            )}

            <button 
              className={`dashboard__tab ${activeTab === 'breaches' ? 'dashboard__tab--active' : ''}`}
              onClick={() => setActiveTab('breaches')}
            >
              Leaks/Breaches {profile?.breaches?.length > 0 && `(${profile.breaches.length})`}
            </button>

            <button 
              className={`dashboard__tab ${activeTab === 'dorks' ? 'dashboard__tab--active' : ''}`}
              onClick={() => setActiveTab('dorks')}
            >
              Dorks
            </button>

            <button 
              className={`dashboard__tab ${activeTab === 'raw' ? 'dashboard__tab--active' : ''}`}
              onClick={() => setActiveTab('raw')}
            >
              Raw Data
            </button>
          </div>

          {/* Tab contents */}
          <div className="dashboard__tab-content">
            {/* Overview */}
            {activeTab === 'overview' && (
              <div className="tab-pane">
                {profile ? (
                  <ProfileCard profile={profile} />
                ) : (
                  <div className="tab-pane__loading">
                    <span className="spinner" />
                    <p>Compiling findings and analyzing identity structures...</p>
                  </div>
                )}
              </div>
            )}

            {/* Accounts */}
            {activeTab === 'accounts' && (
              <div className="tab-pane">
                <AccountGrid accounts={profile?.accounts || []} />
              </div>
            )}

            {/* Phone Intel */}
            {type === 'phone' && activeTab === 'phone_intel' && (
              <div className="tab-pane flex-column gap-6">
                <div className="panel-card">
                  <h3 className="panel-card__title">Carrier & Routing Information</h3>
                  <div className="panel-grid">
                    <div className="panel-grid-item">
                      <span className="panel-grid-label">E.164 Number:</span>
                      <span className="font-mono">{phoneLookupModule?.phone || 'Loading...'}</span>
                    </div>
                    <div className="panel-grid-item">
                      <span className="panel-grid-label">Country:</span>
                      <span>{phoneLookupModule?.country || 'Loading...'}</span>
                    </div>
                    <div className="panel-grid-item">
                      <span className="panel-grid-label">Network Carrier:</span>
                      <span className="text-cyan font-bold">{phoneLookupModule?.carrier || 'Loading...'}</span>
                    </div>
                    <div className="panel-grid-item">
                      <span className="panel-grid-label">WhatsApp Status:</span>
                      <span>
                        {callerIdModule?.whatsapp?.registered === true ? (
                          <span className="text-emerald font-bold">Registered (Active) 🟢</span>
                        ) : callerIdModule?.whatsapp?.registered === false ? (
                          <span className="text-muted">Not Registered 🔴</span>
                        ) : (
                          'Scanning...'
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {callerIdModule?.lookupLinks && callerIdModule.lookupLinks.length > 0 && (
                  <div className="panel-card">
                    <h3 className="panel-card__title">Interactive Verification Links</h3>
                    <div className="links-list">
                      {callerIdModule.lookupLinks.map((link, idx) => (
                        <div key={idx} className="link-item">
                          <div className="link-item__main">
                            <span className="link-item__platform">{link.platform}</span>
                            <p className="link-item__desc">{link.description}</p>
                          </div>
                          <a href={link.url} target="_blank" rel="noopener noreferrer" className="link-item__btn">
                            Verify ↗
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {callerIdModule?.searchLinks && callerIdModule.searchLinks.length > 0 && (
                  <div className="panel-card">
                    <h3 className="panel-card__title">Public Community Audits</h3>
                    <div className="links-list">
                      {callerIdModule.searchLinks.map((link, idx) => (
                        <div key={idx} className="link-item">
                          <div className="link-item__main">
                            <span className="link-item__platform">{link.platform}</span>
                            <p className="link-item__desc">{link.description}</p>
                          </div>
                          <a href={link.url} target="_blank" rel="noopener noreferrer" className="link-item__btn">
                            Audit Site 🔍
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Financial Trail */}
            {type === 'phone' && activeTab === 'financial' && (
              <div className="tab-pane flex-column gap-6">
                <div className="panel-card">
                  <h3 className="panel-card__title">Nigerian Fintech Wallets (Linked to Number)</h3>
                  <p className="panel-card__intro">
                    Fintech accounts in Nigeria require a BVN (Bank Verification Number) and NIN. Tracing the recipient OPay/PalmPay handles is a key channel for resolving suspects.
                  </p>
                  <div className="fintech-list">
                    {financialTrailModule?.fintechLinks ? financialTrailModule.fintechLinks.map((link, idx) => (
                      <div key={idx} className="fintech-item">
                        <div className="fintech-item__details">
                          <span className="fintech-item__name text-cyan">{link.platform}</span>
                          <p className="fintech-item__desc">{link.description}</p>
                          <p className="fintech-item__notes"><strong className="text-muted">Forensic:</strong> {link.notes}</p>
                        </div>
                        <a href={link.searchUrl} target="_blank" rel="noopener noreferrer" className="fintech-item__btn">
                          Audit Web Mention ↗
                        </a>
                      </div>
                    )) : <p className="text-muted">Loading fintech structures...</p>}
                  </div>
                </div>

                <div className="panel-card">
                  <h3 className="panel-card__title">Mobile Money USSD Vectors</h3>
                  <div className="ussd-grid">
                    {financialTrailModule?.mobileMoneyLinks?.map((m, idx) => (
                      <div key={idx} className="ussd-item">
                        <span className="ussd-item__platform">{m.platform}</span>
                        <span className="ussd-item__code font-mono">{m.ussdCode}</span>
                        <p className="ussd-item__notes">{m.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel-card">
                  <h3 className="panel-card__title">🚨 Law Enforcement Coordination Notes</h3>
                  <div className="law-list">
                    {financialTrailModule?.lawEnforcementNotes?.map((note, idx) => (
                      <div key={idx} className="law-item">
                        <h4 className="law-item__title">{note.title}</h4>
                        <p className="law-item__desc">{note.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Domain Intel */}
            {type === 'domain' && activeTab === 'domain_intel' && (
              <div className="tab-pane flex-column gap-6">
                <div className="panel-card">
                  <h3 className="panel-card__title">Domain Registration Data</h3>
                  <div className="panel-grid">
                    <div className="panel-grid-item">
                      <span className="panel-grid-label">Registrar:</span>
                      <span>{domainIntelModule?.registrar || 'Not Resolved'}</span>
                    </div>
                    <div className="panel-grid-item">
                      <span className="panel-grid-label">Registration Date:</span>
                      <span>{domainIntelModule?.created ? new Date(domainIntelModule.created).toLocaleString() : 'Not Resolved'}</span>
                    </div>
                    <div className="panel-grid-item">
                      <span className="panel-grid-label">Expiration Date:</span>
                      <span>{domainIntelModule?.expires ? new Date(domainIntelModule.expires).toLocaleString() : 'Not Resolved'}</span>
                    </div>
                  </div>
                </div>

                <div className="panel-card">
                  <h3 className="panel-card__title">DNS Records</h3>
                  <div className="dns-records">
                    {domainIntelModule?.dns && Object.entries(domainIntelModule.dns).map(([type, records]) => (
                      <div key={type} className="dns-group">
                        <h4 className="dns-group__title font-mono">{type}</h4>
                        <ul className="dns-group__list">
                          {records && records.length > 0 ? records.map((rec, rIdx) => (
                            <li key={rIdx} className="dns-group__item font-mono">{rec}</li>
                          )) : <li className="dns-group__item text-muted">No records resolved</li>}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Breaches */}
            {activeTab === 'breaches' && (
              <div className="tab-pane">
                <BreachTimeline breaches={profile?.breaches || []} />
              </div>
            )}

            {/* Dorks */}
            {activeTab === 'dorks' && (
              <div className="tab-pane">
                <DorkLinks dorks={profile?.dorks || []} />
              </div>
            )}

            {/* Raw JSON */}
            {activeTab === 'raw' && (
              <div className="tab-pane">
                <div className="raw-viewer">
                  <pre className="font-mono">{JSON.stringify(profile, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <style jsx>{`
        .dashboard {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
          min-height: 90vh;
          padding: var(--space-4) 0;
        }

        .dashboard__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-4);
          background: rgba(17, 24, 39, 0.4);
          border: 1px solid rgba(100, 116, 139, 0.15);
          border-radius: var(--radius-xl);
          flex-wrap: wrap;
          gap: var(--space-4);
        }

        .dashboard__header-left, .dashboard__header-right {
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }

        .dashboard__back-btn {
          background: transparent;
          border: 1px solid rgba(100, 116, 139, 0.3);
          color: var(--text-secondary);
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-lg);
          cursor: pointer;
          font-weight: 600;
          transition: all var(--transition-base);
        }

        .dashboard__back-btn:hover {
          border-color: var(--cyan);
          color: var(--cyan);
        }

        .dashboard__target {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .dashboard__target-label {
          color: var(--text-muted);
          font-size: var(--text-sm);
        }

        .dashboard__target-value {
          color: var(--text-primary);
          font-weight: 700;
          font-size: var(--text-lg);
        }

        .dashboard__status {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .dashboard__status-message {
          font-size: var(--text-sm);
          color: var(--cyan);
          font-weight: 600;
        }

        .dashboard__duration {
          font-size: var(--text-xs);
          color: var(--text-muted);
        }

        .dashboard__export-btn {
          background: linear-gradient(135deg, var(--cyan), var(--cyan-dim));
          border: none;
          color: #060a10;
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-lg);
          cursor: pointer;
          font-weight: 700;
          transition: all var(--transition-base);
        }

        .dashboard__export-btn:hover {
          box-shadow: 0 0 15px rgba(6, 182, 212, 0.25);
          transform: translateY(-1px);
        }

        .dashboard__content {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: var(--space-6);
          align-items: start;
        }

        @media (max-width: 1024px) {
          .dashboard__content {
            grid-template-columns: 1fr;
          }
        }

        .dashboard__sidebar {
          background: rgba(17, 24, 39, 0.2);
          border: 1px solid rgba(100, 116, 139, 0.1);
          border-radius: var(--radius-xl);
          padding: var(--space-4);
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .dashboard__sidebar-title {
          font-size: var(--text-sm);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          margin: 0;
        }

        .dashboard__module-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .dashboard__main {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
          min-width: 0;
        }

        .dashboard__tabs {
          display: flex;
          border-bottom: 1px solid rgba(100, 116, 139, 0.15);
          overflow-x: auto;
          white-space: nowrap;
          padding-bottom: 2px;
          gap: var(--space-2);
        }

        .dashboard__tab {
          background: transparent;
          border: none;
          color: var(--text-muted);
          padding: var(--space-3) var(--space-4);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-base);
          border-bottom: 2px solid transparent;
          font-size: var(--text-sm);
        }

        .dashboard__tab:hover {
          color: var(--text-primary);
        }

        .dashboard__tab--active {
          color: var(--cyan);
          border-bottom-color: var(--cyan);
        }

        .tab-pane {
          animation: tabFadeIn 0.3s ease-out;
        }

        @keyframes tabFadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .tab-pane__loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-12);
          text-align: center;
          color: var(--text-secondary);
          gap: var(--space-4);
        }

        .flex-column { display: flex; flex-direction: column; }
        .gap-6 { gap: var(--space-6); }

        .panel-card {
          background: rgba(17, 24, 39, 0.4);
          border: 1px solid rgba(100, 116, 139, 0.15);
          border-radius: var(--radius-xl);
          padding: var(--space-5);
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .panel-card__title {
          font-size: var(--text-base);
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .panel-card__intro {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0;
        }

        .panel-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-4);
        }

        .panel-grid-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .panel-grid-label {
          font-size: var(--text-xs);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }

        .links-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .link-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(100, 116, 139, 0.1);
          border-radius: var(--radius-lg);
          padding: var(--space-3) var(--space-4);
          gap: var(--space-4);
        }

        .link-item__platform {
          font-weight: 700;
          font-size: var(--text-sm);
          color: var(--text-primary);
        }

        .link-item__desc {
          font-size: var(--text-xs);
          color: var(--text-muted);
          margin: 2px 0 0 0;
        }

        .link-item__btn {
          text-decoration: none;
          color: var(--cyan);
          font-size: var(--text-xs);
          font-weight: 600;
          border: 1px solid var(--cyan-border);
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-md);
          background: rgba(6, 182, 212, 0.05);
          transition: all var(--transition-base);
        }

        .link-item__btn:hover {
          background: var(--cyan);
          color: #000;
        }

        .fintech-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .fintech-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(100, 116, 139, 0.1);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          gap: var(--space-4);
          flex-wrap: wrap;
        }

        .fintech-item__details {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
          flex: 1;
        }

        .fintech-item__name {
          font-weight: 700;
          font-size: var(--text-base);
        }

        .fintech-item__desc {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          margin: 0;
        }

        .fintech-item__notes {
          font-size: var(--text-xs);
          margin: var(--space-1) 0 0 0;
        }

        .fintech-item__btn {
          text-decoration: none;
          color: #000;
          background: var(--cyan);
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-md);
          font-size: var(--text-xs);
          font-weight: 700;
          transition: all var(--transition-base);
        }

        .fintech-item__btn:hover {
          box-shadow: 0 0 15px rgba(6, 182, 212, 0.2);
        }

        .ussd-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-4);
        }

        .ussd-item {
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(100, 116, 139, 0.15);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .ussd-item__platform {
          font-size: var(--text-xs);
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .ussd-item__code {
          font-size: var(--text-lg);
          color: var(--emerald);
          font-weight: 700;
        }

        .ussd-item__notes {
          font-size: var(--text-xs);
          color: var(--text-secondary);
          margin: 4px 0 0 0;
        }

        .law-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .law-item {
          border-left: 2px solid var(--red);
          padding-left: var(--space-4);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .law-item__title {
          font-size: var(--text-sm);
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .law-item__desc {
          font-size: var(--text-xs);
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.4;
        }

        .dns-records {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .dns-group {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(100, 116, 139, 0.1);
          border-radius: var(--radius-lg);
          padding: var(--space-3) var(--space-4);
        }

        .dns-group__title {
          font-size: var(--text-sm);
          color: var(--cyan);
          margin: 0 0 var(--space-2) 0;
          border-bottom: 1px solid rgba(100, 116, 139, 0.08);
          padding-bottom: 4px;
        }

        .dns-group__list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .dns-group__item {
          font-size: var(--text-xs);
          color: var(--text-secondary);
          word-break: break-all;
        }

        .raw-viewer {
          background: #05070f;
          border: 1px solid rgba(100, 116, 139, 0.2);
          border-radius: var(--radius-xl);
          padding: var(--space-5);
          overflow: auto;
          max-height: 600px;
        }

        .raw-viewer pre {
          margin: 0;
          font-size: var(--text-xs);
          color: var(--emerald);
        }

        .font-bold { font-weight: 700; }
        .text-cyan { color: var(--cyan); }
        .text-emerald { color: var(--emerald); }
        .text-muted { color: var(--text-muted); }
      `}</style>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="loading-page">
        <span className="spinner" />
        <p>Connecting to investigation terminal...</p>
        <style jsx>{`
          .loading-page {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 80vh;
            color: var(--text-secondary);
            gap: var(--space-4);
          }
        `}</style>
      </div>
    }>
      <ResultsDashboard />
    </Suspense>
  );
}

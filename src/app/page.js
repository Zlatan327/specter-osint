'use client';

import { useRouter } from 'next/navigation';
import SearchBar from './components/SearchBar.js';
import EthicsModal from './components/EthicsModal.js';

export default function Home() {
  const router = useRouter();

  const handleSearch = (query, type) => {
    const searchParams = new URLSearchParams();
    searchParams.set('query', query);
    searchParams.set('type', type);
    router.push(`/results?${searchParams.toString()}`);
  };

  return (
    <main className="home-container">
      <EthicsModal />

      <div className="home-hero">
        <div className="home-hero__logo">⚡ SPECTER</div>
        <h1 className="home-hero__title">
          Open-Source Intelligence <span className="text-glow">Engine</span>
        </h1>
        <p className="home-hero__subtitle">
          Aggregate public profiles, analyze phone numbers, trace digital footprints, and uncover financial channels across Nigerian networks and global systems.
        </p>

        <div className="home-hero__search">
          <SearchBar onSearch={handleSearch} />
        </div>
      </div>

      <div className="home-info-grid">
        <div className="info-card">
          <div className="info-card__icon">🏦</div>
          <h3 className="info-card__title">Financial Tracing</h3>
          <p className="info-card__desc">
            Identify potential OPay, PalmPay, and mobile money vectors linked to suspects' phone lines to trace payment endpoints.
          </p>
        </div>
        <div className="info-card">
          <div className="info-card__icon">📞</div>
          <h3 className="info-card__title">Caller ID Analysis</h3>
          <p className="info-card__desc">
            Corroborate identity via WhatsApp profiles, Truecaller, GetContact registers, and NCC prefix patterns.
          </p>
        </div>
        <div className="info-card">
          <div className="info-card__icon">🌐</div>
          <h3 className="info-card__title">Domain & Web Intel</h3>
          <p className="info-card__desc">
            Run RDAP database queries, DNS record analysis, and Google dorking matrices to discover websites or exposed configs.
          </p>
        </div>
      </div>

      <style jsx>{`
        .home-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 85vh;
          padding: var(--space-8) var(--space-4);
          gap: var(--space-12);
        }

        .home-hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          max-width: 800px;
          gap: var(--space-4);
        }

        .home-hero__logo {
          font-family: var(--font-mono);
          font-size: var(--text-base);
          font-weight: 700;
          letter-spacing: 0.2em;
          color: var(--cyan);
          text-transform: uppercase;
          text-shadow: 0 0 10px var(--cyan-glow);
          margin-bottom: var(--space-2);
        }

        .home-hero__title {
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -0.03em;
          color: var(--text-primary);
          margin: 0;
        }

        .home-hero__subtitle {
          font-size: var(--text-lg);
          line-height: 1.6;
          color: var(--text-secondary);
          max-width: 650px;
          margin: var(--space-2) 0 var(--space-6) 0;
        }

        .home-hero__search {
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .home-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: var(--space-6);
          width: 100%;
          max-width: 900px;
        }

        .info-card {
          background: rgba(17, 24, 39, 0.3);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(100, 116, 139, 0.12);
          border-radius: var(--radius-xl);
          padding: var(--space-5);
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          transition: all var(--transition-base);
        }

        .info-card:hover {
          border-color: rgba(6, 182, 212, 0.2);
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
        }

        .info-card__icon {
          font-size: var(--text-2xl);
        }

        .info-card__title {
          font-size: var(--text-base);
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .info-card__desc {
          font-size: var(--text-sm);
          line-height: 1.5;
          color: var(--text-secondary);
          margin: 0;
        }
      `}</style>
    </main>
  );
}

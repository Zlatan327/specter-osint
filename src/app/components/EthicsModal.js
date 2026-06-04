'use client';

import { useState, useEffect } from 'react';

export default function EthicsModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasAccepted = localStorage.getItem('specter_ethics_accepted');
    if (!hasAccepted) {
      setIsOpen(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('specter_ethics_accepted', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="ethics-modal">
      <div className="ethics-modal__overlay" />
      <div className="ethics-modal__container">
        <div className="ethics-modal__accent-line" />
        <h2 className="ethics-modal__title">⚠️ Investigation Terms of Service & Ethical Use</h2>
        
        <div className="ethics-modal__body">
          <p>
            You are opening <strong>Specter</strong>, a professional-grade Open Source Intelligence (OSINT) aggregator. Before proceeding, you must agree to the following terms:
          </p>

          <ol className="ethics-modal__list">
            <li>
              <strong>Legitimate Use Only:</strong> You will only use this tool for authorised security analysis, investigative journalism, digital forensics, search and rescue, or identifying public profiles with explicit permission.
            </li>
            <li>
              <strong>No Unlawful Actions:</strong> You will not use the gathered data for stalking, intimidation, harassment, cyberbullying, doxing (publishing private info maliciously), or blackmail.
            </li>
            <li>
              <strong>Data Privacy:</strong> This tool aggregates publicly accessible web endpoints and directories. It does not hack, breach private servers, or access unlisted private databases. All findings are derived from open sources.
            </li>
            <li>
              <strong>Local Compliance:</strong> You assume full legal responsibility for compiling information in accordance with local regulations, including the Nigeria Data Protection Act (NDPA) and other applicable cybercrime laws.
            </li>
          </ol>

          <div className="ethics-modal__warning">
            <p>
              <strong>Disclaimer:</strong> The developers and providers of Specter take no responsibility for actions taken using this tool. Misuse of OSINT tools can violate privacy regulations and lead to local prosecution.
            </p>
          </div>
        </div>

        <button className="ethics-modal__btn" onClick={handleAccept}>
          I understand and accept the terms of use
        </button>
      </div>

      <style jsx>{`
        .ethics-modal {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: var(--space-4);
        }

        .ethics-modal__overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
        }

        .ethics-modal__container {
          position: relative;
          background: #0d1321;
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--radius-xl);
          max-width: 600px;
          width: 100%;
          padding: var(--space-6);
          box-shadow: 0 0 50px rgba(239, 68, 68, 0.2);
          z-index: 2;
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          animation: modalScaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes modalScaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .ethics-modal__accent-line {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--red);
        }

        .ethics-modal__title {
          font-size: var(--text-xl);
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .ethics-modal__body {
          font-size: var(--text-sm);
          line-height: 1.6;
          color: var(--text-secondary);
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          max-height: 400px;
          overflow-y: auto;
          padding-right: var(--space-2);
        }

        /* Custom scrollbar for modal body */
        .ethics-modal__body::-webkit-scrollbar {
          width: 6px;
        }
        .ethics-modal__body::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }
        .ethics-modal__body::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.3);
          border-radius: 3px;
        }

        .ethics-modal__list {
          padding-left: var(--space-5);
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .ethics-modal__list li {
          margin-bottom: 2px;
        }

        .ethics-modal__warning {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: var(--radius-lg);
          padding: var(--space-3);
          color: var(--red);
        }

        .ethics-modal__warning p {
          margin: 0;
        }

        .ethics-modal__btn {
          width: 100%;
          background: var(--red);
          color: #fff;
          font-weight: 700;
          font-size: var(--text-sm);
          padding: var(--space-3);
          border-radius: var(--radius-lg);
          border: none;
          cursor: pointer;
          transition: all var(--transition-base);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: 0 0 15px rgba(239, 68, 68, 0.2);
        }

        .ethics-modal__btn:hover {
          background: #f87171;
          box-shadow: 0 0 25px rgba(239, 68, 68, 0.4);
        }

        .ethics-modal__btn:active {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
}

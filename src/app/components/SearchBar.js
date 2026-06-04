'use client';

import { useState, useEffect, useRef } from 'react';

const TYPE_OPTIONS = [
  { value: 'phone', label: '📱 Phone', placeholder: 'Enter phone number, e.g. 0803XXXXXXX or +234...' },
  { value: 'email', label: '📧 Email', placeholder: 'Enter email address...' },
  { value: 'username', label: '👤 Username', placeholder: 'Enter username to investigate...' },
  { value: 'name', label: '🏷️ Name', placeholder: 'Enter full name...' },
  { value: 'domain', label: '🌐 Domain', placeholder: 'Enter domain name...' },
];

function detectType(value) {
  if (!value) return null;
  const v = value.trim();
  if (v.includes('@') && v.includes('.')) return 'email';
  if (/^\+?\d[\d\s-]{6,}$/.test(v)) return 'phone';
  if (/^0[789]\d{9}$/.test(v.replace(/[\s-]/g, ''))) return 'phone'; // Nigerian format
  if (v.includes('.') && !v.includes(' ')) return 'domain';
  if (v.includes(' ')) return 'name';
  return 'username';
}

export default function SearchBar({ onSearch, isLoading = false }) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('phone');
  const [autoDetected, setAutoDetected] = useState(false);
  const inputRef = useRef(null);

  // Auto-detect input type
  useEffect(() => {
    const detected = detectType(query);
    if (detected && detected !== type) {
      setType(detected);
      setAutoDetected(true);
      const timer = setTimeout(() => setAutoDetected(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    onSearch?.(query.trim(), type);
  };

  const currentOption = TYPE_OPTIONS.find(o => o.value === type) || TYPE_OPTIONS[0];

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <div className="search-bar__container">
        {/* Type selector */}
        <div className="search-bar__type-wrapper">
          <select
            className="search-bar__type"
            value={type}
            onChange={(e) => { setType(e.target.value); setAutoDetected(false); }}
            disabled={isLoading}
          >
            {TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {autoDetected && (
            <span className="search-bar__auto-badge">AUTO</span>
          )}
        </div>

        {/* Input field */}
        <div className="search-bar__input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="search-bar__input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={currentOption.placeholder}
            disabled={isLoading}
            autoFocus
            autoComplete="off"
            spellCheck="false"
          />
          {isLoading && (
            <div className="search-bar__scanning">
              <div className="search-bar__scan-line" />
            </div>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          className={`search-bar__submit ${isLoading ? 'search-bar__submit--loading' : ''}`}
          disabled={!query.trim() || isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner spinner--sm" />
              <span className="hide-mobile">Scanning</span>
            </>
          ) : (
            <>
              <span className="search-bar__submit-icon">⚡</span>
              <span>Investigate</span>
            </>
          )}
        </button>
      </div>

      <style jsx>{`
        .search-bar {
          width: 100%;
          max-width: 720px;
        }

        .search-bar__container {
          display: flex;
          align-items: stretch;
          background: rgba(13, 19, 33, 0.8);
          border: 1px solid rgba(100, 116, 139, 0.2);
          border-radius: var(--radius-xl);
          overflow: hidden;
          transition: all var(--transition-base);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .search-bar__container:focus-within {
          border-color: var(--cyan);
          box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1), 0 0 30px rgba(6, 182, 212, 0.15), 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .search-bar__type-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          border-right: 1px solid rgba(100, 116, 139, 0.15);
          flex-shrink: 0;
        }

        .search-bar__type {
          appearance: none;
          padding: var(--space-4) var(--space-6) var(--space-4) var(--space-4);
          background: transparent url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 10px center;
          color: var(--text-primary);
          font-size: var(--text-sm);
          font-weight: 500;
          cursor: pointer;
          border: none;
          outline: none;
          min-width: 130px;
        }

        .search-bar__type option {
          background: var(--bg-card);
          color: var(--text-primary);
        }

        .search-bar__auto-badge {
          position: absolute;
          top: 4px;
          right: 8px;
          font-size: 9px;
          font-weight: 700;
          color: var(--cyan);
          background: var(--cyan-subtle);
          padding: 1px 4px;
          border-radius: var(--radius-full);
          letter-spacing: 0.1em;
          animation: fadeIn 0.3s ease;
        }

        .search-bar__input-wrapper {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-bar__input {
          width: 100%;
          padding: var(--space-4) var(--space-4);
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: var(--text-base);
          font-family: var(--font-mono);
          letter-spacing: 0.02em;
          outline: none;
        }

        .search-bar__input::placeholder {
          color: var(--text-muted);
          font-family: var(--font-sans);
          letter-spacing: normal;
        }

        .search-bar__scanning {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .search-bar__scan-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--cyan), transparent);
          animation: scanLineVertical 1.5s ease-in-out infinite;
          box-shadow: 0 0 10px var(--cyan-glow);
        }

        .search-bar__submit {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-4) var(--space-6);
          background: linear-gradient(135deg, var(--cyan), var(--cyan-dim));
          color: #060a10;
          font-weight: 600;
          font-size: var(--text-sm);
          cursor: pointer;
          border: none;
          transition: all var(--transition-base);
          white-space: nowrap;
          letter-spacing: 0.03em;
        }

        .search-bar__submit:hover:not(:disabled) {
          background: linear-gradient(135deg, #22d3ee, var(--cyan));
          box-shadow: 0 0 30px rgba(6, 182, 212, 0.3);
        }

        .search-bar__submit:active:not(:disabled) {
          transform: scale(0.97);
        }

        .search-bar__submit:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .search-bar__submit--loading {
          background: linear-gradient(135deg, var(--cyan-dim), #0e7490);
          min-width: 120px;
        }

        .search-bar__submit-icon {
          font-size: var(--text-lg);
        }

        @media (max-width: 640px) {
          .search-bar__container {
            flex-direction: column;
            border-radius: var(--radius-lg);
          }

          .search-bar__type-wrapper {
            border-right: none;
            border-bottom: 1px solid rgba(100, 116, 139, 0.15);
          }

          .search-bar__type {
            width: 100%;
          }

          .search-bar__submit {
            justify-content: center;
            padding: var(--space-4);
          }
        }
      `}</style>
    </form>
  );
}

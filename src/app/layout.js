import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata = {
  title: 'Specter OSINT | Investigative Intelligence Terminal',
  description: 'A professional open source intelligence aggregator to trace profiles, resolve identities, examine database breaches, and audit phone and financial footprints.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="antialiased">
        <div className="terminal-shell">
          <header className="terminal-navbar">
            <div className="terminal-navbar__brand font-mono">
              <span className="text-cyan">specter@osint</span>:~$ <span className="terminal-navbar__cursor">█</span>
            </div>
            <div className="terminal-navbar__meta font-mono">
              STATUS: <span className="text-emerald">ACTIVE</span> | REGION: NG/GLOBAL
            </div>
          </header>
          <div className="terminal-content">
            {children}
          </div>
          <footer className="terminal-footer font-mono">
            SPECTER CORE v1.0.0 // SECURE INTELLIGENCE PIPELINE // FOR LEGITIMATE OSINT INVESTIGATIONS ONLY
          </footer>
        </div>
      </body>
    </html>
  );
}

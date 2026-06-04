const module_def = {
  name: 'google-dorker',
  description: 'Generates strategic Google Dork search URLs targeting credentials, public documents, paste repositories, social profiles, and Nigerian forums (Nairaland).',
  accepts: ['email', 'username', 'phone', 'name', 'domain'],
  requiresKey: false,
  keyName: null,

  async run(input) {
    const query = input.query;
    const type = input.type;

    const results = {
      query,
      type,
      dorks: [],
    };

    const addDork = (category, label, dorkQuery, description) => {
      results.dorks.push({
        category,
        label,
        query: dorkQuery,
        url: `https://www.google.com/search?q=${encodeURIComponent(dorkQuery)}`,
        description,
      });
    };

    // 1. Dorks based on email
    if (type === 'email') {
      addDork(
        'Credentials & Leaks',
        'Check Paste Sites',
        `site:pastebin.com OR site:paste.org OR site:controlc.com OR site:gist.github.com "${query}"`,
        'Searches popular paste bins for raw dumps containing this email address.'
      );
      addDork(
        'Documents & Records',
        'Find Public Documents',
        `filetype:pdf OR filetype:doc OR filetype:docx OR filetype:xls OR filetype:xlsx "${query}"`,
        'Looks for spreadsheets, PDFs, or Word documents indexing this email (e.g., contacts, registers, rosters).'
      );
      addDork(
        'Forums & Debates',
        'Search Nairaland',
        `site:nairaland.com "${query}"`,
        'Searches Nigeria\'s largest online forum Nairaland for mentions of this email.'
      );
      addDork(
        'Government & Gazette',
        'Nigerian Gov Portals',
        `site:gov.ng "${query}"`,
        'Finds matching mentions in official Nigerian government websites and gazettes.'
      );
    }

    // 2. Dorks based on username
    if (type === 'username') {
      addDork(
        'Social Profiles',
        'Major Platforms Search',
        `site:linkedin.com/in/ OR site:instagram.com OR site:facebook.com OR site:twitter.com OR site:t.me "${query}"`,
        'Searches for profiles associated with this username on primary social networks.'
      );
      addDork(
        'Developer & Coding',
        'GitHub & Code Dumps',
        `site:github.com OR site:gitlab.com OR site:bitbucket.org "${query}"`,
        'Looks for repository ownership, forks, or code mentions matching this username.'
      );
      addDork(
        'Nigerian Context',
        'Nairaland Username Mentions',
        `site:nairaland.com "${query}" OR site:nairaland.com/action=profile;user= "${query}"`,
        'Searches Nairaland forum for users matching this username or topics detailing them.'
      );
    }

    // 3. Dorks based on phone
    if (type === 'phone') {
      const normalized = query.replace(/[\s\-\(\)\+]/g, '');
      let localFormat = normalized;
      if (normalized.startsWith('234') && normalized.length === 13) {
        localFormat = '0' + normalized.slice(3);
      }

      addDork(
        'Financial & Commerce',
        'Look for OPay/PalmPay references',
        `"${query}" OR "${localFormat}" opay OR palmpay OR transfer`,
        'Scans for transaction listings, bank transfer details, or screenshots referencing this phone number.'
      );
      addDork(
        'Social & Contacts',
        'Search Directories',
        `"${query}" OR "${localFormat}" contact OR caller OR name`,
        'Locates phonebooks, registers, or directories displaying this number.'
      );
      addDork(
        'Fraud & Scam Databases',
        'Nigerian Scam Reports',
        `"${localFormat}" OR "${query}" scam OR fraud OR ransom OR kidnapping OR police site:ng`,
        'Searches Nigerian news portals and blogs for criminal case files or public spam warnings involving this number.'
      );
    }

    // 4. Dorks based on names
    if (type === 'name') {
      addDork(
        'Professional Profiles',
        'LinkedIn Profile Finder',
        `site:linkedin.com/in/ "${query}"`,
        'Locates LinkedIn pages matching this person\'s name.'
      );
      addDork(
        'Social Accounts',
        'Facebook & Twitter Search',
        `site:facebook.com OR site:twitter.com "${query}"`,
        'Locates Twitter or Facebook entries for this name.'
      );
      addDork(
        'Nigerian Legal & Press',
        'Gazettes & Corporate Records',
        `site:cac.gov.ng OR site:gazette.gov.ng "${query}"`,
        'Checks Corporate Affairs Commission (Nigeria) registries or national gazettes for official details.'
      );
      addDork(
        'News & Press',
        'Nigerian Newspapers',
        `site:punchng.com OR site:vanguardngr.com OR site:premiumtimesng.com "${query}"`,
        'Searches primary Nigerian news platforms for articles mentioning this name.'
      );
    }

    // 5. Dorks based on domains
    if (type === 'domain') {
      addDork(
        'Subdomains',
        'Subdomain discovery',
        `site:*.${query} -www.${query}`,
        'Discovers subdomains of the target domain by excluding the standard www prefix.'
      );
      addDork(
        'Exposed Documents',
        'Exposed File Types',
        `site:${query} filetype:pdf OR filetype:doc OR filetype:xls OR filetype:xlsx OR filetype:xml`,
        'Scrapes the domain for publicly indexable configuration sheets, catalogs, and PDFs.'
      );
      addDork(
        'Directories',
        'Directory Listing',
        `site:${query} intitle:"index of"`,
        'Detects misconfigured folders indexing directory paths or assets.'
      );
    }

    return results;
  }
};

export default module_def;

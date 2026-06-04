import platforms from './platforms.json';

const module_def = {
  name: 'username-checker',
  description: 'Checks username availability across 15+ popular platforms, including Nairaland.',
  accepts: ['username'],
  requiresKey: false,
  keyName: null,

  async run(input) {
    const username = input.query || input.username;
    if (!username) throw new Error('Username is required');

    const results = {
      username,
      found: [],
      checked: 0,
    };

    // Safely skip check if query contains spaces (not a valid username format)
    if (username.includes(' ')) {
      return {
        ...results,
        skipped: true,
        message: 'Username checker skipped: usernames cannot contain spaces.'
      };
    }

    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    const checkPlatform = async (p) => {
      const url = p.url.replace('{}', username);
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': userAgent,
            'Accept-Language': 'en-US,en;q=0.9',
          },
          signal: AbortSignal.timeout(6000),
        });

        if (p.check_type === 'status') {
          if (response.status === 200) {
            return { platform: p.name, username, url, category: p.category || 'social' };
          }
        } else if (p.check_type === 'body_exclude') {
          const text = await response.text();
          if (response.status === 200 && !text.includes(p.exclude_text)) {
            return { platform: p.name, username, url, category: p.category || 'social' };
          }
        }
      } catch (err) {
        // Skip platform checks on network/timeout error
      }
      return null;
    };

    // Run checks in parallel
    const checks = platforms.map(p => checkPlatform(p));
    const resolved = await Promise.all(checks);
    
    results.found = resolved.filter(Boolean);
    results.checked = platforms.length;

    return results;
  }
};

export default module_def;

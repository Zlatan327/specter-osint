import dns from 'dns/promises';

const module_def = {
  name: 'email-lookup',
  description: 'Validates email structure, performs DNS MX record verification, and queries Hunter.io if an API key is available.',
  accepts: ['email'],
  requiresKey: false,
  keyName: 'HUNTER_API_KEY',

  async run(input) {
    const email = input.query || input.email;
    if (!email) throw new Error('Email is required');

    const parts = email.split('@');
    if (parts.length !== 2) throw new Error('Invalid email format');
    const domain = parts[1];

    const result = {
      email,
      domain,
      isValidFormat: true,
      mxRecords: [],
      hunterData: null,
    };

    // 1. DNS MX records lookup
    try {
      const records = await dns.resolveMx(domain);
      result.mxRecords = records.map(r => ({
        exchange: r.exchange,
        priority: r.priority,
      })).sort((a, b) => a.priority - b.priority);
    } catch (err) {
      result.mxRecords = [];
    }

    // 2. Hunter.io API integration (optional)
    const apiKey = process.env.HUNTER_API_KEY;
    if (apiKey) {
      try {
        const hunterUrl = `https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(email)}&api_key=${apiKey}`;
        const response = await fetch(hunterUrl, { signal: AbortSignal.timeout(5000) });
        if (response.ok) {
          const body = await response.json();
          if (body.data) {
            result.hunterData = {
              result: body.data.result,
              score: body.data.score,
              first_name: body.data.first_name,
              last_name: body.data.last_name,
              position: body.data.position,
              twitter: body.data.twitter,
              linkedin: body.data.linkedin,
              company: body.data.company,
            };
          }
        }
      } catch (err) {
        result.hunterData = { error: 'Failed to fetch Hunter.io data: ' + err.message };
      }
    }

    return result;
  }
};

export default module_def;

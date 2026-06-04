const module_def = {
  name: 'breach-checker',
  description: 'Checks if an email has been leaked in database breaches using Have I Been Pwned.',
  accepts: ['email'],
  requiresKey: false,
  keyName: 'HIBP_API_KEY',

  async run(input) {
    const email = input.query || input.email;
    if (!email) throw new Error('Email is required');

    const result = {
      email,
      breaches: [],
      hasBreaches: false,
    };

    const apiKey = process.env.HIBP_API_KEY;
    if (!apiKey) {
      return {
        ...result,
        skipped: true,
        message: 'Have I Been Pwned API key is required to check email breaches. Please set HIBP_API_KEY in your env file to unlock this feature.',
      };
    }

    try {
      const response = await fetch(
        `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`,
        {
          headers: {
            'hibp-api-key': apiKey,
            'user-agent': 'Specter-OSINT-App',
          },
          signal: AbortSignal.timeout(6000),
        }
      );

      if (response.status === 200) {
        const data = await response.json();
        result.breaches = data.map((b) => ({
          name: b.Name,
          title: b.Title,
          domain: b.Domain,
          date: b.BreachDate,
          pwnCount: b.PwnCount,
          description: b.Description,
          dataTypes: b.DataClasses,
        }));
        result.hasBreaches = result.breaches.length > 0;
      } else if (response.status === 404) {
        // No breaches found
        result.hasBreaches = false;
      } else {
        throw new Error(`HIBP API returned status code ${response.status}`);
      }
    } catch (err) {
      result.error = err.message;
    }

    return result;
  }
};

export default module_def;

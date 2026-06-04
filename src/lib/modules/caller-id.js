/**
 * Caller ID Module
 * Identifies phone number owners via WhatsApp, Truecaller, SyncMe, GetContact,
 * and Nigerian telecom lookup services.
 * Generates investigative links for manual follow-up.
 */

const module_def = {
  name: 'caller-id',
  description: 'Identifies phone number owners via WhatsApp checks, Truecaller, SyncMe, GetContact, and Nigerian telecom lookup services. Generates investigative links.',
  accepts: ['phone'],
  requiresKey: false,
  keyName: null,

  async run(input) {
    const phone = input.query;
    if (!phone) throw new Error('Phone number is required');

    // Normalize the phone number
    const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
    let e164 = cleaned;
    let localFormat = cleaned;
    let compactFormat = cleaned.replace('+', '');

    // Handle Nigerian formats
    if (cleaned.startsWith('0') && cleaned.length === 11) {
      e164 = '+234' + cleaned.slice(1);
      localFormat = cleaned;
      compactFormat = '234' + cleaned.slice(1);
    } else if (cleaned.startsWith('+234')) {
      localFormat = '0' + cleaned.slice(4);
      compactFormat = cleaned.slice(1);
    } else if (cleaned.startsWith('234') && cleaned.length === 13) {
      e164 = '+' + cleaned;
      localFormat = '0' + cleaned.slice(3);
      compactFormat = cleaned;
    }

    const result = {
      phone: e164,
      whatsapp: null,
      lookupLinks: [],
      searchLinks: [],
      possibleNames: [],
    };

    // 1. WhatsApp check — try wa.me redirect
    try {
      const waUrl = `https://wa.me/${compactFormat}`;
      const waResponse = await fetch(waUrl, {
        method: 'HEAD',
        redirect: 'manual',
        signal: AbortSignal.timeout(5000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      result.whatsapp = {
        checkUrl: waUrl,
        registered: waResponse.status !== 404,
        statusCode: waResponse.status,
        redirectUrl: waResponse.headers.get('location') || null,
        profileName: null,
      };
    } catch (err) {
      result.whatsapp = {
        checkUrl: `https://wa.me/${compactFormat}`,
        registered: null,
        error: 'Could not check WhatsApp status',
        statusCode: null,
        profileName: null,
      };
    }

    // 2. WhatsApp Business catalog check
    try {
      const waBizUrl = `https://api.whatsapp.com/send?phone=${compactFormat}`;
      result.lookupLinks.push({
        platform: 'WhatsApp Direct',
        url: waBizUrl,
        description: 'Open WhatsApp chat — if account exists, you\'ll see profile name and photo',
        type: 'interactive',
      });
    } catch (err) {
      // Non-critical
    }

    // 3. Truecaller search URL
    result.lookupLinks.push({
      platform: 'Truecaller',
      url: `https://www.truecaller.com/search/ng/${compactFormat}`,
      description: 'Truecaller caller ID lookup — may show name, spam score, and carrier',
      type: 'lookup',
    });

    // 4. SyncMe search URL
    result.lookupLinks.push({
      platform: 'Sync.ME',
      url: `https://sync.me/search/?number=${encodeURIComponent(e164)}`,
      description: 'Sync.ME reverse phone lookup — community-sourced caller ID',
      type: 'lookup',
    });

    // 5. GetContact search URL
    result.lookupLinks.push({
      platform: 'GetContact',
      url: `https://getcontact.com/en/phone/${compactFormat}`,
      description: 'GetContact reverse lookup — shows names from other people\'s contact lists',
      type: 'lookup',
    });

    // 6. Eyecon
    result.lookupLinks.push({
      platform: 'Eyecon',
      url: `https://www.eyecon.com/search/?phone=${encodeURIComponent(e164)}`,
      description: 'Eyecon caller ID and spam detection',
      type: 'lookup',
    });

    // 7. Whocalld
    result.lookupLinks.push({
      platform: 'Whocalld',
      url: `https://whocalld.com/+234${localFormat.slice(1)}`,
      description: 'Community reports on this phone number',
      type: 'lookup',
    });

    // 8. Who Called Me Nigeria
    result.lookupLinks.push({
      platform: 'WhoCalledMe.ng',
      url: `https://www.whocalled.us/search/${compactFormat}`,
      description: 'Nigerian caller identification database',
      type: 'lookup',
    });

    // 9. Emobile Tracker
    result.lookupLinks.push({
      platform: 'Mobile Number Tracker',
      url: `https://www.findandtrace.com/trace-mobile-number-location/${compactFormat}`,
      description: 'Trace mobile number location and carrier',
      type: 'lookup',
    });

    // 10. Nigerian-specific: NCC Number Check
    result.lookupLinks.push({
      platform: 'NCC (Nigeria)',
      url: `https://www.ncc.gov.ng/stakeholder/subscribers/number-portability`,
      description: 'Nigerian Communications Commission — check if number was ported between carriers',
      type: 'reference',
    });

    // 11. Google search for the number
    result.searchLinks.push({
      platform: 'Google',
      url: `https://www.google.com/search?q="${encodeURIComponent(e164)}"`,
      description: 'Search Google for this phone number in international format',
      type: 'search',
    });

    result.searchLinks.push({
      platform: 'Google (local format)',
      url: `https://www.google.com/search?q="${encodeURIComponent(localFormat)}"`,
      description: 'Search Google for this phone number in local format',
      type: 'search',
    });

    // 12. Nairaland search
    result.searchLinks.push({
      platform: 'Nairaland',
      url: `https://www.google.com/search?q=site:nairaland.com+"${encodeURIComponent(localFormat)}"`,
      description: 'Search Nairaland forum for this number — Nigerians report scam numbers here',
      type: 'search',
    });

    // 13. Facebook search
    result.searchLinks.push({
      platform: 'Facebook',
      url: `https://www.facebook.com/search/top/?q=${encodeURIComponent(localFormat)}`,
      description: 'Search Facebook for this phone number',
      type: 'search',
    });

    // 14. Telegram lookup
    result.lookupLinks.push({
      platform: 'Telegram',
      url: `https://t.me/${compactFormat}`,
      description: 'Check if this number has a Telegram account',
      type: 'interactive',
    });

    // 15. Scam report databases
    result.searchLinks.push({
      platform: 'ScamAdviser',
      url: `https://www.google.com/search?q=site:scamadviser.com+"${encodeURIComponent(e164)}"`,
      description: 'Check scam reports for this number',
      type: 'search',
    });

    result.searchLinks.push({
      platform: 'Nigerian Scam Reports',
      url: `https://www.google.com/search?q="${encodeURIComponent(localFormat)}"+scam+OR+fraud+OR+kidnap+OR+ransom+site:ng`,
      description: 'Search Nigerian sites for scam/fraud/kidnap reports involving this number',
      type: 'search',
    });

    // 16. Viber
    result.lookupLinks.push({
      platform: 'Viber',
      url: `viber://chat?number=${encodeURIComponent(e164)}`,
      description: 'Check if number is registered on Viber',
      type: 'interactive',
    });

    // 17. Signal
    result.lookupLinks.push({
      platform: 'Signal',
      url: `https://signal.me/#p/${e164}`,
      description: 'Check if number is registered on Signal',
      type: 'interactive',
    });

    return result;
  },
};

export default module_def;

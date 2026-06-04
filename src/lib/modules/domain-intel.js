import dns from 'dns/promises';

const module_def = {
  name: 'domain-intel',
  description: 'Queries RDAP for domain registration/WHOIS details and resolves DNS records (A, MX, NS, TXT).',
  accepts: ['domain', 'email'],
  requiresKey: false,
  keyName: null,

  async run(input) {
    const query = input.query || input.domain;
    if (!query) throw new Error('Domain or email is required');

    let domain = query;
    if (input.type === 'email') {
      const parts = query.split('@');
      if (parts.length === 2) {
        domain = parts[1];
      }
    }

    // Clean up domain (strip http/https and paths)
    domain = domain.replace(/^https?:\/\//i, '').split('/')[0].replace(/^www\./i, '');

    const result = {
      domain,
      registrar: null,
      created: null,
      expires: null,
      nameservers: [],
      dns: {
        A: [],
        MX: [],
        NS: [],
        TXT: []
      },
      rdapData: null
    };

    // 1. Resolve DNS records in parallel
    const recordTypes = ['A', 'MX', 'NS', 'TXT'];
    const dnsPromises = recordTypes.map(async (type) => {
      try {
        if (type === 'A') {
          const records = await dns.resolve4(domain);
          result.dns.A = records;
        } else if (type === 'MX') {
          const records = await dns.resolveMx(domain);
          result.dns.MX = records.map(r => `${r.exchange} (Priority: ${r.priority})`);
        } else if (type === 'NS') {
          const records = await dns.resolveNs(domain);
          result.dns.NS = records;
        } else if (type === 'TXT') {
          const records = await dns.resolveTxt(domain);
          result.dns.TXT = records.flat();
        }
      } catch (err) {
        // DNS type resolution failed, normal for missing records
      }
    });

    await Promise.all(dnsPromises);

    // 2. Fetch WHOIS/RDAP info
    try {
      const rdapUrl = `https://rdap.org/domain/${encodeURIComponent(domain)}`;
      const response = await fetch(rdapUrl, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(6000)
      });

      if (response.ok) {
        const data = await response.json();
        result.rdapData = data;

        // Parse registrar
        if (data.entities) {
          const registrarEntity = data.entities.find(e => e.roles && e.roles.includes('registrar'));
          if (registrarEntity && registrarEntity.vcardArray) {
            const vcard = registrarEntity.vcardArray[1];
            const fn = vcard.find(item => item[0] === 'fn');
            if (fn) result.registrar = fn[3];
          }
        }

        // Parse key dates
        if (data.events) {
          const registration = data.events.find(e => e.eventAction === 'registration');
          if (registration) result.created = registration.eventDate;

          const expiration = data.events.find(e => e.eventAction === 'expiration');
          if (expiration) result.expires = expiration.eventDate;
        }

        // Parse nameservers
        if (data.nameservers) {
          result.nameservers = data.nameservers.map(ns => ns.ldhName);
        }
      }
    } catch (err) {
      result.rdapError = 'Failed to fetch RDAP info: ' + err.message;
    }

    return result;
  }
};

export default module_def;

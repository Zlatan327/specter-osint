/**
 * Result Aggregator
 * Takes array of module results and normalizes into a unified profile schema.
 */

const SOURCE_CONFIDENCE = {
  'github-profiler': 0.9,
  'domain-intel': 0.85,
  'email-lookup': 0.8,
  'phone-lookup': 0.8,
  'caller-id': 0.7,
  'financial-trail': 0.65,
  'breach-checker': 0.75,
  'username-checker': 0.7,
  'google-dorker': 0.5,
};

function makeField(value, source, confidence = 0.5) {
  return { value, source, confidence };
}

function deduplicateFields(fields) {
  const seen = new Map();
  for (const field of fields) {
    const key = typeof field.value === 'string' ? field.value.toLowerCase().trim() : JSON.stringify(field.value);
    if (!seen.has(key)) {
      seen.set(key, field);
    } else {
      const existing = seen.get(key);
      if (field.confidence > existing.confidence) {
        seen.set(key, field);
      }
    }
  }
  return Array.from(seen.values());
}

function extractIdentityFromGithub(data, moduleName) {
  const identity = { names: [], emails: [], phones: [], locations: [], avatars: [], bios: [] };
  const conf = SOURCE_CONFIDENCE[moduleName] || 0.5;
  if (!data?.profile) return identity;
  const p = data.profile;
  if (p.name) identity.names.push(makeField(p.name, moduleName, conf));
  if (p.email) identity.emails.push(makeField(p.email, moduleName, conf));
  if (p.location) identity.locations.push(makeField(p.location, moduleName, conf * 0.9));
  if (p.avatar_url) identity.avatars.push(makeField(p.avatar_url, moduleName, conf));
  if (p.bio) identity.bios.push(makeField(p.bio, moduleName, conf * 0.8));
  return identity;
}

function extractIdentityFromEmail(data, moduleName) {
  const identity = { names: [], emails: [], phones: [], locations: [], avatars: [], bios: [] };
  const conf = SOURCE_CONFIDENCE[moduleName] || 0.5;
  if (data?.email) identity.emails.push(makeField(data.email, moduleName, conf));
  if (data?.hunterData?.first_name && data?.hunterData?.last_name) {
    identity.names.push(makeField(`${data.hunterData.first_name} ${data.hunterData.last_name}`, moduleName, conf * 0.8));
  }
  return identity;
}

function extractIdentityFromPhone(data, moduleName) {
  const identity = { names: [], emails: [], phones: [], locations: [], avatars: [], bios: [] };
  const conf = SOURCE_CONFIDENCE[moduleName] || 0.5;
  if (data?.formatted) identity.phones.push(makeField(data.formatted, moduleName, conf));
  if (data?.country) identity.locations.push(makeField(data.country, moduleName, conf * 0.7));
  if (data?.carrier) identity.bios.push(makeField(`Carrier: ${data.carrier}`, moduleName, conf * 0.6));
  return identity;
}

function extractIdentityFromCallerId(data, moduleName) {
  const identity = { names: [], emails: [], phones: [], locations: [], avatars: [], bios: [] };
  const conf = SOURCE_CONFIDENCE[moduleName] || 0.5;
  if (data?.whatsapp?.registered && data?.whatsapp?.profileName) {
    identity.names.push(makeField(data.whatsapp.profileName, moduleName, conf));
  }
  if (data?.possibleNames) {
    for (const name of data.possibleNames) {
      identity.names.push(makeField(name, moduleName, conf * 0.6));
    }
  }
  return identity;
}

function buildAccounts(moduleResults) {
  const accounts = [];
  for (const result of moduleResults) {
    if (result.module === 'username-checker' && result.status === 'success' && result.data?.found) {
      for (const acct of result.data.found) {
        accounts.push({
          platform: acct.platform,
          username: acct.username || null,
          url: acct.url,
          found: true,
          profileData: acct.profileData || null,
          category: acct.category,
          region: acct.region,
        });
      }
    }
  }
  return accounts;
}

function buildBreaches(moduleResults) {
  const breaches = [];
  for (const result of moduleResults) {
    if (result.module === 'breach-checker' && result.status === 'success' && result.data?.breaches) {
      for (const breach of result.data.breaches) {
        breaches.push({
          name: breach.name || breach.Name,
          date: breach.date || breach.BreachDate,
          dataTypes: breach.dataTypes || breach.DataClasses || [],
          description: breach.description || breach.Description || '',
          pwnCount: breach.pwnCount || breach.PwnCount || 0,
        });
      }
    }
  }
  return breaches;
}

function buildDomains(moduleResults) {
  const domains = [];
  for (const result of moduleResults) {
    if (result.module === 'domain-intel' && result.status === 'success' && result.data) {
      const d = result.data;
      domains.push({
        domain: d.domain,
        registrar: d.registrar,
        created: d.created,
        expires: d.expires,
        nameservers: d.nameservers || [],
        dns: d.dns || {},
      });
    }
  }
  return domains;
}

function buildDorks(moduleResults) {
  const dorks = [];
  for (const result of moduleResults) {
    if (result.module === 'google-dorker' && result.status === 'success' && result.data?.dorks) {
      for (const dork of result.data.dorks) {
        dorks.push({
          category: dork.category,
          label: dork.label,
          query: dork.query,
          url: dork.url,
          description: dork.description,
        });
      }
    }
  }
  return dorks;
}

function buildFinancialTrails(moduleResults) {
  const trails = [];
  for (const result of moduleResults) {
    if (result.module === 'financial-trail' && result.status === 'success' && result.data) {
      trails.push(result.data);
    }
  }
  return trails;
}

function buildCallerIdResults(moduleResults) {
  const callerIdData = [];
  for (const result of moduleResults) {
    if (result.module === 'caller-id' && result.status === 'success' && result.data) {
      callerIdData.push(result.data);
    }
  }
  return callerIdData;
}

function buildTimeline(moduleResults) {
  const events = [];
  for (const result of moduleResults) {
    if (result.module === 'github-profiler' && result.status === 'success' && result.data?.profile) {
      const p = result.data.profile;
      if (p.created_at) {
        events.push({ date: p.created_at, event: 'GitHub account created', source: 'github-profiler', icon: 'github' });
      }
      if (result.data.repos) {
        for (const repo of result.data.repos) {
          if (repo.created_at) {
            events.push({ date: repo.created_at, event: `Created repository: ${repo.name}`, source: 'github-profiler', icon: 'code' });
          }
        }
      }
    }
    if (result.module === 'domain-intel' && result.status === 'success' && result.data?.created) {
      events.push({ date: result.data.created, event: `Domain ${result.data.domain} registered`, source: 'domain-intel', icon: 'globe' });
    }
    if (result.module === 'breach-checker' && result.status === 'success' && result.data?.breaches) {
      for (const breach of result.data.breaches) {
        const date = breach.date || breach.BreachDate;
        if (date) {
          events.push({ date, event: `Appeared in ${breach.name || breach.Name} data breach`, source: 'breach-checker', icon: 'alert' });
        }
      }
    }
  }
  events.sort((a, b) => new Date(a.date) - new Date(b.date));
  return events;
}

function aggregate(query, type, moduleResults) {
  const successResults = moduleResults.filter((r) => r.status === 'success');
  const identitySources = [];
  for (const result of successResults) {
    switch (result.module) {
      case 'github-profiler': identitySources.push(extractIdentityFromGithub(result.data, result.module)); break;
      case 'email-lookup': identitySources.push(extractIdentityFromEmail(result.data, result.module)); break;
      case 'phone-lookup': identitySources.push(extractIdentityFromPhone(result.data, result.module)); break;
      case 'caller-id': identitySources.push(extractIdentityFromCallerId(result.data, result.module)); break;
    }
  }

  const identity = {
    names: deduplicateFields(identitySources.flatMap((s) => s.names)),
    emails: deduplicateFields(identitySources.flatMap((s) => s.emails)),
    phones: deduplicateFields(identitySources.flatMap((s) => s.phones)),
    locations: deduplicateFields(identitySources.flatMap((s) => s.locations)),
    avatars: deduplicateFields(identitySources.flatMap((s) => s.avatars)),
    bios: deduplicateFields(identitySources.flatMap((s) => s.bios)),
  };

  const totalFindings =
    identity.names.length + identity.emails.length + identity.phones.length +
    identity.locations.length + buildAccounts(moduleResults).length +
    buildBreaches(moduleResults).length + buildDorks(moduleResults).length;

  const raw = {};
  for (const result of moduleResults) {
    raw[result.module] = { status: result.status, data: result.data, error: result.error, duration: result.duration };
  }

  return {
    meta: { query, type, timestamp: new Date().toISOString(), modulesRun: moduleResults.length, modulesSucceeded: successResults.length, totalFindings },
    identity,
    accounts: buildAccounts(moduleResults),
    breaches: buildBreaches(moduleResults),
    domains: buildDomains(moduleResults),
    dorks: buildDorks(moduleResults),
    callerIdResults: buildCallerIdResults(moduleResults),
    financialTrails: buildFinancialTrails(moduleResults),
    timeline: buildTimeline(moduleResults),
    raw,
  };
}

export { aggregate, deduplicateFields, makeField };

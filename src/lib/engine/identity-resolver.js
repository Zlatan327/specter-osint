/**
 * Identity Resolver
 * Cross-references findings across sources, assigns confidence scores,
 * and builds relationship edges between entities.
 */

const VERIFIED_SOURCES = new Set([
  'github-profiler',
  'domain-intel',
  'email-lookup',
  'phone-lookup',
]);

const SOURCE_WEIGHT = {
  'github-profiler': 1.0,
  'domain-intel': 0.95,
  'email-lookup': 0.85,
  'phone-lookup': 0.85,
  'caller-id': 0.75,
  'financial-trail': 0.7,
  'breach-checker': 0.8,
  'username-checker': 0.7,
  'google-dorker': 0.4,
};

/**
 * Calculate enhanced confidence for a field based on corroboration across sources.
 */
function calculateConfidence(field, allFieldsOfType) {
  if (!field) return 0.5;
  let baseConfidence = field.confidence || 0.5;

  // Boost if from a verified source
  if (field.source && VERIFIED_SOURCES.has(field.source)) {
    baseConfidence = Math.min(1.0, baseConfidence * 1.15);
  }

  // Check if multiple sources agree on this value
  const normalizedValue = typeof field.value === 'string' ? field.value.toLowerCase().trim() : JSON.stringify(field.value);
  const corroboratingSources = new Set();

  for (const other of allFieldsOfType || []) {
    if (!other) continue;
    const otherValue = typeof other.value === 'string' ? other.value.toLowerCase().trim() : JSON.stringify(other.value);
    if (otherValue === normalizedValue && other.source !== field.source) {
      corroboratingSources.add(other.source);
    }
  }

  // Each corroborating source boosts confidence
  const corroborationBoost = corroboratingSources.size * 0.1;
  baseConfidence = Math.min(1.0, baseConfidence + corroborationBoost);

  // Single unverified source penalty
  if (corroboratingSources.size === 0 && field.source && !VERIFIED_SOURCES.has(field.source)) {
    baseConfidence *= 0.8;
  }

  return Math.round(baseConfidence * 100) / 100;
}

/**
 * Build relationship edges between discovered entities.
 */
function buildRelationships(profile) {
  const edges = [];
  const query = profile?.meta?.query || '';
  if (!query) return edges;

  const names = profile?.identity?.names || [];
  const emails = profile?.identity?.emails || [];
  const phones = profile?.identity?.phones || [];
  const accounts = profile?.accounts || [];
  const breaches = profile?.breaches || [];
  const domains = profile?.domains || [];

  // Link query to found identities
  for (const name of names) {
    if (name?.value) {
      edges.push({
        from: query,
        to: name.value,
        type: 'identified_as',
        confidence: name.confidence || 0.5,
        source: name.source || 'unknown',
      });
    }
  }

  for (const email of emails) {
    if (email?.value) {
      edges.push({
        from: query,
        to: email.value,
        type: 'uses_email',
        confidence: email.confidence || 0.5,
        source: email.source || 'unknown',
      });
    }
  }

  for (const phone of phones) {
    if (phone?.value) {
      edges.push({
        from: query,
        to: phone.value,
        type: 'uses_phone',
        confidence: phone.confidence || 0.5,
        source: phone.source || 'unknown',
      });
    }
  }

  // Link accounts to query
  for (const account of accounts) {
    if (account?.url) {
      edges.push({
        from: query,
        to: account.url,
        type: 'has_account',
        confidence: 0.85,
        source: 'username-checker',
        platform: account.platform || 'unknown',
      });
    }
  }

  // Link breaches to emails
  for (const breach of breaches) {
    for (const email of emails) {
      if (email?.value && breach?.name) {
        edges.push({
          from: email.value,
          to: breach.name,
          type: 'breached_in',
          confidence: 0.9,
          source: 'breach-checker',
        });
      }
    }
  }

  // Link domains to query
  for (const domain of domains) {
    if (domain?.domain) {
      edges.push({
        from: query,
        to: domain.domain,
        type: 'owns_domain',
        confidence: 0.8,
        source: 'domain-intel',
      });
    }
  }

  // Cross-link names to emails if both exist
  for (const name of names) {
    for (const email of emails) {
      if (name?.value && email?.value && name.source !== email.source) {
        edges.push({
          from: name.value,
          to: email.value,
          type: 'associated_with',
          confidence: Math.min(name.confidence || 0.5, email.confidence || 0.5) * 0.9,
          source: 'cross-reference',
        });
      }
    }
  }

  // Link phones to names from caller-id
  for (const phone of phones) {
    for (const name of names) {
      if (phone?.value && name?.value && name.source === 'caller-id') {
        edges.push({
          from: phone.value,
          to: name.value,
          type: 'registered_to',
          confidence: name.confidence || 0.5,
          source: 'caller-id',
        });
      }
    }
  }

  // Link financial trails to phones
  if (profile?.financialTrails) {
    for (const trail of profile.financialTrails) {
      if (trail?.fintechLinks) {
        for (const link of trail.fintechLinks) {
          if (link?.platform) {
            edges.push({
              from: query,
              to: link.platform,
              type: 'possible_financial_account',
              confidence: 0.5,
              source: 'financial-trail',
            });
          }
        }
      }
    }
  }

  // Deduplicate edges
  const seen = new Set();
  return edges.filter((edge) => {
    const key = `${edge.from}|${edge.to}|${edge.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Calculate an overall risk/interest score for the profile.
 */
function calculateOverallScore(profile) {
  let score = 0;
  if (!profile) return score;

  const names = profile?.identity?.names || [];
  const emails = profile?.identity?.emails || [];
  const phones = profile?.identity?.phones || [];
  const locations = profile?.identity?.locations || [];
  const accounts = profile?.accounts || [];
  const breaches = profile?.breaches || [];
  const domains = profile?.domains || [];

  // More identity data = higher score
  score += names.length * 10;
  score += emails.length * 10;
  score += phones.length * 10;
  score += locations.length * 5;

  // Accounts found
  score += accounts.length * 3;

  // Breaches are significant
  score += breaches.length * 8;

  // Domain ownership
  score += domains.length * 5;

  // Caller ID results
  if (profile?.callerIdResults?.length > 0) {
    score += 15;
  }

  // Financial trails
  if (profile?.financialTrails?.length > 0) {
    score += 12;
  }

  // Normalize to 0-100
  return Math.min(100, score);
}

/**
 * Resolve and enhance the aggregated profile with confidence scores
 * and relationship edges.
 */
function resolve(profile) {
  if (!profile) return null;

  // Collect all fields for cross-referencing
  const allNames = [...(profile?.identity?.names || [])];
  const allEmails = [...(profile?.identity?.emails || [])];
  const allPhones = [...(profile?.identity?.phones || [])];
  const allLocations = [...(profile?.identity?.locations || [])];

  // Enhance confidence scores based on corroboration
  for (const field of profile?.identity?.names || []) {
    field.confidence = calculateConfidence(field, allNames);
  }
  for (const field of profile?.identity?.emails || []) {
    field.confidence = calculateConfidence(field, allEmails);
  }
  for (const field of profile?.identity?.phones || []) {
    field.confidence = calculateConfidence(field, allPhones);
  }
  for (const field of profile?.identity?.locations || []) {
    field.confidence = calculateConfidence(field, allLocations);
  }
  for (const field of profile?.identity?.avatars || []) {
    field.confidence = calculateConfidence(field, profile?.identity?.avatars || []);
  }
  for (const field of profile?.identity?.bios || []) {
    field.confidence = calculateConfidence(field, profile?.identity?.bios || []);
  }

  // Build relationship graph
  const relationships = buildRelationships(profile);

  // Calculate overall investigation score
  const overallScore = calculateOverallScore(profile);

  return {
    ...profile,
    relationships,
    overallScore,
    meta: {
      ...profile?.meta,
      resolvedAt: new Date().toISOString(),
    },
  };
}

export { resolve, calculateConfidence, buildRelationships, calculateOverallScore };

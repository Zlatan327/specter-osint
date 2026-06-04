/**
 * Orchestrator
 * Accepts investigation input, dispatches relevant modules in parallel,
 * enforces timeouts, and returns structured results.
 */

import { rateLimiter } from './rate-limiter.js';

// Import all modules
import usernameChecker from '../modules/username-checker.js';
import emailLookup from '../modules/email-lookup.js';
import phoneLookup from '../modules/phone-lookup.js';
import breachChecker from '../modules/breach-checker.js';
import githubProfiler from '../modules/github-profiler.js';
import domainIntel from '../modules/domain-intel.js';
import googleDorker from '../modules/google-dorker.js';
import callerId from '../modules/caller-id.js';
import financialTrail from '../modules/financial-trail.js';

// Module registry
const MODULES = {
  'username-checker': usernameChecker,
  'email-lookup': emailLookup,
  'phone-lookup': phoneLookup,
  'breach-checker': breachChecker,
  'github-profiler': githubProfiler,
  'domain-intel': domainIntel,
  'google-dorker': googleDorker,
  'caller-id': callerId,
  'financial-trail': financialTrail,
};

// Which modules are relevant for each input type, in priority order
const TYPE_MODULES = {
  phone: [
    'phone-lookup',
    'caller-id',
    'financial-trail',
    'google-dorker',
    'breach-checker',
  ],
  email: [
    'email-lookup',
    'breach-checker',
    'github-profiler',
    'username-checker',
    'google-dorker',
    'domain-intel',
  ],
  username: [
    'username-checker',
    'github-profiler',
    'google-dorker',
    'breach-checker',
  ],
  name: [
    'google-dorker',
    'username-checker',
  ],
  domain: [
    'domain-intel',
    'google-dorker',
    'email-lookup',
  ],
};

const MODULE_TIMEOUT_MS = 15000;

/**
 * Run a single module with timeout enforcement.
 */
async function runModule(moduleName, input, config = {}) {
  const start = Date.now();

  try {
    const mod = MODULES[moduleName];
    if (!mod) {
      return {
        module: moduleName,
        status: 'error',
        data: null,
        error: `Unknown module: ${moduleName}`,
        duration: Date.now() - start,
      };
    }

    // Check if module requires a key and if it's available
    if (mod.requiresKey && mod.keyName && !process.env[mod.keyName]) {
      return {
        module: moduleName,
        status: 'skipped',
        data: null,
        error: `Missing required API key: ${mod.keyName}`,
        duration: Date.now() - start,
      };
    }

    // Enforce timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Module ${moduleName} timed out after ${MODULE_TIMEOUT_MS}ms`)), MODULE_TIMEOUT_MS);
    });

    const result = await Promise.race([
      mod.run(input, config),
      timeoutPromise,
    ]);

    return {
      module: moduleName,
      status: 'success',
      data: result,
      error: null,
      duration: Date.now() - start,
    };
  } catch (err) {
    return {
      module: moduleName,
      status: 'error',
      data: null,
      error: err.message || String(err),
      duration: Date.now() - start,
    };
  }
}

/**
 * Main investigation orchestrator.
 * @param {Object} params
 * @param {string} params.query - The search query
 * @param {string} params.type - Input type: "email" | "username" | "phone" | "name" | "domain"
 * @param {Function} [params.onModuleComplete] - Optional callback for SSE streaming
 * @param {Object} [params.config] - Optional per-module config overrides
 * @returns {Promise<Array>} Array of module results
 */
async function investigate({ query, type, onModuleComplete, config = {} }) {
  if (!query || !type) {
    throw new Error('Both query and type are required');
  }

  const validTypes = Object.keys(TYPE_MODULES);
  if (!validTypes.includes(type)) {
    throw new Error(`Invalid type "${type}". Must be one of: ${validTypes.join(', ')}`);
  }

  const moduleNames = TYPE_MODULES[type] || [];
  if (moduleNames.length === 0) {
    return [];
  }

  // Prepare input object based on type
  const input = { query, type };

  // For email type, also extract username and domain for additional modules
  if (type === 'email') {
    const [localPart, domain] = query.split('@');
    input.username = localPart;
    input.domain = domain;
  }

  // For domain type, extract just the domain
  if (type === 'domain') {
    input.domain = query.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  }

  // Dispatch all relevant modules in parallel
  const promises = moduleNames.map(async (moduleName) => {
    const result = await runModule(moduleName, input, config[moduleName] || {});

    // Notify callback if provided (for SSE streaming)
    if (onModuleComplete) {
      try {
        onModuleComplete(result);
      } catch (e) {
        // Don't let callback errors affect module execution
      }
    }

    return result;
  });

  const settled = await Promise.allSettled(promises);

  // Extract results from settled promises
  return settled.map((s) => {
    if (s.status === 'fulfilled') {
      return s.value;
    }
    return {
      module: 'unknown',
      status: 'error',
      data: null,
      error: s.reason?.message || 'Promise rejected',
      duration: 0,
    };
  });
}

/**
 * Get list of modules that would run for a given input type.
 */
function getModulesForType(type) {
  return TYPE_MODULES[type] || [];
}

/**
 * Get info about all available modules.
 */
function getAvailableModules() {
  const modules = [];
  for (const [name, mod] of Object.entries(MODULES)) {
    try {
      modules.push({
        name: mod.name || name,
        description: mod.description || '',
        accepts: mod.accepts || [],
        requiresKey: mod.requiresKey || false,
        keyName: mod.keyName || null,
        hasKey: mod.keyName ? !!process.env[mod.keyName] : true,
      });
    } catch (e) {
      modules.push({ name, description: 'Failed to load', accepts: [], requiresKey: false, keyName: null, hasKey: false });
    }
  }
  return modules;
}

export { investigate, getModulesForType, getAvailableModules, runModule };


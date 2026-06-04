/**
 * In-memory token bucket rate limiter with per-API configuration.
 * Supports jitter to avoid detection patterns.
 */

const API_CONFIGS = {
  github: { tokens: 60, interval: 3600000, label: 'GitHub (unauthenticated)' },
  github_authenticated: { tokens: 5000, interval: 3600000, label: 'GitHub (authenticated)' },
  hunter: { tokens: 5, interval: 60000, label: 'Hunter.io' },
  numverify: { tokens: 10, interval: 60000, label: 'Numverify' },
  hibp: { tokens: 10, interval: 60000, label: 'HIBP' },
  whois: { tokens: 30, interval: 60000, label: 'WHOIS/RDAP' },
  rdap: { tokens: 30, interval: 60000, label: 'RDAP' },
  dns_google: { tokens: 100, interval: 60000, label: 'Google DNS' },
  truecaller: { tokens: 10, interval: 60000, label: 'Truecaller' },
  generic: { tokens: 60, interval: 60000, label: 'Generic' },
};

class TokenBucket {
  constructor(maxTokens, refillInterval) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.refillInterval = refillInterval;
    this.lastRefill = Date.now();
    this.queue = [];
  }

  refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = Math.floor((elapsed / this.refillInterval) * this.maxTokens);
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  async acquire() {
    this.refill();

    if (this.tokens > 0) {
      this.tokens--;
      return;
    }

    return new Promise((resolve) => {
      this.queue.push(resolve);
      this._scheduleRefill();
    });
  }

  _scheduleRefill() {
    if (this._refillTimer) return;

    const waitTime = Math.ceil(this.refillInterval / this.maxTokens);
    this._refillTimer = setTimeout(() => {
      this._refillTimer = null;
      this.refill();

      while (this.tokens > 0 && this.queue.length > 0) {
        this.tokens--;
        const resolve = this.queue.shift();
        resolve();
      }

      if (this.queue.length > 0) {
        this._scheduleRefill();
      }
    }, waitTime);
  }
}

class RateLimiter {
  constructor() {
    this.buckets = new Map();
  }

  _getBucket(apiName) {
    if (!this.buckets.has(apiName)) {
      const config = API_CONFIGS[apiName] || API_CONFIGS.generic;
      this.buckets.set(apiName, new TokenBucket(config.tokens, config.interval));
    }
    return this.buckets.get(apiName);
  }

  async acquire(apiName) {
    const bucket = this._getBucket(apiName);
    await bucket.acquire();

    // Add ±20% jitter delay
    const baseDelay = 50;
    const jitter = baseDelay * (0.8 + Math.random() * 0.4);
    await new Promise((r) => setTimeout(r, jitter));
  }

  remaining(apiName) {
    const bucket = this._getBucket(apiName);
    bucket.refill();
    return bucket.tokens;
  }

  reset(apiName) {
    this.buckets.delete(apiName);
  }

  resetAll() {
    this.buckets.clear();
  }

  static getConfig(apiName) {
    return API_CONFIGS[apiName] || API_CONFIGS.generic;
  }
}

const rateLimiter = new RateLimiter();

export { RateLimiter, rateLimiter, API_CONFIGS };


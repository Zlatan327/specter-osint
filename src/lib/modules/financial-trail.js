/**
 * Financial Trail Module
 * Generates lookup URLs for Nigerian fintech platforms, bank accounts,
 * and mobile money services linked to phone numbers.
 * Critical for tracing ransom payment channels.
 */

const module_def = {
  name: 'financial-trail',
  description: 'Traces financial connections via Nigerian fintech platforms, mobile money, and bank integrations. Generates investigative links for OPay, PalmPay, Kuda, Moniepoint, Paga, and traditional banks.',
  accepts: ['phone'],
  requiresKey: false,
  keyName: null,

  async run(input) {
    const phone = input.query;
    if (!phone) throw new Error('Phone number is required');

    // Normalize phone number
    const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
    let e164 = cleaned;
    let localFormat = cleaned;
    let compactFormat = cleaned.replace('+', '');

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
      fintechLinks: [],
      bankSearchLinks: [],
      mobileMoneyLinks: [],
      dorkQueries: [],
      lawEnforcementNotes: [],
    };

    // ==========================================
    // NIGERIAN FINTECH PLATFORMS (phone-linked)
    // ==========================================

    result.fintechLinks.push({
      platform: 'OPay',
      description: 'OPay accounts are linked to phone numbers. Kidnappers frequently use OPay for receiving ransom.',
      searchUrl: `https://www.google.com/search?q="${encodeURIComponent(localFormat)}"+opay`,
      appDeepLink: null,
      notes: 'OPay allows transfers via phone number. Check if the number receives frequent transfers.',
    });

    result.fintechLinks.push({
      platform: 'PalmPay',
      description: 'PalmPay mobile money accounts linked to phone numbers.',
      searchUrl: `https://www.google.com/search?q="${encodeURIComponent(localFormat)}"+palmpay`,
      appDeepLink: null,
      notes: 'PalmPay is widely used for P2P transfers in Nigeria.',
    });

    result.fintechLinks.push({
      platform: 'Kuda Bank',
      description: 'Kuda digital bank — accounts created with phone numbers and BVN.',
      searchUrl: `https://www.google.com/search?q="${encodeURIComponent(localFormat)}"+kuda+bank`,
      appDeepLink: null,
      notes: 'Kuda requires BVN for account creation, linking to biometric identity.',
    });

    result.fintechLinks.push({
      platform: 'Moniepoint',
      description: 'Moniepoint (formerly TeamApt) — POS and mobile money platform.',
      searchUrl: `https://www.google.com/search?q="${encodeURIComponent(localFormat)}"+moniepoint`,
      appDeepLink: null,
      notes: 'Moniepoint agents process cash transactions — number may be linked to agent account.',
    });

    result.fintechLinks.push({
      platform: 'Paga',
      description: 'Paga mobile money — one of the largest mobile money platforms in Nigeria.',
      searchUrl: `https://www.google.com/search?q="${encodeURIComponent(localFormat)}"+paga`,
      appDeepLink: null,
      notes: 'Paga allows transfers to phone numbers. Widely used in northern Nigeria.',
    });

    result.fintechLinks.push({
      platform: 'Carbon (formerly Paylater)',
      description: 'Carbon fintech — lending and payments platform.',
      searchUrl: `https://www.google.com/search?q="${encodeURIComponent(localFormat)}"+carbon+paylater`,
      appDeepLink: null,
      notes: 'Carbon provides loans linked to phone numbers and bank accounts.',
    });

    result.fintechLinks.push({
      platform: 'FairMoney',
      description: 'FairMoney digital bank and lending platform.',
      searchUrl: `https://www.google.com/search?q="${encodeURIComponent(localFormat)}"+fairmoney`,
      appDeepLink: null,
      notes: 'FairMoney requires identity verification for accounts.',
    });

    result.fintechLinks.push({
      platform: 'Chipper Cash',
      description: 'Cross-border payment platform popular in Nigeria.',
      searchUrl: `https://www.google.com/search?q="${encodeURIComponent(localFormat)}"+chipper+cash`,
      appDeepLink: null,
      notes: 'Used for cross-border transfers — may indicate connections outside Nigeria.',
    });

    // ==========================================
    // USSD / MOBILE MONEY SERVICES
    // ==========================================

    result.mobileMoneyLinks.push({
      platform: 'MTN MoMo',
      description: 'MTN Mobile Money — USSD-based mobile money.',
      ussdCode: '*600#',
      notes: 'If the number is MTN, it may have a MoMo account for receiving money via *600#.',
    });

    result.mobileMoneyLinks.push({
      platform: 'Airtel Money',
      description: 'Airtel mobile money service.',
      ussdCode: '*997#',
      notes: 'Airtel numbers may have mobile money accounts.',
    });

    result.mobileMoneyLinks.push({
      platform: 'Glo Mobile Money',
      description: 'Glo mobile money service.',
      ussdCode: '*805#',
      notes: 'Glo mobile money for cashless transactions.',
    });

    result.mobileMoneyLinks.push({
      platform: '9mobile Money',
      description: '9mobile (formerly Etisalat) mobile money.',
      ussdCode: '*389#',
      notes: '9mobile money service.',
    });

    // ==========================================
    // TRADITIONAL BANK SEARCH
    // ==========================================

    const banks = [
      'GTBank', 'First Bank', 'Access Bank', 'UBA', 'Zenith Bank',
      'Fidelity Bank', 'Union Bank', 'Wema Bank', 'FCMB', 'Sterling Bank',
      'Stanbic IBTC', 'Polaris Bank', 'Keystone Bank', 'Ecobank', 'Heritage Bank',
    ];

    for (const bank of banks) {
      result.bankSearchLinks.push({
        bank,
        searchUrl: `https://www.google.com/search?q="${encodeURIComponent(localFormat)}"+${encodeURIComponent(bank)}`,
        description: `Search for this phone number associated with ${bank}`,
      });
    }

    // ==========================================
    // GOOGLE DORK QUERIES
    // ==========================================

    result.dorkQueries.push({
      category: 'Financial Fraud',
      query: `"${localFormat}" transfer OR payment OR account`,
      url: `https://www.google.com/search?q="${encodeURIComponent(localFormat)}"+transfer+OR+payment+OR+account`,
      description: 'Search for financial transactions associated with this number',
    });

    result.dorkQueries.push({
      category: 'Scam Reports',
      query: `"${localFormat}" scam OR fraud OR 419 OR kidnap OR ransom`,
      url: `https://www.google.com/search?q="${encodeURIComponent(localFormat)}"+scam+OR+fraud+OR+419+OR+kidnap+OR+ransom`,
      description: 'Search for scam/fraud/kidnap reports involving this number',
    });

    result.dorkQueries.push({
      category: 'Nairaland Financial',
      query: `site:nairaland.com "${localFormat}"`,
      url: `https://www.google.com/search?q=site:nairaland.com+"${encodeURIComponent(localFormat)}"`,
      description: 'Search Nairaland for mentions of this number in financial contexts',
    });

    result.dorkQueries.push({
      category: 'Bank Account Search',
      query: `"${localFormat}" "account number" OR "account name" OR "bank details"`,
      url: `https://www.google.com/search?q="${encodeURIComponent(localFormat)}"+%22account+number%22+OR+%22account+name%22+OR+%22bank+details%22`,
      description: 'Search for bank account details associated with this number',
    });

    result.dorkQueries.push({
      category: 'POS Transactions',
      query: `"${localFormat}" POS OR terminal OR agent`,
      url: `https://www.google.com/search?q="${encodeURIComponent(localFormat)}"+POS+OR+terminal+OR+agent`,
      description: 'Search for POS/agent banking links to this number',
    });

    result.dorkQueries.push({
      category: 'Betting/Gambling',
      query: `"${localFormat}" bet9ja OR nairabet OR sportybet OR 1xbet`,
      url: `https://www.google.com/search?q="${encodeURIComponent(localFormat)}"+bet9ja+OR+nairabet+OR+sportybet+OR+1xbet`,
      description: 'Search for betting platform accounts — criminals sometimes use betting platforms for money laundering',
    });

    result.dorkQueries.push({
      category: 'Crypto P2P',
      query: `"${localFormat}" bitcoin OR USDT OR binance OR "p2p" OR crypto`,
      url: `https://www.google.com/search?q="${encodeURIComponent(localFormat)}"+bitcoin+OR+USDT+OR+binance+OR+%22p2p%22+OR+crypto`,
      description: 'Search for cryptocurrency P2P trading accounts linked to this number',
    });

    // ==========================================
    // LAW ENFORCEMENT NOTES
    // ==========================================

    result.lawEnforcementNotes = [
      {
        title: 'BVN (Bank Verification Number)',
        description: 'In Nigeria, all bank accounts and fintech wallets are linked to a BVN, which is tied to biometric data (fingerprints, photo). Nigerian banks can trace the account holder via BVN using this phone number. Law enforcement can request BVN lookup from NIBSS (Nigeria Inter-Bank Settlement System).',
      },
      {
        title: 'NIN (National Identification Number)',
        description: 'Since 2020, all Nigerian SIM cards must be linked to a NIN. The NCC and NIMC can identify the registered owner of this phone number via NIN-SIM linkage database.',
      },
      {
        title: 'SIM Registration',
        description: 'Nigerian telecom operators (MTN, Glo, Airtel, 9mobile) maintain SIM registration records including name, address, photo, and NIN of the registered owner. Law enforcement can request this information with proper authorization.',
      },
      {
        title: 'USSD Transaction History',
        description: 'Mobile money transactions via USSD codes are logged by telecom operators. Transaction history can be obtained through proper legal channels.',
      },
      {
        title: 'Cell Tower Location Data',
        description: 'Telecom operators can provide cell tower location data showing the approximate area where this phone number has been active. This requires a court order or security agency request.',
      },
      {
        title: 'CBN Account Tracing',
        description: 'The Central Bank of Nigeria can issue directives to all banks to flag and trace accounts associated with this phone number. This is standard procedure in kidnap-for-ransom cases.',
      },
      {
        title: 'EFCC Financial Intelligence',
        description: 'The EFCC (Economic and Financial Crimes Commission) maintains a database of flagged phone numbers and accounts. Report the number to EFCC for cross-referencing.',
      },
    ];

    return result;
  },
};

export default module_def;

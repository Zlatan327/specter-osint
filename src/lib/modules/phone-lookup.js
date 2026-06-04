const NIGERIAN_CARRIERS = {
  MTN: ['0803', '0806', '0703', '0706', '0813', '0816', '0810', '0814', '0903', '0906', '0913', '0916'],
  Airtel: ['0802', '0808', '0812', '0701', '0708', '0902', '0901', '0907', '0912', '0917'],
  Glo: ['0805', '0807', '0811', '0815', '0705', '0905', '0915'],
  '9mobile': ['0809', '0817', '0818', '0909', '0908']
};

function detectNigerianCarrier(localFormat) {
  if (!localFormat || localFormat.length < 4) return null;
  const prefix = localFormat.slice(0, 4);
  for (const [carrier, prefixes] of Object.entries(NIGERIAN_CARRIERS)) {
    if (prefixes.includes(prefix)) {
      return carrier;
    }
  }
  return null;
}

const module_def = {
  name: 'phone-lookup',
  description: 'Performs reverse phone lookup, carrier detection, and geolocation. Optimized for Nigerian phone formats with local carrier prefix matching.',
  accepts: ['phone'],
  requiresKey: false,
  keyName: 'NUMVERIFY_API_KEY',

  async run(input) {
    const phone = input.query || input.phone;
    if (!phone) throw new Error('Phone number is required');

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

    const isNigerian = e164.startsWith('+234');
    let carrier = null;
    let country = isNigerian ? 'Nigeria' : 'Unknown';

    if (isNigerian) {
      carrier = detectNigerianCarrier(localFormat);
    }

    const result = {
      phone: e164,
      localFormat,
      compactFormat,
      country,
      carrier,
      location: null,
      lineType: null,
      numverifyData: null,
    };

    // Try Numverify API if key is available
    const apiKey = process.env.NUMVERIFY_API_KEY;
    if (apiKey) {
      try {
        const numverifyUrl = `http://apilayer.net/api/validate?access_key=${apiKey}&number=${compactFormat}`;
        const response = await fetch(numverifyUrl, { signal: AbortSignal.timeout(5000) });
        if (response.ok) {
          const body = await response.json();
          if (body && body.valid) {
            result.numverifyData = body;
            result.country = body.country_name || result.country;
            result.carrier = body.carrier || result.carrier;
            result.location = body.location || result.location;
            result.lineType = body.line_type || result.lineType;
          }
        }
      } catch (err) {
        result.numverifyData = { error: 'Failed to query Numverify: ' + err.message };
      }
    }

    return result;
  }
};

export default module_def;

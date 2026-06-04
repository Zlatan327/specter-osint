export const COUNTRIES = [
  { code: 'US', name: 'United States', fashionContext: 'American casual-cool, athleisure, NYC street style, LA bohemian, Southern prep' },
  { code: 'GB', name: 'United Kingdom', fashionContext: 'British tailoring, streetwear, punk influences, high street fashion, Savile Row heritage' },
  { code: 'FR', name: 'France', fashionContext: 'Parisian chic, effortless elegance, minimalist luxury, haute couture influence' },
  { code: 'IT', name: 'Italy', fashionContext: 'Italian luxury, sprezzatura, tailored fits, bold accessories, la bella figura' },
  { code: 'JP', name: 'Japan', fashionContext: 'Harajuku street style, minimalist Japanese aesthetics, techwear, avant-garde, wabi-sabi' },
  { code: 'KR', name: 'South Korea', fashionContext: 'K-fashion, oversized fits, pastel palettes, K-pop influence, skincare-forward aesthetic' },
  { code: 'NG', name: 'Nigeria', fashionContext: 'Ankara prints, agbada, vibrant patterns, Lagos street style, Afrobeats fashion influence' },
  { code: 'GH', name: 'Ghana', fashionContext: 'Kente cloth, vibrant African prints, Accra street style, modern African fashion fusion' },
  { code: 'BR', name: 'Brazil', fashionContext: 'Brazilian beach culture, colorful prints, havaianas, carnival influence, São Paulo urban style' },
  { code: 'IN', name: 'India', fashionContext: 'Indo-western fusion, saree draping styles, kurta-jeans combo, Bollywood influence, regional textiles' },
  { code: 'CN', name: 'China', fashionContext: 'Chinese modern fashion, guochao (national trend), luxury streetwear, traditional meets contemporary' },
  { code: 'MX', name: 'Mexico', fashionContext: 'Mexican artisanal textiles, huipil-inspired fashion, vibrant embroidery, modern Latin American style' },
  { code: 'DE', name: 'Germany', fashionContext: 'German minimalism, functional fashion, Berlin club culture style, Bauhaus-influenced aesthetics' },
  { code: 'AU', name: 'Australia', fashionContext: 'Australian outdoor lifestyle, surf culture, relaxed luxury, earth tones, sustainable fashion' },
  { code: 'AE', name: 'UAE', fashionContext: 'Dubai luxury fashion, modest fashion movement, abaya styling, designer streetwear, opulent accessories' },
  { code: 'SA', name: 'Saudi Arabia', fashionContext: 'Saudi modest fashion, thobe styling, luxury brands, emerging Saudi designer scene' },
  { code: 'ZA', name: 'South Africa', fashionContext: 'South African fashion, shweshwe prints, Johannesburg street style, African contemporary design' },
  { code: 'SE', name: 'Sweden', fashionContext: 'Scandinavian minimalism, lagom style, functional fashion, sustainable brands, clean lines' },
  { code: 'TR', name: 'Turkey', fashionContext: 'Turkish fashion fusion, Istanbul street style, modest fashion innovation, bazaar-inspired textiles' },
  { code: 'EG', name: 'Egypt', fashionContext: 'Egyptian fashion, Cairo street style, modest fashion, pharaonic-inspired jewelry, Mediterranean influence' },
  { code: 'PH', name: 'Philippines', fashionContext: 'Filipino fashion, terno modernization, tropical style, Manila street fashion, barong tagalog reimagined' },
  { code: 'TH', name: 'Thailand', fashionContext: 'Thai fashion, Bangkok street style, Thai silk, tropical minimalism, Buddhist-inspired modesty' },
  { code: 'CA', name: 'Canada', fashionContext: 'Canadian outdoors-meets-urban, layering expertise, Toronto multicultural style, Vancouver eco-fashion' },
  { code: 'AR', name: 'Argentina', fashionContext: 'Argentine gaucho influence, Buenos Aires European elegance, tango-inspired fashion, leather goods' },
  { code: 'KE', name: 'Kenya', fashionContext: 'Kenyan fashion, Maasai-inspired accessories, Nairobi urban style, East African prints' },
];

export function getCountryFashionContext(countryCode) {
  const country = COUNTRIES.find((c) => c.code === countryCode);
  if (!country) return 'Global fashion trends';
  return `${country.name}: ${country.fashionContext}`;
}

export function getCountryName(countryCode) {
  const country = COUNTRIES.find((c) => c.code === countryCode);
  return country?.name || 'Unknown';
}

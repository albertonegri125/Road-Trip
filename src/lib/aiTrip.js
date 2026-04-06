// src/lib/aiTrip.js
// Chiama il proxy Netlify invece di Claude direttamente
// (la chiave API sta solo sul server per sicurezza)

const API_PROXY = '/api/ai-trip'

async function callClaude(prompt, max_tokens = 4000) {
  const response = await fetch(API_PROXY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, max_tokens }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(err.error || `HTTP ${response.status}`)
  }

  const data = await response.json()
  const text = data.content?.[0]?.text || ''
  return text
}

// ── Document requirements by vehicle + country pair ──
// Visadb.io free endpoint for visa requirements
export async function getVisaRequirements(fromCountry, toCountry) {
  try {
    // Visadb.io public API
    const res = await fetch(
      `https://rough-sun-2523.fly.dev/api/${encodeURIComponent(fromCountry)}/${encodeURIComponent(toCountry)}`
    )
    if (!res.ok) throw new Error('visadb unavailable')
    const data = await res.json()
    return {
      requirement: data.visa, // 'visa free', 'visa on arrival', 'e-visa', 'visa required'
      duration:    data.allowed_stay_duration || null,
      notes:       data.notes || null,
    }
  } catch {
    return { requirement: 'check_official', duration: null, notes: null }
  }
}

// Official embassy/government portal URLs by country
const OFFICIAL_PORTALS = {
  'Turkey':      { visa: 'https://www.evisa.gov.tr', info: 'https://www.mfa.gov.tr' },
  'Iran':        { visa: 'https://visa.efrm.ir', info: 'https://mfa.ir' },
  'China':       { visa: 'https://www.visaforchina.org', info: 'https://www.china-embassy.org' },
  'Russia':      { visa: 'https://visa.kdmid.ru', info: 'https://italy.mid.ru' },
  'India':       { visa: 'https://indianvisaonline.gov.in', info: 'https://www.hcirome.in' },
  'Morocco':     { visa: 'https://www.amb-maroc.it', info: 'https://marocco.esteri.it' },
  'Georgia':     { visa: 'https://www.geoconsul.gov.ge', info: 'https://mfa.gov.ge' },
  'Albania':     { visa: 'https://e-visa.gov.al', info: 'https://punetejashtme.gov.al' },
  'Ukraine':     { visa: 'https://mfa.gov.ua', info: 'https://mfa.gov.ua' },
  'Thailand':    { visa: 'https://www.thaievisa.go.th', info: 'https://www.thaiembassy.it' },
  'Vietnam':     { visa: 'https://evisa.xuatnhapcanh.gov.vn', info: 'https://www.vietnamembassy.it' },
  'Japan':       { visa: 'https://www.mofa.go.jp', info: 'https://www.it.emb-japan.go.jp' },
  'Mongolia':    { visa: 'https://evisa.mfa.mn', info: 'https://rome.mfa.mn' },
  'Kazakhstan':  { visa: 'https://viza.gov.kz', info: 'https://www.gov.kz' },
  'Uzbekistan':  { visa: 'https://e-visa.gov.uz', info: 'https://mfa.uz' },
}

export function getOfficialPortal(country) {
  return OFFICIAL_PORTALS[country] || null
}

// Vehicle-specific document requirements
export function getVehicleDocuments(vehicle, lang = 'it') {
  const docs = {
    car: {
      it: [
        'Patente di guida valida',
        'Permesso di guida internazionale (IDP) — obbligatorio fuori UE',
        'Carta di circolazione del veicolo',
        'Assicurazione RC auto internazionale (Carta Verde)',
        'Vignette autostradali per i paesi attraversati',
        'Triangolo di emergenza e giubbotto catarifrangente',
        'Carnet de Passages en Douanes (per paesi extra-UE con dogana)',
      ],
      en: [
        'Valid driving licence',
        'International Driving Permit (IDP) — mandatory outside EU',
        'Vehicle registration document',
        'International car insurance (Green Card)',
        'Highway vignettes for countries crossed',
        'Emergency triangle and reflective vest',
        'Carnet de Passages en Douanes (for non-EU countries with customs)',
      ],
    },
    moto: {
      it: [
        'Patente categoria A valida',
        'Permesso di guida internazionale (IDP)',
        'Libretto di circolazione moto',
        'Assicurazione internazionale moto (Carta Verde)',
        'Casco omologato (obbligatorio ovunque)',
        'Kit pronto soccorso e strumenti base',
        'Carnet de Passages (per paesi con dogana veicoli)',
        'Verificare restrizioni moto in alcuni paesi (es. Iran)',
      ],
      en: [
        'Valid category A driving licence',
        'International Driving Permit (IDP)',
        'Motorcycle registration document',
        'International motorcycle insurance (Green Card)',
        'Approved helmet (mandatory everywhere)',
        'First aid kit and basic tools',
        'Carnet de Passages (for countries with vehicle customs)',
        'Check motorcycle restrictions in some countries (e.g. Iran)',
      ],
    },
    camper: {
      it: [
        'Patente B (o C se >3.5t)',
        'Permesso di guida internazionale (IDP)',
        'Carta di circolazione + certificato di conformità',
        'Assicurazione internazionale camper (Carta Verde)',
        'Verificare limiti di peso e dimensioni per ogni paese',
        'Permessi speciali per camper in aree protette',
        'Carnet de Passages en Douanes',
        'Documenti LPG/GPL se applicabile',
      ],
      en: [
        'Category B licence (or C if >3.5t)',
        'International Driving Permit (IDP)',
        'Vehicle registration + conformity certificate',
        'International camper insurance (Green Card)',
        'Check weight/size limits per country',
        'Special permits for protected areas',
        'Carnet de Passages en Douanes',
        'LPG documents if applicable',
      ],
    },
    bike: {
      it: [
        'Documento d\'identità / passaporto',
        'Assicurazione personale/viaggio con copertura ciclistica',
        'Verificare regole bici sui traghetti/treni',
        'Kit riparazione bici e pompa',
        'Luci e catarifrangenti (obbligatori)',
      ],
      en: [
        'ID / passport',
        'Personal/travel insurance with cycling coverage',
        'Check bike rules on ferries/trains',
        'Bike repair kit and pump',
        'Lights and reflectors (mandatory)',
      ],
    },
    walk: {
      it: [
        'Documento d\'identità / passaporto',
        'Assicurazione personale/viaggio con copertura infortuni',
        'Permessi per aree protette o sentieri nazionali',
        'Registrazione con autorità locali in alcune aree remote',
      ],
      en: [
        'ID / passport',
        'Personal/travel insurance with accident coverage',
        'Permits for protected areas or national trails',
        'Registration with local authorities in some remote areas',
      ],
    },
    boat: {
      it: [
        'Patente nautica (se richiesta per dimensioni imbarcazione)',
        'Documentazione imbarcazione (numero matricola)',
        'Assicurazione imbarcazione internazionale',
        'Permessi di navigazione per acque territoriali straniere',
        'Flares e attrezzatura di sicurezza obbligatoria',
        'Visto di ingresso via mare per alcuni paesi',
      ],
      en: [
        'Boat licence (if required for vessel size)',
        'Vessel documentation (registration number)',
        'International boat insurance',
        'Navigation permits for foreign territorial waters',
        'Flares and mandatory safety equipment',
        'Sea entry visa for some countries',
      ],
    },
  }
  return docs[vehicle]?.[lang] || docs.car[lang]
}

// Health/vaccine requirements by region
export function getHealthRequirements(countries, lang = 'it') {
  const regionMap = {
    'Morocco': { vaccines_it: ['Epatite A', 'Tifo', 'Rabbia (se lunga permanenza)'], vaccines_en: ['Hepatitis A', 'Typhoid', 'Rabies (long stay)'], malaria: false },
    'Iran':    { vaccines_it: ['Epatite A e B', 'Tifo', 'Tetano'], vaccines_en: ['Hepatitis A&B', 'Typhoid', 'Tetanus'], malaria: false },
    'India':   { vaccines_it: ['Epatite A e B', 'Tifo', 'Encefalite giapponese', 'Rabbia'], vaccines_en: ['Hepatitis A&B', 'Typhoid', 'Japanese encephalitis', 'Rabies'], malaria: true },
    'Thailand':{ vaccines_it: ['Epatite A e B', 'Tifo', 'Rabbia'], vaccines_en: ['Hepatitis A&B', 'Typhoid', 'Rabies'], malaria: false },
    'Vietnam': { vaccines_it: ['Epatite A e B', 'Tifo', 'Encefalite giapponese'], vaccines_en: ['Hepatitis A&B', 'Typhoid', 'Japanese encephalitis'], malaria: false },
    'Mongolia':{ vaccines_it: ['Epatite A e B', 'Encefalite da zecche'], vaccines_en: ['Hepatitis A&B', 'Tick-borne encephalitis'], malaria: false },
  }
  const results = []
  countries.forEach(c => {
    const info = regionMap[c]
    if (info) results.push({ country: c, ...info })
  })
  return results
}

// ── MAIN AI GENERATION FUNCTION ──
export async function generateTripWithAI({
  from, to, vehicle, days, season, touristLevel,
  interests, nationality = 'Italian', lang = 'it'
}) {
  const touristDesc = touristLevel < 25
    ? 'completely off the beaten path, hidden gems, local spots only, avoid all tourist infrastructure'
    : touristLevel < 50
    ? 'mostly off the beaten path with some local highlights, minimal tourist sites'
    : touristLevel < 75
    ? 'balanced mix of local spots and well-known attractions'
    : 'main tourist attractions and popular highlights'

  const prompt = `You are an expert road trip planner. Generate a detailed, REAL and ACCURATE road trip itinerary.

TRIP DETAILS:
- From: ${from}
- To: ${to}  
- Vehicle: ${vehicle}
- Duration: ${days} days
- Season: ${season}
- Tourist level: ${touristLevel}% (${touristDesc})
- Interests: ${interests.join(', ')}
- Traveler nationality: ${nationality}
- Language for response: ${lang === 'it' ? 'Italian' : 'English'}

IMPORTANT RULES:
1. All place names, distances, and times must be REAL and ACCURATE
2. Tourist level ${touristLevel}% means: ${touristDesc}
3. Suggest REAL restaurants, accommodations, and attractions (not generic)
4. Include realistic driving times between stops
5. Consider the season for weather and road conditions
6. For ${vehicle} travel, consider appropriate roads and terrain

Respond ONLY with a valid JSON object (no markdown, no backticks) with this exact structure:
{
  "title": "evocative trip title",
  "tagline": "one sentence that captures the spirit of this trip",
  "overview": "2-3 sentences describing the journey's character and feel",
  "total_km": number,
  "highlights": ["highlight1", "highlight2", "highlight3"],
  "best_season": "advice about this season for this route",
  "stops": [
    {
      "day_from": 1,
      "day_to": 2,
      "city": "city name",
      "country": "country name",
      "lat": number,
      "lng": number,
      "nights": 1,
      "drive_from_prev_km": 0,
      "drive_from_prev_h": 0,
      "tourist_score": 0-100,
      "vibe": "one word describing this stop's vibe",
      "description": "2 sentences about why this stop fits the trip",
      "see": ["real attraction 1", "real attraction 2"],
      "eat": ["real restaurant or food recommendation"],
      "sleep": ["real accommodation recommendation or area to stay"],
      "local_tip": "one genuine insider tip",
      "hidden_gem": "one off-the-beaten-path suggestion near here"
    }
  ],
  "practical": {
    "currency_tips": "advice on currencies needed",
    "connectivity": "SIM card and internet advice",
    "emergency_numbers": "key emergency numbers for the route",
    "border_crossings": ["border crossing advice if crossing countries"],
    "road_conditions": "honest assessment of road quality",
    "budget_estimate_per_day": "realistic daily budget in EUR"
  }
}`

  const text = await callClaude(prompt, 4000)

  // Strip any accidental markdown
  const clean = text.replace(/```json|```/gi, '').trim()
  return JSON.parse(clean)
}

// ── EXPERT MODE: AI enriches a single stop ──
export async function enrichStop(stopName, country, vehicle, touristLevel, lang = 'it') {
  const prompt = `You are a road trip expert. Give me detailed, REAL information about ${stopName}, ${country} for a ${vehicle} road tripper.
Tourist preference: ${touristLevel}% (${touristLevel < 50 ? 'prefers hidden gems and local spots' : 'likes main attractions too'}).
Language: ${lang === 'it' ? 'Italian' : 'English'}.

Respond ONLY with valid JSON (no markdown):
{
  "description": "2 sentences capturing the essence of this place for a road tripper",
  "vibe": "one word",
  "see": ["real place 1", "real place 2", "real place 3"],
  "eat": ["real local food/restaurant recommendation"],
  "sleep": ["area or specific recommendation"],
  "local_tip": "genuine insider tip",
  "hidden_gem": "something most tourists miss",
  "road_note": "parking, road access, or driving note for this stop"
}`

  const text = await callClaude(prompt, 800)
  try {
    return JSON.parse(text.replace(/```json|```/gi, '').trim())
  } catch {
    return null
  }
}

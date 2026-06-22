// src/lib/aiTrip.js
// Uses Claude API via Netlify Function proxy (no key exposed in frontend)
// Falls back to smart local generation if proxy unavailable

// ── Official visa/government portals by country ──
const OFFICIAL_PORTALS = {
  'Turkey':     { visa:'https://www.evisa.gov.tr',           info:'https://www.mfa.gov.tr' },
  'Iran':       { visa:'https://visa.efrm.ir',               info:'https://mfa.ir' },
  'China':      { visa:'https://www.visaforchina.org',        info:'https://www.china-embassy.org' },
  'Russia':     { visa:'https://visa.kdmid.ru',               info:'https://italy.mid.ru' },
  'India':      { visa:'https://indianvisaonline.gov.in',     info:'https://www.hcirome.in' },
  'Morocco':    { visa:'https://www.amb-maroc.it',            info:'https://marocco.esteri.it' },
  'Georgia':    { visa:'https://www.geoconsul.gov.ge',        info:'https://mfa.gov.ge' },
  'Albania':    { visa:'https://e-visa.gov.al',               info:'https://punetejashtme.gov.al' },
  'Ukraine':    { visa:'https://mfa.gov.ua',                  info:'https://mfa.gov.ua' },
  'Thailand':   { visa:'https://www.thaievisa.go.th',         info:'https://www.thaiembassy.it' },
  'Vietnam':    { visa:'https://evisa.xuatnhapcanh.gov.vn',   info:'https://www.vietnamembassy.it' },
  'Japan':      { visa:'https://www.mofa.go.jp',              info:'https://www.it.emb-japan.go.jp' },
  'Mongolia':   { visa:'https://evisa.mfa.mn',                info:'https://rome.mfa.mn' },
  'Kazakhstan': { visa:'https://viza.gov.kz',                 info:'https://www.gov.kz' },
  'Uzbekistan': { visa:'https://e-visa.gov.uz',               info:'https://mfa.uz' },
  'Egypt':      { visa:'https://www.visa2egypt.gov.eg',       info:'https://www.mfa.gov.eg' },
  'Jordan':     { visa:'https://www.moi.gov.jo',              info:'https://www.mfa.gov.jo' },
  'Ethiopia':   { visa:'https://www.evisa.gov.et',            info:'https://www.mofa.gov.et' },
  'Kenya':      { visa:'https://evisa.go.ke',                 info:'https://mfa.go.ke' },
}

export function getOfficialPortal(country) {
  return OFFICIAL_PORTALS[country] || null
}

// ── Vehicle-specific documents ──
export function getVehicleDocuments(vehicle, lang = 'it') {
  const docs = {
    car: {
      it: [
        'Patente di guida valida',
        'Permesso Internazionale di Guida (IDP) — obbligatorio fuori UE',
        'Carta di circolazione del veicolo',
        'Assicurazione RC internazionale (Carta Verde)',
        'Vignette autostradali per ogni paese (dove richiesto)',
        'Triangolo emergenza + giubbotto catarifrangente',
        'Carnet de Passages en Douanes (per paesi extra-UE con dogana veicoli)',
        'Estintore (obbligatorio in alcuni paesi)',
      ],
      en: [
        'Valid driving licence',
        'International Driving Permit (IDP) — mandatory outside EU',
        'Vehicle registration document',
        'International car insurance (Green Card)',
        'Highway vignettes per country (where required)',
        'Emergency triangle + reflective vest',
        'Carnet de Passages en Douanes (for non-EU countries with vehicle customs)',
        'Fire extinguisher (mandatory in some countries)',
      ],
    },
    moto: {
      it: [
        'Patente categoria A valida',
        'Permesso Internazionale di Guida (IDP)',
        'Libretto di circolazione moto',
        'Assicurazione internazionale moto (Carta Verde)',
        'Casco omologato ECE 22.06 (obbligatorio ovunque)',
        'Kit pronto soccorso e attrezzi base',
        'Carnet de Passages (per paesi con dogana veicoli)',
        'Verificare restrizioni specifiche per moto (es. Iran, Arabia Saudita)',
        'Abbigliamento protettivo obbligatorio in alcuni paesi',
      ],
      en: [
        'Valid category A driving licence',
        'International Driving Permit (IDP)',
        'Motorcycle registration document',
        'International motorcycle insurance (Green Card)',
        'Approved ECE 22.06 helmet (mandatory everywhere)',
        'First aid kit and basic tools',
        'Carnet de Passages (for countries with vehicle customs)',
        'Check motorcycle-specific restrictions (e.g. Iran, Saudi Arabia)',
        'Protective clothing mandatory in some countries',
      ],
    },
    camper: {
      it: [
        'Patente B (o C se peso > 3.5t)',
        'Permesso Internazionale di Guida (IDP)',
        'Carta di circolazione + certificato di conformità',
        'Assicurazione internazionale camper (Carta Verde)',
        'Verificare limiti peso/dimensioni per ogni paese',
        'Permessi speciali per aree protette/nazionali',
        'Carnet de Passages en Douanes',
        'Documentazione LPG/GPL se applicabile',
        'Tassa di transito per camper in alcuni paesi balcanici',
      ],
      en: [
        'Category B licence (or C if >3.5t)',
        'International Driving Permit (IDP)',
        'Vehicle registration + conformity certificate',
        'International camper insurance (Green Card)',
        'Check weight/size limits per country',
        'Special permits for protected/national areas',
        'Carnet de Passages en Douanes',
        'LPG documents if applicable',
        'Camper transit fee in some Balkan countries',
      ],
    },
    bike: {
      it: [
        'Documento d\'identità o passaporto valido',
        'Assicurazione personale/viaggio con copertura ciclistica',
        'Verificare regole bici su traghetti e treni (boxed or bagged)',
        'Luci anteriore/posteriore (obbligatorie di notte)',
        'Casco (consigliato, obbligatorio in alcuni paesi)',
        'Kit riparazione: camere d\'aria, leve, pompa, multitool',
        'Permessi per piste ciclabili in aree protette',
      ],
      en: [
        'Valid ID or passport',
        'Personal/travel insurance with cycling coverage',
        'Check bike rules on ferries and trains (boxed or bagged)',
        'Front/rear lights (mandatory at night)',
        'Helmet (recommended, mandatory in some countries)',
        'Repair kit: inner tubes, levers, pump, multitool',
        'Permits for cycling trails in protected areas',
      ],
    },
    walk: {
      it: [
        'Documento d\'identità o passaporto valido',
        'Assicurazione personale con copertura infortuni/soccorso',
        'Permessi trekking per parchi nazionali e aree protette',
        'Registrazione con autorità locali per zone remote',
        'GPS/mappa offline + bussola',
        'Kit primo soccorso',
      ],
      en: [
        'Valid ID or passport',
        'Personal insurance with accident/rescue coverage',
        'Trekking permits for national parks and protected areas',
        'Registration with local authorities for remote zones',
        'Offline GPS/map + compass',
        'First aid kit',
      ],
    },
    boat: {
      it: [
        'Patente nautica (obbligatoria per imbarcazioni > 24m o motore > 40.8 kW)',
        'Documentazione imbarcazione (numero di matricola)',
        'Assicurazione imbarcazione internazionale (RCN)',
        'Permessi di navigazione acque territoriali straniere',
        'Dotazione di sicurezza obbligatoria (razzi, giubbotti, zattera)',
        'Visita doganale in ogni paese (Q flag + clearance)',
        'Visto d\'ingresso via mare per alcuni paesi',
        'EPIRB e AIS raccomandati per navigazione offshore',
      ],
      en: [
        'Boat licence (mandatory for vessels >24m or engine >40.8 kW)',
        'Vessel documentation (registration number)',
        'International boat insurance (3rd party)',
        'Navigation permits for foreign territorial waters',
        'Mandatory safety equipment (flares, life jackets, raft)',
        'Customs clearance in each country (Q flag)',
        'Sea entry visa for some countries',
        'EPIRB and AIS recommended for offshore navigation',
      ],
    },
  }
  return docs[vehicle]?.[lang] || docs.car[lang]
}

// ── Health & vaccine requirements by country/region ──
export function getHealthRequirements(countries, lang = 'it') {
  const db = {
    'Morocco':    { v_it:['Epatite A','Tifo','Rabbia (lunga permanenza)','DTP aggiornato'],       v_en:['Hepatitis A','Typhoid','Rabies (long stay)','DTP updated'],       malaria:false, note_it:'Rischio GI elevato — bere solo acqua in bottiglia.', note_en:'High GI risk — drink bottled water only.' },
    'Iran':       { v_it:['Epatite A e B','Tifo','Tetano-Difterite','Polio'],                     v_en:['Hepatitis A&B','Typhoid','Tetanus-Diphtheria','Polio'],            malaria:false, note_it:'Necessario visto medico per farmaci controllati.', note_en:'Medical visa required for controlled medications.' },
    'India':      { v_it:['Epatite A e B','Tifo','Encefalite giapponese','Rabbia','Colera'],       v_en:['Hepatitis A&B','Typhoid','Japanese encephalitis','Rabies','Cholera'], malaria:true, note_it:'Profilassi antimalarica consigliata per zone rurali.', note_en:'Antimalarial prophylaxis advised for rural areas.' },
    'Thailand':   { v_it:['Epatite A e B','Tifo','Rabbia','Encefalite giapponese'],               v_en:['Hepatitis A&B','Typhoid','Rabies','Japanese encephalitis'],         malaria:false, note_it:'Dengue in aumento — repellente obbligatorio.', note_en:'Dengue rising — repellent mandatory.' },
    'Vietnam':    { v_it:['Epatite A e B','Tifo','Encefalite giapponese','Rabbia'],               v_en:['Hepatitis A&B','Typhoid','Japanese encephalitis','Rabies'],         malaria:false, note_it:'Zone nord: rischio malaria ridotto ma presente.', note_en:'Northern areas: low but present malaria risk.' },
    'Mongolia':   { v_it:['Epatite A e B','Encefalite da zecche (TBE)','Rabbia'],                v_en:['Hepatitis A&B','Tick-borne encephalitis (TBE)','Rabies'],            malaria:false, note_it:'Zecche in estate — abiti coprenti e repellente.', note_en:'Ticks in summer — cover up and use repellent.' },
    'Kenya':      { v_it:['Epatite A e B','Tifo','Febbre Gialla (obbligatoria)','Rabbia'],       v_en:['Hepatitis A&B','Typhoid','Yellow Fever (required)','Rabies'],        malaria:true,  note_it:'Certificato febbre gialla obbligatorio all\'ingresso.', note_en:'Yellow fever certificate mandatory at entry.' },
    'Ethiopia':   { v_it:['Epatite A e B','Tifo','Febbre Gialla (obbligatoria)','Colera'],       v_en:['Hepatitis A&B','Typhoid','Yellow Fever (required)','Cholera'],       malaria:true,  note_it:'Vaccino febbre gialla richiesto per entrata.', note_en:'Yellow fever vaccine required for entry.' },
    'Egypt':      { v_it:['Epatite A','Tifo','Tetano'],                                          v_en:['Hepatitis A','Typhoid','Tetanus'],                                  malaria:false, note_it:'Zona Fayoum: bassa probabilità malaria.', note_en:'Fayoum area: low malaria probability.' },
    'Jordan':     { v_it:['Epatite A','Tifo','DTP aggiornato'],                                  v_en:['Hepatitis A','Typhoid','DTP updated'],                              malaria:false, note_it:'Standard travel health measures suffice.', note_en:'Standard travel health measures suffice.' },
    'Kazakhstan': { v_it:['Epatite A e B','TBE per zone forestali'],                             v_en:['Hepatitis A&B','TBE for forested areas'],                           malaria:false, note_it:'DTP raccomandato aggiornato.', note_en:'Updated DTP recommended.' },
    'Uzbekistan': { v_it:['Epatite A e B','Tifo','DTP'],                                         v_en:['Hepatitis A&B','Typhoid','DTP'],                                    malaria:false, note_it:'Acqua in bottiglia obbligatoria ovunque.', note_en:'Bottled water mandatory everywhere.' },
    'China':      { v_it:['Epatite A e B','Tifo','Encefalite giapponese','Rabbia'],               v_en:['Hepatitis A&B','Typhoid','Japanese encephalitis','Rabies'],         malaria:false, note_it:'Alcune zone western: consigliata profilassi malaria.', note_en:'Western areas: malaria prophylaxis advised.' },
    'Russia':     { v_it:['Encefalite da zecche (TBE)','Epatite A e B','DTP'],                   v_en:['Tick-borne encephalitis (TBE)','Hepatitis A&B','DTP'],               malaria:false, note_it:'TBE vaccino importante per zone boschive.', note_en:'TBE vaccine important for forested areas.' },
  }
  const results = []
  countries.forEach(c => {
    const info = db[c]
    if (info) results.push({ country: c, vaccines_it: info.v_it, vaccines_en: info.v_en, malaria: info.malaria, note_it: info.note_it, note_en: info.note_en })
  })
  return results
}

// ── Smart local trip generator (no AI needed) ──
const ROUTE_DB = {
  default: {
    stops: [
      { city:'Punto di partenza', country:'', lat:0, lng:0, nights:1, drive_from_prev_km:0, drive_from_prev_h:0, tourist_score:50, vibe:'Inizio', description:'Il tuo punto di partenza. Preparativi finali e documenti.', see:['Verifica documenti','Mappa offline'], eat:['Rifornimento viveri','Colazione locale'], sleep:['Alloggio di partenza'], local_tip:'Controlla tutti i documenti la sera prima.', hidden_gem:'Chiedi al tuo ospite la strada più bella per uscire dalla città.' },
    ],
  },
}

// Build a realistic multi-stop trip from a well-known database
const KNOWN_ROUTES = [
  { re: /italia.*turchia|italy.*turkey|turchia.*italia|turkey.*italy/i,
    title_it:'Italia → Turchia — Via Balcani', title_en:'Italy → Turkey — Via Balkans', tagline_it:'Da Venezia agli stretti del Bosforo.', tagline_en:'From Venice to the Bosphorus straits.',
    km:3800, days_min:14,
    stops_it:[
      { city:'Trieste', country:'Italia', lat:45.65, lng:13.77, nights:1, drive_from_prev_km:0, drive_from_prev_h:0, tourist_score:55, vibe:'Porto', description:'Porta d\'Europa verso l\'Est. Architettura asburgica e bora.', see:['Piazza Unità d\'Italia','Castello di Miramare','Grotta Gigante'], eat:['Buffet triestino','Sardoni in savor'], sleep:['Centro storico'], local_tip:'La bora soffia forte — controlla meteo prima di salire al Carso.', hidden_gem:'Faro della Vittoria al tramonto.' },
      { city:'Ljubljana', country:'Slovenia', lat:46.05, lng:14.50, nights:1, drive_from_prev_km:110, drive_from_prev_h:1.5, tourist_score:65, vibe:'Arty', description:'La capitale più vivace dei Balcani. Castello medievale e lungofiume bohémien.', see:['Castello di Ljubljana','Lungofiume Ljubljanica','Tivoli Park'], eat:['Pogača bread','Vino Rebula'], sleep:['Stara Ljubljana'], local_tip:'Molti locali chiudono la domenica — arriva il sabato sera.', hidden_gem:'Quartiere Šiška fuori dai circuiti turistici.' },
      { city:'Zagreb', country:'Croazia', lat:45.81, lng:15.98, nights:1, drive_from_prev_km:140, drive_from_prev_h:2, tourist_score:60, vibe:'Café', description:'Città con due anime: medievale sopra, asburgica sotto. Mercato Dolac insuperabile.', see:['Città Alta (Gornji grad)','Mercato Dolac','Cattedrale'], eat:['Štrukli burro e formaggi','Fritule'], sleep:['Gornji grad'], local_tip:'Il caffè a Zagreb è un\'istituzione — siediti e guarda la gente passare.', hidden_gem:'Museo delle relazioni spezzate.' },
      { city:'Sarajevo', country:'Bosnia', lat:43.85, lng:18.35, nights:2, drive_from_prev_km:380, drive_from_prev_h:5, tourist_score:58, vibe:'Memorie', description:'La Gerusalemme d\'Europa. Moschee, chiese e sinagoghe a 50 metri l\'una dall\'altra.', see:['Baščaršija bazaar','Ponte Latino','Tunnel della guerra'], eat:['Ćevapi','Burek con formaggio','Bosanska kafa'], sleep:['Baščaršija'], local_tip:'Cambia valuta in banca — tasso migliore.', hidden_gem:'Monte Trebević in seggiovia con vista sulla città.' },
      { city:'Sofia', country:'Bulgaria', lat:42.70, lng:23.32, nights:1, drive_from_prev_km:380, drive_from_prev_h:5, tourist_score:52, vibe:'Contrasti', description:'Sofia sorprende: moderna e medieval insieme. Vitosha sullo sfondo sempre.', see:['Alexander Nevsky Cathedral','Vitosha Blvd','Museo Nazionale di Storia'], eat:['Shopska salata','Banitsa'], sleep:['Centro, vicino NDK'], local_tip:'Sofia è più grande di quanto sembri — usa Uber.', hidden_gem:'Quartiere Lozenets per il brunch domenicale.' },
      { city:'Istanbul', country:'Turkey', lat:41.01, lng:28.96, nights:3, drive_from_prev_km:580, drive_from_prev_h:7, tourist_score:88, vibe:'Epica', description:'La città più bella del viaggio. Tra Europa e Asia, 15 milioni di abitanti che ti travolgono.', see:['Hagia Sophia','Grand Bazaar','Bosphorus cruise','Galata Tower'], eat:['Döner Kanat — Beyoğlu','Balık ekmek sul Bosforo','Meze a Karaköy'], sleep:['Sultanahmet o Beyoğlu'], local_tip:'Il pass Istanbulkart vale per tutto il trasporto pubblico.', hidden_gem:'Quartiere Balat per street food e foto.' },
    ],
  },
  { re: /italia.*marocco|italy.*morocco|marocco.*italia|morocco.*italy/i,
    title_it:'Italia → Marocco — Via Spagna e Gibilterra', title_en:'Italy → Morocco — Via Spain & Gibraltar', tagline_it:'Dal Mediterraneo al Sahara.', tagline_en:'From the Mediterranean to the Sahara.',
    km:4200, days_min:12,
    stops_it:[
      { city:'Genova', country:'Italia', lat:44.40, lng:8.93, nights:1, drive_from_prev_km:0, drive_from_prev_h:0, tourist_score:55, vibe:'Porto', description:'Porto di partenza verso ovest. Carruggi medievali e pesto originale.', see:['Porto Antico','Caruggi','Boccadasse'], eat:['Pesto al mortaio','Focaccia ligure'], sleep:['Centro storico'], local_tip:'Parcheggio gratuito zona Fiera fuori dal centro.', hidden_gem:'Piazzetta Scuole Pie per l\'aperitivo.' },
      { city:'Barcelona', country:'Spagna', lat:41.38, lng:2.17, nights:2, drive_from_prev_km:750, drive_from_prev_h:8, tourist_score:85, vibe:'Viva', description:'Il cuore creativo della penisola iberica. Gaudí, tapas e il lungomare più animato d\'Europa.', see:['Sagrada Família','Park Güell','Las Ramblas','El Born'], eat:['Pan con tomate','Patatas bravas','Vermut a Barceloneta'], sleep:['El Raval o Eixample'], local_tip:'Sagrada Família — prenota online con 2 settimane d\'anticipo.', hidden_gem:'Bunkers del Carmel per la vista panoramica.' },
      { city:'Tarifa', country:'Spagna', lat:36.01, lng:-5.60, nights:1, drive_from_prev_km:1100, drive_from_prev_h:12, tourist_score:45, vibe:'Vento', description:'Punta sud d\'Europa. Il Marocco è visibile a 14 km. Kite surf e vento costante.', see:['Punta de Tarifa','Stretto di Gibilterra','Castillo de Guzmán'], eat:['Gambas a la pil-pil','Tortilla española'], sleep:['Spiaggia nord'], local_tip:'Prenota traghetto FRS o Baleàlia con 24h d\'anticipo in alta stagione.', hidden_gem:'Punta Paloma beach al tramonto.' },
      { city:'Tangeri', country:'Marocco', lat:35.76, lng:-5.80, nights:1, drive_from_prev_km:30, drive_from_prev_h:1, tourist_score:62, vibe:'Gateway', description:'Prima porta africana. La medina storica rinasce dopo anni di restauro.', see:['Medina di Tangeri','Casbah','Cap Spartel'], eat:['Harira soup','Pastilla di piccione'], sleep:['Medina — Dar Nour'], local_tip:'Cambia euro in banco, non dai cambiavalute in strada.', hidden_gem:'Mercato del pesce al mattino presto.' },
      { city:'Chefchaouen', country:'Marocco', lat:35.17, lng:-5.27, nights:2, drive_from_prev_km:120, drive_from_prev_h:2, tourist_score:78, vibe:'Indaco', description:'La città blu del Rif. Ogni vicolo è una fotografia. Atmosfera unica al mondo.', see:['Medina blu','Plaza Uta el-Hammam','Cascate Ras el-Maa'], eat:['Mjammar — agnello speziato','Msemen fresco'], sleep:['Riad nel centro medina'], local_tip:'Alzati alle 6 per la medina senza folla.', hidden_gem:'Sentiero verso la croce spagnola — vista mozzafiato.' },
      { city:'Marrakech', country:'Marocco', lat:31.63, lng:-8.00, nights:3, drive_from_prev_km:560, drive_from_prev_h:6, tourist_score:90, vibe:'Caos meraviglioso', description:'La città rossa. Piazza Jemaa el-Fna di notte è come nessun altro posto sulla terra.', see:['Jemaa el-Fna','Souks','Medersa Ben Youssef','Giardino Majorelle'], eat:['Tagine di agnello al mechoui','Couscous del venerdì','Thé à la menthe'], sleep:['Riad nella medina — prenota con anticipo'], local_tip:'Il taxi Petit non ha tassametro — concordare prezzo prima.', hidden_gem:'Quartiere mellah (ebraico) dimenticato dai turisti.' },
    ],
  },
]

export function generateTripWithAI({ from, to, vehicle, days, season, touristLevel, interests, nationality, lang }) {
  // Check known routes first
  const query = `${from} ${to}`.toLowerCase()
  let found = KNOWN_ROUTES.find(r => r.re.test(query))

  let stops, title, tagline, overview, km

  if (found) {
    stops = JSON.parse(JSON.stringify(found.stops_it))
    title = lang === 'it' ? found.title_it : found.title_en
    tagline = lang === 'it' ? found.tagline_it : found.tagline_en
    km = found.km

    // Adjust number of stops to available days
    const maxStops = Math.max(2, Math.floor(days / 2))
    if (stops.length > maxStops) stops = stops.slice(0, maxStops)

    // Apply tourist level filter: low level = prefer low tourist_score stops
    if (touristLevel < 40) {
      stops = stops.filter((s, i) => i === 0 || i === stops.length - 1 || s.tourist_score < 70)
    }
  } else {
    // Generic generation based on from/to
    stops = buildGenericStops(from, to, vehicle, days, touristLevel, lang)
    title = lang === 'it' ? `${from} → ${to}` : `${from} → ${to}`
    tagline = lang === 'it'
      ? `Un viaggio in ${vehicle} alla scoperta di nuove strade.`
      : `A ${vehicle} journey discovering new roads.`
    km = days * (vehicle === 'walk' ? 25 : vehicle === 'bike' ? 80 : 350)
  }

  // Localize overnight counts based on total days
  const totalNightsAvailable = days - 1
  let assigned = 0
  stops.forEach((s, i) => {
    if (i === stops.length - 1) { s.nights = Math.max(1, totalNightsAvailable - assigned); return }
    const n = Math.max(1, s.nights || 1)
    s.nights = n
    assigned += n
  })

  overview = lang === 'it'
    ? `Un ${vehicle === 'car' ? 'road trip in auto' : vehicle === 'moto' ? 'viaggio in moto' : 'viaggio'} di ${days} giorni con ${stops.length} tappe principali. Stagione: ${season}. Livello turistico: ${touristLevel}% — ${touristLevel < 40 ? 'fuori dalle rotte classiche' : touristLevel > 70 ? 'attrazioni principali' : 'mix equilibrato'}.`
    : `A ${days}-day ${vehicle} trip with ${stops.length} main stops. Season: ${season}. Tourist level: ${touristLevel}% — ${touristLevel < 40 ? 'off the beaten path' : touristLevel > 70 ? 'main highlights' : 'balanced mix'}.`

  const highlights = lang === 'it'
    ? stops.slice(0, 3).map(s => `${s.city}: ${s.vibe}`)
    : stops.slice(0, 3).map(s => `${s.city}: ${s.vibe}`)

  const uniqueCountries = [...new Set(stops.map(s => s.country).filter(Boolean))]
  const allDocs = getVehicleDocuments(vehicle, lang)
  const health  = getHealthRequirements(uniqueCountries, lang)

  return Promise.resolve({
    title,
    tagline,
    overview,
    total_km: km,
    highlights,
    best_season: getBestSeasonAdvice(season, uniqueCountries, lang),
    stops,
    practical: buildPracticalInfo(uniqueCountries, vehicle, lang),
    documents: allDocs,
    health_requirements: health,
    countries: uniqueCountries,
  })
}

function buildGenericStops(from, to, vehicle, days, touristLevel, lang) {
  const fromCoords = { lat: 45.46, lng: 9.19 }  // fallback Milan
  const toCoords   = { lat: 48.85, lng: 2.35 }   // fallback Paris

  const numStops = Math.max(2, Math.min(8, Math.floor(days / 2)))
  const stops = []
  for (let i = 0; i < numStops; i++) {
    const t = i / (numStops - 1)
    stops.push({
      city: i === 0 ? from : i === numStops - 1 ? to : `Tappa ${i + 1}`,
      country: '',
      lat: fromCoords.lat + (toCoords.lat - fromCoords.lat) * t,
      lng: fromCoords.lng + (toCoords.lng - fromCoords.lng) * t,
      nights: 1,
      drive_from_prev_km: i === 0 ? 0 : 250,
      drive_from_prev_h: i === 0 ? 0 : 3,
      tourist_score: touristLevel,
      vibe: lang === 'it' ? 'Scoperta' : 'Discovery',
      description: lang === 'it'
        ? `Tappa ${i + 1} del tuo viaggio. Esplora la zona e lasciati sorprendere.`
        : `Stop ${i + 1} of your journey. Explore the area and be surprised.`,
      see: lang === 'it' ? ['Centro storico', 'Mercato locale'] : ['Historic centre', 'Local market'],
      eat: lang === 'it' ? ['Cucina locale'] : ['Local cuisine'],
      sleep: lang === 'it' ? ['B&B o ostello locale'] : ['Local B&B or hostel'],
      local_tip: lang === 'it' ? 'Chiedi ai locali i loro posti preferiti.' : 'Ask locals for their favourite spots.',
      hidden_gem: lang === 'it' ? 'Esplora il quartiere fuori dal centro.' : 'Explore the neighbourhood outside the centre.',
    })
  }
  return stops
}

function getBestSeasonAdvice(season, countries, lang) {
  const advice = {
    'Primavera (Mar-Mag)': { it: 'Primavera ottimale — temperature miti, meno folla rispetto all\'estate.', en: 'Optimal spring — mild temperatures, fewer crowds than summer.' },
    'Estate (Giu-Ago)':    { it: 'Estate: caldo intenso in alcune zone, alta stagione. Prenota con anticipo.', en: 'Summer: intense heat in some areas, peak season. Book well ahead.' },
    'Autunno (Set-Nov)':   { it: 'Autunno ideale — luce dorata, prezzi ridotti, clima perfetto.', en: 'Ideal autumn — golden light, lower prices, perfect climate.' },
    'Inverno (Dic-Feb)':   { it: 'Inverno: possibili neve e strade chiuse in montagna. Verifica condizioni.', en: 'Winter: possible snow and mountain road closures. Check conditions.' },
    'Spring (Mar-May)': { it: 'Primavera ottimale.', en: 'Optimal spring.' },
    'Summer (Jun-Aug)': { it: 'Alta stagione — prenota alloggi con anticipo.', en: 'Peak season — book accommodation well ahead.' },
    'Autumn (Sep-Nov)': { it: 'Autunno perfetto per viaggiare.', en: 'Perfect autumn for travelling.' },
    'Winter (Dec-Feb)': { it: 'Controlla condizioni stradali in montagna.', en: 'Check mountain road conditions.' },
  }
  return advice[season]?.[lang] || (lang === 'it' ? 'Controlla le condizioni stagionali prima di partire.' : 'Check seasonal conditions before departure.')
}

function buildPracticalInfo(countries, vehicle, lang) {
  const nonEU = countries.filter(c => !['Italia','Francia','Germania','Spagna','Croazia','Slovenia','Austria','Grecia','Bulgaria','Romania','Portogallo'].includes(c))

  return {
    currency_tips: lang === 'it'
      ? (nonEU.length ? `Per ${nonEU.join(', ')}: cambia in banca/ATM locale, evita cambiavalute in aeroporto. Porta sempre contanti.` : 'Euro valido in zona UE. Carte accettate quasi ovunque.')
      : (nonEU.length ? `For ${nonEU.join(', ')}: change at local bank/ATM, avoid airport exchange. Always carry cash.` : 'Euro valid in EU zone. Cards widely accepted.'),
    connectivity: lang === 'it'
      ? 'SIM locale più economica per dati abbondanti. In UE roaming gratuito. App offline: Maps.me o OsmAnd indispensabili.'
      : 'Local SIM cheapest for data. EU roaming free. Offline apps: Maps.me or OsmAnd essential.',
    road_conditions: lang === 'it'
      ? (vehicle === 'moto' ? 'Moto: strade balcaniche variabili — ottimo asfalto nei pressi delle coste, buche nell\'entroterra. Guida conservativa.' : 'Strade principali in buone condizioni. Autostrade a pagamento in diversi paesi.')
      : (vehicle === 'moto' ? 'Moto: Balkan roads variable — good tarmac near coasts, potholes inland. Ride conservatively.' : 'Main roads in good condition. Toll motorways in several countries.'),
    budget_estimate_per_day: lang === 'it'
      ? (nonEU.length ? '€40–€70/giorno (Balcani/Est Europa); €70–€120 (Turchia/Marocco). Include carburante, cibo, alloggio base.' : '€80–€130/giorno in Europa occidentale. Campeggi e cucina locale riducono i costi.')
      : (nonEU.length ? '€40–€70/day (Balkans/Eastern Europe); €70–€120 (Turkey/Morocco). Includes fuel, food, basic accommodation.' : '€80–€130/day in Western Europe. Campsites and local cooking reduce costs.'),
    border_crossings: nonEU.length ? (lang === 'it'
      ? [`Alle frontiere extra-UE: documento originale + carta verde assicurazione obbligatoria. Per il ${vehicle}: verifica il Carnet de Passages.`, 'Attese variabili: 30 min – 3 ore in alta stagione. Porta spuntini e acqua.']
      : [`At non-EU borders: original documents + green card insurance mandatory. For ${vehicle}: check Carnet de Passages requirement.`, 'Waiting times vary: 30 min – 3 hours in peak season. Bring snacks and water.']
    ) : [],
    emergency_numbers: lang === 'it'
      ? 'EU: 112 universale. Ambasciata italiana all\'estero: +39 06 36911 (FARNESINA emergenze).'
      : 'EU: 112 universal. Italian embassy abroad: +39 06 36911 (FARNESINA emergencies).',
  }
}

// ── Expert mode: enrich a single stop ──
export function enrichStop(stopName, country, vehicle, touristLevel, lang) {
  // Static enrichment from a small database, no AI needed
  return Promise.resolve({
    description: lang === 'it'
      ? `${stopName} è una tappa ricca di storia e cultura. Per un road tripper in ${vehicle}, offre ottimi punti di sosta e scoperte inaspettate.`
      : `${stopName} is rich in history and culture. For a ${vehicle} road tripper, it offers great stopping points and unexpected discoveries.`,
    vibe: lang === 'it' ? 'Scoperta' : 'Discovery',
    see: lang === 'it'
      ? ['Centro storico', 'Mercato locale', 'Punto panoramico']
      : ['Historic centre', 'Local market', 'Panoramic viewpoint'],
    eat: lang === 'it'
      ? ['Ristorante cucina tipica locale', 'Bar per colazione']
      : ['Local cuisine restaurant', 'Café for breakfast'],
    sleep: lang === 'it'
      ? ['B&B nel centro storico', 'Campeggio nelle vicinanze']
      : ['B&B in historic centre', 'Nearby campsite'],
    local_tip: lang === 'it'
      ? 'Chiedi ai locali il loro posto preferito — non è nella guida.'
      : 'Ask locals for their favourite spot — it\'s not in the guidebook.',
    hidden_gem: lang === 'it'
      ? 'Esplora i vicoli laterali fuori dal centro turistico.'
      : 'Explore the side streets away from the tourist centre.',
    road_note: lang === 'it'
      ? `Parcheggio: cerca zone blu o parcheggi scambiatori fuori dal centro. Per ${vehicle} controlla ZTL.`
      : `Parking: look for paid zones or park-and-ride outside centre. For ${vehicle} check traffic restrictions.`,
  })
}

// src/lib/aiTrip.js
// Generatore itinerari SENZA AI — basato su database reale di tappe

const STOPS_DB = {
  italy: [
    { city:'Milano', country:'Italy', lat:45.46, lng:9.19, tourist_score:70, vibe:'cosmopolita', see:['Duomo','Navigli','Pinacoteca Brera'], eat:['Risotto alla milanese','Cotoletta'], sleep:['Brera','Navigli'], local_tip:'Aperitivo nei Navigli dalle 18:00 — incluso stuzzichini', hidden_gem:'Cimitero Monumentale' },
    { city:'Bologna', country:'Italy', lat:44.49, lng:11.34, tourist_score:60, vibe:'gastronomica', see:['Due Torri','Piazza Maggiore','Porticato UNESCO'], eat:['Tagliatelle al ragù autentico','Mortadella'], sleep:['Centro storico'], local_tip:'Mercato di Mezzo per colazione con i bolognesi', hidden_gem:'Basilica di Santo Stefano — 7 chiese collegate' },
    { city:'Firenze', country:'Italy', lat:43.77, lng:11.25, tourist_score:90, vibe:'rinascimentale', see:['Uffizi (prenota!)','Ponte Vecchio','Piazzale Michelangelo'], eat:['Bistecca fiorentina da Buca Mario','Lampredotto al mercato'], sleep:['Oltrarno','Santa Croce'], local_tip:'Mercato Centrale per colazione autentica a 3€', hidden_gem:'Giardino dei Semplici — orto botanico del 1545' },
    { city:'Roma', country:'Italy', lat:41.90, lng:12.50, tourist_score:95, vibe:'millenaria', see:['Colosseo (mattina presto)','Trastevere di notte','Campo de\' Fiori'], eat:['Cacio e pepe da Roscioli','Supplì al volo'], sleep:['Trastevere','Prati'], local_tip:'Fontana di Trevi alle 6:00 — zero folla', hidden_gem:'Quartiere Testaccio — autentico e senza turisti' },
    { city:'Napoli', country:'Italy', lat:40.85, lng:14.27, tourist_score:75, vibe:'caotica e meravigliosa', see:['Spaccanapoli','Sotterranei','Castel dell\'Ovo'], eat:['Pizza da Gino Sorbillo','Sfogliatella calda'], sleep:['Quartieri Spagnoli','Centro storico'], local_tip:'Non rifiutare mai un caffè al bancone — costa 1€', hidden_gem:'Catacomba di San Gennaro' },
  ],
  balkans: [
    { city:'Lubiana', country:'Slovenia', lat:46.05, lng:14.51, tourist_score:65, vibe:'bohémien', see:['Castello di Lubiana','Mercato centrale di Plečnik','Città vecchia'], eat:['Kranjska klobasa','Potica'], sleep:['Centro','Krakovo'], local_tip:'Giro in barca sul Ljubljanica — 6€', hidden_gem:'Parco Tivoli al tramonto' },
    { city:'Zagabria', country:'Croatia', lat:45.81, lng:15.98, tourist_score:60, vibe:'mitteleuropea', see:['Gradec (città alta)','Mercato Dolac','Museo relazioni interrotte'], eat:['Štrukli al forno','Burek caldo'], sleep:['Gornji Grad'], local_tip:'Domenica mattina al mercato Dolac — i croati veri fanno la spesa', hidden_gem:'Mirogoj — il cimitero più bello d\'Europa' },
    { city:'Spalato', country:'Croatia', lat:43.51, lng:16.44, tourist_score:80, vibe:'mediterranea', see:['Palazzo di Diocleziano (abitare un\'imperatore)','Riva lungomare','Isola Brač in giornata'], eat:['Peka (agnello sotto il coperchio)','Gregada di pesce'], sleep:['Dentro il palazzo','Bačvice'], local_tip:'Picigin — il gioco in acqua che giocano solo i dalmati', hidden_gem:'Fortezza Klis — dove giravano Game of Thrones' },
    { city:'Mostar', country:'Bosnia and Herzegovina', lat:43.34, lng:17.81, tourist_score:85, vibe:'multiculturale', see:['Stari Most al tramonto','Kujundžiluk bazar','Cascate di Kravice'], eat:['Ćevapi con pane somun','Burek di carne'], sleep:['Vicino allo Stari Most'], local_tip:'Il tramonto dal ponte vale il viaggio', hidden_gem:'Blagaj Tekke — monastero derviscio sulla sorgente' },
    { city:'Kotor', country:'Montenegro', lat:42.42, lng:18.77, tourist_score:80, vibe:'veneziana', see:['Mura veneziane (1350 gradini)','Cattedrale di San Trifone','Perast con le isole'], eat:['Crni rižot','Lignje na žaru'], sleep:['Dentro le mura'], local_tip:'Salita alle mura all\'alba — vista pazzesca e freschi', hidden_gem:'Baia di Cattaro in kayak al tramonto' },
    { city:'Tirana', country:'Albania', lat:41.33, lng:19.83, tourist_score:50, vibe:'emergente', see:['Bunkart 2 (storia dei bunker)','Piazza Skanderbeg','Quartiere Blloku'], eat:['Tavë kosi (agnello e uova)','Byrek spinaci'], sleep:['Blloku'], local_tip:'Pranzo all\'Oda restaurant — autentico e economico', hidden_gem:'Bunker art — arte urbana nei bunker abbandonati' },
  ],
  turkey: [
    { city:'Istanbul', country:'Turkey', lat:41.01, lng:28.97, tourist_score:90, vibe:'imperiale', see:['Hagia Sophia','Gran Bazar','Traversata Bosforo in traghetto'], eat:['Balık ekmek sul Bosforo','Döner autentico'], sleep:['Sultanahmet','Beyoğlu/Karaköy'], local_tip:'Traghetto Eminönü-Kadıköy — 1€, vista spettacolare', hidden_gem:'Quartiere Fener-Balat — case colorate e artigiani' },
    { city:'Bursa', country:'Turkey', lat:40.18, lng:29.06, tourist_score:55, vibe:'ottomana', see:['Grande Moschea (700 anni)','Mercato coperto','Monte Uludağ'], eat:['İskender kebap (inventato qui)','Castagne candite'], sleep:['Centro'], local_tip:'İskender kebap da Kebapçı İskender — il vero originale', hidden_gem:'Villaggio di Cumalıkızık (XIV secolo, UNESCO)' },
    { city:'Cappadocia', country:'Turkey', lat:38.64, lng:34.83, tourist_score:95, vibe:'lunare', see:['Göreme open air museum','Valle di Ihlara','Derinkuyu città sotterranea'], eat:['Testi kebab cotto nel vaso','Mantı (ravioli)'], sleep:['Cave hotel a Göreme'], local_tip:'Mongolfiera all\'alba — prenota 3-6 mesi prima (250€ a persona)', hidden_gem:'Derinkuyu — città sotterranea per 20.000 persone' },
    { city:'Antalya', country:'Turkey', lat:36.89, lng:30.71, tourist_score:75, vibe:'costiera', see:['Kaleiçi (centro storico)','Cascate Düden','Rovine di Perge'], eat:['Piyaz (fagioli)','Şiş köfte'], sleep:['Kaleiçi'], local_tip:'Mercato Kalekapısı la mattina — vita autentica', hidden_gem:'Termessos — città antica più intatta della Turchia' },
  ],
  caucasus: [
    { city:'Tbilisi', country:'Georgia', lat:41.69, lng:44.83, tourist_score:70, vibe:'autentica', see:['Città vecchia Abanotubani','Fortezza Narikala','Mtatsminda'], eat:['Khinkali (mangiane con le mani!)','Khachapuri al formaggio'], sleep:['Abanotubani','Sololaki'], local_tip:'Bagni sulfurei ad Abanotubani — 5 GEL (2€)', hidden_gem:'Monastero di Shio-Mgvime — 1500 anni, spesso vuoto' },
    { city:'Kazbegi', country:'Georgia', lat:42.65, lng:44.65, tourist_score:60, vibe:'alpina', see:['Chiesa Gergeti (2170m)','Monte Kazbek (5047m)','Valle di Truso'], eat:['Kubdari (torta di carne)','Mtsvadi (spiedini)'], sleep:['Stepantsminda'], local_tip:'Trek alla chiesa Gergeti con guida locale — 3-4 ore', hidden_gem:'Cascate Gveleti — 15 min da Kazbegi, quasi sconosciute' },
  ],
  morocco: [
    { city:'Tangeri', country:'Morocco', lat:35.76, lng:-5.80, tourist_score:65, vibe:'porta d\'Africa', see:['Medina','Capo Spartel','Grottes d\'Hercule'], eat:['Harira soup','Msemen'], sleep:['Medina'], local_tip:'Prima impressione intensa — dai tempo alla città', hidden_gem:'Capo Spartel al tramonto — Atlantico e Mediterraneo' },
    { city:'Chefchaouen', country:'Morocco', lat:35.17, lng:-5.27, tourist_score:75, vibe:'azzurra', see:['Medina azzurra','Plaza Uta el-Hammam','Cascate Akchour'], eat:['Msemen con miele','Kefta'], sleep:['Medina'], local_tip:'Fotografa le strade azzurre la mattina presto — niente folla', hidden_gem:'Cascate Akchour — 7 km a piedi dalla città' },
    { city:'Fes', country:'Morocco', lat:34.03, lng:-5.00, tourist_score:80, vibe:'medievale', see:['Medina (la più grande del mondo senza auto)','Conceria Chouara','Al-Qarawiyyin 859 d.C.'], eat:['Pastilla con piccione','Harira e chebakia'], sleep:['Riad in medina'], local_tip:'Guida locale obbligatoria — la medina è un labirinto di 9400 vicoli', hidden_gem:'Borj Nord per vista panoramica sulla medina' },
    { city:'Marrakech', country:'Morocco', lat:31.63, lng:-7.99, tourist_score:90, vibe:'vibrante', see:['Djemaa el-Fna (sera!)','Souks','Giardino Majorelle'], eat:['Tagine di agnello','Couscous del venerdì con famiglie'], sleep:['Riad in medina'], local_tip:'Contratta sempre al souk — offri il 30% del prezzo iniziale', hidden_gem:'Quartiere Mellah (vecchio quartiere ebraico)' },
    { city:'Merzouga', country:'Morocco', lat:31.09, lng:-4.01, tourist_score:70, vibe:'desertica', see:['Dune Erg Chebbi','Tramonto in cammello','Villaggi berberi'], eat:['Mechoui (agnello al forno)','Tè alla menta 3 volte'], sleep:['Bivacco nel deserto — imperdibile'], local_tip:'Notte nel deserto sotto le stelle — la migliore del viaggio', hidden_gem:'Ksar di Rissani — mercato berbero autentico il martedì' },
  ],
  scandinavia: [
    { city:'Oslo', country:'Norway', lat:59.91, lng:10.75, tourist_score:70, vibe:'moderna', see:['Vigeland Park','Akershus Fortress','Fjordi in traghetto'], eat:['Fiskesuppe (zuppa di pesce)','Kjøttkaker'], sleep:['Grünerløkka'], local_tip:'Oslo Pass per trasporti e musei gratuiti', hidden_gem:'Ekebergparken — parco di sculture con vista Oslo' },
    { city:'Bergen', country:'Norway', lat:60.39, lng:5.32, tourist_score:80, vibe:'anseatica', see:['Bryggen UNESCO','Fløibanen (funicolare)','Sognefjord day trip'], eat:['Fiskesuppe al mercato del pesce','Lefse'], sleep:['Bryggen area'], local_tip:'Fløibanen al tramonto — vista sui fiordi indimenticabile', hidden_gem:'Fantoft Stave Church — chiesa in legno del XII secolo' },
    { city:'Flåm', country:'Norway', lat:60.86, lng:7.12, tourist_score:75, vibe:'fiordica', see:['Ferrovia Flåm (la più bella del mondo)','Nærøyfjord UNESCO','Cascate Kjosfossen'], eat:['Pinnekjøtt','Rømmegrøt'], sleep:['Along the fjord'], local_tip:'Ferrovia Flåm+kayak nel fiordo — la combinazione perfetta', hidden_gem:'Valle di Aurland — quasi nessun turista rispetto a Flåm' },
  ],
}

const ROUTE_MAP = {
  default:        ['italy'],
  italy_balkans:  ['italy','balkans'],
  italy_turkey:   ['italy','balkans','turkey'],
  italy_caucasus: ['italy','balkans','turkey','caucasus'],
  italy_morocco:  ['italy','morocco'],
  morocco_loop:   ['morocco'],
  scandinavia:    ['scandinavia'],
}

function detectRoute(from, to) {
  const t = (to || '').toLowerCase()
  const f = (from || '').toLowerCase()
  if (t.includes('morocco') || t.includes('marocco') || t.includes('marrakech') || t.includes('fes') || t.includes('chefchaouen')) return 'italy_morocco'
  if (t.includes('georgia') || t.includes('tbilisi') || t.includes('kazbegi')) return 'italy_caucasus'
  if (t.includes('turkey') || t.includes('turchia') || t.includes('istanbul') || t.includes('cappadocia') || t.includes('antalya')) return 'italy_turkey'
  if (t.includes('albania') || t.includes('tirana') || t.includes('montenegro') || t.includes('kotor') || t.includes('bosnia') || t.includes('mostar') || t.includes('croatia') || t.includes('croazia') || t.includes('split') || t.includes('spalato')) return 'italy_balkans'
  if (f.includes('oslo') || f.includes('bergen') || t.includes('norway') || t.includes('norvegia') || t.includes('bergen') || t.includes('oslo') || t.includes('sweden') || t.includes('svezia')) return 'scandinavia'
  return 'default'
}

function selectStops(stops, days, touristLevel) {
  const filtered = stops.filter(s => {
    const score = s.tourist_score || 50
    if (touristLevel <= 25) return score <= 60
    if (touristLevel <= 50) return score <= 80
    if (touristLevel <= 75) return true
    return score >= 50
  })
  const max = Math.min(Math.floor(days / 2.5), filtered.length, 7)
  return filtered.slice(0, max)
}

export async function generateTripWithAI({ from, to, vehicle, days, season, touristLevel, interests, lang = 'it' }) {
  await new Promise(r => setTimeout(r, 900))

  const routeKey  = detectRoute(from, to)
  const regions   = ROUTE_MAP[routeKey] || ['italy']
  let allStops    = []
  regions.forEach(r => { if (STOPS_DB[r]) allStops = [...allStops, ...STOPS_DB[r]] })

  const middle    = selectStops(allStops, Math.max(days - 3, 1), touristLevel)
  const totalDays = days || 14

  // Distribute nights across stops
  const nightsBase = Math.floor((totalDays - 2) / Math.max(middle.length, 1))
  let dayCounter   = 1
  const stopsWithDays = middle.map((s, i) => {
    const nights = i === 0 ? Math.max(nightsBase, 1) : nightsBase
    const stop   = {
      ...s,
      nights,
      day_from: dayCounter,
      day_to:   dayCounter + nights - 1,
      drive_from_prev_km: i === 0 ? Math.round(50 + Math.random() * 150) : Math.round(80 + Math.random() * 220),
      drive_from_prev_h:  i === 0 ? Math.round(1 + Math.random() * 2)   : Math.round(1 + Math.random() * 3),
    }
    dayCounter += nights
    return stop
  })

  const firstStop = { city: from, country: '', lat: 0, lng: 0, nights: 1, tourist_score: 50, vibe: lang==='it'?'partenza':'start', see:[], eat:[], sleep:[], local_tip: lang==='it'?'Punto di partenza — controlla che tutto sia in ordine prima di partire':'Departure point — make sure everything is ready before leaving', hidden_gem:'', day_from:1, day_to:1, drive_from_prev_km:0, drive_from_prev_h:0 }
  const lastStop  = { city: to, country: '', lat: 0, lng: 0, nights: 2, tourist_score: 50, vibe: lang==='it'?'destinazione':'destination', see:[], eat:[], sleep:[], local_tip: lang==='it'?'Destinazione finale — esplora con calma':'Final destination — explore at leisure', hidden_gem:'', day_from: dayCounter, day_to: dayCounter + 1, drive_from_prev_km: Math.round(100 + Math.random() * 300), drive_from_prev_h: Math.round(2 + Math.random() * 4) }

  const stops     = [firstStop, ...stopsWithDays, lastStop]
  const total_km  = stops.reduce((acc, s) => acc + (s.drive_from_prev_km || 0), 0)

  const titles = {
    italy_balkans:  { it:`${from} → Balcani`,   en:`${from} → Balkans` },
    italy_turkey:   { it:`${from} → Istanbul`,  en:`${from} → Istanbul` },
    italy_caucasus: { it:`${from} → Caucaso`,   en:`${from} → Caucasus` },
    italy_morocco:  { it:`${from} → Marocco`,   en:`${from} → Morocco` },
    scandinavia:    { it:'Giro Scandinavia',     en:'Scandinavia Loop' },
    default:        { it:`${from} → ${to}`,     en:`${from} → ${to}` },
  }

  const taglines = {
    it: ['La strada è il viaggio.','Ogni curva racconta una storia.','Viaggia lento, vivi di più.','Non c\'è meta, solo percorso.'],
    en: ['The road is the journey.','Every bend tells a story.','Travel slow, live more.','No destination, only the path.'],
  }

  const overviews = {
    italy_balkans:  { it:'I Balcani sono l\'Europa meno conosciuta — e più autentica. Culture sovrapposte, strade tortuose e paesaggi che cambiano ogni 100 km.', en:'The Balkans are Europe\'s least-known corner. Layered cultures, winding roads and landscapes changing every 100km.' },
    italy_turkey:   { it:'Dall\'Italia alla porta d\'Oriente: mari cristallini, rovine imperiali e la magia di Istanbul dove due continenti si toccano.', en:'From Italy to the gateway of the East: crystal seas, imperial ruins and the magic of Istanbul where two continents meet.' },
    italy_caucasus: { it:'Il road trip più epico d\'Europa: attraverso i Balcani, la Turchia, fino alla Georgia dove le montagne del Caucaso sfiorano il cielo.', en:'The most epic European road trip: through the Balkans, Turkey, all the way to Georgia where the Caucasus mountains touch the sky.' },
    italy_morocco:  { it:'Dall\'Europa al Nordafrica in uno: strade spagnole, il traghetto per Tangeri, poi i colori e i profumi del Marocco.', en:'From Europe to North Africa in one go: Spanish roads, the Tangier ferry, then the colours and scents of Morocco.' },
    scandinavia:    { it:'Fiordi, foreste e città di design: la Scandinavia è un road trip per chi ama la natura, il silenzio e l\'estetica.', en:'Fjords, forests and design cities: Scandinavia is a road trip for nature lovers.' },
    default:        { it:`Un viaggio da ${from} a ${to} — pianifica ogni tappa con calma e lascia spazio alle deviazioni impreviste.`, en:`A journey from ${from} to ${to} — plan each stop and leave room for unexpected detours.` },
  }

  const seasonTips = {
    it: { 'Primavera (Mar-Mag)':'Ottima stagione — clima mite e poca folla rispetto all\'estate', 'Estate (Giu-Ago)':'Alta stagione — prenota alloggi con almeno 2 settimane di anticipo', 'Autunno (Set-Nov)':'Stagione ideale — colori fantastici, prezzi bassi, poca folla', 'Inverno (Dic-Feb)':'Bassa stagione — freddo ma autentico, prezzi bassissimi' },
    en: { 'Spring (Mar-May)':'Great season — mild weather and fewer crowds', 'Summer (Jun-Aug)':'High season — book at least 2 weeks ahead', 'Autumn (Sep-Nov)':'Ideal season — great colours and low prices', 'Winter (Dec-Feb)':'Low season — cold but authentic and very affordable' },
  }

  return {
    title:    titles[routeKey]?.[lang]    || `${from} → ${to}`,
    tagline:  taglines[lang][Math.floor(Math.random() * taglines[lang].length)],
    overview: overviews[routeKey]?.[lang] || overviews.default[lang],
    total_km,
    highlights:  stopsWithDays.slice(0, 3).map(s => s.city),
    best_season: seasonTips[lang]?.[season] || '',
    stops,
    practical: {
      currency_tips:           lang==='it'?'Porta contante per i paesi non-UE (Bosnia, Albania, Montenegro, Turchia, Marocco)':'Carry cash for non-EU countries (Bosnia, Albania, Montenegro, Turkey, Morocco)',
      connectivity:            lang==='it'?'SIM locale al primo varco fuori UE. Roaming EU gratuito nei 27 paesi UE.':'Local SIM at first non-EU border. Free EU roaming in 27 EU countries.',
      road_conditions:         lang==='it'?'Strade buone in Slovenia/Croazia. Attenzione a buche e velocità nei Balcani del sud.':'Good roads in Slovenia/Croatia. Watch for potholes and speed in southern Balkans.',
      budget_estimate_per_day: lang==='it'?'Italia: 80-120€ · Balcani: 35-60€ · Turchia: 30-50€ · Marocco: 25-45€':'Italy: €80-120 · Balkans: €35-60 · Turkey: €30-50 · Morocco: €25-45',
      border_crossings: lang==='it'
        ? ['UE/Schengen: nessun controllo','Bosnia/Albania/Montenegro: passaporto richiesto','Turchia: e-Visa online obbligatorio (€27 — compra prima di partire)','Georgia: no visto per cittadini UE (365 giorni)','Marocco: no visto per UE (90 giorni)']
        : ['EU/Schengen: no control','Bosnia/Albania/Montenegro: passport required','Turkey: e-Visa online required (€27 — buy before you go)','Georgia: no visa for EU citizens (365 days)','Morocco: no visa for EU citizens (90 days)'],
    },
  }
}

export async function enrichStop(stopName, country, vehicle, touristLevel, lang = 'it') {
  await new Promise(r => setTimeout(r, 300))
  const all   = Object.values(STOPS_DB).flat()
  const found = all.find(s => s.city.toLowerCase().includes(stopName.toLowerCase()) || stopName.toLowerCase().includes(s.city.toLowerCase()))
  if (found) return { description: lang==='it' ? `${found.city} — ${found.vibe}. ${found.local_tip}` : `${found.city} — ${found.vibe}. ${found.local_tip}`, vibe:found.vibe, see:found.see, eat:found.eat, sleep:found.sleep, local_tip:found.local_tip, hidden_gem:found.hidden_gem, road_note:lang==='it'?'Parcheggio limitato in centro — usa park & ride':'Limited parking downtown — use park & ride' }
  return { description:lang==='it'?'Tappa da esplorare liberamente — chiedi ai locali i posti migliori.':'A stop to explore freely — ask locals for the best spots.', vibe:lang==='it'?'autentica':'authentic', see:[lang==='it'?'Centro storico':'Old town',lang==='it'?'Mercato locale':'Local market'], eat:[lang==='it'?'Trattoria locale':'Local restaurant'], sleep:[lang==='it'?'B&B in centro':'Central B&B'], local_tip:lang==='it'?'Esplora a piedi il mattino presto':'Explore on foot early morning', hidden_gem:lang==='it'?'Chiedi all\'host il posto segreto dei locals':'Ask your host for the locals\' secret spot', road_note:lang==='it'?'Verifica parcheggio in anticipo':'Check parking in advance' }
}

export function getVehicleDocuments(vehicle, lang = 'it') {
  const docs = {
    car:    { it:['Patente di guida valida','IDP (Permesso Internazionale) — obbligatorio fuori UE','Carta di circolazione','Assicurazione internazionale (Carta Verde)','Vignette autostradali','Triangolo + giubbotto catarifrangente','Carnet de Passages (extra-UE con dogana veicoli)'], en:['Valid driving licence','IDP — mandatory outside EU','Vehicle registration','International insurance (Green Card)','Highway vignettes','Emergency triangle + reflective vest','Carnet de Passages (non-EU with vehicle customs)'] },
    moto:   { it:['Patente categoria A','IDP internazionale','Libretto moto','Assicurazione internazionale (Carta Verde)','Casco omologato — obbligatorio ovunque','Carnet de Passages (extra-UE)'], en:['Category A licence','International IDP','Motorcycle registration','International insurance (Green Card)','Approved helmet — mandatory everywhere','Carnet de Passages (non-EU)'] },
    camper: { it:['Patente B (o C se >3.5t)','IDP internazionale','Carta circolazione + conformità','Assicurazione internazionale','Verificare limiti peso/dimensioni per ogni paese','Carnet de Passages'], en:['Licence B (or C if >3.5t)','International IDP','Registration + conformity','International insurance','Check weight/size limits per country','Carnet de Passages'] },
    bike:   { it:['Passaporto/carta identità','Assicurazione personale con copertura ciclistica','Kit riparazione + pompa','Luci e catarifrangenti (obbligatori)'], en:['Passport/ID','Personal insurance with cycling cover','Repair kit + pump','Lights and reflectors (mandatory)'] },
    walk:   { it:['Passaporto/carta identità','Assicurazione infortuni','Permessi per aree protette'], en:['Passport/ID','Accident insurance','Permits for protected areas'] },
    boat:   { it:['Patente nautica','Documentazione imbarcazione','Assicurazione internazionale','Permessi navigazione acque straniere','Attrezzatura sicurezza obbligatoria'], en:['Boat licence','Vessel documentation','International insurance','Navigation permits for foreign waters','Mandatory safety equipment'] },
  }
  return docs[vehicle]?.[lang] || docs.car[lang]
}

export function getHealthRequirements(countries, lang = 'it') {
  const db = {
    'Morocco':{'vaccines_it':['Epatite A','Tifo','Rabbia (lunga permanenza)'],'vaccines_en':['Hepatitis A','Typhoid','Rabies (long stay)'],'malaria':false},
    'Marocco':{'vaccines_it':['Epatite A','Tifo'],'vaccines_en':['Hepatitis A','Typhoid'],'malaria':false},
    'Turkey':{'vaccines_it':['Epatite A e B','Tifo'],'vaccines_en':['Hepatitis A&B','Typhoid'],'malaria':false},
    'Georgia':{'vaccines_it':['Epatite A e B','Tetano'],'vaccines_en':['Hepatitis A&B','Tetanus'],'malaria':false},
    'Albania':{'vaccines_it':['Epatite A'],'vaccines_en':['Hepatitis A'],'malaria':false},
    'India':{'vaccines_it':['Epatite A e B','Tifo','Encefalite giapponese','Rabbia'],'vaccines_en':['Hepatitis A&B','Typhoid','Japanese encephalitis','Rabies'],'malaria':true},
  }
  return countries.map((c,i) => db[c] ? { country:c, ...db[c] } : null).filter(Boolean)
}

const PORTALS = {
  'Turkey':    {visa:'https://www.evisa.gov.tr',     info:'https://www.mfa.gov.tr'},
  'Iran':      {visa:'https://visa.efrm.ir',          info:'https://mfa.ir'},
  'China':     {visa:'https://www.visaforchina.org',  info:'https://www.china-embassy.org'},
  'Russia':    {visa:'https://visa.kdmid.ru',         info:'https://italy.mid.ru'},
  'India':     {visa:'https://indianvisaonline.gov.in',info:'https://www.hcirome.in'},
  'Morocco':   {visa:'https://www.amb-maroc.it',      info:'https://marocco.esteri.it'},
  'Marocco':   {visa:'https://www.amb-maroc.it',      info:'https://marocco.esteri.it'},
  'Georgia':   {visa:'https://www.geoconsul.gov.ge',  info:'https://mfa.gov.ge'},
  'Albania':   {visa:'https://e-visa.gov.al',         info:'https://punetejashtme.gov.al'},
  'Vietnam':   {visa:'https://evisa.xuatnhapcanh.gov.vn',info:'https://www.vietnamembassy.it'},
  'Japan':     {visa:'https://www.mofa.go.jp',        info:'https://www.it.emb-japan.go.jp'},
  'Mongolia':  {visa:'https://evisa.mfa.mn',          info:'https://rome.mfa.mn'},
  'Thailand':  {visa:'https://www.thaievisa.go.th',   info:'https://www.thaiembassy.it'},
}
export function getOfficialPortal(country) { return PORTALS[country] || null }

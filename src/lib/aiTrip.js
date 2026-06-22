// src/lib/aiTrip.js
// Real trip generation using ORS routing + Nominatim geocoding
// Stop enrichment via curated city database
// Documents with official government portal links

import { geocodeCity, generateRealStops } from './routing.js'

// ── Official government portals ──
const OFFICIAL_PORTALS = {
  // Europa extra-UE
  'Turchia':     { visa:'https://www.evisa.gov.tr',             info:'https://www.mfa.gov.tr',         visto_it:'e-Visa online ~€15, rilascio immediato' },
  'Turkey':      { visa:'https://www.evisa.gov.tr',             info:'https://www.mfa.gov.tr',         visto_it:'e-Visa online ~€15, rilascio immediato' },
  'Georgia':     { visa:'https://www.geoconsul.gov.ge',         info:'https://mfa.gov.ge',             visto_it:'Nessun visto — cittadini italiani max 365 giorni' },
  'Albania':     { visa:'https://e-visa.gov.al',                info:'https://punetejashtme.gov.al',   visto_it:'Nessun visto — accordo bilaterale con Italia' },
  'Serbia':      { visa:'https://www.mfa.gov.rs',               info:'https://www.mfa.gov.rs',         visto_it:'Nessun visto — max 90 giorni' },
  'Bosnia':      { visa:'https://www.mvp.gov.ba',               info:'https://www.mvp.gov.ba',         visto_it:'Nessun visto — max 90 giorni' },
  'Montenegro':  { visa:'https://www.gov.me/en/diplomatic',     info:'https://www.gov.me',             visto_it:'Nessun visto — max 90 giorni' },
  'Macedonia':   { visa:'https://www.mfa.gov.mk',               info:'https://www.mfa.gov.mk',         visto_it:'Nessun visto — max 90 giorni' },
  'Kosovo':      { visa:'https://www.mfa-ks.net',               info:'https://www.mfa-ks.net',         visto_it:'Nessun visto — max 90 giorni' },
  'Moldova':     { visa:'https://www.mfa.gov.md',               info:'https://www.mfa.gov.md',         visto_it:'Nessun visto — max 90 giorni' },
  'Ukraine':     { visa:'https://mfa.gov.ua',                   info:'https://mfa.gov.ua',             visto_it:'Nessun visto — verificare situazione attuale' },
  // Medio Oriente / Nord Africa
  'Marocco':     { visa:'https://www.amb-maroc.it',             info:'https://marocco.esteri.it',      visto_it:'Nessun visto — max 90 giorni' },
  'Morocco':     { visa:'https://www.amb-maroc.it',             info:'https://marocco.esteri.it',      visto_it:'Nessun visto — max 90 giorni' },
  'Iran':        { visa:'https://visa.efrm.ir',                 info:'https://mfa.ir',                 visto_it:'Visto obbligatorio — richiesta in ambasciata, ~30 gg anticipo' },
  'Egitto':      { visa:'https://www.visa2egypt.gov.eg',        info:'https://www.mfa.gov.eg',         visto_it:'Visto on arrival ~€25 oppure e-Visa online' },
  'Egypt':       { visa:'https://www.visa2egypt.gov.eg',        info:'https://www.mfa.gov.eg',         visto_it:'Visto on arrival ~€25 oppure e-Visa online' },
  'Jordan':      { visa:'https://www.moi.gov.jo',               info:'https://www.mfa.gov.jo',         visto_it:'Jordan Pass include visto — consigliato' },
  'Giordania':   { visa:'https://www.moi.gov.jo',               info:'https://www.mfa.gov.jo',         visto_it:'Jordan Pass include visto — consigliato' },
  // Asia
  'Russia':      { visa:'https://visa.kdmid.ru',                info:'https://italy.mid.ru',           visto_it:'Visto obbligatorio — situazione attuale complessa' },
  'Cina':        { visa:'https://www.visaforchina.org',         info:'https://www.china-embassy.org',  visto_it:'Visto obbligatorio — rilascio 4-7 gg lavorativi' },
  'China':       { visa:'https://www.visaforchina.org',         info:'https://www.china-embassy.org',  visto_it:'Visto obbligatorio — rilascio 4-7 gg lavorativi' },
  'India':       { visa:'https://indianvisaonline.gov.in',      info:'https://www.hcirome.in',         visto_it:'e-Visa online ~€25 — rilascio 72 ore' },
  'Mongolia':    { visa:'https://evisa.mfa.mn',                 info:'https://rome.mfa.mn',            visto_it:'e-Visa online ~€15 — rilascio 48 ore' },
  'Kazakhstan':  { visa:'https://viza.gov.kz',                  info:'https://www.gov.kz',             visto_it:'Nessun visto — max 30 giorni accordo bilaterale' },
  'Uzbekistan':  { visa:'https://e-visa.gov.uz',                info:'https://mfa.uz',                 visto_it:'e-Visa online ~€20 — rilascio 3 gg lavorativi' },
  'Thailand':    { visa:'https://www.thaievisa.go.th',          info:'https://www.thaiembassy.it',     visto_it:'Nessun visto — max 30 giorni; e-Visa per soggiorni lunghi' },
  'Vietnam':     { visa:'https://evisa.xuatnhapcanh.gov.vn',    info:'https://www.vietnamembassy.it',  visto_it:'e-Visa online ~€25 — valido 90 giorni' },
  'Giappone':    { visa:'https://www.mofa.go.jp',               info:'https://www.it.emb-japan.go.jp', visto_it:'Nessun visto — max 90 giorni' },
  'Japan':       { visa:'https://www.mofa.go.jp',               info:'https://www.it.emb-japan.go.jp', visto_it:'Nessun visto — max 90 giorni' },
  // Africa
  'Kenya':       { visa:'https://evisa.go.ke',                  info:'https://mfa.go.ke',              visto_it:'e-Visa online obbligatorio ~€50' },
  'Etiopia':     { visa:'https://www.evisa.gov.et',             info:'https://www.mofa.gov.et',        visto_it:'e-Visa online obbligatorio ~€50' },
  'Ethiopia':    { visa:'https://www.evisa.gov.et',             info:'https://www.mofa.gov.et',        visto_it:'e-Visa online obbligatorio ~€50' },
  // Sempre utile
  'default':     { visa:'https://vistoperitalia.esteri.it',     info:'https://www.farnesina.it',       visto_it:'Verifica su Farnesina.it' },
}

export function getOfficialPortal(country) {
  return OFFICIAL_PORTALS[country] || OFFICIAL_PORTALS['default']
}

// ── Vehicle documents ──
export function getVehicleDocuments(vehicle, lang = 'it') {
  const docs = {
    car: {
      it: [
        { doc:'Patente di guida valida (categoria B)', note:'Obbligatorio in tutti i paesi' },
        { doc:'Permesso Internazionale di Guida (IDP)', note:'Obbligatorio fuori UE — richiedi in Motorizzazione o ACI' },
        { doc:'Libretto di circolazione', note:'Originale, non fotocopia' },
        { doc:'Assicurazione RC internazionale (Carta Verde)', note:'Obbligatorio fuori UE — richiedi alla tua assicurazione' },
        { doc:'Vignette autostradali', note:'Austria, Svizzera, Slovenia, Ungheria, Repubblica Ceca, Slovacchia — acquistabili online o al confine' },
        { doc:'Triangolo emergenza + giubbotto catarifrangente', note:'Obbligatorio per legge in molti paesi' },
        { doc:'Carnet de Passages en Douanes', note:'Richiesto per Iran, India, altri paesi extra-UE — richiedilo a TCI o ACI con anticipo' },
        { doc:'Estintore a bordo', note:'Obbligatorio in Albania, Bulgaria, Macedonia del Nord' },
      ],
    },
    moto: {
      it: [
        { doc:'Patente categoria A valida', note:'Obbligatorio in tutti i paesi' },
        { doc:'Permesso Internazionale di Guida (IDP)', note:'Obbligatorio fuori UE — richiedi in Motorizzazione' },
        { doc:'Libretto di circolazione moto', note:'Originale' },
        { doc:'Assicurazione internazionale moto (Carta Verde)', note:'Obbligatorio fuori UE' },
        { doc:'Casco omologato ECE 22.06', note:'Obbligatorio in tutti i paesi — portane uno di riserva per lunghi viaggi' },
        { doc:'Carnet de Passages en Douanes', note:'Necessario per Iran, India, Mongolia — tempi lunghi, organizza con anticipo' },
        { doc:'Kit pronto soccorso + attrezzi base', note:'Cavi di avviamento, kit riparazione pneumatici, olio extra' },
        { doc:'Abbigliamento protettivo', note:'Giacca, pantaloni, guanti e stivali CE — obbligatori in alcuni paesi' },
      ],
    },
    camper: {
      it: [
        { doc:'Patente B (o C se peso > 3.5t)', note:'Verifica il peso totale del tuo camper' },
        { doc:'Permesso Internazionale di Guida (IDP)', note:'Obbligatorio fuori UE' },
        { doc:'Libretto di circolazione + certificato conformità', note:'Controlla che il paese di destinazione accetti la categoria' },
        { doc:'Assicurazione internazionale camper (Carta Verde)', note:'Specifica per camper, non auto' },
        { doc:'Verifica limiti peso/dimensioni per ogni paese', note:'Altezza max spesso 4m, larghezza 2.55m' },
        { doc:'Carnet de Passages en Douanes', note:'Richiesto per paesi extra-UE non europei' },
        { doc:'Documentazione GPL se applicabile', note:'Alcuni paesi limitano l\'uso del GPL — verifica in anticipo' },
        { doc:'App Park4Night o Campercontact', note:'Per trovare aree sosta sicure lungo il percorso' },
      ],
    },
    bike: {
      it: [
        { doc:'Documento d\'identità o passaporto valido', note:'Carta d\'identità valida in UE, passaporto fuori UE' },
        { doc:'Assicurazione viaggio con copertura ciclistica', note:'Include rimpatrio e assistenza medica' },
        { doc:'Luci anteriore e posteriore', note:'Obbligatorie di notte per legge in tutti i paesi europei' },
        { doc:'Casco', note:'Consigliato ovunque, obbligatorio in alcuni paesi per minori' },
        { doc:'Kit riparazione', note:'Camere d\'aria di ricambio, leve, pompa, multitool, mastice' },
        { doc:'Regole bici su traghetti e treni', note:'Spesso richiesto boxed o in busta — verifica per ogni compagnia' },
      ],
    },
    walk: {
      it: [
        { doc:'Documento d\'identità o passaporto valido', note:'Carta d\'identità valida in UE' },
        { doc:'Assicurazione personale infortuni e soccorso', note:'Include elisoccorso — fondamentale in montagna' },
        { doc:'Permessi trekking', note:'Richiesti in parchi nazionali e zone protette — verifica per ogni area' },
        { doc:'Mappa offline + GPS', note:'OsmAnd o Maps.me — non dipendere solo dalla connessione' },
        { doc:'Kit primo soccorso', note:'Bende, disinfettante, antidolorifico, cerotti' },
      ],
    },
    boat: {
      it: [
        { doc:'Patente nautica', note:'Obbligatoria per imbarcazioni > 24m o motore > 40.8 kW' },
        { doc:'Documentazione imbarcazione', note:'Numero di matricola e atto di nazionalità' },
        { doc:'Assicurazione imbarcazione internazionale', note:'RCN — responsabilità civile nautica' },
        { doc:'Dotazione di sicurezza obbligatoria', note:'Razzi, giubbotti, zattera, estintore — controlla normativa paese' },
        { doc:'Q flag + clearance doganale', note:'Obbligatorio all\'arrivo in ogni paese straniero' },
        { doc:'EPIRB e AIS', note:'Fortemente raccomandati per navigazione offshore' },
      ],
    },
  }
  const vehicleDocs = docs[vehicle]?.it || docs.car.it
  return vehicleDocs
}

// ── Health requirements ──
const HEALTH_DB = {
  'Marocco':    { vaccines:['Epatite A','Tifo','Rabbia (soggiorni lunghi)','DTP aggiornato'], malaria:false, note:'Bere solo acqua in bottiglia. Rischio GI elevato.' },
  'Morocco':    { vaccines:['Epatite A','Tifo','Rabbia (soggiorni lunghi)','DTP aggiornato'], malaria:false, note:'Bere solo acqua in bottiglia.' },
  'Iran':       { vaccines:['Epatite A e B','Tifo','Tetano-Difterite','Polio'], malaria:false, note:'Farmaci controllati: necessario certificato medico.' },
  'India':      { vaccines:['Epatite A e B','Tifo','Encefalite giapponese','Rabbia','Colera'], malaria:true, note:'Profilassi antimalarica consigliata per zone rurali.' },
  'Thailand':   { vaccines:['Epatite A e B','Tifo','Rabbia','Encefalite giapponese'], malaria:false, note:'Dengue in aumento — usa repellente.' },
  'Vietnam':    { vaccines:['Epatite A e B','Tifo','Encefalite giapponese','Rabbia'], malaria:false, note:'Zone nord: basso ma presente rischio malaria.' },
  'Mongolia':   { vaccines:['Epatite A e B','Encefalite da zecche (TBE)','Rabbia'], malaria:false, note:'Zecche in estate — abiti coprenti.' },
  'Kenya':      { vaccines:['Epatite A e B','Tifo','Febbre Gialla (OBBLIGATORIA)','Rabbia'], malaria:true, note:'Certificato febbre gialla richiesto all\'ingresso.' },
  'Etiopia':    { vaccines:['Epatite A e B','Tifo','Febbre Gialla (OBBLIGATORIA)','Colera'], malaria:true, note:'Vaccino febbre gialla obbligatorio.' },
  'Ethiopia':   { vaccines:['Epatite A e B','Tifo','Febbre Gialla (OBBLIGATORIA)','Colera'], malaria:true, note:'Vaccino febbre gialla obbligatorio.' },
  'Egitto':     { vaccines:['Epatite A','Tifo','Tetano'], malaria:false, note:'Zona Fayoum: bassa probabilità malaria.' },
  'Egypt':      { vaccines:['Epatite A','Tifo','Tetano'], malaria:false, note:'Zona Fayoum: bassa probabilità malaria.' },
  'Kazakhstan': { vaccines:['Epatite A e B','TBE per zone forestali'], malaria:false, note:'DTP aggiornato raccomandato.' },
  'Uzbekistan': { vaccines:['Epatite A e B','Tifo','DTP'], malaria:false, note:'Acqua in bottiglia obbligatoria.' },
  'Cina':       { vaccines:['Epatite A e B','Tifo','Encefalite giapponese','Rabbia'], malaria:false, note:'Zone occidentali: profilassi malaria consigliata.' },
  'China':      { vaccines:['Epatite A e B','Tifo','Encefalite giapponese','Rabbia'], malaria:false, note:'Zone occidentali: profilassi malaria consigliata.' },
  'Russia':     { vaccines:['Encefalite da zecche (TBE)','Epatite A e B','DTP'], malaria:false, note:'TBE importante per zone boschive siberiane.' },
}

export function getHealthRequirements(countries, lang = 'it') {
  return countries
    .filter(c => HEALTH_DB[c])
    .map(c => ({ country: c, ...HEALTH_DB[c] }))
}

// ── Stop enrichment database ──
const CITY_DB = {
  'Trieste':     { vibe:'Porto asburgico', see:['Piazza Unità d\'Italia','Castello di Miramare','Grotta Gigante'], eat:['Buffet triestino','Sardoni in savor','Osmiza in collina'], sleep:['Centro storico'], tip:'La bora soffia forte in inverno — controlla meteo.', gem:'Faro della Vittoria al tramonto.' },
  'Ljubljana':   { vibe:'Arty & Café', see:['Castello di Ljubljana','Lungofiume Ljubljanica','Triple Bridge'], eat:['Pogača','Vino Rebula','Kranjska klobasa'], sleep:['Stara Ljubljana'], tip:'Molti locali chiudono domenica — arriva sabato sera.', gem:'Quartiere Šiška fuori dai circuiti.' },
  'Zagreb':      { vibe:'Caffè & Cultura', see:['Gornji grad','Mercato Dolac','Cattedrale di Zagabria'], eat:['Štrukli al forno','Fritule','Čobanac'], sleep:['Gornji grad'], tip:'Il caffè a Zagreb è un\'istituzione — prenditi il tempo.', gem:'Museo delle relazioni spezzate.' },
  'Sarajevo':    { vibe:'Crocevia di civiltà', see:['Baščaršija','Ponte Latino','Tunnel della guerra'], eat:['Ćevapi','Burek con formaggio','Bosanska kafa'], sleep:['Baščaršija'], tip:'Cambia valuta in banca, non per strada.', gem:'Monte Trebević in seggiovia.' },
  'Belgrado':    { vibe:'Energia balcanica', see:['Fortezza di Kalemegdan','Skadarlija','Ada Ciganlija'], eat:['Pljeskavica','Kajmak','Rakija lokale'], sleep:['Savamala'], tip:'La nightlife di Belgrado è tra le migliori d\'Europa.', gem:'Mercato di Zemun al mattino.' },
  'Sofia':       { vibe:'Est incontra Ovest', see:['Alexander Nevsky Cathedral','Vitosha Blvd','Museo Storia Nazionale'], eat:['Shopska salata','Banitsa','Tarator'], sleep:['Centro vicino NDK'], tip:'Sofia è più grande di quanto sembri — usa Uber.', gem:'Quartiere Lozenets per il brunch.' },
  'Istanbul':    { vibe:'Epica', see:['Hagia Sophia','Grand Bazaar','Crociera Bosforo','Torre Galata'], eat:['Döner Kanat — Beyoğlu','Balık ekmek sul Bosforo','Meze a Karaköy'], sleep:['Sultanahmet o Beyoğlu'], tip:'Istanbulkart vale per tutto il trasporto pubblico.', gem:'Quartiere Balat per street food e foto.' },
  'Barcelona':   { vibe:'Viva la vida', see:['Sagrada Família','Park Güell','El Born','Las Ramblas'], eat:['Pan con tomate','Patatas bravas','Vermut a Barceloneta'], sleep:['El Raval o Eixample'], tip:'Sagrada Família — prenota online almeno 2 settimane prima.', gem:'Bunkers del Carmel per vista panoramica.' },
  'Madrid':      { vibe:'Arte & Siesta', see:['Prado','Parque del Retiro','Gran Vía'], eat:['Bocadillo de calamares','Cocido madrileño','Churros con chocolate'], sleep:['Malasaña o Chueca'], tip:'I musei sono gratuiti la domenica pomeriggio.', gem:'Mercado de San Fernando — meno turistico del Mercado de San Miguel.' },
  'Lisbona':     { vibe:'Fado e saudade', see:['Alfama','Torre de Belém','Tram 28'], eat:['Pastéis de nata','Bacalhau','Vinho verde'], sleep:['Alfama o Príncipe Real'], tip:'Acquista il biglietto giornaliero per tram e metro.', gem:'Miradouro da Graça — meno folla dell\'Alfama.' },
  'Marrakech':   { vibe:'Caos meraviglioso', see:['Jemaa el-Fna','Souks','Medersa Ben Youssef','Giardino Majorelle'], eat:['Tagine di agnello','Couscous del venerdì','Thé à la menthe'], sleep:['Riad nella medina'], tip:'Il taxi Petit non ha tassametro — concordare prima.', gem:'Quartiere Mellah (ebraico) dimenticato dai turisti.' },
  'Vienna':      { vibe:'Imperiale', see:['Schönbrunn','Kunsthistorisches Museum','Naschmarkt'], eat:['Wiener Schnitzel','Sachertorte','Apfelstrudel'], sleep:['Innere Stadt'], tip:'La Vienna Card copre trasporti e sconti musei.', gem:'Prater con la ruota panoramica storica.' },
  'Budapest':    { vibe:'Danubio & Terme', see:['Parlamento','Terme Széchenyi','Bastione dei Pescatori'], eat:['Gulyás','Lángos','Tokaj'], sleep:['Distretto VII — Ruin bar'], tip:'Le terme sono aperte la sera — atmosfera unica.', gem:'Mercato centrale al piano superiore.' },
  'Praga':       { vibe:'Fiaba medievale', see:['Castello','Ponte Carlo','Città Vecchia'], eat:['Svíčková','Trdelník al forno','Birra ceca'], sleep:['Malá Strana'], tip:'Evita i cambiavalute in centro — usa ATM.', gem:'Vyšehrad — panorama sulla città senza folla.' },
  'Amsterdam':   { vibe:'Canali & Libertà', see:['Rijksmuseum','Anne Frank House','Canali Jordaan'], eat:['Stroopwafel','Stamppot','Haring'], sleep:['Jordaan'], tip:'La bici è il mezzo migliore — noleggiala subito.', gem:'Il mercato delle pulci di Waterlooplein.' },
  'Tbilisi':     { vibe:'Caucaso autentico', see:['Città Vecchia','Narikala','Mtatsminda'], eat:['Khachapuri','Khinkali','Vino naturale georgiano'], sleep:['Città Vecchia'], tip:'Il vino georgiano è eccezionale e costa poco.', gem:'Quartiere Fabrika — street food e arte.' },
  'Genova':      { vibe:'Porto & Carruggi', see:['Porto Antico','Caruggi medievali','Boccadasse'], eat:['Pesto al mortaio','Focaccia','Farinata'], sleep:['Centro storico'], tip:'Parcheggio gratuito zona Fiera fuori dal centro.', gem:'Piazzetta Scuole Pie per l\'aperitivo.' },
  'Torino':      { vibe:'Eleganza sabauda', see:['Mole Antonelliana','Museo Egizio','Palazzo Reale'], eat:['Vitello tonnato','Agnolotti dal plin','Bicerin'], sleep:['Quadrilatero Romano'], tip:'Il Museo Egizio è tra i più importanti al mondo — prenota.', gem:'Balon — mercato delle pulci del sabato.' },
  'Bologna':     { vibe:'La Grassa', see:['Torri degli Asinelli','Piazza Maggiore','Portico di San Luca'], eat:['Tagliatelle al ragù','Tortellini in brodo','Mortadella'], sleep:['Centro storico'], tip:'I portici di Bologna sono Patrimonio UNESCO.', gem:'Mercato di Mezzo per il cibo di qualità.' },
  'Zurigo':      { vibe:'Precisione svizzera', see:['Altstadt','Lago di Zurigo','Museo Nazionale'], eat:['Zürcher Geschnetzeltes','Fondue','Raclette'], sleep:['Altstadt'], tip:'La ZürichCard copre trasporti e musei.', gem:'Quartiere Langstrasse per vita notturna locale.' },
  'Ginevra':     { vibe:'Internazionale', see:['Jet d\'Eau','Quartiere delle Nazioni','Vieille Ville'], eat:['Fondue','Rösti','Malakoff'], sleep:['Plainpalais'], tip:'I musei sono spesso gratuiti di prima domenica del mese.', gem:'Carouge — il quartiere bohémien di Ginevra.' },
  'Monaco':      { vibe:'Bavarese', see:['Marienplatz','Deutsches Museum','Englischer Garten'], eat:['Weißwurst','Bretzel','Birra in birreria'], sleep:['Maxvorstadt'], tip:'L\'Englischer Garten ha una piscina naturale nel fiume.', gem:'Viktualienmarkt al mattino presto.' },
}

function enrichStopFromDB(cityName) {
  const key = Object.keys(CITY_DB).find(k => cityName?.toLowerCase().includes(k.toLowerCase()))
  return key ? CITY_DB[key] : null
}

export function enrichStop(stopName, country, vehicle, touristLevel, lang) {
  const db = enrichStopFromDB(stopName)
  if (db) {
    return Promise.resolve({
      description: `${stopName} — ${db.vibe}. Una tappa imperdibile del tuo percorso.`,
      vibe: db.vibe,
      see:   db.see,
      eat:   db.eat,
      sleep: db.sleep,
      local_tip:  db.tip,
      hidden_gem: db.gem,
    })
  }
  return Promise.resolve({
    description: `${stopName} è una tappa del tuo viaggio. Esplora il centro storico e chiedi ai locali i loro posti preferiti.`,
    vibe: 'Scoperta',
    see:  ['Centro storico', 'Mercato locale', 'Punto panoramico'],
    eat:  ['Cucina tipica locale', 'Bar per colazione'],
    sleep:['B&B o ostello nel centro'],
    local_tip:  'Chiedi ai locali il loro posto preferito — non è nella guida.',
    hidden_gem: 'Esplora i vicoli laterali fuori dal centro turistico.',
  })
}

// ── Practical info by countries ──
function buildPracticalInfo(countries, vehicle) {
  const EU = ['Italia','Francia','Germania','Spagna','Croazia','Slovenia','Austria','Grecia','Bulgaria','Romania','Portogallo','Ungheria','Repubblica Ceca','Polonia','Belgio','Paesi Bassi','Svezia','Norvegia','Danimarca','Finlandia','Svizzera']
  const nonEU = countries.filter(c => !EU.includes(c))

  return {
    currency: nonEU.length
      ? `Per ${nonEU.join(', ')}: ritira contanti all\'ATM locale — tasso migliore di qualsiasi cambiavalute. Porta sempre contanti.`
      : 'Euro valido in zona UE/Schengen. Carte di credito accettate quasi ovunque.',
    connectivity: 'SIM locale per dati illimitati. In UE il roaming è gratuito. App offline essenziali: OsmAnd (mappe), Maps.me, iOverlander (soste).',
    roads: vehicle === 'moto'
      ? 'Strade principali in buone condizioni. Strade secondarie balcaniche variabili — ottimo asfalto vicino alle coste, buche nell\'entroterra. Guida conservativa.'
      : vehicle === 'camper'
      ? 'Verifica altezze massime (spesso 4m) e divieti di transito camper in centri storici. App Campercontact per aree sosta.'
      : 'Strade principali in buone condizioni. Autostrade a pagamento in diversi paesi.',
    budget: nonEU.length
      ? '€35–€60/giorno (Balcani/Est Europa) · €60–€100 (Turchia/Caucaso) · €80–€120 (Marocco). Include carburante, cibo e alloggio base.'
      : '€80–€130/giorno in Europa occidentale. Campeggi e cucina locale riducono notevolmente i costi.',
    borders: nonEU.length
      ? [`Frontiere extra-UE: documento originale + Carta Verde assicurazione obbligatoria. Per ${vehicle}: verifica Carnet de Passages.`, 'Attese variabili: 30 min – 3 ore in alta stagione. Porta acqua e spuntini.']
      : [],
    emergency: 'Numero emergenze EU: 112. Ambasciata italiana: +39 06 36911 (Farnesina — h24 per emergenze).',
  }
}

// ── MAIN: generate trip with real routing ──
export async function generateTripWithAI({ from, to, vehicle, days, season, touristLevel, interests, nationality, lang, fromCoords, toCoords }) {
  // 1. Geocode if coordinates missing
  let fCoords = fromCoords
  let tCoords = toCoords

  if (!fCoords?.lat) {
    const g = await geocodeCity(from)
    if (!g) throw new Error(`Città di partenza non trovata: "${from}"`)
    fCoords = g
  }
  if (!tCoords?.lat) {
    const g = await geocodeCity(to)
    if (!g) throw new Error(`Città di destinazione non trovata: "${to}"`)
    tCoords = g
  }

  // 2. Generate real stops via ORS + Nominatim
  const routeData = await generateRealStops(fCoords, tCoords, from, to, days, vehicle, lang)

  // 3. Enrich each stop with local info
  const enrichedStops = await Promise.all(
    routeData.stops.map(async (stop) => {
      const info = enrichStopFromDB(stop.city)
      return {
        ...stop,
        vibe:       info?.vibe || 'Scoperta',
        description: info
          ? `${stop.city} — ${info.vibe}.`
          : `${stop.city}: esplora il centro e lasciati sorprendere dalla vita locale.`,
        see:        info?.see  || ['Centro storico', 'Mercato locale'],
        eat:        info?.eat  || ['Cucina tipica locale'],
        sleep:      info?.sleep || ['B&B o albergo in centro'],
        local_tip:  info?.tip  || 'Chiedi ai locali i loro posti preferiti.',
        hidden_gem: info?.gem  || 'Esplora i vicoli fuori dal centro turistico.',
      }
    })
  )

  // 4. Build countries list
  const uniqueCountries = [...new Set(enrichedStops.map(s => s.country).filter(Boolean))]

  // 5. Title
  const firstCity = enrichedStops[0]?.city || from
  const lastCity  = enrichedStops[enrichedStops.length - 1]?.city || to
  const title     = `${firstCity} → ${lastCity}`
  const tagline   = `${days} giorni · ${routeData.distance_km.toLocaleString()} km · ${uniqueCountries.length} ${uniqueCountries.length === 1 ? 'paese' : 'paesi'}`

  return {
    title,
    tagline,
    overview: `Percorso reale su strade calcolato via OpenRouteService. ${enrichedStops.length} tappe con nomi reali rilevati lungo il tragitto.`,
    total_km:    routeData.distance_km,
    geometry:    routeData.geometry,
    highlights:  enrichedStops.slice(0, 3).map(s => `${s.city}${s.vibe ? ` — ${s.vibe}` : ''}`),
    best_season: getSeasonAdvice(season),
    stops:       enrichedStops,
    practical:   buildPracticalInfo(uniqueCountries, vehicle),
    countries:   uniqueCountries,
  }
}

function getSeasonAdvice(season) {
  const map = {
    'Primavera (Mar-Mag)': 'Primavera ottimale — temperature miti, meno folla rispetto all\'estate.',
    'Estate (Giu-Ago)':    'Estate: caldo intenso in alcune zone. Prenota alloggi con anticipo.',
    'Autunno (Set-Nov)':   'Autunno ideale — luce dorata, prezzi ridotti, clima perfetto.',
    'Inverno (Dic-Feb)':   'Inverno: possibili neve e strade chiuse in montagna. Verifica condizioni.',
    'Spring (Mar-May)':    'Optimal spring — mild temperatures, fewer crowds than summer.',
    'Summer (Jun-Aug)':    'Summer: intense heat in some areas. Book accommodation in advance.',
    'Autumn (Sep-Nov)':    'Ideal autumn — golden light, lower prices, perfect weather.',
    'Winter (Dec-Feb)':    'Winter: possible snow and mountain road closures. Check conditions.',
  }
  return map[season] || 'Controlla le condizioni stagionali prima di partire.'
}

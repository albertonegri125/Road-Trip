import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { MessageSquare, Plus, Search, ThumbsUp, Eye, Clock, X, ChevronRight, Pin } from 'lucide-react'
import s from './ForumPage.module.css'

const CATEGORIES = {
  it: ['Tutti','Documenti & Visti','Strade & Percorsi','Meccanica & Veicoli','Sicurezza','Consigli pratici','Presentazioni'],
  en: ['All','Documents & Visas','Roads & Routes','Mechanics & Vehicles','Safety','Practical tips','Introductions'],
}

const MOCK_THREADS = [
  { id:1, cat_it:'Documenti & Visti', cat_en:'Documents & Visas', author:'Marco P.', avatar:'MP', date:'3 giorni fa', title_it:'Carnet de Passages — dove si richiede in Italia?', title_en:'Carnet de Passages — where to apply in Italy?',
    body_it:'Ciao a tutti! Sto pianificando un viaggio in Iran e Mongolia e mi serve il Carnet de Passages. Ho sentito che in Italia lo gestisce il Touring Club ma non trovo info chiare. Qualcuno l\'ha fatto di recente? Quanto costa e quanto ci vuole?',
    body_en:'Hi everyone! I\'m planning a trip to Iran and Mongolia and need the Carnet de Passages. I\'ve heard TCI manages it in Italy but can\'t find clear info. Has anyone done it recently? How much does it cost and how long does it take?',
    replies:[
      { author:'Sofia K.', avatar:'SK', date:'2 giorni fa', text_it:'Ciao! L\'ho fatto l\'anno scorso per il Marocco. Touring Club Italiano, puoi farlo in sede o per posta. Costa ~€100-150 + cauzione. Ci vogliono 2-3 settimane. Porta libretto, patente e documento.', text_en:'Hi! I did it last year for Morocco. Touring Club Italiano, you can do it in person or by mail. Costs ~€100-150 + deposit. Takes 2-3 weeks. Bring registration, licence and ID.' },
      { author:'Axel W.', avatar:'AW', date:'1 giorno fa', text_it:'Per l\'Iran e la Mongolia FMPB è molto competitiva come prezzo. Controllate anche loro prima di decidere. La cauzione per l\'Iran è alta però.', text_en:'For Iran and Mongolia FMPB is very competitive on price. Check them out before deciding. The deposit for Iran is high though.' },
    ],
    views:156, likes:23, pinned: true,
  },
  { id:2, cat_it:'Strade & Percorsi', cat_en:'Roads & Routes', author:'Elena V.', avatar:'EV', date:'1 settimana fa', title_it:'Stato delle strade in Albania 2025 — aggiornamento', title_en:'Albania road conditions 2025 — update',
    body_it:'Appena tornata dall\'Albania! Ecco le mie impressioni aggiornate: le strade principali sono molto migliorate rispetto a 5 anni fa. La SH1 da Tirana a Saranda è ottima. Le strade di montagna verso Permet e Berat sono ancora avventurose ma percorribili con normale auto. Solo per moto e fuoristrada i percorsi verso il Valbona valley nel nord.',
    body_en:'Just back from Albania! Here\'s my updated take: main roads much improved vs 5 years ago. SH1 from Tirana to Saranda is excellent. Mountain roads to Permet and Berat still adventurous but doable with normal car.',
    replies:[
      { author:'Lorenzo B.', avatar:'LB', date:'5 giorni fa', text_it:'Grazie! Confermo per la SH1, l\'ho percorsa quest\'estate. Aggiungo: la strada costiera Llogara Pass - Saranda è stupenda ma richiede cautela per i pullman che vengono dall\'altra parte.', text_en:'Thanks! I confirm for SH1, I drove it this summer. Adding: the coastal road Llogara Pass - Saranda is stunning but watch out for buses coming the other way.' },
    ],
    views:289, likes:41, pinned: false,
  },
  { id:3, cat_it:'Meccanica & Veicoli', cat_en:'Mechanics & Vehicles', author:'Lorenzo B.', avatar:'LB', date:'2 settimane fa', title_it:'Preparare la moto per un lungo viaggio — lista checklist', title_en:'Preparing the motorcycle for a long trip — checklist',
    body_it:'Condivido la mia checklist prima di un lungo viaggio in moto. La uso da anni e mi ha sempre salvato:\n• Cambio olio e filtro (obbligatorio)\n• Catena: pulizia, tensione, lubrificazione\n• Pneumatici: pressione + spessore minimo 3mm\n• Freni: pastiglie + liquido\n• Luci: tutte funzionanti?\n• Batteria: test con multimetro\n• Candele se >15.000 km\n• Coolant per acqua/radiatore\n• Kit emergenza: camera d\'aria, leve, co2, patch',
    body_en:'Sharing my checklist before a long motorcycle trip. I\'ve used it for years:\n• Oil and filter change (mandatory)\n• Chain: clean, tension, lube\n• Tyres: pressure + min 3mm tread\n• Brakes: pads + fluid\n• All lights working?\n• Battery: multimeter test\n• Spark plugs if >15k km\n• Coolant check\n• Emergency kit: tube, levers, CO2, patches',
    replies:[
      { author:'Marco P.', avatar:'MP', date:'1 settimana fa', text_it:'Lista ottima! Aggiungerei: documenti in copia digitale su cloud + copia cartacea separata dal portafoglio. E un powerbank da almeno 20.000mah per il telefono-GPS.', text_en:'Great list! I\'d add: digital copies of documents on cloud + paper copy separate from wallet. And a 20,000mah+ powerbank for phone-GPS.' },
    ],
    views:412, likes:67, pinned: false,
  },
  { id:4, cat_it:'Sicurezza', cat_en:'Safety', author:'Ingrid H.', avatar:'IH', date:'3 settimane fa', title_it:'Sicurezza in camper — consigli per parcheggi notturni sicuri', title_en:'Camper safety — tips for safe overnight parking',
    body_it:'Dopo 4 anni di vita in camper in giro per l\'Europa e oltre, ecco i miei consigli per i parcheggi notturni: 1) Park4Night app è oro - review degli utenti sono affidabili. 2) Mai parcheggiare isolato in città - meglio aree di sosta apposite. 3) Balcani: i parcheggi nei centri commerciali sono spesso sicuri e gratuiti.',
    body_en:'After 4 years of camper life around Europe and beyond, here are my overnight parking tips: 1) Park4Night app is gold - user reviews are reliable. 2) Never park isolated in cities - better to use designated rest areas. 3) Balkans: shopping centre car parks often safe and free.',
    replies:[
      { author:'Elena V.', avatar:'EV', date:'2 settimane fa', text_it:'Confermo Park4Night! Aggiungo iOverlander per zone più remote. Per la Turchia, i motel con parcheggio sorvegliato costano poco e danno molta tranquillità.', text_en:'Confirming Park4Night! I\'d add iOverlander for more remote areas. In Turkey, motels with guarded parking are cheap and give great peace of mind.' },
    ],
    views:198, likes:54, pinned: false,
  },
  { id:5, cat_it:'Presentazioni', cat_en:'Introductions', author:'Giulia M.', avatar:'GM', date:'4 giorni fa', title_it:'Ciao da Torino — primo viaggio in moto: Balcani!', title_en:'Hi from Turin — first motorcycle trip: the Balkans!',
    body_it:'Ciao a tutti! Sono Giulia, ho 28 anni e quest\'estate farò il mio primo vero viaggio in moto da sola (o quasi - stiamo cercando qualche compagno di viaggio). Meta: Balcani in 3 settimane, da Torino. Moto: Honda CB500F. Cerco consigli e chi vuole unirsi!',
    body_en:'Hi everyone! I\'m Giulia, 28, and this summer I\'ll do my first real solo motorcycle trip (or almost - looking for travel companions). Destination: Balkans in 3 weeks from Turin. Bike: Honda CB500F. Looking for advice and anyone who wants to join!',
    replies:[],
    views:87, likes:15, pinned: false,
  },
]

export default function ForumPage() {
  const { t, lang, user } = useApp()
  const isIt = lang === 'it'
  const [search,    setSearch]    = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [openId,    setOpenId]    = useState(null)
  const [newThread, setNewThread] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [likedIds,  setLikedIds]  = useState(new Set())

  const cats = CATEGORIES[lang]
  const filtered = MOCK_THREADS.filter(th => {
    const q = search.toLowerCase()
    const matchQ = !q || (isIt?th.title_it:th.title_en).toLowerCase().includes(q) || th.author.toLowerCase().includes(q)
    const matchC = catFilter === 'all' || (isIt?th.cat_it:th.cat_en) === catFilter
    return matchQ && matchC
  })

  const openThread = MOCK_THREADS.find(t => t.id === openId)

  if (openThread) {
    return (
      <div className={s.page}>
        <button className={s.back} onClick={() => setOpenId(null)}>← {isIt?'Torna al forum':'Back to forum'}</button>
        <div className={s.threadFull}>
          <div className={s.threadCat}>{isIt?openThread.cat_it:openThread.cat_en}</div>
          <h1 className={s.threadTitle}>{isIt?openThread.title_it:openThread.title_en}</h1>
          <div className={s.threadMeta}>
            <div className={s.authorRow}>
              <div className={s.avatar}>{openThread.avatar}</div>
              <span className={s.authorName}>{openThread.author}</span>
              <span className={s.authorDate}>{openThread.date}</span>
            </div>
            <div className={s.threadStats}>
              <span><Eye size={12}/> {openThread.views}</span>
              <span><ThumbsUp size={12}/> {openThread.likes}</span>
            </div>
          </div>
          <div className={s.threadBody}>{(isIt?openThread.body_it:openThread.body_en).split('\n').map((line, i) => <p key={i}>{line}</p>)}</div>

          <div className={s.repliesSection}>
            <h3 className={s.repliesTitle}>{openThread.replies.length} {isIt?'risposte':'replies'}</h3>
            {openThread.replies.map((r, i) => (
              <div key={i} className={s.reply}>
                <div className={s.replyHead}>
                  <div className={s.authorRow}>
                    <div className={s.avatar}>{r.avatar}</div>
                    <span className={s.authorName}>{r.author}</span>
                    <span className={s.authorDate}>{r.date}</span>
                  </div>
                </div>
                <p className={s.replyBody}>{isIt?r.text_it:r.text_en}</p>
              </div>
            ))}
          </div>

          {user ? (
            <div className={s.replyBox}>
              <div className={s.replyHead2}>{isIt?'La tua risposta':'Your reply'}</div>
              <textarea className={s.replyInput} rows={4} value={replyText} onChange={e => setReplyText(e.target.value)} placeholder={isIt?'Scrivi la tua risposta…':'Write your reply…'}/>
              <button className={s.replyBtn} onClick={() => { setReplyText(''); alert(isIt?'Risposta inviata! (demo)':'Reply sent! (demo)') }}>
                {isIt ? 'Invia risposta' : 'Send reply'}
              </button>
            </div>
          ) : (
            <div className={s.loginPrompt}>{isIt ? 'Accedi per rispondere.' : 'Sign in to reply.'}</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>{t('forum_title')}</h1>
          <p className={s.sub}>{t('forum_sub')}</p>
        </div>
        <button className={s.newBtn} onClick={() => setNewThread(true)}>
          <Plus size={14}/> {t('forum_new')}
        </button>
      </div>

      {/* Search */}
      <div className={s.searchWrap}>
        <Search size={15} className={s.searchIcon}/>
        <input className={s.searchInput} value={search} onChange={e => setSearch(e.target.value)} placeholder={t('forum_search')}/>
      </div>

      {/* Categories */}
      <div className={s.catRow}>
        {cats.map((c, i) => (
          <button key={c} className={[s.catBtn, (i===0?'all':c)===catFilter ? s.catActive : ''].join(' ')}
            onClick={() => setCatFilter(i===0 ? 'all' : c)}>{c}</button>
        ))}
      </div>

      {/* Threads */}
      <div className={s.threads}>
        {filtered.map(th => (
          <div key={th.id} className={[s.threadRow, th.pinned ? s.pinned : ''].join(' ')} onClick={() => setOpenId(th.id)}>
            <div className={s.threadLeft}>
              {th.pinned && <div className={s.pinBadge}><Pin size={10}/></div>}
              <div className={s.avatar}>{th.avatar}</div>
            </div>
            <div className={s.threadMain}>
              <div className={s.threadCatTag}>{isIt?th.cat_it:th.cat_en}</div>
              <div className={s.threadTitleRow}>{isIt?th.title_it:th.title_en}</div>
              <div className={s.threadAuthorRow}>
                <span>{th.author}</span>
                <span>·</span>
                <Clock size={10}/>
                <span>{th.date}</span>
              </div>
            </div>
            <div className={s.threadRight}>
              <div className={s.threadStat}><MessageSquare size={12}/> {th.replies.length}</div>
              <div className={s.threadStat}><Eye size={12}/> {th.views}</div>
              <div className={s.threadStat}><ThumbsUp size={12}/> {th.likes}</div>
              <ChevronRight size={14} className={s.arrow}/>
            </div>
          </div>
        ))}
      </div>

      {/* New thread modal */}
      {newThread && (
        <div className={s.modalBg} onClick={() => setNewThread(false)}>
          <div className={s.modal} onClick={e => e.stopPropagation()}>
            <button className={s.modalClose} onClick={() => setNewThread(false)}><X size={16}/></button>
            <h3>{t('forum_new')}</h3>
            {!user ? (
              <p style={{color:'var(--tx3)',fontSize:14}}>{isIt?'Accedi per creare una discussione.':'Sign in to create a discussion.'}</p>
            ) : (
              <>
                <div className={s.field}>
                  <label className="field-label">{isIt?'Categoria':'Category'}</label>
                  <select className="field-input">
                    {cats.slice(1).map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className={s.field}>
                  <label className="field-label">{isIt?'Titolo':'Title'}</label>
                  <input className="field-input" placeholder={isIt?'Descrivi la tua domanda…':'Describe your question…'}/>
                </div>
                <div className={s.field}>
                  <label className="field-label">{isIt?'Messaggio':'Message'}</label>
                  <textarea className="field-input" rows={5} placeholder={isIt?'Scrivi qui…':'Write here…'}/>
                </div>
                <button className={s.submitBtn} onClick={() => { setNewThread(false); alert(isIt?'Discussione creata! (demo)':'Discussion created! (demo)') }}>
                  {isIt?'Pubblica':'Publish'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

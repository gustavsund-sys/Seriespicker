import {useEffect,useState} from 'react'
import {Logo} from './components/Logo'
import {Progress} from './components/Progress'
import {genres,moods,needs,providers} from './data/options'
import {createMoodProfile} from './lib/moodEngine'
import {scoreCandidates,type ScoredSeries} from './lib/recommendationEngine'
import {fetchSeries,posterUrl} from './services/tmdb'
import {userData} from './services/userData'
import type {Feedback,MoodId,NeedId,UserState} from './types'

type Step='providers'|'genres'|'mood'|'need'|'loading'|'result'
const toggle=(values:string[],value:string)=>values.includes(value)?values.filter(x=>x!==value):[...values,value]
function Credits(){return <footer className="credits"><details><summary>Om Seriespicker · datakällor</summary><p>Seriedata och bilder: <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer"><img width="80" src="https://www.themoviedb.org/assets/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg" alt="TMDB" /></a>.</p><p lang="en">This product uses the TMDB API but is not endorsed or certified by TMDB.</p><p>Streamingtillgänglighet: <a href="https://www.justwatch.com/se" target="_blank" rel="noreferrer">JustWatch</a> via TMDB. Demoläget använder illustrativ exempeldata.</p><p>Stämningsprofiler är Seriespickers egna uppskattningar.</p></details></footer>}

export default function App(){
 const [state,setState]=useState<UserState>(()=>userData.load())
 const [step,setStep]=useState<Step>(state.providers.length&&state.genres.length?'mood':'providers')
 const [mood,setMood]=useState<MoodId|undefined>(state.lastMood)
 const [queue,setQueue]=useState<ScoredSeries[]>([])
 const [index,setIndex]=useState(0)
 const [demo,setDemo]=useState(false)
 const [notice,setNotice]=useState('')
 const [toast,setToast]=useState('')
 const [posterFailed,setPosterFailed]=useState(false)
 useEffect(()=>{userData.save(state)},[state])
 useEffect(()=>{window.scrollTo(0,0)},[step,index])
 useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),2600);return ()=>clearTimeout(timer)},[toast])
 const update=(patch:Partial<UserState>)=>setState(s=>({...s,...patch}))
 async function run(need:NeedId){
  if(!mood)return
  const next={...state,lastMood:mood,lastNeed:need}
  userData.save(next);setState(next);setStep('loading');setToast('')
  const catalog=await fetchSeries(state.providers)
  const ranked=scoreCandidates(catalog.series,createMoodProfile(mood,need),state.genres,state.providers,state.history)
  setDemo(catalog.demo);setNotice(catalog.notice);setQueue(ranked);setIndex(0);setPosterFailed(false)
  if(ranked[0])setState(userData.record(ranked[0].series))
  setStep('result')
 }
 function feedback(value:Feedback){
  const current=queue[index]?.series;if(!current)return
  setState(userData.record(current,value))
  setToast(value==='liked'?'Sparat som bra tips':value==='watched'?'Markerad som sedd':'Sparat – serien prioriteras ned framöver')
 }
 function another(){
  const next=index+1;setIndex(next);setPosterFailed(false);setToast('')
  if(queue[next])setState(userData.record(queue[next].series))
 }
 const header=<header><Logo/><button className="icon-btn" onClick={()=>setStep('providers')} aria-label="Inställningar">⚙</button></header>
 const mode=notice&&<p className="mode" role="status">{notice}</p>
 if(step==='loading')return <main className="loading-screen" aria-busy="true"><Logo/><div className="orb"><span>✦</span></div><h1>Vi hittar kvällens serie</h1><p role="status">Matchar humör, smak och dina tjänster…</p></main>
 if(step==='result'){
  const pick=queue[index]
  if(!pick)return <main className="flow">{header}{mode}<section className="question empty-result"><h1>{queue.length?'Kvällens förslag är slut':'Ingen match den här gången'}</h1><p>Ändra dina tjänster eller prova en ny kvällsprofil.</p><button className="primary" onClick={()=>setStep('providers')}>Ändra mina val</button><button className="secondary" onClick={()=>setStep('mood')}>Beskriv en ny kväll</button></section><Credits/></main>
  const {series:s,reason}=pick
  const poster=posterFailed?undefined:posterUrl(s.posterPath)
  const past=state.history.find(h=>h.seriesId===s.id)
  return <main className="result-screen"><div className="result-backdrop"/>{header}{mode}<section className="result-content"><p className="result-kicker">IKVÄLL TYCKER VI ATT DU SKA SE</p>
   <div className="poster">{poster?<img src={poster} alt={`Affisch för ${s.title}`} onError={()=>setPosterFailed(true)}/>:<div className="poster-fallback"><span>{demo?'DEMO · SERIEFÖRSLAG':'KVÄLLENS SERIEFÖRSLAG'}</span><strong>{s.title}</strong></div>}<span className="match">Utvalt för din kväll</span></div>
   <div className="title-row"><div><h1>{s.title}</h1><p>{s.year} · <b>★ {s.rating.toFixed(1)}</b>{demo?' (demo)':' TMDB'} · {s.genres.slice(0,3).join(' · ')}</p></div><span className="provider-pill">{s.providers.find(p=>state.providers.includes(p))}</span></div>
   <p className="overview">{s.overview}</p><div className="why"><span>✦</span><div><b>Varför den passar ikväll</b><p>{reason}</p></div></div>
   {s.watchUrl&&!demo?<a className="primary play" href={s.watchUrl} target="_blank" rel="noreferrer">▶ DET KÖR VI <small>Visa streamingalternativ</small></a>:<button className="primary play" onClick={()=>setToast('Kvällens val är sparat i din historik')}>▶ DET KÖR VI</button>}
   <button className="secondary" onClick={another}>🎲 GE MIG EN ANNAN</button>
   <div className="feedback"><span>Var tipset rätt?</span><button aria-pressed={past?.feedback==='liked'} onClick={()=>feedback('liked')}>👍 Bra tips</button><button aria-pressed={past?.feedback==='disliked'} onClick={()=>feedback('disliked')}>👎 Inte för mig</button></div>
   <button className="start-over" onClick={()=>feedback('watched')}>{past?.watched?'✓ Markerad som sedd':'Redan sett den'}</button>
   <button className="start-over" onClick={()=>{setMood(undefined);setStep('mood')}}>← Beskriv en ny kväll</button><Credits/></section>{toast&&<div className="toast" role="status">✓ {toast}</div>}</main>
 }
 const navStep=step==='providers'?1:step==='genres'?2:step==='mood'?3:4
 return <main className="flow">{header}{mode}<Progress step={navStep}/>
  {step==='providers'&&<section className="question"><p className="eyebrow">LÅT OSS BÖRJA</p><h1>Vilka streamingtjänster har du?</h1><p className="lead">Välj alla du har tillgång till. Du kan ändra senare.</p><div className="provider-grid">{providers.map(p=><button key={p.id} aria-pressed={state.providers.includes(p.id)} className={state.providers.includes(p.id)?'selected':''} onClick={()=>update({providers:toggle(state.providers,p.id)})}><span style={{background:p.color,color:p.dark?'#09090b':'white'}}>{p.mark}</span><b>{p.id}</b><i aria-hidden="true">✓</i></button>)}</div><button disabled={!state.providers.length} className="primary sticky" onClick={()=>setStep('genres')}>Fortsätt <span>→</span></button>
   {state.history.length>0&&<details className="history"><summary>Dina senaste tips ({state.history.length})</summary><ul>{state.history.slice(0,20).map(h=><li key={h.seriesId}>{h.title} {h.watched?'· Sedd':h.feedback==='liked'?'· Bra tips':h.feedback==='disliked'?'· Inte för mig':''}</li>)}</ul></details>}
  </section>}
  {step==='genres'&&<section className="question"><button className="back" onClick={()=>setStep('providers')}>← Tillbaka</button><p className="eyebrow">DIN SMAK</p><h1>Vad brukar du gilla?</h1><p className="lead">Välj några favoriter – vi vågar ändå överraska dig.</p><div className="chips">{genres.map(g=><button key={g} aria-pressed={state.genres.includes(g)} className={state.genres.includes(g)?'selected':''} onClick={()=>update({genres:toggle(state.genres,g)})}>{g}<i aria-hidden="true">✓</i></button>)}</div><button disabled={!state.genres.length} className="primary sticky" onClick={()=>setStep('mood')}>Fortsätt <span>→</span></button></section>}
  {step==='mood'&&<section className="question"><button className="back" onClick={()=>setStep('genres')}>← Tillbaka</button><p className="eyebrow">JUST NU</p><h1>Hur känner du dig?</h1><p className="lead">Gå på magkänslan. Det finns inget fel svar.</p><div className="mood-grid">{moods.map(m=><button key={m.id} aria-pressed={mood===m.id} className={mood===m.id?'selected':''} onClick={()=>{setMood(m.id);setStep('need')}}><span>{m.emoji}</span><b>{m.label}</b></button>)}</div><button className="describe" disabled><span>✨</span><b>Beskriv kvällen själv</b><small>Kommer snart</small></button></section>}
  {step==='need'&&<section className="question"><button className="back" onClick={()=>setStep('mood')}>← Tillbaka</button><p className="eyebrow">SISTA FRÅGAN</p><h1>Vad behöver du ikväll?</h1><p className="lead">Vi kombinerar det med ditt humör och din smak.</p><div className="need-list">{needs.map(n=><button key={n.id} onClick={()=>run(n.id)}><span>{n.emoji}</span><b>{n.label}</b><i>→</i></button>)}</div></section>}
  <Credits/>
 </main>
}

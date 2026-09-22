import { mockSeries } from '../data/mockSeries'
import { tmdbGenre } from '../lib/recommendationEngine'
import { normalizeExternalProfile } from '../lib/moodEngine'
import type { MoodProfile, Series } from '../types'
const API='/api/tmdb'
export interface Catalog {series:Series[];demo:boolean;notice:string}
interface Provider {provider_id:number;provider_name:string}
interface Tv {id:number;name:string;first_air_date?:string;vote_average:number;popularity:number;genre_ids:number[];overview:string;poster_path?:string}
const aliases:Record<string,string[]>={Netflix:['netflix'],Max:['max','hbo max'], 'Disney+':['disney plus','disney+'],'Prime Video':['amazon prime video','prime video'],'Apple TV+':['apple tv plus','apple tv+','apple tv'],'SkyShowtime':['skyshowtime'],'SVT Play':['svt','svt play'],'TV4 Play':['tv4 play']}
function providerName(name:string){return Object.entries(aliases).find(([,names])=>names.includes(name.toLowerCase()))?.[0]}
async function get<T>(path:string,params:Record<string,string>={}):Promise<T>{
 const query=new URLSearchParams({...params,language:'sv-SE'})
 const res=await fetch(`${API}${path}?${query}`,{signal:AbortSignal.timeout(12000)})
 if(!res.ok)throw new Error('TMDB svarade inte')
 return res.json()
}
// Kurerade profiler används när de finns. Övriga är grova genreheuristiker,
// inte stämningsdata från TMDB och inte AI-analyser.
export function estimateProfile(id:number,genres:string[]):MoodProfile {
 const curated=mockSeries.find(s=>s.id===id)
 if(curated)return curated.profile
 const p:Partial<MoodProfile>={tempo:5,complexity:5,humor:3,darkness:4,tension:4,emotion:5,escapism:4,hook:6}
 if(genres.includes('Komedi'))Object.assign(p,{humor:8,darkness:2,tension:2,complexity:3})
 if(genres.includes('Crime'))Object.assign(p,{darkness:7,tension:8,hook:8})
 if(genres.includes('Mystik'))Object.assign(p,{complexity:8,tension:7,hook:8})
 if(genres.includes('Sci-fi'))Object.assign(p,{escapism:9,complexity:7})
 if(genres.includes('Action'))Object.assign(p,{tempo:8,tension:7,hook:8})
 if(genres.includes('Drama'))p.emotion=8
 if(genres.includes('Dokumentärt'))Object.assign(p,{complexity:7,tempo:3})
 return normalizeExternalProfile(p)
}
export async function fetchSeries(selected:string[]):Promise<Catalog>{
 const demo=(notice:string):Catalog=>({series:mockSeries,demo:true,notice})
 try {
  const available=await get<{results:Provider[]}>('/watch/providers/tv',{watch_region:'SE'})
  const ids=available.results.filter(p=>selected.includes(providerName(p.provider_name)||'')).map(p=>p.provider_id)
  if(!ids.length)return {series:[],demo:false,notice:'Inga matchande svenska leverantörer hittades.'}
  const pages=await Promise.all(['popularity.desc','vote_average.desc'].map(sort=>get<{results:Tv[]}>('/discover/tv',{watch_region:'SE',with_watch_providers:ids.join('|'),with_watch_monetization_types:'flatrate|free|ads',sort_by:sort,'vote_count.gte':'20',include_adult:'false'})))
  const unique=[...new Map(pages.flatMap(p=>p.results).map(p=>[p.id,p])).values()]
  const results=await Promise.allSettled(unique.map(async item=>{
   const watch=await get<{results:{SE?:{link?:string;flatrate?:Provider[];free?:Provider[];ads?:Provider[]}}}>(`/tv/${item.id}/watch/providers`)
   const se=watch.results.SE
   const providers=[...new Set([...(se?.flatrate||[]),...(se?.free||[]),...(se?.ads||[])].map(p=>providerName(p.provider_name)).filter((p):p is string=>Boolean(p)&&selected.includes(p!)))]
   const genres=item.genre_ids.map(tmdbGenre).filter(Boolean)
   return {id:item.id,title:item.name,year:item.first_air_date?.slice(0,4)||'—',rating:item.vote_average,popularity:item.popularity,genres,providers,overview:item.overview||'Beskrivning saknas på svenska.',posterPath:item.poster_path,watchUrl:se?.link,profile:estimateProfile(item.id,genres)} satisfies Series
  }))
  if(results.length&&results.every(r=>r.status==='rejected'))throw new Error('Tillgängligheten kunde inte kontrolleras')
  return {series:results.flatMap(r=>r.status==='fulfilled'&&r.value.providers.length?[r.value]:[]),demo:false,notice:results.some(r=>r.status==='rejected')?'Vissa serier kunde inte kontrolleras. Visar verifierade förslag.':''}
 } catch {return demo('TMDB kunde inte nås. Visar demo med exempeldata, inte aktuell tillgänglighet.')}
}
export const posterUrl=(path?:string)=>path?`https://image.tmdb.org/t/p/w780${path}`:undefined

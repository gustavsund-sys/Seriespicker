import type { HistoryEntry, MoodProfile, Series } from '../types'
import { dimensions } from './moodEngine'
const genreMap:Record<number,string>={10759:'Action',16:'Animation',35:'Komedi',80:'Crime',99:'Dokumentärt',18:'Drama',10765:'Sci-fi',9648:'Mystik',10768:'Historiskt',10751:'Familj'}
export const tmdbGenre = (id:number)=>genreMap[id]
export function classifyGenres(ids:number[],overview:string,profile:MoodProfile):string[]{
 const result=ids.map(tmdbGenre).filter((g):g is string=>Boolean(g))
 const text=overview.toLowerCase()
 if(ids.includes(10765))result.push('Fantasy')
 if((result.includes('Crime')||result.includes('Mystik')||result.includes('Action'))&&profile.tension>=7)result.push('Thriller')
 if((result.includes('Mystik')||result.includes('Sci-fi'))&&/skräck|spök|hemsök|vampyr|zombie|demon|monster|horror|haunt|ghost/.test(text))result.push('Skräck')
 if(result.includes('Familj')||result.includes('Komedi')&&/vänskap|familj|kärlek|friendship|family|love/.test(text)&&profile.darkness<=3)result.push('Feelgood')
 return [...new Set(result.filter(g=>g!=='Familj'&&g!=='Animation'))]
}
export interface ScoredSeries {series:Series;score:number;reason:string}
export function scoreCandidates(series:Series[],profile:MoodProfile,genres:string[],providers:string[],history:HistoryEntry[],seed=new Date().getDate()):ScoredSeries[]{
 const liked=history.filter(h=>h.feedback==='liked'&&h.profile)
 const reasons=history.filter(h=>h.feedback==='disliked'&&h.feedbackReason)
 return series.filter(s=>s.providers.some(p=>providers.includes(p))&&!history.some(h=>h.seriesId===s.id&&h.watched)).map(series=>{
  const common=series.genres.filter(g=>genres.includes(g)); const genreScore=genres.length?30*common.length/Math.max(2,genres.length):12
  const distance=dimensions.reduce((sum,k)=>sum+Math.abs(profile[k]-series.profile[k]),0)/8
  const moodScore=30*(1-distance/10); const quality=Math.min(10,series.rating); const popularity=Math.min(5,series.popularity/20)
  const past=history.find(h=>h.seriesId===series.id); const penalty=past?.feedback==='disliked'?-100:past?.feedback==='liked'?-12:past?-18:0
  const affinities=liked.slice(0,30).map(h=>{
   const distance=dimensions.reduce((sum,k)=>sum+Math.abs(series.profile[k]-h.profile![k]),0)/8
   const overlap=h.genres?.filter(g=>series.genres.includes(g)).length||0
   return Math.max(0,10-distance)*.8+Math.min(2,overlap)*2
  })
  const preferenceBonus=affinities.length?Math.max(...affinities):0
  const reasonPenalty=Math.min(18,reasons.slice(0,30).reduce((sum,h)=>sum+(h.feedbackReason==='too_dark'?Math.max(0,series.profile.darkness-5)*.8:h.feedbackReason==='too_slow'?Math.max(0,6-series.profile.tempo)*.8:h.genres?.some(g=>series.genres.includes(g))?2:0),0))
  const variation=((series.id*17+seed)%11-5)*.35
  const preference=profile.hook>=8?'något som fångar dig direkt':profile.humor>=8?'något att skratta åt':profile.escapism>=8?'en annan värld att försvinna in i':profile.complexity>=7?'något att klura på':'rätt känsla för kvällen'
  const reason=`Du ville ha ${preference}. ${common.length?`Du brukar dessutom gilla ${common.slice(0,2).join(' och ').toLowerCase()}.`:'Det här är ett förslag utanför dina vanliga genrer.'} ${series.profile.complexity<=4?'En lättillgänglig berättelse utan alltför många trådar.':series.profile.escapism>=8?'En värld att sjunka in i.':'Ett av våra närmaste förslag för kvällens profil.'}`
  return {series,score:genreScore+moodScore+quality+popularity+penalty+variation+preferenceBonus-reasonPenalty,reason}
 }).sort((a,b)=>b.score-a.score)
}

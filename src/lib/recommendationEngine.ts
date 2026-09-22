import type { HistoryEntry, MoodProfile, Series } from '../types'
import { dimensions } from './moodEngine'
const genreMap:Record<number,string>={10759:'Action',16:'Animation',35:'Komedi',80:'Crime',99:'Dokumentärt',18:'Drama',10765:'Sci-fi',9648:'Mystik',10768:'Historiskt'}
export const tmdbGenre = (id:number)=>genreMap[id]
export interface ScoredSeries {series:Series;score:number;reason:string}
export function scoreCandidates(series:Series[],profile:MoodProfile,genres:string[],providers:string[],history:HistoryEntry[],seed=new Date().getDate()):ScoredSeries[]{
 return series.filter(s=>s.providers.some(p=>providers.includes(p))).map(series=>{
  const common=series.genres.filter(g=>genres.includes(g)); const genreScore=genres.length?30*common.length/Math.max(2,genres.length):12
  const distance=dimensions.reduce((sum,k)=>sum+Math.abs(profile[k]-series.profile[k]),0)/8
  const moodScore=30*(1-distance/10); const quality=Math.min(10,series.rating); const popularity=Math.min(5,series.popularity/20)
  const past=history.find(h=>h.seriesId===series.id); const penalty=past?.feedback==='disliked'?-100:past?.watched||past?.feedback==='watched'?-70:past?-18:0
  const variation=((series.id*17+seed)%11-5)*.35
  const preference=profile.hook>=8?'något som fångar dig direkt':profile.humor>=8?'något att skratta åt':profile.escapism>=8?'en annan värld att försvinna in i':profile.complexity>=7?'något att klura på':'rätt känsla för kvällen'
  const reason=`Du ville ha ${preference}. ${common.length?`Du brukar dessutom gilla ${common.slice(0,2).join(' och ').toLowerCase()}.`:'Det här är ett förslag utanför dina vanliga genrer.'} ${series.profile.complexity<=4?'En lättillgänglig berättelse utan alltför många trådar.':series.profile.escapism>=8?'En värld att sjunka in i.':'Ett av våra närmaste förslag för kvällens profil.'}`
  return {series,score:genreScore+moodScore+quality+popularity+penalty+variation,reason}
 }).sort((a,b)=>b.score-a.score)
}

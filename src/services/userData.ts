import type { Feedback, HistoryEntry, UserState } from '../types'
import { genres, moods, needs, providers } from '../data/options'
const KEY='seriespicker:user:v1'
const empty=():UserState=>({providers:[],genres:[],history:[]})
export interface UserDataStore { load():UserState; save(value:UserState):void; record(series:{id:number;title:string},feedback?:Feedback):UserState }
let memory=empty()
const strings=(value:unknown,allowed:string[])=>Array.isArray(value)?value.filter((x):x is string=>typeof x==='string'&&allowed.includes(x)):[]
export const userData:UserDataStore={
 load(){
  try {
   const raw=localStorage.getItem(KEY)
   if(!raw)return memory
   const value=JSON.parse(raw)
   if(!value||typeof value!=='object')return empty()
   return {
    providers:strings(value.providers,providers.map(p=>p.id)),genres:strings(value.genres,genres),
    lastMood:moods.find(m=>m.id===value.lastMood)?.id,lastNeed:needs.find(n=>n.id===value.lastNeed)?.id,
    history:Array.isArray(value.history)?value.history.filter((h:HistoryEntry)=>h&&Number.isFinite(h.seriesId)&&typeof h.title==='string'&&typeof h.at==='string').slice(0,500):[],
   }
  }catch{return memory}
 },
 save(value){memory=value;try{localStorage.setItem(KEY,JSON.stringify(value))}catch{/* Använd minnet om webbläsaren blockerar lagring. */}},
 record(series,feedback){
  const state=this.load();const previous=state.history.find(x=>x.seriesId===series.id)
  const entry:HistoryEntry={...previous,seriesId:series.id,title:series.title,at:new Date().toISOString(),feedback:feedback==='watched'?previous?.feedback:feedback??previous?.feedback,watched:previous?.watched||feedback==='watched'}
  const next={...state,history:[entry,...state.history.filter(x=>x.seriesId!==series.id)].slice(0,500)}
  this.save(next);return next
 }
}

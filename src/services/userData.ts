import type { Feedback, FeedbackReason, HistoryEntry, Series, UserState } from '../types'
import { genres, moods, needs, providers } from '../data/options'
import { normalizeExternalProfile } from '../lib/moodEngine'
const KEY='seriespicker:user:v1'
const empty=():UserState=>({providers:[],genres:[],history:[]})
export interface UserDataStore { load():UserState; save(value:UserState):void; record(series:Series,feedback?:Feedback,reason?:FeedbackReason):UserState; unwatch(id:number):UserState }
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
    history:Array.isArray(value.history)?value.history.filter((h:HistoryEntry)=>h&&Number.isFinite(h.seriesId)&&typeof h.title==='string'&&typeof h.at==='string').slice(0,500).map((h:HistoryEntry)=>({
     seriesId:h.seriesId,title:h.title,at:h.at,
     feedback:['liked','disliked'].includes(h.feedback||'')?h.feedback:undefined,
     feedbackReason:['too_dark','too_slow','wrong_genre'].includes(h.feedbackReason||'')?h.feedbackReason:undefined,
     watched:h.watched===true||h.feedback==='watched',
     genres:strings(h.genres,genres),
     profile:h.profile&&typeof h.profile==='object'?normalizeExternalProfile(h.profile):undefined,
    })):[],
   }
  }catch{return memory}
 },
 save(value){memory=value;try{localStorage.setItem(KEY,JSON.stringify(value))}catch{/* Använd minnet om webbläsaren blockerar lagring. */}},
 record(series,feedback,reason){
  const state=this.load();const previous=state.history.find(x=>x.seriesId===series.id)
  const entry:HistoryEntry={...previous,seriesId:series.id,title:series.title,at:new Date().toISOString(),genres:series.genres,profile:series.profile,feedback:feedback==='watched'?previous?.feedback:feedback??previous?.feedback,feedbackReason:reason??(feedback==='liked'?undefined:previous?.feedbackReason),watched:previous?.watched||feedback==='watched'}
  const next={...state,history:[entry,...state.history.filter(x=>x.seriesId!==series.id)].slice(0,500)}
  this.save(next);return next
 },
 unwatch(id){const state=this.load();const next={...state,history:state.history.map(h=>h.seriesId===id?{...h,watched:false}:h)};this.save(next);return next}
}

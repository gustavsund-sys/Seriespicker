import {expect,it} from 'vitest'
import {classifyGenres,scoreCandidates} from './recommendationEngine'
import type {HistoryEntry,MoodProfile,Series} from '../types'

const profile:MoodProfile={tempo:5,complexity:5,humor:5,darkness:3,tension:7,emotion:5,escapism:5,hook:6}
const series=(id:number,genres:string[],changes:Partial<MoodProfile>={}):Series=>({id,title:`Serie ${id}`,year:'2024',rating:8,popularity:40,genres,providers:['Netflix'],overview:'Beskrivning',profile:{...profile,...changes}})

it('ger alla valbara härledda genrer betydelse när datan stöder det',()=>{
 expect(classifyGenres([10765],'En berättelse om en annan värld',profile)).toContain('Fantasy')
 expect(classifyGenres([80],'En farlig jakt',profile)).toContain('Thriller')
 expect(classifyGenres([9648],'Ett hemsökt hus',profile)).toContain('Skräck')
 expect(classifyGenres([35],'Vänskap och humor',profile)).toContain('Feelgood')
})

it('visar inte sedda serier och använder tidigare gillade profiler',()=>{
 const liked=series(1,['Komedi'],{humor:9})
 const other=series(2,['Crime'],{darkness:8})
 const history:HistoryEntry[]=[{seriesId:99,title:'Favorit',at:'2024-01-01',feedback:'liked',genres:['Komedi'],profile:liked.profile},{seriesId:3,title:'Sedd',at:'2024-01-01',watched:true}]
 const ranked=scoreCandidates([other,liked,series(3,['Komedi'])],profile,[],['Netflix'],history,1)
 expect(ranked.map(x=>x.series.id)).not.toContain(3)
 expect(ranked[0].series.id).toBe(1)
})

it('prioriterar ned sådant som användaren beskrivit som för mörkt',()=>{
 const dark=series(10,['Drama'],{darkness:9})
 const light=series(11,['Drama'],{darkness:2})
 const history:HistoryEntry[]=[{seriesId:99,title:'Ogillad',at:'2024-01-01',feedback:'disliked',feedbackReason:'too_dark'}]
 const ranked=scoreCandidates([dark,light],{...profile,darkness:5},['Drama'],['Netflix'],history,1)
 expect(ranked[0].series.id).toBe(11)
})

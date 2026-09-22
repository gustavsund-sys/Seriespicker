import {describe,expect,it} from 'vitest'
import {createMoodProfile,normalizeExternalProfile} from './moodEngine'
import {moods,needs,providers} from '../data/options'
import {mockSeries} from '../data/mockSeries'
import {scoreCandidates} from './recommendationEngine'
describe('Mood Engine',()=>{
 it('gör trött + hook lätt och direkt',()=>expect(createMoodProfile('tired','hook')).toEqual({tempo:7,complexity:2,humor:5,darkness:4,tension:6,emotion:3,escapism:5,hook:10}))
 it('normaliserar även ogiltiga externa värden',()=>{const p=normalizeExternalProfile({tempo:99,humor:-3,tension:NaN});expect(p.tempo).toBe(10);expect(p.humor).toBe(0);expect(Number.isFinite(p.tension)).toBe(true)})
 it('håller alla kombinationer inom 0–10',()=>{for(const m of moods)for(const n of needs)for(const v of Object.values(createMoodProfile(m.id,n.id))){expect(v).toBeGreaterThanOrEqual(0);expect(v).toBeLessThanOrEqual(10)}})
})
describe('Rekommendationer',()=>{
 const p=createMoodProfile('tired','hook')
 it('filtrerar obligatoriskt på vald tjänst',()=>{const result=scoreCandidates(mockSeries,p,['Crime'],['Netflix'],[],1);expect(result.length).toBeGreaterThan(0);expect(result.every(s=>s.series.providers.includes('Netflix'))).toBe(true);expect(scoreCandidates(mockSeries,p,[],[],[])).toEqual([])})
 it('har minst två demoalternativ för varje tjänst',()=>{for(const provider of providers)expect(scoreCandidates(mockSeries,p,[],[provider.id],[]).length).toBeGreaterThanOrEqual(2)})
 it('nedprioriterar negativ feedback och sedd',()=>{const args:[typeof mockSeries,typeof p,string[],string[]]=[mockSeries,p,['Crime'],['Netflix']];const first=scoreCandidates(...args,[],1)[0];for(const feedback of ['disliked','watched'] as const){const result=scoreCandidates(...args,[{seriesId:first.series.id,title:first.series.title,at:'2026-09-22',feedback}],1);expect(result[0].series.id).not.toBe(first.series.id)}})
})

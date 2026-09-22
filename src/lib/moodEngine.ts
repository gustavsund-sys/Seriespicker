import type { Dimension, MoodId, MoodProfile, NeedId } from '../types'
const base: MoodProfile = {tempo:5,complexity:5,humor:4,darkness:4,tension:5,emotion:5,escapism:5,hook:6}
const moodAdjustments:Record<MoodId,Partial<MoodProfile>>={
 tired:{tempo:-2,complexity:-3,humor:1,tension:-1,emotion:-2}, happy:{tempo:1,humor:2,darkness:-2}, down:{humor:2,darkness:-3,emotion:2}, stressed:{tempo:-2,complexity:-2,tension:-3,darkness:-2}, bored:{tempo:2,hook:3}, hyped:{tempo:3,tension:2,hook:2}, cozy:{tempo:-2,humor:1,darkness:-3,emotion:2}, focused:{complexity:3,emotion:1}, thrill:{tempo:2,tension:4,darkness:1}, dark:{darkness:4,tension:2}, surprise:{complexity:1,escapism:2,hook:2}}
const needAdjustments:Record<NeedId,Partial<MoodProfile>>={
 laugh:{humor:5,darkness:-2,tension:-2}, relax:{tempo:-3,complexity:-2,tension:-3}, hook:{tempo:4,tension:2,hook:5}, puzzle:{complexity:4,tension:1,hook:1}, feelgood:{humor:2,darkness:-4,emotion:3}, nervous:{darkness:2,tension:5,hook:2}, escape:{escapism:5,emotion:1}, surprise:{complexity:2,escapism:2,hook:3}}
export const dimensions = Object.keys(base) as Dimension[]
export function createMoodProfile(mood:MoodId,need:NeedId):MoodProfile {
 return normalizeExternalProfile(Object.fromEntries(dimensions.map(key=>[key,base[key]+(moodAdjustments[mood][key]??0)+(needAdjustments[need][key]??0)])))
}
// Framtida AI-profiler kan skickas direkt till rekommendationsmotorn efter normalisering.
export function normalizeExternalProfile(profile:Partial<MoodProfile>):MoodProfile {
 return Object.fromEntries(dimensions.map(k=>[k,typeof profile[k]==='number'&&Number.isFinite(profile[k])?Math.max(0,Math.min(10,profile[k]!)):base[k]])) as MoodProfile
}

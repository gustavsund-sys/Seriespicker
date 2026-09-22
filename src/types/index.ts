export type Dimension = 'tempo'|'complexity'|'humor'|'darkness'|'tension'|'emotion'|'escapism'|'hook'
export type MoodProfile = Record<Dimension, number>
export type MoodId = 'tired'|'happy'|'down'|'stressed'|'bored'|'hyped'|'cozy'|'focused'|'thrill'|'dark'|'surprise'
export type NeedId = 'laugh'|'relax'|'hook'|'puzzle'|'feelgood'|'nervous'|'escape'|'surprise'
export type Feedback = 'liked'|'disliked'|'watched'
export interface Series { id:number; title:string; year:string; rating:number; popularity:number; genres:string[]; providers:string[]; overview:string; posterPath?:string; watchUrl?:string; profile:MoodProfile }
export interface HistoryEntry { seriesId:number; title:string; at:string; feedback?:Feedback; watched?:boolean }
export interface UserState { providers:string[]; genres:string[]; lastMood?:MoodId; lastNeed?:NeedId; history:HistoryEntry[] }

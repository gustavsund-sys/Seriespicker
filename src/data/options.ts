import type { MoodId, NeedId } from '../types'
export const providers = [
  {id:'Netflix',mark:'N',color:'#e50914'},{id:'Max',mark:'max',color:'#6727f4'},{id:'Disney+',mark:'D+',color:'#123ac2'},{id:'Prime Video',mark:'prime',color:'#1597df'},
  {id:'Apple TV+',mark:'tv+',color:'#f4f4f4',dark:true},{id:'SkyShowtime',mark:'sky',color:'#ff4d8d'},{id:'SVT Play',mark:'SVT',color:'#e8ff3d',dark:true},{id:'TV4 Play',mark:'4',color:'#ff143d'}]
export const genres = ['Crime','Thriller','Komedi','Drama','Sci-fi','Fantasy','Action','Mystik','Historiskt','Dokumentärt','Skräck','Feelgood']
export const moods:{id:MoodId;emoji:string;label:string}[] = [
  {id:'tired',emoji:'😴',label:'Trött'},{id:'happy',emoji:'😊',label:'På bra humör'},{id:'down',emoji:'😔',label:'Lite nere'},{id:'stressed',emoji:'😤',label:'Stressad'},{id:'bored',emoji:'😐',label:'Uttråkad'},{id:'hyped',emoji:'🤩',label:'Taggad'},{id:'cozy',emoji:'🥰',label:'Mysig'},{id:'focused',emoji:'🧠',label:'Skärpt'},{id:'thrill',emoji:'😬',label:'Vill känna spänning'},{id:'dark',emoji:'🌑',label:'Vill ha något mörkt'},{id:'surprise',emoji:'🎲',label:'Överraska mig'}]
export const needs:{id:NeedId;emoji:string;label:string}[] = [
  {id:'laugh',emoji:'😂',label:'Skratta'},{id:'relax',emoji:'🛋️',label:'Koppla av'},{id:'hook',emoji:'🔥',label:'Bli fast direkt'},{id:'puzzle',emoji:'🧩',label:'Något att klura på'},{id:'feelgood',emoji:'❤️',label:'Må bra'},{id:'nervous',emoji:'😱',label:'Bli nervös'},{id:'escape',emoji:'🚀',label:'Försvinna in i en annan värld'},{id:'surprise',emoji:'🤯',label:'Bli överraskad'}]

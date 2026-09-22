import {afterEach,expect,it,vi} from 'vitest'
import type {Series} from '../types'

afterEach(()=>{vi.unstubAllGlobals();vi.resetModules()})

it('sparar feedback för lärande och kan ångra sedd-markering',async()=>{
 const values=new Map<string,string>()
 vi.stubGlobal('localStorage',{getItem:(key:string)=>values.get(key)||null,setItem:(key:string,value:string)=>values.set(key,value)})
 const {userData}=await import('./userData')
 const series:Series={id:7,title:'Test',year:'2024',rating:8,popularity:10,genres:['Komedi'],providers:['Netflix'],overview:'Test',profile:{tempo:5,complexity:3,humor:8,darkness:2,tension:2,emotion:5,escapism:5,hook:7}}
 userData.record(series,'liked')
 expect(userData.load().history[0]).toMatchObject({feedback:'liked',genres:['Komedi'],profile:series.profile})
 userData.record(series,'watched')
 expect(userData.load().history[0].watched).toBe(true)
 userData.unwatch(7)
 expect(userData.load().history[0]).toMatchObject({watched:false,feedback:'liked'})
})

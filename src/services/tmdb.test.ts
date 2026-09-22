import {afterEach,expect,it,vi} from 'vitest'
afterEach(()=>{vi.unstubAllGlobals();vi.resetModules()})
it('visar demo när servern saknar API-nyckel',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false}));const {fetchSeries}=await import('./tmdb');const result=await fetchSeries(['Netflix']);expect(result.demo).toBe(true);expect(result.notice).toContain('kunde inte nås')})
it('kontrollerar svenska leverantörer och ignorerar köp',async()=>{
 const fetchMock=vi.fn(async(input:string)=>{
  const url=new URL(input,'http://localhost')
  expect(url.pathname.startsWith('/api/tmdb/')).toBe(true)
  expect(url.searchParams.has('api_key')).toBe(false)
  if(url.pathname.endsWith('/watch/providers/tv'))return {ok:true,json:async()=>({results:[{provider_id:8,provider_name:'Netflix'}]})}
  if(url.pathname.endsWith('/discover/tv')){expect(url.searchParams.get('watch_region')).toBe('SE');expect(url.searchParams.get('with_watch_providers')).toBe('8');return {ok:true,json:async()=>({results:[{id:42,name:'Test',vote_average:8,popularity:10,genre_ids:[80],overview:'Test'}]})}}
  return {ok:true,json:async()=>({results:{SE:{buy:[{provider_id:8,provider_name:'Netflix'}]},US:{flatrate:[{provider_id:8,provider_name:'Netflix'}]}}})}
 })
 vi.stubGlobal('fetch',fetchMock)
 const {fetchSeries}=await import('./tmdb');const result=await fetchSeries(['Netflix']);expect(result.demo).toBe(false);expect(result.series).toHaveLength(0)
})
it('märker API-fel som demo',async()=>{vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('offline')));const {fetchSeries}=await import('./tmdb');expect((await fetchSeries(['Netflix'])).notice).toContain('kunde inte nås')})
it('hämtar riktade kandidater och återanvänder katalogen under kvällen',async()=>{
 const fetchMock=vi.fn(async(input:string)=>{
  const url=new URL(input,'http://localhost')
  if(url.pathname.endsWith('/watch/providers/tv'))return {ok:true,json:async()=>({results:[{provider_id:8,provider_name:'Netflix'}]})}
  if(url.pathname.endsWith('/discover/tv'))return {ok:true,json:async()=>({results:[{id:42,name:'Test',vote_average:8,popularity:10,genre_ids:[35],overview:'Vänskap och humor'}]})}
  return {ok:true,json:async()=>({results:{SE:{link:'https://example.com',flatrate:[{provider_id:8,provider_name:'Netflix'}]}}})}
 })
 vi.stubGlobal('fetch',fetchMock)
 const {fetchSeries}=await import('./tmdb')
 expect((await fetchSeries(['Netflix'],['Feelgood'])).series[0].genres).toContain('Feelgood')
 expect(fetchMock.mock.calls.filter(([input])=>new URL(input,'http://localhost').searchParams.has('with_genres'))).toHaveLength(1)
 await fetchSeries(['Netflix'],['Feelgood'])
 expect(fetchMock).toHaveBeenCalledTimes(5)
})

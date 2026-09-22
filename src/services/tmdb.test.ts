import {afterEach,expect,it,vi} from 'vitest'
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();vi.resetModules()})
it('fungerar utan API-nyckel',async()=>{vi.stubEnv('VITE_TMDB_API_KEY','');const {fetchSeries}=await import('./tmdb');const result=await fetchSeries(['Netflix']);expect(result.demo).toBe(true);expect(result.notice).toContain('Demoläge')})
it('kontrollerar svenska leverantörer och ignorerar köp',async()=>{
 vi.stubEnv('VITE_TMDB_API_KEY','test-key')
 const fetchMock=vi.fn(async(input:string)=>{
  const url=new URL(input)
  if(url.pathname.endsWith('/watch/providers/tv'))return {ok:true,json:async()=>({results:[{provider_id:8,provider_name:'Netflix'}]})}
  if(url.pathname.endsWith('/discover/tv')){expect(url.searchParams.get('watch_region')).toBe('SE');expect(url.searchParams.get('with_watch_providers')).toBe('8');return {ok:true,json:async()=>({results:[{id:42,name:'Test',vote_average:8,popularity:10,genre_ids:[80],overview:'Test'}]})}}
  return {ok:true,json:async()=>({results:{SE:{buy:[{provider_id:8,provider_name:'Netflix'}]},US:{flatrate:[{provider_id:8,provider_name:'Netflix'}]}}})}
 })
 vi.stubGlobal('fetch',fetchMock)
 const {fetchSeries}=await import('./tmdb');const result=await fetchSeries(['Netflix']);expect(result.demo).toBe(false);expect(result.series).toHaveLength(0)
})
it('märker API-fel som demo',async()=>{vi.stubEnv('VITE_TMDB_API_KEY','test-key');vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('offline')));const {fetchSeries}=await import('./tmdb');expect((await fetchSeries(['Netflix'])).notice).toContain('kunde inte nås')})

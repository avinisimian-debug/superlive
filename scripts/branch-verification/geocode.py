"""Nominatim geocoding with a persistent cache (1 request/second, per the usage policy)."""
import json, os, sys, time, urllib.parse, urllib.request
from common import W
CACHE=W+"nominatim_cache.json"
cache=json.load(open(CACHE)) if os.path.exists(CACHE) else {}
UA="ZeremBranchVerifier/1.0 (store-location data check; https://github.com/avinisimian-debug/superlive)"
_last=[0.0]
def nominatim(params):
    params={**params,"format":"jsonv2","countrycodes":"il,ps","addressdetails":"1","accept-language":"he","limit":"5"}
    key=urllib.parse.urlencode(sorted(params.items()))
    if key in cache: return cache[key]
    for attempt in range(4):
        wait=1.1-(time.time()-_last[0])
        if wait>0: time.sleep(wait)
        _last[0]=time.time()
        try:
            req=urllib.request.Request("https://nominatim.openstreetmap.org/search?"+key,headers={"User-Agent":UA})
            res=json.load(urllib.request.urlopen(req,timeout=30)); break
        except Exception as e:
            print("retry",e,file=sys.stderr); time.sleep(5*(attempt+1))
    else: return None
    cache[key]=res
    if len(cache)%20==0: save()
    return res
def save():
    tmp=CACHE+".tmp"; json.dump(cache,open(tmp,"w"),ensure_ascii=False); os.replace(tmp,CACHE)

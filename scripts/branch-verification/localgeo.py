"""Offline geocoder over the OSM extract: house numbers first, then street geometry."""
import json, re, collections
from loc import settlement, canon, norm
from common import W, km
def nstreet(s):
    s=norm(s or "")
    s=re.sub(r"^(רחוב|רח|שדרות|שד|דרך|כיכר|ככר|סמטת|סמ)\s+","",s)
    s=s.replace("ו"," ").replace("י"," ")  # tolerate plene/defective spelling
    return re.sub(r"\s+","",s)
D=json.load(open(W+"addrindex.json"))
_cache_path=W+"addr_settle.json"
try: SET=json.load(open(_cache_path))
except Exception:
    SET=[settlement(a[0],a[1]) for a in D["addr"]]; json.dump(SET,open(_cache_path,"w"),ensure_ascii=False)
H=collections.defaultdict(list)   # (settlement, street) -> [(num, lat, lon)]
for a,s in zip(D["addr"],SET):
    H[(s,nstreet(a[2]))].append((a[3],a[0],a[1]))
    if a[4] and canon(a[4])!=s: H[(canon(a[4]),nstreet(a[2]))].append((a[3],a[0],a[1]))
S=collections.defaultdict(list)
_scache=W+"street_settle.json"
try: SS=json.load(open(_scache))
except Exception:
    SS=[settlement(*st[1][len(st[1])//2]) for st in D["streets"]]; json.dump(SS,open(_scache,"w"),ensure_ascii=False)
for st,s in zip(D["streets"],SS): S[(s,nstreet(st[0]))].extend(st[1])
BYCITY=collections.defaultdict(set)
for (c,k) in list(H.keys())+list(S.keys()): BYCITY[c].add(k)
def keys(city,street):
    q=nstreet(street)
    if len(q)<2: return []
    ks=BYCITY.get(city,set())
    if q in ks: return [q]
    return [k for k in ks if len(k)>=3 and len(q)>=3 and (k.startswith(q) or k.endswith(q) or q.endswith(k) or q.startswith(k))]
def house(city,street,num):
    """Exact house-number hit -> (lat,lon) or None."""
    if not (city and street and num): return None
    hits=[(la,lo) for k in keys(city,street) for n,la,lo in H.get((city,k),[]) if re.match(r"^\s*"+re.escape(num)+r"\s*([א-ת]|$)",n)]
    if not hits: return None
    la=sum(h[0] for h in hits)/len(hits); lo=sum(h[1] for h in hits)/len(hits)
    if max(km(la,lo,*h) for h in hits)>0.3: return None  # same number on two far segments: ambiguous
    return (la,lo)
def street_pts(city,street):
    return [p for k in keys(city,street) for p in S.get((city,k),[])+[(la,lo) for n,la,lo in H.get((city,k),[])]]
def dist_to_street(lat,lon,city,street):
    pts=street_pts(city,street)
    return min((km(lat,lon,*p) for p in pts),default=None)

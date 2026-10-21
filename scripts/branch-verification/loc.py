import json, re, collections
from shapely import wkt
from shapely.strtree import STRtree
from shapely.geometry import Point
from common import W, km
def norm(s):
    if not s: return ""
    s=s.replace("־"," ").replace("קריית","קרית").replace("״","").replace('"',"").replace("'","").replace("׳","").replace("-"," ").replace("–"," ")
    s=re.sub(r"\s+"," ",s).strip()
    s=re.sub(r"^(מועצה מקומית|מועצה אזורית|עיריית|עירית)\s+","",s)
    return s
ALIAS={"תל אביב יפו":"תל אביב","יפו":"תל אביב","ראשלצ":"ראשון לציון","פת":"פתח תקווה","פתח תקוה":"פתח תקווה","תא":"תל אביב","יוקנעם":"יקנעם עילית","יקנעם":"יקנעם עילית","יוקנעם עילית":"יקנעם עילית","מודיעין מכבים רעות":"מודיעין","מודיעין עילית":"מודיעין עילית","נצרת עילית":"נוף הגליל","באר שבע":"באר שבע","בש":"באר שבע","קרית אונו":"קרית אונו","הוד השרון":"הוד השרון","כפר סבא":"כפר סבא","ירושלים":"ירושלים","מעלה אדומים":"מעלה אדומים","טירת כרמל":"טירת כרמל","טירת הכרמל":"טירת כרמל","רמה""ש":"רמת השרון","בני ברק":"בני ברק","אור עקיבא":"אור עקיבא","קרית ביאליק":"קרית ביאליק","גבעת שמואל":"גבעת שמואל"}
def canon(s):
    n=norm(s); return ALIAS.get(n,n)
A=json.load(open(W+"areas.json"))
settle=[a for a in A if (a["al"]=="8") or a["place"] in ("city","town","village","hamlet")]
nbhd=[a for a in A if a["place"] in ("suburb","neighbourhood","quarter") or a["al"] in ("9","10")]
def mk(lst):
    gs=[wkt.loads(a["wkt"]) for a in lst]; return lst,gs,STRtree(gs)
S=mk(settle); N=mk(nbhd)
P=json.load(open(W+"places.json"))
PN=[x for x in P if x["place"] in ("city","town","village","hamlet")]
def _hit(T,lat,lon):
    lst,gs,tree=T; pt=Point(lon,lat)
    hits=[i for i in tree.query(pt) if gs[i].contains(pt)]
    hits.sort(key=lambda i: gs[i].area)
    return [lst[i] for i in hits]
def settlement(lat,lon):
    """Name of the settlement containing the point (municipality polygon or village/town place polygon)."""
    hits=[h for h in _hit(S,lat,lon) if h["name"]]
    # prefer the smallest place polygon, else municipality
    if hits: return canon(hits[0]["name"])
    best=None
    for x in PN:
        d=km(lat,lon,x["lat"],x["lon"])
        if d<2.0 and (best is None or d<best[0]): best=(d,x)
    return canon(best[1]["tags"].get("name:he") or best[1]["tags"].get("name")) if best else ""
def all_settlements(lat,lon):
    return {canon(h["name"]) for h in _hit(S,lat,lon) if h["name"]}
def neighbourhood(lat,lon):
    hits=[h for h in _hit(N,lat,lon) if h["name"]]
    return norm(hits[0]["name"]) if hits else ""
KNOWN=set(canon(a["name"]) for a in settle if a["name"])|set(canon(x["tags"].get("name:he") or x["tags"].get("name")) for x in PN)
KNOWN.discard("")

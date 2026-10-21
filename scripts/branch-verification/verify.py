"""Cross-checks every branch pin against independent sources and picks a verified pin + hours."""
import json, re, collections
from common import W, km, CHRE, poitext
from loc import settlement, all_settlements, neighbourhood, canon, norm, KNOWN
from intent import intended_city, GENERIC
from addr import clean_addr
import localgeo
from ohparse import parse as parse_oh

b=json.load(open(W+"branches.json"))
osm=json.load(open(W+"osm_shops.json"))
for x in osm: x["txt"]=poitext(x["tags"])
victory=json.load(open(W+"chains/victory.json"))
doralon=json.load(open(W+"chains/doralon.json"))
ampm=json.load(open(W+"chains/ampm.json"))

G=collections.defaultdict(list)
for x in osm: G[(round(x["lat"],2),round(x["lon"],2))].append(x)
def near_osm(lat,lon,r=0.06):
    out=[]
    for dx in (-0.01,0,0.01):
        for dy in (-0.01,0,0.01):
            for x in G.get((round(lat+dx,2),round(lon+dy,2)),[]):
                d=km(lat,lon,x["lat"],x["lon"])
                if d<=r: out.append((d,x))
    return sorted(out,key=lambda t:t[0])

def snorm(s): return localgeo.nstreet(s or "")
def addr_key(a):
    st,num,_=clean_addr(a or "")
    return (snorm(st),num) if st else None

# --- chain-official records, indexed ---
VIC_BY_LL={(round(v["lat"],5),round(v["lon"],5)):v for v in victory if v["lat"]}
VIC_BY_ADDR=collections.defaultdict(list)
for v in victory: VIC_BY_ADDR[norm(v["addr"])].append(v)
DOR_BY_NAME=collections.defaultdict(list)
for d in doralon: DOR_BY_NAME[norm(d["name"])].append(d)
AMPM_BY_ADDR={}
for a in ampm:
    k=addr_key(a["addr"].split(",")[0])
    if k: AMPM_BY_ADDR.setdefault(k,[]).append(a)

def ampm_days(rows):
    if rows==["24/7"]: return [[[0,1440]] for _ in range(7)]
    if len(rows)==1:
        m=re.match(r"^(\d{1,2}):(\d{2})-(\d{1,2})[:-](\d{2})$",rows[0].strip())
        if m:
            o=int(m.group(1))*60+int(m.group(2)); c=int(m.group(3))*60+int(m.group(4))
            if c<=o: c+=1440
            return [[[o,c]] for _ in range(7)]
    # "א-ה 06:00-23:00" / "ו' - סגירה חצי שעה לפני כניסת שבת" / "שבת - פתיחה בצאת שבת" : no closing time for Saturday given
    return None

def chain_official(br):
    """(lat,lon,source,hours,url) from the chain's own branch locator, when this branch is listed there."""
    if br["chain"]=="ויקטורי":
        v=VIC_BY_LL.get((round(br["lat"],5),round(br["lng"],5)))
        if not v:
            c=VIC_BY_ADDR.get(norm(br["addr"]),[])
            v=c[0] if len(c)==1 else None
        if v: return {"lat":v["lat"],"lon":v["lon"],"hours":v["days"] if all(d is None or (d[0][0] is not None and d[0][1] is not None) for d in v["days"]) else None,"url":"https://victory.co.il/branches/","label":v["name"]}
    if br["chain"]=="אלונית / דור אלון":
        tail=br["name"].split(" - ",1)[1] if " - " in br["name"] else ""
        c=DOR_BY_NAME.get(norm(tail),[])
        if len(c)!=1:
            k=addr_key(br["addr"])
            c=[d for d in doralon if k and addr_key(d["addr"].split(",")[0])==k] if k else []
        if len(c)==1: return {"lat":c[0]["lat"],"lon":c[0]["lon"],"hours":None,"url":"https://www.doralon.co.il/station/","label":c[0]["name"]}
    return None

def ampm_hours(br, osm_poi):
    keys=[addr_key(br["addr"])]
    if osm_poi:
        t=osm_poi["tags"]
        if t.get("addr:street"): keys.append((snorm(t["addr:street"]),t.get("addr:housenumber")))
    for k in keys:
        if k and k in AMPM_BY_ADDR and len(AMPM_BY_ADDR[k])==1:
            a=AMPM_BY_ADDR[k][0]; d=ampm_days(a["rows"])
            if d: return d,a
    return None,None

def same_chain(br,x):
    r=CHRE.get(br["chain"]); return bool(r and r.search(x["txt"]))

def osm_hours(x):
    return parse_oh(x["tags"].get("opening_hours")) if x else None

import urllib.parse
NOMI=json.load(open(W+"nominatim_cache.json"))
def nomi_house(c,street,num):
    """Cached Nominatim hit for an exact house number inside settlement c."""
    params={"street":f"{num} {street}","city":c,"format":"jsonv2","countrycodes":"il,ps","addressdetails":"1","accept-language":"he","limit":"5"}
    r=NOMI.get(urllib.parse.urlencode(sorted(params.items())))
    for x in r or []:
        a=x.get("address",{})
        town=a.get("city") or a.get("town") or a.get("village") or a.get("municipality") or ""
        if a.get("house_number","").split()[0:1]==[num] and (canon(town)==c or c in all_settlements(float(x["lat"]),float(x["lon"]))):
            return float(x["lat"]),float(x["lon"])
    return None
def house_any(c,street,num):
    return localgeo.house(c,street,num) or nomi_house(c,street,num)

# am:pm official hours, located by their published address
AMPM_PTS=[]
for a in ampm:
    parts=[p.strip() for p in a["addr"].split(",")]
    st,num,_=clean_addr(parts[0])
    town=canon(parts[-1]) if len(parts)>1 else None
    if not town:
        for c in KNOWN:
            if a["addr"].endswith(" "+c) and len(c)>2: town=c; st,num,_=clean_addr(a["addr"][:-len(c)])
    pt=house_any(town,st,num) if town and st and num else None
    if pt: AMPM_PTS.append((pt,a))

PLACES=collections.defaultdict(list)
for x in json.load(open(W+"places.json")):
    for k in ("name:he","name"):
        if x["tags"].get(k): PLACES[canon(x["tags"][k])].append((x["lat"],x["lon"]))
def near_place(name,la,lo,r):
    return any(km(la,lo,p[0],p[1])<=r for p in PLACES.get(name,[]))
def address_agrees(la,lo,cities,street,num):
    if not street: return False
    for c in cities:
        h=house_any(c,street,num) if num else None
        if h and km(h[0],h[1],la,lo)<=0.3: return True
        d=localgeo.dist_to_street(la,lo,c,street)
        if d is not None and d<=0.2: return True
    return False
def address_conflict(la,lo,cities,street,num):
    """True when the branch's own street address is known on the map and the pin is not on it."""
    if not street: return False
    known=False
    for c in cities:
        h=house_any(c,street,num) if num else None
        if h:
            known=True
            if km(h[0],h[1],la,lo)<=0.6: return False
            continue
        d=localgeo.dist_to_street(la,lo,c,street)
        if d is not None:
            known=True
            if d<=0.35: return False
        elif localgeo.street_pts(c,street): known=True
    return known

res={}
stats=collections.Counter()
for br in b:
    rid=br["id"]; lat,lng=br["lat"],br["lng"]
    rec={"id":rid,"lat":lat,"lng":lng,"loc":None,"hours":None,"hoursSrc":None,"hoursUrl":None,"city":None,"name":None,"why":""}
    pin_settle=settlement(lat,lng)
    generic=br["chain"] in GENERIC
    street,num,_=clean_addr(br["addr"])
    icity,how=intended_city(br)
    osm_poi=None
    if generic:
        n=near_osm(lat,lng,0.03)
        if n:
            osm_poi=n[0][1]; rec["loc"]="osm"; rec["why"]="pin is an OpenStreetMap shop"
            rec["city"]=pin_settle or None
            nm=osm_poi["tags"].get("name:he") or osm_poi["tags"].get("name")
            if pin_settle: rec["name"]=f"{br['chain']} - {pin_settle}"+(f" ({nm})" if nm else "")
    else:
        cities=[c for c in dict.fromkeys([icity,pin_settle]) if c]
        off=chain_official(br)
        if off and off["hours"]: rec.update(hours=off["hours"],hoursSrc="chain",hoursUrl=off["url"])
        if off and off["lat"]:
            s=settlement(off["lat"],off["lon"])
            allc=list(dict.fromkeys(cities+([s] if s else [])))
            exp=icity if how in("name","address") else None
            if address_conflict(off["lat"],off["lon"],allc,street,num):
                ok=False; stats["chain-pin-off-address"]+=1
            elif address_agrees(off["lat"],off["lon"],allc,street,num):
                ok=True
            else:
                # road-side stations and kibbutz shops sit just outside the village they are named after
                ok=bool(exp and (exp in all_settlements(off["lat"],off["lon"]) or near_place(exp,off["lat"],off["lon"],5)))
                if not ok: stats["chain-pin-unconfirmed"]+=1
            if ok:
                rec.update(lat=off["lat"],lng=off["lon"],loc="chain",city=s or exp or None,why=f"chain locator: {off['label']}")
        if not rec["loc"]:
            # OSM POI of the same chain right at the pin
            n=[(d,x) for d,x in near_osm(lat,lng,0.15) if same_chain(br,x) and not address_conflict(x["lat"],x["lon"],cities,street,num)]
            if n:
                osm_poi=n[0][1]
                rec.update(lat=osm_poi["lat"],lng=osm_poi["lon"],loc="osm",city=settlement(osm_poi["lat"],osm_poi["lon"]) or None,why=f"OSM {br['chain']} POI {round(n[0][0]*1000)}m from pin")
        if not rec["loc"] and street and num:
            for c in cities:
                h=house_any(c,street,num)
                if h and km(h[0],h[1],lat,lng)<=0.25:
                    rec.update(loc="address",city=c,why=f"pin within {round(km(h[0],h[1],lat,lng)*1000)}m of {street} {num}, {c}")
                    break
        if not rec["loc"] and street:
            # relocate: same-chain OSM POI on the branch's street, or the exact house number.
            found=[]
            for c in cities:
                cands=[x for x in osm if same_chain(br,x) and c in all_settlements(x["lat"],x["lon"])
                       and (d:=localgeo.dist_to_street(x["lat"],x["lon"],c,street)) is not None and d<0.12]
                hpt=house_any(c,street,num) if num else None
                if hpt: cands=[x for x in cands if km(hpt[0],hpt[1],x["lat"],x["lon"])<0.3]
                if len(cands)==1: found.append(("osm",c,cands[0]["lat"],cands[0]["lon"],cands[0]))
                elif not cands and hpt: found.append(("address",c,hpt[0],hpt[1],None))
            # the same address in two different settlements is ambiguous: leave the branch unverified
            if len(found)==1 or (len(found)>1 and all(km(f[2],f[3],found[0][2],found[0][3])<0.3 for f in found)):
                kind,c,la,lo,x=found[0]
                if x: osm_poi=x
                rec.update(lat=la,lng=lo,loc=kind,city=c,why=f"moved to {'OSM '+br['chain']+' POI on' if x else 'house'} {street} {num or ''}, {c}")
                stats["moved-"+kind]+=1
        if not rec["loc"] and street:
            for c in cities:
                d=localgeo.dist_to_street(lat,lng,c,street)
                if d is not None and d<=0.08 and c in all_settlements(lat,lng):
                    rec.update(loc="street",city=c,why=f"pin on {street}, {c} ({round(d*1000)}m)")
                    break
        # hours
        if not rec["hours"]:
            if br["chain"]=="am:pm" and rec["loc"]:
                near=[(km(rec["lat"],rec["lng"],p[0],p[1]),a) for p,a in AMPM_PTS]
                near=[t for t in near if t[0]<0.12]
                if len(near)==1:
                    d=ampm_days(near[0][1]["rows"])
                    if d: rec.update(hours=d,hoursSrc="chain",hoursUrl="https://www.ampm.co.il/branches")
            if not rec["hours"] and osm_poi and osm_hours(osm_poi):
                rec.update(hours=osm_hours(osm_poi),hoursSrc="osm",hoursUrl=f"https://www.openstreetmap.org/{ {'n':'node','w':'way'}[osm_poi['t']] }/{osm_poi['id']}")
    if generic and osm_poi and osm_hours(osm_poi):
        rec.update(hours=osm_hours(osm_poi),hoursSrc="osm",hoursUrl=f"https://www.openstreetmap.org/{ {'n':'node','w':'way'}[osm_poi['t']] }/{osm_poi['id']}")
    rec["moved_m"]=round(km(lat,lng,rec["lat"],rec["lng"])*1000)
    stats[("generic" if generic else "brand",rec["loc"])]+=1
    if rec["hours"]: stats[("hours",rec["hoursSrc"])]+=1
    res[rid]=rec
# Two branches of one chain with different addresses cannot share a pin: drop both rather than guess.
groups=collections.defaultdict(list)
byid={x["id"]:x for x in b}
for r in res.values():
    if r["loc"] and byid[r["id"]]["chain"] not in GENERIC:
        groups[(round(r["lat"],4),round(r["lng"],4),byid[r["id"]]["chain"])].append(r)
for g in groups.values():
    if len(g)>1 and len({addr_key(byid[r["id"]]["addr"]) for r in g})>1:
        def agrees(r):
            x=byid[r["id"]]; st,nm,_=clean_addr(x["addr"])
            ic,_=intended_city(x)
            return address_agrees(r["lat"],r["lng"],[c for c in (ic,r["city"]) if c],st,nm)
        keep=[r for r in g if agrees(r)]
        for r in g:
            if len(keep)==1 and r is keep[0]: continue
            stats["dropped-shared-pin"]+=1; r.update(loc=None,why="shares a pin with another branch at a different address")
json.dump(res,open(W+"verified.json","w"),ensure_ascii=False)
for k,v in sorted(stats.items(),key=str): print(k,v)

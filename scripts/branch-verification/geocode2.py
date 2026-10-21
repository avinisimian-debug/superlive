import json
from geocode import nominatim, save
from addr import clean_addr
from intent import intended_city, GENERIC
from loc import settlement
from common import W
v=json.load(open(W+"verified.json")); b=json.load(open(W+"branches.json"))
todo=[x for x in b if v[x["id"]]["loc"] is None and x["chain"] not in GENERIC]
n=0
for x in todo:
    st,num,land=clean_addr(x["addr"])
    if not (st and num): continue
    ic,_=intended_city(x); ps=settlement(x["lat"],x["lng"])
    for c in dict.fromkeys([ic,ps]):
        if c: nominatim({"street":f"{num} {st}","city":c}); n+=1
    if n%20==0: save(); print(n,flush=True)
save(); print("done",n)

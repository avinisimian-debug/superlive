"""Extracts shops (any supermarket/convenience-type shop or a known chain) with tags and centroid."""
import osmium, json, sys
SHOPS={"supermarket","convenience","grocery","wholesale","general","department_store","deli","kiosk","variety_store","food","health_food","greengrocer","alcohol"}
KW=["שופרסל","רמי לוי","קרפור","ויקטורי","יוחננוף","אושר עד","טיב טעם","פרש","חצי חינם","מחסני השוק","יודה","קשת","אלונית","קופיקס","am:pm","AM:PM","yellow","Yellow","סוגוד","מנטה","זול ובגדול","קואופ","סיטי מרקט","סטופ מרקט","נתיב החסד","ספיר","מעיין 2000","ברקת","פוליצר","שוק העיר","דבאח","יינות ביתן","מגה","Shufersal","Rami Levy","Carrefour","Victory","Yochananof","Osher Ad","Tiv Taam","Super Yuda","Mahsanei"]
out=[]
def want(t):
    s=t.get("shop")
    if s in SHOPS: return True
    txt=" ".join(t.get(k,"") for k in ("name","name:he","brand","brand:he","operator"))
    return any(k in txt for k in KW) and ("shop" in t or "amenity" in t or "building" in t)
class H(osmium.SimpleHandler):
    def rec(self,kind,id,lat,lon,tags):
        out.append({"t":kind,"id":id,"lat":round(lat,7),"lon":round(lon,7),"tags":dict(tags)})
    def node(self,n):
        if want(n.tags): self.rec("n",n.id,n.location.lat,n.location.lon,{t.k:t.v for t in n.tags})
    def way(self,w):
        if not want(w.tags): return
        pts=[(nd.lat,nd.lon) for nd in w.nodes if nd.location.valid()]
        if not pts: return
        self.rec("w",w.id,sum(p[0] for p in pts)/len(pts),sum(p[1] for p in pts)/len(pts),{t.k:t.v for t in w.tags})
H().apply_file(sys.argv[1],locations=True)
json.dump(out,open(sys.argv[2],"w"),ensure_ascii=False)
print(len(out))

"""Extracts every OSM house number and named street, for offline address geocoding."""
import osmium, json, sys
out=[]; streets=[]
SKIP={"footway","path","cycleway","steps","track","service","bus_stop","platform","proposed","construction"}
class H(osmium.SimpleHandler):
    def rec(self,lat,lon,t):
        out.append([round(lat,7),round(lon,7),t.get("addr:street:he") or t.get("addr:street",""),t.get("addr:housenumber",""),t.get("addr:city:he") or t.get("addr:city","")])
    def node(self,n):
        if "addr:housenumber" in n.tags: self.rec(n.location.lat,n.location.lon,n.tags)
    def way(self,w):
        t=w.tags
        if "addr:housenumber" in t:
            pts=[(nd.lat,nd.lon) for nd in w.nodes if nd.location.valid()]
            if pts: self.rec(sum(p[0] for p in pts)/len(pts),sum(p[1] for p in pts)/len(pts),t)
        elif "highway" in t and t["highway"] not in SKIP and ("name:he" in t or "name" in t):
            pts=[(nd.lat,nd.lon) for nd in w.nodes if nd.location.valid()]
            if pts:
                streets.append([t.get("name:he") or t.get("name"),[[round(a,6),round(b,6)] for a,b in pts[::max(1,len(pts)//8)]+[pts[-1]]]])
H().apply_file(sys.argv[1],locations=True)
json.dump({"addr":out,"streets":streets},open(sys.argv[2],"w"),ensure_ascii=False); print(len(out),len(streets))

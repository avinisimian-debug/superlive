"""Extracts municipality / settlement / neighbourhood polygons used to name the town a pin is in."""
import osmium, json, sys
from shapely import wkb
fab=osmium.geom.WKBFactory()
out=[]
class H(osmium.SimpleHandler):
    def area(self,a):
        t=a.tags
        al=t.get("admin_level"); pl=t.get("place")
        ok=(t.get("boundary")=="administrative" and al in ("6","7","8","9","10")) or pl in ("city","town","village","suburb","neighbourhood","hamlet","quarter") or t.get("landuse")=="residential" and t.get("name")
        if not ok: return
        try: g=wkb.loads(fab.create_multipolygon(a),hex=True)
        except Exception: return
        out.append({"name":t.get("name:he") or t.get("name"),"name_en":t.get("name:en"),"al":al,"place":pl,"landuse":t.get("landuse"),"wkt":g.simplify(0.0002).wkt,"area":g.area})
H().apply_file(sys.argv[1],locations=True)
json.dump(out,open(sys.argv[2],"w"),ensure_ascii=False); print(len(out))

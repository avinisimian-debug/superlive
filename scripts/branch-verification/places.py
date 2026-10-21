"""Extracts OSM place nodes (cities, towns, villages, neighbourhoods)."""
import osmium, json, sys
out=[]
class H(osmium.SimpleHandler):
    def node(self,n):
        p=n.tags.get("place")
        if p in ("city","town","village","suburb","neighbourhood","hamlet","quarter","isolated_dwelling","locality"):
            out.append({"id":n.id,"lat":n.location.lat,"lon":n.location.lon,"place":p,"tags":{t.k:t.v for t in n.tags}})
H().apply_file(sys.argv[1])
json.dump(out,open(sys.argv[2],"w"),ensure_ascii=False); print(len(out))

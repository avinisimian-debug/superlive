import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from common import W
import re, html, json
s=open(W+"chains/doralon_st.html").read()
out=[]
for m in re.finditer(r'<div id="marker-(\d+)"[^>]*data-lat="([\d.]+)" data-lng="([\d.]+)">(.*?)sl__item-waze',s,re.S):
    bl=m.group(4)
    t=lambda c: html.unescape(re.sub(r"<[^>]+>"," ",(re.search(c+r'">(.*?)</(?:span|h2)>',bl,re.S) or [None,""])[1])).strip()
    out.append({"chain":"אלונית / דור אלון","id":m.group(1),"name":t("sl__item-title"),"addr":t("sl__items-address"),"lat":float(m.group(2)),"lon":float(m.group(3))})
json.dump(out,open(W+"chains/doralon.json","w"),ensure_ascii=False,indent=0); print(len(out),out[:2])

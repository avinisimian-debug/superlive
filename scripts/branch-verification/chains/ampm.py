import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from common import W
import re, html, json
s=open(W+"chains/ampm.html").read()
out=[]
for bl in s.split('<div class="branch-item">')[1:]:
    name=html.unescape(re.search(r'branch-name">(.*?)<',bl).group(1)).strip()
    addr=html.unescape(re.search(r'class="address">(.*?)<',bl,re.S).group(1)).strip()
    rows=[html.unescape(r).strip() for r in re.findall(r'opening-hours-row">(.*?)</div>',bl,re.S)]
    m=re.search(r'(?:maps\?q=|ll=|destination=|@)(3[0-3]\.\d+)[,%2C]+(3[4-5]\.\d+)',bl)
    out.append({"chain":"am:pm","name":name,"addr":addr,"rows":rows,"ll":m.groups() if m else None,"links":re.findall(r'href="(https?://[^"]*(?:waze|google)[^"]*)"',bl)[:2]})
json.dump(out,open(W+"chains/ampm.json","w"),ensure_ascii=False,indent=0)
print(len(out))
for o in out: 
    if o["rows"]!=["24/7"]: print(o)
print(out[0])

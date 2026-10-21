import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from common import W
import re, html, json, sys
from hours_util import hm, rel_close, DAYS_HE
s=open(W+"chains/victory.html").read()
blocks=s.split('class="col-md-12 single-branch')[1:]
out=[]
for bl in blocks:
    ma=re.search(r'data-latitude="([\d.]+)"',bl[:400]); mo=re.search(r'data-longitude="([\d.]+)"',bl[:400])
    lat=float(ma.group(1)) if ma else None; lon=float(mo.group(1)) if mo else None
    t=html.unescape(re.sub(r"<!--.*?-->","",bl,flags=re.S)); t=re.sub(r"<[^>]+>","\n",t); t=re.sub(r"[ \t\r]+"," ",t); lines=[l.strip() for l in t.split("\n") if l.strip()]
    name=lines[1]; addr=lines[lines.index("כתובת:")+1] if "כתובת:" in lines else ""
    i=lines.index("שעות פתיחה") if "שעות פתיחה" in lines else -1
    days=[None]*7; j=i+1; note=[]
    while 0<i and j+3<len(lines) and re.match(r"^[אבגדהוש]':$",lines[j]):
        d=DAYS_HE[lines[j][0]]; o=hm(lines[j+1]); c=hm(lines[j+3]); rc=rel_close(lines[j+3])
        days[d]=[[o, c if c is not None else ({"beforeShabbat":-rc} if rc else None)]]; j+=4
    while j<len(lines) and lines[j] not in ("מפת הגעה",): note.append(lines[j]); j+=1
    nj=" ".join(note)
    m=re.search(r'מוצ"ש: (.*?) עד (\d{1,2}[:.]\d{2})',nj)
    if m:
        am=re.search(r"(חצי שעה|שעה|\d+ דקות)",m.group(1))
        off={"חצי שעה":30,"שעה":60}.get(am.group(1)) if am else None
        if off is None and am: off=int(am.group(1).split()[0])
        if off is not None: days[6]=[[{"afterShabbat":off},hm(m.group(2))]]
    out.append({"chain":"ויקטורי","name":name,"addr":addr,"lat":lat,"lon":lon,"days":days,"note":" | ".join(note)})
json.dump(out,open(W+"chains/victory.json","w"),ensure_ascii=False,indent=0)
print(len(out)); print(out[0]); print(out[1])
bad=[o for o in out if any(d and (d[0][0] is None or d[0][1] is None) for d in o["days"])]; print("unparsed",len(bad), [b["name"] for b in bad][:5])

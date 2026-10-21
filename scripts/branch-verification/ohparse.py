"""Small parser for the OSM opening_hours subset used by Israeli shops."""
import re
DAY={"Mo":1,"Tu":2,"We":3,"Th":4,"Fr":5,"Sa":6,"Su":0}
ORDER=["Mo","Tu","We","Th","Fr","Sa","Su"]
def _days(spec):
    out=set()
    for part in spec.split(","):
        part=part.strip()
        if "-" in part:
            a,b=part.split("-")
            if a not in DAY or b not in DAY: return None
            i,j=ORDER.index(a),ORDER.index(b)
            rng=ORDER[i:j+1] if i<=j else ORDER[i:]+ORDER[:j+1]
            out.update(DAY[d] for d in rng)
        elif part in DAY: out.add(DAY[part])
        else: return None
    return out
def _t(s):
    m=re.match(r"^(\d{1,2}):(\d{2})$",s)
    if not m: return None
    v=int(m.group(1))*60+int(m.group(2))
    return v if v<=24*60+0 or True else None
def parse(oh):
    """Return 7-day list (0=Sunday) of [[open,close],...] or None, or None if unsupported."""
    if not oh: return None
    oh=oh.strip()
    if oh in ("24/7","Mo-Su 00:00-24:00"): return [[[0,1440]] for _ in range(7)]
    days=[None]*7; seen=False
    for rule in oh.split(";"):
        rule=rule.strip()
        if not rule: continue
        if re.match(r"^PH\b",rule): continue  # public holidays: not modelled
        m=re.match(r"^([A-Za-z,\- ]+?)\s+(off|closed|[\d:,\- ]+)$",rule)
        if not m: return None
        dspec=m.group(1).replace(" ","")
        dspec=re.sub(r",?PH","",dspec)
        ds=_days(dspec)
        if not ds: return None
        if m.group(2) in ("off","closed"):
            for d in ds: days[d]=None
            seen=True; continue
        slots=[]
        for rng in m.group(2).split(","):
            rng=rng.strip()
            mm=re.match(r"^(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$",rng)
            if not mm: return None
            o,c=_t(mm.group(1)),_t(mm.group(2))
            if o is None or c is None: return None
            if c<=o: c+=1440  # past midnight
            if c>1440*2: return None
            slots.append([o,c])
        for d in ds: days[d]=slots
        seen=True
    return days if seen else None
if __name__=="__main__":
    for t in ["Su-Th 07:00-22:00; Fr 07:00-14:00; Sa off","24/7","Mo-Su 08:00-23:00","Su-Th 08:00-13:00,16:00-20:00; Fr 08:00-13:00","Su-Th 07:00-01:00","sunrise-sunset"]: print(t,parse(t))

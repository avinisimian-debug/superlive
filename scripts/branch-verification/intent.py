import re
from loc import canon, KNOWN, norm
GENERIC={"מכולת שכונתית","סופרמרקט שכונתי"}
def _find(text):
    """Longest known settlement name appearing in text as whole words."""
    t=" "+norm(text)+" "
    best=None
    for c in KNOWN:
        if len(c)<3: continue
        if f" {c} " in t and (best is None or len(c)>len(best)): best=c
    # aliases
    for k in ("תל אביב","ראשלצ","פת","תא","יוקנעם","טירת הכרמל","נצרת עילית"):
        if f" {k} " in t:
            c=canon(k)
            if best is None or len(c)>len(best): best=c
    return best
def intended_city(br):
    """Return (city, how) the branch claims to be in, from the most reliable text first."""
    name=br["name"]; tail=name.split(" - ",1)[1] if " - " in name else ""
    main=tail.split("(")[0]
    paren=" ".join(re.findall(r"\(([^)]*)\)",tail))
    for txt,how in ((main,"name"),(paren,"name-paren"),(br["addr"],"address")):
        if txt:
            c=canon(txt)
            if c in KNOWN: return c,how
            f=_find(txt)
            if f: return f,how
    c=canon(br["city"])
    if c in KNOWN: return c,"city-field"
    return None,"none"

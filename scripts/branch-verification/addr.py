import re
def clean_addr(a):
    """Split a free-text Israeli address into (street, number, landmark)."""
    if not a or a.strip().lower() in ("unknown",): return None,None,None
    s=a.replace("״",'"').replace("׳","'")
    # road-side descriptions ("כביש 35 כניסה לקיבוץ ...") are not street addresses
    if re.match(r"^\s*(כביש|צומת|מחלף|בין|בכניסה|כניסה|קיבוץ|קבוץ|מושב|ליד|מול)\b",s): return None,None,s.strip()
    land=None
    m=re.search(r"(קניון|קנ\.|מרכז מסחרי|מרכז|מתחם|פאוור סנטר|ביג|סנטר)\s*([^\d,]{2,30})",s)
    if m: land=(("קניון" if m.group(1)=="קנ." else m.group(1))+" "+m.group(2)).strip()
    s=re.sub(r"^\s*(רחוב|רח'|רח\.|רח )\s*","",s)
    s=re.sub(r"\b(שד'|שד\.)\s*","שדרות ",s)
    s=re.split(r"פינת|פנת",s)[0]
    s=re.sub(r",\s*(\d+)\b",r" \1",s)
    parts=[p for p in s.split(",") if p.strip()] or [""]
    withnum=[p for p in parts if re.search(r"\d",p) and not re.search(r"קניון|קנ\.",p)]
    s=(withnum or parts)[0]
    s=re.sub(r"(מרכז מסחרי|קניון|קנ\.|מתחם|א\.ת\.?|אזור תעשי[יה]+).*$","",s).strip()
    m=re.match(r"^\s*(\d+)\s+([^\d]+?)\s*$",s)
    if m: return m.group(2).strip(),m.group(1),land
    m=re.match(r"^\s*([^\d]+?)\s*(\d+)",s)
    if m: return m.group(1).strip(" -/"),m.group(2),land
    st=s.strip(" -/")
    return (st if len(st)>=2 else None),None,land

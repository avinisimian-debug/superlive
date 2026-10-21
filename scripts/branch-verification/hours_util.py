import re
# Friday/holiday-eve closing tied to Shabbat entry: encoded as negative minutes before candle lighting.
DAYS_HE={"א":0,"ב":1,"ג":2,"ד":3,"ה":4,"ו":5,"ש":6}
def hm(t):
    t=t.strip().replace(".",":")
    m=re.match(r"^(\d{1,2})(?::(\d{1,2}))?$",t)
    if not m: return None
    h=int(m.group(1)); mi=int(m.group(2) or 0)
    if mi<10 and len(m.group(2) or "00")==1: mi*=10
    if h>24 or mi>59: return None
    return h*60+mi
def rel_close(t):
    """'שעתיים לפני כניסת שבת' -> -120 ; 'שעה לפני' -> -60 ; 'X דקות לפני' -> -X"""
    if "לפני" not in t: return None
    if "שעתיים" in t: return -120
    if "שעה וחצי" in t: return -90
    if "שעה" in t: return -60
    m=re.search(r"(\d+)\s*דק",t)
    if m: return -int(m.group(1))
    return None

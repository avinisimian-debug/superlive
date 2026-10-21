import json, math, re
import os
# Downloads and intermediate files live here (not committed). Override with ZEREM_WORK.
W=os.environ.get("ZEREM_WORK") or os.path.join(os.path.dirname(os.path.abspath(__file__)),"work")+"/"
os.makedirs(W+"chains",exist_ok=True)
def km(a,b,c,d):
    R=6371; p=math.radians
    x=p(d-b)*math.cos(p((a+c)/2)); y=p(c-a); return R*math.hypot(x,y)
# chain -> regex over name/brand/operator text (lowercased)
CH={
 "שופרסל":r"shufersal(?!.*(sheli|deal|express|דיל|שלי|אקספרס))|שופרסל(?!\s*(שלי|דיל|אקספרס|express|sheli|deal))",
 "שופרסל שלי":r"sheli|שופרסל\s*שלי",
 "שופרסל דיל":r"shufersal deal|שופרסל\s*דיל|shufersal\s*deal",
 "שופרסל אקספרס":r"shufersal express|שופרסל\s*אקספרס|express",
 "יש (שופרסל)":r"^yesh\b|^יש\b|\byesh\b|יש חסד|^יש ",
 "רמי לוי":r"rami lev|רמי לוי",
 "קרפור":r"carrefour|קרפור|יינות ביתן|yaynot|yeinot|mega|מגה",
 "מגה":r"mega|מגה",
 "יינות ביתן":r"yaynot|yeinot|יינות ביתן",
 "ויקטורי":r"victory|ויקטורי",
 "יוחננוף":r"yochananof|יוחננוף",
 "אושר עד":r"osher ad|אושר עד",
 "טיב טעם":r"tiv ta|טיב טעם",
 "פרשמרקט":r"fresh ?market|פרש ?מרקט",
 "חצי חינם":r"hazi hinam|חצי חינם",
 "מחסני השוק":r"mahsane|מחסני השוק",
 "סופר יודה":r"yuda|יודה",
 "קשת טעמים":r"keshet|קשת טעמים",
 "אלונית / דור אלון":r"alonit|אלונית|dor alon|דור אלון",
 "אלונית":r"alonit|אלונית",
 "קופיקס":r"cofix|קופיקס|super ?cofix|סופר קופיקס",
 "am:pm":r"am:?pm|איי אם פי אם",
 "yellow":r"yellow|ילו",
 "סוגוד":r"so ?good|סוגוד|סו גוד",
 "מנטה":r"menta|מנטה",
 "זול ובגדול":r"zol ?u?vegadol|זול ובגדול",
 "קואופ":r"coop|קואופ|co-op",
 "סיטי מרקט":r"city ?market|סיטי מרקט",
 "סטופ מרקט":r"stop ?market|סטופ מרקט",
 "נתיב החסד":r"netiv|נתיב החסד",
 "סופר ספיר":r"sapir|ספיר",
 "מעיין 2000":r"maayan|מעיין 2000|מעין 2000",
 "סופר ברקת":r"bareket|ברקת",
 "פוליצר":r"politzer|פוליצר",
 "שוק העיר":r"שוק העיר|shuk ha",
 "סלאח דבאח":r"dabah|דבאח",
}
CHRE={k:re.compile(v,re.I) for k,v in CH.items()}
def poitext(t):
    return " | ".join(t.get(k,"") for k in ("brand","brand:he","brand:en","name","name:he","name:en","operator")).lower()
def load():
    b=json.load(open(W+"branches.json")); o=json.load(open(W+"osm_shops.json")); p=json.load(open(W+"places.json"))
    return b,o,p

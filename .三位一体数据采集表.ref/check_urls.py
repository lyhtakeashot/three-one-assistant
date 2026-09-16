# -*- coding: utf-8 -*-
"""校验 溯源素材/ 中引用的章程链接可达性（§7 红线：https + 免登录可打开）。"""
import json
import os
import ssl
import urllib.error
import urllib.request

BASE = r"D:\Desktop\VibeCoding\三位一体辅助系统"
OUTDIR = os.path.join(BASE, "溯源素材")

CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")

results = []
for fn in sorted(os.listdir(OUTDIR)):
    if not fn.endswith(".json"):
        continue
    obj = json.load(open(os.path.join(OUTDIR, fn), encoding="utf-8"))
    url = ((obj.get("sources") or {}).get("info") or {}).get("tuitionSourceUrl")
    if not url:
        results.append((fn, obj.get("name"), "NO_URL", ""))
        continue
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=15, context=CTX) as resp:
            code = resp.status
            body = resp.read(200000).decode("utf-8", "ignore")
        hit = "学费" in body or "收费" in body
        results.append((fn, obj.get("name"), str(code), "含学费字样" if hit else "未见学费字样"))
    except urllib.error.HTTPError as e:
        results.append((fn, obj.get("name"), "HTTP %d" % e.code, ""))
    except Exception as e:  # noqa: BLE001
        results.append((fn, obj.get("name"), "ERR", str(e)[:60]))

ok = sum(1 for r in results if r[2].startswith("2") or r[2].startswith("3"))
print("检查:", len(results), "| 2xx/3xx:", ok)
for r in results:
    flag = "OK " if (r[2].startswith("2") or r[2].startswith("3")) else "!! "
    print(flag, r[1], r[2], r[3])

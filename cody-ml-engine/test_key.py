import os, json, urllib.request, urllib.error

key = os.environ.get("GEMINI_API_KEY", "").strip().strip('"').strip("'")
print("key length:", len(key))

url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key={key}"
data = json.dumps({"contents": [{"parts": [{"text": "say hello"}]}]}).encode()
req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})

try:
    with urllib.request.urlopen(req, timeout=30) as r:
        print("status:", r.status)
        print(r.read().decode()[:400])
except urllib.error.HTTPError as e:
    print("error:", e.code)
    print(e.read().decode()[:400])
except Exception as e:
    print("problem:", e)

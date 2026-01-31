import requests

cdns = [
    "https://cdn.tailwindcss.com",
    "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
    "https://fonts.googleapis.com"
]

print("Checking CDN connectivity...")
for url in cdns:
    try:
        r = requests.head(url, timeout=5)
        print(f"[{r.status_code}] {url}")
    except Exception as e:
        print(f"[FAIL] {url} - {e}")

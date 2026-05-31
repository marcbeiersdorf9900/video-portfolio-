import re
import json
import urllib.request

html_file = 'work.html'
with open(html_file, 'r') as f:
    content = f.read()

# Find all blocks with poster img and iframe
pattern = re.compile(r'(<img class="vimeo-hover-poster"[^>]*src=")([^"]*)("[^>]*>\s*<iframe[^>]*data-vimeo-id=")(\d+)(")')

def replacer(match):
    prefix1 = match.group(1)
    old_src = match.group(2)
    prefix2 = match.group(3)
    vid = match.group(4)
    suffix = match.group(5)
    
    print(f"Fetching {vid}...")
    try:
        url = f"https://vimeo.com/api/oembed.json?url=https://vimeo.com/{vid}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            thumb = data.get('thumbnail_url', '')
            # replace dimensions like _200x150 or _295x166 with _1280 for high res
            high_res = re.sub(r'_\d+x\d+', '_1280', thumb)
            print(f"Got {high_res}")
            return f"{prefix1}{high_res}{prefix2}{vid}{suffix}"
    except Exception as e:
        print(f"Error for {vid}: {e}")
        return match.group(0)

new_content = pattern.sub(replacer, content)

with open(html_file, 'w') as f:
    f.write(new_content)

print("Done updating work.html")

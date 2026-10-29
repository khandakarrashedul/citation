"""Refresh data/scholar.json with your total citation count from Google Scholar.

Run automatically every day by the GitHub Action (update-scholar.yml).
The file is only changed when the number changes.
"""
import datetime
import json
import os
import pathlib
import re
import sys
import urllib.request

USER_ID = "u9Iv7xsAAAAJ"          # from your Google Scholar profile link
OUT = pathlib.Path("data/scholar.json")
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")


def parse_scholar_html(html):
    """The profile page has a table whose first number is 'Citations (All)'."""
    nums = re.findall(r'class="gsc_rsb_std">(\d+)<', html)
    if not nums:
        raise ValueError("citation table not found (Google probably blocked the request)")
    return int(nums[0])


def parse_serpapi(data):
    for row in data["cited_by"]["table"]:
        if "citations" in row:
            return int(row["citations"]["all"])
    raise ValueError("unexpected SerpApi response")


def fetch(url, timeout=40):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "en"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", "ignore")


def from_scholar():
    url = "https://scholar.google.com/citations?user=%s&hl=en" % USER_ID
    return parse_scholar_html(fetch(url))


def from_serpapi(key):
    url = ("https://serpapi.com/search.json?engine=google_scholar_author"
           "&author_id=%s&hl=en&api_key=%s" % (USER_ID, key))
    return parse_serpapi(json.loads(fetch(url, timeout=60)))


def main():
    citations = None
    try:
        citations = from_scholar()
        print("Google Scholar says:", citations)
    except Exception as err:
        print("Direct Google Scholar request failed:", err)
        key = os.environ.get("SERPAPI_API_KEY")
        if key:
            try:
                citations = from_serpapi(key)
                print("SerpApi says:", citations)
            except Exception as err2:
                print("SerpApi request failed:", err2)

    if citations is None:
        print("Could not get the citation count. Keeping the existing file.")
        sys.exit(1)               # makes the run show as failed, so GitHub emails you

    old = None
    if OUT.exists():
        try:
            old = json.loads(OUT.read_text(encoding="utf-8")).get("citations")
        except Exception:
            pass
    if old == citations:
        print("No change.")
        return

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({
        "citations": citations,
        "updated": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d"),
    }, indent=2) + "\n", encoding="utf-8")
    print("Saved", OUT)


if __name__ == "__main__":
    main()

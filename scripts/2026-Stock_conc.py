# %%
import time
from datetime import datetime
from urllib.parse import urljoin

import requests
import pandas as pd
from bs4 import BeautifulSoup

from typing import Optional, Tuple

import re
from typing import Optional, Tuple


!pip install lxml

import json, math
from datetime import datetime, timezone

def sanitize_for_json(x):
    """Convert NaN/Infinity to None so output is valid JSON."""
    if isinstance(x, float):
        if math.isnan(x) or math.isinf(x):
            return None
        return x
    if isinstance(x, dict):
        return {k: sanitize_for_json(v) for k, v in x.items()}
    if isinstance(x, list):
        return [sanitize_for_json(v) for v in x]
    return x


# --- config ---
USER_AGENT = "Katie Lui (katie@vatic.health)"  # keep contact info here
HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept-Encoding": "gzip, deflate",
}

# Rate limiting: with 3 requests/CIK, 0.5s is a safer default for large lists
REQUEST_DELAY = 0.5

# Retry/backoff for transient SEC throttling (429/503)
MAX_RETRIES = 4
BACKOFF_BASE = 1.5  # seconds

session = requests.Session()
session.headers.update(HEADERS)


def cik_to_10(cik) -> str:
    return str(cik).strip().zfill(10)


def get_with_retries(url: str, timeout: int = 30) -> requests.Response:
    """
    GET with basic retry/backoff for 429/5xx responses.
    """
    last_exc = None
    for attempt in range(MAX_RETRIES):
        try:
            r = session.get(url, timeout=timeout)
            # Handle throttling / temporary errors with backoff
            if r.status_code in (429, 500, 502, 503, 504):
                sleep_s = BACKOFF_BASE * (2 ** attempt)
                time.sleep(sleep_s)
                continue
            r.raise_for_status()
            return r
        except Exception as e:
            last_exc = e
            sleep_s = BACKOFF_BASE * (2 ** attempt)
            time.sleep(sleep_s)
    raise RuntimeError(f"GET failed after retries: {url}") from last_exc


def latest_13f_index_url(cik, include_amendments: bool = True):
    cik10 = cik_to_10(cik)
    sub_url = f"https://data.sec.gov/submissions/CIK{cik10}.json"

    r = get_with_retries(sub_url)
    data = r.json()
    time.sleep(REQUEST_DELAY)

    # fund name (top-level metadata)
    fund_name = (data.get("name") or data.get("entityName") or "").strip()

    recent = data.get("filings", {}).get("recent", {})
    forms = recent.get("form", [])
    accs  = recent.get("accessionNumber", [])
    dates = recent.get("filingDate", [])
    reports = recent.get("reportDate", [])  # <-- this is your period-of-report equivalent

    if not forms:
        return None

    def is_target_form(f: str) -> bool:
        return f.startswith("13F-HR") if include_amendments else (f == "13F-HR")

    candidates = []
    for i, f in enumerate(forms):
        if is_target_form(f):
            report_date = reports[i] if i < len(reports) else None
            candidates.append((dates[i], accs[i], f, report_date))

    if not candidates:
        return None

    filing_date, accession, form, report_date = sorted(candidates, key=lambda x: x[0], reverse=True)[0]

    acc_no_dash = accession.replace("-", "")
    cik_int = str(int(cik10))

    index_url = f"https://www.sec.gov/Archives/edgar/data/{cik_int}/{acc_no_dash}/{accession}-index.htm"
    return index_url, filing_date, report_date, form, accession, fund_name






def primary_doc_url_from_index(index_url: str):
    """
    From ...-index.htm, pick the PRIMARY DOCUMENT for the filing (usually seq 1).
    Prefer XML over HTML, because we want periodOfReport reliably.
    """
    r = get_with_retries(index_url)
    time.sleep(REQUEST_DELAY)
    soup = BeautifulSoup(r.text, "html.parser")

    for table in soup.find_all("table", class_="tableFile"):
        xml_candidate = None
        html_candidate = None

        for tr in table.find_all("tr"):
            tds = tr.find_all("td")
            if len(tds) < 4:
                continue

            seq = tds[0].get_text(strip=True)
            doc_a = tds[2].find("a")
            typ = tds[3].get_text(" ", strip=True).upper()

            if seq != "1":
                continue
            # usually "13F-HR" or "13F-HR/A"
            if "13F-HR" not in typ:
                continue
            if not doc_a or not doc_a.get("href"):
                continue

            href = doc_a["href"]
            full = urljoin(index_url, href)

            if href.lower().endswith(".xml"):
                xml_candidate = full
            elif href.lower().endswith((".htm", ".html")):
                html_candidate = full

        if xml_candidate or html_candidate:
            return xml_candidate or html_candidate

    return None


def extract_period_of_report(primary_doc_url: str) -> Optional[str]:
    """
    Returns periodOfReport as 'YYYY-MM-DD' if found, else None.
    Works for XML; includes a regex fallback for edge cases.
    """
    if not primary_doc_url:
        return None

    r = get_with_retries(primary_doc_url)
    time.sleep(REQUEST_DELAY)

    content = r.content

    # Try XML parse first
    try:
        root = ET.fromstring(content)

        def local(tag: str) -> str:
            return tag.split("}", 1)[1] if "}" in tag else tag

        for node in root.iter():
            if local(node.tag).lower() == "periodofreport":
                val = (node.text or "").strip()
                return val or None
    except Exception:
        pass

    # Fallback: regex search in text (handles "HTML that contains XML tags")
    text = content.decode("utf-8", errors="ignore")
    m = re.search(r"<\s*periodOfReport\s*>\s*([^<]+)\s*<\s*/\s*periodOfReport\s*>", text, flags=re.I)
    return m.group(1).strip() if m else None


def as_of_quarter_from_period(period_str: Optional[str]) -> Optional[str]:
    """
    '2025-09-30' -> '2025Q3'
    """
    if not period_str:
        return None
    dt = pd.to_datetime(period_str, errors="coerce")
    if pd.isna(dt):
        return None
    return f"{dt.year}Q{dt.quarter}"

def infotable_xml_url_from_index(index_url: str):
    """
    From ...-index.htm, pick the INFORMATION TABLE XML (usually seq 2).
    Works even when the filename is form13fInfoTable.xml (etc).
    """
    r = get_with_retries(index_url)
    time.sleep(REQUEST_DELAY)
    soup = BeautifulSoup(r.text, "html.parser")

    for table in soup.find_all("table", class_="tableFile"):
        xml_candidate = None
        html_candidate = None

        for tr in table.find_all("tr"):
            tds = tr.find_all("td")
            if len(tds) < 4:
                continue

            seq = tds[0].get_text(strip=True)
            doc_a = tds[2].find("a")
            typ = tds[3].get_text(" ", strip=True).upper()

            if seq != "2":
                continue
            if "INFORMATION TABLE" not in typ:
                continue
            if not doc_a or not doc_a.get("href"):
                continue

            href = doc_a["href"]
            full = urljoin(index_url, href)

            if href.lower().endswith(".xml"):
                xml_candidate = full
            elif href.lower().endswith((".htm", ".html")):
                html_candidate = full

        if xml_candidate or html_candidate:
            return xml_candidate or html_candidate

    return None


def concentration_flag(
    top1_share: Optional[float],
    top3_share: Optional[float],
    effective_n: Optional[float],
    n_stocks: Optional[int],
) -> Tuple[str, str]:
    """
    Returns (flag, reason) where flag ∈ {"High", "Medium", "Low"}.

    Designed to work across small and large portfolios.
    - Uses top1/top3 for direct concentration
    - Uses effective_n (1/HHI) to normalize for broad vs narrow holdings
    - Applies a slightly softer threshold for very small N to avoid over-flagging
    """
    if top1_share is None or top3_share is None:
        return "Unknown", "missing shares"

    # soften thresholds when portfolio is tiny
    n = n_stocks or 0
    small = n > 0 and n < 20

    # thresholds
    high_top1 = 0.30 if small else 0.25
    high_top3 = 0.60 if small else 0.50
    high_effn = 7 if small else 10

    med_top1 = 0.20 if small else 0.15
    med_top3 = 0.45 if small else 0.35
    med_effn = 12 if small else 20

    # High
    if top1_share >= high_top1:
        return "High", f"top1_share ≥ {high_top1:.2f}"
    if top3_share >= high_top3:
        return "High", f"top3_share ≥ {high_top3:.2f}"
    if effective_n is not None and effective_n <= high_effn:
        return "High", f"effective_n ≤ {high_effn}"

    # Medium
    if top1_share >= med_top1:
        return "Medium", f"top1_share ≥ {med_top1:.2f}"
    if top3_share >= med_top3:
        return "Medium", f"top3_share ≥ {med_top3:.2f}"
    if effective_n is not None and effective_n <= med_effn:
        return "Medium", f"effective_n ≤ {med_effn}"

    return "Low", "no thresholds triggered"





import xml.etree.ElementTree as ET

def parse_infotable_and_summarize(infotable_xml_url: str):
    r = get_with_retries(infotable_xml_url)
    time.sleep(REQUEST_DELAY)

    root = ET.fromstring(r.content)

    def local(tag: str) -> str:
        return tag.split("}", 1)[1] if "}" in tag else tag

    names = []
    values = []

    for node in root.iter():
        if local(node.tag) != "infoTable":
            continue

        name = None
        val = None

        for child in node:
            t = local(child.tag)
            if t == "nameOfIssuer":
                name = (child.text or "").strip()
            elif t == "value":
                val = (child.text or "").strip()

        if name and val:
            names.append(name)
            values.append(val)

    df = pd.DataFrame({
        "Stock name": names,
        "Value": pd.to_numeric(values, errors="coerce"),
    }).dropna()

    # extra safety: remove empty issuer names
    df = df[df["Stock name"].astype(str).str.strip().ne("")]

    if df.empty:
        return None

    grouped = (
        df.groupby("Stock name", as_index=False)["Value"]
        .sum()
        .sort_values("Value", ascending=False)
        .reset_index(drop=True)
    )

    n_stocks = len(grouped)
    total_value = float(grouped["Value"].sum())

    if total_value <= 0 or n_stocks == 0:
        return {
            "n_stocks": int(n_stocks),
            "total_value": float(total_value),
            "top1_share": None,
            "top3_share": None,
            "hhi": None,
            "effective_n": None,
            "top10_share": None,
            "top10_value": None,
            "top1_name": None,
            "top1_value": None,
            "top3_names": None,
            "concentration_flag": "Unknown",
            "flag_reason": "no value or no holdings",

        }

    grouped["share"] = grouped["Value"] / total_value

    top1_name = grouped.loc[0, "Stock name"]
    top1_value = float(grouped.loc[0, "Value"])
    top3_names = ", ".join(grouped["Stock name"].head(min(3, n_stocks)).tolist())

    top1_share = float(grouped["share"].iloc[0])
    top3_share = float(grouped["share"].head(min(3, n_stocks)).sum())

    hhi = float((grouped["share"] ** 2).sum())
    effective_n = float(1.0 / hhi) if hhi > 0 else None

    
    flag, flag_reason = concentration_flag(top1_share, top3_share, effective_n, n_stocks)

    
    # Only compute top-10 metrics when holdings count is large enough
    if n_stocks >= 100:
        top10_share = float(grouped["share"].head(10).sum())
        top10_value = float(grouped["Value"].head(10).sum())
    else:
        top10_share = None
        top10_value = None

    return {
        "n_stocks": int(n_stocks),
        "total_value": total_value,
        "top1_share": top1_share,
        "top3_share": top3_share,
        "hhi": hhi,
        "effective_n": effective_n,
        "top10_share": top10_share,
        "top10_value": top10_value,
        "top1_name": top1_name,
        "top1_value": top1_value,
        "top3_names": top3_names,
        "concentration_flag": flag,
        "flag_reason": flag_reason,

    }



# --- run for a list of CIKs ---
ciks = [
    1364742, 902219, 1423053, 1274173, 1088875, 1318757, 1165408, 1758720,
    1056288, 898427, 1704268, 1103804, 909661, 1665241, 1390202, 1784547,
    1483859, 1263508, 938206, 1601086, 1633313, 1017645, 1674546, 1346824,
    1493215, 1442891, 1009258, 1055951, 1731118, 1633046, 1687509, 1319998,
    1224962, 1595725, 1056807, 1587114, 1595849, 1856083, 1425738, 1791827,
    1920938, 1256071, 1569064, 1855655, 1583977, 1357550, 1316926, 1465837,
    1892134, 1631134, 1472322, 1442756, 1600136, 1388325, 1093589, 1512848,
    1400240, 1600004, 1496201, 1674712, 1404574, 1831942, 1306923, 1792126,
    1703031, 1534261, 1621855, 1802528, 1802881, 1974915, 1907884, 1839948,
    1802630, 1000097, 1461790, 1773206, 1777015, 1801265, 1590144, 1744967,
    1839435, 1281446, 1018561, 1627608, 1776588, 1911010, 1839209, 1569241,
    1482416, 1858703, 1389933, 1844645, 1760304, 1799883, 1595855,
    1952142, 1663224, 1816307, 1801682, 1397144, 1727492, 1440771, 1641604,
    1643354, 1704132, 1582844, 1664999, 1848809, 1730610, 1822947, 1811907,
    1858353, 80255, 1228754, 1746382, 1964382, 1802978, 1631614, 1637359,
    1622627, 1969764, 1615982, 1801619, 1909617, 1343781, 2011932, 1780948,
    1792206, 1594912, 1812549, 1423994, 1911245, 1701879, 1658005, 1511901,
    1844002, 1575444, 1645157, 1581219, 1081698
]



results = []

for cik in ciks:
    cik10 = cik_to_10(cik)
    print(f"Processing CIK: {cik10}")

    try:
        out = latest_13f_index_url(cik, include_amendments=True)
        if not out:
            results.append({"CIK": str(int(cik10)), "status": "no 13F-HR found"})
            continue

        index_url, filing_date, report_date, form, accession, fund_name = out
        infotable_url = infotable_xml_url_from_index(index_url)
        primary_doc_url = primary_doc_url_from_index(index_url)
        period_of_report = extract_period_of_report(primary_doc_url)  # 'YYYY-MM-DD' or None
        as_of_quarter = as_of_quarter_from_period(period_of_report)   # e.g. '2025Q3' or None

        
        
        if not infotable_url:
            results.append({
                "CIK": str(int(cik10)),
                "filing_date": filing_date,
                "form": form,
                "accession": accession,
                "index_url": index_url,
                "infotable_xml_url": None,
                "status": "information table xml not found on index",
            })
            continue

        metrics = parse_infotable_and_summarize(infotable_url)
        if not metrics:
            results.append({
                "CIK": str(int(cik10)),
                "filing_date": filing_date,
                "form": form,
                "accession": accession,
                "index_url": index_url,
                "infotable_xml_url": infotable_url,
                "status": "information table parsed but empty",
            })
            continue

        results.append({
            "cik": str(int(cik10)),
            "fund_name": fund_name,
            "filing_date": filing_date,
            "period_of_report": period_of_report,
            "as_of_quarter": as_of_quarter,
            "form": form,
            "accession": accession,
            "index_url": index_url,
            "primary_doc_url": primary_doc_url,
            "infotable_xml_url": infotable_url,

            "n_stocks": metrics["n_stocks"],
            "total_value": metrics["total_value"],

            "top1_share": metrics["top1_share"],
            "top3_share": metrics["top3_share"],
            "top1_share_pct": (metrics["top1_share"] * 100) if metrics["top1_share"] is not None else None,
            "top3_share_pct": (metrics["top3_share"] * 100) if metrics["top3_share"] is not None else None,

            "hhi": metrics["hhi"],
            "effective_n": metrics["effective_n"],

            "top10_share": metrics["top10_share"],             # null unless n_stocks >= 100
            "top10_share_pct": (metrics["top10_share"] * 100) if metrics["top10_share"] is not None else None,
            "top10_value": metrics["top10_value"],

            "top1_name": metrics.get("top1_name"),
            "top1_value": metrics.get("top1_value"),
            "top3_names": metrics.get("top3_names"),

            "concentration_flag": metrics["concentration_flag"],
            "flag_reason": metrics["flag_reason"],

            "status": "ok",
        })


    except Exception as e:
        results.append({
            "CIK": str(int(cik10)),
            "status": f"error: {type(e).__name__}: {e}"
        })

# Final dataframe
results_df = pd.DataFrame(results)
results_df
# %%
# Save to Excel
current_date = datetime.now().strftime("%Y%m%d")
filename = f"{current_date}_stock_conc.xlsx"


results_df = pd.DataFrame(results)


import json
from pathlib import Path
# from datetime import datetime, timezone

# --- write JSON for the website ---
APP_ROOT = Path(__file__).resolve().parents[1]  # .../kl-portfolio
OUT_JSON = APP_ROOT / "public" / "data" / "stock_conc_latest.json"

# Convert DataFrame -> valid JSON rows (NaN -> null)
rows = json.loads(results_df.to_json(orient="records"))

payload = {
    "generated_at_utc": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    "rows": rows,
}

OUT_JSON.parent.mkdir(parents=True, exist_ok=True)

OUT_JSON.write_text(
    json.dumps(payload, ensure_ascii=False, indent=2, allow_nan=False),
    encoding="utf-8"
)

print(f"Wrote: {OUT_JSON}")

###############################

preferred_cols = [
  "CIK","Fund name","filing_date","as_of_quarter", "periodOfReport","form","accession","index_url","infotable_xml_url",
  "Number of stocks held","Total stock value",
  "Top1 share %","Top3 share %","HHI","Effective N (1/HHI)",
  "Top10 share % (N>=100)","Top10 value (N>=100)",
  "Top1 name","Top1 value","Top3 names",
  "Concentration flag","Flag reason","status"
]
results_df = results_df.reindex(columns=[c for c in preferred_cols if c in results_df.columns])



results_df.to_excel(filename, index=False)
print(f"Saved to {filename}")


# import json
# from pathlib import Path
# from datetime import datetime, timezone

# def write_site_json(results_df: pd.DataFrame, out_path: str):
#     payload = {
#         "generated_at_utc": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
#         "rows": results_df.to_dict(orient="records"),
#     }
#     p = Path(out_path)
#     p.parent.mkdir(parents=True, exist_ok=True)
#     p.write_text(json.dumps(payload, indent=2), encoding="utf-8")


# last_updated_utc = datetime.now(timezone.utc).isoformat()

# payload = {
#     "last_updated_utc": last_updated_utc,
#     "rows": results_df.to_dict(orient="records"),
# }

# # In a Vite app, anything in /public is served at site root
# results_json_path = Path("public/data/stock_conc_latest.json")
# results_json_path.parent.mkdir(parents=True, exist_ok=True)

# with open(results_json_path, "w", encoding="utf-8") as f:
#     json.dump(payload, f, ensure_ascii=False, indent=2)

# # results_df = pd.DataFrame(results)

# write_site_json(results_df, "public/data/stock_conc_latest.json")

# # keep Excel too if you want
# current_date = datetime.now().strftime("%Y%m%d")
# results_df.to_excel(f"public/data/{current_date}_stock_conc.xlsx", index=False)

# %%

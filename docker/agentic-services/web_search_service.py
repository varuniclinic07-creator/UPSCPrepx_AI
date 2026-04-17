from __future__ import annotations

import time
from urllib.parse import parse_qs, quote_plus, unquote, urlparse

import httpx
from bs4 import BeautifulSoup
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

WHITELISTED_DOMAINS = [
    "visionias.in",
    "drishtiias.com",
    "thehindu.com",
    "indianexpress.com",
    "pib.gov.in",
    "prs.org.in",
    "prsindia.org",
    "forumias.com",
    "iasgyan.in",
    "insightsonindia.com",
    "ncert.nic.in",
    "epathshala.nic.in",
    "nios.ac.in",
    "ignou.ac.in",
    "egyankosh.ac.in",
    "indiabudget.gov.in",
    "niti.gov.in",
    "upscpdf.com",
]


class SearchRequest(BaseModel):
    query: str | None = None
    q: str | None = None
    max_results: int = 10
    maxResults: int | None = None
    upsc_focused: bool = True
    time_range: str | None = None


def is_allowed_host(hostname: str) -> bool:
    hostname = (hostname or "").lower()
    return hostname == "gov.in" or hostname.endswith(".gov.in") or any(
        hostname == allowed or hostname.endswith(f".{allowed}") for allowed in WHITELISTED_DOMAINS
    )


def normalize_url(url: str) -> str:
    parsed = urlparse(url)
    if "duckduckgo.com" in parsed.netloc:
        uddg = parse_qs(parsed.query).get("uddg")
        if uddg:
            return unquote(uddg[0])
    return url


def relevance_for(url: str) -> float:
    host = (urlparse(url).hostname or "").lower()
    if host == "gov.in" or host.endswith(".gov.in") or any(token in host for token in ("pib", "prs")):
        return 0.95
    if any(token in host for token in ("thehindu", "indianexpress")):
        return 0.9
    if any(token in host for token in ("visionias", "drishtiias", "forumias", "insightsonindia", "iasgyan")):
        return 0.82
    if "ncert" in host or "epathshala" in host:
        return 0.88
    return 0.7


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.post("/search")
async def search(request: SearchRequest):
    started = time.time()
    query = (request.query or request.q or "").strip()
    limit = request.maxResults or request.max_results or 10

    if not query:
        return {"results": [], "query": query, "total_results": 0, "search_time_ms": 0}

    search_url = f"https://html.duckduckgo.com/html/?q={quote_plus(query)}"
    headers = {"User-Agent": "Mozilla/5.0 UPSCPrepX-AI/1.0"}

    try:
        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True, headers=headers) as client:
            response = await client.get(search_url)
            response.raise_for_status()

        soup = BeautifulSoup(response.text, "lxml")
        results = []
        for item in soup.select(".result"):
            anchor = item.select_one(".result__title a") or item.select_one("a.result__a")
            if not anchor:
                continue

            url = normalize_url(anchor.get("href", "").strip())
            if not url:
                continue

            hostname = urlparse(url).hostname or ""
            if request.upsc_focused and not is_allowed_host(hostname):
                continue

            snippet_el = item.select_one(".result__snippet")
            title = anchor.get_text(" ", strip=True)
            snippet = snippet_el.get_text(" ", strip=True) if snippet_el else ""
            results.append(
                {
                    "title": title,
                    "url": url,
                    "snippet": snippet,
                    "relevance_score": relevance_for(url),
                }
            )
            if len(results) >= limit:
                break

        return {
            "results": results,
            "query": query,
            "total_results": len(results),
            "search_time_ms": int((time.time() - started) * 1000),
        }
    except Exception as exc:
        return {
            "results": [],
            "query": query,
            "total_results": 0,
            "search_time_ms": int((time.time() - started) * 1000),
            "error": str(exc),
        }

from __future__ import annotations

from pathlib import Path
import re
from typing import Iterable

from docx import Document
from PyPDF2 import PdfReader

SUPPORTED_EXTENSIONS = {".txt", ".md", ".pdf", ".docx"}


def tokenize(text: str) -> list[str]:
    return [token for token in re.findall(r"[a-z0-9]+", (text or "").lower()) if len(token) > 1]


def classify_source_type(path: Path) -> str:
    value = str(path).lower()
    if "ncert" in value:
        return "ncert"
    if any(keyword in value for keyword in ("pib", "gov", "prs", "policy", "report")):
        return "government"
    if any(keyword in value for keyword in ("vision", "drishti", "forumias", "insight")):
        return "coaching"
    if any(keyword in value for keyword in ("survey", "commission", "committee")):
        return "report"
    return "standard_book"


def iter_material_files(root_path: str) -> Iterable[Path]:
    root = Path(root_path)
    if not root.exists():
      return []
    return [path for path in root.rglob("*") if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS]


def extract_text(path: Path, max_chars: int = 20000) -> str:
    suffix = path.suffix.lower()
    try:
        if suffix in {".txt", ".md"}:
            return path.read_text(encoding="utf-8", errors="ignore")[:max_chars]
        if suffix == ".pdf":
            reader = PdfReader(str(path))
            parts: list[str] = []
            for page in reader.pages[: min(10, len(reader.pages))]:
                parts.append(page.extract_text() or "")
            return "\n".join(parts)[:max_chars]
        if suffix == ".docx":
            document = Document(str(path))
            return "\n".join(paragraph.text for paragraph in document.paragraphs)[:max_chars]
    except Exception:
        return ""
    return ""


def build_excerpt(content: str, terms: list[str], max_chars: int = 320) -> str:
    text = " ".join((content or "").split())
    if not text:
        return ""

    lower_text = text.lower()
    start = 0
    for term in terms:
        idx = lower_text.find(term)
        if idx >= 0:
            start = max(0, idx - 80)
            break

    excerpt = text[start : start + max_chars]
    return excerpt.strip()


def score_match(title: str, content: str, terms: list[str]) -> float:
    if not terms:
        return 0.0

    title_lower = (title or "").lower()
    content_lower = (content or "").lower()
    score = 0.0
    for term in terms:
        if term in title_lower:
            score += 3.0
        score += min(content_lower.count(term), 6) * 0.5
    return score


def search_materials(query: str, root_path: str, max_results: int = 5) -> list[dict]:
    terms = tokenize(query)
    results: list[dict] = []

    for path in iter_material_files(root_path):
        content = extract_text(path)
        if not content:
            continue

        score = score_match(path.name, content, terms)
        if score <= 0:
            continue

        excerpt = build_excerpt(content, terms)
        results.append(
            {
                "path": path,
                "title": path.stem.replace("_", " ").replace("-", " "),
                "content": content,
                "excerpt": excerpt,
                "relevance_score": round(min(score / 10.0, 1.0), 3),
                "source_type": classify_source_type(path),
            }
        )

    results.sort(key=lambda item: item["relevance_score"], reverse=True)
    return results[:max_results]

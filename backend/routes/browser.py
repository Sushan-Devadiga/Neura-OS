from fastapi import APIRouter, HTTPException
import httpx
from bs4 import BeautifulSoup
from pydantic import BaseModel
import re

from typing import List, Optional

router = APIRouter()

class SearchResultItem(BaseModel):
    title: str
    url: str
    snippet: str
    icon: Optional[str] = None

class FetchResponse(BaseModel):
    title: str
    content: str
    url: str
    is_search: bool = False
    search_results: List[SearchResultItem] = []

@router.get("/fetch", response_model=FetchResponse)
async def fetch_page(url: str):
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=10.0) as client:
            # Add a basic user agent so sites don't block immediately
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
            response = await client.get(url, headers=headers)
            response.raise_for_status()

            # Parse with BeautifulSoup
            soup = BeautifulSoup(response.text, "html.parser")
            
            # Extract title
            title = soup.title.string if soup.title else url
            if title:
                title = title.strip()
            
            # Remove scripts, styles, forms, and other non-content tags
            for element in soup(["script", "style", "noscript", "header", "footer", "nav", "aside", "iframe", "svg", "form", "select", "button"]):
                element.decompose()
            
            # Custom parser for DuckDuckGo Search Results to make them look professional
            if "duckduckgo.com/html" in str(response.url):
                results = soup.find_all('div', class_='result')
                search_results = []
                for res in results:
                    a_tag = res.find('a', class_='result__a')
                    if not a_tag: continue
                    
                    title = a_tag.get_text(strip=True)
                    link = a_tag.get('href')
                    
                    snippet_elem = res.find('a', class_='result__snippet')
                    snippet = snippet_elem.get_text(strip=True) if snippet_elem else ""
                    
                    # Try to get an icon if available
                    icon = None
                    icon_elem = res.find('img', class_='result__icon__img')
                    if icon_elem and icon_elem.has_attr('src'):
                        icon = icon_elem['src']
                        if icon.startswith("//"):
                            icon = "https:" + icon
                    
                    # Clean up DuckDuckGo redirect URLs
                    if link and 'uddg=' in link:
                        import urllib.parse
                        parsed = urllib.parse.parse_qs(urllib.parse.urlparse(link).query)
                        if 'uddg' in parsed:
                            link = parsed['uddg'][0]

                    search_results.append(SearchResultItem(
                        title=title,
                        url=link,
                        snippet=snippet,
                        icon=icon
                    ))
                
                return FetchResponse(
                    title=title,
                    content="",
                    url=str(response.url),
                    is_search=True,
                    search_results=search_results
                )
            else:
                # Standard website parsing
                from markdownify import markdownify as md
                clean_text = md(str(soup), heading_style="ATX").strip()
                lines = [line.strip() for line in clean_text.splitlines() if line.strip()]
                clean_text = "\n\n".join(lines)
            
            return FetchResponse(
                title=title,
                content=clean_text,
                url=str(response.url)
            )
            
    except httpx.RequestError as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing page: {str(e)}")

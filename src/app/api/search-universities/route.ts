import { NextResponse } from 'next/server';

interface University {
  name: string;
  country: string;
  'state-province': string | null;
  domains?: string[];
  web_pages?: string[];
}

// Using multiple free APIs for comprehensive university data
const HIPOLABS_API = 'http://universities.hipolabs.com/search';
const GITHUB_UNIVERSITIES_API = 'https://raw.githubusercontent.com/Hipo/university-domains-list/master/world_universities_and_domains.json';

// Cache for GitHub data (to avoid repeated fetches)
let cachedUniversities: University[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const country = searchParams.get('country') || 'India';

  if (!query || query.length < 2) {
    return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
  }

  try {
    // Try multiple sources and merge results
    const results = await searchMultipleSources(query, country);
    
    // Remove duplicates and sort by relevance
    const uniqueResults = removeDuplicates(results);
    const sortedResults = sortByRelevance(uniqueResults, query);
    
    return NextResponse.json(sortedResults.slice(0, 15));
  } catch (error) {
    console.error('Error in university search:', error);
    
    // Emergency fallback - try direct Hipolabs
    try {
      const fallbackResults = await searchHipolabs(query, country);
      return NextResponse.json(fallbackResults);
    } catch {
      return NextResponse.json({ error: 'Failed to fetch universities' }, { status: 500 });
    }
  }
}

async function searchMultipleSources(query: string, country: string): Promise<University[]> {
  const results: University[] = [];

  // Source 1: Hipolabs API (fast, reliable)
  try {
    const hipolabsResults = await searchHipolabs(query, country);
    results.push(...hipolabsResults);
  } catch (error) {
    console.error('Hipolabs search failed:', error);
  }

  // Source 2: Cached GitHub data (comprehensive)
  try {
    const githubResults = await searchCachedUniversities(query, country);
    results.push(...githubResults);
  } catch (error) {
    console.error('GitHub data search failed:', error);
  }

  return results;
}

async function searchHipolabs(query: string, country: string): Promise<University[]> {
  const params = new URLSearchParams({
    name: query,
    country: country,
  });

  const response = await fetch(`${HIPOLABS_API}?${params}`, {
    next: { revalidate: 3600 }, // Cache for 1 hour
  });
  
  if (!response.ok) {
    throw new Error('Hipolabs API request failed');
  }

  return response.json();
}

async function searchCachedUniversities(query: string, country: string): Promise<University[]> {
  const now = Date.now();
  
  // Load from cache or fetch fresh data
  if (!cachedUniversities || (now - cacheTimestamp) > CACHE_DURATION) {
    try {
      const response = await fetch(GITHUB_UNIVERSITIES_API, {
        next: { revalidate: 3600 },
      });
      
      if (response.ok) {
        cachedUniversities = await response.json();
        cacheTimestamp = now;
      }
    } catch (error) {
      console.error('Failed to load cached universities:', error);
      return [];
    }
  }

  if (!cachedUniversities) return [];

  // Filter by country and search query
  const lowerQuery = query.toLowerCase();
  const filtered = cachedUniversities.filter((uni: University) => {
    const matchesCountry = uni.country === country;
    const matchesQuery = uni.name.toLowerCase().includes(lowerQuery);
    return matchesCountry && matchesQuery;
  });

  return filtered;
}

function removeDuplicates(universities: University[]): University[] {
  const seen = new Set<string>();
  const unique: University[] = [];

  for (const uni of universities) {
    const key = `${uni.name.toLowerCase()}-${uni.country}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(uni);
    }
  }

  return unique;
}

function sortByRelevance(universities: University[], query: string): University[] {
  const lowerQuery = query.toLowerCase();

  return universities.sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();

    // Exact match first
    if (aName === lowerQuery) return -1;
    if (bName === lowerQuery) return 1;

    // Starts with query
    const aStarts = aName.startsWith(lowerQuery);
    const bStarts = bName.startsWith(lowerQuery);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;

    // Contains query (already filtered, so just alphabetical)
    return aName.localeCompare(bName);
  });
}

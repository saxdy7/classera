import { NextResponse } from 'next/server';

interface University {
  name: string;
  country: string;
  'state-province': string | null;
  domains?: string[];
  web_pages?: string[];
  type?: string;
  ugcApproved?: boolean;
}

// External APIs for Indian Universities
const HIPOLABS_API = 'http://universities.hipolabs.com/search'; // Real-time search for 9,500+ universities
const OPENDATASOFT_API = 'https://public.opendatasoft.com/api/records/1.0/search/'; // 25,000+ universities worldwide

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const country = searchParams.get('country') || 'India';

  if (!query || query.length < 2) {
    return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
  }

  try {
    // Search Indian universities from multiple sources:
    // 1. OpenDataSoft API for 25,000+ universities with rankings
    // 2. Hipolabs API for real-time search
    const results = await searchIndianUniversities(query);
    
    // Remove duplicates and sort by relevance
    const uniqueResults = removeDuplicates(results);
    const sortedResults = sortByRelevance(uniqueResults, query);
    
    return NextResponse.json(sortedResults.slice(0, 20)); // Return top 20
  } catch (error) {
    console.error('Error in university search:', error);
    return NextResponse.json({ error: 'Failed to fetch universities' }, { status: 500 });
  }
}

async function searchIndianUniversities(query: string): Promise<University[]> {
  const results: University[] = [];

  // Source 1: OpenDataSoft API (25,000+ universities with rankings)
  try {
    const openDataResults = await searchOpenDataSoft(query);
    results.push(...openDataResults);
  } catch (error) {
    console.error('OpenDataSoft search failed:', error);
  }

  // Source 2: Hipolabs API (real-time search for 9,500+ universities)
  try {
    const hipolabsResults = await searchHipolabs(query);
    results.push(...hipolabsResults);
  } catch (error) {
    console.error('Hipolabs search failed:', error);
  }

  return results;
}

async function searchOpenDataSoft(query: string): Promise<University[]> {
  const params = new URLSearchParams({
    dataset: 'world-university-rankings',
    q: `${query} AND country:"India"`,
    rows: '50',
  });

  const response = await fetch(`${OPENDATASOFT_API}?${params}`, {
    next: { revalidate: 3600 }, // Cache for 1 hour
  });
  
  if (!response.ok) {
    throw new Error('OpenDataSoft API request failed');
  }

  const data = await response.json();
  
  // Transform OpenDataSoft format to our format
  return data.records.map((record: any) => ({
    name: record.fields.university_name || record.fields.institution,
    country: 'India',
    'state-province': record.fields.location || null,
    web_pages: record.fields.link ? [record.fields.link] : [],
    type: 'University',
  }));
}

async function searchHipolabs(query: string): Promise<University[]> {
  const params = new URLSearchParams({
    name: query,
    country: 'India',
  });

  const response = await fetch(`${HIPOLABS_API}?${params}`, {
    next: { revalidate: 3600 }, // Cache for 1 hour
  });
  
  if (!response.ok) {
    throw new Error('Hipolabs API request failed');
  }

  return response.json();
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

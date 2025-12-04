import { NextResponse } from 'next/server';

interface SerpAPIUniversity {
  title: string;
  link?: string;
  snippet?: string;
  location?: string;
}

interface UniversityResult {
  name: string;
  country: string;
  'state-province': string | null;
  link?: string;
  description?: string;
}


const SERPAPI_KEY = process.env.SERPAPI_API_KEY;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const country = searchParams.get('country') || 'India';

  if (!query || query.length < 2) {
    return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
  }

  if (!SERPAPI_KEY) {
    console.error('SERPAPI_API_KEY is not configured');
    return NextResponse.json({ error: 'Search service not configured' }, { status: 500 });
  }

  try {
    // Search for universities using Google Search via SerpAPI
    const searchQuery = `${query} university ${country}`;
    const serpApiUrl = new URL('https://serpapi.com/search.json');
    serpApiUrl.searchParams.append('q', searchQuery);
    serpApiUrl.searchParams.append('api_key', SERPAPI_KEY);
    serpApiUrl.searchParams.append('engine', 'google');
    serpApiUrl.searchParams.append('num', '20'); // Get more results
    serpApiUrl.searchParams.append('gl', country.toLowerCase() === 'india' ? 'in' : 'us');
    serpApiUrl.searchParams.append('hl', 'en');

    const response = await fetch(serpApiUrl.toString(), {
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (!response.ok) {
      throw new Error(`SerpAPI request failed: ${response.status}`);
    }

    const data = await response.json();

    // Extract university information from organic results
    const universities: UniversityResult[] = [];

    // Process organic results
    if (data.organic_results) {
      for (const result of data.organic_results) {
        // Filter for actual university results
        if (isUniversityResult(result.title, result.snippet)) {
          const university = parseUniversityResult(result, country);
          if (university && !isDuplicate(universities, university)) {
            universities.push(university);
          }
        }
      }
    }

    // Process knowledge graph if available
    if (data.knowledge_graph && data.knowledge_graph.title) {
      const kgTitle = data.knowledge_graph.title;
      if (isUniversityResult(kgTitle, data.knowledge_graph.description)) {
        const university: UniversityResult = {
          name: cleanUniversityName(kgTitle),
          country: country,
          'state-province': extractLocation(data.knowledge_graph.address || ''),
          link: data.knowledge_graph.website || data.knowledge_graph.link,
          description: data.knowledge_graph.description,
        };
        if (!isDuplicate(universities, university)) {
          universities.unshift(university); // Add at the beginning
        }
      }
    }

    // Sort by relevance
    const sortedResults = sortByRelevance(universities, query);

    return NextResponse.json(sortedResults.slice(0, 15));
  } catch (error) {
    console.error('Error in SerpAPI university search:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch universities from SerpAPI',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function isUniversityResult(title: string, snippet?: string): boolean {
  const lowerTitle = title.toLowerCase();
  const lowerSnippet = snippet?.toLowerCase() || '';
  
  const universityKeywords = [
    'university',
    'college',
    'institute',
    'institution',
    'academy',
    'school of',
  ];

  const excludeKeywords = [
    'news',
    'ranking',
    'admission',
    'course',
    'program',
    'wikipedia',
    'list of',
  ];

  // Must contain university-related keywords
  const hasUniversityKeyword = universityKeywords.some(
    keyword => lowerTitle.includes(keyword) || lowerSnippet.includes(keyword)
  );

  // Should not contain exclude keywords in title
  const hasExcludeKeyword = excludeKeywords.some(keyword => lowerTitle.includes(keyword));

  return hasUniversityKeyword && !hasExcludeKeyword;
}

function cleanUniversityName(name: string): string {
  // Remove common suffixes and prefixes
  let cleaned = name
    .replace(/\s*-\s*Wikipedia.*$/i, '')
    .replace(/\s*\|\s*.*$/i, '')
    .replace(/\s*>.*$/i, '')
    .replace(/Official Website/gi, '')
    .replace(/Homepage/gi, '')
    .trim();

  return cleaned;
}

function extractLocation(address: string): string | null {
  if (!address) return null;
  
  // Try to extract state/province from address
  const parts = address.split(',').map(p => p.trim());
  
  // Usually state is second to last (before country)
  if (parts.length >= 2) {
    return parts[parts.length - 2];
  }
  
  return parts[0] || null;
}

function parseUniversityResult(result: SerpAPIUniversity, country: string): UniversityResult | null {
  const name = cleanUniversityName(result.title);
  
  if (!name) return null;

  // Try to extract location from snippet
  let location: string | null = null;
  if (result.location) {
    location = result.location;
  } else if (result.snippet) {
    // Try to find location in snippet (e.g., "located in Delhi", "Mumbai, India")
    const locationMatch = result.snippet.match(/(?:located in|based in|in)\s+([A-Z][a-zA-Z\s]+),/);
    if (locationMatch) {
      location = locationMatch[1].trim();
    }
  }

  return {
    name,
    country,
    'state-province': location,
    link: result.link,
    description: result.snippet,
  };
}

function isDuplicate(universities: UniversityResult[], newUni: UniversityResult): boolean {
  return universities.some(
    uni => uni.name.toLowerCase() === newUni.name.toLowerCase()
  );
}

function sortByRelevance(universities: UniversityResult[], query: string): UniversityResult[] {
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

    // Word boundary match (e.g., "MIT" matches "Massachusetts Institute of Technology")
    const aWords = aName.split(/\s+/);
    const bWords = bName.split(/\s+/);
    const aWordMatch = aWords.some(word => word.startsWith(lowerQuery));
    const bWordMatch = bWords.some(word => word.startsWith(lowerQuery));
    if (aWordMatch && !bWordMatch) return -1;
    if (!aWordMatch && bWordMatch) return 1;

    // Contains query
    const aContains = aName.includes(lowerQuery);
    const bContains = bName.includes(lowerQuery);
    if (aContains && !bContains) return -1;
    if (!aContains && bContains) return 1;

    // Alphabetical
    return aName.localeCompare(bName);
  });
}

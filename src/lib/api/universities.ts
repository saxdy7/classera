// University Search API - Types and utilities
// Uses multiple free sources for comprehensive real university data

export interface University {
  name: string;
  country: string;
  'state-province': string | null;
  domains?: string[];
  web_pages?: string[];
  alpha_two_code?: string;
}

/**
 * Search universities by name
 * Uses our API route that combines multiple free data sources
 */
export async function searchUniversities(
  query: string,
  country: string = 'India'
): Promise<University[]> {
  try {
    const response = await fetch(
      `/api/search-universities?query=${encodeURIComponent(query)}&country=${country}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch universities');
    }

    const universities: University[] = await response.json();
    return universities;
  } catch (error) {
    console.error('Error fetching universities:', error);
    return [];
  }
}

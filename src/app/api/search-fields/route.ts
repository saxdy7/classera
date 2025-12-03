import { NextRequest, NextResponse } from 'next/server';
import { searchFieldsOfStudy } from '@/lib/api/fields-of-study';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    const results = searchFieldsOfStudy(query, limit);

    return NextResponse.json({
      results,
      count: results.length,
    });
  } catch (error) {
    console.error('Field of study search error:', error);
    return NextResponse.json(
      { error: 'Failed to search fields of study' },
      { status: 500 }
    );
  }
}

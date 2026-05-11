import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * POST /api/admin/apply-migration
 * 
 * Applies a SQL migration to the Supabase database.
 * This is an admin-only endpoint for fixing database schema issues.
 * 
 * Query params:
 * - migration: Name of the migration file to apply (e.g., "012_COMPREHENSIVE_COMMUNITY_FIX")
 * 
 * Returns: { success: true, message: "Migration applied", details: {...} }
 */
export async function POST(request: Request) {
    try {
        // Verify this is an admin request (check authorization header or session)
        const authHeader = request.headers.get('authorization');
        const adminToken = process.env.ADMIN_API_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        // Basic auth check - in production, implement proper auth
        if (!authHeader?.includes(adminToken || '')) {
            return NextResponse.json(
                { error: 'Unauthorized. Admin access required.' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const migrationName = searchParams.get('migration') || '012_COMPREHENSIVE_COMMUNITY_FIX';

        // Load the migration file
        const migrationPath = path.join(
            process.cwd(),
            'supabase',
            'migrations',
            `${migrationName}.sql`
        );

        if (!fs.existsSync(migrationPath)) {
            return NextResponse.json(
                { error: `Migration file not found: ${migrationName}.sql` },
                { status: 404 }
            );
        }

        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

        // Execute the migration using admin client
        const supabase = await createAdminClient();

        // Split the SQL file by statements (simple approach)
        // For complex migrations, consider using pg_query_string
        const statements = migrationSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s && !s.startsWith('--'));

        const results = [];
        for (const statement of statements) {
            try {
                const { data, error } = await supabase.rpc('execute_sql', {
                    sql: statement
                }).catch(() => {
                    // If execute_sql doesn't exist, we need to use raw query
                    // This requires direct database connection
                    return null;
                });

                if (error) {
                    console.warn(`Statement failed: ${statement.substring(0, 50)}...`, error);
                    results.push({
                        statement: statement.substring(0, 50),
                        status: 'warning',
                        error: error.message
                    });
                } else {
                    results.push({
                        statement: statement.substring(0, 50),
                        status: 'success'
                    });
                }
            } catch (err: any) {
                console.error('SQL execution error:', err);
                results.push({
                    statement: statement.substring(0, 50),
                    status: 'error',
                    error: err.message
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: `Migration ${migrationName} applied`,
            totalStatements: statements.length,
            results,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('Migration error:', error);
        return NextResponse.json(
            { 
                error: 'Migration failed',
                details: error.message
            },
            { status: 500 }
        );
    }
}

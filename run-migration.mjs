import postgres from 'postgres';
import fs from 'fs';

// Direct connection to Supabase (using correct region aws-1)
const connectionString = 'postgresql://postgres.kfkchlnybkizhqdhztye:VXbl2vEGF1Rvb9LC@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require';

const sql = postgres(connectionString, {
  ssl: 'require',
  idle_timeout: 20,
  max_lifetime: 60 * 30
});

async function runMigration() {
  try {
    const migrationSql = fs.readFileSync('./supabase/migrations/012_comments_ideas_tables.sql', 'utf8');
    
    console.log('Running migration 012_comments_ideas_tables.sql...');
    console.log('---');
    
    await sql.unsafe(migrationSql);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify tables were created
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('comments', 'ideas', 'idea_votes')
    `;
    
    console.log('\\nCreated tables:', tables.map(t => t.table_name).join(', '));
    
  } catch (error) {
    console.error('Error running migration:', error.message);
    if (error.message.includes('already exists')) {
      console.log('\\n⚠️  Some objects already exist - migration may have been partially applied before.');
    }
  } finally {
    await sql.end();
  }
}

runMigration();


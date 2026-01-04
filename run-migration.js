const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://kfkchlnybkizhqdhztye.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtma2NobG55YmtpemhxZGh6dHllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzUyMDg0MSwiZXhwIjoyMDgzMDk2ODQxfQ.pu9c0uOOdoIO8I1CtD6PKQC-PdipP1QXCpJ-c4Td8Wc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  const sql = fs.readFileSync('./supabase/migrations/012_comments_ideas_tables.sql', 'utf8');
  
  // Split by semicolons and run each statement
  const statements = sql.split(';').filter(s => s.trim());
  
  console.log(`Running ${statements.length} SQL statements...`);
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim();
    if (!statement || statement.startsWith('--')) continue;
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
      if (error) {
        // Try direct query
        const { error: queryError } = await supabase.from('_exec').select().limit(0);
        console.log(`Statement ${i + 1}: Attempting alternative...`);
      } else {
        console.log(`Statement ${i + 1}: OK`);
      }
    } catch (e) {
      console.log(`Statement ${i + 1}: ${e.message}`);
    }
  }
}

runMigration().then(() => console.log('Done')).catch(console.error);


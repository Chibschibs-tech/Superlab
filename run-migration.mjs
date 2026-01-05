import pg from "pg";

// ⚠️ Replace YOUR_PASSWORD with your actual Supabase database password
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:YOUR_PASSWORD@db.kfkchlnybkizhqdhztye.supabase.co:5432/postgres";

const migrationSQL = `
-- 1. Rename 'url' column to 'file_url' if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'project_assets' 
    AND column_name = 'url'
  ) THEN
    ALTER TABLE public.project_assets RENAME COLUMN url TO file_url;
    RAISE NOTICE 'Renamed url to file_url';
  ELSE
    RAISE NOTICE 'Column file_url already exists or url does not exist';
  END IF;
END $$;

-- 2. Add 'is_public' column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'project_assets' 
    AND column_name = 'is_public'
  ) THEN
    ALTER TABLE public.project_assets 
    ADD COLUMN is_public BOOLEAN DEFAULT false NOT NULL;
    RAISE NOTICE 'Added is_public column';
  ELSE
    RAISE NOTICE 'Column is_public already exists';
  END IF;
END $$;

-- 3. Add 'is_featured' column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'project_assets' 
    AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE public.project_assets 
    ADD COLUMN is_featured BOOLEAN DEFAULT false NOT NULL;
    RAISE NOTICE 'Added is_featured column';
  ELSE
    RAISE NOTICE 'Column is_featured already exists';
  END IF;
END $$;

-- 4. Ensure 'uploaded_by' column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'project_assets' 
    AND column_name = 'uploaded_by'
  ) THEN
    ALTER TABLE public.project_assets 
    ADD COLUMN uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added uploaded_by column';
  ELSE
    RAISE NOTICE 'Column uploaded_by already exists';
  END IF;
END $$;

-- 5. Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_project_assets_public 
ON public.project_assets(is_public) WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_project_assets_featured 
ON public.project_assets(is_featured) WHERE is_featured = true;
`;

async function runMigration() {
  console.log("🔄 Running project_assets schema migration on Supabase...\n");
  
  if (DATABASE_URL.includes("YOUR_PASSWORD")) {
    console.error("❌ Please set DATABASE_URL environment variable with your actual password");
    console.log("\nRun: set DATABASE_URL=postgresql://postgres:ACTUAL_PASSWORD@db.kfkchlnybkizhqdhztye.supabase.co:5432/postgres");
    console.log("Then: node run-migration.mjs");
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("📡 Connecting to Supabase...");
    await client.connect();
    console.log("✅ Connected!\n");

    // Check current columns before migration
    const beforeResult = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'project_assets'
      ORDER BY ordinal_position;
    `);
    console.log("📋 Current columns:", beforeResult.rows.map(r => r.column_name).join(", "));
    console.log();

    // Run migration
    console.log("⚡ Running migration...\n");
    await client.query(migrationSQL);

    // Check columns after migration
    const afterResult = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'project_assets'
      ORDER BY ordinal_position;
    `);
    console.log("📋 Columns after migration:", afterResult.rows.map(r => r.column_name).join(", "));
    
    console.log("\n✅ Migration completed successfully!");
    
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();

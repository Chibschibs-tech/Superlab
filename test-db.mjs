import postgres from 'postgres';

const connectionString = 'postgresql://postgres.kfkchlnybkizhqdhztye:VXbl2vEGF1Rvb9LC@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require';
const sql = postgres(connectionString, { ssl: 'require' });

async function testDatabase() {
  try {
    console.log('Testing Supabase database connection...\n');

    // Get the admin user
    const users = await sql`
      SELECT id, email, role FROM public.users WHERE email = 'ch.jabri@supermedia.ma'
    `;

    if (users.length === 0) {
      console.log('❌ Admin user not found!');
      return;
    }

    const adminUser = users[0];
    console.log('✅ Admin user found:', adminUser.email, '- Role:', adminUser.role);

    // Get a category
    const cats = await sql`SELECT id, name FROM public.categories LIMIT 1`;
    if (cats.length === 0) {
      console.log('❌ No categories found!');
      return;
    }
    console.log('✅ Category:', cats[0].name);

    // Try to insert a test project
    console.log('\n🧪 Testing project insert...');
    
    const testProject = await sql`
      INSERT INTO public.projects (
        title, slug, description, status, visibility, tags, owner_id, category_id, highlights
      ) VALUES (
        'Test Project',
        ${'test-project-' + Date.now()},
        'Test description',
        'Idea',
        'Org',
        ARRAY['test'],
        ${adminUser.id},
        ${cats[0].id},
        '[]'::jsonb
      )
      RETURNING id, title, slug
    `;

    console.log('✅ Project created successfully!');
    console.log('   ID:', testProject[0].id);
    console.log('   Slug:', testProject[0].slug);

    // Try to insert project_members
    console.log('\n🧪 Testing project_members insert...');
    await sql`
      INSERT INTO public.project_members (project_id, user_id, role, added_by)
      VALUES (${testProject[0].id}, ${adminUser.id}, 'lead', ${adminUser.id})
    `;
    console.log('✅ Project member added!');

    // Try to insert update
    console.log('\n🧪 Testing updates insert...');
    await sql`
      INSERT INTO public.updates (project_id, author_id, content, type)
      VALUES (${testProject[0].id}, ${adminUser.id}, 'Test update', 'General')
    `;
    console.log('✅ Update created!');

    // Clean up - delete test project
    console.log('\n🧹 Cleaning up test data...');
    await sql`DELETE FROM public.projects WHERE id = ${testProject[0].id}`;
    console.log('✅ Test project deleted');

    console.log('\n✅ All database operations work correctly!');
    console.log('   The issue is likely browser cache or Vercel deployment.');
    console.log('   Try: Hard refresh (Ctrl+Shift+R) or wait for Vercel to redeploy.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('   Code:', error.code);
  } finally {
    await sql.end();
  }
}

testDatabase();

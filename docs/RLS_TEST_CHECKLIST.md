# RLS Security Test Checklist

## Test Setup
Create test users with different roles:
- **Owner**: ch.jabri@supermedia.ma
- **Viewer**: test-viewer@example.com (role = 'Viewer')
- **Editor**: test-editor@example.com (role = 'Editor')

## A) Revenue Access Tests

| Test | Expected | User |
|------|----------|------|
| View /revenue page | ✅ Can see all revenue data | Viewer |
| View /revenue page | ✅ Can see all revenue data | Editor |
| View /revenue page | ✅ Can see all revenue data | Owner |
| Import CSV (INSERT revenue_entries) | ❌ Fails silently or error | Viewer |
| Import CSV (INSERT revenue_entries) | ❌ Fails silently or error | Editor |
| Import CSV (INSERT revenue_entries) | ✅ Success | Owner |

### SQL Test
```sql
-- As Viewer, this should return data:
SELECT COUNT(*) FROM revenue_entries;

-- As Viewer, this should fail:
INSERT INTO revenue_entries (stream_id, source_id, date, type, amount, currency)
VALUES ('...', '...', NOW(), 'sale', 100, 'EUR');
```

## B) Users Table Privacy Tests

| Test | Expected | User |
|------|----------|------|
| `SELECT * FROM users` | Returns ONLY self | Viewer |
| `SELECT * FROM users` | Returns ALL users | Owner |
| View /admin/users page | ❌ 404 or redirect | Viewer |
| View /admin/users page | ✅ Shows all users | Owner |

### SQL Test
```sql
-- As Viewer (user_id = 'xxx'), should return 1 row (self):
SELECT COUNT(*) FROM users;

-- As Owner, should return all users:
SELECT COUNT(*) FROM users;
```

## C) Project Assets Security Tests

| Test | Expected | User |
|------|----------|------|
| View assets on project user is member of | ✅ Can see | Viewer |
| View assets on project user is NOT member of (Private) | ❌ 0 rows | Viewer |
| View assets on Org-visible project | ✅ Can see | Viewer |
| Upload asset to project user can edit | ✅ Success | Editor |
| Upload asset to project user cannot edit | ❌ Fails | Viewer |

### SQL Test
```sql
-- Create a private project, don't add Viewer as member
-- As Viewer:
SELECT * FROM project_assets WHERE project_id = 'private-project-id';
-- Expected: 0 rows

-- As project member:
SELECT * FROM project_assets WHERE project_id = 'member-project-id';
-- Expected: Returns assets
```

## D) Project Creation Tests

| Test | Expected | User |
|------|----------|------|
| Create new project via UI | ❌ "Nouveau projet" button hidden or fails | Viewer |
| Create new project via UI | ✅ Success + auto-added as lead | Editor |
| Create new project via UI | ✅ Success | Owner |

### SQL Test
```sql
-- As Viewer:
INSERT INTO projects (title, slug, owner_id, visibility)
VALUES ('Test', 'test', auth.uid(), 'Private');
-- Expected: FAIL (RLS policy violation)

-- As Editor:
INSERT INTO projects (title, slug, owner_id, visibility)
VALUES ('Test', 'test', auth.uid(), 'Private');
-- Expected: SUCCESS
```

## E) Consistency Tests - Project-Related Tables

### Milestones
| Test | Expected | User |
|------|----------|------|
| View milestones on accessible project | ✅ Can see | Viewer (member) |
| View milestones on inaccessible project | ❌ 0 rows | Viewer (non-member) |
| Create milestone | ✅ Success | Editor (member) |
| Create milestone | ❌ Fails | Viewer (member) |

### Decisions
| Test | Expected | User |
|------|----------|------|
| View decisions | ✅ If can_view_project | Any |
| Create decision | ✅ If can_edit_project | Editor |
| Update decision status | ❌ Fails | Editor |
| Update decision status | ✅ Success | Owner |

### Comments & Ideas
| Test | Expected | User |
|------|----------|------|
| View comments on accessible project | ✅ | Viewer (member) |
| Post comment on accessible project | ✅ | Viewer (member) |
| Post comment on inaccessible project | ❌ | Viewer (non-member) |

## Quick Verification Commands

Run these in Supabase SQL Editor with different user tokens:

```sql
-- Test as specific user (replace with actual user ID)
SET request.jwt.claim.sub = 'user-uuid-here';

-- 1. Revenue (should work for all)
SELECT COUNT(*) FROM revenue_entries;

-- 2. Users (should only see self unless admin)
SELECT id, email, role FROM users;

-- 3. Private project assets (should fail for non-members)
SELECT * FROM project_assets 
WHERE project_id IN (
  SELECT id FROM projects WHERE visibility = 'Private'
);

-- 4. Org-visible projects (should work for all authenticated)
SELECT * FROM projects WHERE visibility = 'Org';
```

## Post-Migration Verification

After running migration `016_rls_security_alignment.sql`:

1. [ ] Login as Viewer → can see /revenue
2. [ ] Login as Viewer → cannot see other users in /admin/users (page should be hidden/404)
3. [ ] Login as Viewer → cannot see private project assets they're not member of
4. [ ] Login as Editor → can create projects
5. [ ] Login as Owner → can update decision status
6. [ ] Login as Owner → can see all users
7. [ ] Existing project creation flow still works (project_members row created)


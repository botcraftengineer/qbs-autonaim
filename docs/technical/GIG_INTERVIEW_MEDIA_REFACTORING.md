# Gig Interview Media Refactoring

## Overview

Replaced the `interviewMediaFileIds` JSONB array field with a proper join table to enforce referential integrity between gigs and media files.

## Changes Made

### 1. Database Schema

#### New Join Table (`packages/db/src/schema/gig/gig-interview-media.ts`)
- Created `gigInterviewMedia` table with composite primary key on `(gigId, fileId)`
- Added foreign keys with `onDelete: "cascade"` to both `gig.id` and `file.id`
- Added indexes on both `gigId` and `fileId` for query performance
- Includes `createdAt` timestamp for audit trail

#### Updated Gig Schema (`packages/db/src/schema/gig/gig.ts`)
- Removed `interviewMediaFileIds` JSONB field
- Removed `interviewMediaFileIds` from `UpdateGigSettingsSchema`

#### Updated Relations (`packages/db/src/schema/gig/relations.ts`)
- Added `interviewMedia` relation to `gigRelations`
- Created `gigInterviewMediaRelations` for bidirectional relations

### 2. API Layer

#### Update Gig Router (`packages/api/src/routers/gig/update.ts`)
- Modified to handle interview media through join table
- Uses transaction to delete old associations and insert new ones
- Extended input schema to accept `interviewMediaFileIds` array
- Maintains atomicity of media file updates

#### Get Interview Media Router (`packages/api/src/routers/files/get-interview-media.ts`)
- Updated to query through `gigInterviewMedia` join table
- Uses Drizzle relations to fetch associated files
- Generates presigned URLs for media access

### 3. Business Logic

#### Interview Service (`packages/jobs/src/services/interview/interview-service.ts`)
- Updated to fetch media files through join table
- Added `id` field to gig type definition
- Uses Drizzle query with relations for efficient data fetching

### 4. Frontend

#### Gig Interview Settings Component (`apps/app/src/components/gig/gig-interview-settings.tsx`)
- Updated to work with new API structure
- Fetches media files independently from gig data
- Maintains backward compatibility with existing UI

## Benefits

### Referential Integrity
- Database enforces that all file IDs in the join table exist in the `files` table
- Cascade deletes prevent orphaned records
- No more dangling file IDs

### Performance
- Indexed foreign keys for fast lookups
- Efficient joins using Drizzle relations
- Better query optimization by database

### Maintainability
- Standard relational pattern
- Type-safe queries with Drizzle ORM
- Clear data model

### Data Consistency
- Atomic updates through transactions
- No partial state during updates
- Guaranteed consistency

## Migration Notes

**No migration file created** (per project standards)

Existing data in `interviewMediaFileIds` JSONB field will need to be migrated manually:

```sql
-- Example migration query (run manually if needed)
INSERT INTO gig_interview_media (gig_id, file_id)
SELECT 
  g.id as gig_id,
  jsonb_array_elements_text(g.interview_media_file_ids)::uuid as file_id
FROM gigs g
WHERE g.interview_media_file_ids IS NOT NULL
  AND jsonb_array_length(g.interview_media_file_ids) > 0;

-- After migration, drop the old column
ALTER TABLE gigs DROP COLUMN interview_media_file_ids;
```

## Testing Checklist

- [ ] Upload media files for a gig
- [ ] View media files in gig settings
- [ ] Update media files (add/remove)
- [ ] Delete a gig (verify cascade delete)
- [ ] Delete a file used in gig media (verify cascade delete)
- [ ] Interview bot receives media files correctly
- [ ] Presigned URLs are generated correctly

## API Changes

### Input Schema Change
```typescript
// Before
UpdateGigSettingsSchema = z.object({
  customBotInstructions: z.string().max(5000).nullish(),
  customScreeningPrompt: z.string().max(5000).nullish(),
  customInterviewQuestions: z.string().max(5000).nullish(),
  interviewMediaFileIds: z.array(z.string().uuid()).nullish(),
});

// After
UpdateGigSettingsSchema = z.object({
  customBotInstructions: z.string().max(5000).nullish(),
  customScreeningPrompt: z.string().max(5000).nullish(),
  customInterviewQuestions: z.string().max(5000).nullish(),
});

// Extended in router with:
.extend({
  interviewMediaFileIds: z.array(z.string().uuid()).nullish(),
})
```

### Query Changes
```typescript
// Before
const fileIds = gig.interviewMediaFileIds;
const files = await db.query.file.findMany({
  where: (files, { inArray }) => inArray(files.id, fileIds),
});

// After
const mediaRecords = await db.query.gigInterviewMedia.findMany({
  where: eq(gigInterviewMedia.gigId, gigId),
  with: { file: true },
});
```

# Remaining Migration Fixes

## Critical Issues to Fix

### 1. Import Source Enum Values
Replace old enum values with new ones:
- `"FREELANCE_MANUAL"` → `"MANUAL"`
- `"FREELANCE_LINK"` → `"WEB_LINK"`

Files affected:
- src/routers/freelance-platforms/import-bulk-responses.ts
- src/routers/freelance-platforms/import-single-response.ts
- src/routers/freelance-platforms/retry-bulk-import.ts
- src/routers/freelance-platforms/start-interview.ts
- src/routers/freelance-platforms/start-web-interview.ts

### 2. Remove platformProfileUrl Field
The `platformProfileUrl` field doesn't exist in the universal response schema.
Use `profileUrl` instead.

Files affected:
- src/routers/freelance-platforms/delete-vacancy.ts
- src/routers/freelance-platforms/import-bulk-responses.ts
- src/routers/freelance-platforms/import-single-response.ts
- src/routers/freelance-platforms/retry-bulk-import.ts
- src/routers/freelance-platforms/start-interview.ts
- src/routers/freelance-platforms/start-web-interview.ts

### 3. Fix InterviewLink.vacancyId → entityId
The InterviewLink interface in interview-link-generator.ts still uses `vacancyId`.
Update the interface and all usages to use `entityId`.

Files affected:
- src/services/interview-link-generator.ts (interface definition)
- src/routers/freelance-platforms/start-interview.ts
- src/utils/interview-token-validator.ts

### 4. Fix import type Issues
Change `import type` to regular `import` for:
- src/routers/funnel/update-stage.ts
- src/routers/funnel/list.ts (also needs to import `response`)

### 5. Fix Missing Relations
Relations like `response.vacancy`, `response.screening`, `response.conversation` don't exist.
Query them separately using:
```typescript
const vacancy = await ctx.db.query.vacancy.findFirst({
  where: eq(vacancyTable.id, response.entityId)
});
```

Files needing separate queries:
- All files accessing `response.vacancy.workspaceId`
- All files accessing `response.screening.*`
- All files accessing `response.conversation.*`
- All files accessing `response.interviewScoring.*`

### 6. Fix Type Annotations
Add proper types to callback parameters to avoid implicit 'any':
```typescript
// Before
where: (response, { eq }) => ...

// After  
where: (r, { eq }: { eq: any }) => ...
```

### 7. Missing `and` Import
src/routers/vacancy/list.ts and src/routers/vacancy/responses/list-recent.ts need to import `and` from drizzle-orm.

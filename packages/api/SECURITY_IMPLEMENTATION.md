# Security Implementation for Interview TRPC Endpoints

## Overview
This document describes the security improvements implemented for the interview TRPC endpoints to prevent unauthorized access to sensitive data.

## Changes Made

### 1. Token Validation Utility (`packages/api/src/utils/interview-token-validator.ts`)

Created a comprehensive token validation utility with the following functions:

- **`validateInterviewToken()`**: Validates interview tokens from both vacancy and gig interview links, checking:
  - Token existence and format
  - Token active status
  - Token expiration date
  - Returns validated token information including type (vacancy/gig) and entity ID

- **`hasVacancyAccess()`**: Checks if a validated token has access to a specific vacancy

- **`hasGigAccess()`**: Checks if a validated token has access to a specific gig

- **`hasConversationAccess()`**: Comprehensive access check for conversations supporting:
  - Token-based access (interview participants)
  - User-based access (workspace members)
  - Validates through vacancy/gig responses and workspace membership

- **`extractTokenFromHeaders()`**: Extracts tokens from HTTP headers supporting:
  - `Authorization: Bearer <token>` header
  - `x-interview-token: <token>` custom header

- **`requireConversationAccess()`**: Middleware helper that throws TRPC errors if access is denied

### 2. TRPC Context Enhancement (`packages/api/src/trpc.ts`)

Updated `createTRPCContext` to:
- Extract interview tokens from request headers
- Validate tokens automatically during context creation
- Add `interviewToken` to context (nullable)
- Gracefully handle token validation errors without blocking requests

Added new procedure type:
- **`interviewTokenProcedure`**: Requires a valid interview token, similar to `protectedProcedure` but for interview participants

### 3. Interview App Route (`apps/interview/src/app/api/trpc/[trpc]/route.ts`)

Fixed the security vulnerability:
- Changed from `auth: null` to `auth` (proper auth instance)
- Now properly validates both user sessions and interview tokens

### 4. Secured Endpoints

#### `checkDuplicateResponse`
- Requires either a valid interview token for the vacancy OR authenticated user with workspace access
- Validates workspace membership for authenticated users
- Prevents unauthorized duplicate checking

#### `getChatHistory`
- Requires conversation access via token or user authentication
- Validates token ownership of the conversation
- Validates workspace membership for authenticated users
- Logs access for audit purposes

#### `getInterviewContext`
- Requires conversation access via token or user authentication
- Validates token ownership of the conversation
- Validates workspace membership for authenticated users
- Returns vacancy or gig context only if authorized

#### `sendChatMessage`
- Requires conversation access via token or user authentication
- Validates token ownership of the conversation
- Validates workspace membership for authenticated users
- Ensures conversation is active before accepting messages

## Security Model

### Access Levels

1. **Interview Participant (Token-based)**:
   - Has valid interview token from link
   - Can access only their own conversation
   - Can view chat history, interview context, and send messages
   - Cannot check duplicates for other vacancies

2. **Workspace Member (User-based)**:
   - Authenticated user with workspace membership
   - Can access all conversations in their workspace
   - Can check duplicates for vacancies in their workspace
   - Full access to interview data for their workspace

3. **Public (No access)**:
   - Cannot access any sensitive endpoints
   - Receives 401 UNAUTHORIZED or 403 FORBIDDEN errors

### Token Flow

```
1. User receives interview link with token
2. Frontend includes token in requests via:
   - Authorization: Bearer <token> header, OR
   - x-interview-token: <token> header
3. TRPC context extracts and validates token
4. Endpoints check access using requireConversationAccess()
5. Access granted if token matches conversation's vacancy/gig
```

### User Flow

```
1. User authenticates via better-auth
2. Session validated in TRPC context
3. Endpoints check workspace membership
4. Access granted if user is member of conversation's workspace
```

## Implementation Notes

- All validation happens at the procedure level before business logic
- Token validation is non-blocking (errors logged but don't fail requests)
- Workspace membership is checked via database queries
- Audit logging included for authenticated user access
- Non-null assertions used safely after null checks (TypeScript warnings expected)

## Testing Recommendations

1. **Token-based access**:
   - Valid token can access own conversation
   - Expired token is rejected
   - Invalid token is rejected
   - Token for vacancy A cannot access vacancy B's conversation

2. **User-based access**:
   - Workspace member can access workspace conversations
   - Non-member cannot access workspace conversations
   - User without token cannot check duplicates

3. **Edge cases**:
   - Missing headers return 401
   - Malformed tokens return 401
   - Conversation not found returns 404
   - Inactive conversation rejects messages

## Migration Path

No database migrations required. Changes are purely application-level security enhancements.

## Future Improvements

1. Rate limiting per token/user
2. Token refresh mechanism
3. Conversation-level permissions (read-only vs read-write)
4. IP-based access restrictions
5. Token usage analytics

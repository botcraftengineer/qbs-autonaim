# @qbs-autonaim/interview-ui

Shared UI components for interview functionality.

## Components

### InterviewLandingForm

Form component for starting an interview. Collects freelancer information and validates input.

```tsx
import { InterviewLandingForm } from "@qbs-autonaim/interview-ui";

<InterviewLandingForm
  token="interview-token"
  entityId="vacancy-id"
  entityType="vacancy"
  platformSource="kwork"
  onSubmit={async (data) => {
    // Handle form submission
    return { conversationId: "..." };
  }}
  onCheckDuplicate={async (vacancyId, url) => {
    // Check for duplicate responses
    return { isDuplicate: false };
  }}
/>
```

## Features

- Form validation with Zod v4
- Platform-specific URL validation
- Duplicate response checking
- Mobile-optimized inputs (16px font-size)
- Accessible form controls
- Loading states with spinners
- Error handling and display

## Dependencies

- `@qbs-autonaim/ui` - Base UI components
- `@qbs-autonaim/config` - Shared configuration
- `react-hook-form` - Form management
- `zod` v4 - Schema validation
- `lucide-react` - Icons

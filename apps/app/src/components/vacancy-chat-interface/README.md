# VacancyChatInterface Component

AI-powered chat interface for creating vacancies through natural language conversation.

## Overview

The `VacancyChatInterface` component provides an interactive chat experience where users can describe vacancy requirements in natural language, and an AI assistant helps structure the information into a complete vacancy document.

## Features

### ✅ Implemented (Task 3)

- **Chat UI Structure** (Subtask 3.1)
  - Message container with auto-scroll
  - Text input with keyboard shortcuts (Enter to send, Shift+Enter for newline)
  - Send button with loading state
  - Empty state with helpful prompts
  - Accessible ARIA labels and roles

- **Document Preview Panel** (Subtask 3.2)
  - Real-time document updates as AI generates content
  - Displays all vacancy fields:
    - Title, Description, Requirements, Responsibilities, Conditions
    - Bot configuration fields (customBotInstructions, customScreeningPrompt, etc.)
  - Empty state when no content
  - Responsive layout (side-by-side on desktop, stacked on mobile)

- **Loading Indicators** (Subtask 3.3)
  - Typing indicator when AI is generating
  - Spinner on send button during generation
  - Disabled input during generation
  - Loading state on save button

- **Error Display** (Subtask 3.5)
  - Error messages with clear descriptions
  - Retry button for network errors
  - Visual error indicators (icon + color)
  - Accessible error announcements

### 🔮 Future Enhancements (Task 3.4)

- Quick reply buttons (will be added when API supports them)
- Suggested next steps based on document state

## Usage

### Basic Usage

```tsx
import { VacancyChatInterface } from "~/components/vacancy-chat-interface";

export function CreateVacancyPage({ workspaceId }: { workspaceId: string }) {
  return <VacancyChatInterface workspaceId={workspaceId} />;
}
```

### With Initial Document

```tsx
import { VacancyChatInterface } from "~/components/vacancy-chat-interface";

export function EditVacancyPage({ workspaceId }: { workspaceId: string }) {
  const initialDocument = {
    title: "Senior Developer",
    description: "Looking for an experienced developer...",
  };

  return (
    <VacancyChatInterface
      workspaceId={workspaceId}
      initialDocument={initialDocument}
    />
  );
}
```

### With Save Handler

```tsx
import { VacancyChatInterface } from "~/components/vacancy-chat-interface";
import { useRouter } from "next/navigation";

export function CreateVacancyPage({
  workspaceId,
  orgSlug,
  workspaceSlug,
}: {
  workspaceId: string;
  orgSlug: string;
  workspaceSlug: string;
}) {
  const router = useRouter();

  const handleSave = async (document) => {
    const response = await fetch("/api/vacancy/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId, ...document }),
    });

    if (!response.ok) throw new Error("Failed to save");

    const { id } = await response.json();
    router.push(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies/${id}`);
  };

  return (
    <VacancyChatInterface workspaceId={workspaceId} onSave={handleSave} />
  );
}
```

## Props

### VacancyChatInterfaceProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `workspaceId` | `string` | Yes | The workspace ID for the vacancy |
| `initialDocument` | `VacancyDocument` | No | Initial document state (for editing) |
| `onSave` | `(document: VacancyDocument) => Promise<void>` | No | Callback when user clicks "Create Vacancy" |

### VacancyDocument Type

```typescript
interface VacancyDocument {
  title?: string;
  description?: string;
  requirements?: string;
  responsibilities?: string;
  conditions?: string;
  customBotInstructions?: string;
  customScreeningPrompt?: string;
  customInterviewQuestions?: string;
  customOrganizationalQuestions?: string;
}
```

## Architecture

The component is built using:

- **useVacancyChat hook**: Manages state, API communication, and streaming
- **Modular sub-components**:
  - `ChatMessage`: Individual message display
  - `TypingIndicator`: Shows when AI is generating
  - `DocumentPreview`: Shows the generated document
  - `DocumentSection`: Reusable section for document fields

## Accessibility

- Full keyboard navigation support
- ARIA labels and roles for screen readers
- Focus management (auto-focus on desktop, manual on mobile)
- Live regions for dynamic content updates
- Semantic HTML elements (article, section, header, output)
- Visible focus indicators
- Touch-friendly hit targets (≥44px on mobile)

## Responsive Design

- **Desktop (≥768px)**: Side-by-side layout (chat left, document right)
- **Mobile (<768px)**: Stacked layout (chat top, document bottom)
- Input font-size ≥16px to prevent zoom on iOS
- Touch-optimized buttons and inputs

## Keyboard Shortcuts

- **Enter**: Send message
- **Shift + Enter**: New line in message
- **Tab**: Navigate between interactive elements

## Requirements Validation

This component satisfies the following requirements from the design document:

- ✅ **Requirement 11.1**: Loading indicators during generation
- ✅ **Requirement 11.2**: Input clearing after send, keyboard shortcuts
- ✅ **Requirement 11.5**: Responsive design for mobile devices
- ✅ **Requirement 2.1-2.4**: Document field updates reflect in UI
- ✅ **Requirement 8.1-8.3**: Error handling and display
- ✅ **Requirement 6.1, 6.5**: Create button visibility and disabled state

## Related Components

- `useVacancyChat` hook: State management and API communication
- `VacancyCreatorContainer`: Alternative implementation (legacy)
- `VacancyChatInput`: Standalone input component (legacy)
- `VacancyDocumentPreview`: Standalone preview component (legacy)

## Testing

Unit tests and property-based tests are marked as optional in the task list (tasks 3.1.1, 3.2.1, 3.3.1, 3.5.1). These can be implemented later if needed.

## Performance Considerations

- Auto-scroll uses `smooth` behavior for better UX
- Input is controlled but updates are not debounced (instant feedback)
- Document updates are applied incrementally during streaming
- Component re-renders are minimized through proper state management

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- iOS Safari 12+
- Android Chrome 80+

## Known Limitations

- Quick replies are not yet implemented (waiting for API support)
- No offline support (requires active internet connection)
- Maximum message length: 5000 characters (enforced by API)
- Conversation history limited to 10 messages (enforced by hook)

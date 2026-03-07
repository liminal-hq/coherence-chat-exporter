# Coherence Chat Archive Tool - Specification

## Overview
A CLI tool with TUI (using Ink) for exporting Claude/ChatGPT conversations into organized markdown journal entries, with optional AI-powered tagging via Transformers.js.

## Core Requirements

### 1. Multi-Provider Support with Data Models

```
chat-archive/
├── providers/
│   ├── claude.ts           # Parses Claude export format
│   ├── chatgpt.ts          # Parses ChatGPT export format
│   ├── types.ts            # Shared conversation types
│   └── schemas/
│       ├── claude-schema.md    # Documents Claude export structure
│       └── chatgpt-schema.md   # Documents ChatGPT export structure
```

#### Claude Export Structure (`conversations.json`)

```typescript
// Based on your screenshot showing: conversations.json, memories.json, projects.json, users.json

interface ClaudeExport {
  conversations: ClaudeConversation[];
  memories?: Memory[];
  projects?: Project[];
  users?: User[];
}

interface ClaudeConversation {
  uuid: string;
  name: string;
  summary: string;
  created_at: string; // ISO timestamp
  updated_at: string;
  project_uuid?: string;
  chat_messages: ChatMessage[];
}

interface ChatMessage {
  uuid: string;
  text: string;
  sender: 'human' | 'assistant';
  created_at: string;
  attachments?: Attachment[];
  files?: File[];
}

interface Project {
  uuid: string;
  name: string;
  description?: string;
  created_at: string;
}

interface Memory {
  // Structure TBD - can extract from memories.json
}

interface User {
  // Structure TBD - can extract from users.json
}
```

#### ChatGPT Export Structure

```typescript
// ChatGPT exports as conversations.json (different structure)
interface ChatGPTExport {
  conversations: ChatGPTConversation[];
}

interface ChatGPTConversation {
  id: string;
  title: string;
  create_time: number; // Unix timestamp
  update_time: number;
  mapping: { [key: string]: MessageNode };
  current_node?: string;
}

interface MessageNode {
  id: string;
  message?: {
    id: string;
    author: { role: 'user' | 'assistant' | 'system' };
    content: { content_type: string; parts: string[] };
    create_time: number;
  };
  parent?: string;
  children: string[];
}
```

### 2. TUI Interface (using Ink)

**Component Structure:**
```typescript
// src/ui/components/
├── App.tsx              # Main app router
├── MainMenu.tsx         # Entry point
├── ProviderSelect.tsx   # Choose Claude/ChatGPT
├── ProjectBrowser.tsx   # Browse projects
├── ConversationList.tsx # Browse conversations
├── ExportPreview.tsx    # Review before export
├── TaggingSetup.tsx     # Optional AI tagging setup
└── ProgressBar.tsx      # Export progress
```

**Main Menu:**
```tsx
import React from 'react';
import {Box, Text} from 'ink';
import SelectInput from 'ink-select-input';

const MainMenu = () => {
  const items = [
    {label: '📦 Select Export Source', value: 'source'},
    {label: '📂 Browse & Export', value: 'browse'},
    {label: '🏷️  Configure Tagging (Optional)', value: 'tagging'},
    {label: '⚙️  Settings', value: 'settings'},
    {label: '🚪 Exit', value: 'exit'}
  ];

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">Chat Archive Tool</Text>
      <SelectInput items={items} onSelect={handleSelect} />
    </Box>
  );
};
```

### 3. Conversation Browser

The "Browse & Export" flow allows users to select specific conversations to export.

**Flow:**
1. Select Source (Claude/ChatGPT).
2. Input File/Directory Path (Data Loading).
3. **Browser Interface**:
    *   **Project List**: Group conversations by project (with an "All" option).
    *   **Conversation List**:
        *   Columns: Title, Date, Message Count.
        *   Pagination: Support for large lists.
        *   Multi-selection: Toggle multiple conversations for export.
    *   **Preview**: View full conversation content (read-only).
4. **Export**: Process only the selected conversations.

**Key Inputs:**
*   `Up`/`Down`: Navigate lists.
*   `Left`/`Right`: Change pages (in conversation list).
*   `Space`: Toggle selection.
*   `Enter`: Open Preview (or select Project).
*   `e`: Trigger Export of selected items.
*   `s`: View Stats Dashboard.
*   `c`: Change Data Source.
*   `Esc` / `Backspace`: Go back / Cancel.

### 4. File Browser

A TUI component to browse the file system for selecting export directories or files.

**Features:**
*   Displays directories and relevant files (.json, .zip).
*   Navigates hierarchy.
*   Supports manual path input mode.

**Key Inputs:**
*   `Up`/`Down` (or `j`/`k`): Move selection.
*   `Enter` / `Right Arrow`: Enter directory or select file.
*   `Backspace` / `Left Arrow`: Go up one directory level.
*   `Tab`: Toggle Manual Input Mode (type path directly).
*   `Esc`: Cancel / Back.

### 5. Stats Dashboard

The Stats Dashboard provides insights into the loaded conversations before export.

**Access Points:**
1.  **Main Menu**: Select "Stats Dashboard" -> Load Data -> View Stats.
2.  **Browser**: Press `s` while browsing conversations.

**Metrics:**
*   Total Conversations & Messages.
*   Average Messages per Conversation.
*   Date Range (Earliest to Latest).
*   **Charts**:
    *   Top Projects (Bar Chart).
    *   Top Tags (Bar Chart, if available).
    *   Activity over Time (Monthly Bar Chart).

**UI Components:**
*   `StatsDashboard.tsx`: Main view layout.
*   `AsciiChart.tsx`: Reusable ASCII bar chart renderer.

### 6. AI Tagging with Transformers.js

**Optional Enhancement Layer:**

```typescript
// src/tagging/
├── setup.ts        # Download model on first use
├── classifier.ts   # Tag generation
└── models.ts       # Model management

interface TaggerConfig {
  enabled: boolean;
  model: 'Xenova/mobilebert-uncased-mnli' | string;
  categories: string[];
  threshold: number;
}
```

**Tagging Setup Flow:**
```tsx
// First time user wants tagging:
┌─────────────────────────────────────┐
│ AI Tagging Setup                    │
├─────────────────────────────────────┤
│                                     │
│ AI tagging adds semantic tags to    │
│ your conversations automatically.   │
│                                     │
│ This requires downloading:          │
│ • MobileBERT model (~25MB)          │
│                                     │
│ Download now? (y/n)                 │
│                                     │
│ [Downloading... ████████░░ 80%]     │
└─────────────────────────────────────┘
```

**Tagging Implementation:**
```typescript
import { pipeline } from '@xenova/transformers';

class ConversationTagger {
  private classifier: any;

  async initialize() {
    // Downloads model to ~/.cache on first run
    this.classifier = await pipeline(
      'zero-shot-classification',
      'Xenova/mobilebert-uncased-mnli'
    );
  }

  async tagConversation(conversation: Conversation): Promise<string[]> {
    const text = this.extractKeyContent(conversation);

    const categories = [
      'framework development',
      'personal reflection',
      'relationship dynamics',
      'consciousness exploration',
      'integration work',
      'practical planning',
      'emotional processing',
      'neurodivergence',
      'creativity',
      'problem solving'
    ];

    const result = await this.classifier(text, categories, {
      multi_label: true
    });

    // Return tags above threshold (e.g., 0.5)
    return result.labels
      .filter((_, i) => result.scores[i] > 0.5)
      .slice(0, 5); // Max 5 tags
  }

  private extractKeyContent(conv: Conversation): string {
    // Use title + first few messages as context
    const firstMessages = conv.messages
      .slice(0, 6)
      .map(m => m.text)
      .join(' ');

    return `${conv.title}. ${firstMessages}`.slice(0, 512);
  }
}
```

**Enhanced Frontmatter with Tags:**
```yaml
---
date: 2024-12-07
provider: claude
project: Coherence Loop Development
title: Veracity Engine Discussion
conversation_id: abc123
participants: ["Scott", "Claude"]
tags: ["framework development", "consciousness exploration", "integration work"]
auto_tagged: true
---
```

### 7. Export Pipeline with Tagging

```typescript
// src/export/pipeline.ts

interface ExportOptions {
  enableTagging: boolean;
  tagThreshold: number;
  format: 'markdown' | 'json';
}

class ExportPipeline {
  constructor(
    private provider: Provider,
    private transformer: MarkdownTransformer,
    private tagger?: ConversationTagger
  ) {}

  async export(
    conversations: Conversation[],
    options: ExportOptions
  ): Promise<ExportResult[]> {
    const results: ExportResult[] = [];

    for (const conv of conversations) {
      // 1. Parse provider data
      const normalized = this.provider.normalize(conv);

      // 2. Optional: AI tagging
      if (options.enableTagging && this.tagger) {
        normalized.tags = await this.tagger.tagConversation(normalized);
      }

      // 3. Transform to markdown
      const markdown = this.transformer.toMarkdown(normalized);

      // 4. Organize by date
      const path = this.organizer.getPath(normalized);

      // 5. Write file
      await this.writer.write(path, markdown);

      results.push({ conversation: conv, path, tags: normalized.tags });
    }

    return results;
  }
}
```

### 8. Configuration with Tagging

```json
{
  "outputPath": "/home/scott/journal",
  "providers": {
    "claude": {
      "enabled": true,
      "autoDetectExports": true,
      "lastExportPath": "/home/scott/Downloads/..."
    },
    "chatgpt": {
      "enabled": true,
      "autoDetectExports": true
    }
  },
  "tagging": {
    "enabled": false,
    "model": "Xenova/mobilebert-uncased-mnli",
    "threshold": 0.5,
    "maxTags": 5,
    "customCategories": [
      "framework development",
      "personal reflection",
      "relationship dynamics",
      "consciousness exploration"
    ]
  },
  "formatting": {
    "dateFormat": "YYYY-MM-DD",
    "folderStructure": "{year}/{month}-{monthName}/",
    "filenameTemplate": "{day}-{slug}.md"
  }
}
```

### 9. Colour Palette

The TUI uses a specific set of standard terminal colours to ensure readability and consistency:

*   **Cyan**: Primary brand colour, headers, and active selection indicators (`>`).
*   **Green**: Success messages, confirmation, and selected checkbox states (`[x]`).
*   **Yellow**: Warnings, secondary highlights, and borders for preview/detail views.
*   **Gray/Dim**: Metadata (dates, counts), unselected checkbox states (`[ ]`), and borders for inactive areas.
*   **White**: Standard text content.

## Technical Stack

**Core:**
- TypeScript + Node.js
- Bun (standalone executable builds)
- Commander.js (CLI framework)
- **Ink** (React-based TUI) ✨
- **@xenova/transformers** (AI tagging, optional)

**Utilities:**
- date-fns (date handling)
- gray-matter (YAML frontmatter)
- slugify (filename generation)
- chalk (terminal colours)
- ink-select-input (menu selections)
- ink-spinner (loading states)
- ink-text-input (user input)

**File Structure:**
```
chat-archive/
├── src/
│   ├── cli.ts              # Main entry
│   ├── ui/
│   │   ├── App.tsx         # Main Ink app
│   │   └── components/     # Ink components
│   ├── providers/
│   │   ├── base.ts
│   │   ├── claude.ts
│   │   ├── chatgpt.ts
│   │   └── schemas/        # Export format docs
│   ├── tagging/            # ✨ New
│   │   ├── setup.ts
│   │   ├── classifier.ts
│   │   └── models.ts
│   ├── export/
│   │   ├── pipeline.ts     # Updated with tagging
│   │   ├── transformer.ts
│   │   ├── organizer.ts
│   │   └── writer.ts
│   └── config.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Build and Release Pipeline

### Local Build Scripts

- `npm run build`: Compile TypeScript output to `dist/`.
- `npm run bundle`: Create the Node bundle at `dist/coherence.bundle.mjs`.
- `npm run build:binary`: Compile a standalone Bun executable at `dist/coherence`.
- `npm run build:release`: Run TypeScript build, bundle creation, and Bun binary compilation in sequence.

### CI Behaviour

- Lint, format-check, test, and build jobs run with Node.js.
- A dedicated `binary` job installs Bun and runs:
  1. `npm run build`
  2. `npm run build:binary`
  3. `./dist/coherence --help` smoke test
- CI jobs publish `GITHUB_STEP_SUMMARY` results for quick run-status visibility.

### Release Workflow Architecture

The release workflow is multi-job and follows:

1. `prepare-release`: Resolve tag and create/reuse the GitHub release.
2. `build-binaries`: Matrix Bun `--target` builds across Linux/macOS/Windows targets, then upload binaries and SHA-256 checksum files.
3. `build-packages`: Build and upload existing Node-based release artefacts (bundle, AppImages, npm tarball).
4. `publish-release`: Download all artefacts and attach them to the release.

## Usage Flow with Tagging

```bash
# Initial setup
chat-archive init

# Interactive mode
chat-archive

# Enable tagging (downloads model)
chat-archive config tagging --enable

# Export with tagging
chat-archive export --provider claude --tag

# Export without tagging (faster)
chat-archive export --provider claude --no-tag
```

**Interactive Tagging Flow:**
```
┌─────────────────────────────────────┐
│ Exporting 3 conversations...        │
├─────────────────────────────────────┤
│                                     │
│ ✓ Parsed conversations              │
│ ○ Generating tags... (optional)    │
│   └─ veracity-engine-discussion     │
│      Tags: framework, consciousness │
│ ○ Writing markdown files            │
│ ○ Complete                          │
└─────────────────────────────────────┘
```

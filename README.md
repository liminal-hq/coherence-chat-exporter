# Coherence Chat Exporter

A powerful CLI and TUI (Terminal User Interface) tool for exporting and archiving your conversation history from **Claude** and **ChatGPT**. It converts your JSON exports into organized Markdown files, suitable for personal knowledge management (PKM) systems like Obsidian or Logseq.

Includes optional **AI Semantic Tagging** using a local BERT model to automatically categorize your conversations.

## Features

-   **Multi-Provider Support**: Parses `conversations.json` from both Claude and ChatGPT exports.
-   **Flexible Input**: Supports directory inputs, direct JSON files, or ZIP archives.
-   **TUI & CLI**:
    -   Interactive Terminal UI (Ink-based) for easy navigation.
    -   **Conversation Browser**: Preview and select specific conversations to export.
    -   **Stats Dashboard**: Visualize conversation metrics (count, volume, timeline) with ASCII charts.
    -   Headless CLI commands for scripting and automation.
-   **Structured Export**:
    -   Converts conversations to clean Markdown.
    -   Preserves metadata (date, model, title) in YAML frontmatter.
    -   Organizes output in chronological folders: `{year}/{month}-{monthName}/`.
-   **AI Tagging (Optional)**:
    -   Uses `@huggingface/transformers` to run a local classification model.
    -   Automatically generates tags based on conversation content.
    -   **Privacy-first**: The model runs entirely locally; no data leaves your machine.
-   **Persistent Configuration**: Saves your preferences (output path, tagging settings) to `~/.config/coherence/config.json` (XDG compatible).

## Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-repo/coherence-chat-exporter.git
    cd coherence-chat-exporter
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Build the project:
    ```bash
    npm run build
    ```

4.  (Optional) Link globally:
    ```bash
    npm link
    ```

## Usage

### Interactive Mode (TUI)

Simply run the tool without arguments to launch the interactive interface:

```bash
npm start
# OR if linked
coherence
```

Use the arrow keys to navigate the menu:
-   **Select Export Source**: Choose between Claude or ChatGPT.
-   **Browse & Export**: Load data and browse/filter conversations before exporting.
-   **Configure Tagging**: Enable/Disable AI tagging.
-   **Settings**: View/Save configuration.

### File Browser
When selecting a source, you can browse your file system:
-   `Up`/`Down` (or `j`/`k`): Navigate list.
-   `Enter` / `Right Arrow`: Enter folder or select file.
-   `Backspace` / `Left Arrow`: Go up one folder level.
-   `Tab`: Toggle manual path entry.

### Conversation Browser

The browser allows you to selectively export conversations.

1.  Select **Browse & Export**.
2.  Select your export file/directory using the File Browser.
3.  **Navigate**:
    -   `Up`/`Down`: Select Projects or Conversations.
    -   `Left`/`Right`: Change pages.
    -   `Space`: Toggle selection.
    -   `Enter`: Preview conversation.
    -   `e`: Export selected items.
    -   `s`: View Stats Dashboard.
    -   `c`: Change Data Source.

### Stats Dashboard

Analyze your export data before processing.

1.  Select **Stats Dashboard** from the Main Menu.
2.  Or press `s` while in the Conversation Browser.
3.  View metrics like:
    -   Total Conversations/Messages
    -   Activity over Time
    -   Top Projects & Tags

### CLI Mode

Use the `export` command for automated or single-shot exports.

```bash
# Export Claude data from a directory
coherence export --provider claude --input ./claude_export/ --output ./journal

# Export ChatGPT data from a zip file with tagging enabled
coherence export --provider chatgpt --input ./chatgpt_export.zip --tag

# View help
coherence export --help
```

**Options:**
-   `-p, --provider <type>`: `claude` or `chatgpt` (Required)
-   `-i, --input <path>`: Path to directory, `.json` file, or `.zip` archive (Required)
-   `-o, --output <path>`: Output directory (Defaults to config setting)
-   `--tag`: Force enable AI tagging
-   `--no-tag`: Force disable AI tagging

## Configuration

Configuration is stored in `~/.config/coherence/config.json`. You can edit this file manually or save settings via the TUI.

```json
{
  "outputPath": "./output",
  "tagging": {
    "enabled": false,
    "model": "Xenova/mobilebert-uncased-mnli",
    "threshold": 0.5,
    "maxTags": 5,
    "customCategories": [ ... ]
  },
  "formatting": {
    "dateFormat": "YYYY-MM-DD",
    "folderStructure": "{year}/{month}-{monthName}/",
    "filenameTemplate": "{day}-{slug}.md"
  }
}
```

## Demo & Samples

### Interactive TUI
The tool features a clean, keyboard-navigable terminal interface.

**Main Menu**
```
 Chat Archive Tool

 ❯ 📦 Select Export Source
   📂 Browse & Export
   🏷️  Configure Tagging
   ⚙️  Settings
   🚪 Exit
```

**AI Tagging Configuration**
```
 AI Tagging Configuration

 Automatically generate semantic tags for your conversations using a local AI model.
 Note: First run will download ~25MB model.

 ❯ Enable AI Tagging: [OFF]
   🔙 Back
```

### Sample Output
Conversations are exported to Markdown with YAML frontmatter containing metadata.

**Input (`samples/claude_mock_conversations.json`)**
```json
{
  "conversations": [
    {
      "uuid": "550e8400-...",
      "name": "Designing the Chat Archive Tool",
      "chat_messages": [...]
    }
  ]
}
```

**Output (`2025/10-october/27-designing-the-chat-archive-tool.md`)**
```markdown
---
title: Designing the Chat Archive Tool
date: '2025-10-27'
updated: '2025-10-27'
uuid: 550e8400-e29b-41d4-a716-446655440000
tags: ["programming", "AI", "tooling"]
---
### HUMAN (2025-10-27T10:01:00.000Z)

I want to build a CLI tool to archive my Claude conversations. It should be a TUI using Ink.

---

### ASSISTANT (2025-10-27T10:02:00.000Z)

That sounds like a great project! Using Ink for the TUI...
```

## AI Tagging

The tool uses the `Xenova/mobilebert-uncased-mnli` model (via `@huggingface/transformers`) for zero-shot classification. On the first run with tagging enabled, it will download the quantized model (~25MB) to your local cache.

## Development

-   **Build**: `npm run build` (Compiles TypeScript to `dist/`)
-   **Test**: `npm test` (Runs Jest unit tests)
-   **Lint**: `npm run lint` (if configured)

## License

MIT

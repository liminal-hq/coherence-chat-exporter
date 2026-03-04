#!/usr/bin/env node

import React from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import { App } from './ui/App.js';
import { ClaudeProvider } from './providers/claude.js';
import { ChatGPTProvider } from './providers/chatgpt.js';
import { ExportPipeline } from './export/pipeline.js';
import { MarkdownTransformer } from './export/transformer.js';
import { Organizer } from './export/organizer.js';
import { Writer } from './export/writer.js';
import { ConversationTagger } from './tagging/classifier.js';
import { configManager } from './config-manager.js';
import { InputResolver } from './utils/input-resolver.js';
import { registerCompletionCommand } from './completion.js';
import chalk from 'chalk';

// Load config first
configManager.loadConfig();
const config = configManager.getConfig();

const program = new Command();

program
  .name('coherence')
  .description('Coherence Chat Exporter - Export Claude/ChatGPT conversations to Markdown')
  .version('1.0.0');

registerCompletionCommand(program);

program
  .command('export')
  .description('Export conversations from CLI')
  .requiredOption('-p, --provider <type>', 'Provider type (claude or chatgpt)')
  .requiredOption('-i, --input <path>', 'Input file, directory, or zip path')
  .option('-o, --output <path>', 'Output directory', config.outputPath)
  .option('--tag', 'Enable AI tagging')
  .option('--no-tag', 'Disable AI tagging')
  .action(async (options) => {
    try {
        console.log(chalk.cyan('Starting export...'));

        const provider = options.provider === 'claude' ? new ClaudeProvider() :
                         options.provider === 'chatgpt' ? new ChatGPTProvider() : null;

        if (!provider) {
            console.error(chalk.red('Invalid provider. Use "claude" or "chatgpt".'));
            process.exit(1);
        }

        // Determine tagging state: flag overrides config
        let enableTagging = config.tagging.enabled;
        if (options.tag) enableTagging = true;
        if (options.noTag) enableTagging = false;

        const transformer = new MarkdownTransformer();
        const organizer = new Organizer(options.output);
        const writer = new Writer();
        const resolver = new InputResolver();

        let tagger: ConversationTagger | undefined;
        if (enableTagging) {
            console.log(chalk.yellow('Initializing AI Model (this may take a moment)...'));
            tagger = new ConversationTagger();
            await tagger.initialize();
        }

        const pipeline = new ExportPipeline(provider, transformer, organizer, writer, tagger);

        console.log(chalk.blue(`Reading from ${options.input}...`));

        // Resolve input (Zip/File/Dir)
        const exportData = await resolver.resolve(options.input);

        const results = await pipeline.export(exportData, {
            enableTagging: enableTagging,
            tagThreshold: config.tagging.threshold
        });

        console.log(chalk.green(`\n✔ Export complete! Processed ${results.length} conversations.`));
        console.log(`Output: ${options.output}`);

    } catch (error: any) {
        console.error(chalk.red('\n✖ Export failed:'), error.message);
        process.exit(1);
    }
  });

// Handle interactive mode (default)
// We use a custom action on the main program to catch cases where no sub-command is used
program
    .argument('[path]', 'Path to export file or directory to load in interactive mode')
    .action(async (path) => {
        // Set terminal title
        process.stdout.write('\x1b]0;Coherence Chat Exporter\x07');
        // Enter alternate screen buffer
        process.stdout.write('\x1b[?1049h');

        // If the user runs `coherence`, path is undefined.
        // If the user runs `coherence myfile.zip`, path is "myfile.zip".
        const app = render(React.createElement(App, {
            initialPath: path,
            onExit: () => app.unmount()
        }));

        await app.waitUntilExit();

        // Exit alternate screen buffer on clean exit
        process.stdout.write('\x1b[?1049l');
    });

program.parse(process.argv);

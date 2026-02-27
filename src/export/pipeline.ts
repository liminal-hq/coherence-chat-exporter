import { Provider, Conversation } from '../providers/types.js';
import { MarkdownTransformer } from './transformer.js';
import { Organizer } from './organizer.js';
import { Writer } from './writer.js';
import { ConversationTagger } from '../tagging/classifier.js';
import pLimit from 'p-limit';
import * as os from 'os';

interface ExportOptions {
  enableTagging: boolean;
  tagThreshold: number;
}

export interface ExportResult {
  conversation: Conversation;
  path: string;
  tags?: string[];
}

export class ExportPipeline {
  constructor(
    private provider: Provider,
    private transformer: MarkdownTransformer,
    private organizer: Organizer,
    private writer: Writer,
    private tagger?: ConversationTagger
  ) {}

  async export(
    data: any | Conversation[], // Raw data OR already normalized conversations
    options: ExportOptions
  ): Promise<ExportResult[]> {
    let conversations: Conversation[];

    if (Array.isArray(data) && data.length > 0 && 'messages' in data[0]) {
        // Assume it's already normalized Conversation objects
        conversations = data as Conversation[];
    } else {
        conversations = await this.provider.normalize(data);
    }

    // Default concurrency to CPU count or 4 if undefined/zero
    const concurrency = os.cpus().length || 4;
    const limit = pLimit(concurrency);

    const tasks: Array<Promise<ExportResult>> = conversations.map(conv => limit(async () => {
      if (options.enableTagging && this.tagger) {
          try {
              conv.tags = await this.tagger.tagConversation(conv);
          } catch (e) {
              console.warn(`Tagging failed for ${conv.title}:`, e);
          }
      }

      const markdown = this.transformer.toMarkdown(conv);
      const filePath = this.organizer.getPath(conv);

      await this.writer.write(filePath, markdown);
      return { conversation: conv, path: filePath, tags: conv.tags };
    }));

    const outcomes = await Promise.allSettled(tasks);

    outcomes.forEach(result => {
      if (result.status === 'rejected') {
        console.error('Export failed:', result.reason);
      }
    });

    // Filter out rejected promises and return only successful results
    return outcomes
        .filter((r): r is PromiseFulfilledResult<ExportResult> => r.status === 'fulfilled')
        .map(r => r.value);
  }
}

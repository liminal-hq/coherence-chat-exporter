import { Provider, Conversation } from '../providers/types.js';
import { MarkdownTransformer } from './transformer.js';
import { Organizer } from './organizer.js';
import { Writer } from './writer.js';
import { ConversationTagger } from '../tagging/classifier.js';
import { pMap } from '../utils/async-utils.js';
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

    // Use concurrency based on CPU cores, with a sensible default if os.cpus() fails or is empty
    const concurrency = Math.max(1, (os.cpus()?.length || 1) * 2);

    const results = await pMap(conversations, async (conv) => {
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
    }, concurrency);

    return results;
  }
}

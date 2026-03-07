import { Conversation } from '../providers/types.js';
import { defaultConfig } from '../config.js';

export class ConversationTagger {
  private classifier: any;
  private categories: string[];
  private threshold: number;

  constructor(categories?: string[], threshold?: number) {
      this.categories = categories || defaultConfig.tagging.customCategories;
      this.threshold = threshold || defaultConfig.tagging.threshold;
  }

  async initialize() {
    // Downloads model on first run
    // env.cacheDir = './.cache'; // Optional: local cache
    const { pipeline } = await import('@huggingface/transformers');
    this.classifier = await pipeline(
      'zero-shot-classification',
      defaultConfig.tagging.model
    );
  }

  async tagConversation(conversation: Conversation): Promise<string[]> {
    if (!this.classifier) {
        await this.initialize();
    }

    const text = this.extractKeyContent(conversation);

    // Safety check for empty text
    if (!text.trim()) return [];

    const result = await this.classifier(text, this.categories, {
      multi_label: true
    });

    // result structures: { sequence, labels: [], scores: [] }
    const tags: string[] = [];
    if (result && result.labels && result.scores) {
        for (let i = 0; i < result.labels.length; i++) {
            if (result.scores[i] > this.threshold) {
                tags.push(result.labels[i]);
            }
        }
    }

    return tags.slice(0, defaultConfig.tagging.maxTags);
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

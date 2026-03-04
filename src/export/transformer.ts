import matter from 'gray-matter';
import { Conversation, Message } from '../providers/types.js';

export class MarkdownTransformer {
  toMarkdown(conversation: Conversation): string {
    const frontmatter = {
      title: conversation.title,
      date: conversation.created_at.toISOString().split('T')[0],
      updated: conversation.updated_at.toISOString().split('T')[0],
      uuid: conversation.uuid,
      tags: conversation.tags || [],
      project: conversation.project_name
    };

    // Clean undefined fields from frontmatter
    Object.keys(frontmatter).forEach(key =>
        (frontmatter as any)[key] === undefined && delete (frontmatter as any)[key]
    );

    const content = conversation.messages.map(m => this.formatMessage(m)).join('\n\n---\n\n');

    return matter.stringify(content, frontmatter);
  }

  private formatMessage(message: Message): string {
    const role = message.sender.toUpperCase();
    const date = message.created_at.toISOString();
    return `### ${role} (${date})\n\n${message.text}`;
  }
}

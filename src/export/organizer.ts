import { Conversation } from '../providers/types.js';
import slugify from 'slugify';
import { format } from 'date-fns';
import * as path from 'path';

export class Organizer {
  constructor(private outputBase: string) {}

  getPath(conversation: Conversation): string {
    const date = conversation.created_at;
    const year = format(date, 'yyyy');
    const month = format(date, 'MM');
    const monthName = format(date, 'MMMM').toLowerCase();
    const day = format(date, 'dd');

    // Folder: {year}/{month}-{monthName}/
    const folder = path.join(year, `${month}-${monthName}`);

    // Filename: {day}-{slug}.md
    // @ts-expect-error: slugify types mismatch with ESM in this setup, but runtime is fine
    const slug = slugify(conversation.title, { lower: true, strict: true }).slice(0, 50);
    const filename = `${day}-${slug}.md`;

    return path.join(this.outputBase, folder, filename);
  }
}

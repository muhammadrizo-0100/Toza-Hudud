import axios from 'axios';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { UPLOAD_DIR } from './bot.types';

export async function downloadTelegramFile(fileUrl: string): Promise<string> {
  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  const filename = `tg-${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
  const fullPath = join(UPLOAD_DIR, filename);

  const response = await axios({
    method: 'GET',
    url: fileUrl,
    responseType: 'stream'
  });

  const writer = createWriteStream(fullPath);
  response.data.pipe(writer);

  return new Promise<string>((resolve, reject) => {
    writer.on('finish', () => resolve(`/uploads/${filename}`));
    writer.on('error', reject);
  });
}

export async function safeDeleteIncomingTextMessage(ctx: any): Promise<void> {
  try {
    if (ctx.message && 'message_id' in ctx.message) {
      await ctx.deleteMessage(ctx.message.message_id);
    }
  } catch {
    // Ignore non-deletable or expired messages
  }
}

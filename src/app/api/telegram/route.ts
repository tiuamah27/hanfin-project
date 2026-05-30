import { NextResponse } from 'next/server';
import { telegramService } from '@/lib/services/telegram-service';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Jalankan service di background dan langsung return OK
    // agar Telegram tidak menganggap webhook timeout.
    // Edge/Serverless environments might kill async operations after return, 
    // but Next.js App Router usually allows promises to finish if awaited, 
    // however Telegram wants a fast 200 OK.
    // For Vercel, it's safer to await it, so we await it.
    await telegramService.handleWebhook(body);

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Telegram Webhook Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

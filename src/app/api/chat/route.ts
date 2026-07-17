import {NextRequest, NextResponse} from 'next/server';
import {processMessage} from '@/shared/ai/chatAgent';
import type {ChatRequest, ChatResponse} from '@/shared/ai/types';
import {verifyFirebaseToken} from '@/shared/firebase/admin';
import {createAuthenticatedClient} from '@/shared/supabase/server-client';
import {decrypt} from '@/shared/encryption';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json<ChatResponse>(
        {text: 'الرجاء تسجيل الدخول لاستخدام المساعد الذكي.'},
        {status: 401}
      );
    }

    const decoded = await verifyFirebaseToken(authHeader.slice(7));
    const supabase = createAuthenticatedClient(decoded);

    const {data: keyData} = await supabase
      .from('user_api_keys')
      .select('encrypted_key')
      .eq('user_id', decoded.uid)
      .maybeSingle();

    if (!keyData?.encrypted_key) {
      return NextResponse.json<ChatResponse>(
        {
          text: 'يرجى حفظ مفتاح Gemini API الخاص بك أولاً من صفحة الإعدادات.'
        },
        {status: 403}
      );
    }

    let apiKey: string;
    try {
      const encryptionKey = process.env.API_KEY_ENCRYPTION_KEY;
      if (!encryptionKey) throw new Error('Encryption key not configured');
      apiKey = decrypt(keyData.encrypted_key, encryptionKey);
    } catch {
      return NextResponse.json<ChatResponse>(
        {text: 'عذراً، حدث خطأ في فك تشفير مفتاح API.'},
        {status: 500}
      );
    }

    const body: ChatRequest = await request.json();
    const {message, history} = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json<ChatResponse>(
        {text: 'الرجاء كتابة رسالة.'},
        {status: 400}
      );
    }

    const result = await processMessage(message, history || [], apiKey);

    return NextResponse.json<ChatResponse>(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[chat]', message);

    if (message.includes('SAFETY') || message.includes('safety')) {
      return NextResponse.json<ChatResponse>(
        {
          text: 'عذراً، تعذر معالجة هذا الطلب بسبب قيود الأمان. يرجى إعادة صياغة سؤالك.'
        },
        {status: 400}
      );
    }

    return NextResponse.json<ChatResponse>(
      {
        text: `عذراً، حدث خطأ: ${message}`
      },
      {status: 500}
    );
  }
}

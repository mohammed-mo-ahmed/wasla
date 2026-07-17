import {NextRequest, NextResponse} from 'next/server';
import {verifyFirebaseToken} from '@/shared/firebase/admin';
import {createAuthenticatedClient} from '@/shared/supabase/server-client';
import {encrypt} from '@/shared/encryption';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({error: 'Missing authorization'}, {status: 401});
    }

    const decoded = await verifyFirebaseToken(authHeader.slice(7));
    const supabase = createAuthenticatedClient(decoded);

    const {data: keyData} = await supabase
      .from('user_api_keys')
      .select('encrypted_key')
      .eq('user_id', decoded.uid)
      .maybeSingle();

    if (!keyData?.encrypted_key) {
      return NextResponse.json({exists: false, maskedKey: null});
    }

    const rawKey = keyData.encrypted_key;
    const encryptionKey = process.env.API_KEY_ENCRYPTION_KEY;
    let decrypted: string;
    try {
      const {decrypt} = await import('@/shared/encryption');
      decrypted = decrypt(rawKey, encryptionKey!);
    } catch {
      return NextResponse.json({exists: true, maskedKey: 'unknown'});
    }

    const maskedKey = decrypted.length >= 4
      ? decrypted.slice(0, 4) + '*'.repeat(decrypted.length - 4)
      : decrypted;

    return NextResponse.json({exists: true, maskedKey});
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'unknown';
    console.error('[user-api-key] GET error:', msg);
    return NextResponse.json({error: msg}, {status: 500});
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({error: 'Missing authorization'}, {status: 401});
    }

    const decoded = await verifyFirebaseToken(authHeader.slice(7));
    const supabase = createAuthenticatedClient(decoded);

    const body = await request.json();
    const {apiKey} = body;

    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
      return NextResponse.json({error: 'API key is required'}, {status: 400});
    }

    const trimmedKey = apiKey.trim();

    // Validate the key against Gemini API
    try {
      const validateRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${trimmedKey}`
      );

      if (validateRes.status === 403 || validateRes.status === 401) {
        return NextResponse.json(
          {error: 'invalid_key'},
          {status: 400}
        );
      }

      if (!validateRes.ok) {
        return NextResponse.json(
          {error: 'validation_error'},
          {status: 502}
        );
      }
    } catch {
      return NextResponse.json(
        {error: 'validation_error'},
        {status: 502}
      );
    }

    const encryptionKey = process.env.API_KEY_ENCRYPTION_KEY;
    if (!encryptionKey) {
      return NextResponse.json({error: 'Server encryption not configured'}, {status: 500});
    }

    const encryptedKey = encrypt(trimmedKey, encryptionKey);

    const {error: upsertError} = await supabase.from('user_api_keys').upsert(
      {
        user_id: decoded.uid,
        encrypted_key: encryptedKey,
        updated_at: new Date().toISOString(),
      },
      {onConflict: 'user_id'}
    );

    if (upsertError) {
      console.error('[user-api-key] upsert error:', upsertError.message);
      return NextResponse.json({error: upsertError.message}, {status: 500});
    }

    const maskedKey = trimmedKey.length >= 4
      ? trimmedKey.slice(0, 4) + '*'.repeat(trimmedKey.length - 4)
      : trimmedKey;

    return NextResponse.json({success: true, maskedKey});
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'unknown';
    console.error('[user-api-key] POST error:', msg);
    return NextResponse.json({error: msg}, {status: 500});
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({error: 'Missing authorization'}, {status: 401});
    }

    const decoded = await verifyFirebaseToken(authHeader.slice(7));
    const supabase = createAuthenticatedClient(decoded);

    const {error: deleteError} = await supabase
      .from('user_api_keys')
      .delete()
      .eq('user_id', decoded.uid);

    if (deleteError) {
      console.error('[user-api-key] DELETE error:', deleteError.message);
      return NextResponse.json({error: deleteError.message}, {status: 500});
    }

    return NextResponse.json({success: true});
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'unknown';
    console.error('[user-api-key] DELETE error:', msg);
    return NextResponse.json({error: msg}, {status: 500});
  }
}

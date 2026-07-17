const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const MODELS = ['gemini-2.5-flash-lite', 'gemini-2.0-flash-lite', 'gemini-2.0-flash'];

export type GeminiPart =
  | {text: string}
  | {functionCall: {name: string; args: Record<string, unknown>}}
  | {functionResponse: {name: string; response: unknown}};

export type GeminiContent = {
  role: 'user' | 'model' | 'function';
  parts: GeminiPart[];
};

type GeminiCandidate = {
  content: {parts: GeminiPart[]};
  finishReason?: string;
};

export type GeminiResponse = {
  candidates?: GeminiCandidate[];
};

type GeminiRequest = {
  system_instruction?: {parts: [{text: string}]};
  contents: GeminiContent[];
  tools?: Array<{
    function_declarations: Array<{
      name: string;
      description: string;
      parameters: {
        type: string;
        properties: Record<string, {type: string; description: string}>;
        required?: string[];
      };
    }>;
  }>;
};

async function tryModel(
  model: string,
  body: GeminiRequest,
  apiKey: string
): Promise<{response: GeminiResponse} | {retryAfter: number}> {
  const url = `${API_BASE}/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body)
  });

  if (res.ok) {
    return {response: (await res.json()) as GeminiResponse};
  }

  const text = await res.text();

  if (res.status === 429) {
    const retryMatch = text.match(/retry in (\d+(?:\.\d+)?)s/);
    const retryAfter = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : 10;
    return {retryAfter};
  }

  if (res.status === 503 || res.status === 500) {
    return {retryAfter: 5};
  }

  throw new Error(`Gemini API error (${res.status}): ${text}`);
}

export async function generateContent(params: {
  systemInstruction?: string;
  contents: GeminiContent[];
  tools?: GeminiRequest['tools'];
  apiKey?: string;
}): Promise<GeminiResponse> {
  const apiKey = params.apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'GOOGLE_GENERATIVE_AI_API_KEY is not configured. ' +
        'Get a free key at https://aistudio.google.com/apikey'
    );
  }

  const body: GeminiRequest = {contents: params.contents};

  if (params.systemInstruction) {
    body.system_instruction = {parts: [{text: params.systemInstruction}]};
  }

  if (params.tools) {
    body.tools = params.tools;
  }

  for (const model of MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await tryModel(model, body, apiKey);

      if ('response' in result) {
        return result.response;
      }

      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, result.retryAfter * 1000));
      }
    }
  }

  throw new Error(
    'All Gemini models are currently rate-limited or unavailable. Please try again later.'
  );
}

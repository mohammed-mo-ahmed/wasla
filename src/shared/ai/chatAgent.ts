import {generateContent} from './gemini';
import type {GeminiContent, GeminiPart} from './gemini';
import {functionDeclarations} from './definitions';
import {SYSTEM_PROMPT} from './systemPrompt';
import {searchRoutes} from './tools/routeSearch';
import {searchPlaces} from './tools/placeSearch';
import {searchForum} from './tools/searchForum';
import {findBusBetween, searchBusLine} from './tools/busRouteSearch';
import type {ChatHistoryItem, ChatResponse} from './types';

function historyToContents(history: ChatHistoryItem[]): GeminiContent[] {
  return history.map((h) => ({
    role: h.role === 'user' ? 'user' as const : 'model' as const,
    parts: [{text: h.text}]
  }));
}

export async function processMessage(
  message: string,
  history: ChatHistoryItem[],
  apiKey?: string
): Promise<ChatResponse> {
  const contents: GeminiContent[] = [
    ...historyToContents(history),
    {role: 'user', parts: [{text: message}]}
  ];

  let routes;
  let places;

  for (let round = 0; round < 3; round++) {
    const response = await generateContent({
      systemInstruction: SYSTEM_PROMPT,
      contents,
      tools: [{function_declarations: functionDeclarations}],
      apiKey
    });

    const candidate = response.candidates?.[0];
    if (!candidate) {
      return {text: 'عذراً، لم أتمكن من معالجة طلبك.'};
    }

    if (candidate.finishReason === 'SAFETY') {
      return {text: 'عذراً، تعذر معالجة هذا الطلب بسبب قيود الأمان. يرجى إعادة صياغة سؤالك.'};
    }

    const parts = candidate.content?.parts;
    if (!parts?.length) {
      return {text: 'عذراً، لم أتمكن من معالجة طلبك.'};
    }

    const firstPart = parts[0];

    if ('functionCall' in firstPart && firstPart.functionCall) {
      const fnCall = firstPart.functionCall;
      const fnArgs = fnCall.args as Record<string, string | undefined>;

      contents.push({
        role: 'model',
        parts: [{functionCall: {name: fnCall.name, args: fnCall.args}}]
      });

      if (fnCall.name === 'searchRoutes') {
        const origin = fnArgs.origin ?? '';
        const destination = fnArgs.destination ?? '';
        const toolResult = await searchRoutes(origin, destination);
        routes = toolResult.routes;

        contents.push({
          role: 'function',
          parts: [
            {
              functionResponse: {
                name: 'searchRoutes',
                response: {
                  text: toolResult.text,
                  routes: toolResult.routes,
                  duration: toolResult.routes[0]?.duration,
                  cost: toolResult.routes[0]?.cost,
                  transfers: toolResult.routes[0]?.transfers
                }
              }
            }
          ]
        });
      } else if (fnCall.name === 'searchForum') {
        const query = fnArgs.query ?? '';
        const toolResult = await searchForum(query);

        contents.push({
          role: 'function',
          parts: [
            {
              functionResponse: {
                name: 'searchForum',
                response: {text: toolResult.text}
              }
            }
          ]
        });
      } else if (fnCall.name === 'findBusBetween') {
        const origin = fnArgs.origin ?? '';
        const destination = fnArgs.destination ?? '';
        const toolResult = await findBusBetween(origin, destination);

        contents.push({
          role: 'function',
          parts: [
            {
              functionResponse: {
                name: 'findBusBetween',
                response: {
                  text: toolResult.text,
                  routes: toolResult.routes,
                  found: toolResult.found
                }
              }
            }
          ]
        });
      } else if (fnCall.name === 'searchBusLine') {
        const query = fnArgs.query ?? '';
        const toolResult = await searchBusLine(query);

        contents.push({
          role: 'function',
          parts: [
            {
              functionResponse: {
                name: 'searchBusLine',
                response: {
                  text: toolResult.text,
                  routes: toolResult.routes,
                  found: toolResult.found
                }
              }
            }
          ]
        });
      } else if (fnCall.name === 'searchPlaces') {
        const query = fnArgs.query ?? '';
        const location = fnArgs.location;
        const toolResult = await searchPlaces(query, location);
        places = toolResult.places;

        contents.push({
          role: 'function',
          parts: [
            {
              functionResponse: {
                name: 'searchPlaces',
                response: {
                  text: toolResult.text,
                  places: toolResult.places
                }
              }
            }
          ]
        });
      } else {
        contents.push({
          role: 'function',
          parts: [
            {
              functionResponse: {
                name: fnCall.name,
                response: {error: `Unknown function: ${fnCall.name}`}
              }
            }
          ]
        });
      }

      continue;
    }

    if ('text' in firstPart && firstPart.text) {
      return {text: firstPart.text, routes, places};
    }

    return {text: 'عذراً، حدث خطأ أثناء معالجة طلبك.', routes, places};
  }

  return {text: 'عذراً، استغرق الطلب وقتاً طويلاً. حاول مرة أخرى.', routes, places};
}

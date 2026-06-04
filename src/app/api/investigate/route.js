import { investigate } from '@/lib/engine/orchestrator.js';
import { aggregate } from '@/lib/engine/result-aggregator.js';
import { resolve } from '@/lib/engine/identity-resolver.js';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { query, type } = await req.json();

    if (!query || !type) {
      return new Response(JSON.stringify({ error: 'Missing query or type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const encoder = new TextEncoder();
    const results = [];

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event, data) => {
          try {
            controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
          } catch (e) {
            // Stream might already be closed by client disconnect
          }
        };

        try {
          sendEvent('status', { message: 'Initializing modules...' });

          const rawResults = await investigate({
            query,
            type,
            onModuleComplete: (moduleResult) => {
              results.push(moduleResult);
              sendEvent('module_complete', {
                module: moduleResult.module,
                status: moduleResult.status,
                duration: moduleResult.duration,
                error: moduleResult.error,
                data: moduleResult.data,
              });
            },
          });

          sendEvent('status', { message: 'Aggregating and resolving profile...' });

          const profile = aggregate(query, type, rawResults);
          const resolvedProfile = resolve(profile);

          sendEvent('complete', resolvedProfile);
          controller.close();
        } catch (err) {
          sendEvent('error', { message: err.message || 'Error running investigation' });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

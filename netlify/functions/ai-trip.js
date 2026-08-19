// netlify/functions/ai-trip.js
// Proxy sicuro per Claude API — la chiave sta solo sul server

export default async (req, context) => {
  // Solo POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers })
  }

  try {
    const body = await req.json()
    const { prompt, system, max_tokens = 4000, output_schema, effort, model = 'claude-opus-5', enable_web_search = false } = body

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Missing prompt' }), { status: 400, headers })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500, headers })
    }

    const anthropicBody = {
      model,
      max_tokens,
      messages: [{ role: 'user', content: prompt }],
    }
    if (system) anthropicBody.system = system
    // `effort` is Opus/Sonnet-5-tier only — pre-4.6 models like claude-haiku-4-5 400 if it's
    // sent at all, so only include output_config when the caller actually asked for something.
    const output_config = {}
    if (effort) output_config.effort = effort
    if (output_schema) output_config.format = { type: 'json_schema', schema: output_schema }
    if (Object.keys(output_config).length) anthropicBody.output_config = output_config
    // Deliberately the BASIC web search tool (no dynamic filtering / code-execution
    // wrapping): measured ~29s (Opus 5) vs 120s+ for web_search_20260209 on the same
    // query — the dynamic variant has Claude write and run Python to filter results,
    // which is worth it for huge result sets but not for a handful of tourist-info
    // lookups. Latency matters here because a caller may be waiting on it live.
    if (enable_web_search) anthropicBody.tools = [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }]

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(anthropicBody),
    })

    if (!response.ok) {
      const err = await response.text()
      return new Response(JSON.stringify({ error: `Claude API error: ${response.status}`, detail: err }), { status: response.status, headers })
    }

    const data = await response.json()
    return new Response(JSON.stringify(data), { status: 200, headers })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers })
  }
}

export const config = {
  path: '/api/ai-trip',
}

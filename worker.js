export default {
  async fetch(request, env, ctx) {
    // CORS
    const origin = request.headers.get('Origin') || '';
    const allow = /github\.io$/.test(new URL(origin).host) || /localhost/.test(origin);
    const CORS = {
      "Access-Control-Allow-Origin": allow ? origin : "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: "Use POST" }), { status: 405, headers: { "content-type": "application/json", ...CORS }});
    }

    if (!env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), { status: 500, headers: { "content-type": "application/json", ...CORS }});
    }

    const body = await request.json().catch(()=>({}));
    const messages = Array.isArray(body.messages) ? body.messages : [];

    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        input: [
          { role: 'system', content: 'ساعد الطالب في شرح خطوات حل المسائل الرياضية بالعربية وباختصار ووضوح.' },
          ...messages
        ],
        max_output_tokens: 700
      })
    });

    const data = await r.json();
    const reply =
      data.output_text ||
      (Array.isArray(data.output) ? data.output.map(x => x?.content?.[0]?.text?.value || '').join('\n') : '') ||
      '—';

    return new Response(JSON.stringify({ reply }), { headers: { "content-type": "application/json", ...CORS }});
  }
}

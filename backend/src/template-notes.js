const { v4: uuidv4 } = require('uuid');

function createTemplateNotes() {
  const now = new Date();
  const quickStartTime = now.toISOString();
  const apiTime = new Date(now.getTime() - 1000).toISOString();
  const pythagorasTime = new Date(now.getTime() - 2000).toISOString();
  const bezierTime = new Date(now.getTime() - 3000).toISOString();

  return [
    {
      id: uuidv4(),
      title: 'Quick Start Pointers',
      content: [
        '1. Open /admin on your server and create or edit notes.',
        '2. Start the backend with npm run dev in backend/.',
        '3. Generate the Even QR for /glasses/ and scan it in the Even app.',
        '4. On the glasses: scroll moves selection, click opens a note, click again returns to the list.',
        '5. Keep your phone and server on the same network if you are using the private IP.'
      ].join('\n'),
      image: null,
      pinned: true,
      created_at: quickStartTime,
      updated_at: quickStartTime
    },
    {
      id: uuidv4(),
      title: 'OpenAI API',
      content: [
        'OpenAI text examples:',
        '',
        'Responses API (recommended for new work):',
        'curl https://api.openai.com/v1/responses \\',
        '  -H "Authorization: Bearer $OPENAI_API_KEY" \\',
        '  -H "Content-Type: application/json" \\',
        '  -d \'{"model":"gpt-5-mini","input":"Write a haiku about notes."}\'',
        '',
        'JavaScript:',
        'const r = await fetch("https://api.openai.com/v1/responses", { method:"POST", headers:{ "Authorization":`Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type":"application/json" }, body: JSON.stringify({ model:"gpt-5-mini", input:"Write a haiku about notes." }) });',
        '',
        'Chat Completions:',
        'POST /v1/chat/completions',
        'Body: { "model": "gpt-4.1-mini", "messages": [{"role":"user","content":"Hello"}] }',
        '',
        'curl https://api.openai.com/v1/chat/completions \\',
        '  -H "Authorization: Bearer $OPENAI_API_KEY" \\',
        '  -H "Content-Type: application/json" \\',
        '  -d \'{"model":"gpt-4.1-mini","messages":[{"role":"user","content":"Hello"}]}\'',
        '',
        'SDK hints:',
        'Responses SDK often gives response.output_text',
        'Chat completion text is choices[0].message.content',
        '',
        'Headers for both:',
        'Authorization: Bearer YOUR_OPENAI_API_KEY',
        'Content-Type: application/json',
        '',
        'For new projects, Responses is the recommended API. Chat Completions is still supported.'
      ].join('\n'),
      image: null,
      pinned: true,
      created_at: apiTime,
      updated_at: apiTime
    },
    {
      id: uuidv4(),
      title: "Pythagoras' Theorem",
      content: [
        'a^2 + b^2 = c^2',
        '',
        'Right triangle:',
        '      c',
        '     /|',
        '    / |',
        '   /  | a',
        '  /   |',
        ' /____|',
        '   b',
        '',
        'Classic example:',
        '3^2 + 4^2 = 5^2',
        '9 + 16 = 25',
        '',
        'Square-area view:',
        'area on a-leg + area on b-leg = area on hypotenuse'
      ].join('\n'),
      image: null,
      pinned: false,
      created_at: pythagorasTime,
      updated_at: pythagorasTime
    },
    {
      id: uuidv4(),
      title: 'Bezier Curves',
      content: [
        'Quadratic Bezier:',
        'B(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2',
        '',
        'Control sketch:',
        'P0 o------o P1',
        '   \\',
        '    \\  curve',
        '     \\___.',
        '         \\',
        '          o P2',
        '',
        'Cubic Bezier:',
        'B(t) = (1-t)^3 P0 + 3(1-t)^2 t P1 + 3(1-t)t^2 P2 + t^3 P3',
        '',
        'Used in vector drawing, font outlines, and UI motion paths.'
      ].join('\n'),
      image: null,
      pinned: false,
      created_at: bezierTime,
      updated_at: bezierTime
    }
  ];
}

module.exports = { createTemplateNotes };

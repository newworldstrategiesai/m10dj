// Debug endpoint to test OpenAI API
// Blocked in production for security
export default async function handler(req, res) {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    // Check if API key exists
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'OPENAI_API_KEY not found in environment variables',
        hasKey: false 
      });
    }

    // Test a simple OpenAI call
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say "OpenAI is working!" in exactly 5 words.' }
        ],
        max_tokens: 50,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: 'OpenAI API error',
        status: response.status,
        statusText: response.statusText,
        details: errorText,
        hasKey: true,
        keyLength: apiKey.length
      });
    }

    const data = await response.json();
    
    return res.status(200).json({
      success: true,
      hasKey: true,
      keyLength: apiKey.length,
      response: data.choices[0].message.content,
      usage: data.usage
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Debug endpoint error',
      message: error.message,
      hasKey: !!process.env.OPENAI_API_KEY
    });
  }
}

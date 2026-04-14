const axios = require('axios');

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = req.headers['x-api-key'];
  const region = req.headers['x-region'] || 'beijing';

  if (!apiKey) {
    return res.status(401).json({ error: 'API key is required' });
  }

  const baseUrl = region === 'singapore'
    ? 'https://dashscope-intl.aliyuncs.com'
    : 'https://dashscope.aliyuncs.com';

  try {
    // For streaming responses, we need to handle SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const response = await axios({
      method: 'POST',
      url: `${baseUrl}/compatible-mode/v1/chat/completions`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      data: req.body,
      responseType: 'stream',
      timeout: 300000, // 5 minute timeout
    });

    // Pipe the SSE stream to the client
    response.data.pipe(res);

  } catch (error) {
    console.error('API proxy error:', error.message);
    
    // If headers haven't been sent yet, return error
    if (!res.headersSent) {
      res.status(error.response?.status || 500).json({
        error: error.message,
        details: error.response?.data
      });
    } else {
      // End the stream with an error message
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
};

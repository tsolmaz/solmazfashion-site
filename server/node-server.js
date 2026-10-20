/**
 * Solmaz Fashion — NVIDIA AI Proxy Server (Node.js + Express)
 * 
 * Bu proxy server, client-side AI asistanının NVIDIA API anahtarını 
 * görmeden güvenli bir şekilde API çağrıları yapmasını sağlar.
 * 
 * KURULUM:
 * 1. npm init -y
 * 2. npm install express cors dotenv node-fetch
 * 3. .env dosyası oluşturun: NVIDIA_API_KEY=nvapi-XXXXXXXX
 * 4. node server.js
 * 
 * PRODUCTION: Vercel, Railway, Render, Fly.io gibi platformlarda deploy edin.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Production'da frontend domain'inizi yazın
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json({ limit: '1mb' }));

// Rate limiting (basit)
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 dakika
const RATE_LIMIT_MAX = 30; // dakikada max 30 istek

function rateLimit(ip) {
  const now = Date.now();
  const userRequests = requestCounts.get(ip) || [];
  const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= RATE_LIMIT_MAX) {
    return false;
  }
  
  recentRequests.push(now);
  requestCounts.set(ip, recentRequests);
  return true;
}

// Ana chat endpoint
app.post('/api/ai-chat', async (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // Rate limiting
  if (!rateLimit(clientIP)) {
    return res.status(429).json({ 
      error: { message: 'Çok fazla istek. Lütfen biraz bekleyin.' } 
    });
  }

  try {
    const { model, messages, temperature, max_tokens, stream } = req.body;

    // Validasyon
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: { message: 'Geçersiz mesaj formatı' } });
    }

    // NVIDIA API çağrısı
    const nvidiaResponse = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model: model || 'nvidia/nemotron-3-ultra',
        messages: messages,
        temperature: temperature ?? 0.7,
        max_tokens: max_tokens ?? 1024,
        stream: stream ?? false
      })
    });

    if (!nvidiaResponse.ok) {
      const errorData = await nvidiaResponse.json().catch(() => ({}));
      console.error('NVIDIA API Error:', nvidiaResponse.status, errorData);
      return res.status(nvidiaResponse.status).json({ 
        error: { message: errorData.error?.message || 'AI servisi şu anda kullanılamıyor' } 
      });
    }

    const data = await nvidiaResponse.json();
    res.json(data);

  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ 
      error: { message: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.' } 
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Solmaz Fashion AI Proxy running on http://localhost:${PORT}`);
  console.log(`📡 Endpoint: POST /api/ai-chat`);
  console.log(`🔑 NVIDIA API Key: ${process.env.NVIDIA_API_KEY ? 'Yüklendi' : 'EKSİK!'}`);
});
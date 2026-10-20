/**
 * Solmaz Fashion AI Proxy Server (Node.js + Express)
 * 
 * Gelişmiş AI Asistanı için güvenli proxy:
 * - NVIDIA Nemotron 3 Ultra API güvenli çağrı
 * - Müşteri bilgisi toplama (isim, telefon, email, şirket)
 * - Sohbet geçmişi yönetimi
 * - Lead capture ve forwarding (Email + WhatsApp)
 * - Rate limiting ve güvenlik
 */

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.AI_PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['POST', 'OPTIONS', 'GET'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '1mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 dakika
  max: 30, // dakikada max 30 istek
  message: { error: { message: 'Çok fazla istek. Lütfen biraz bekleyin.' } },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// In-memory session store (production'da Redis kullanın)
const sessions = new Map();

// NVIDIA API Configuration
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const DEFAULT_MODEL = 'nvidia/nemotron-3-ultra';

// Forwarding configuration
const FORWARD_EMAIL = process.env.FORWARD_EMAIL || 'solmaztayyip1@gmail.com';
const FORWARD_WHATSAPP = process.env.FORWARD_WHATSAPP || '905523973838';

// Brand context for AI
const BRAND_CONTEXT = `
SEN: Solmaz Fashion (By. Boomer) — Kurumsal AI Müşteri Asistanı
KİMLİK: Merter/İstanbul merkezli, kendi üretim tesislerinde premium kalitede erkek giyim üreten, toptan satış yapan üretici marka.
ÖNEMLİ: Asla "acente", "araç", "bayi" gibi terimler kullanma. "Üreticiyiz, aracı değiliz" ilkesini her yanıtta yansıt.

MARKA BİLGİLERİ:
- Marka: Solmaz Fashion (By. Boomer) / Boomer Brand
- Sektör: Toptan Erkek Giyim ÜRETİMİ (B2B ağırlıklı; butik-esnaf satışı + perakende)
- Konum: Merter / İstanbul — Türkiye'nin toptan giyim üretim üssü
- Adres: ABDURRAHMAN NAFİZ GÜRMAN MAH. NADİDE CAD. AK ÇARŞI NO: 15 İÇ KAPI NO: 413 GÜNGÖREN/İSTANBUL
- WhatsApp (Müşteri): +90 546 939 20 28
- WhatsApp (Yönlendirme): +90 552 397 38 38
- Telegram: https://t.me/Boomerbrandd (7.500+ abone)
- E-posta: brandboomer79@gmail.com
- Yönlendirme E-posta: solmaztayyip1@gmail.com
- Instagram: https://www.instagram.com/solmazfashiontr/ (4.600+ takipçi, doğrulanmış)

ÜRÜN YELPAZESİ:
- 3 İplik 600gr Şardonsuz Sweatshirt (Ana Ürün)
- Eşofman Takımları (3 iplik şardon, 6'lı/12'li koli)
- Fermuarlı Hoodi / Kapşonlu Modeller
- Kaşe & Polar Hırkalar (300-500 g/m²)
- %100 Pamuklu Tişörtler (12'li koli)
- Tracksuit Spor Takımları

FARKLARIMIZ:
✅ Üreticiyiz, aracı değiliz → Fiyat/kalite avantajı
✅ Kendi dikim hattımız → Kalite kontrolü, hızlı tedarik
✅ 600 gr/m² garantili gramaj
✅ %100 Pamuk (opsiyonel %5 elastan)
✅ A kalite dikim (flatlock), YKK fermuar, premium aksesuar
✅ Koli bazlı karışık sipariş (beden/renk esnekliği)
✅ Türkiye & Dünya geneli kargo
✅ Private Label (öz marka) üretim kapasitesi (min 500-1000 adet/model)

HİTAP ETTİĞİMİZ PAZAR:
- B2B: Butik/giyim mağazası sahipleri, pazar esnafı, online satıcılar (Trendyol/Hepsiburada), ihracatçılar
- B2C: Kaliteli ve uygun fiyatlı erkek giyim arayan son kullanıcı (Showroom'da perakende)

SATIŞ SÜRECİ:
1. WhatsApp'tan iletişim → Stok/fiyat listesi paylaşımı
2. Numune talep edilebilir (kargo alıcıya aittir, siparişte karşılanır)
3. Minimum sipariş: 1 koli (6'lı veya 12'lı)
4. Ödemeler: Peşin havale/EFT, kapıda ödeme (İstanbul), kredi kartı linki
5. Yeni müşterilerde ilk sipariş peşin, sonra kredi limiti (30-60 gün)
6. Üretim hatalı ürünlerde 7 gün içinde değiştirim/ikram

GÖREVLERİN:
1. Müşteri ile doğal, profesyonel, güven veren tonla sohbet et
2. Müşteri bilgilerini (isim, telefon, email, şirket, ilgi alanı) doğal yollarla topla
3. Ürün sorularını teknik detaylarla cevapla (gramaj, iplik, dikim, aksesuar)
5. Müşteri sipariş verme niyeti gösterirse → WhatsApp/Telegram yönlendir
6. Müşteri iletişim bilgisi verirse → Lead olarak kaydet ve forwarding tetikle
7. Asla sahte stok, sahte fiyat, uydurma bilgi verme
8. Bilinmeyen konularda "Detay için WhatsApp hattımızdan iletişime geçin" deyin
`;

function getSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      id: sessionId,
      messages: [],
      leadData: {},
      createdAt: Date.now(),
      lastActivity: Date.now()
    });
  }
  const session = sessions.get(sessionId);
  session.lastActivity = Date.now();
  return session;
}

function updateSession(sessionId, updates) {
  const session = getSession(sessionId);
  Object.assign(session, updates);
  return session;
}

function addMessage(sessionId, role, content, metadata = {}) {
  const session = getSession(sessionId);
  session.messages.push({
    role,
    content,
    timestamp: Date.now(),
    ...metadata
  });
  // Keep last 20 messages for context
  if (session.messages.length > 20) {
    session.messages = session.messages.slice(-20);
  }
  return session;
}

function extractLeadData(message) {
  const leadData = {};
  
  // Extract phone numbers
  const phoneRegex = /(\+90\s?)?(\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2})/g;
  const phones = message.match(phoneRegex);
  if (phones) leadData.phone = phones[0];

  // Extract emails
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = message.match(emailRegex);
  if (emails) leadData.email = emails[0];

  // Extract names (simple heuristic - "Ben [İsim]", "Adım [İsim]", "İsim: [İsim]")
  const namePatterns = [
    /ben\s+([a-zçğıöşü]+(?:\s+[a-zçğıöşü]+){1,2})/gi,
    /ad[ıi]m\s+([a-zçğıöşü]+(?:\s+[a-zçğıöşü]+){1,2})/gi,
    /isim\s*[:\-]\s*([a-zçğıöşü]+(?:\s+[a-zçğıöşü]+){1,2})/gi
  ];
  for (const pattern of namePatterns) {
    const match = message.match(pattern);
    if (match) {
      leadData.name = match[1].trim();
      break;
    }
  }

  // Extract company
  const companyPatterns = [
    /(?:şirket|firma|mağaza|butik|marka)\s*[:\-]?\s*([a-zçğıöşü0-9\s]+)/gi,
    /(?:ben|biz)\s+([a-zçğıöşü]+(?:\s+[a-zçğıöşü]+){1,2})\s+(?:şirketi|firması|mağazası|butiği)/gi
  ];
  for (const pattern of companyPatterns) {
    const match = message.match(pattern);
    if (match) {
      leadData.company = match[1].trim();
      break;
    }
  }

  return leadData;
}

async function forwardLead(leadData, conversationHistory) {
  const results = { email: false, whatsapp: false };

  // 1. Forward via Email (using mailto - client-side fallback)
  // In production, use a real email service like SendGrid, Nodemailer, etc.
  try {
    const emailContent = `
Yeni Lead - Solmaz Fashion AI Asistanı
=========================================
Tarih: ${new Date().toLocaleString('tr-TR')}

Müşteri Bilgileri:
- İsim: ${leadData.name || 'Belirtilmedi'}
- Telefon: ${leadData.phone || 'Belirtilmedi'}
- E-posta: ${leadData.email || 'Belirtilmedi'}
- Şirket/Firma: ${leadData.company || 'Belirtilmedi'}

Sohbet Geçmişi:
${conversationHistory.map(m => `[${m.role}] ${m.content}`).join('\n')}

---
Bu mesaj Solmaz Fashion AI Asistanı tarafından otomatik gönderilmiştir.
    `.trim();

    // For now, we'll create a mailto link that the frontend can use
    // In production, integrate with SendGrid, Nodemailer, etc.
    console.log('📧 Email forward prepared for:', FORWARD_EMAIL);
    results.email = true;
  } catch (error) {
    console.error('Email forward error:', error);
  }

  // 2. Forward via WhatsApp (create WhatsApp link)
  try {
    const whatsappMessage = `
🔔 YENİ LEAD - Solmaz Fashion AI Asistanı

👤 Müşteri: ${leadData.name || 'İsimsiz'}
📞 Telefon: ${leadData.phone || 'Yok'}
📧 E-posta: ${leadData.email || 'Yok'}
🏢 Firma: ${leadData.company || 'Yok'}

💬 Sohbet özeti: AI asistanı ile sohbet etti, ilgi gösterdi.

🔗 Detaylı sohbet geçmişi sistemde kayıtlı.
    `.trim();

    const whatsappLink = `https://wa.me/${FORWARD_WHATSAPP}?text=${encodeURIComponent(whatsappMessage)}`;
    console.log('📱 WhatsApp forward link:', whatsappLink);
    results.whatsapp = true;
  } catch (error) {
    console.error('WhatsApp forward error:', error);
  }

  return results;
}

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['POST', 'OPTIONS', 'GET'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID']
}));
app.use(express.json({ limit: '1mb' }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: { message: 'Çok fazla istek. Lütfen biraz bekleyin.' } }
});
app.use('/api/', apiLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'solmaz-fashion-ai-proxy', timestamp: new Date().toISOString() });
});

// Get or create session
app.post('/api/session', (req, res) => {
  const sessionId = req.headers['x-session-id'] || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const session = getSession(sessionId);
  res.json({ sessionId, session });
});

// Chat completion endpoint
app.post('/api/ai-chat', async (req, res) => {
  const sessionId = req.headers['x-session-id'] || req.body.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const { model, messages, temperature, max_tokens, stream } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: { message: 'Geçersiz mesaj formatı' } });
  }

  const session = getSession(sessionId);
  const userMessage = messages[messages.length - 1];

  // Add user message to session
  addMessage(sessionId, 'user', userMessage.content);

  // Extract lead data from user message
  const newLeadData = extractLeadData(userMessage.content);
  if (Object.keys(newLeadData).length > 0) {
    session.leadData = { ...session.leadData, ...newLeadData };
  }

  // Prepare messages for NVIDIA API
  const systemMessage = { role: 'system', content: BRAND_CONTEXT };
  const historyMessages = session.messages.slice(-10).map(m => ({
    role: m.role,
    content: m.content
  }));

  const payload = {
    model: model || DEFAULT_MODEL,
    messages: [systemMessage, ...historyMessages],
    temperature: temperature ?? 0.7,
    max_tokens: max_tokens ?? 1024,
    stream: stream ?? false
  };

  try {
    const nvidiaResponse = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!nvidiaResponse.ok) {
      const errorData = await nvidiaResponse.json().catch(() => ({}));
      console.error('NVIDIA API Error:', nvidiaResponse.status, errorData);
      return res.status(nvidiaResponse.status).json({
        error: { message: errorData.error?.message || 'AI servisi şu anda kullanılamıyor' }
      });
    }

    const data = await nvidiaResponse.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'Üzgünüm, yanıt alınamadı.';

    // Add AI response to session
    addMessage(sessionId, 'assistant', aiResponse);

    // Check if lead data is complete enough to forward
    const hasContactInfo = session.leadData.phone || session.leadData.email;
    const hasName = session.leadData.name;
    const messageCount = session.messages.filter(m => m.role === 'user').length;

    // Forward lead if we have contact info and enough conversation
    if ((hasContactInfo || hasName) && messageCount >= 2 && !session.forwarded) {
      session.forwarded = true;
      const conversationHistory = session.messages.slice(-10);
      const forwardResults = await forwardLead(session.leadData, conversationHistory);
      
      // Add forwarding info to response metadata
      data.forwarded = forwardResults;
      data.leadData = session.leadData;
      data.whatsappLink = `https://wa.me/${FORWARD_WHATSAPP}?text=${encodeURIComponent(`Yeni lead: ${session.leadData.name || 'Müşteri'} - ${session.leadData.phone || session.leadData.email || 'İletişim bilgisi yok'}`)}`;
    }

    // Add session info to response
    data.sessionId = sessionId;
    data.leadData = session.leadData;

    res.json(data);

  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({
      error: { message: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.' }
    });
  }
});

// Get session info
app.get('/api/session/:sessionId', (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: { message: 'Oturum bulunamadı' } });
  }
  res.json({ sessionId: req.params.sessionId, session });
});

// Lead forwarding endpoint (manual trigger)
app.post('/api/forward-lead', async (req, res) => {
  const { sessionId, leadData } = req.body;
  const session = sessions.get(sessionId) || { leadData: leadData || {} };
  
  const results = await forwardLead(session.leadData || leadData, session.messages || []);
  res.json({ success: true, results });
});

// Cleanup old sessions (run every hour)
setInterval(() => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  for (const [id, session] of sessions.entries()) {
    if (now - session.lastActivity > maxAge) {
      sessions.delete(id);
    }
  }
}, 60 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`🚀 Solmaz Fashion AI Proxy running on http://localhost:${PORT}`);
  console.log(`📡 Endpoints:`);
  console.log(`   POST /api/ai-chat - Chat completion`);
  console.log(`   POST /api/session - Create/get session`);
  console.log(`   GET  /api/session/:id - Get session info`);
  console.log(`   POST /api/forward-lead - Manual lead forward`);
  console.log(`   GET  /health - Health check`);
  console.log(`🔑 NVIDIA API Key: ${NVIDIA_API_KEY ? 'Configured' : 'MISSING!'}`);
  console.log(`📧 Forward Email: ${FORWARD_EMAIL}`);
  console.log(`📱 Forward WhatsApp: +${FORWARD_WHATSAPP}`);
});
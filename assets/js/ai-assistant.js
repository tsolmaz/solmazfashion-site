/**
 * SOLMAZ FASHION — AI Asistan (NVIDIA Nemotron 3 Ultra)
 * 
 * Özellikler:
 * - Gerçek zamanlı sohbet (session-based)
 * - Müşteri bilgisi toplama (isim, telefon, email, şirket)
 * - Lead capture ve forwarding (Email + WhatsApp)
 * - WhatsApp/Telegram yönlendirme (sohbet akışına göre)
 * - Session yönetimi (localStorage + server-side)
 * - Responsive tasarım
 */

(function() {
  'use strict';

  // ============================================================
  // MARKALAMA VE SİSTEM PROMPT
  // ============================================================
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
4. Müşteri sipariş verme niyeti gösterirse → WhatsApp/Telegram yönlendir
5. Müşteri iletişim bilgisi verirse → Lead olarak kaydet
6. Asla sahte stok, sahte fiyat, uydurma bilgi verme
7. Bilinmeyen konularda "Detay için WhatsApp hattımızdan iletişime geçin" deyin
`;

  // ============================================================
  // WIDGET HTML ŞABLONU
  // ============================================================
  const WIDGET_HTML = `
<div class="ai-assistant-widget" id="aiAssistantWidget" role="region" aria-label="Solmaz Fashion AI Asistanı">
  <!-- Toggle Button -->
  <button class="ai-assistant-toggle" id="aiAssistantToggle" aria-label="AI Asistanını aç/kapat" aria-expanded="false">
    <svg class="toggle-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
    <span class="toggle-badge" id="aiToggleBadge" aria-live="polite">Yeni</span>
    <span class="toggle-tooltip">AI Asistan</span>
  </button>

  <!-- Chat Window -->
  <div class="ai-assistant-window" id="aiAssistantWindow" role="dialog" aria-modal="true" aria-label="AI Asistan Sohbeti" hidden>
    <header class="ai-window-header">
      <div class="ai-header-avatar" aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
          <path d="M8 21h8M12 17h.01"/>
        </svg>
      </div>
      <div class="ai-header-info">
        <h3 class="ai-header-title">Solmaz Fashion Asistanı</h3>
        <span class="ai-header-subtitle">Üretici Kaynaklı Toptan Destek</span>
      </div>
      <button class="ai-window-close" id="aiWindowClose" aria-label="Sohbeti kapat">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </header>

    <div class="ai-window-messages" id="aiWindowMessages" role="log" aria-live="polite" aria-label="Sohbet geçmişi">
      <!-- Messages will be inserted here -->
    </div>

    <div class="ai-window-typing" id="aiTypingIndicator" hidden aria-live="polite">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-text">Yazıyor...</span>
    </div>

    <form class="ai-window-input" id="aiInputForm" onsubmit="return false;">
      <div class="ai-input-wrapper">
        <input type="text" class="ai-input-field" id="aiInputField" placeholder="Sipariş, stok, fiyat, numune... Her konuda yardımcı olayım" autocomplete="off" aria-label="Mesajınızı yazın" maxlength="1000">
        <button type="submit" class="ai-input-send" id="aiInputSend" aria-label="Gönder">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
      <p class="ai-input-hint">Enter: Gönder | Shift+Enter: Yeni satır</p>
    </form>

    <!-- Quick Action Buttons -->
    <div class="ai-quick-actions" id="aiQuickActions" hidden>
      <button type="button" class="ai-quick-btn" data-action="whatsapp">📱 WhatsApp'a Bağlan</button>
      <button type="button" class="ai-quick-btn" data-action="telegram">📋 Telegram Kataloğu</button>
      <button type="button" class="ai-quick-btn" data-action="catalog">📋 Katalog İste</button>
      <button type="button" class="ai-quick-btn" data-action="sample">🧪 Numune Talep Et</button>
    </div>
  </div>
</div>
`;

  // ============================================================
  // WIDGET STILLERİ (CSS-in-JS)
  // ============================================================
  const WIDGET_STYLES = `
<style id="aiAssistantStyles">
/* === AI Assistant Widget === */
.ai-assistant-widget {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 10000;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --ai-primary: #1a1a2e;
  --ai-gold: #c8a951;
  --ai-gold-hover: #b89846;
  --ai-bg: #ffffff;
  --ai-text: #1a1a2e;
  --ai-text-secondary: #4a4a5a;
  --ai-border: #e0dad0;
  --ai-user-msg: #1a1a2e;
  --ai-bot-msg: #f5f0e8;
  --ai-shadow: 0 12px 40px rgba(26, 26, 46, 0.15);
  --ai-radius: 16px;
}

/* Toggle Button */
.ai-assistant-toggle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--ai-primary) 0%, #0d0d1a 100%);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--ai-shadow);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease;
  position: relative;
}
.ai-assistant-toggle:hover {
  transform: scale(1.08);
  box-shadow: 0 16px 48px rgba(26, 26, 46, 0.25);
}
.ai-assistant-toggle:focus-visible {
  outline: 3px solid var(--ai-gold);
  outline-offset: 3px;
}
.ai-assistant-toggle .toggle-icon {
  color: var(--ai-gold);
  transition: transform 0.3s ease;
}
.ai-assistant-toggle:hover .toggle-icon {
  transform: rotate(12deg);
}
.ai-assistant-toggle .toggle-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: var(--ai-gold);
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 10px;
  animation: pulse 2s infinite;
}
.ai-assistant-toggle .toggle-tooltip {
  position: absolute;
  right: 70px;
  top: 50%;
  transform: translateY(-50%);
  background: var(--ai-primary);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-50%) translateX(10px);
  transition: all 0.2s ease;
  pointer-events: none;
}
.ai-assistant-toggle:hover .toggle-tooltip {
  opacity: 1;
  visibility: visible;
  transform: translateY(-50%) translateX(0);
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
}

/* Window */
.ai-assistant-window {
  position: absolute;
  bottom: 80px;
  right: 0;
  width: 380px;
  max-width: calc(100vw - 48px);
  height: 580px;
  max-height: 70vh;
  background: var(--ai-bg);
  border-radius: var(--ai-radius);
  box-shadow: var(--ai-shadow);
  border: 1px solid var(--ai-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  opacity: 0;
  transform: translateY(20px) scale(0.95);
  visibility: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.ai-assistant-window.open {
  opacity: 1;
  transform: translateY(0) scale(1);
  visibility: visible;
}

/* Header */
.ai-window-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: linear-gradient(135deg, var(--ai-primary) 0%, #0d0d1a 100%);
  color: white;
  border-bottom: 1px solid rgba(200, 169, 81, 0.2);
}
.ai-header-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(200, 169, 81, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ai-gold);
  flex-shrink: 0;
}
.ai-header-info {
  flex: 1;
  min-width: 0;
}
.ai-header-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ai-header-subtitle {
  font-size: 11px;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.ai-window-close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}
.ai-window-close:hover {
  background: rgba(255,255,255,0.2);
}

/* Messages Area */
.ai-window-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.ai-window-messages::-webkit-scrollbar { width: 6px; }
.ai-window-messages::-webkit-scrollbar-track { background: transparent; }
.ai-window-messages::-webkit-scrollbar-thumb { background: var(--ai-border); border-radius: 3px; }

/* Message Bubbles */
.ai-message {
  display: flex;
  gap: 10px;
  max-width: 85%;
  animation: messageIn 0.3s ease;
}
@keyframes messageIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.ai-message.bot { align-self: flex-start; }
.ai-message.user { align-self: flex-end; flex-direction: row-reverse; }

.ai-message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}
.ai-message.bot .ai-message-avatar {
  background: rgba(200, 169, 81, 0.15);
  color: var(--ai-gold);
}
.ai-message.user .ai-message-avatar {
  background: var(--ai-primary);
  color: white;
}
.ai-message-avatar svg { width: 18px; height: 18px; }

.ai-message-content {
  background: var(--ai-bot-msg);
  border-radius: 18px;
  padding: 12px 16px;
  border-bottom-left-radius: 4px;
  color: var(--ai-text);
}
.ai-message.user .ai-message-content {
  background: var(--ai-user-msg);
  color: #ffffff !important;
  border-radius: 18px;
  border-bottom-right-radius: 4px;
}
.ai-message.user .ai-message-content * { color: #ffffff !important; }

.ai-message-content p {
  margin: 0 0 8px;
  line-height: 1.6;
  font-size: 14px;
  color: var(--ai-text);
}
.ai-message.user .ai-message-content p { color: #ffffff !important; margin: 0; }
.ai-message-content p:last-child { margin-bottom: 0; }
.ai-message-content strong { color: inherit; font-weight: 600; }
.ai-message-content a { color: var(--ai-primary); text-decoration: underline; }
.ai-message.user .ai-message-content a { color: var(--ai-gold); }

.ai-message-time {
  font-size: 10px;
  opacity: 0.6;
  margin-top: 6px;
  display: block;
}
.ai-message.user .ai-message-time { text-align: right; }

/* Action Buttons in Messages */
.ai-message-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap;
}
.ai-message-action-btn {
  padding: 8px 14px;
  background: var(--ai-primary);
  color: var(--ai-gold);
  border: 1px solid var(--ai-gold);
  border-radius: 20px;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}
.ai-message-action-btn:hover {
  background: var(--ai-gold);
  color: white;
}
.ai-message-action-btn.secondary {
  background: transparent;
  color: var(--ai-primary);
  border-color: var(--ai-border);
}
.ai-message-action-btn.secondary:hover {
  background: var(--ai-primary);
  color: white;
}

/* Typing Indicator */
.ai-window-typing {
  padding: 0 20px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--ai-text-secondary);
  font-size: 13px;
}
.typing-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--ai-gold);
  animation: typingBounce 1.4s infinite ease-in-out both;
}
.typing-dot:nth-child(1) { animation-delay: -0.32s; }
.typing-dot:nth-child(2) { animation-delay: -0.16s; }
@keyframes typingBounce {
  0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}
.typing-text { font-size: 12px; opacity: 0.7; }

/* Input Area */
.ai-window-input {
  padding: 16px 20px;
  border-top: 1px solid var(--ai-border);
  background: var(--ai-bg);
}
.ai-input-wrapper {
  display: flex;
  gap: 10px;
}
.ai-input-field {
  flex: 1;
  border: 2px solid var(--ai-border);
  border-radius: 24px;
  padding: 12px 18px;
  font-size: 14px;
  font-family: inherit;
  color: var(--ai-text);
  background: var(--ai-bg);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  min-height: 48px;
}
.ai-input-field:focus {
  outline: none;
  border-color: var(--ai-gold);
  box-shadow: 0 0 0 3px rgba(200, 169, 81, 0.2);
}
.ai-input-field::placeholder { color: var(--ai-text-secondary); opacity: 0.7; }
.ai-input-send {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--ai-primary);
  border: none;
  color: var(--ai-gold);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}
.ai-input-send:hover:not(:disabled) {
  background: #0d0d1a;
  transform: scale(1.05);
}
.ai-input-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.ai-input-hint {
  font-size: 11px;
  color: var(--ai-text-secondary);
  margin: 8px 0 0;
  opacity: 0.7;
}

/* Quick Actions */
.ai-quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 20px 16px;
}
.ai-quick-btn {
  padding: 10px 14px;
  background: var(--ai-bg);
  border: 1px solid var(--ai-border);
  border-radius: 20px;
  font-size: 12px;
  font-family: inherit;
  color: var(--ai-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  font-weight: 500;
}
.ai-quick-btn:hover {
  border-color: var(--ai-gold);
  color: var(--ai-primary);
  background: rgba(200, 169, 81, 0.08);
}

/* Welcome Card */
.ai-welcome-card {
  background: linear-gradient(135deg, rgba(200, 169, 81, 0.1) 0%, rgba(26, 26, 46, 0.05) 100%);
  border: 1px solid rgba(200, 169, 81, 0.2);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}
.ai-welcome-card h4 {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 15px;
  margin: 0 0 10px;
  color: var(--ai-primary);
}
.ai-welcome-card ul {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  line-height: 1.8;
  color: var(--ai-text-secondary);
}
.ai-welcome-card li { margin-bottom: 4px; }

/* Lead Form */
.ai-lead-form {
  background: var(--ai-bg);
  border: 1px solid var(--ai-border);
  border-radius: 12px;
  padding: 16px;
  margin-top: 12px;
}
.ai-lead-form h4 {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 14px;
  margin: 0 0 12px;
  color: var(--ai-primary);
}
.ai-lead-form .form-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}
.ai-lead-form .form-group {
  flex: 1;
}
.ai-lead-form label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: var(--ai-text-secondary);
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.ai-lead-form input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--ai-border);
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  color: var(--ai-text);
  background: var(--ai-bg);
  transition: border-color 0.2s ease;
}
.ai-lead-form input:focus {
  outline: none;
  border-color: var(--ai-gold);
}
.ai-lead-form button {
  width: 100%;
  padding: 12px;
  background: var(--ai-primary);
  color: var(--ai-gold);
  border: 1px solid var(--ai-gold);
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.ai-lead-form button:hover {
  background: var(--ai-gold);
  color: white;
}

/* Forward Notice */
.ai-forward-notice {
  background: rgba(200, 169, 81, 0.1);
  border: 1px solid rgba(200, 169, 81, 0.3);
  border-radius: 8px;
  padding: 12px;
  margin-top: 12px;
  font-size: 12px;
  color: var(--ai-primary);
}
.ai-forward-notice strong { color: var(--ai-gold); }

/* Mobile Responsive */
@media (max-width: 480px) {
  .ai-assistant-widget { bottom: 16px; right: 16px; left: 16px; }
  .ai-assistant-toggle { margin: 0 auto; }
  .ai-assistant-window {
    width: 100%;
    max-width: 100%;
    height: 100%;
    max-height: 100%;
    bottom: 80px;
    right: 0;
    left: 0;
    border-radius: var(--ai-radius) var(--ai-radius) 0 0;
  }
  .ai-assistant-window.open { transform: translateY(0) scale(1); }
  .ai-quick-btn { flex: 1; text-align: center; }
  .ai-message { max-width: 90%; }
  .ai-lead-form .form-row { flex-direction: column; gap: 0; }
}
</style>
`;

  // ============================================================
  // ANA SINIF: AIAssistant
  // ============================================================
  class AIAssistant {
    constructor(config = {}) {
      this.config = {
        apiEndpoint: config.apiEndpoint || '/api/ai-chat',
        model: config.model || 'nvidia/nemotron-3-ultra',
        temperature: config.temperature || 0.7,
        maxTokens: config.maxTokens || 1024,
        welcomeMessage: config.welcomeMessage || this.getDefaultWelcome(),
        quickReplies: config.quickReplies || this.getDefaultQuickReplies(),
        ...config
      };

      this.isOpen = false;
      this.sessionId = this.getOrCreateSessionId();
      this.isTyping = false;
      this.messageId = 0;
      this.leadFormShown = false;
      this.forwarded = false;

      this.init();
    }

    init() {
      // Inject styles
      if (!document.getElementById('aiAssistantStyles')) {
        document.head.insertAdjacentHTML('beforeend', WIDGET_STYLES);
      }

      // Create widget container
      const container = document.createElement('div');
      container.innerHTML = WIDGET_HTML;
      this.widget = container.firstElementChild;
      document.body.appendChild(this.widget);

      // Cache DOM elements
      this.toggleBtn = this.widget.querySelector('#aiAssistantToggle');
      this.window = this.widget.querySelector('#aiAssistantWindow');
      this.messagesContainer = this.widget.querySelector('#aiWindowMessages');
      this.typingIndicator = this.widget.querySelector('#aiTypingIndicator');
      this.inputForm = this.widget.querySelector('#aiInputForm');
      this.inputField = this.widget.querySelector('#aiInputField');
      this.sendBtn = this.widget.querySelector('#aiInputSend');
      this.closeBtn = this.widget.querySelector('#aiWindowClose');
      this.quickActionsContainer = this.widget.querySelector('#aiQuickActions');

      this.bindEvents();
      this.renderWelcome();
    }

    bindEvents() {
      // Toggle
      this.toggleBtn.addEventListener('click', () => this.toggle());

      // Close
      this.closeBtn.addEventListener('click', () => this.close());

      // Form submit
      this.inputForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.sendMessage();
      });

      // Input handling
      this.inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

      // Click outside to close (mobile)
      document.addEventListener('click', (e) => {
        if (this.isOpen && !this.widget.contains(e.target) && !this.toggleBtn.contains(e.target)) {
          this.close();
        }
      });

      // ESC to close
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
          this.toggleBtn.focus();
        }
      });

      // Quick action buttons
      this.quickActionsContainer?.addEventListener('click', (e) => {
        const btn = e.target.closest('.ai-quick-btn');
        if (btn) this.handleQuickAction(btn.dataset.action);
      });

      // Action buttons in messages (delegated)
      this.messagesContainer?.addEventListener('click', (e) => {
        const btn = e.target.closest('.ai-message-action-btn');
        if (btn) this.handleMessageAction(btn.dataset.action, btn.dataset.value);
      });

      // Lead form submit (delegated)
      this.messagesContainer?.addEventListener('submit', (e) => {
        if (e.target.classList.contains('ai-lead-form')) {
          e.preventDefault();
          this.submitLeadForm(e.target);
        }
      });
    }

    toggle() {
      if (this.isOpen) this.close(); else this.open();
    }

    open() {
      this.isOpen = true;
      this.window.hidden = false;
      // Force reflow for animation
      this.window.offsetHeight;
      this.window.classList.add('open');
      this.toggleBtn.setAttribute('aria-expanded', 'true');
      this.inputField.focus();
      this.scrollToBottom();
      this.showQuickActions();
    }

    close() {
      this.isOpen = false;
      this.window.classList.remove('open');
      this.toggleBtn.setAttribute('aria-expanded', 'false');
      setTimeout(() => { if (!this.isOpen) this.window.hidden = true; }, 300);
    }

    getOrCreateSessionId() {
      let sessionId = localStorage.getItem('solmaz_ai_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('solmaz_ai_session_id', sessionId);
      }
      return sessionId;
    }

    getDefaultWelcome() {
      return `Merhaba! Ben Solmaz Fashion (By. Boomer) kurumsal asistanınızım. 🏭

Üreticiyiz, aracı değiliz. Size nasıl yardımcı olabilirim?

**Hızlı başlangıç için:**
• 📋 **Katalog & Fiyat** - Güncel toptan fiyat listesi
• 📦 **Stok Durumu** - Hangi ürünlerde stok var?
• 🛒 **Sipariş Süreci** - Minimum sipariş, ödeme, kargo
• 🧪 **Numune Talep** - Ürün kalitesini test edin
• 🏷️ **Private Label** - Kendi markanızla üretim

Hangi konuda destek olabilirim?`;
    }

    getDefaultQuickReplies() {
      return [
        { label: '📋 Katalog & Fiyat', query: 'Güncel katalog ve toptan fiyat listesi gönderin' },
        { label: '📦 Stok Durumu', query: 'Hangi ürünlerde stok var, hangilerde yok?' },
        { label: '🛒 Sipariş Vermek', query: 'Sipariş süreci nasıl işliyor, minimum ne kadar?' },
        { label: '🧪 Numune İste', query: 'Numune gönderimi yapıyor musunuz, şartlar nelerdir?' },
        { label: '🚚 Kargo Bilgisi', query: 'Kargo ücreti, teslimat süresi, uluslararası gönderim' },
        { label: '🏷️ Private Label', query: 'Kendi markamla üretim yapabilir miyim?' }
      ];
    }

    showQuickActions() {
      if (!this.quickActionsContainer) return;
      this.quickActionsContainer.innerHTML = this.config.quickReplies.map(qr =>
        `<button type="button" class="ai-quick-btn" data-action="quick" data-query="${this.escapeHtml(qr.query)}">${this.escapeHtml(qr.label)}</button>`
      ).join('');

      this.quickActionsContainer.querySelectorAll('.ai-quick-btn[data-action="quick"]').forEach(btn => {
        btn.addEventListener('click', () => {
          this.inputField.value = btn.dataset.query;
          this.sendMessage();
        });
      });
      this.quickActionsContainer.hidden = false;
    }

    hideQuickActions() {
      if (this.quickActionsContainer) this.quickActionsContainer.hidden = true;
    }

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    formatTime() {
      return new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }

    addMessage(role, content, options = {}) {
      const id = ++this.messageId;
      const time = this.formatTime();
      const isUser = role === 'user';
      const actions = options.actions || [];
      const showLeadForm = options.showLeadForm || false;
      const showForwardNotice = options.showForwardNotice || false;
      const forwarded = options.forwarded || false;
      const leadData = options.leadData || null;
      const whatsappLink = options.whatsappLink || null;

      const avatarSvg = isUser
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><path d="M8 21h8M12 17h.01"/></svg>';

      // Build actions HTML
      let actionsHtml = '';
      if (actions.length > 0) {
        actionsHtml = `
          <div class="ai-message-actions">
            ${actions.map(a => `
              <button type="button" class="ai-message-action-btn ${a.secondary ? 'secondary' : ''}" 
                      data-action="${this.escapeHtml(a.action)}" 
                      data-value="${this.escapeHtml(a.value || '')}">
                ${this.escapeHtml(a.label)}
              </button>
            `).join('')}
          </div>
        `;
      }

      // Lead form HTML
      let leadFormHtml = '';
      if (showLeadForm && !this.leadFormShown) {
        leadFormHtml = `
          <form class="ai-lead-form" data-lead-form>
            <h4>📋 Bilgilerinizi Paylaşın</h4>
            <p style="font-size:12px;color:var(--ai-text-secondary);margin:0 0 12px;">
              Size özel fiyat ve stok bilgisi göndermek için iletişim bilgilerinizi paylaşın.
            </p>
            <div class="form-row">
              <div class="form-group">
                <label>Ad Soyad *</label>
                <input type="text" name="name" placeholder="Ahmet Yılmaz" required autocomplete="name">
              </div>
              <div class="form-group">
                <label>Telefon *</label>
                <input type="tel" name="phone" placeholder="+90 5XX XXX XX XX" required autocomplete="tel">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>E-posta</label>
                <input type="email" name="email" placeholder="ahmet@firma.com" autocomplete="email">
              </div>
              <div class="form-group">
                <label>Şirket / Mağaza</label>
                <input type="text" name="company" placeholder="Yılmaz Giyim / Trendyol Satıcı" autocomplete="organization">
              </div>
            </div>
            <button type="submit">📤 Bilgileri Gönder ve Özel Fiyat Al</button>
          </form>
        `;
      }

      // Forward notice
      let forwardNoticeHtml = '';
      if (showForwardNotice || forwarded) {
        const whatsappLink = `https://wa.me/905523973838?text=${encodeURIComponent('Yeni müşteri leadı - Solmaz Fashion AI Asistanı')}`;
        forwardNoticeHtml = `
          <div class="ai-forward-notice">
            ✅ <strong>Bilgileriniz alındı!</strong> Ekibimiz en kısa sürede size özel fiyat ve stok listesiyle WhatsApp üzerinden dönüş yapacak.
            <br><br>
            <a href="https://wa.me/905523973838" target="_blank" rel="noopener" style="color:var(--ai-gold);font-weight:600;">📱 WhatsApp'ta Takip Et</a> | 
            <a href="https://t.me/Boomerbrandd" target="_blank" rel="noopener" style="color:var(--ai-gold);font-weight:600;">📋 Telegram Kataloğu</a>
          </div>
        `;
      }

      const avatarSvg = role === 'user'
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><path d="M8 21h8M12 17h.01"/></svg>';

      let actionsHtml = '';
      if (actions.length > 0) {
        actionsHtml = `
          <div class="ai-message-actions">
            ${actions.map(a => `
              <button type="button" class="ai-message-action-btn ${a.secondary ? 'secondary' : ''}" 
                      data-action="${this.escapeHtml(a.action)}" 
                      data-value="${this.escapeHtml(a.value || '')}">
                ${this.escapeHtml(a.label)}
              </button>
            `).join('')}
          </div>
        `;
      }

      const avatarSvgFinal = role === 'user'
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><path d="M8 21h8M12 17h.01"/></svg>';

      const messageHtml = `
        <div class="ai-message ${role}" data-id="${id}" role="${isUser ? 'none' : 'article'}" aria-label="${isUser ? 'Sizin mesajınız' : 'Asistan yanıtı'}">
          <div class="ai-message-avatar" aria-hidden="true">${avatarSvgFinal}</div>
          <div class="ai-message-content">
            ${this.formatMessage(content)}
            ${actionsHtml}
            ${leadFormHtml}
            ${forwardNoticeHtml}
            <span class="ai-message-time">${this.formatTime()}</span>
          </div>
        </div>
      `;

      this.messagesContainer.insertAdjacentHTML('beforeend', messageHtml);
      this.messageId = id;

      // Bind lead form if present
      const form = this.messagesContainer.querySelector('[data-lead-form]');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          this.submitLeadForm(form);
        });
      }

      // Bind action buttons
      this.messagesContainer.querySelectorAll('.ai-message-action-btn').forEach(btn => {
        btn.addEventListener('click', () => this.handleMessageAction(btn.dataset.action, btn.dataset.value));
      });

      if (!options.isWelcome) this.scrollToBottom();
      return id;
    }

    formatMessage(text) {
      // Convert markdown-like formatting
      return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code style="background:rgba(0,0,0,0.08);padding:2px 6px;border-radius:4px;font-family:monospace;font-size:0.9em;">$1</code>')
        .replace(/\n/g, '<br>')
        .replace(/^•\s(.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul style="margin:8px 0;padding-left:20px;">$1</ul>')
        .replace(/📋|📦|🛒|🧪|🚚|🏷️|❓|✅|🤝|💡|💰/g, '<span style="font-size:1.1em;">$&</span>');
    }

    scrollToBottom() {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    showTyping() {
      this.isTyping = true;
      this.typingIndicator.hidden = false;
      this.sendBtn.disabled = true;
      this.scrollToBottom();
    }

    hideTyping() {
      this.isTyping = false;
      this.typingIndicator.hidden = true;
      this.sendBtn.disabled = false;
    }

    async sendMessage() {
      const text = this.inputField.value.trim();
      if (!text || this.isTyping) return;

      this.addMessage('user', text);
      this.inputField.value = '';
      this.hideQuickActions();
      this.showTyping();

      try {
        const response = await this.callAPI(text);
        this.hideTyping();
        this.handleAIResponse(response);
      } catch (error) {
        this.hideTyping();
        this.addMessage('bot', this.getErrorMessage(error), {
          actions: [
            { action: 'whatsapp', label: '📱 WhatsApp\'a Bağlan', value: '' },
            { action: 'telegram', label: '📋 Telegram Katalogu', value: '' }
          ]
        });
      }
    }

    async callAPI(userMessage) {
      const payload = {
        model: this.config.model,
        messages: [{ role: 'user', content: userMessage }],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream: false
      };

      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Session-ID': this.sessionId
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        content: data.choices?.[0]?.message?.content || 'Üzgünüm, yanıt alınamadı.',
        leadData: data.leadData,
        forwarded: data.forwarded,
        whatsappLink: data.whatsappLink,
        sessionId: data.sessionId
      };
    }

    handleAIResponse(response) {
      const { content, leadData, forwarded, whatsappLink, sessionId } = response;

      // Update session ID if new
      if (sessionId && sessionId !== this.sessionId) {
        this.sessionId = sessionId;
        localStorage.setItem('solmaz_ai_session_id', sessionId);
      }

      // Determine actions based on content
      const actions = this.determineActions(content);

      // Check if we should show lead form
      const shouldShowLeadForm = !this.leadFormShown && this.shouldShowLeadForm(content);

      // Check if forwarded
      const showForwardNotice = forwarded || false;

      this.addMessage('bot', content, {
        actions,
        showLeadForm,
        showForwardNotice,
        forwarded,
        leadData: response.leadData,
        whatsappLink: response.whatsappLink
      });
    }

    determineActions(content) {
      const actions = [];
      const lowerContent = content.toLowerCase();

      // Always show WhatsApp and Telegram for commercial intent
      if (lowerContent.includes('sipariş') || lowerContent.includes('fiyat') || 
          lowerContent.includes('stok') || lowerContent.includes('katalog') ||
          lowerContent.includes('numune') || lowerContent.includes('tedarik')) {
        actions.push({ action: 'whatsapp', label: '📱 WhatsApp\'a Bağlan', value: '' });
        actions.push({ action: 'telegram', label: '📋 Telegram Kataloğu', value: '' });
      }

      // Catalog request
      if (lowerContent.includes('katalog') || lowerContent.includes('liste')) {
        actions.push({ action: 'catalog', label: '📋 Katalog Gönder', value: '' });
      }

      // Sample request
      if (lowerContent.includes('numune') || lowerContent.includes('örnek')) {
        actions.push({ action: 'sample', label: '🧪 Numune Talep Et', value: '' });
      }

      return actions;
    }

    shouldShowLeadForm(content) {
      const lowerContent = content.toLowerCase();
      // Show lead form when user shows commercial intent but hasn't provided contact info
      return (lowerContent.includes('fiyat') || lowerContent.includes('sipariş') || 
              lowerContent.includes('stok') || lowerContent.includes('katalog') ||
              lowerContent.includes('numune') || lowerContent.includes('tedarik')) &&
             !this.leadFormShown;
    }

    handleQuickAction(action) {
      const queries = {
        whatsapp: 'WhatsApp\'a bağlanmak istiyorum',
        telegram: 'Telegram kanalını gösterin',
        catalog: 'Katalog ve fiyat listesi gönderin',
        sample: 'Numune talep ediyorum'
      };
      this.inputField.value = queries[action] || '';
      this.sendMessage();
    }

    handleMessageAction(action, value) {
      const urls = {
        whatsapp: 'https://wa.me/905469392028',
        telegram: 'https://t.me/Boomerbrandd',
        catalog: 'https://wa.me/905469392028?text=Merhaba%2C%20katalog%20ve%20fiyat%20listesi%20g%C3%B6nderin',
        sample: 'https://wa.me/905469392028?text=Merhaba%2C%20numune%20talep%20ediyorum'
      };
      if (urls[action]) window.open(urls[action], '_blank', 'noopener,noreferrer');
    }

    submitLeadForm(form) {
      const formData = new FormData(form);
      const leadData = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        company: formData.get('company')
      };

      // Validate
      if (!leadData.name || !leadData.phone) {
        alert('Lütfen isim ve telefon alanlarını doldurun.');
        return;
      }

      // Disable form
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Gönderiliyor...';

      // Send to server for forwarding
      fetch('/api/forward-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: this.sessionId, leadData })
      }).then(r => r.json()).then(data => {
        this.leadFormShown = true;
        this.addMessage('bot', '✅ Bilgileriniz başarıyla alındı! Ekibimiz en kısa sürede WhatsApp üzerinden size özel fiyat ve stok listesiyle dönüş yapacak.', {
          showForwardNotice: true
        });
      }).catch(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = '📤 Bilgileri Gönder ve Özel Fiyat Al';
        alert('Gönderimde hata oluştu. Lütfen doğrudan WhatsApp\'tan yazın: +90 546 939 20 28');
      });
    }

    getErrorMessage(error) {
      console.error('AI Assistant Error:', error);
      return `Üzgünüm, şu anda sistemimizde geçici bir sorun yaşıyoruz. 🤝

Lütfen doğrudan iletişim kanallarımızdan bize ulaşın:

📱 **WhatsApp (Müşteri Hattı):** +90 546 939 20 28
📱 **WhatsApp (Yönlendirme):** +90 552 397 38 38
📋 **Telegram Kataloğu:** t.me/Boomerbrandd
📧 **E-posta:** brandboomer79@gmail.com
📧 **Yönlendirme E-posta:** solmaztayyip1@gmail.com

En kısa sürede size dönüş yapacağız.`;
    }

    // Public API
    destroy() {
      this.widget.remove();
      const styles = document.getElementById('aiAssistantStyles');
      if (styles) styles.remove();
    }
  }

  // ============================================================
  // GLOBAL BAŞLATMA
  // ============================================================
  window.SolmazAIAssistant = AIAssistant;

  // Auto-init if data-auto-init present
  document.addEventListener('DOMContentLoaded', () => {
    const autoInit = document.querySelector('[data-ai-assistant-auto]');
    if (autoInit) {
      const endpoint = autoInit.dataset.apiEndpoint || '/api/ai-chat';
      window.solmazAI = new AIAssistant({ apiEndpoint: endpoint });
    }
  });

})();
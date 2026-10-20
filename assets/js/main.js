/**
 * SOLMAZ FASHION — Main JavaScript
 * Vanilla JS, no dependencies, progressive enhancement
 */

(function() {
  'use strict';

  // --- Utility Functions ---
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];

  const debounce = (fn, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(null, args), delay);
    };
  };

  const throttle = (fn, limit) => {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        fn.apply(null, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  };

  // --- Mobile Navigation ---
  function initMobileNav() {
    const toggle = $('.header__mobile-toggle');
    const nav = $('.header__nav');
    const navLinks = $$('.header__nav-link');
    const body = document.body;

    if (!toggle || !nav) return;

    const openNav = () => {
      nav.classList.add('header__nav--open');
      toggle.setAttribute('aria-expanded', 'true');
      body.style.overflow = 'hidden';
    };

    const closeNav = () => {
      nav.classList.remove('header__nav--open');
      toggle.setAttribute('aria-expanded', 'false');
      body.style.overflow = '';
    };

    const toggleNav = () => {
      if (nav.classList.contains('header__nav--open')) {
        closeNav();
      } else {
        openNav();
      }
    };

    toggle.addEventListener('click', toggleNav);

    navLinks.forEach(link => {
      link.addEventListener('click', closeNav);
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('header__nav--open')) {
        closeNav();
        toggle.focus();
      }
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (nav.classList.contains('header__nav--open') &&
          !nav.contains(e.target) &&
          !toggle.contains(e.target)) {
        closeNav();
      }
    });
  }

  // --- Header Scroll Effect ---
  function initHeaderScroll() {
    const header = $('.header');
    if (!header) return;

    const handleScroll = throttle(() => {
      if (window.scrollY > 50) {
        header.classList.add('header--scrolled');
      } else {
        header.classList.remove('header--scrolled');
      }
    }, 50);

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  // --- Smooth Scroll for Anchor Links ---
  function initSmoothScroll() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      const href = link.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      const headerOffset = 72;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      // Update URL without scroll
      history.pushState(null, null, href);

      // Focus target for accessibility
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  }

  // --- Active Nav Link on Scroll ---
  function initActiveNav() {
    const sections = $$('section[id]');
    const navLinks = $$('.header__nav-link[href^="#"]');

    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            link.classList.toggle('header__nav-link--active',
              link.getAttribute('href') === `#${id}`);
          });
        }
      });
    }, {
      rootMargin: '-100px 0px -60% 0px',
      threshold: 0.1
    });

    sections.forEach(section => observer.observe(section));
  }

  // --- WhatsApp Click Tracking ---
  function initWhatsAppTracking() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href*="wa.me"], a[href*="whatsapp"]');
      if (link) {
        // Analytics event would go here
        console.log('WhatsApp contact initiated');
      }
    });
  }

  // --- Lazy Loading Images ---
  function initLazyLoading() {
    if (!('IntersectionObserver' in window)) {
      // Fallback: load all images
      $$('img[data-src]').forEach(img => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      });
      return;
    }

    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
            img.removeAttribute('data-srcset');
          }
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });

    $$('img[data-src]').forEach(img => imageObserver.observe(img));
  }

  // --- Form Handling ---
  function initForms() {
    const forms = $$('form[data-ajax]');

    forms.forEach(form => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
        const originalText = submitBtn?.textContent;

        // Show loading state
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Gönderiliyor...';
        }

        // Clear previous messages
        $$('.form-error, .form-success', form).forEach(el => el.remove());
        $$('.form-input', form).forEach(input => input.classList.remove('error'));

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
          // For static sites, we'll use mailto fallback or Formspree/Netlify Forms
          const action = form.action || 'mailto:brandboomer79@gmail.com';
          const method = form.method || 'POST';

          if (action.startsWith('mailto:')) {
            // Build mailto link
            const subject = encodeURIComponent(data.subject || 'İletişim Formu - Solmaz Fashion');
            const body = encodeURIComponent(
              `Ad Soyad: ${data.name || ''}\n` +
              `E-posta: ${data.email || ''}\n` +
              `Telefon: ${data.phone || ''}\n` +
              `Konu: ${data.subject || ''}\n` +
              `Mesaj:\n${data.message || ''}`
            );
            window.location.href = `${action}?subject=${subject}&body=${body}`;

            showFormSuccess(form, 'E-posta uygulamanız açıldı. Mesajınızı göndermek için "Gönder" butonuna basın.');
          } else {
            // For Formspree, Netlify, etc.
            const response = await fetch(action, {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });

            if (response.ok) {
              showFormSuccess(form, 'Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.');
              form.reset();
            } else {
              throw new Error('Gönderim başarısız oldu');
            }
          }
        } catch (error) {
          showFormError(form, 'Bir hata oluştu. Lütfen WhatsApp veya e-posta ile doğrudan iletişime geçin.');
          console.error('Form error:', error);
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
          }
        }
      });
    });

    function showFormSuccess(form, message) {
      const success = document.createElement('div');
      success.className = 'form-success';
      success.textContent = message;
      form.appendChild(success);
      success.focus();
    }

    function showFormError(form, message) {
      const error = document.createElement('div');
      error.className = 'form-error';
      error.textContent = message;
      form.appendChild(error);
      error.focus();
    }

    // Real-time validation
    $$('.form-input[required]').forEach(input => {
      input.addEventListener('blur', () => validateField(input));
      input.addEventListener('input', () => {
        if (input.classList.contains('error')) validateField(input);
      });
    });

    function validateField(input) {
      const errorEl = input.parentNode.querySelector('.form-error');
      if (errorEl && errorEl.textContent.includes(input.name)) {
        errorEl.remove();
      }

      let isValid = true;
      let message = '';

      if (input.required && !input.value.trim()) {
        isValid = false;
        message = `${getFieldLabel(input)} alanı zorunludur.`;
      } else if (input.type === 'email' && input.value && !isValidEmail(input.value)) {
        isValid = false;
        message = 'Geçerli bir e-posta adresi giriniz.';
      } else if (input.type === 'tel' && input.value && !isValidPhone(input.value)) {
        isValid = false;
        message = 'Geçerli bir telefon numarası giriniz.';
      }

      if (!isValid) {
        input.classList.add('error');
        const error = document.createElement('div');
        error.className = 'form-error';
        error.textContent = message;
        input.parentNode.appendChild(error);
      } else {
        input.classList.remove('error');
      }

      return isValid;
    }

    function getFieldLabel(input) {
      const label = input.closest('.form-group').querySelector('.form-label');
      return label ? label.textContent.replace('*', '').trim() : input.name;
    }

    function isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function isValidPhone(phone) {
      return /^[\d\s\-\+\(\)]{10,}$/.test(phone);
    }
  }

  // --- Media Filter (Media Page) ---
  function initMediaFilter() {
    const filters = $$('.media-page__filter');
    const cards = $$('.media-card[data-platform]');

    if (!filters.length || !cards.length) return;

    filters.forEach(filter => {
      filter.addEventListener('click', () => {
        const platform = filter.dataset.filter;

        filters.forEach(f => f.classList.toggle('media-page__filter--active', f === filter));

        cards.forEach(card => {
          const cardPlatform = card.dataset.platform;
          const show = platform === 'all' || cardPlatform === platform;
          card.style.display = show ? 'block' : 'none';
          card.style.animation = show ? 'fadeIn 0.3s ease' : 'none';
        });
      });
    });
  }

  // --- Blog Search (if implemented) ---
  function initBlogSearch() {
    const searchInput = $('#blog-search');
    const posts = $$('.blog-card[data-tags]');

    if (!searchInput || !posts.length) return;

    const handleSearch = debounce(() => {
      const query = searchInput.value.toLowerCase().trim();

      posts.forEach(post => {
        const tags = (post.dataset.tags || '').toLowerCase();
        const title = post.querySelector('.blog-card__title')?.textContent.toLowerCase() || '';
        const excerpt = post.querySelector('.blog-card__excerpt')?.textContent.toLowerCase() || '';
        const category = post.querySelector('.blog-card__category')?.textContent.toLowerCase() || '';

        const matches = !query ||
          tags.includes(query) ||
          title.includes(query) ||
          excerpt.includes(query) ||
          category.includes(query);

        post.style.display = matches ? 'flex' : 'none';
      });
    }, 200);

    searchInput.addEventListener('input', handleSearch);
  }

  // --- Back to Top Button ---
  function initBackToTop() {
    const btn = document.createElement('button');
    btn.className = 'btn btn--primary btn--back-to-top';
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 15l-6-6-6 6"/>
      </svg>
      <span class="sr-only">Başa dön</span>
    `;
    btn.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 200;
      opacity: 0;
      visibility: hidden;
      transform: translateY(20px);
      transition: all 0.3s ease;
      box-shadow: var(--shadow-lg);
    `;
    document.body.appendChild(btn);

    const toggleVisibility = throttle(() => {
      if (window.scrollY > 300) {
        btn.style.opacity = '1';
        btn.style.visibility = 'visible';
        btn.style.transform = 'translateY(0)';
      } else {
        btn.style.opacity = '0';
        btn.style.visibility = 'hidden';
        btn.style.transform = 'translateY(20px)';
      }
    }, 100);

    window.addEventListener('scroll', toggleVisibility, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- Copy to Clipboard (for contact info) ---
  function initCopyToClipboard() {
    $$('[data-copy]').forEach(el => {
      el.style.cursor = 'pointer';
      el.title = 'Kopyalamak için tıklayın';

      el.addEventListener('click', async () => {
        const text = el.dataset.copy;
        try {
          await navigator.clipboard.writeText(text);
          showToast('Kopyalandı: ' + text);
        } catch (err) {
          // Fallback
          const textarea = document.createElement('textarea');
          textarea.value = text;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          showToast('Kopyalandı: ' + text);
        }
      });
    });
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 90px;
      right: 24px;
      padding: 12px 20px;
      background: var(--color-brand-primary);
      color: white;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      z-index: 400;
      animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  // Add toast animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(100px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes slideOut {
      from { opacity: 1; transform: translateX(0); }
      to { opacity: 0; transform: translateX(100px); }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .form-input.error { border-color: var(--color-error); }
  `;
  document.head.appendChild(style);

  // --- Initialize All ---
  function init() {
    // Wait for DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    initMobileNav();
    initHeaderScroll();
    initSmoothScroll();
    initActiveNav();
    initWhatsAppTracking();
    initLazyLoading();
    initForms();
    initMediaFilter();
    initBlogSearch();
    initBackToTop();
    initCopyToClipboard();

    // Announce ready for any external scripts
    document.dispatchEvent(new CustomEvent('solmazfashion:ready'));
  }

  init();
})();
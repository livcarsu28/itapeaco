/* ================= CONFIGURAÇÕES GERAIS ================= */
document.addEventListener('DOMContentLoaded', function () {
  console.log('Site carregado com sucesso 🚀 - ITAPÊ AÇO');

  /* ================= MENU MOBILE ================= */
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileDropdown = document.getElementById('mobileDropdown');

  if (menuToggle && mobileDropdown) {
    menuToggle.addEventListener('click', () => {
      const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', !isExpanded);
      mobileDropdown.classList.toggle('active');
      menuToggle.classList.toggle('open');
      
      // Atualiza o texto do botão para acessibilidade
      const label = isExpanded ? 'Abrir menu' : 'Fechar menu';
      menuToggle.setAttribute('aria-label', label);
    });

    // Fechar menu ao clicar fora
    document.addEventListener('click', (event) => {
      if (!menuToggle.contains(event.target) && !mobileDropdown.contains(event.target)) {
        menuToggle.setAttribute('aria-expanded', 'false');
        mobileDropdown.classList.remove('active');
        menuToggle.classList.remove('open');
        menuToggle.setAttribute('aria-label', 'Abrir menu');
      }
    });

    // Fechar menu ao clicar em um link
    mobileDropdown.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.setAttribute('aria-expanded', 'false');
        mobileDropdown.classList.remove('active');
        menuToggle.classList.remove('open');
        menuToggle.setAttribute('aria-label', 'Abrir menu');
      });
    });
  }

  /* ================= CONTROLE DO VÍDEO ================= */
  document.querySelectorAll('.video-container').forEach(container => {
    const video = container.querySelector('.story-video');
    const muteBtn = container.querySelector('.video-mute');

    if (!video || !muteBtn) return;

    // Estado inicial (autoplay silencioso)
    video.muted = true;
    video.autoplay = true;
    video.loop = true;
    video.playsInline = true;

    // Detecção de dispositivo iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    // Configuração inicial do botão
    muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
    muteBtn.classList.remove('active');

    muteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Para iOS, precisamos de uma abordagem diferente
      if (isIOS) {
        // iOS requer interação do usuário para tocar no áudio
        if (video.muted) {
          video.muted = false;
          video.play().then(() => {
            muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            muteBtn.classList.add('active');
          }).catch(err => {
            console.log('iOS bloqueou áudio:', err);
            // Fallback: manter mutado
            video.muted = true;
            muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
            muteBtn.classList.remove('active');
          });
        } else {
          video.muted = true;
          muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
          muteBtn.classList.remove('active');
        }
      } else {
        // Para outros dispositivos, comportamento normal
        video.muted = !video.muted;
        if (video.muted) {
          muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
          muteBtn.classList.remove('active');
        } else {
          muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
          muteBtn.classList.add('active');
        }
      }
    });

    // Pause vídeo quando não estiver visível (para performance)
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          video.play().catch(e => console.log('Autoplay bloqueado:', e));
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.5 });

    observer.observe(video);
  });

  /* ================= CARROSSEL SWIPE OTIMIZADO PARA MOBILE ================= */
  function initCarouselSwipe(carouselId, itemSelector) {
    const carousel = document.getElementById(carouselId) || document.querySelector(`.${carouselId}`);
    if (!carousel) return;

    // Só aplicar no mobile
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) {
      // No desktop, manter comportamento padrão
      carousel.style.overflowX = 'auto';
      carousel.style.scrollSnapType = 'x mandatory';
      carousel.style.scrollBehavior = 'smooth';
      return;
    }

    let isDown = false;
    let startX;
    let scrollLeft;
    let velocity = 0;
    let animationId;
    let lastTime = 0;
    let lastScrollLeft = 0;

    // Configuração inicial para scroll suave
    carousel.style.scrollBehavior = 'smooth';
    carousel.style.overflowX = 'auto';
    carousel.style.scrollSnapType = 'x mandatory';
    carousel.style.webkitOverflowScrolling = 'touch';

    // Otimização de performance
    carousel.style.transform = 'translateZ(0)';
    carousel.style.willChange = 'scroll-position';

    // Mouse events
    carousel.addEventListener('mousedown', (e) => {
      isDown = true;
      carousel.style.scrollBehavior = 'auto';
      carousel.classList.add('grabbing');
      startX = e.pageX - carousel.offsetLeft;
      scrollLeft = carousel.scrollLeft;
      cancelAnimationFrame(animationId);
      velocity = 0;
      lastScrollLeft = scrollLeft;
      lastTime = Date.now();
    });

    carousel.addEventListener('mouseleave', () => {
      if (!isDown) return;
      isDown = false;
      carousel.classList.remove('grabbing');
      carousel.style.scrollBehavior = 'smooth';
      applyMomentum();
    });

    carousel.addEventListener('mouseup', () => {
      if (!isDown) return;
      isDown = false;
      carousel.classList.remove('grabbing');
      carousel.style.scrollBehavior = 'smooth';
      applyMomentum();
    });

    carousel.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      
      const x = e.pageX - carousel.offsetLeft;
      const walk = (x - startX) * 1.8; // Fator aumentado para mais fluidez
      carousel.scrollLeft = scrollLeft - walk;
      
      // Calcular velocidade para momentum
      const currentTime = Date.now();
      const deltaTime = currentTime - lastTime;
      
      if (deltaTime > 0) {
        const deltaScroll = carousel.scrollLeft - lastScrollLeft;
        velocity = deltaScroll / deltaTime;
        lastScrollLeft = carousel.scrollLeft;
        lastTime = currentTime;
      }
    });

    // Touch events - OTIMIZADO
    let touchStartX = 0;
    let touchScrollLeft = 0;
    let touchId = null;

    carousel.addEventListener('touchstart', (e) => {
      if (touchId !== null) return;
      
      touchId = e.changedTouches[0].identifier;
      isDown = true;
      carousel.style.scrollBehavior = 'auto';
      carousel.classList.add('grabbing');
      touchStartX = e.changedTouches[0].pageX;
      touchScrollLeft = carousel.scrollLeft;
      cancelAnimationFrame(animationId);
      velocity = 0;
      lastScrollLeft = touchScrollLeft;
      lastTime = Date.now();
      
      // Apenas prevenir default se não for um link/button
      if (!e.target.closest('a') && !e.target.closest('button')) {
        e.preventDefault();
      }
    }, { passive: false });

    carousel.addEventListener('touchend', (e) => {
      if (!isDown || e.changedTouches[0].identifier !== touchId) return;
      
      isDown = false;
      touchId = null;
      carousel.classList.remove('grabbing');
      carousel.style.scrollBehavior = 'smooth';
      applyMomentum();
      
      if (!e.target.closest('a') && !e.target.closest('button')) {
        e.preventDefault();
      }
    }, { passive: false });

    carousel.addEventListener('touchmove', (e) => {
      if (!isDown || e.changedTouches[0].identifier !== touchId) return;
      
      const touch = e.changedTouches[0];
      const walk = (touch.pageX - touchStartX) * 1.5;
      
      // Scroll direto e suave
      carousel.scrollLeft = touchScrollLeft - walk;
      
      // Calcular velocidade suavizada
      const currentTime = Date.now();
      const deltaTime = currentTime - lastTime;
      
      if (deltaTime > 0) {
        const deltaScroll = carousel.scrollLeft - lastScrollLeft;
        // Suaviza a velocidade
        velocity = (velocity * 0.7) + ((deltaScroll / deltaTime) * 0.3);
        lastScrollLeft = carousel.scrollLeft;
        lastTime = currentTime;
      }
      
      if (!e.target.closest('a') && !e.target.closest('button')) {
        e.preventDefault();
      }
    }, { passive: false });

    // Momentum scrolling com easing otimizado
    function applyMomentum() {
      if (Math.abs(velocity) > 0.05) { // Limite mais baixo para mais suavidade
        // Aplica easing na velocidade
        carousel.scrollLeft += velocity * 20; // Aumentado para mais fluidez
        velocity *= 0.88; // Reduzida a fricção para continuar mais tempo
        
        // Limita a velocidade máxima
        if (velocity > 4) velocity = 4;
        if (velocity < -4) velocity = -4;
        
        animationId = requestAnimationFrame(applyMomentum);
      } else {
        velocity = 0;
        snapToNearestItem();
      }
    }

    // Snap para o item mais próximo quando parar
    function snapToNearestItem() {
      const items = carousel.querySelectorAll(itemSelector);
      if (items.length === 0) return;
      
      const scrollLeft = carousel.scrollLeft;
      const containerWidth = carousel.offsetWidth;
      
      let closestItem = null;
      let closestDistance = Infinity;
      
      items.forEach(item => {
        const itemLeft = item.offsetLeft;
        const itemWidth = item.offsetWidth;
        const itemCenter = itemLeft + (itemWidth / 2);
        const containerCenter = scrollLeft + (containerWidth / 2);
        const distance = Math.abs(itemCenter - containerCenter);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestItem = item;
        }
      });
      
      if (closestItem) {
        const targetScroll = closestItem.offsetLeft - ((containerWidth - closestItem.offsetWidth) / 2);
        
        carousel.scrollTo({
          left: targetScroll,
          behavior: 'smooth'
        });
      }
    }

    // Snap inicial
    setTimeout(() => {
      snapToNearestItem();
    }, 100);

    // Adicionar classe para estilização
    carousel.classList.add('swipe-enabled');
  }

  // Inicializar todos os carrosséis principais
  const carousels = [
    { id: 'productsCarousel', selector: '.product-card' },
    { id: 'galleryCarousel', selector: '.gallery-item' },
    { id: 'videos-scroll', selector: '.video-story' },
    { id: 'testimonials-scroll', selector: '.testimonial-card' }
  ];

  carousels.forEach(carousel => {
    initCarouselSwipe(carousel.id, carousel.selector);
  });

  // Inicializar vantagens mobile (carrossel separado)
  initAdvantagesCarousel();

  /* ================= ANIMAÇÕES AO SCROLL ================= */
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in');
        
        // Animar elementos filhos com delay
        const children = entry.target.querySelectorAll(
          '.product-card, .gallery-item, .video-story, .advantage-card, .application-card, .testimonial-card'
        );
        
        children.forEach((child, index) => {
          setTimeout(() => {
            child.classList.add('fade-in');
          }, index * 100);
        });
        
        // Para performance, para de observar após animar
        observer.unobserve(entry.target);
      }
    });
  }, { 
    threshold: 0.1,
    rootMargin: '50px 0px 50px 0px'
  });

  // Observar todas as seções
  document.querySelectorAll('section').forEach(section => {
    observer.observe(section);
  });

  /* ================= HEADER SCROLL EFFECT ================= */
  const header = document.querySelector('.header');
  
  function updateHeaderOnScroll() {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }
  
  // Debounce para performance
  const debouncedScroll = debounce(updateHeaderOnScroll, 10);
  window.addEventListener('scroll', debouncedScroll);
  updateHeaderOnScroll();

  /* ================= BOTÃO VOLTAR AO TOPO ================= */
  const backToTop = document.createElement('button');
  backToTop.className = 'back-to-top';
  backToTop.setAttribute('aria-label', 'Voltar ao topo');
  backToTop.innerHTML = '<i class="fas fa-chevron-up"></i>';
  document.body.appendChild(backToTop);

  function updateBackToTop() {
    if (window.pageYOffset > 500) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }
  }

  window.addEventListener('scroll', updateBackToTop);
  updateBackToTop();

  backToTop.addEventListener('click', () => {
    window.scrollTo({ 
      top: 0, 
      behavior: 'smooth' 
    });
    
    // Para acessibilidade, mover foco para o header
    setTimeout(() => {
      header.focus();
    }, 500);
  });

  /* ================= LAZY LOAD IMAGENS ================= */
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        
        // Carregar background images
        if (img.dataset.bg) {
          img.style.backgroundImage = `url('${img.dataset.bg}')`;
          img.removeAttribute('data-bg');
        }
        
        observer.unobserve(img);
      }
    });
  }, { 
    rootMargin: '50px 0px 50px 0px' 
  });

  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });

  document.querySelectorAll('[data-bg]').forEach(el => {
    imageObserver.observe(el);
  });

  /* ================= MELHORIAS DE ACESSIBILIDADE ================= */
  const skipLink = document.createElement('a');
  skipLink.href = '#main';
  skipLink.className = 'skip-link';
  skipLink.textContent = 'Pular para o conteúdo principal';
  document.body.insertBefore(skipLink, document.body.firstChild);
  
  const mainContent = document.querySelector('main') || document.querySelector('.hero');
  if (mainContent && !mainContent.id) {
    mainContent.id = 'main';
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-navigation');
    }
  });

  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-navigation');
  });

  /* ================= CONTADOR DE ESTATÍSTICAS (OPCIONAL) ================= */
  const stats = document.querySelectorAll('.stat-number');
  if (stats.length > 0) {
    const statObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const stat = entry.target;
          const target = parseInt(stat.textContent);
          let current = 0;
          const increment = target / 50;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              current = target;
              clearInterval(timer);
            }
            stat.textContent = Math.round(current).toLocaleString();
          }, 30);
          statObserver.unobserve(stat);
        }
      });
    }, { threshold: 0.5 });

    stats.forEach(stat => statObserver.observe(stat));
  }

  /* ================= DETECÇÃO DE TOUCH ================= */
  function isTouchDevice() {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    );
  }

  if (isTouchDevice()) {
    document.body.classList.add('touch-device');
    document.body.classList.remove('no-touch-device');
  } else {
    document.body.classList.add('no-touch-device');
    document.body.classList.remove('touch-device');
  }

  /* ================= OTIMIZAÇÕES DE PERFORMANCE ================= */
  setTimeout(() => {
    const criticalImages = [
      'img/logo.png',
      'img/logo-fundo.png',
      'img/imagem2.png'
    ];
    
    criticalImages.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });
  }, 1000);
});

/* ================= CARROSSEL DE VANTAGENS (MOBILE) ================= */
function initAdvantagesCarousel() {
  const carousel = document.querySelector('.advantages-carousel.mobile-only');
  if (!carousel) return;
  
  const track = carousel.querySelector('.carousel-track');
  const slides = Array.from(carousel.querySelectorAll('.carousel-slide'));
  const prevBtn = carousel.querySelector('.carousel-prev');
  const nextBtn = carousel.querySelector('.carousel-next');
  const dots = Array.from(carousel.querySelectorAll('.carousel-dot'));
  
  if (!track || slides.length === 0) return;
  
  let currentIndex = 0;
  let startX = 0;
  let currentX = 0;
  let isDragging = false;
  
  // Calcular largura do slide
  function getSlideWidth() {
    return slides[0].getBoundingClientRect().width;
  }
  
  // Atualizar posição do carrossel
  function updateCarousel() {
    const slideWidth = getSlideWidth();
    const offset = currentIndex * slideWidth;
    track.style.transform = `translateX(-${offset}px)`;
    track.style.transition = 'transform 0.4s ease-out';
    
    // Atualizar dots
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentIndex);
    });
    
    // Atualizar botões
    if (prevBtn) prevBtn.disabled = currentIndex === 0;
    if (nextBtn) nextBtn.disabled = currentIndex === slides.length - 1;
  }
  
  // Ir para slide específico
  function goToSlide(index) {
    if (index < 0 || index >= slides.length) return;
    currentIndex = index;
    updateCarousel();
  }
  
  // Slide anterior
  function prevSlide() {
    if (currentIndex > 0) {
      currentIndex--;
      updateCarousel();
    }
  }
  
  // Próximo slide
  function nextSlide() {
    if (currentIndex < slides.length - 1) {
      currentIndex++;
      updateCarousel();
    }
  }
  
  // Event Listeners para botões
  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      prevSlide();
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      nextSlide();
    });
  }
  
  // Dots
  dots.forEach((dot, index) => {
    dot.addEventListener('click', (e) => {
      e.preventDefault();
      goToSlide(index);
    });
  });
  
  // Touch events para swipe
  track.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isDragging = true;
    track.style.transition = 'none';
  });
  
  track.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    currentX = e.touches[0].clientX;
    const diff = startX - currentX;
    
    // Mover o track enquanto arrasta
    const slideWidth = getSlideWidth();
    const offset = (currentIndex * slideWidth) + diff;
    track.style.transform = `translateX(-${offset}px)`;
  });
  
  track.addEventListener('touchend', () => {
    if (!isDragging) return;
    isDragging = false;
    
    const diff = startX - currentX;
    const slideWidth = getSlideWidth();
    const threshold = slideWidth / 4;
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentIndex < slides.length - 1) {
        nextSlide();
      } else if (diff < 0 && currentIndex > 0) {
        prevSlide();
      } else {
        updateCarousel();
      }
    } else {
      updateCarousel();
    }
    
    track.style.transition = 'transform 0.4s ease-out';
  });
  
  // Inicializar
  updateCarousel();
}

/* ================= UTILITÁRIOS ================= */
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/* ================= ADICIONAR ESTILOS DINÂMICOS ================= */
if (!document.querySelector('#carousel-styles')) {
  const style = document.createElement('style');
  style.id = 'carousel-styles';
  style.textContent = `
    /* Otimizações para carrossel no mobile */
    @media (max-width: 768px) {
      .swipe-enabled {
        cursor: grab;
        user-select: none;
      }
      
      .swipe-enabled.grabbing {
        cursor: grabbing;
      }
      
      .grabbing {
        user-select: none;
      }
      
      .grabbing * {
        pointer-events: none;
      }
      
      /* Indicador visual de swipe */
      .products::before,
      .gallery::before,
      .videos::before,
      .testimonials::before {
        content: '← Deslize para navegar →';
        display: block;
        text-align: center;
        font-size: 0.75rem;
        color: var(--gray-medium);
        margin-bottom: 10px;
        opacity: 0.8;
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }
    }
    
    /* Foco para acessibilidade */
    .keyboard-navigation a:focus,
    .keyboard-navigation button:focus,
    .keyboard-navigation input:focus,
    .keyboard-navigation textarea:focus,
    .keyboard-navigation select:focus {
      outline: 2px solid var(--primary-red) !important;
      outline-offset: 2px !important;
    }
    
    .skip-link {
      position: absolute;
      top: -40px;
      left: 0;
      background: var(--primary-red);
      color: white;
      padding: 8px;
      z-index: 10000;
      text-decoration: none;
    }
    
    .skip-link:focus {
      top: 0;
    }
  `;
  document.head.appendChild(style);
}

/* ================= POLYFILLS ================= */
if (!('IntersectionObserver' in window)) {
  const script = document.createElement('script');
  script.src = 'https://polyfill.io/v3/polyfill.min.js?features=IntersectionObserver';
  document.head.appendChild(script);
}

if (!('scrollBehavior' in document.documentElement.style)) {
  const smoothScrollScript = document.createElement('script');
  smoothScrollScript.src = 'https://cdn.jsdelivr.net/npm/smoothscroll-polyfill@0.4.4/dist/smoothscroll.min.js';
  smoothScrollScript.onload = function() {
    if (typeof smoothScroll !== 'undefined') {
      smoothScroll.polyfill();
    }
  };
  document.head.appendChild(smoothScrollScript);
}

/* ================= TRATAMENTO DE ERROS ================= */
window.addEventListener('error', function(e) {
  console.error('Erro capturado:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
  console.error('Promise rejeitada não tratada:', e.reason);
});

/* ================= SERVICE WORKER (OPCIONAL) ================= */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').then(function(registration) {
      console.log('ServiceWorker registrado:', registration.scope);
    }).catch(function(err) {
      console.log('Falha ao registrar ServiceWorker:', err);
    });
  });
}
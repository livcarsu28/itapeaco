/* ================= CONFIGURAÇÕES GERAIS ================= */
document.addEventListener('DOMContentLoaded', function () {
  // ... (código existente para menu mobile, vídeos, etc) ...

  /* ================= CARROSSEL SWIPE PARA MOBILE - VERSÃO MELHORADA ================= */
  function initCarouselSwipe(carouselId, itemSelector, isCentered = true) {
    const carousel = document.getElementById(carouselId) || document.querySelector(`.${carouselId}`);
    if (!carousel) return;

    // Configurações específicas para mobile
    const isMobile = window.innerWidth <= 768;
    
    // Para desktop, manter comportamento normal
    if (!isMobile) {
      carousel.style.overflowX = 'auto';
      carousel.style.scrollSnapType = 'x mandatory';
      carousel.style.scrollBehavior = 'smooth';
      return;
    }

    let isDown = false;
    let startX;
    let scrollLeft;
    let velocity = 0;
    let animationFrameId;
    let lastTime = 0;
    let lastScrollLeft = 0;
    let isDragging = false;

    // Configurações de scroll suave
    carousel.style.overflowX = 'hidden'; // Escondemos para controlar manualmente
    carousel.style.scrollSnapType = 'none';
    carousel.style.scrollBehavior = 'auto';

    // Obter todos os itens do carrossel
    const items = carousel.querySelectorAll(itemSelector);
    if (items.length === 0) return;

    // Configurar largura dos itens para snap
    let itemWidth = items[0].offsetWidth;
    const gap = parseInt(window.getComputedStyle(carousel).gap) || 16;
    const snapWidth = itemWidth + gap;

    // Atualizar largura quando redimensionar
    function updateItemWidth() {
      itemWidth = items[0].offsetWidth;
      snapWidth = itemWidth + gap;
    }

    // Função para ir para um item específico
    function goToItem(index) {
      if (index < 0) index = 0;
      if (index >= items.length) index = items.length - 1;

      const targetScroll = index * snapWidth;
      
      // Animar suavemente
      carousel.style.scrollBehavior = 'smooth';
      carousel.scrollLeft = targetScroll;
      
      // Restaurar para controle manual após animação
      setTimeout(() => {
        carousel.style.scrollBehavior = 'auto';
      }, 300);
    }

    // Snap para o item mais próximo
    function snapToNearest() {
      const scrollPos = carousel.scrollLeft;
      const itemIndex = Math.round(scrollPos / snapWidth);
      goToItem(itemIndex);
    }

    // ================= TOUCH EVENTS =================
    
    // Touch start
    carousel.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) return; // Ignorar multi-toque
      
      isDown = true;
      isDragging = true;
      startX = e.touches[0].pageX - carousel.offsetLeft;
      scrollLeft = carousel.scrollLeft;
      velocity = 0;
      lastScrollLeft = scrollLeft;
      lastTime = Date.now();
      
      // Cancelar qualquer animação em andamento
      cancelAnimationFrame(animationFrameId);
      
      e.preventDefault();
    }, { passive: false });

    // Touch move
    carousel.addEventListener('touchmove', (e) => {
      if (!isDown || e.touches.length > 1) return;
      
      const x = e.touches[0].pageX - carousel.offsetLeft;
      const walk = (x - startX) * 1.5; // Velocidade ajustada
      
      // Aplicar scroll com resistência nas extremidades
      let newScrollLeft = scrollLeft - walk;
      
      // Resistência nas bordas
      const maxScroll = carousel.scrollWidth - carousel.clientWidth;
      if (newScrollLeft < 0) {
        newScrollLeft = newScrollLeft / 2;
      } else if (newScrollLeft > maxScroll) {
        newScrollLeft = maxScroll + (newScrollLeft - maxScroll) / 2;
      }
      
      carousel.scrollLeft = newScrollLeft;
      
      // Calcular velocidade para momentum
      const currentTime = Date.now();
      const deltaTime = currentTime - lastTime;
      
      if (deltaTime > 0) {
        const deltaScroll = carousel.scrollLeft - lastScrollLeft;
        velocity = deltaScroll / deltaTime;
        lastScrollLeft = carousel.scrollLeft;
        lastTime = currentTime;
      }
      
      e.preventDefault();
    }, { passive: false });

    // Touch end
    carousel.addEventListener('touchend', (e) => {
      if (!isDown) return;
      
      isDown = false;
      isDragging = false;
      
      // Aplicar momentum se houver velocidade suficiente
      if (Math.abs(velocity) > 0.3) {
        applyMomentum();
      } else {
        // Snap para item mais próximo
        setTimeout(snapToNearest, 100);
      }
      
      e.preventDefault();
    }, { passive: false });

    // Touch cancel
    carousel.addEventListener('touchcancel', () => {
      isDown = false;
      isDragging = false;
      snapToNearest();
    });

    // ================= MOUSE EVENTS (para desktop testing) =================
    carousel.addEventListener('mousedown', (e) => {
      if (!isMobile) return; // Só aplicar no mobile
      
      isDown = true;
      startX = e.pageX - carousel.offsetLeft;
      scrollLeft = carousel.scrollLeft;
      velocity = 0;
      lastScrollLeft = scrollLeft;
      lastTime = Date.now();
      
      cancelAnimationFrame(animationFrameId);
      carousel.style.cursor = 'grabbing';
    });

    carousel.addEventListener('mouseleave', () => {
      if (!isDown || !isMobile) return;
      isDown = false;
      carousel.style.cursor = 'grab';
      snapToNearest();
    });

    carousel.addEventListener('mouseup', () => {
      if (!isDown || !isMobile) return;
      isDown = false;
      carousel.style.cursor = 'grab';
      
      if (Math.abs(velocity) > 0.3) {
        applyMomentum();
      } else {
        snapToNearest();
      }
    });

    carousel.addEventListener('mousemove', (e) => {
      if (!isDown || !isMobile) return;
      e.preventDefault();
      
      const x = e.pageX - carousel.offsetLeft;
      const walk = (x - startX) * 1.5;
      carousel.scrollLeft = scrollLeft - walk;
      
      // Calcular velocidade
      const currentTime = Date.now();
      const deltaTime = currentTime - lastTime;
      
      if (deltaTime > 0) {
        const deltaScroll = carousel.scrollLeft - lastScrollLeft;
        velocity = deltaScroll / deltaTime;
        lastScrollLeft = carousel.scrollLeft;
        lastTime = currentTime;
      }
    });

    // Função para aplicar momentum (inércia)
    function applyMomentum() {
      if (Math.abs(velocity) > 0.1) {
        // Aplicar com decaimento exponencial
        carousel.scrollLeft += velocity * 16;
        velocity *= 0.92; // Fricção
        
        // Limitar velocidade máxima
        if (velocity > 3) velocity = 3;
        if (velocity < -3) velocity = -3;
        
        animationFrameId = requestAnimationFrame(applyMomentum);
      } else {
        velocity = 0;
        snapToNearest();
      }
    }

    // Navegação por botões (se existirem)
    const prevBtn = carousel.parentElement.querySelector('.carousel-prev, .products-nav-prev, .gallery-nav-prev');
    const nextBtn = carousel.parentElement.querySelector('.carousel-next, .products-nav-next, .gallery-nav-next');

    if (prevBtn && isMobile) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const currentScroll = carousel.scrollLeft;
        const currentIndex = Math.round(currentScroll / snapWidth);
        goToItem(currentIndex - 1);
      });
    }

    if (nextBtn && isMobile) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const currentScroll = carousel.scrollLeft;
        const currentIndex = Math.round(currentScroll / snapWidth);
        goToItem(currentIndex + 1);
      });
    }

    // Indicadores de swipe (se existirem)
    const dotsContainer = carousel.parentElement.querySelector('.products-dots, .gallery-dots, .carousel-dots');
    if (dotsContainer && isMobile) {
      const dots = dotsContainer.querySelectorAll('.dot, .carousel-dot');
      dots.forEach((dot, index) => {
        dot.addEventListener('click', (e) => {
          e.preventDefault();
          goToItem(index);
        });
      });
    }

    // Atualizar quando redimensionar
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        updateItemWidth();
        snapToNearest(); // Recentralizar após redimensionamento
      }, 250);
    });

    // Snap inicial
    setTimeout(snapToNearest, 100);

    // Adicionar classe para estilização
    carousel.classList.add('swipe-enabled');
  }

  // Inicializar todos os carrosséis
  initCarouselSwipe('productsCarousel', '.product-card');
  initCarouselSwipe('galleryCarousel', '.gallery-item');
  initCarouselSwipe('videos-scroll', '.video-story');
  initCarouselSwipe('testimonials-scroll', '.testimonial-card');

  // Inicializar vantagens mobile (se for carrossel)
  const advCarousel = document.querySelector('.advantages-carousel.mobile-only');
  if (advCarousel && window.innerWidth <= 768) {
    initCarouselSwipe('advantages-carousel', '.carousel-slide');
  }

  // ... (resto do código existente) ...
});

// ================= SWIPE HELPER FUNCTIONS =================
function isTouchDevice() {
  return ('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0) ||
    (navigator.msMaxTouchPoints > 0);
}

// Adicionar estilos para melhorar a experiência de swipe
if (!document.querySelector('#swipe-styles')) {
  const style = document.createElement('style');
  style.id = 'swipe-styles';
  style.textContent = `
    /* Melhorar a experiência de swipe no mobile */
    @media (max-width: 768px) {
      .swipe-enabled {
        cursor: grab;
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
      }
      
      .swipe-enabled:active {
        cursor: grabbing;
      }
      
      /* Indicadores visuais de swipe */
      .swipe-enabled::after {
        content: '← Deslize →';
        position: absolute;
        bottom: -25px;
        left: 0;
        right: 0;
        text-align: center;
        font-size: 0.7rem;
        color: var(--gray-medium);
        opacity: 0.7;
        transition: opacity 0.3s ease;
      }
      
      .swipe-enabled.grabbing::after {
        opacity: 0;
      }
      
      /* Feedback tátil para iOS */
      .swipe-enabled {
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
      }
      
      /* Suavizar o scroll no iOS */
      .products-scroll,
      .gallery-scroll,
      .videos-scroll,
      .testimonials-scroll,
      .advantages-carousel .carousel-track {
        -webkit-overflow-scrolling: touch;
        scroll-behavior: smooth;
      }
    }
    
    /* Indicador de arrasto ativo */
    .grabbing {
      cursor: grabbing !important;
    }
    
    .grabbing * {
      pointer-events: none;
    }
    
    /* Prevenir seleção de texto durante o arrasto */
    .no-select {
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      -khtml-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
  `;
  document.head.appendChild(style);
}

// Detectar quando o usuário está usando touch
if (isTouchDevice()) {
  document.body.classList.add('touch-device');
  document.body.classList.remove('no-touch-device');
} else {
  document.body.classList.add('no-touch-device');
  document.body.classList.remove('touch-device');
}

/* ================= CONFIGURAÇÕES GERAIS ================= */

document.addEventListener('DOMContentLoaded', function () {

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

/* ================= SCROLL HORIZONTAL SUAVE - VERSÃO CORRIGIDA ================= */
const scrollSections = ['products-scroll', 'gallery-scroll', 'videos-scroll', 'testimonials-scroll'];

scrollSections.forEach(sectionId => {
  const section =
    document.getElementById(sectionId) ||
    document.querySelector(`.${sectionId}`);

  if (!section) return;

  let isDown = false;
  let startX;
  let scrollLeft;
  let velocity = 0;
  let animationId;
  let lastTime = 0;
  let lastScrollLeft = 0;

  // Configuração inicial para scroll suave
  section.style.scrollBehavior = 'smooth';
  section.style.overflowX = 'auto';
  section.style.scrollSnapType = 'x mandatory';
  section.style.webkitOverflowScrolling = 'touch'; // Para iOS

  // Mouse events
  section.addEventListener('mousedown', (e) => {
    isDown = true;
    section.style.scrollBehavior = 'auto'; // Desativa smooth durante drag
    section.classList.add('grabbing');
    startX = e.pageX - section.offsetLeft;
    scrollLeft = section.scrollLeft;
    cancelAnimationFrame(animationId);
    velocity = 0;
    lastScrollLeft = scrollLeft;
    lastTime = Date.now();
  });

  section.addEventListener('mouseleave', () => {
    if (!isDown) return;
    isDown = false;
    section.classList.remove('grabbing');
    section.style.scrollBehavior = 'smooth';
    applyMomentum();
  });

  section.addEventListener('mouseup', () => {
    if (!isDown) return;
    isDown = false;
    section.classList.remove('grabbing');
    section.style.scrollBehavior = 'smooth';
    applyMomentum();
  });

  section.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    
    const x = e.pageX - section.offsetLeft;
    const walk = (x - startX) * 1.5; // Fator de multiplicação menor para mais suavidade
    section.scrollLeft = scrollLeft - walk;
    
    // Calcular velocidade para momentum (com suavização)
    const currentTime = Date.now();
    const deltaTime = currentTime - lastTime;
    
    if (deltaTime > 0) {
      const deltaScroll = section.scrollLeft - lastScrollLeft;
      velocity = deltaScroll / deltaTime;
      lastScrollLeft = section.scrollLeft;
      lastTime = currentTime;
    }
  });

  // Touch events - MELHORADO para suavidade
  let touchStartX = 0;
  let touchScrollLeft = 0;
  let touchId = null;

  section.addEventListener('touchstart', (e) => {
    if (touchId !== null) return; // Ignora toques múltiplos
    
    touchId = e.changedTouches[0].identifier;
    isDown = true;
    section.style.scrollBehavior = 'auto';
    section.classList.add('grabbing');
    touchStartX = e.changedTouches[0].pageX;
    touchScrollLeft = section.scrollLeft;
    cancelAnimationFrame(animationId);
    velocity = 0;
    lastScrollLeft = touchScrollLeft;
    lastTime = Date.now();
    
    e.preventDefault(); // Previne scroll vertical acidental
  }, { passive: false });

  section.addEventListener('touchend', (e) => {
    if (!isDown || e.changedTouches[0].identifier !== touchId) return;
    
    isDown = false;
    touchId = null;
    section.classList.remove('grabbing');
    section.style.scrollBehavior = 'smooth';
    applyMomentum();
    
    e.preventDefault();
  }, { passive: false });

  section.addEventListener('touchmove', (e) => {
    if (!isDown || e.changedTouches[0].identifier !== touchId) return;
    e.preventDefault();
    
    const touch = e.changedTouches[0];
    const walk = (touch.pageX - touchStartX) * 1.2; // Fator ainda menor para touch
    
    // Scroll suave com easing
    const targetScroll = touchScrollLeft - walk;
    const currentScroll = section.scrollLeft;
    const diff = targetScroll - currentScroll;
    
    // Aplica easing para movimento mais suave
    section.scrollLeft = currentScroll + (diff * 0.3);
    
    // Calcular velocidade suavizada
    const currentTime = Date.now();
    const deltaTime = currentTime - lastTime;
    
    if (deltaTime > 0) {
      const deltaScroll = section.scrollLeft - lastScrollLeft;
      // Suaviza a velocidade com média móvel
      velocity = (velocity * 0.7) + ((deltaScroll / deltaTime) * 0.3);
      lastScrollLeft = section.scrollLeft;
      lastTime = currentTime;
    }
  }, { passive: false });

  // Momentum scrolling com easing
  function applyMomentum() {
    if (Math.abs(velocity) > 0.1) {
      // Aplica easing na velocidade (deceleração suave)
      section.scrollLeft += velocity * 16;
      velocity *= 0.92; // Fricção mais forte para parar mais rápido
      
      // Limita a velocidade máxima
      if (velocity > 2) velocity = 2;
      if (velocity < -2) velocity = -2;
      
      animationId = requestAnimationFrame(applyMomentum);
    } else {
      velocity = 0;
      snapToNearestItem();
    }
  }

  // Snap para o item mais próximo quando parar
  function snapToNearestItem() {
    const items = section.querySelectorAll('.product-card, .gallery-item, .video-story, .testimonial-card');
    if (items.length === 0) return;
    
    const scrollLeft = section.scrollLeft;
    const containerWidth = section.offsetWidth;
    
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
      
      section.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  }

  // Adiciona event listener para snap ao soltar
  section.addEventListener('scroll', () => {
    if (!isDown) {
      // Cancela qualquer momentum em andamento
      cancelAnimationFrame(animationId);
      velocity = 0;
    }
  });

  // Snap inicial
  setTimeout(() => {
    snapToNearestItem();
  }, 100);
});

// Adiciona estilo para cursor grabbing se não existir
if (!document.querySelector('#grabbing-styles')) {
  const style = document.createElement('style');
  style.id = 'grabbing-styles';
  style.textContent = `
    .grabbing {
      cursor: grabbing !important;
      user-select: none !important;
    }
    .grabbing * {
      pointer-events: none !important;
    }
    
    /* Melhora a experiência de scroll no iOS */
    .products-scroll,
    .gallery-scroll,
    .videos-scroll,
    .testimonials-scroll {
      -webkit-overflow-scrolling: touch !important;
      scroll-snap-type: x mandatory !important;
    }
    
    /* Remove a inércia padrão do iOS para dar controle total ao JS */
    @supports (-webkit-overflow-scrolling: touch) {
      .products-scroll,
      .gallery-scroll,
      .videos-scroll,
      .testimonials-scroll {
        overflow-x: scroll !important;
      }
    }
  `;
  document.head.appendChild(style);
}
 

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
  updateHeaderOnScroll(); // Executar uma vez no carregamento

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
  updateBackToTop(); // Executar uma vez no carregamento

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

  // Observar imagens com data-src
  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });

  // Observar elementos com data-bg
  document.querySelectorAll('[data-bg]').forEach(el => {
    imageObserver.observe(el);
  });

  /* ================= MELHORIAS DE ACESSIBILIDADE ================= */
  
  // Adicionar skip link para acessibilidade
  const skipLink = document.createElement('a');
  skipLink.href = '#main';
  skipLink.className = 'skip-link';
  skipLink.textContent = 'Pular para o conteúdo principal';
  document.body.insertBefore(skipLink, document.body.firstChild);
  
  // Adicionar ID para o conteúdo principal
  const mainContent = document.querySelector('main') || document.querySelector('.hero');
  if (mainContent && !mainContent.id) {
    mainContent.id = 'main';
  }

  // Foco visível para elementos interativos
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-navigation');
    }
  });

  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-navigation');
  });

  // Estilos para foco visível
  if (!document.querySelector('#focus-styles')) {
    const focusStyle = document.createElement('style');
    focusStyle.id = 'focus-styles';
    focusStyle.textContent = `
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
    document.head.appendChild(focusStyle);
  }

  /* ================= CONTADOR DE ESTATÍSTICAS (OPCIONAL) ================= */
  const stats = document.querySelectorAll('.stat-number');
  if (stats.length > 0) {
    const observer = new IntersectionObserver((entries) => {
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
          observer.unobserve(stat);
        }
      });
    }, { threshold: 0.5 });

    stats.forEach(stat => observer.observe(stat));
  }

  /* ================= FORMULÁRIO DE CONTATO (SE EXISTIR) ================= */
  const contactForm = document.querySelector('form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      
      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
        
        // Simulação de envio - substituir por sua API
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        alert('Mensagem enviada com sucesso! Entraremos em contato em breve.');
        contactForm.reset();
        
      } catch (error) {
        alert('Erro ao enviar mensagem. Tente novamente.');
        console.error('Form error:', error);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
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
  
  // Preload de recursos críticos
  function preloadCriticalResources() {
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
  }
  
  // Executar após um pequeno delay para não bloquear renderização inicial
  setTimeout(preloadCriticalResources, 1000);

  console.log('Site carregado com sucesso 🚀 - ITAPÊ AÇO');
});

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

/* ================= POLYFILLS PARA NAVEGADORES ANTIGOS ================= */

// IntersectionObserver polyfill
if (!('IntersectionObserver' in window)) {
  // Carregar polyfill dinamicamente
  const script = document.createElement('script');
  script.src = 'https://polyfill.io/v3/polyfill.min.js?features=IntersectionObserver';
  document.head.appendChild(script);
}

// Smooth scroll polyfill
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
  
  // Enviar erro para analytics (se configurado)
  if (typeof gtag !== 'undefined') {
    gtag('event', 'exception', {
      'description': e.error.message,
      'fatal': false
    });
  }
});

window.addEventListener('unhandledrejection', function(e) {
  console.error('Promise rejeitada não tratada:', e.reason);
});

/* ================= OFFLINE SUPPORT ================= */

// Verificar se o navegador suporta service workers
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').then(function(registration) {
      console.log('ServiceWorker registrado com sucesso: ', registration.scope);
    }, function(err) {
      console.log('Falha ao registrar ServiceWorker: ', err);
    });
  });
}

// Detectar quando o usuário está offline
window.addEventListener('offline', function() {
  console.log('Usuário está offline');
  // Mostrar notificação (opcional)
  const offlineNotice = document.createElement('div');
  offlineNotice.className = 'offline-notice';
  offlineNotice.textContent = 'Você está offline. Algumas funcionalidades podem não estar disponíveis.';
  offlineNotice.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: var(--warning);
    color: white;
    padding: 10px;
    text-align: center;
    z-index: 10000;
  `;
  document.body.appendChild(offlineNotice);
  
  setTimeout(() => {
    if (offlineNotice.parentNode) {
      offlineNotice.parentNode.removeChild(offlineNotice);
    }
  }, 5000);
});

window.addEventListener('online', function() {
  console.log('Usuário está online novamente');
});

/* ================= CARROSSEL DE VANTAGENS (MOBILE) ================= */
function initAdvantagesCarousel() {
  const carousel = document.querySelector('.advantages-carousel');
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
  let autoSlideInterval;
  
  // Calcular largura do slide
  function getSlideWidth() {
    return slides[0].getBoundingClientRect().width;
  }
  
  // Atualizar posição do carrossel
  function updateCarousel() {
    const slideWidth = getSlideWidth();
    const offset = currentIndex * slideWidth;
    track.style.transform = `translateX(-${offset}px)`;
    
    // Atualizar dots
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentIndex);
    });
    
    // Atualizar botões
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === slides.length - 1;
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
  
  // Iniciar slide automático
  function startAutoSlide() {
    stopAutoSlide();
    autoSlideInterval = setInterval(() => {
      if (currentIndex < slides.length - 1) {
        nextSlide();
      } else {
        goToSlide(0);
      }
    }, 5000); // Muda a cada 5 segundos
  }
  
  // Parar slide automático
  function stopAutoSlide() {
    if (autoSlideInterval) {
      clearInterval(autoSlideInterval);
    }
  }
  
  // Event Listeners
  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      prevSlide();
      stopAutoSlide();
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      nextSlide();
      stopAutoSlide();
    });
  }
  
  // Dots
  dots.forEach((dot, index) => {
    dot.addEventListener('click', (e) => {
      e.preventDefault();
      goToSlide(index);
      stopAutoSlide();
    });
  });
  
  // Touch events para swipe
  track.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isDragging = true;
    stopAutoSlide();
  });
  
  track.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    currentX = e.touches[0].clientX;
    const diff = startX - currentX;
    
    // Mover o track enquanto arrasta
    const slideWidth = getSlideWidth();
    const offset = (currentIndex * slideWidth) + diff;
    track.style.transform = `translateX(-${offset}px)`;
    track.style.transition = 'none';
  });
  
  track.addEventListener('touchend', () => {
    if (!isDragging) return;
    isDragging = false;
    
    const diff = startX - currentX;
    const slideWidth = getSlideWidth();
    const threshold = slideWidth / 4; // 25% do slide
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentIndex < slides.length - 1) {
        // Swipe para esquerda
        nextSlide();
      } else if (diff < 0 && currentIndex > 0) {
        // Swipe para direita
        prevSlide();
      } else {
        // Voltar para posição atual
        updateCarousel();
      }
    } else {
      // Voltar para posição atual
      updateCarousel();
    }
    
    track.style.transition = 'transform 0.5s ease-in-out';
  });
  
  // Mouse events para drag
  track.addEventListener('mousedown', (e) => {
    startX = e.clientX;
    isDragging = true;
    stopAutoSlide();
    track.style.cursor = 'grabbing';
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    currentX = e.clientX;
    const diff = startX - currentX;
    
    // Mover o track enquanto arrasta
    const slideWidth = getSlideWidth();
    const offset = (currentIndex * slideWidth) + diff;
    track.style.transform = `translateX(-${offset}px)`;
    track.style.transition = 'none';
  });
  
  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    track.style.cursor = 'grab';
    
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
    
    track.style.transition = 'transform 0.5s ease-in-out';
  });
  
  // Inicializar
  updateCarousel();
  startAutoSlide();
  
  // Pausar auto slide quando hover (se hover disponível)
  if (!isTouchDevice()) {
    carousel.addEventListener('mouseenter', stopAutoSlide);
    carousel.addEventListener('mouseleave', startAutoSlide);
  }
  
  // Atualizar no resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updateCarousel();
    }, 250);
  });
}

// Chamar a função quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
  // ... seu código existente ...
  
  initAdvantagesCarousel();
  
  // ... resto do seu código ...
});


/* ================= MODAL GALERIA QUADRADA ================= */
function initGalleryModal() {
  const modal = document.getElementById('galleryModal');
  const openButtons = document.querySelectorAll('.open-gallery');
  const closeButton = modal.querySelector('.modal-close');
  const prevButton = modal.querySelector('.modal-nav-prev');
  const nextButton = modal.querySelector('.modal-nav-next');
  const thumbnails = modal.querySelectorAll('.modal-thumbnail');
  const currentImage = modal.querySelector('.modal-current-image');
  const locationInfo = modal.querySelector('.modal-info-location span');
  const telhaInfo = modal.querySelector('.modal-info-telha span');
  
  // Dados dos projetos
  const projects = [
    {
      image: 'img/galp.jpeg',
      alt: 'Galpão industrial com telha trapezoidal',
      location: 'Barueri/SP',
      telha: 'Telha Trapezoidal 0,43mm'
    },
    {
      image: 'img/casa.jpg',
      alt: 'Cobertura residencial com telha metálica',
      location: 'Campinas/SP',
      telha: 'Telha Ondulada 0,45mm'
    },
    {
      image: 'img/container.webp',
      alt: 'Comércio com cobertura em telha metálica',
      location: 'Sorocaba/SP',
      telha: 'Telha Termoacústica 0,50mm'
    },
    {
      image: 'img/galp.jpeg',
      alt: 'Galpão agrícola com telha metálica',
      location: 'Interior/SP',
      telha: 'Telha Trapezoidal 0,40mm'
    }
  ];
  
  let currentIndex = 0;
  let totalProjects = projects.length;
  let isTransitioning = false;
  
  // Abrir modal
  openButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });
  });
  
  // Fechar modal
  closeButton.addEventListener('click', closeModal);
  
  // Fechar ao clicar fora
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // Fechar com ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
  
  // Navegação
  prevButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showPrevProject();
  });
  
  nextButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showNextProject();
  });
  
  // Miniaturas
  thumbnails.forEach((thumbnail, index) => {
    thumbnail.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (index !== currentIndex) {
        goToProject(index);
      }
    });
  });
  
  // Navegação por teclado
  modal.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('active')) return;
    
    switch(e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        showPrevProject();
        break;
      case 'ArrowRight':
        e.preventDefault();
        showNextProject();
        break;
      case ' ':
      case 'Enter':
        if (e.target.classList.contains('modal-thumbnail')) {
          e.preventDefault();
          const index = parseInt(e.target.dataset.index);
          goToProject(index);
        }
        break;
    }
  });
  
  // Funções principais
  function openModal() {
    document.body.style.overflow = 'hidden';
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    
    // Reset para primeiro projeto
    goToProject(0);
    
    // Focar no modal para acessibilidade
    setTimeout(() => {
      modal.focus();
    }, 100);
  }
  
  function closeModal() {
    document.body.style.overflow = '';
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    
    // Focar no botão que abriu
    if (openButtons.length > 0) {
      openButtons[0].focus();
    }
  }
  
  function goToProject(index) {
    if (isTransitioning || index === currentIndex || index < 0 || index >= totalProjects) return;
    
    isTransitioning = true;
    
    // Atualizar miniaturas
    thumbnails.forEach((thumb, i) => {
      thumb.classList.toggle('active', i === index);
    });
    
    // Animação de transição
    currentImage.style.opacity = '0';
    
    setTimeout(() => {
      // Atualizar imagem e informações
      const project = projects[index];
      currentImage.src = project.image;
      currentImage.alt = project.alt;
      locationInfo.textContent = project.location;
      telhaInfo.textContent = project.telha;
      
      // Animação de entrada
      currentImage.style.opacity = '1';
      
      currentIndex = index;
      updateNavigationButtons();
      isTransitioning = false;
    }, 300);
  }
  
  function showPrevProject() {
    const prevIndex = currentIndex === 0 ? totalProjects - 1 : currentIndex - 1;
    goToProject(prevIndex);
  }
  
  function showNextProject() {
    const nextIndex = currentIndex === totalProjects - 1 ? 0 : currentIndex + 1;
    goToProject(nextIndex);
  }
  
  function updateNavigationButtons() {
    // Carrossel infinito - botões sempre ativos
    prevButton.disabled = false;
    nextButton.disabled = false;
    
    // Atualizar labels
    const prevLabel = currentIndex === 0 ? 'Último projeto' : 'Projeto anterior';
    const nextLabel = currentIndex === totalProjects - 1 ? 'Primeiro projeto' : 'Próximo projeto';
    
    prevButton.setAttribute('aria-label', prevLabel);
    nextButton.setAttribute('aria-label', nextLabel);
  }
  
  // Pré-carregar imagens
  function preloadImages() {
    projects.forEach(project => {
      const img = new Image();
      img.src = project.image;
    });
  }
  
  // Inicializar
  updateNavigationButtons();
  preloadImages();
}

// Adicionar ao DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  // ... seu código existente ...
  
  initGalleryModal();
  
  // ... resto do seu código ...
});
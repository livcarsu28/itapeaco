/* ================= CARROSSEL SCROLL SUAVE OTIMIZADO ================= */
function initSmoothCarousel(carouselId, itemSelector) {
    const carousel = document.getElementById(carouselId) || document.querySelector(`.${carouselId}`);
    if (!carousel) return;

    // Só aplicar no mobile
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) {
        carousel.style.overflowX = 'auto';
        carousel.style.scrollSnapType = 'x mandatory';
        carousel.style.scrollBehavior = 'smooth';
        return;
    }

    let isScrolling = false;
    let startX = 0;
    let scrollLeft = 0;
    let velocity = 0;
    let lastX = 0;
    let lastTime = 0;
    let animationId = null;
    let isInteracting = false;
    let startY = 0;
    let isHorizontalScroll = false;

    // Configurações iniciais para performance
    carousel.style.overflowX = 'auto'; // IMPORTANTE: 'auto' em vez de 'hidden'
    carousel.style.scrollBehavior = 'auto';
    carousel.style.webkitOverflowScrolling = 'touch';
    
    // Otimização de performance
    carousel.style.transform = 'translate3d(0,0,0)';
    carousel.style.backfaceVisibility = 'hidden';
    carousel.style.perspective = '1000px';

    // Obter itens
    const items = carousel.querySelectorAll(itemSelector);
    if (items.length === 0) return;

    // Configurar snap
    const itemWidth = items[0].offsetWidth;
    const gap = parseInt(window.getComputedStyle(carousel).gap) || 16;
    const snapWidth = itemWidth + gap;

    // Função para scroll suave usando requestAnimationFrame
    function smoothScrollTo(target) {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }

        const start = carousel.scrollLeft;
        const distance = target - start;
        const duration = 300; // ms
        let startTime = null;

        function animate(currentTime) {
            if (!startTime) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            
            // Easing function - easeOutCubic para suavidade
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            carousel.scrollLeft = start + (distance * easeProgress);
            
            if (timeElapsed < duration) {
                animationId = requestAnimationFrame(animate);
            } else {
                animationId = null;
            }
        }

        animationId = requestAnimationFrame(animate);
    }

    // Snap para o item mais próximo
    function snapToNearest() {
        const scrollPos = carousel.scrollLeft;
        const itemIndex = Math.round(scrollPos / snapWidth);
        const targetScroll = Math.max(0, Math.min(itemIndex * snapWidth, carousel.scrollWidth - carousel.clientWidth));
        
        smoothScrollTo(targetScroll);
    }

    // Atualizar velocidade baseada no movimento
    function updateVelocity(currentX, currentTime) {
        if (lastTime === 0) {
            lastTime = currentTime;
            lastX = currentX;
            return;
        }

        const deltaTime = currentTime - lastTime;
        if (deltaTime > 0) {
            const deltaX = currentX - lastX;
            // Filtro de média móvel para velocidade mais suave
            velocity = (velocity * 0.3) + ((deltaX / deltaTime) * 0.7);
            lastX = currentX;
            lastTime = currentTime;
        }
    }

    // Aplicar momentum (inércia)
    function applyMomentum() {
        if (Math.abs(velocity) > 0.1) {
            // Scroll com decaimento exponencial
            const currentScroll = carousel.scrollLeft;
            const delta = velocity * 16;
            
            // Limitar velocidade máxima
            const maxVelocity = 8;
            velocity = Math.max(Math.min(velocity, maxVelocity), -maxVelocity);
            
            // Aplicar scroll com easing
            carousel.scrollLeft = currentScroll - delta;
            
            // Decaimento mais suave
            velocity *= 0.92;
            
            // Continuar momentum
            animationId = requestAnimationFrame(applyMomentum);
        } else {
            velocity = 0;
            snapToNearest();
        }
    }

    // ================= TOUCH EVENTS CORRIGIDOS =================
    carousel.addEventListener('touchstart', (e) => {
        // Verificar se é um link ou botão - não interceptar
        if (e.target.closest('a') || e.target.closest('button')) {
            return;
        }
        
        isInteracting = true;
        isScrolling = false; // Não iniciamos como scrolling ainda
        isHorizontalScroll = false;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        scrollLeft = carousel.scrollLeft;
        velocity = 0;
        lastX = startX;
        lastTime = performance.now();
        
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }, { passive: true });

    carousel.addEventListener('touchmove', (e) => {
        // Se não estamos interagindo ou é um link/botão, sair
        if (!isInteracting || e.target.closest('a') || e.target.closest('button')) {
            return;
        }
        
        const touch = e.touches[0];
        const currentX = touch.clientX;
        const currentY = touch.clientY;
        const currentTime = performance.now();
        
        // Determinar se é um scroll horizontal
        if (!isHorizontalScroll && !isScrolling) {
            const deltaX = Math.abs(currentX - startX);
            const deltaY = Math.abs(currentY - startY);
            
            // Se o movimento for mais horizontal que vertical, é um scroll
            if (deltaX > deltaY && deltaX > 5) {
                isHorizontalScroll = true;
                isScrolling = true;
                e.preventDefault(); // Só prevenir default para scroll horizontal
            } else if (deltaY > deltaX && deltaY > 5) {
                // Movimento vertical - não interferir
                isInteracting = false;
                return;
            }
        }
        
        if (!isScrolling) return;
        
        // Cálculo de movimento suave
        const deltaX = currentX - startX;
        const newScroll = scrollLeft - deltaX * 1.2;
        
        // Limitar scroll com easing nas bordas
        const maxScroll = carousel.scrollWidth - carousel.clientWidth;
        let boundedScroll = newScroll;
        
        if (newScroll < 0) {
            boundedScroll = newScroll / 3;
        } else if (newScroll > maxScroll) {
            boundedScroll = maxScroll + (newScroll - maxScroll) / 3;
        }
        
        // Scroll suave com requestAnimationFrame
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        
        animationId = requestAnimationFrame(() => {
            carousel.scrollLeft = boundedScroll;
        });
        
        // Atualizar velocidade para momentum
        updateVelocity(currentX, currentTime);
    }, { passive: false });

    carousel.addEventListener('touchend', (e) => {
        if (!isInteracting) return;
        
        // Se é um link ou botão, não fazer nada
        if (e.target.closest('a') || e.target.closest('button')) {
            isInteracting = false;
            return;
        }
        
        if (isScrolling) {
            // Aplicar momentum se houver velocidade suficiente
            if (Math.abs(velocity) > 0.5) {
                applyMomentum();
            } else {
                // Snap suave
                setTimeout(() => {
                    if (isScrolling) {
                        snapToNearest();
                    }
                }, 50);
            }
        }
        
        isScrolling = false;
        isInteracting = false;
        isHorizontalScroll = false;
    }, { passive: true });

    // ================= MOUSE EVENTS PARA TESTES =================
    carousel.addEventListener('mousedown', (e) => {
        if (!isMobile || isInteracting) return;
        
        // Verificar se é um link ou botão
        if (e.target.closest('a') || e.target.closest('button')) {
            return;
        }
        
        isInteracting = true;
        isScrolling = true;
        startX = e.clientX;
        scrollLeft = carousel.scrollLeft;
        velocity = 0;
        lastX = startX;
        lastTime = performance.now();
        
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        
        carousel.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isScrolling || !isMobile || !isInteracting) return;
        
        const currentX = e.clientX;
        const currentTime = performance.now();
        const deltaX = currentX - startX;
        
        // Scroll com easing
        const newScroll = scrollLeft - deltaX * 1.2;
        const maxScroll = carousel.scrollWidth - carousel.clientWidth;
        let boundedScroll = newScroll;
        
        if (newScroll < 0) {
            boundedScroll = newScroll / 3;
        } else if (newScroll > maxScroll) {
            boundedScroll = maxScroll + (newScroll - maxScroll) / 3;
        }
        
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        
        animationId = requestAnimationFrame(() => {
            carousel.scrollLeft = boundedScroll;
        });
        
        updateVelocity(currentX, currentTime);
    });

    document.addEventListener('mouseup', () => {
        if (!isScrolling || !isMobile || !isInteracting) return;
        
        if (isScrolling) {
            if (Math.abs(velocity) > 0.5) {
                applyMomentum();
            } else {
                setTimeout(() => {
                    if (isScrolling) {
                        snapToNearest();
                    }
                }, 50);
            }
        }
        
        isScrolling = false;
        isInteracting = false;
        carousel.style.cursor = 'grab';
    });

    // Adicionar indicador visual
    carousel.classList.add('smooth-scroll-enabled');

    // Snap inicial
    setTimeout(() => {
        snapToNearest();
    }, 200);
}

/* ================= CARROSSEL DE VANTAGENS OTIMIZADO ================= */
function initSmoothAdvantagesCarousel() {
    const carousel = document.querySelector('.advantages-carousel.mobile-only');
    if (!carousel || window.innerWidth > 768) return;
    
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
    let animationId = null;
    let startY = 0;
    let isHorizontalSwipe = false;
    
    // Otimizar track para performance
    track.style.transform = 'translate3d(0,0,0)';
    track.style.backfaceVisibility = 'hidden';
    track.style.perspective = '1000px';
    
    function getSlideWidth() {
        return slides[0].getBoundingClientRect().width;
    }
    
    function smoothSlideTo(index) {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        
        const startPos = -currentIndex * getSlideWidth();
        const targetPos = -index * getSlideWidth();
        const distance = targetPos - startPos;
        const duration = 400;
        let startTime = null;
        
        function animate(currentTime) {
            if (!startTime) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            
            const easeProgress = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            const currentPos = startPos + (distance * easeProgress);
            track.style.transform = `translate3d(${currentPos}px, 0, 0)`;
            track.style.transition = 'none';
            
            if (timeElapsed < duration) {
                animationId = requestAnimationFrame(animate);
            } else {
                animationId = null;
                currentIndex = index;
                updateIndicators();
            }
        }
        
        animationId = requestAnimationFrame(animate);
    }
    
    function updateIndicators() {
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
        
        if (prevBtn) prevBtn.disabled = currentIndex === 0;
        if (nextBtn) nextBtn.disabled = currentIndex === slides.length - 1;
    }
    
    // Event Listeners para botões
    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentIndex > 0) {
                smoothSlideTo(currentIndex - 1);
            }
        }, true);
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentIndex < slides.length - 1) {
                smoothSlideTo(currentIndex + 1);
            }
        }, true);
    }
    
    dots.forEach((dot, index) => {
        dot.addEventListener('click', (e) => {
            e.preventDefault();
            if (index !== currentIndex) {
                smoothSlideTo(index);
            }
        }, true);
    });
    
    // Touch events corrigidos
    track.addEventListener('touchstart', (e) => {
        // Verificar se é um botão ou dot
        if (e.target.closest('button') || e.target.closest('.carousel-dot')) {
            return;
        }
        
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isDragging = false;
        isHorizontalSwipe = false;
        
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        track.style.transition = 'none';
    }, { passive: true });
    
    track.addEventListener('touchmove', (e) => {
        if (!startX || e.target.closest('button') || e.target.closest('.carousel-dot')) {
            return;
        }
        
        currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        
        // Determinar se é swipe horizontal
        if (!isHorizontalSwipe && !isDragging) {
            const deltaX = Math.abs(currentX - startX);
            const deltaY = Math.abs(currentY - startY);
            
            if (deltaX > deltaY && deltaX > 5) {
                isHorizontalSwipe = true;
                isDragging = true;
                e.preventDefault();
            } else if (deltaY > deltaX && deltaY > 5) {
                // Movimento vertical - não interferir
                startX = 0;
                return;
            }
        }
        
        if (!isDragging) return;
        
        const diff = startX - currentX;
        const slideWidth = getSlideWidth();
        const offset = (-currentIndex * slideWidth) + diff;
        
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        
        animationId = requestAnimationFrame(() => {
            track.style.transform = `translate3d(${offset}px, 0, 0)`;
        });
    }, { passive: false });
    
    track.addEventListener('touchend', (e) => {
        if (!startX) return;
        
        // Se clicou em botão ou dot
        if (e.target.closest('button') || e.target.closest('.carousel-dot')) {
            startX = 0;
            return;
        }
        
        if (isDragging) {
            const diff = startX - currentX;
            const slideWidth = getSlideWidth();
            const threshold = slideWidth / 3;
            
            if (Math.abs(diff) > threshold) {
                if (diff > 0 && currentIndex < slides.length - 1) {
                    smoothSlideTo(currentIndex + 1);
                } else if (diff < 0 && currentIndex > 0) {
                    smoothSlideTo(currentIndex - 1);
                } else {
                    smoothSlideTo(currentIndex);
                }
            } else {
                smoothSlideTo(currentIndex);
            }
        }
        
        isDragging = false;
        startX = 0;
    }, { passive: true });
    
    // Inicializar
    updateIndicators();
    track.style.transform = `translate3d(0, 0, 0)`;
}

/* ================= INICIALIZAÇÃO OTIMIZADA ================= */
function initAllCarousels() {
    // Lista de carrosséis para inicializar
    const carousels = [
        { id: 'productsCarousel', selector: '.product-card' },
        { id: 'galleryCarousel', selector: '.gallery-item' },
        { id: 'videos-scroll', selector: '.video-story' },
        { id: 'testimonials-scroll', selector: '.testimonial-card' }
    ];

    // Inicializar com delay para não bloquear a renderização
    setTimeout(() => {
        carousels.forEach(carousel => {
            initSmoothCarousel(carousel.id, carousel.selector);
        });
        
        // Inicializar carrossel de vantagens separadamente
        initSmoothAdvantagesCarousel();
    }, 500);
}

/* ================= ADICIONAR ESTILOS PARA SCROLL SUAVE ================= */
if (!document.querySelector('#smooth-scroll-styles')) {
    const style = document.createElement('style');
    style.id = 'smooth-scroll-styles';
    style.textContent = `
        /* Otimizações para scroll super suave */
        .smooth-scroll-enabled {
            -webkit-overflow-scrolling: touch !important;
            scroll-behavior: smooth !important;
            overscroll-behavior-x: contain !important;
        }
        
        @media (max-width: 768px) {
            .smooth-scroll-enabled {
                scroll-snap-type: x mandatory;
            }
            
            .smooth-scroll-enabled .product-card,
            .smooth-scroll-enabled .gallery-item,
            .smooth-scroll-enabled .video-story,
            .smooth-scroll-enabled .testimonial-card {
                scroll-snap-align: center;
                scroll-snap-stop: always;
            }
            
            /* Feedback visual durante o scroll */
            .smooth-scroll-enabled:active {
                cursor: grabbing;
            }
            
            /* Gradiente nas bordas para indicar mais conteúdo */
            .products-container,
            .gallery-container {
                position: relative;
            }
            
            .products-container::after,
            .gallery-container::after {
                content: '';
                position: absolute;
                right: 0;
                top: 0;
                bottom: 0;
                width: 30px;
                background: linear-gradient(to left, var(--gray-bg), transparent);
                pointer-events: none;
                z-index: 2;
            }
            
            /* Indicador de swipe */
            .products-scroll::before,
            .gallery-scroll::before {
                content: '↔';
                position: absolute;
                bottom: -25px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 1.2rem;
                color: var(--primary-red);
                opacity: 0.7;
                animation: swipeHint 2s infinite;
            }
            
            @keyframes swipeHint {
                0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.7; }
                50% { transform: translateX(-50%) scale(1.1); opacity: 1; }
            }
            
            /* Performance */
            .products-scroll,
            .gallery-scroll,
            .videos-scroll,
            .testimonials-scroll {
                transform: translate3d(0,0,0);
                backface-visibility: hidden;
                -webkit-backface-visibility: hidden;
                perspective: 1000px;
                -webkit-perspective: 1000px;
            }
            
            /* Remover highlight no iOS */
            .smooth-scroll-enabled,
            .smooth-scroll-enabled * {
                -webkit-tap-highlight-color: transparent;
                -webkit-touch-callout: none;
            }
            
            /* Menu mobile fix */
            .mobile-dropdown a {
                position: relative;
                z-index: 10000;
                pointer-events: auto !important;
            }
        }
        
        /* Melhorias para iOS */
        @supports (-webkit-touch-callout: none) {
            @media (max-width: 768px) {
                .products-scroll,
                .gallery-scroll,
                .videos-scroll,
                .testimonials-scroll {
                    -webkit-overflow-scrolling: touch;
                    overflow-scrolling: touch;
                }
            }
        }
        
        /* Animações suaves */
        .fade-in {
            animation: fadeInUp 0.5s ease-out forwards;
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
}

/* ================= CONFIGURAÇÕES GERAIS ================= */
document.addEventListener('DOMContentLoaded', function () {
    console.log('Site carregado com sucesso 🚀 - ITAPÊ AÇO');

    /* ================= MENU MOBILE ================= */
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileDropdown = document.getElementById('mobileDropdown');

    if (menuToggle && mobileDropdown) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation(); // Importante: evitar propagação
            const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
            menuToggle.setAttribute('aria-expanded', !isExpanded);
            mobileDropdown.classList.toggle('active');
            menuToggle.classList.toggle('open');
            
            // Atualiza o texto do botão para acessibilidade
            const label = isExpanded ? 'Abrir menu' : 'Fechar menu';
            menuToggle.setAttribute('aria-label', label);
        }, true); // Usar capture phase

        // Fechar menu ao clicar fora
        document.addEventListener('click', (event) => {
            if (mobileDropdown.classList.contains('active') && 
                !menuToggle.contains(event.target) && 
                !mobileDropdown.contains(event.target)) {
                menuToggle.setAttribute('aria-expanded', 'false');
                mobileDropdown.classList.remove('active');
                menuToggle.classList.remove('open');
                menuToggle.setAttribute('aria-label', 'Abrir menu');
            }
        }, true); // Usar capture phase

        // Fechar menu ao clicar em um link (usando delegation)
        mobileDropdown.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' || e.target.closest('a')) {
                menuToggle.setAttribute('aria-expanded', 'false');
                mobileDropdown.classList.remove('active');
                menuToggle.classList.remove('open');
                menuToggle.setAttribute('aria-label', 'Abrir menu');
            }
        }, true); // Usar capture phase
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
        }, true); // Usar capture phase

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

    // INICIALIZAR TODOS OS CARROSSÉIS COM SCROLL SUAVE
    // Esta linha deve vir APÓS todo o código acima, mas ainda dentro do DOMContentLoaded
    initAllCarousels();
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
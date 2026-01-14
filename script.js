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

    // Configurações iniciais para performance
    carousel.style.overflowX = 'hidden'; // Controlamos o scroll manualmente
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
            const delta = velocity * 16; // Multiplicador ajustado para suavidade
            
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

    // ================= TOUCH EVENTS OTIMIZADOS =================
    carousel.addEventListener('touchstart', (e) => {
        if (isInteracting) return;
        
        isInteracting = true;
        isScrolling = true;
        startX = e.touches[0].clientX;
        scrollLeft = carousel.scrollLeft;
        velocity = 0;
        lastX = startX;
        lastTime = performance.now();
        
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        
        // Suavizar a inicialização
        carousel.style.scrollBehavior = 'auto';
    }, { passive: true });

    carousel.addEventListener('touchmove', (e) => {
        if (!isScrolling) return;
        
        const touch = e.touches[0];
        const currentX = touch.clientX;
        const currentTime = performance.now();
        
        // Cálculo de movimento suave
        const deltaX = currentX - startX;
        const newScroll = scrollLeft - deltaX * 1.2; // Multiplicador ajustado
        
        // Limitar scroll com easing nas bordas
        const maxScroll = carousel.scrollWidth - carousel.clientWidth;
        let boundedScroll = newScroll;
        
        if (newScroll < 0) {
            // Resistência suave na borda esquerda
            boundedScroll = newScroll / 3;
        } else if (newScroll > maxScroll) {
            // Resistência suave na borda direita
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
        
        e.preventDefault();
    }, { passive: false });

    carousel.addEventListener('touchend', (e) => {
        if (!isScrolling) return;
        
        isScrolling = false;
        isInteracting = false;
        
        // Aplicar momentum se houver velocidade suficiente
        if (Math.abs(velocity) > 0.5) {
            applyMomentum();
        } else {
            // Snap suave
            setTimeout(() => {
                if (!isScrolling) {
                    snapToNearest();
                }
            }, 50);
        }
    }, { passive: true });

    // ================= MOUSE EVENTS PARA TESTES =================
    carousel.addEventListener('mousedown', (e) => {
        if (!isMobile || isInteracting) return;
        
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
        carousel.style.scrollBehavior = 'auto';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isScrolling || !isMobile) return;
        
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
        
        e.preventDefault();
    });

    document.addEventListener('mouseup', () => {
        if (!isScrolling || !isMobile) return;
        
        isScrolling = false;
        isInteracting = false;
        carousel.style.cursor = 'grab';
        
        if (Math.abs(velocity) > 0.5) {
            applyMomentum();
        } else {
            setTimeout(() => {
                if (!isScrolling) {
                    snapToNearest();
                }
            }, 50);
        }
    });

    // Adicionar indicador visual
    carousel.classList.add('smooth-scroll-enabled');

    // Snap inicial
    setTimeout(() => {
        snapToNearest();
    }, 200);
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
    }, 300);
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
            
            // Easing mais suave
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
    
    // Event Listeners
    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentIndex > 0) {
                smoothSlideTo(currentIndex - 1);
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentIndex < slides.length - 1) {
                smoothSlideTo(currentIndex + 1);
            }
        });
    }
    
    dots.forEach((dot, index) => {
        dot.addEventListener('click', (e) => {
            e.preventDefault();
            if (index !== currentIndex) {
                smoothSlideTo(index);
            }
        });
    });
    
    // Touch events para swipe suave
    track.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        track.style.transition = 'none';
    }, { passive: true });
    
    track.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentX = e.touches[0].clientX;
        const diff = startX - currentX;
        const slideWidth = getSlideWidth();
        const offset = (-currentIndex * slideWidth) + diff;
        
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        
        animationId = requestAnimationFrame(() => {
            track.style.transform = `translate3d(${offset}px, 0, 0)`;
        });
    }, { passive: true });
    
    track.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;
        
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
    }, { passive: true });
    
    // Inicializar
    updateIndicators();
    track.style.transform = `translate3d(0, 0, 0)`;
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

/* ================= MODIFIQUE O DOMContentLoaded PARA USAR A NOVA IMPLEMENTAÇÃO ================= */
document.addEventListener('DOMContentLoaded', function () {
    console.log('Site carregado com sucesso 🚀 - ITAPÊ AÇO');

    // ... (mantenha todo o código existente de menu, vídeos, etc) ...

    // REMOVA AS CHAMADAS ANTIGAS DE initCarouselSwipe
    // E ADICIONE ESTA NOVA CHAMADA:
    
    // Inicializar todos os carrosséis com scroll suave
    initAllCarousels();
    
    // ... (resto do código existente) ...
});
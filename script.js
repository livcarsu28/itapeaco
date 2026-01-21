/* =========================================================
   CARROSSEL SCROLL NATIVO LISO (MOBILE FIRST)
========================================================= */

function initNativeCarousel(carouselId, itemSelector) {
    const carousel =
        document.getElementById(carouselId) ||
        document.querySelector(`.${carouselId}`);

    if (!carousel) return;

    carousel.style.overflowX = 'auto';
    carousel.style.display = 'flex';
    carousel.style.gap = '16px';
    carousel.style.scrollSnapType = 'x mandatory';
    carousel.style.webkitOverflowScrolling = 'touch';
    carousel.style.scrollBehavior = 'smooth';
    carousel.style.touchAction = 'pan-x';

    carousel.classList.add('smooth-scroll-enabled');

    const items = carousel.querySelectorAll(itemSelector);
    items.forEach(item => {
        item.style.scrollSnapAlign = 'center';
        item.style.flex = '0 0 auto';
    });

    // Drag com mouse (desktop)
    let isDown = false;
    let startX;
    let scrollLeft;

    carousel.addEventListener('mousedown', e => {
        isDown = true;
        carousel.classList.add('dragging');
        startX = e.pageX - carousel.offsetLeft;
        scrollLeft = carousel.scrollLeft;
    });

    document.addEventListener('mouseup', () => {
        isDown = false;
        carousel.classList.remove('dragging');
    });

    document.addEventListener('mousemove', e => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - carousel.offsetLeft;
        const walk = (x - startX) * 1.2;
        carousel.scrollLeft = scrollLeft - walk;
    });
}

/* =========================================================
   CARROSSEL DE VANTAGENS (SCROLL NATIVO + BOTÕES)
========================================================= */

function initAdvantagesCarousel() {
    const carousel = document.querySelector('.advantages-carousel');
    if (!carousel) return;

    const track = carousel.querySelector('.carousel-track');
    const slides = carousel.querySelectorAll('.carousel-slide');
    const prevBtn = carousel.querySelector('.carousel-prev');
    const nextBtn = carousel.querySelector('.carousel-next');
    const dots = carousel.querySelectorAll('.carousel-dot');

    if (!track || slides.length === 0) return;

    track.style.display = 'flex';
    track.style.overflowX = 'auto';
    track.style.scrollSnapType = 'x mandatory';
    track.style.webkitOverflowScrolling = 'touch';
    track.style.scrollBehavior = 'smooth';
    track.style.touchAction = 'pan-x';

    slides.forEach(slide => {
        slide.style.scrollSnapAlign = 'center';
        slide.style.flex = '0 0 100%';
    });

    function updateDots() {
        const index = Math.round(track.scrollLeft / track.clientWidth);
        dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
    }

    track.addEventListener('scroll', updateDots);

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            track.scrollBy({ left: -track.clientWidth, behavior: 'smooth' });
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            track.scrollBy({ left: track.clientWidth, behavior: 'smooth' });
        });
    }

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            track.scrollTo({
                left: index * track.clientWidth,
                behavior: 'smooth'
            });
        });
    });
}

/* =========================================================
   INICIALIZAÇÃO GERAL
========================================================= */

function initAllCarousels() {
    const carousels = [
        { id: 'productsCarousel', selector: '.product-card' },
        { id: 'galleryCarousel', selector: '.gallery-item' },
        { id: 'videos-scroll', selector: '.video-story' },
        { id: 'testimonials-scroll', selector: '.testimonial-card' }
    ];

    carousels.forEach(c =>
        initNativeCarousel(c.id, c.selector)
    );

    initAdvantagesCarousel();
}

/* =========================================================
   MENU MOBILE
========================================================= */

document.addEventListener('DOMContentLoaded', () => {

    const menuToggle = document.querySelector('.menu-toggle');
    const mobileDropdown = document.getElementById('mobileDropdown');

    if (menuToggle && mobileDropdown) {
        menuToggle.addEventListener('click', e => {
            e.stopPropagation();
            menuToggle.classList.toggle('open');
            mobileDropdown.classList.toggle('active');
        });

        document.addEventListener('click', e => {
            if (!menuToggle.contains(e.target) && !mobileDropdown.contains(e.target)) {
                mobileDropdown.classList.remove('active');
                menuToggle.classList.remove('open');
            }
        });
    }

    /* HEADER SCROLL */
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    });

    /* BACK TO TOP */
    const backToTop = document.createElement('button');
    backToTop.className = 'back-to-top';
    backToTop.innerHTML = '↑';
    document.body.appendChild(backToTop);

    window.addEventListener('scroll', () => {
        backToTop.classList.toggle('visible', window.scrollY > 500);
    });

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    /* LAZY LOAD */
    const imgObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                imgObserver.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img =>
        imgObserver.observe(img)
    );

    /* INICIALIZAR */
    initAllCarousels();
});

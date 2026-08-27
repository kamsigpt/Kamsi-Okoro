'use strict';

/* ═══════════════════════════════════════════════════════
   KAMSI OKORO — Interactions
   ═══════════════════════════════════════════════════════ */

/* -- TOUCH DEVICE CHECK -- */
(function initTouchSupport() {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        document.body.classList.add('touch-device');
    }
})();

/* -- FADE UP / REVEAL ON SCROLL -- */
(function initScrollReveal() {
    const els = document.querySelectorAll('.fade-up, .reveal');
    if (!els.length) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
        els.forEach(el => el.classList.add('active'));
        return;
    }

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                if (entry.target.classList.contains('reveal')) entry.target.classList.add('in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    els.forEach(el => observer.observe(el));
})();

/* -- MOBILE MENU TOGGLE -- */
(function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger-btn');
    const menu = document.querySelector('.mobile-menu');
    const body = document.body;
    if (!hamburger || !menu) return;

    function open() {
        body.classList.add('sidebar-open');
        body.style.overflow = 'hidden';
    }
    function close() {
        body.classList.remove('sidebar-open');
        body.style.overflow = '';
    }

    hamburger.addEventListener('click', () => {
        body.classList.contains('sidebar-open') ? close() : open();
    });

    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', close));

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && body.classList.contains('sidebar-open')) close();
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 900 && body.classList.contains('sidebar-open')) close();
    });
})();

/* -- THEME TOGGLE -- */
(function initThemeToggle() {
    const tracks = document.querySelectorAll('.toggle-track');
    if (!tracks.length) return;

    const themes = ['light', 'dark'];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const savedStep = Number.parseInt(localStorage.getItem('themeStep') || '0', 10);
    let step = Number.isFinite(savedStep) ? Math.abs(savedStep) % themes.length : 0;
    let animating = false;

    function setTrackState(activeStep) {
        tracks.forEach(track => {
            track.dataset.step = activeStep;
            track.setAttribute('aria-pressed', String(activeStep === 1));
        });
    }

    function applyTheme(nextStep = step) {
        const safeStep = ((nextStep % themes.length) + themes.length) % themes.length;
        const nextTheme = themes[safeStep];
        if (nextTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        setTrackState(safeStep);
    }

    function toggleTheme(event) {
        if (animating) return;
        animating = true;
        const nextStep = (step + 1) % themes.length;

        if (!reducedMotion && typeof document.startViewTransition === 'function') {
            const transition = document.startViewTransition(() => {
                applyTheme(nextStep);
            });
            transition.finished.finally(() => { animating = false; });
        } else {
            applyTheme(nextStep);
            animating = false;
        }
        step = nextStep;
        localStorage.setItem('themeStep', String(step));
    }

    tracks.forEach(track => {
        track.addEventListener('click', toggleTheme);
        track.setAttribute('role', 'button');
        track.setAttribute('tabindex', '0');
        track.setAttribute('aria-label', 'Toggle theme');
        track.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleTheme();
            }
        });
    });

    applyTheme(step);
})();

/* -- ACTIVE NAV (redundant with HTML, kept harmless) -- */
(function initActiveNav() {
    const current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href && current === href) link.classList.add('active');
    });
})();

/* -- WORK PREV / NEXT (scroll between projects) -- */
(function initWorkNav() {
    const stage = document.querySelector('[data-works-stage]');
    if (!stage) return;
    const items = stage.querySelectorAll('[data-works-item]');
    if (!items.length) return;

    const itemsArray = Array.from(items);
    let currentIndex = 0;

    function currentTop(item) {
        const rect = item.getBoundingClientRect();
        return rect.top + window.pageYOffset;
    }

    function goTo(index) {
        if (index < 0 || index >= items.length) return;
        currentIndex = index;
        const top = currentTop(items[index]) - 60;
        window.scrollTo({ top, behavior: 'smooth' });
    }

    // Track which item is most visible to set currentIndex
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.4) {
                currentIndex = itemsArray.indexOf(entry.target);
            }
        });
    }, { threshold: [0.4, 0.6] });
    items.forEach(item => observer.observe(item));

    document.addEventListener('click', e => {
        if (e.target.closest('[data-works-next]')) {
            goTo((currentIndex + 1) % items.length);
        } else if (e.target.closest('[data-works-prev]')) {
            goTo((currentIndex - 1 + items.length) % items.length);
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', e => {
        const inWorksPage = document.body.classList.contains('works-page');
        if (!inWorksPage) return;
        if (e.key === 'ArrowRight') { e.preventDefault(); goTo((currentIndex + 1) % items.length); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); goTo((currentIndex - 1 + items.length) % items.length); }
    });
})();

/* -- PHONE CONTACT LINK (copy on desktop, call preview) -- */
(function initPhoneContactLink() {
    const phoneLinks = document.querySelectorAll('.phone-contact-link');
    if (!phoneLinks.length) return;

    const fallbackPhone = '+2349032736331';
    const isPhoneDevice = /Android.+Mobile|iPhone|iPod|Windows Phone|BlackBerry|Opera Mini|IEMobile/i.test(navigator.userAgent || '');

    async function copyPhoneNumber(number) {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(number);
            return true;
        }
        const input = document.createElement('input');
        input.value = number;
        input.setAttribute('readonly', '');
        input.style.cssText = 'position:absolute;left:-9999px;top:0';
        document.body.appendChild(input);
        input.select();
        input.setSelectionRange(0, input.value.length);
        let copied = false;
        try { copied = document.execCommand('copy'); } catch (_) { copied = false; }
        input.remove();
        return copied;
    }

    function flashTitle(link, text) {
        const original = link.getAttribute('title') || 'Phone';
        link.setAttribute('title', text);
        window.setTimeout(() => link.setAttribute('title', original), 1400);
    }

    phoneLinks.forEach(link => {
        const phoneNumber = (link.dataset.phone || '').trim() || fallbackPhone;
        link.setAttribute('href', `tel:${phoneNumber}`);
        link.addEventListener('click', async event => {
            if (isPhoneDevice) return;
            event.preventDefault();
            const copied = await copyPhoneNumber(phoneNumber);
            flashTitle(link, copied ? 'Copied!' : 'Copy failed');
        });
    });
})();

/* -- EMAIL CONTACT LINK (copy on desktop) -- */
(function initEmailContactLink() {
    const emailLinks = document.querySelectorAll('.email-contact-link');
    if (!emailLinks.length) return;

    const fallbackEmail = 'theofficialkamsiokoro@gmail.com';
    const isPhoneDevice = /Android.+Mobile|iPhone|iPod|Windows Phone|BlackBerry|Opera Mini|IEMobile/i.test(navigator.userAgent || '');

    async function copyEmailAddress(email) {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(email);
            return true;
        }
        const input = document.createElement('input');
        input.value = email;
        input.setAttribute('readonly', '');
        input.style.cssText = 'position:absolute;left:-9999px;top:0';
        document.body.appendChild(input);
        input.select();
        input.setSelectionRange(0, input.value.length);
        let copied = false;
        try { copied = document.execCommand('copy'); } catch (_) { copied = false; }
        input.remove();
        return copied;
    }

    function flashTitle(link, text) {
        const original = link.getAttribute('title') || 'Email';
        link.setAttribute('title', text);
        window.setTimeout(() => link.setAttribute('title', original), 1400);
    }

    emailLinks.forEach(link => {
        const emailAddress = (link.dataset.email || '').trim() || fallbackEmail;
        link.setAttribute('href', `mailto:${emailAddress}`);
        link.addEventListener('click', async event => {
            if (isPhoneDevice) return;
            event.preventDefault();
            const copied = await copyEmailAddress(emailAddress);
            flashTitle(link, copied ? 'Copied!' : 'Copy failed');
        });
    });
})();

/* -- CV DOWNLOAD LINK -- */
(function initCvDownloadLink() {
    const cvLinks = document.querySelectorAll('.cv-download-link');
    if (!cvLinks.length) return;

    const fallbackSrc = 'assets/Nedokoro_Kamsiyochi_%E2%80%94_Product_Designer_Portfolio.pdf';
    const fallbackName = 'Kamsi_Okoro_CV.pdf';

    function flashTitle(link, text) {
        const original = link.getAttribute('title') || 'Download CV';
        link.setAttribute('title', text);
        window.setTimeout(() => link.setAttribute('title', original), 1400);
    }

    cvLinks.forEach(link => {
        const cvSrc = (link.dataset.cvSrc || '').trim() || fallbackSrc;
        const downloadName = (link.dataset.downloadName || '').trim() || fallbackName;
        link.setAttribute('href', cvSrc);
        link.setAttribute('download', downloadName);
        link.addEventListener('click', () => flashTitle(link, 'Downloading...'));
    });
})();

/* -- CERT PREVIEW OPEN -- */
(function initCertificatePreviewOpen() {
    const certificateCards = document.querySelectorAll('.cert-card[data-cert-src]');
    if (!certificateCards.length) return;

    certificateCards.forEach(card => {
        const preview = card.querySelector('.cert-card-media');
        const certSrc = (card.dataset.certSrc || '').trim();
        if (!preview || !certSrc) return;

        const titleText = card.querySelector('h2')?.textContent?.trim();
        preview.setAttribute('role', 'button');
        preview.setAttribute('tabindex', '0');
        preview.setAttribute('aria-label', titleText ? `Open ${titleText} in a new tab` : 'Open certificate in a new tab');

        const openCertificate = () => window.open(certSrc, '_blank', 'noopener,noreferrer');
        preview.addEventListener('click', openCertificate);
        preview.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openCertificate();
            }
        });
    });
})();

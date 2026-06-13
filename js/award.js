/* ============================================================
   award.js — shared Awwwards-grade motion engine for A / B / C
   ------------------------------------------------------------
   Lenis（スムーススクロール）+ GSAP / ScrollTrigger。基本UI
   （ヘッダー／ナビ／スライドインCTA／フォーム）は main.js から
   移植し本ファイルで一括管理（reveal を GSAP が制御するため
   main.js は読み込まない）。3ページ共通セレクタを対象にし、
   ページ差（Aは背景がsection直付け／BはSVG図／Cは図がPNG 等）は
   特徴検出で吸収する。

   堅牢性: GSAP未読込・reduced-motion時は html.anim を外して全表示。
   起動成功で window.__amBoot=true（インラインwatchdog解除）。
   ============================================================ */
(function () {
    'use strict';

    var docEl = document.documentElement;
    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ============================================================
       A. 基本UI（main.js から移植）— モーション有無に依らず動作
       ============================================================ */
    var header = document.getElementById('siteHeader');
    function updateHeader() {
        if (!header) return;
        if (window.scrollY > 24) header.classList.add('is-scrolled');
        else header.classList.remove('is-scrolled');
    }
    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();

    var navToggle = document.getElementById('navToggle');
    var globalNav = document.getElementById('globalNav');
    if (navToggle && globalNav) {
        navToggle.addEventListener('click', function () {
            var isOpen = header.classList.toggle('nav-open');
            navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            navToggle.setAttribute('aria-label', isOpen ? 'メニューを閉じる' : 'メニューを開く');
        });
        globalNav.addEventListener('click', function (e) {
            if (e.target.closest('a')) {
                header.classList.remove('nav-open');
                navToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    var slidein = document.getElementById('slideinCta');
    var slideinClose = document.getElementById('slideinClose');
    if (slidein) {
        var SLIDEIN_KEY = 'hiccvi_slidein_dismissed';
        var slideinShown = false;
        var showSlidein = function () {
            if (slideinShown) return;
            try { if (sessionStorage.getItem(SLIDEIN_KEY)) return; } catch (e) {}
            slideinShown = true;
            slidein.classList.add('is-shown');
        };
        var hideSlidein = function () {
            slidein.classList.remove('is-shown');
            try { sessionStorage.setItem(SLIDEIN_KEY, '1'); } catch (e) {}
        };
        var slideinTimer = setTimeout(showSlidein, 60000);
        var checkDepth = function () {
            var s = document.documentElement.scrollHeight - window.innerHeight;
            if (s <= 0) return;
            if (window.scrollY / s >= 0.8) { showSlidein(); window.removeEventListener('scroll', checkDepth); }
        };
        window.addEventListener('scroll', checkDepth, { passive: true });
        if (slideinClose) slideinClose.addEventListener('click', function () { clearTimeout(slideinTimer); hideSlidein(); });
        var sBtn = slidein.querySelector('.btn-slidein');
        if (sBtn) sBtn.addEventListener('click', function () { clearTimeout(slideinTimer); hideSlidein(); });
    }

    var form = document.getElementById('contactForm');
    var formMessage = document.getElementById('formMessage');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var valid = true;
            form.querySelectorAll('[required]').forEach(function (field) {
                if (!field.value.trim()) { valid = false; field.style.borderColor = '#003366'; field.style.borderWidth = '2px'; }
                else { field.style.borderColor = ''; field.style.borderWidth = ''; }
            });
            if (!valid) return;
            form.querySelectorAll('input, select, textarea').forEach(function (f) { f.value = ''; });
            if (formMessage) {
                formMessage.hidden = false;
                formMessage.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'nearest' });
            }
        });
    }

    /* ============================================================
       B. モーション層 — GSAP無し／reduced-motion なら全表示で終了
       ============================================================ */
    var hasGSAP = !!(window.gsap && window.ScrollTrigger);
    if (prefersReduced || !hasGSAP) {
        docEl.classList.remove('anim');
        window.__amBoot = true;
        return;
    }
    window.__amBoot = true;
    var gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);
    var toArr = gsap.utils.toArray;

    /* --- Lenis スムーススクロール --- */
    var lenis = null;
    if (window.Lenis) {
        lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 0.9 });
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
        gsap.ticker.lagSmoothing(0);
        var headerH = 76;
        document.querySelectorAll('a[href^="#"]').forEach(function (a) {
            var id = a.getAttribute('href');
            if (!id || id === '#' || id.length < 2) return;
            a.addEventListener('click', function (e) {
                var target = document.querySelector(id);
                if (!target) return;
                e.preventDefault();
                lenis.scrollTo(target, { offset: -headerH, duration: 1.1 });
            });
        });
    }

    /* ------------------------------------------------------------
       1. ヒーロー：ロード時のシネマティックな立ち上がり
    ------------------------------------------------------------ */
    function playHero() {
        var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        // 背景：B/Cは .hero-media をスケール、Aは section背景をパララックス
        if (document.querySelector('.hero-media')) {
            tl.to('.hero-media', { scale: 1, duration: 1.9, ease: 'power2.out' }, 0);
            gsap.to('.hero-media', { yPercent: 16, ease: 'none',
                scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
        } else if (document.querySelector('.hero')) {
            gsap.to('.hero', { backgroundPositionY: '64%', ease: 'none',
                scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
        }
        tl.to('.hero-eyebrow, .hero-org', { opacity: 1, y: 0, duration: 0.8 }, 0.25)
          .fromTo('.hero-title', { clipPath: 'inset(0 0 100% 0)', y: 18 },
                  { clipPath: 'inset(0 0 0% 0)', opacity: 1, y: 0, duration: 1.1 }, 0.4)
          .to('.hero-lead', { opacity: 1, y: 0, duration: 0.9 }, 0.72)
          .to('.hero-actions', { opacity: 1, y: 0, duration: 0.8 }, 0.86);
    }

    /* ------------------------------------------------------------
       2. セクションの段階的リビール（ヒーロー以外の .reveal）
    ------------------------------------------------------------ */
    function setupReveals() {
        var els = toArr('.reveal').filter(function (el) { return !el.closest('.hero'); });
        ScrollTrigger.batch(els, {
            start: 'top 88%',
            onEnter: function (batch) {
                gsap.to(batch, { opacity: 1, y: 0, duration: 0.95, ease: 'power3.out', stagger: 0.1, overwrite: true });
            }
        });
        // 初期Y（gateはopacityのみなのでYをここで付与）
        gsap.set(els, { y: 28 });
    }

    /* ------------------------------------------------------------
       3. ゴースト英字ラベルのパララックス（雑誌的レイヤー感）
    ------------------------------------------------------------ */
    function setupGhostParallax() {
        toArr('.section-eyebrow, .sec-eyebrow').forEach(function (g) {
            var head = g.closest('.section-head, .sec-head') || g.parentNode;
            gsap.fromTo(g, { yPercent: 14 }, {
                yPercent: -14, ease: 'none',
                scrollTrigger: { trigger: head, start: 'top bottom', end: 'bottom top', scrub: true }
            });
        });
    }

    /* ------------------------------------------------------------
       4. 数字カウントアップ（年号 1900–2100 は演出せず表示のみ）
    ------------------------------------------------------------ */
    function setupCounters() {
        toArr('.stat-number').forEach(function (el) {
            var node = el.firstChild;
            if (!node || node.nodeType !== 3) return;
            var target = parseInt(node.nodeValue.replace(/[^0-9]/g, ''), 10);
            if (!target || (target >= 1900 && target <= 2100)) return; // 年号はスキップ
            var obj = { v: 0 };
            ScrollTrigger.create({
                trigger: el, start: 'top 92%', once: true,
                onEnter: function () {
                    gsap.to(obj, { v: target, duration: 1.6, ease: 'power2.out',
                        onUpdate: function () { node.nodeValue = Math.round(obj.v); } });
                }
            });
        });
    }

    /* ------------------------------------------------------------
       5. SVGダイアグラムの線描き（Bのみ存在）
    ------------------------------------------------------------ */
    function drawLines(lineSel, nodeSel, container, opts) {
        var lines = toArr(lineSel);
        if (!lines.length) return;
        lines.forEach(function (ln) {
            var len; try { len = ln.getTotalLength(); } catch (e) { len = 1200; }
            ln.style.strokeDasharray = len; ln.style.strokeDashoffset = len;
        });
        var nodes = nodeSel ? toArr(nodeSel) : [];
        ScrollTrigger.create({
            trigger: container, start: 'top 75%', once: true,
            onEnter: function () {
                var tl = gsap.timeline();
                tl.to(lines, { opacity: 1, duration: 0.01 }, 0)
                  .to(lines, { strokeDashoffset: 0, duration: opts.draw || 0.9, ease: 'power2.inOut', stagger: opts.stagger || 0.1 }, 0);
                if (nodes.length) tl.to(nodes, { opacity: 1, duration: 0.6, ease: 'power2.out', stagger: 0.05 }, opts.nodesAt != null ? opts.nodesAt : 0.3);
            }
        });
    }
    function setupDiagrams() {
        var gov = document.querySelector('#government .gov-diagram');
        if (gov) {
            gsap.set('#government .gov-hub', { opacity: 0 });
            drawLines('#government .gov-lines line', '#government .gov-node, #government .gov-hub', gov, { draw: 1.0, stagger: 0.09, nodesAt: 0.5 });
        }
        var rel = document.querySelector('#relation .relation-diagram');
        if (rel) drawLines('#relation .rel-arrows line', '#relation .rel-node, #relation .rel-labels text, #relation .rel-caption', rel, { draw: 0.7, stagger: 0.22, nodesAt: 0.2 });
    }

    /* ------------------------------------------------------------
       6. マグネティックボタン（細やか／粗ポインタでは無効）
    ------------------------------------------------------------ */
    function setupMagnetic() {
        if (window.matchMedia('(pointer: coarse)').matches) return;
        document.querySelectorAll('.btn').forEach(function (btn) {
            var strength = 0.26, max = 8;
            btn.addEventListener('mousemove', function (e) {
                var r = btn.getBoundingClientRect();
                var dx = Math.max(-max, Math.min(max, (e.clientX - (r.left + r.width / 2)) * strength));
                var dy = Math.max(-max, Math.min(max, (e.clientY - (r.top + r.height / 2)) * strength));
                gsap.to(btn, { x: dx, y: dy, duration: 0.4, ease: 'power3.out' });
            });
            btn.addEventListener('mouseleave', function () {
                gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
            });
        });
    }

    /* ------------------------------------------------------------
       7. スクロール進捗バー
    ------------------------------------------------------------ */
    function setupProgress() {
        var bar = document.createElement('div');
        bar.className = 'scroll-progress';
        document.body.appendChild(bar);
        gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });
    }

    /* ------------------------------------------------------------
       起動
    ------------------------------------------------------------ */
    function boot() {
        playHero();
        setupReveals();
        setupGhostParallax();
        setupCounters();
        setupDiagrams();
        setupMagnetic();
        setupProgress();
        ScrollTrigger.refresh();
    }
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
            boot();
            window.addEventListener('load', function () { ScrollTrigger.refresh(); });
        });
    } else {
        window.addEventListener('load', boot);
    }
})();

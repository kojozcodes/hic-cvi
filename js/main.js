/* ============================================================
   HIC/CVI Japan Desk — Landing Page Scripts
   方針: アニメーションは最小限（フェード／スライドイン／軽微なホバー）
   ============================================================ */

(function () {
    'use strict';

    // JSが動作する環境でのみ .reveal の初期非表示を有効化する
    // （JS無効・読み込み失敗時もコンテンツが見えるようにするため）
    document.documentElement.classList.add('js');

    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ------------------------------------------------------------
       1. Header: スクロールで白背景に切り替え
    ------------------------------------------------------------ */
    var header = document.getElementById('siteHeader');

    function updateHeader() {
        if (window.scrollY > 24) {
            header.classList.add('is-scrolled');
        } else {
            header.classList.remove('is-scrolled');
        }
    }
    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();

    /* ------------------------------------------------------------
       2. Mobile navigation
    ------------------------------------------------------------ */
    var navToggle = document.getElementById('navToggle');
    var globalNav = document.getElementById('globalNav');

    navToggle.addEventListener('click', function () {
        var isOpen = header.classList.toggle('nav-open');
        navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        navToggle.setAttribute('aria-label', isOpen ? 'メニューを閉じる' : 'メニューを開く');
    });

    // ナビ内リンクをタップしたら閉じる
    globalNav.addEventListener('click', function (e) {
        if (e.target.closest('a')) {
            header.classList.remove('nav-open');
            navToggle.setAttribute('aria-expanded', 'false');
        }
    });

    /* ------------------------------------------------------------
       3. Reveal: 控えめなフェードイン（IntersectionObserver）
    ------------------------------------------------------------ */
    var revealEls = document.querySelectorAll('.reveal');

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    } else {
        var revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

        revealEls.forEach(function (el) { revealObserver.observe(el); });
    }

    /* ------------------------------------------------------------
       4. Slide-in CTA
          発火条件: 60秒滞在 または 80%スクロール（遅め・控えめ）
          一度閉じたらセッション中は再表示しない
    ------------------------------------------------------------ */
    var slidein = document.getElementById('slideinCta');
    var slideinClose = document.getElementById('slideinClose');
    var SLIDEIN_KEY = 'hiccvi_slidein_dismissed';
    var slideinShown = false;

    function showSlidein() {
        if (slideinShown) return;
        try {
            if (sessionStorage.getItem(SLIDEIN_KEY)) return;
        } catch (e) { /* storage無効環境では常に表示可 */ }
        slideinShown = true;
        // 非表示状態はCSSの visibility:hidden が支配するため
        // aria-hidden の付け外しは不要（フォーカス中の要素を隠す事故も防ぐ）
        slidein.classList.add('is-shown');
    }

    function hideSlidein() {
        slidein.classList.remove('is-shown');
        try {
            sessionStorage.setItem(SLIDEIN_KEY, '1');
        } catch (e) { /* noop */ }
    }

    // 60秒滞在で発火
    var slideinTimer = setTimeout(showSlidein, 60000);

    // 80%スクロールで発火
    function checkScrollDepth() {
        var scrollable = document.documentElement.scrollHeight - window.innerHeight;
        if (scrollable <= 0) return;
        if (window.scrollY / scrollable >= 0.8) {
            showSlidein();
            window.removeEventListener('scroll', checkScrollDepth);
        }
    }
    window.addEventListener('scroll', checkScrollDepth, { passive: true });

    slideinClose.addEventListener('click', function () {
        clearTimeout(slideinTimer);
        hideSlidein();
    });

    // CTA内のContactリンクを押した場合も閉じる
    slidein.querySelector('.btn-slidein').addEventListener('click', function () {
        clearTimeout(slideinTimer);
        hideSlidein();
    });

    /* ------------------------------------------------------------
       5. Contact form
          ※HubSpot実装時はHubSpotフォームに差し替えるため、
            ここでは送信を抑止し、自動返信メールと同等の文言を表示する
    ------------------------------------------------------------ */
    var form = document.getElementById('contactForm');
    var formMessage = document.getElementById('formMessage');

    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            // 簡易バリデーション（required項目のチェック）
            // ※カラーパレット規定（赤NG）のため、未入力はネイビーの強調枠で示す
            var valid = true;
            form.querySelectorAll('[required]').forEach(function (field) {
                if (!field.value.trim()) {
                    valid = false;
                    field.style.borderColor = '#003366';
                    field.style.borderWidth = '2px';
                } else {
                    field.style.borderColor = '';
                    field.style.borderWidth = '';
                }
            });
            if (!valid) return;

            // HubSpotフォーム接続までの仮動作:
            // 入力内容をリセットし、受付メッセージを表示する
            form.querySelectorAll('input, select, textarea').forEach(function (field) {
                field.value = '';
            });
            formMessage.hidden = false;
            formMessage.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'nearest' });
        });
    }
})();

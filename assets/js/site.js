/* Welle Fotografien — 공통 스크립트 */
(function () {
  /* 헤더: 스크롤하면 작아짐 */
  var header = document.querySelector('.site-header');
  if (header) {
    var root = document.documentElement;
    var scrolled = false, ticking = false;

    // 펼쳐진 상태의 헤더 높이를 재서 그만큼 자리를 확보
    var measure = function () {
      var was = header.classList.contains('is-scrolled');
      header.style.transition = 'none';
      header.querySelectorAll('*').forEach(function (el) { el.style.transition = 'none'; });
      header.classList.remove('is-scrolled');
      root.style.setProperty('--header-h', header.offsetHeight + 'px');
      if (was) header.classList.add('is-scrolled');
      void header.offsetHeight;
      header.style.transition = '';
      header.querySelectorAll('*').forEach(function (el) { el.style.transition = ''; });
    };

    // 줄어드는 기준(80px)과 다시 커지는 기준(20px)을 다르게 해서 경계에서 깜빡이지 않게
    var update = function () {
      ticking = false;
      var y = window.scrollY;
      if (document.body.classList.contains('is-immersed')) y = 0;
      if (!scrolled && y > 80) { scrolled = true; header.classList.add('is-scrolled'); }
      else if (scrolled && y < 20) { scrolled = false; header.classList.remove('is-scrolled'); }
    };
    var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };

    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
  }

  /* 이미지가 로드되면 부드럽게 나타나기 */
  document.querySelectorAll('.masonry img').forEach(function (img) {
    if (img.complete && img.naturalWidth) img.classList.add('is-loaded');
    else img.addEventListener('load', function () { img.classList.add('is-loaded'); });
  });

  /* 홈 슬라이드 + 첫 화면 몰입 모드 */
  var hero = document.querySelector('.hero');
  if (hero) {
    var slides = hero.querySelectorAll('.hero__slide');
    var dotsWrap = hero.querySelector('.hero__dots');
    var cur = 0, timer = null;
    slides.forEach(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', (i + 1) + '번째 사진');
      b.addEventListener('click', function () { show(i); restart(); });
      dotsWrap.appendChild(b);
    });
    var dots = dotsWrap.querySelectorAll('button');
    function load(img) { if (img && img.dataset.src) { img.src = img.dataset.src; img.removeAttribute('data-src'); } }
    function show(i) {
      slides[cur].classList.remove('is-active'); dots[cur].classList.remove('is-active');
      cur = (i + slides.length) % slides.length;
      load(slides[cur].querySelector('img'));
      slides[cur].classList.add('is-active'); dots[cur].classList.add('is-active');
      load(slides[(cur + 1) % slides.length].querySelector('img'));   // 다음 장 미리
    }
    function restart() { clearInterval(timer); timer = setInterval(function () { show(cur + 1); }, 5000); }
    show(0);

    // 인트로가 덮고 있는 동안에는 넘기지 않음 → 인트로가 걷히면 1번 사진부터 시작
    // (인트로 스크립트가 이 파일 뒤에 실행되므로, 문서가 다 읽힌 뒤에 확인)
    function startSlides() {
      if (window.__inkIntroActive) window.addEventListener('inkintro:done', restart, { once: true });
      else restart();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startSlides);
    else startSlides();

    // 좌우 스와이프로 사진 넘기기
    var sx = null, sy = null;
    hero.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    hero.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { show(cur + (dx < 0 ? 1 : -1)); restart(); }
      sx = null;
    });

    if (document.body.classList.contains('home')) immersive();
  }

  function immersive() {
    var body = document.body, root = document.documentElement;
    var wave = hero.querySelector('.hero__wave'), wavePath = wave && wave.querySelector('path');
    var DUR = 1300, busy = false, lastToggle = 0;
    var immersed = window.scrollY < 5;

    function headerH() { return parseFloat(getComputedStyle(root).getPropertyValue('--header-h')) || 190; }
    function sizeHero() {
      var w = root.clientWidth, h = w * 2 / 3;
      if (window.innerWidth > 760) h = Math.min(h, window.innerHeight - headerH() + 40);
      root.style.setProperty('--hero-h', Math.round(h) + 'px');
    }
    sizeHero();
    window.addEventListener('resize', sizeHero);
    window.addEventListener('load', sizeHero);
    // 처음 자리 잡을 때는 움직이지 않게 (애니메이션은 그 다음부터)
    hero.style.transition = 'none';
    body.classList.add('js-hero');

    function lock(on) { root.style.overflow = on ? 'hidden' : ''; }
    if (immersed) { body.classList.add('is-immersed'); lock(true); }
    void hero.offsetHeight;
    requestAnimationFrame(function () { requestAnimationFrame(function () { hero.style.transition = ''; }); });
    // 인트로가 끝나며 스크롤을 풀어도, 몰입 화면이면 다시 잠금
    window.addEventListener('inkintro:done', function () { if (immersed) lock(true); });

    // 사진 윗부분이 물결처럼 출렁이며 걷히는 효과
    function animateWave() {
      if (!wavePath) return;
      var t0 = performance.now();
      (function step(now) {
        var t = Math.min((now - t0) / DUR, 1);
        var W = wave.clientWidth || 1000, H = 90;
        var amp = Math.sin(Math.PI * t) * (W < 700 ? 26 : 42);
        var ph = t * 7;
        var d = 'M0,0 H' + W + ' ';
        for (var x = W; x >= 0; x -= W / 48) {
          var y = amp * (0.55 + 0.3 * Math.sin(x / W * Math.PI * 3.2 + ph) + 0.15 * Math.sin(x / W * Math.PI * 7.4 - ph * 1.7));
          d += 'L' + x.toFixed(1) + ',' + Math.max(0, y).toFixed(1) + ' ';
        }
        wave.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
        wavePath.setAttribute('d', d + 'Z');
        if (t < 1) requestAnimationFrame(step); else wavePath.setAttribute('d', '');
      })(t0);
    }

    function split() {           // 몰입 → 일반 레이아웃
      if (!immersed || busy) return;
      immersed = false; busy = true; lastToggle = Date.now();
      body.classList.remove('is-immersed');
      animateWave();
      setTimeout(function () { busy = false; lock(false); }, DUR);
    }
    function immerse() {         // 맨 위에서 다시 위로 올리면 사진이 다시 차오름
      if (immersed || busy || window.scrollY > 0) return;
      immersed = true; busy = true; lastToggle = Date.now();
      lock(true);
      body.classList.add('is-immersed');
      animateWave();
      setTimeout(function () { busy = false; }, DUR);
    }

    function blocked() { return window.__inkIntroActive || busy; }
    window.addEventListener('wheel', function (e) {
      if (blocked()) return;
      if (immersed && e.deltaY > 6) split();
      else if (!immersed && e.deltaY < -6 && window.scrollY <= 0 && Date.now() - lastToggle > 700) immerse();
    }, { passive: true });
    window.addEventListener('keydown', function (e) {
      if (blocked()) return;
      var k = e.key;
      if (immersed && /^(ArrowDown|PageDown| |Spacebar|End)$/.test(k)) split();
      else if (!immersed && /^(ArrowUp|PageUp|Home)$/.test(k) && window.scrollY <= 0) immerse();
    });
    var ty = null;
    window.addEventListener('touchstart', function (e) { ty = e.touches[0].clientY; }, { passive: true });
    window.addEventListener('touchmove', function (e) {
      if (ty === null) return;
      var dy = e.touches[0].clientY - ty;
      if (immersed) {
        if (e.cancelable) e.preventDefault();          // 몰입 화면에서는 페이지가 끌려 올라가지 않게
        if (!blocked() && dy < -40) { split(); ty = null; }
      } else if (!blocked() && dy > 70 && window.scrollY <= 0 && Date.now() - lastToggle > 700) { immerse(); ty = null; }
    }, { passive: false });
    window.addEventListener('touchend', function () { ty = null; }, { passive: true });

    // 화면 아래 '스크롤' 안내
    var cue = hero.querySelector('.hero__cue');
    if (cue) cue.addEventListener('click', split);
  }

  /* 라이트박스 */
  var links = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox]'));
  if (links.length) {
    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.innerHTML =
      '<button class="lightbox__close" type="button" aria-label="닫기">✕</button>' +
      '<button class="lightbox__prev" type="button" aria-label="이전">‹</button>' +
      '<img alt="">' +
      '<button class="lightbox__next" type="button" aria-label="다음">›</button>' +
      '<div class="lightbox__count"></div>';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector('img'), lbCount = lb.querySelector('.lightbox__count'), idx = 0;
    function open(i) {
      idx = (i + links.length) % links.length;
      lbImg.src = links[idx].getAttribute('href');
      lbCount.textContent = (idx + 1) + ' / ' + links.length;
      lb.classList.add('is-open');
      document.documentElement.style.overflow = 'hidden';
      var pre = new Image(); pre.referrerPolicy = 'no-referrer';
      pre.src = links[(idx + 1) % links.length].getAttribute('href');
    }
    function close() { lb.classList.remove('is-open'); document.documentElement.style.overflow = ''; }
    links.forEach(function (a, i) { a.addEventListener('click', function (e) { e.preventDefault(); open(i); }); });
    lb.querySelector('.lightbox__close').addEventListener('click', close);
    lb.querySelector('.lightbox__prev').addEventListener('click', function () { open(idx - 1); });
    lb.querySelector('.lightbox__next').addEventListener('click', function () { open(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') open(idx - 1);
      if (e.key === 'ArrowRight') open(idx + 1);
    });
    var tx = null;
    lb.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (tx === null) return;
      var dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 40) open(idx + (dx < 0 ? 1 : -1));
      tx = null;
    });
  }

  /* 예약 폼 (미리보기용 더미) */
  var form = document.querySelector('#contract-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var t = document.querySelector('.toast');
      t.textContent = '미리보기용 화면이라 실제로 접수되지는 않아요.';
      t.classList.add('is-show');
      setTimeout(function () { t.classList.remove('is-show'); }, 2800);
    });
  }
})();

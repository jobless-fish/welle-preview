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
      var home = document.body.classList.contains('home');
      var full = parseFloat(getComputedStyle(root).getPropertyValue('--header-h')) || 190;
      var down = home ? full * 2 + 60 : 80, up = home ? full * 2 + 10 : 20;   // 홈은 물결이 다 덮인 뒤부터 줄어듦
      if (!scrolled && y > down) { scrolled = true; header.classList.add('is-scrolled'); }
      else if (scrolled && y < up) { scrolled = false; header.classList.remove('is-scrolled'); }
    };
    var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };

    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
  }

  /* 자체 스크롤바 — 화면 폭을 차지하지 않고 위에 얇게 떠 있음 (마우스 기기만) */
  (function () {
    if (!window.matchMedia || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var root = document.documentElement, body = document.body;
    var bar = document.createElement('div');
    bar.className = 'sbar is-off';
    bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML = '<div class="sbar__thumb"></div>';
    body.appendChild(bar);
    var thumb = bar.firstChild, hideTimer = null, drag = null, thumbH = 0, ticking = false;

    function metrics() { var dh = root.scrollHeight, vh = window.innerHeight; return { dh: dh, vh: vh, max: Math.max(1, dh - vh) }; }
    function update() {
      ticking = false;
      var m = metrics();
      var off = m.dh <= m.vh + 1 || body.classList.contains('is-immersed') ||
                getComputedStyle(root).overflow === 'hidden';
      bar.classList.toggle('is-off', off);
      if (off) return;
      thumbH = Math.max(36, m.vh * m.vh / m.dh);
      var top = (window.scrollY / m.max) * (m.vh - thumbH);
      thumb.style.height = thumbH + 'px';
      thumb.style.transform = 'translateY(' + top + 'px)';
    }
    function schedule() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    function flash() {
      bar.classList.add('is-on');
      clearTimeout(hideTimer);
      hideTimer = setTimeout(function () { if (!drag) bar.classList.remove('is-on'); }, 1000);
    }

    window.addEventListener('scroll', function () { schedule(); flash(); }, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('load', schedule);
    if (window.ResizeObserver) new ResizeObserver(schedule).observe(body);
    new MutationObserver(schedule).observe(body, { attributes: true, attributeFilter: ['class'] });
    new MutationObserver(schedule).observe(root, { attributes: true, attributeFilter: ['style'] });

    // 오른쪽 가장자리에 마우스가 오면 보여주기
    window.addEventListener('mousemove', function (e) { if (window.innerWidth - e.clientX < 28) flash(); }, { passive: true });

    // 끌기
    thumb.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      drag = { y: e.clientY, s: window.scrollY };
      thumb.setPointerCapture(e.pointerId);
      bar.classList.add('is-drag'); root.classList.add('sbar-dragging');
    });
    thumb.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var m = metrics();
      window.scrollTo(0, drag.s + (e.clientY - drag.y) * m.max / Math.max(1, m.vh - thumbH));
    });
    function endDrag() { if (!drag) return; drag = null; bar.classList.remove('is-drag'); root.classList.remove('sbar-dragging'); flash(); }
    thumb.addEventListener('pointerup', endDrag);
    thumb.addEventListener('pointercancel', endDrag);

    // 빈 곳 클릭: 그 위치로 이동
    bar.addEventListener('pointerdown', function (e) {
      if (e.target !== bar) return;
      var m = metrics();
      window.scrollTo({ top: (e.clientY - thumbH / 2) / Math.max(1, m.vh - thumbH) * m.max, behavior: 'smooth' });
    });

    update();
  })();

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
      b.innerHTML = '<i></i>';
      b.setAttribute('aria-label', (i + 1) + '번째 사진');
      b.addEventListener('click', function () { show(i); restart(); });
      dotsWrap.appendChild(b);
    });
    var dots = dotsWrap.querySelectorAll('button');
    var SLIDE_MS = 5000;
    hero.style.setProperty('--slide-ms', SLIDE_MS + 'ms');
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function load(img) { if (img && img.dataset.src) { img.src = img.dataset.src; img.removeAttribute('data-src'); } }
    function show(i) {
      slides[cur].classList.remove('is-active'); dots[cur].classList.remove('is-active');
      cur = (i + slides.length) % slides.length;
      load(slides[cur].querySelector('img'));
      slides[cur].classList.add('is-active');
      void dots[cur].offsetWidth;                  // 채움 애니메이션을 처음부터 다시
      dots[cur].classList.add('is-active');

      load(slides[(cur + 1) % slides.length].querySelector('img'));   // 다음 장 미리
    }
    function restart() {
      clearInterval(timer);
      hero.classList.add('is-playing');
      var d = dots[cur]; d.classList.remove('is-active'); void d.offsetWidth; d.classList.add('is-active');
      timer = setInterval(function () { show(cur + 1); }, SLIDE_MS);
    }
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
    var header = document.querySelector('.site-header');
    var logoImg = header.querySelector('.logo img');
    var navLinks = header.querySelectorAll('.nav a');
    var shade = hero.querySelector('.hero__shade');
    var info = hero.querySelector('.hero__info');

    // 헤더 뒤에 깔리는 흰 물결 (스크롤한 만큼 위에서부터 차오름)
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'hdr-wave');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('preserveAspectRatio', 'none');
    var path = document.createElementNS(NS, 'path');
    svg.appendChild(path);
    // 물결 가장자리를 부드럽게 번지게 하는 필터
    var defs = document.createElementNS(NS, 'defs');
    defs.innerHTML = '<filter id="wave-soft" x="-5%" y="-20%" width="110%" height="140%">' +
      '<feGaussianBlur stdDeviation="0 2"/></filter>';
    svg.insertBefore(defs, path);
    path.setAttribute('filter', 'url(#wave-soft)');
    var softBlur = defs.querySelector('feGaussianBlur');
    header.insertBefore(svg, header.firstChild);

    // 물결 아래쪽 사진을 살짝 흐리게 (아래로 갈수록 선명해짐)
    var topBlur = document.createElement('div');
    topBlur.className = 'hdr-blur';
    topBlur.setAttribute('aria-hidden', 'true');
    header.insertBefore(topBlur, header.firstChild);

    // 스크롤 속도에 따른 세로 모션블러 (사진에만)
    var mbHost = document.createElementNS(NS, 'svg');
    mbHost.setAttribute('width', '0'); mbHost.setAttribute('height', '0');
    mbHost.setAttribute('aria-hidden', 'true');
    mbHost.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    mbHost.innerHTML = '<filter id="hero-mblur" x="0" y="-10%" width="100%" height="120%">' +
      '<feGaussianBlur stdDeviation="0 0" edgeMode="duplicate"/></filter>';
    body.appendChild(mbHost);
    var mbNode = mbHost.querySelector('feGaussianBlur');
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var mb = 0, lastY = window.scrollY, lastT = performance.now();

    function headerFull() { return parseFloat(getComputedStyle(root).getPropertyValue('--header-h')) || 190; }
    function sizeHero() {
      var w = root.clientWidth, h = w * 2 / 3;
      if (window.innerWidth > 760) h = Math.min(h, window.innerHeight - headerFull() + 40);
      root.style.setProperty('--hero-h', Math.round(h) + 'px');
      root.style.setProperty('--span', Math.round(headerFull() * SPAN) + 'px');
    }
    var SPAN = 2;   // 전환에 쓰는 스크롤 거리 = 헤더 높이 × SPAN (클수록 천천히)
    sizeHero();
    body.classList.add('js-hero');

    function lerp(a, b, t) { return a + (b - a) * t; }
    var last = -1, ticking = false;

    function render() {
      ticking = false;
      var H = headerFull();                       // 펼쳐진 헤더 높이
      var y = Math.max(0, window.scrollY);
      var p = Math.min(1, y / (H * SPAN));        // 0 = 사진 꽉 참, 1 = 흰 헤더
      var e = p * p * (3 - 2 * p);                // 부드러운 곡선

      // 사진 윗부분을 헤더 뒤까지 늘림: 전환하는 동안 사진은 페이지보다 천천히 올라가다가 p=1 에서 원래 자리로
      hero.style.setProperty('--ext', (H * (1 - p)).toFixed(1) + 'px');

      // 흰 물결: 아래 경계가 0 → 헤더 높이까지 내려오며 출렁임 (중간에 가장 크게)
      var W = header.clientWidth || root.clientWidth, Hc = header.offsetHeight;
      var base = Hc * e;
      var amp = Math.sin(Math.PI * p) * (W < 700 ? 24 : 40);
      var ph = y * 0.018 / SPAN;
      var d = 'M0,0 H' + W + ' ';
      for (var x = W; x >= -0.1; x -= W / 48) {
        var u = x / W;
        var wv = 0.55 * Math.sin(u * Math.PI * 3.1 + ph) + 0.3 * Math.sin(u * Math.PI * 7.3 - ph * 1.6) + 0.15 * Math.sin(u * Math.PI * 13 + ph * 2.3);
        d += 'L' + x.toFixed(1) + ',' + Math.max(0, base + amp * wv).toFixed(1) + ' ';
      }
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + (Hc + 90));
      path.setAttribute('d', p <= 0 ? '' : d + 'Z');

      // 위쪽 블러: 전환 중간에 가장 강하고, 끝나면 사라짐
      var mid = Math.sin(Math.PI * p);
      var tb = p >= 1 ? 0 : 2.5 + 7 * mid;
      topBlur.style.height = Math.round(base + amp + 120) + 'px';
      topBlur.style.setProperty('--tb', tb.toFixed(2) + 'px');
      topBlur.style.opacity = p >= 1 ? '0' : '1';

      // 모션블러: 스크롤 속도 → 세로 번짐 (전환 구간에서만)
      var now = performance.now(), dt = Math.max(8, now - lastT);
      var v = Math.abs(y - lastY) / dt;            // px/ms
      lastY = y; lastT = now;
      var target = (reduce || p >= 1) ? 0 : Math.min(9, v * 7);
      mb = mb * 0.72 + target * 0.28;
      if (mb < 0.15 && target === 0) mb = 0;
      if (mb > 0.05) {
        mbNode.setAttribute('stdDeviation', '0 ' + mb.toFixed(2));
        hero.style.filter = 'url(#hero-mblur)';
      } else if (hero.style.filter) {
        hero.style.filter = '';
      }
      softBlur.setAttribute('stdDeviation', '0 ' + (1.5 + 3.5 * mid + mb * 0.4).toFixed(2));
      if (mb > 0) schedule();                      // 멈춘 뒤에도 번짐이 서서히 풀리도록 계속 그림

      // 로고·메뉴: 흰색 → 검정 (물결이 지나가는 타이밍에 맞춰)
      var k = Math.min(1, Math.max(0, (e - 0.25) / 0.6));
      logoImg.style.filter = 'brightness(0) invert(' + (1 - k).toFixed(3) + ') drop-shadow(0 1px 10px rgba(0,0,0,' + (0.28 * (1 - k)).toFixed(3) + '))';
      var c = Math.round(lerp(255, 33, k));
      navLinks.forEach(function (a) {
        a.style.color = 'rgb(' + c + ',' + c + ',' + c + ')';
        a.style.textShadow = '0 1px 10px rgba(0,0,0,' + (0.35 * (1 - k)).toFixed(3) + ')';
      });

      if (shade) shade.style.opacity = (1 - e).toFixed(3);
      // 하단 정보와 넘김 표시는 '화면에 보이는 사진 영역' 기준으로 배치
      var hr = hero.getBoundingClientRect(), vh = window.innerHeight;
      var visTop = Math.max(hr.top, 0);            // 로고·메뉴 아래부터 (메뉴와 겹치지 않게)
      var visBot = Math.min(hr.bottom, vh);
      if (info) info.style.bottom = Math.max(window.innerWidth < 761 ? 10 : 18, hr.bottom - vh + 18) + 'px';
      if (info) visBot = Math.min(visBot, info.getBoundingClientRect().top - 8);   // 하단 정보와 겹치지 않게
      if (dotsWrap) dotsWrap.style.top = ((visTop + visBot) / 2 - hr.top) + 'px';
      body.classList.toggle('is-top', p < 0.02);
    }
    function schedule() { if (!ticking) { ticking = true; requestAnimationFrame(render); } }

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', function () { sizeHero(); schedule(); });
    window.addEventListener('load', function () { sizeHero(); schedule(); });
    if (window.ResizeObserver) new ResizeObserver(schedule).observe(header);
    render();
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

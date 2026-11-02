/* Welle Fotografien — 공통 스크립트 */
(function () {
  /* 페이지 전환 물결 — 인트로와 같은 물빛 물결이 화면 전체를 덮었다가(out), 다음 페이지에서 걷힘(in) */
  function waterVeil(mode, px, py, dur, done) {
    var cv = document.createElement('canvas');
    cv.className = 'water-veil' + (mode === 'out' ? ' is-blocking' : '');
    document.body.appendChild(cv);
    var gl = cv.getContext('webgl', { premultipliedAlpha: true, alpha: true });
    if (!gl) {                                    // WebGL 미지원: 부드럽게 페이드
      cv.remove();
      var d = document.createElement('div');
      d.className = 'water-veil';
      d.style.background = 'linear-gradient(#f7fbfe,#e9f2f9)';
      d.style.transition = 'opacity ' + dur + 'ms ease';
      d.style.opacity = mode === 'out' ? '0' : '1';
      document.body.appendChild(d);
      requestAnimationFrame(function () { d.style.opacity = mode === 'out' ? '1' : '0'; });
      setTimeout(function () { if (mode === 'in') d.remove(); if (done) done(); }, dur);
      return;
    }
    var VS = 'attribute vec2 a;varying vec2 v;void main(){v=a*.5+.5;gl_Position=vec4(a,0.,1.);}';
    var FS = [
      'precision mediump float;varying vec2 v;uniform vec2 R,Pt;uniform float T,P,O;',
      'float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
      'float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}',
      'float fb(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}',
      'void main(){',
      ' float asp=R.x/R.y; vec2 p=(v-.5)*vec2(asp,1.); vec2 pt=(Pt-.5)*vec2(asp,1.);',
      ' vec2 w=vec2(fb(p*2.+T*.12),fb(p*2.+5.2-T*.1))-.5;',
      ' float d=length(p-pt);',
      ' float m=fb(p*2.6+T*.15)*.55+d*.75;',              // 불규칙한 물결 경계
      ' float front=P*2.1-.15;',
      ' float A=O>.5 ? 1.-smoothstep(front-.1,front+.1,m) : smoothstep(front-.1,front+.1,m);',
      ' vec3 c=mix(vec3(.914,.949,.976),vec3(.969,.984,.996),clamp(v.y+w.y*.25,0.,1.));',
      ' float cn=fb(p*2.4+w*3.+vec2(T*.05,-T*.04));',
      ' float caus=pow(1.-abs(sin(cn*12.566)),5.);',
      ' c+=(caus-.25)*.02+w.x*.015;',
      ' float rim=exp(-abs(m-front)*28.);',               // 물결 경계에 맺히는 빛
      ' float ring=sin(d*48.-T*9.)*exp(-d*2.2)*(1.-P)*.5+.5;',
      ' c+=vec3(1.)*rim*.18*ring;',
      ' gl_FragColor=vec4(c*A,A);',
      '}'
    ].join('\n');
    function sh(t, src) { var o = gl.createShader(t); gl.shaderSource(o, src); gl.compileShader(o); return o; }
    var pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(pr); gl.useProgram(pr);
    var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var al = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(al); gl.vertexAttribPointer(al, 2, gl.FLOAT, false, 0, 0);
    var U = {}; ['R', 'Pt', 'T', 'P', 'O'].forEach(function (k) { U[k] = gl.getUniformLocation(pr, k); });
    var t0 = performance.now();
    function ease(x) { return x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
    (function frame(now) {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      var W = Math.round(cv.clientWidth * dpr), H = Math.round(cv.clientHeight * dpr);
      if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
      gl.viewport(0, 0, W, H);
      var k = Math.min(1, (now - t0) / dur);
      gl.uniform2f(U.R, W, H); gl.uniform2f(U.Pt, px, py);
      gl.uniform1f(U.T, now / 1000); gl.uniform1f(U.P, ease(k)); gl.uniform1f(U.O, mode === 'out' ? 1 : 0);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (mode === 'in' && k > 0) document.documentElement.classList.remove('water-in');
      if (k < 1) requestAnimationFrame(frame);
      else {
        if (mode === 'in') cv.remove();
        if (done) done();
      }
    })(t0);
  }

  // 들어올 때: 이전 페이지에서 물결로 넘어왔다면 물이 걷히며 페이지가 드러남
  (function () {
    var raw = null;
    try { raw = sessionStorage.getItem('welleWater'); sessionStorage.removeItem('welleWater'); } catch (e) {}
    if (!raw) { document.documentElement.classList.remove('water-in'); return; }
    var pos = { x: .5, y: .5 };
    try { pos = JSON.parse(raw); } catch (e) {}
    waterVeil('in', pos.x, pos.y, 1700);
  })();

  // 뒤로가기로 돌아왔을 때(페이지가 그대로 복원된 경우) 덮여 있던 물을 치움
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      document.querySelectorAll('.water-veil').forEach(function (n) { n.remove(); });
      document.documentElement.classList.remove('water-in');
    }
  });

  // 나갈 때: data-water 링크를 누르면 바로 이동하고, 다음 페이지가 누른 자리에서부터 물결로 드러남 (전환 한 번)
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-water]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var x = e.clientX / window.innerWidth, y = 1 - e.clientY / window.innerHeight;
    if (!e.clientX && !e.clientY) { x = .5; y = .5; }
    try { sessionStorage.setItem('welleWater', JSON.stringify({ x: x, y: y })); } catch (err) {}
    // 기본 이동 그대로 진행
  });
  // 마우스를 올리면 다음 페이지를 미리 받아 둠 → 넘어가는 순간 빈틈이 줄어듦
  var prefetched = {};
  document.addEventListener('pointerover', function (e) {
    var a = e.target.closest && e.target.closest('a[data-water]');
    if (!a || prefetched[a.href]) return;
    prefetched[a.href] = true;
    var l = document.createElement('link'); l.rel = 'prefetch'; l.href = a.href;
    document.head.appendChild(l);
  });

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

    // 사진을 누르면 다음 사진 (링크·버튼은 제외)
    hero.addEventListener('click', function (e) {
      if (e.target.closest('a, button')) return;
      show(cur + 1); restart();
    });

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

      // 흰 물결: 아래 경계가 0 → 헤더 높이까지 내려오며 출렁임 (중간에 가장 크게)
      var W = header.clientWidth || root.clientWidth, Hc = header.offsetHeight;
      var base = Hc * e;

      // 사진 상자를 '지금 화면에 보이는 부분'(물결 아래 ~ 화면 아래)에 맞춤
      // → 스크롤해도 사진이 인물 위치를 기준으로 다시 맞춰져 인물이 계속 보임
      var hrect = hero.getBoundingClientRect();
      var topScreen = Math.max(base, 0);
      var botScreen = Math.min(hrect.bottom, window.innerHeight);
      if (botScreen - topScreen < 60) topScreen = Math.max(hrect.top, botScreen - 60);
      hero.style.setProperty('--ext', (hrect.top - topScreen).toFixed(1) + 'px');
      hero.style.setProperty('--exb', Math.max(0, hrect.bottom - botScreen).toFixed(1) + 'px');
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
      if (info) info.style.bottom = Math.max(window.innerWidth < 761 ? 22 : 30, hr.bottom - vh + 30) + 'px';
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

  /* 홈 갤러리 띠: 마우스를 올리면 인트로처럼 물결이 퍼짐
     - 높이장(물결)을 계산해서
       ① 흐르는 사진 자체를 SVG 변위 필터로 실제로 일렁이게 하고
       ② 블러 막 위에 수면의 빛·그늘을 칠함 */
  (function () {
    var hov = document.querySelector('.flow__hover');
    var stage = document.querySelector('.flow__stage');
    var track = document.querySelector('.flow__track');
    if (!hov || !stage || !track || !window.matchMedia || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var NS = 'http://www.w3.org/2000/svg', XL = 'http://www.w3.org/1999/xlink';
    var host = document.createElementNS(NS, 'svg');
    host.setAttribute('width', '0'); host.setAttribute('height', '0'); host.setAttribute('aria-hidden', 'true');
    host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    host.innerHTML =
      '<filter id="flow-ripple" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">' +
        '<feFlood flood-color="rgb(128,128,128)" result="flat"/>' +
        '<feImage result="map0" preserveAspectRatio="none"/>' +
        '<feMerge result="map1"><feMergeNode in="flat"/><feMergeNode in="map0"/></feMerge>' +
        '<feGaussianBlur in="map1" stdDeviation="6" result="map"/>' +
        '<feDisplacementMap in="SourceGraphic" in2="map" scale="38" xChannelSelector="R" yChannelSelector="G"/>' +
      '</filter>';
    document.body.appendChild(host);
    var filt = host.querySelector('filter'), feImg = host.querySelector('feImage'), feDisp = host.querySelector('feDisplacementMap');

    var shade = hov.querySelector('.flow__ripple'), sctx = shade.getContext('2d');
    var map = document.createElement('canvas'), mctx = map.getContext('2d');
    // 물결 한 번 = 마우스 자리에서 '첫 물결 + 두 번째 물결'이 띠 전체로 퍼져 나감.
    // 다 퍼질 때까지는 새 물결을 만들지 않고, 끝나면 다음 움직임에서 다시 시작.
    // 물결 앞부분은 노이즈로 일그러뜨려 정원처럼 보이지 않게 함.
    var CELL = 6, gw = 0, gh = 0, H = null, mImg = null, sImg = null;
    var running = false, inside = false, wave = null, lastPos = null;
    var SPEED = 0.075;           // 퍼지는 속도 (칸/ms)
    var WL = 9;                  // 물결 하나의 폭 (칸)
    var GAP = 22;                // 첫 물결과 두 번째 물결 사이 거리 (칸)
    var AMP = 1.35;              // 출렁임 크기

    function setup() {
      var r = stage.getBoundingClientRect();
      var nw = Math.max(40, Math.round(r.width / CELL)), nh = Math.max(12, Math.round(r.height / CELL));
      if (nw === gw && nh === gh && H) return;
      gw = nw; gh = nh;
      map.width = shade.width = gw; map.height = shade.height = gh;
      H = new Float32Array(gw * gh);
      mImg = mctx.createImageData(gw, gh); sImg = sctx.createImageData(gw, gh);
    }

    // 값 노이즈 (부드러운 불규칙 무늬)
    var perm = new Uint8Array(512);
    (function () { var p = [], i, j, t; for (i = 0; i < 256; i++) p[i] = i;
      for (i = 255; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); t = p[i]; p[i] = p[j]; p[j] = t; }
      for (i = 0; i < 512; i++) perm[i] = p[i & 255]; })();
    function rnd(ix, iy) { return perm[(perm[ix & 255] + iy) & 511] / 255; }
    function noise(x, y) {
      var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
      var ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
      var a = rnd(ix, iy), b = rnd(ix + 1, iy), c = rnd(ix, iy + 1), d = rnd(ix + 1, iy + 1);
      return (a + (b - a) * ux) + ((c + (d - c) * ux) - (a + (b - a) * ux)) * uy - 0.5;
    }
    function packet(q) { return Math.sin(q * Math.PI) * Math.exp(-q * q * 0.55); }

    function start(x, y) {
      if (wave) return;                                   // 퍼지는 중에는 새 물결 없음
      var far = Math.max(Math.hypot(x, y), Math.hypot(gw - x, y), Math.hypot(x, gh - y), Math.hypot(gw - x, gh - y));
      wave = { x: x, y: y, t: performance.now(), end: far + GAP + WL * 3, seed: Math.random() * 100 };
      if (!running) { running = true; requestAnimationFrame(step); }
    }

    function step(now) {
      if (!wave) {
        running = false; track.style.filter = ''; sctx.clearRect(0, 0, gw, gh);
        return;
      }
      var age = now - wave.t, front = age * SPEED;
      if (front > wave.end) {                             // 다 퍼짐 → 끝, 다음 물결 대기
        wave = null; requestAnimationFrame(step);
        return;
      }
      var fade = 1 - Math.pow(front / wave.end, 2);        // 멀리 갈수록 서서히 약해짐
      var ins = Math.min(1, age / 260);                    // 시작은 부드럽게
      var x, y, k, sd0 = wave.seed, tt = now / 1000;
      for (y = 0; y < gh; y++) for (x = 0; x < gw; x++) {
        k = y * gw + x;
        // 물결 앞부분을 불규칙하게: 방향·위치에 따라 거리를 노이즈로 흔듦
        var d = Math.hypot(x - wave.x, (y - wave.y) * 1.25) + noise(x * 0.045 + sd0, y * 0.07 + tt * 0.15) * 26;
        var q1 = (d - front) / WL, q2 = (d - (front - GAP)) / WL;
        var h = 0;
        if (q1 > -3 && q1 < 3) h += packet(q1);
        if (q2 > -3 && q2 < 3 && front > GAP) h += 0.6 * packet(q2);
        // 물결 높이도 자리마다 조금씩 다르게
        H[k] = h * AMP * fade * ins * (0.75 + 0.5 * (noise(x * 0.06 - tt * 0.1, y * 0.09 + sd0) + 0.5));
      }

      var md = mImg.data, sd = sImg.data;
      for (y = 0; y < gh; y++) for (x = 0; x < gw; x++) {
        k = y * gw + x;
        var gx = H[y * gw + Math.min(gw - 1, x + 1)] - H[y * gw + Math.max(0, x - 1)];
        var gy = H[Math.min(gh - 1, y + 1) * gw + x] - H[Math.max(0, y - 1) * gw + x];
        var p = k * 4;
        md[p] = Math.max(0, Math.min(255, 128 + gx * 150));
        md[p + 1] = Math.max(0, Math.min(255, 128 + gy * 150));
        md[p + 2] = 128; md[p + 3] = 255;
        var light = -gx * 0.55 - gy * 0.85;
        if (light > 0) { sd[p] = sd[p + 1] = sd[p + 2] = 255; sd[p + 3] = Math.min(120, light * 300); }
        else { sd[p] = 20; sd[p + 1] = 35; sd[p + 2] = 50; sd[p + 3] = Math.min(50, -light * 140); }
      }
      sctx.putImageData(sImg, 0, 0);
      mctx.putImageData(mImg, 0, 0);

      var sr = stage.getBoundingClientRect(), tr = track.getBoundingClientRect();
      var ox = sr.left - tr.left, oy = sr.top - tr.top;
      filt.setAttribute('x', ox); filt.setAttribute('y', oy);
      filt.setAttribute('width', sr.width); filt.setAttribute('height', sr.height);
      feImg.setAttribute('x', ox); feImg.setAttribute('y', oy);
      feImg.setAttribute('width', sr.width); feImg.setAttribute('height', sr.height);
      var url = map.toDataURL('image/png');
      feImg.setAttribute('href', url); feImg.setAttributeNS(XL, 'href', url);
      if (!track.style.filter) track.style.filter = 'url(#flow-ripple)';

      requestAnimationFrame(step);
    }

    function toGrid(e) {
      var r = stage.getBoundingClientRect();
      return { x: (e.clientX - r.left) / CELL, y: (e.clientY - r.top) / CELL };
    }
    hov.addEventListener('mouseenter', function (e) { inside = true; setup(); lastPos = toGrid(e); start(lastPos.x, lastPos.y); });
    hov.addEventListener('mouseleave', function () { inside = false; lastPos = null; });
    hov.addEventListener('mousemove', function (e) {
      if (!H) setup();
      var c = toGrid(e), moved = !lastPos || Math.hypot(c.x - lastPos.x, c.y - lastPos.y) > 1.5;
      lastPos = c;
      if (moved) start(c.x, c.y);                          // 퍼지는 중이면 무시됨
    });
    window.addEventListener('resize', function () { if (running) setup(); });
  })();

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

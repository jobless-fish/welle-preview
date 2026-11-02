/* Welle Fotografien — 공통 스크립트 */
(function () {
  /* 헤더: 스크롤하면 작아짐 */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 40); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* 이미지가 로드되면 부드럽게 나타나기 */
  document.querySelectorAll('.masonry img').forEach(function (img) {
    if (img.complete && img.naturalWidth) img.classList.add('is-loaded');
    else img.addEventListener('load', function () { img.classList.add('is-loaded'); });
  });

  /* 홈 슬라이드 */
  var hero = document.querySelector('.hero');
  if (hero) {
    var slides = hero.querySelectorAll('.hero__slide');
    var dotsWrap = hero.querySelector('.hero__dots');
    var cur = 0, timer;
    slides.forEach(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', (i + 1) + '번째 사진');
      b.addEventListener('click', function () { show(i); restart(); });
      dotsWrap.appendChild(b);
    });
    var dots = dotsWrap.querySelectorAll('button');
    function show(i) {
      slides[cur].classList.remove('is-active'); dots[cur].classList.remove('is-active');
      cur = (i + slides.length) % slides.length;
      var img = slides[cur].querySelector('img');
      if (img && img.dataset.src) { img.src = img.dataset.src; img.removeAttribute('data-src'); }
      slides[cur].classList.add('is-active'); dots[cur].classList.add('is-active');
      // 다음 장 미리 불러오기
      var nx = slides[(cur + 1) % slides.length].querySelector('img');
      if (nx && nx.dataset.src) { nx.src = nx.dataset.src; nx.removeAttribute('data-src'); }
    }
    function restart() { clearInterval(timer); timer = setInterval(function () { show(cur + 1); }, 5000); }
    dots[0].classList.add('is-active');
    show(0);
    restart();

    // 스와이프
    var sx = null;
    hero.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) { show(cur + (dx < 0 ? 1 : -1)); restart(); }
      sx = null;
    });
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

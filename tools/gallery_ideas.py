"""갤러리 시안 비교 페이지 (gallery-ideas.html) — build.py 에서 불러 씀"""
import json

CATS = {11: "본식", 10: "본식", 9: "본식", 7: "본식", 6: "본식", 4: "본식",
        5: "스튜디오", 3: "야외", 8: "데이트"}

CSS = """
<style>
.ideas-tabs { position: sticky; top: var(--header-shrunk, 96px); z-index: 20; background: rgba(255,255,255,.96);
  border-bottom: 1px solid var(--line); }
.ideas-tabs__inner { max-width: var(--max); margin: 0 auto; padding: 0 var(--gutter);
  display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; }
.ideas-tabs__inner::-webkit-scrollbar { display: none; }
.ideas-tabs button { flex: none; border: 0; background: none; cursor: pointer; padding: 16px 14px 14px;
  font: 400 15px/1.2 var(--serif); letter-spacing: .04em; color: var(--muted); border-bottom: 2px solid transparent; }
.ideas-tabs button b { font-family: var(--sans); font-weight: 500; font-size: 13px; margin-left: 6px; letter-spacing: 0; }
.ideas-tabs button[aria-selected="true"] { color: var(--ink); border-bottom-color: var(--ink); }
.idea { display: none; }
.idea.is-active { display: block; }
.idea-intro { max-width: 680px; margin: 0 auto; padding: clamp(28px, 5vw, 48px) var(--gutter) clamp(24px, 4vw, 40px); text-align: center; }
.idea-intro h2 { margin: 0 0 8px; font: 400 clamp(22px, 3.2vw, 30px)/1.2 var(--serif); color: var(--ink); letter-spacing: .03em; }
.idea-intro p { margin: 0; color: var(--muted); font-size: 13.5px; }
.chips { display: flex; justify-content: center; flex-wrap: wrap; gap: 8px; margin: 0 auto clamp(24px, 4vw, 36px); padding: 0 var(--gutter); }
.chips button { border: 1px solid #d9dcdf; background: #fff; padding: 8px 16px; border-radius: 999px; cursor: pointer;
  font: 400 13px/1 var(--sans); color: var(--ink-soft); transition: all .2s; }
.chips button.is-on { background: var(--ink); border-color: var(--ink); color: #fff; }

/* ---------- A. 인덱스 ---------- */
.idx { max-width: 1000px; margin: 0 auto; padding: 0 var(--gutter) clamp(56px, 8vw, 96px); list-style: none; }
.idx li { border-top: 1px solid var(--line); }
.idx li:last-child { border-bottom: 1px solid var(--line); }
.idx a { display: grid; grid-template-columns: 48px 1fr auto; align-items: baseline; gap: 18px;
  padding: clamp(18px, 2.6vw, 28px) 4px; transition: padding .35s ease, color .35s; color: var(--ink); }
.idx .no { font: 400 13px/1 var(--serif); color: var(--muted); letter-spacing: .1em; }
.idx .t { font: 400 clamp(28px, 5vw, 56px)/1.05 var(--serif); letter-spacing: .01em; }
.idx .m { font-size: 12px; color: var(--muted); text-align: right; white-space: nowrap; }
.idx .m em { display: block; font-style: normal; font: 400 13px/1.4 var(--serif); letter-spacing: .12em; text-transform: uppercase; }
.idx a:hover { padding-left: 18px; }
.idx-preview { position: fixed; left: 0; top: 0; z-index: 40; width: 260px; pointer-events: none;
  opacity: 0; transform: translate(-50%, -50%) scale(.96); transition: opacity .25s, transform .25s; }
.idx-preview.is-on { opacity: 1; transform: translate(-50%, -50%) scale(1); }
.idx-preview img { width: 100%; height: auto; box-shadow: 0 18px 50px rgba(0,0,0,.18); }
.idx .thumbs { display: none; }
@media (hover: none), (max-width: 760px) {
  .idx-preview { display: none; }
  .idx a { grid-template-columns: 1fr auto; row-gap: 12px; }
  .idx .no { display: none; }
  .idx .thumbs { display: grid; grid-column: 1 / -1; grid-template-columns: repeat(4, 1fr); gap: 4px; }
  .idx .thumbs img { width: 100%; aspect-ratio: 2 / 3; object-fit: cover; object-position: 50% 30%; background: var(--paper-2); }
}

/* ---------- B. 필름 스트립 (차분한 버전) ---------- */
.strips { max-width: 1120px; margin: 0 auto; padding: 0 var(--gutter) clamp(56px, 8vw, 96px); }
.strip { display: grid; grid-template-columns: 220px 1fr; gap: 32px; align-items: center;
  padding: 34px 0; border-top: 1px solid var(--line); }
.strip:last-child { border-bottom: 1px solid var(--line); }
.strip[hidden] { display: none; }
.strip__head h3 { margin: 0; font: 400 26px/1.15 var(--serif); color: var(--ink); letter-spacing: .02em; }
.strip__head .meta { display: block; margin-top: 8px; font-size: 12px; color: var(--muted); }
.strip__head a { display: inline-block; margin-top: 18px; font: 400 12px/1 var(--serif); letter-spacing: .16em;
  text-transform: uppercase; color: var(--ink); border-bottom: 1px solid currentColor; padding-bottom: 3px; }
.strip__head a:hover { opacity: .6; }
/* PC: 스크롤 없이 한 줄, 오른쪽 끝은 흐리게 */
.strip__row { display: flex; gap: 8px; height: 230px; overflow: hidden;
  -webkit-mask-image: linear-gradient(to right, #000 82%, transparent);
          mask-image: linear-gradient(to right, #000 82%, transparent); }
.strip__row a { flex: none; height: 100%; background: var(--paper-2); }
.strip__row img { height: 100%; width: auto; display: block; transition: opacity .3s; }
.strip__row a:hover img { opacity: .85; }
.strip__row .more { display: none; }
@media (max-width: 760px) {
  .strips { padding: 0 0 56px; }
  .strip { grid-template-columns: 1fr; gap: 14px; padding: 28px 0; }
  .strip__head { padding: 0 var(--gutter); display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
  .strip__head h3 { font-size: 22px; }
  .strip__head .meta { display: inline; margin: 0 0 0 8px; }
  .strip__head a { margin-top: 0; white-space: nowrap; }
  /* 모바일: 가로로 넘기기, 작고 적게 */
  .strip__row { height: 190px; overflow-x: auto; scroll-snap-type: x proximity; padding: 0 var(--gutter);
    scroll-padding: 0 var(--gutter); scrollbar-width: none; -webkit-mask-image: none; mask-image: none; }
  .strip__row::-webkit-scrollbar { display: none; }
  .strip__row a { scroll-snap-align: start; }
  .strip__row .more { display: flex; align-items: center; justify-content: center; width: 96px;
    border: 1px solid var(--line); background: #fff; font: 400 13px/1.4 var(--serif); letter-spacing: .1em; color: var(--ink); text-align: center; }
}

/* ---------- C. 모자이크 ---------- */
.mosaic { max-width: 1400px; margin: 0 auto; padding: 0 var(--gutter) clamp(56px, 8vw, 96px);
  display: grid; grid-template-columns: repeat(6, 1fr); grid-auto-rows: clamp(90px, 11vw, 150px); grid-auto-flow: dense; gap: 6px; }
.mosaic a { position: relative; overflow: hidden; grid-row: span 3; background: var(--paper-2); }
.mosaic a.big { grid-column: span 2; grid-row: span 4; }
.mosaic a[hidden] { display: none; }
.mosaic img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 28%; transition: transform .8s ease; }
.mosaic a:hover img { transform: scale(1.03); }
.mosaic .cap { position: absolute; left: 0; right: 0; bottom: 0; padding: 26px 12px 10px;
  background: linear-gradient(transparent, rgba(0,0,0,.45)); color: #fff; font: 400 14px/1.2 var(--serif);
  letter-spacing: .06em; opacity: 0; transition: opacity .3s; }
.mosaic a:hover .cap { opacity: 1; }
@media (max-width: 760px) {
  .mosaic { grid-template-columns: repeat(2, 1fr); grid-auto-rows: 26vw; gap: 4px; }
  .mosaic a.big { grid-column: span 2; grid-row: span 4; }
  .mosaic .cap { opacity: 1; font-size: 12px; padding: 18px 8px 6px; }
}
.pick-note { text-align: center; color: var(--muted); font-size: 13px; padding: 0 var(--gutter) 40px; }
</style>
"""

JS = r"""
<script>
(function () {
  var D = window.__ALBUMS__, UP = window.__UP__;
  function img(f, w) { return UP + f + '?w=' + w; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

  /* 탭 */
  var tabs = document.querySelectorAll('.ideas-tabs button');
  function pick(id) {
    tabs.forEach(function (t) { t.setAttribute('aria-selected', t.dataset.idea === id ? 'true' : 'false'); });
    document.querySelectorAll('.idea').forEach(function (s) { s.classList.toggle('is-active', s.id === 'idea-' + id); });
    try { history.replaceState(null, '', '#' + id); } catch (e) {}
    window.scrollTo({ top: 0 });
  }
  tabs.forEach(function (t) { t.addEventListener('click', function () { pick(t.dataset.idea); }); });

  /* 탭 고정 위치를 줄어든 헤더 높이에 맞춤 */
  var hdr = document.querySelector('.site-header');
  function setTop() { document.documentElement.style.setProperty('--header-shrunk', hdr.getBoundingClientRect().height + 'px'); }
  if (window.ResizeObserver) new ResizeObserver(setTop).observe(hdr);
  hdr.addEventListener('transitionend', setTop);
  window.addEventListener('scroll', setTop, { passive: true }); setTop();

  /* A. 인덱스 */
  var idx = document.getElementById('idx');
  idx.innerHTML = D.map(function (a, i) {
    var th = a.photos.slice(0, 4).map(function (f) { return '<img src="' + img(f, 300) + '" alt="" loading="lazy">'; }).join('');
    return '<li><a href="album-' + a.id + '.html" data-cover="' + img(a.photos[1] || a.cover, 600) + '">' +
      '<span class="no">' + String(i + 1).padStart(2, '0') + '</span>' +
      '<span class="t">' + esc(a.title) + '</span>' +
      '<span class="m"><em>' + esc(a.cat) + '</em>' + a.photos.length + ' photos</span>' +
      '<span class="thumbs">' + th + '</span></a></li>';
  }).join('');
  var pv = document.getElementById('idx-preview'), pvImg = pv.querySelector('img');
  idx.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('mouseenter', function () { pvImg.src = a.dataset.cover; pv.classList.add('is-on'); });
    a.addEventListener('mouseleave', function () { pv.classList.remove('is-on'); });
    a.addEventListener('mousemove', function (e) { pv.style.left = (e.clientX + 170) + 'px'; pv.style.top = e.clientY + 'px'; });
  });
  // 미리보기 이미지 미리 받아두기
  setTimeout(function () { D.forEach(function (a) { var i = new Image(); i.src = img(a.photos[1] || a.cover, 600); }); }, 1200);

  /* 필터 칩 공통 */
  var cats = ['전체'].concat(D.map(function (a) { return a.cat; }).filter(function (v, i, s) { return s.indexOf(v) === i; }));
  function chips(el, on) {
    el.innerHTML = cats.map(function (c, i) { return '<button type="button" class="' + (i ? '' : 'is-on') + '">' + c + '</button>'; }).join('');
    el.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        el.querySelectorAll('button').forEach(function (x) { x.classList.toggle('is-on', x === b); });
        on(b.textContent);
      });
    });
  }

  /* B. 필름 스트립 */
  var strips = document.getElementById('strips');
  strips.innerHTML = D.map(function (a) {
    var shown = 6;
    var row = a.photos.slice(0, shown).map(function (f) {
      return '<a href="album-' + a.id + '.html"><img src="' + img(f, 500) + '" alt="" loading="lazy"></a>';
    }).join('');
    var rest = Math.max(0, a.photos.length - shown);
    return '<section class="strip" data-cat="' + esc(a.cat) + '">' +
      '<div class="strip__head"><div><h3>' + esc(a.title) + '</h3><span class="meta">' + esc(a.cat) + ' · ' + a.photos.length + ' photos</span></div>' +
      '<a href="album-' + a.id + '.html">View all</a></div>' +
      '<div class="strip__row">' + row + (rest ? '<a class="more" href="album-' + a.id + '.html">+' + rest + '<br>more</a>' : '') + '</div></section>';
  }).join('');
  chips(document.getElementById('chips-b'), function (c) {
    strips.querySelectorAll('.strip').forEach(function (s) { s.hidden = !(c === '전체' || s.dataset.cat === c); });
  });

  /* C. 모자이크 — 앨범마다 몇 장씩 골라 섞음 */
  var mos = document.getElementById('mosaic'), tiles = [];
  D.forEach(function (a) {
    var n = Math.min(a.photos.length, a.cat === '본식' ? 7 : 5);
    for (var k = 0; k < n; k++) tiles.push({ a: a, f: a.photos[Math.floor(k * a.photos.length / n)] });
  });
  // 앨범이 고르게 섞이도록 번갈아 배치
  var byAlbum = {}; tiles.forEach(function (t) { (byAlbum[t.a.id] = byAlbum[t.a.id] || []).push(t); });
  var mixed = [], keys = Object.keys(byAlbum), left = true;
  while (left) { left = false; keys.forEach(function (k) { var t = byAlbum[k].shift(); if (t) { mixed.push(t); left = true; } }); }
  mos.innerHTML = mixed.map(function (t, i) {
    return '<a href="album-' + t.a.id + '.html" data-cat="' + esc(t.a.cat) + '"' + (i % 7 === 0 ? ' class="big"' : '') + '>' +
      '<img src="' + img(t.f, i % 7 === 0 ? 900 : 500) + '" alt="" loading="lazy"><span class="cap">' + esc(t.a.title) + '</span></a>';
  }).join('');
  chips(document.getElementById('chips-c'), function (c) {
    mos.querySelectorAll('a').forEach(function (t) { t.hidden = !(c === '전체' || t.dataset.cat === c); });
  });

  pick((location.hash || '#A').slice(1).toUpperCase().replace(/[^ABC]/g, '') || 'A');
})();
</script>
"""


def build(albums, up_base):
    data = [{"id": a["id"], "title": a["title"], "cat": CATS.get(a["id"], ""),
             "cover": a["cover"], "photos": a["photos"]} for a in albums]
    body = f"""
<div class="ideas-tabs" role="tablist" aria-label="갤러리 시안">
  <div class="ideas-tabs__inner">
    <button type="button" role="tab" data-idea="A">A<b>인덱스</b></button>
    <button type="button" role="tab" data-idea="B">B<b>필름 스트립</b></button>
    <button type="button" role="tab" data-idea="C">C<b>모자이크</b></button>
  </div>
</div>

<section class="idea" id="idea-A">
  <div class="idea-intro">
    <span class="eyebrow">Idea A</span>
    <h2>장소 이름이 주인공인 인덱스</h2>
    <p>예식장 이름을 큰 글씨 목록으로 보여주고, PC에서는 마우스를 올리면 대표 사진이 커서를 따라 떠요.
       모바일에서는 이름 아래 사진 4장이 함께 보여요. 군더더기 없이 고급스러운 인상, 예식장으로 찾는 신부님께 편해요.</p>
  </div>
  <ul class="idx" id="idx"></ul>
  <div class="idx-preview" id="idx-preview" aria-hidden="true"><img alt=""></div>
</section>

<section class="idea" id="idea-B">
  <div class="idea-intro">
    <span class="eyebrow">Idea B</span>
    <h2>앨범마다 한 줄씩, 필름 스트립</h2>
    <p>앨범마다 한 줄씩, 이름과 사진 몇 장만 차분하게 보여줘요. PC에서는 넘기지 않고 한 줄에 담고,
       모바일에서는 작은 사진을 옆으로 넘겨봐요. 사진은 원래 비율 그대로라 잘리는 곳이 없어요.</p>
  </div>
  <div class="chips" id="chips-b"></div>
  <div class="strips" id="strips"></div>
</section>

<section class="idea" id="idea-C">
  <div class="idea-intro">
    <span class="eyebrow">Idea C</span>
    <h2>여러 예식을 섞은 모자이크</h2>
    <p>여러 앨범의 사진을 섞어 큰 사진과 작은 사진이 리듬감 있게 이어지는 벽이에요.
       작업 폭과 색감을 한눈에 보여주기 좋고, 사진을 누르면 그 앨범으로 이동해요.</p>
  </div>
  <div class="chips" id="chips-c"></div>
  <div class="mosaic" id="mosaic"></div>
</section>

<p class="pick-note">시안 비교용 페이지예요. 마음에 드는 걸 고르시면 Gallery 페이지에 적용할게요.</p>
<script>window.__ALBUMS__ = {json.dumps(data, ensure_ascii=False)}; window.__UP__ = {json.dumps(up_base)};</script>
"""
    return body, CSS, JS

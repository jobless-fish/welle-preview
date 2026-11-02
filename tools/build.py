#!/usr/bin/env python3
"""Welle Fotografien 미리보기 사이트 생성기.

python3 tools/build.py 를 실행하면 루트에 HTML 페이지들이 만들어집니다.
- 사진은 아임웹 이미지 서버에서 작은 크기로 불러옵니다 (?w=폭)
- 앨범 데이터: _data/albums_part*.json
"""
import json, html, pathlib, hashlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
from texts import TERMS, PRIVACY  # noqa: E402


def ver(rel):
    """파일 내용이 바뀌면 주소 뒤 ?v= 값도 바뀌어 브라우저가 새 파일을 받음"""
    return hashlib.md5((ROOT / rel).read_bytes()).hexdigest()[:8]


CSS_V = ver("assets/css/style.css")
JS_V = ver("assets/js/site.js")

UP = "https://cdn-optimized.imweb.me/upload/S202210286ca7615864d67/"
THUMB = "https://cdn.imweb.me/thumbnail/20221028/"
INSTA = "https://www.instagram.com/wellefotografien/"
INSTA_HANDLE = "@wellefotografien"
KAKAO = "http://pf.kakao.com/_xctKEb"

# 홈 슬라이드: (파일, 인물 가로 위치 %, 세로 위치 %)
# 화면이 사진보다 납작해서 잘려야 할 때 이 지점을 기준으로 자름
HERO = [
    ("01dc0d6887bde.jpg", 50, 100),  # 건물 앞 커플 (맨 아래, 작게)
    ("13ce7d6670390.jpg", 52, 38),   # 차 안 신부
    ("85e99e32997b5.jpg", 70, 55),   # 축가
    ("97eb942cfe2b8.jpg", 78, 80),   # 무대 위 신부
    ("a0da35ef9aa74.jpg", 55, 36),   # 창가 신부 (머리가 위쪽)
    ("80cb9a5c5b443.jpg", 48, 65),   # 버진로드 커플
    ("a69d082147bcd.jpg", 52, 45),   # 하객 환호 속 커플
    ("bdcd999795096.jpg", 52, 78),   # 유리홀 커플 (작게)
    ("4aafe092e3fb3.jpg", 32, 80),   # 꽃장식 앞 커플
    ("3e225db7789e7.jpg", 48, 68),   # 하객과 커플
]
ORDER = [11, 10, 9, 7, 6, 4, 5, 3, 8]   # 현재 사이트의 갤러리 순서


def up(f, w):
    return f"{UP}{f}?w={w}"


albums = {}
for p in sorted((ROOT / "_data").glob("albums_part*.json")):
    for a in json.loads(p.read_text(encoding="utf-8")):
        albums[a["id"]] = a
albums = [albums[i] for i in ORDER]
for a in albums:
    a["cover"] = a["imgs"][0]
    a["photos"] = a["imgs"][1:] or a["imgs"]


NAV = [("index.html", "Home"), ("gallery.html", "Gallery"),
       ("product.html", "Product"), ("reservation.html", "Reservation")]

INSTA_ICON = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">'
              '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/>'
              '<circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>')


def page(title, active, body, extra_head="", extra_body="", body_class=""):
    nav = "".join(
        f'<a href="{href}"{" aria-current=\"page\"" if label == active else ""}>{label}</a>'
        for href, label in NAV)
    full_title = "WelleFotografien - 벨레포토그라피엔" if not title else f"{title} · Welle Fotografien"
    return f"""<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="referrer" content="no-referrer">
<meta name="robots" content="noindex">
<title>{html.escape(full_title)}</title>
<meta name="description" content="Welle Fotografien 벨레포토그라피엔 · 웨딩 본식 스냅">
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://cdn-optimized.imweb.me">
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500&family=Noto+Sans+KR:wght@300;400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/style.css?v={CSS_V}">
<script>
/* 이전 페이지에서 data-water 링크로 왔으면: 누른 위치를 전환 효과에 넘김 */
try{{var w=sessionStorage.getItem('welleWater');if(w){{sessionStorage.removeItem('welleWater');w=JSON.parse(w);var r=document.documentElement;
r.style.setProperty('--wx',(w.x*100).toFixed(1)+'%');r.style.setProperty('--wy',((1-w.y)*100).toFixed(1)+'%');
r.classList.add(('onpagereveal' in window)?'water-nav':'page-fade');setTimeout(function(){{r.classList.remove('water-nav','page-fade')}},2000);}}}}catch(e){{}}
</script>
{extra_head}
</head>
<body{f' class="{body_class}"' if body_class else ""}>
<header class="site-header">
  <div class="site-header__inner">
    <a class="logo" href="index.html" aria-label="Welle Fotografien 홈"><img src="assets/img/logo.svg" alt="Welle Fotografien" width="860" height="510"></a>
    <nav class="nav" aria-label="주 메뉴">{nav}</nav>
  </div>
</header>
<div class="header-space" aria-hidden="true"></div>
<main>
{body}
</main>
<footer class="site-footer">
  <a class="insta-link" href="{INSTA}" target="_blank" rel="noopener">{INSTA_ICON}{INSTA_HANDLE}</a>
  <div class="info">
    <span>상호명: Welle Fotografien</span><span>대표자: 김통일</span><span>연락처: 010-8283-7803</span>
    <span>사업자등록번호: 184-33-00892</span><span>이메일: wellefoto@naver.com</span>
  </div>
  <div class="copy">© 2021 Welle Fotografien All Rights Reserved.</div>
</footer>
<div class="toast" role="status" aria-live="polite"></div>
<script src="assets/js/site.js?v={JS_V}"></script>
{extra_body}
</body>
</html>
"""


def write(name, content):
    (ROOT / name).write_text(content, encoding="utf-8")
    print("wrote", name)


# ---------- Home ----------
slides = []
for i, (f, fx, fy) in enumerate(HERO):
    src = THUMB + f
    attr = f'src="{src}"' if i == 0 else f'data-src="{src}" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="'
    slides.append(f'<div class="hero__slide{" is-active" if i == 0 else ""}"><img {attr} alt="" '
                  f'width="1417" height="944" style="--fx:{fx}%;--fy:{fy}%" '
                  f'{"fetchpriority=\"high\"" if i == 0 else ""}></div>')

# 아래 영역: 갤러리 사진이 천천히 옆으로 흐르는 띠 (누르면 해당 앨범으로)
flow_pick = []
for a in albums:
    ph = a["photos"]
    for k in (len(ph) // 4, (len(ph) * 3) // 4):
        flow_pick.append((a["id"], a["title"], ph[k]))
flow_items = "".join(
    f'<a href="album-{aid}.html" aria-label="{html.escape(t)} 앨범 보기"><img src="{up(f, 520)}" alt="" decoding="async"></a>'
    for aid, t, f in flow_pick)

home_body = f"""
<section class="hero" aria-label="대표 사진 — 누르면 다음 사진">
  {''.join(slides)}
  <div class="hero__shade" aria-hidden="true"></div>
  <div class="hero__fade" aria-hidden="true"></div>
  <div class="hero__dots" role="group" aria-label="사진 넘기기"></div>
  <div class="hero__info">
    <a class="ig" href="{INSTA}" target="_blank" rel="noopener">{INSTA_ICON}<span>{INSTA_HANDLE}</span></a>
    <div class="row"><span>상호명: Welle Fotografien</span><span>대표자: 김통일</span><span>연락처: 010-8283-7803</span><span>사업자등록번호: 184-33-00892</span><span>이메일: wellefoto@naver.com</span></div>
    <div class="copy">© 2021 Welle Fotografien All Rights Reserved.</div>
  </div>
</section>
<section class="flow" aria-label="갤러리 미리보기">
  <div class="flow__stage">
    <div class="flow__track">
      <div class="flow__row">{flow_items}</div>
      <div class="flow__row" aria-hidden="true">{flow_items.replace('<a ', '<a tabindex="-1" ')}</div>
    </div>
    <a class="flow__hover" href="gallery.html" data-water aria-label="갤러리로 이동">
      <canvas class="flow__ripple" aria-hidden="true"></canvas>
      <span class="flow__label">Gallery <span aria-hidden="true">→</span></span>
    </a>
  </div>
  <a class="flow__cta" href="gallery.html" data-water>Gallery <span aria-hidden="true">→</span></a>
</section>
"""
intro = (ROOT / "tools" / "intro-snippet.html").read_text(encoding="utf-8")
write("index.html", page("", "Home", home_body, extra_body=intro, body_class="home"))

# ---------- Gallery ----------
cards = "".join(f"""
  <a class="album-card" href="album-{a['id']}.html">
    <div class="album-card__img"><img src="{up(a['cover'], 700)}" alt="{html.escape(a['title'])}" loading="lazy"></div>
    <div class="album-card__meta">
      <div class="album-card__title">{html.escape(a['title'])}</div>
      <div class="album-card__count">{len(a['photos'])} photos</div>
    </div>
  </a>""" for a in albums)
write("gallery.html", page("Gallery", "Gallery", f"""
<div class="container">
  <div class="page-head"><span class="eyebrow">Portfolio</span><h1>Gallery</h1></div>
  <div class="albums">{cards}
  </div>
</div>"""))

# ---------- Album pages ----------
for i, a in enumerate(albums):
    prev_a = albums[i - 1]
    next_a = albums[(i + 1) % len(albums)]
    photos = "".join(
        f'<a href="{up(f, 1600)}" data-lightbox><img src="{up(f, 640)}" alt="{html.escape(a["title"])} {n + 1}" loading="lazy"></a>'
        for n, f in enumerate(a["photos"]))
    write(f"album-{a['id']}.html", page(a["title"], "Gallery", f"""
<div class="container">
  <div class="page-head"><span class="eyebrow">Gallery</span><h1>{html.escape(a['title'])}</h1><p>{len(a['photos'])} photos</p></div>
  <div class="album-nav">
    <a href="album-{prev_a['id']}.html">‹ {html.escape(prev_a['title'])}</a>
    <a href="gallery.html">All</a>
    <a href="album-{next_a['id']}.html">{html.escape(next_a['title'])} ›</a>
  </div>
  <div class="masonry">{photos}</div>
</div>"""))

# ---------- Product ----------
ALBUM_SET = '11 x 14 스냅 + 원판 합본 1권<span class="sub">9 x 12 스냅 + 원판 합본 2권</span>'
product_body = f"""
<div class="container">
  <div class="page-head"><span class="eyebrow">Product</span><h1>Welle Fotografien 상품 구성 안내</h1></div>
  <ul class="notice">
    <li>촬영의 시작은 식 시작 한시간 반 전부터 연회장 또는 폐백까지 진행됩니다. (메이크업 촬영 시 아웃 한시간 전)</li>
    <li>사진 셀렉은 신부님 직접 셀렉으로 진행되며, 촬영 2주 후에 원본을 보내드립니다.</li>
    <li>모든 촬영의 색보정과 리터칭은 대표가 직접 진행합니다.</li>
    <li>서울/경기 이외의 지역은 출장비가 있습니다.</li>
    <li class="note">사진의 색감은 장소, 날씨, 조명에 따라 다를 수 있으며, 예식 일시 및 장소가 정해지지 않으면 예약이 불가합니다.</li>
  </ul>

  <section class="pkg">
    <div class="pkg__head"><h2>상품A (엘범형)</h2><span>Album</span></div>
    <table class="pkg-table">
      <thead><tr><th></th><th>대표촬영</th><th>실장촬영</th></tr></thead>
      <tbody>
        <tr><th>촬영범위</th><td>신부대기실 ~ 폐백<small>(또는 연회장)</small></td><td>신부대기실 ~ 폐백<small>(또는 연회장)</small></td></tr>
        <tr><th>제공품</th><td>사진의 원본 및 수정본 60장<span class="sub">{ALBUM_SET}</span></td><td>사진의 원본 및 수정본 50장<span class="sub">{ALBUM_SET}</span></td></tr>
      </tbody>
    </table>
  </section>

  <section class="pkg">
    <div class="pkg__head"><h2>상품B (데이터형)</h2><span>Data</span></div>
    <table class="pkg-table">
      <thead><tr><th></th><th>대표촬영</th><th>실장촬영</th></tr></thead>
      <tbody>
        <tr><th>촬영범위</th><td>신부대기실 ~ 폐백<small>(또는 연회장)</small></td><td>신부대기실 ~ 폐백<small>(또는 연회장)</small></td></tr>
        <tr><th>제공품</th><td>사진의 원본 및 수정본 60장</td><td>사진의 원본 및 수정본 50장<small>(데이터형)</small></td></tr>
      </tbody>
    </table>
  </section>

  <section class="pkg">
    <div class="pkg__head"><h2>추가상품</h2><span>Options</span></div>
    <table class="pkg-table">
      <thead><tr><th></th><th>엘범<small>(데이터형 선택 시)</small></th><th>메이크업 촬영</th><th>2인촬영</th></tr></thead>
      <tbody>
        <tr><th>세부사항</th><td>{ALBUM_SET}</td><td>엘범 10p 추가<small>(아웃 한시간 전부터 촬영)</small></td><td>보정본 + 엘범 10p 추가</td></tr>
      </tbody>
    </table>
  </section>

  <div class="cta-row"><a class="btn" href="reservation.html">Reservation</a></div>
</div>"""
write("product.html", page("Product", "Product", product_body))

# ---------- Reservation (더미) ----------
def choice(name, value, label, typ="radio"):
    return f'<label class="choice"><input type="{typ}" name="{name}" value="{value}"><span>{label}</span></label>'

products = ["본식스냅 대표촬영(엘범형)", "본식스냅 실장촬영(엘범형)", "본식스냅 대표촬영(데이터형)",
            "본식스냅 실장촬영(데이터형)", "야외촬영", "가봉스냅"]
yn_rows = "".join(
    f'<div class="yn"><span>{label}</span><div class="choices">{choice(key, "y", "유")}{choice(key, "n", "무")}</div></div>'
    for key, label in [("makeup", "메이크업 촬영"), ("pyebaek", "폐백"), ("two", "2인촬영")])

reservation_body = f"""
<div class="container">
  <div class="page-head"><span class="eyebrow">Contact</span><h1>Reservation</h1></div>
  <div class="consult">
    <p>하단 버튼의 카카오톡 채널을 통해 구체적인 견적 및 일정상담이 가능합니다.</p>
    <p>주말의 경우 촬영으로 인하여 답변이 늦을 수 있으니 양해 부탁드립니다.</p>
    <a class="btn btn--kakao" href="{KAKAO}" target="_blank" rel="noopener">카카오톡 채널로 상담하기</a>
  </div>
  <div class="divider"></div>

  <section class="contract" id="contract">
    <h2>Contract</h2>
    <p class="lead">상담이 완료되신 분들은 아래에서 계약서를 작성해주시기 바랍니다.</p>
    <span class="demo-badge">미리보기용 화면 · 실제로 접수되지 않습니다</span>
    <form id="contract-form" novalidate>
      <div class="field">
        <span class="label">스튜디오 약관</span>
        <div class="terms">{html.escape(TERMS)}</div>
        <label class="check"><input type="checkbox" name="agree_terms"> 스튜디오 약관에 동의합니다</label>
      </div>
      <div class="field"><label for="f-name">이름 <span class="hint">신랑님 / 신부님</span></label><input class="input" id="f-name" name="name" autocomplete="off"></div>
      <div class="field"><label for="f-tel">전화번호</label><input class="input" id="f-tel" name="tel" inputmode="tel" autocomplete="off"></div>
      <div class="field"><label for="f-place">예식장소</label><input class="input" id="f-place" name="place" autocomplete="off"></div>
      <div class="field"><span class="label">예식날짜</span>
        <div class="row-2"><input class="input" type="date" name="date" aria-label="예식 날짜"><input class="input" type="time" name="time" aria-label="예식 시간"></div>
      </div>
      <div class="field"><span class="label">상품선택</span>
        <div class="choices">{''.join(choice('product', i, p) for i, p in enumerate(products))}</div>
      </div>
      <div class="field"><span class="label">추가 선택</span>{yn_rows}</div>
      <div class="field"><label for="f-payer">예약금 입금자명
        <span class="hint">신한 110-531-452310 김통일 (벨레포토그라피엔) · 계약금 100,000원</span></label>
        <input class="input" id="f-payer" name="payer" autocomplete="off"></div>
      <div class="field"><label for="f-memo">비고</label><textarea class="textarea" id="f-memo" name="memo"></textarea></div>
      <div class="field">
        <details class="privacy"><summary>개인정보 수집 및 이용 동의 (전문 보기)</summary><div class="terms">{html.escape(PRIVACY)}</div></details>
        <label class="check"><input type="checkbox" name="agree_privacy"> 개인정보 수집 및 이용에 동의합니다.</label>
      </div>
      <div class="submit-row"><button class="btn btn--solid" type="submit">작성하기</button></div>
    </form>
  </section>
</div>"""
write("reservation.html", page("Reservation", "Reservation", reservation_body))

# ---------- 갤러리 시안 비교 페이지 ----------
from gallery_ideas import build as build_ideas  # noqa: E402
_ideas_body, _ideas_css, _ideas_js = build_ideas(albums, UP)
write("gallery-ideas.html", page("Gallery 시안", "Gallery", _ideas_body,
                                 extra_head=_ideas_css, extra_body=_ideas_js))

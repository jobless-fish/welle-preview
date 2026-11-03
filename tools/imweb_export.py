"""
아임웹 코드 위젯용 조각 만들기
- 빌드된 페이지(index.html 등)에서 본문만 뽑아, 아임웹 페이지의 코드 위젯 하나에 붙여 넣을 수 있는 형태로 만든다.
- CSS·JS·로고 등은 깃 저장소를 jsDelivr(CDN) 주소로 불러온다 → 아임웹에는 이 조각만 넣으면 됨.
- 아임웹 기본 헤더·푸터·다른 섹션은 숨기고, 우리 화면을 body 바로 아래로 옮겨서 아임웹 틀의 여백·스타일과 섞이지 않게 한다.

사용: python3 tools/imweb_export.py <커밋 해시> [출력 폴더]
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SHA = sys.argv[1]
OUT = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "tools" / "imweb_out"
CDN = f"https://cdn.jsdelivr.net/gh/jobless-fish/welle-preview@{SHA}/"
PREVIEW = "https://jobless-fish.github.io/welle-preview/"

# 테스트 단계: 홈 외의 페이지는 아직 아임웹에 없으니 깃 미리보기 주소로 연결
LINKS = {
    "index.html": "#",
    "gallery.html": PREVIEW + "gallery.html",
    "product.html": PREVIEW + "product.html",
    "reservation.html": PREVIEW + "reservation.html",
}

HIDE_CSS = """<style>
/* 아임웹 기본 화면 숨기기 (우리 화면이 올라간 페이지에서만) */
html.welle-mount #doz_header_wrap,
html.welle-mount #doz_footer_wrap,
html.welle-mount body > .section_wrap,
html.welle-mount #site_alarm_slidemenu_container,
html.welle-mount .alpha_instagram_feed { display: none !important; }
html.welle-mount body { margin: 0 !important; padding: 0 !important; }
/* 아임웹 기본 글꼴·글자 간격이 우리 화면에 섞이지 않게 */
html.welle-mount body { font: 400 14px/1.75 var(--sans) !important; color: var(--ink-soft) !important; letter-spacing: -0.01em !important; word-break: keep-all !important; }
html.welle-mount:not(.no-scroll) body { background: var(--paper) !important; }
html.welle-mount.no-scroll body { background: transparent !important; }
</style>"""


def export(name: str) -> str:
    src = (ROOT / name).read_text(encoding="utf-8")
    head_inline = re.search(r"<script>\s*/\* 이전 페이지에서.*?</script>", src, re.S).group(0)
    body_cls = (re.search(r'<body(?: class="([^"]*)")?>', src).group(1) or "").split()
    body = src.split("<body", 1)[1].split(">", 1)[1].rsplit("</body>", 1)[0]
    # site.js 태그는 빼고(아래 로더가 불러옴), 그 뒤의 인트로 등 나머지 스크립트는 그대로 둠
    m = re.search(r'<script src="assets/js/site\.js[^"]*"></script>', body)
    markup, rest = body[:m.start()], body[m.end():]
    rest = re.sub(r"<!--.*?-->", "", rest, flags=re.S)   # 아임웹은 주석을 지우므로 미리 정리

    def fix(html: str) -> str:
        for page, url in LINKS.items():
            html = html.replace(f'href="{page}"', f'href="{url}"')
        html = re.sub(r'href="(album-\d+\.html)"', lambda mm: f'href="{PREVIEW}{mm.group(1)}"', html)
        html = html.replace('src="assets/', f'src="{CDN}assets/').replace('href="assets/', f'href="{CDN}assets/')
        return html

    loader = f"""<script>
(function () {{
  var R = document.getElementById('welle-root'); if (!R) return;
  var H = document.documentElement, B = document.body;
  H.classList.add('welle-mount');
  {''.join(f"B.classList.add('{c}');" for c in body_cls)}
  var frag = document.createDocumentFragment();
  while (R.firstChild) frag.appendChild(R.firstChild);
  B.insertBefore(frag, B.firstChild);
  R.parentNode.removeChild(R);
  var s = document.createElement('script'); s.src = '{CDN}assets/js/site.js'; B.appendChild(s);
}})();
</script>"""

    fonts = ('<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500&family=Noto+Sans+KR:wght@300;400;500'
             '&family=Noto+Serif+KR:wght@400;500&family=Domine:wght@400;500&display=swap" rel="stylesheet">')
    parts = [
        fonts,
        f'<link rel="stylesheet" href="{CDN}assets/css/style.css">',
        HIDE_CSS,
        head_inline,
        f'<div id="welle-root">{fix(markup)}</div>',
        loader,
        fix(rest),
    ]
    return "\n".join(parts)


OUT.mkdir(parents=True, exist_ok=True)
for page in ["index.html"]:
    code = export(page)
    out = OUT / ("imweb_" + page.replace(".html", ".txt"))
    out.write_text(code, encoding="utf-8")
    print(out, len(code), "chars")

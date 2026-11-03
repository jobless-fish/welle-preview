"""
아임웹 '상품'(Gallery 메뉴)을 사이트 갤러리 데이터로 가져오기
- 아임웹 Gallery 목록 페이지의 순서 = 사이트 갤러리 순서
- 상품마다: 대표 이미지 + 상세설명에 올린 사진들(올린 순서 그대로)
- 결과: _data/albums.json  →  build.py가 이 파일로 갤러리·앨범 페이지를 만듦

깃허브 Actions가 30분마다 실행 → 사장님이 아임웹에 상품을 올리거나 순서를 바꾸면 자동으로 반영
사용: python3 tools/sync_imweb.py
"""
import html
import json
import re
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "_data" / "albums.json"
# 아임웹 기본 주소를 먼저 씀 (나중에 wellefotografien.com을 새 사이트로 옮겨도 계속 동작)
BASES = ["https://wellefotografien.imweb.me", "https://wellefotografien.com"]
LIST_PATH = "/30"            # 아임웹의 Gallery(상품 목록) 메뉴 주소
FILE_RE = re.compile(r"/upload/[^/\"']+/([0-9a-f]{10,}\.(?:jpe?g|png|webp))", re.I)
UA = "Mozilla/5.0 (compatible; WelleGallerySync/1.0)"


def get(url: str) -> str:
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read().decode("utf-8", "replace")
        except Exception as e:  # 잠깐 실패하면 다시
            if attempt == 2:
                raise
            print("  재시도:", url, e)
            time.sleep(3)


def pick_base() -> str:
    for b in BASES:
        try:
            if "?idx=" in get(b + LIST_PATH):
                return b
        except Exception as e:
            print("접속 실패:", b, e)
    sys.exit("아임웹 갤러리 목록을 불러오지 못했어요 (기존 데이터 유지)")


def product_ids(base: str):
    ids = []
    for page in range(1, 30):   # 목록이 여러 쪽이면 새 번호가 안 나올 때까지
        t = get(f"{base}{LIST_PATH}?page={page}")
        new = [int(x) for x in re.findall(re.escape(LIST_PATH) + r"/\?idx=(\d+)", t)]
        new = [x for x in dict.fromkeys(new) if x not in ids]
        if not new:
            break
        ids += new
    return ids


def album(base: str, idx: int):
    t = get(f"{base}{LIST_PATH}/?idx={idx}")
    m = re.search(r'<meta property="og:title" content="([^"]*)"', t)
    title = html.unescape(m.group(1)).split(" : ")[0].strip() if m else str(idx)
    # 대표 이미지(상품 사진) — 'item _item' 칸 안의 이미지
    mains = re.findall(r'class="item _item"[^>]*>.*?<img[^>]+src="([^"]+)"', t, re.S)
    # 상세설명 사진 — PC용 상세 템플릿 안, 올린 순서대로
    tpl = re.search(r'<template id="prodDetailPC">(.*?)</template>', t, re.S)
    details = re.findall(r'<img[^>]+src="([^"]+)"', tpl.group(1)) if tpl else []
    files = []
    for src in mains + details:
        mm = FILE_RE.search(src)
        if mm and mm.group(1) not in files:
            files.append(mm.group(1))
    return {"id": idx, "title": title, "imgs": files}


def main():
    base = pick_base()
    print("가져오는 곳:", base)
    ids = product_ids(base)
    print("상품 순서:", ids)
    albums = []
    for idx in ids:
        a = album(base, idx)
        print(f"  {idx} {a['title']}: 사진 {len(a['imgs'])}장")
        if len(a["imgs"]) >= 2:          # 대표 + 사진 1장 이상일 때만
            albums.append(a)
    if not albums:
        sys.exit("가져온 앨범이 없어요 (기존 데이터 유지)")
    new = json.dumps(albums, ensure_ascii=False, indent=1) + "\n"
    old = OUT.read_text(encoding="utf-8") if OUT.exists() else ""
    if new == old:
        print("변경 없음")
        return
    OUT.write_text(new, encoding="utf-8")
    print("갱신:", OUT)


if __name__ == "__main__":
    main()

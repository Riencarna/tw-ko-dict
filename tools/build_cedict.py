# CC-CEDICT 원본(raw/cedict_ts.u8)을 앱에서 쓰는 data/cedict-data.js 로 변환합니다.
# 사용법: python -I tools/build_cedict.py raw/cedict_ts.u8 data/cedict-data.js
import json
import re
import sys

src, dst = sys.argv[1], sys.argv[2]
line_re = re.compile(r"^(\S+) (\S+) \[([^\]]*)\] /(.*)/\s*$")
tw_re = re.compile(r"Taiwan pr\. \[([^\]]+)\]")

out = []
with open(src, encoding="utf-8") as f:
    for line in f:
        if line.startswith("#"):
            continue
        m = line_re.match(line)
        if not m:
            continue
        trad, simp, pinyin, gloss = m.groups()
        parts = gloss.split("/")
        tw_pin = ""
        kept = []
        n_syl = len(pinyin.split())
        for p in parts:
            # "Taiwan pr. [le4 se4]" 처럼 조각 전체가 발음 정보일 때만 단어 전체의 대만 발음으로 본다.
            # 특정 뜻에만 해당하는 발음(괄호 안에 적힌 것)은 뜻풀이에 그대로 둔다.
            t = tw_re.fullmatch(p.strip())
            if t and not tw_pin:
                cand = re.sub(r"([1-5])(?=[A-Za-z])", r"\1 ", t.group(1)).strip()
                if len(cand.split()) == n_syl:
                    tw_pin = cand
                    continue
            kept.append(p)
        flags = ""
        if "(Tw)" in gloss:
            flags += "T"
        if "(PRC)" in gloss:
            flags += "P"
        fields = [trad, "" if simp == trad else simp, pinyin, tw_pin, flags, "/".join(kept)]
        out.append("\t".join(x.replace("\t", " ") for x in fields))

with open(dst, "w", encoding="utf-8", newline="\n") as f:
    f.write("window.CEDICT_RAW=")
    f.write(json.dumps("\n".join(out), ensure_ascii=False))
    f.write(";\n")

print(len(out), "entries")

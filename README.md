# 台韓 사전 — 대만 중국어–한국어 사전

대만에서 쓰는 중국어(번체자·주음부호·대만식 발음과 어휘)를 한국어로 찾아보는 웹 사전입니다.

- 번체자, 한국어, 병음, 주음부호(ㄅㄆㄇ), 영어로 검색
- 대만식 발음 우선 표시, 본토 표현·발음과의 차이 안내
- 손으로 써서 찾기(검색창의 연필 버튼, 인터넷 없이 동작)
- 두 글자 이상인 단어에서 글자를 누르거나 예문 속 단어를 누르면, 화면을 옮기지 않고 그 자리에서 뜻을 표시
- 단어장, 최근 본 단어, 내 단어 추가
- 휴대폰 홈 화면에 추가하면 앱처럼 쓸 수 있고, 한 번 연 뒤에는 오프라인에서도 열립니다

## 데이터

- `data/ko-data*.js` — 직접 작성한 한국어 뜻풀이
- `data/cedict-data.js` — [CC-CEDICT](https://cc-cedict.org/)를 가공한 영어 뜻풀이
  (CC BY-SA 4.0, `tools/build_cedict.py`로 변환). 한국어 뜻풀이가 없는 단어에 쓰입니다.
- `lib/hanzilookup.min.js` — 필기 인식 엔진 [HanziLookupJS](https://github.com/gugray/HanziLookupJS) (GNU GPL)
- `data/hanzi-strokes.js` — 필기 인식용 획 데이터(HanziLookupJS의 `mmah.json`,
  [Make Me a Hanzi](https://github.com/skishore/makemeahanzi)에서 파생, Arphic Public License). 자세한 내용은 `lib/NOTICE.txt`.

## 고쳐서 올리기

```
python -I tools/deploy.py <GitHub계정>/<저장소이름>
```

바뀐 파일만 GitHub에 올립니다(GitHub CLI `gh` 로그인 필요).

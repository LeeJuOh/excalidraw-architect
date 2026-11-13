# ③ 변경 표시·필드 형식 재조사

대상: 그림에서 추가·변경·삭제·그대로를 요소(박스·화살표·카드)와 필드(계약 필드·표 카드 컬럼) 단위로 표시하는 방식. 계약 필드에 타입과 값 중 무엇을 쓰는지.
조사: 2026-11-14 열두 번째 세션. 서브에이전트 셋이 읽었다. 에이전트는 이미지를 직접 확인하지 않았다. [img]는 서브에이전트의 이미지 확인, [doc]은 문서, [code]는 코드, [inf]는 추론.
배경: 11-13 결정(기호 없음·`+`·`Δ 전 → 후`·`−`, 회색·초록·파랑·빨강)은 레포 2곳만 보고 정했다. ADR-0015(수정됨은 노랑, 계약 안은 `+`·`−` 줄만)도 재개편 대상이다.

| 레포 | 커밋 | 변경 표시 | 근거 | 필드 형식 |
|---|---|---|---|---|
| whiteboard | `16d979ca` | 요소만. 테두리 색 추가 초록·수정 호박색·삭제 빨강. 삭제는 점선 테두리, opacity 0.75, 취소선. 제목줄에 `+n −n`. 필드 단위 없음. 그대로는 흐리게 하지 않음 | [code] `SoftwareMap.tsx:3759-3768,3296-3307,2661-2720` | 타입 우선, 없으면 `example`. 화면에는 타입만 나옴 [inf] `c4-projection.ts:428-429` |
| archify | `a4065941` | Before·Delta·After 전환. 범례 `+ ADD` 초록 실선, `− DEL` 빨강 파선, `~ MOD` 노랑 점선, `↔ MOVE` 하늘색 이중선. 모서리 원형 기호 배지. 이동 전 자리는 유령(opacity .42). 그대로는 opacity .38. 필드는 그림 밖 변경 목록에 JSON 포인터로, old → new는 `field: base → head` | [code] `architecture-delta.mjs:395,784-785,184-194`, [img] `docs/assets/architecture-delta-proof.jpg` | 타입만. 예시는 모양일 뿐 실제 값이 아님 [doc] `authoring-contract.md:340-351` |
| humanlayer-skills (show-me) | `4d69d20` | 그림 대신 unified `diff` 블록. 줄 앞 `+`·`-`·공백 맥락. 변경은 `-old`·`+new` 두 줄 | [doc] `rpi/.../show-me.md:58-108`, `visual-pr/SKILL.md:31-39` | 정하지 않음. "real labels and data" [doc] `pr_description_template.md:16-19` |
| visual-explainer | `9d5f880` | 새 것 초록 파선 테두리. 없어진 것 빨강 짧은 파선, opacity .7, 취소선, 화살표 가운데 `✕`. 계획 문서 호출 트리는 `+ − ~ ?` 레일 열, 추가 초록 띠, 수정 호박색 레일. `+12 −3` 표시 | [code] `kit/kit.css:178-183`, `plan/plan.css:202-206`, [doc] `references/plans.md:90` | 없음. "key fields in mono"만 [doc] `references/diagrams.md:25` |
| answer-me-with-html | `053619b` | 줄 앞 `+ - ~`. 추가 초록·삭제 빨강·변경 호박색. 요소는 테두리·글자색·원형 기호 배지, 삭제는 opacity .55와 취소선. 행은 옅은 배경 띠 + 부호 열 + 색 글자. `~`는 이전 값을 보이지 않음. 카운트 행, Before·Changes·After 전환 | [code] `src/components/er.js:364-387`, `src/themes/delta.css:9-47` | 타입만(`name [type] [PK]`). "Do not invent data" [doc] `SKILL.md:150,163` |
| effective-html | `5ce160a` | 없음 | [doc] `skills/html/SKILL.md:63` | 없음. 실제 내용 쓰기 일반 규칙만 |
| diagram-design | `e57eda6` | Before·Changes·After 세 패널. 노드 머리글 `기호 id · 상태`, 기호 `= + − ~ ↔`(문서는 changed에 `Δ`, 이미지·예제는 `~`). 선 모양 그대로 실선·추가 이중선·삭제 파선·이동 점선, 변경은 왼쪽 굵은 띠 + 틴트. 가운데 목록에 `CHANGED · api / Orders API v1 → v2`. 그대로는 "PRESERVED" 한 줄로 접음. 색은 보조 | [img] `docs/screenshots/architecture-delta.png`, [doc] `references/type-architecture-delta.md:14,21,26-35`, [code] `assets/example-architecture-delta.html:68-93` | 실제 SQL 타입만, 타입 누락은 안티패턴 [doc] `references/type-db-schema.md:3,12,38` |
| excalidraw-diagram-skill | `8646fcc` | 없음. Side-by-Side 비교 패턴만, opacity 100 강제 | [doc] `SKILL.md:93,303-304` | 실제 값 위주. 실제 JSON을 찾아 넣기 필수 [doc] `SKILL.md:49,55-61,79` |
| Understand-Anything | `98d6dca` | 노드만. 바뀐 것 빨간 링 + glow, 영향받는 1-hop 노란 링, 무관한 노드 opacity 0.25 + 채도 낮춤. 추가·삭제 구분 없음 | [code] `CustomNode.tsx:127-132`, `index.css:49-52,199-211`, `GraphView.tsx:576-603` | 없음 |
| pr-lens | `12da0b0` | 카드 우상단 `NEW`·`CHANGED`·`REMOVED` 배지와 요약 배지(`−1 column`). 테두리 녹·주황·적. 삭제 카드는 파선, 제목 취소선, opacity 0.55. 그대로 카드 0.82. 행은 기호 없이 추가 녹색 글자, 삭제 빨간 글자 + 취소선, 수정은 타입 칸만 `int`(흐림·취소선) `→ bigint`. 그대로 행은 `+ 19 unchanged columns`로 접음 | [code] `packages/renderer/src/svg/datamodel.ts:71-139,185-217`, `styles.ts:27-58`, `test/__goldens__/billing-org.data-model.light.svg` | 데이터 모델은 타입만, 값이 들어가면 거부. 흐름의 `payload`는 섞음(`type`·`shape`, 변경 후 `sample`, `before`, `source` fixture 경로) [doc] `packages/schema/README.md:81`, `agent-skill/references/graph-document.md:119-149` |
| drawio-skill | `053600a` | 채움 + 테두리 색. 추가 녹·삭제 적 + 파선·변경 주황·이동 보라·그대로 회색. IR 반영 경로는 삭제를 남김(노드 파선 opacity 45). old → new 없음 | [code] `scripts/drawiodiff.py:6-12,40-41,53-63`, `diagram_ir.py:1291-1298` | proto는 `name: type`. OpenAPI 스키마는 이름과 `(N fields)`만 [code] `protoimports.py:464`, `openapiimports.py:120-124` |
| open-design | `87a4f91c3` | 없음 | [doc] `skills/hand-drawn-diagrams/SKILL.md` | 없음 |
| anatomy | `1482e84` | 없음. 가까운 것은 강조 하나만 두고 나머지 톤 낮추기 | [doc] `SKILL.md:113,115`, `references/kit.md:122` | 없음. 실제 단위 값 readout만 |
| system-design-101 | `b28380a` | Avro: before·after 표를 나란히, 새 열 머리 분홍, 제목 "(schema updated)", 스키마 JSON의 추가 필드 빨간 글자, old·new 데이터 화살표 색. Twitter: 점선 화살표 = 다음 세대(범례), 박스 안 "(being deprecated)". Netflix: 단계 스냅샷 | [img] `data/guides/smooth-data-migration-with-avro.md:14`, `twitter-architecture-2022-vs-2012.md:14`, `evolution-of-the-netflix-api-architecture.md:14`(원격 이미지) | 섞음. 데이터 표는 예시 값, 스키마 JSON은 타입 |
| system-design-primer | `ae9bbd7` | 없음. 단계별 전체 스냅샷, 변경은 본문 불릿 | [img] `solutions/system_design/scaling_aws/scaling_aws_2.png`, [doc] `scaling_aws/README.md:154-252` | 섞음. DDL은 타입, API는 curl·JSON 예시 값 [doc] `pastebin/README.md:111-117,151-189` |
| stack-diagram | `1ed53e3` | 없음. 점선은 개발·배포 관계 | [doc] `skills/stack-diagram/SKILL.md:34-37` | 없음 |
| system-design-academy | `8085013` | 없음(README 색인) | [doc] `README.md:193` | 없음 |

## 변경 표시의 서로 다른 방식

1. 글자 기호. 요소 머리글(`= + − ~ ↔`, diagram-design) 또는 모서리 원형 배지(archify, answer-me-with-html).
2. 글자 배지 `NEW`·`CHANGED`·`REMOVED`와 요약 배지(pr-lens).
3. 상태 색. 수정은 호박색·주황·노랑이 다수(whiteboard, answer-me-with-html, visual-explainer, pr-lens, drawio-skill, archify). 파랑은 없다.
4. 선 모양. 삭제 파선이 다수. 이동 점선·이중선, 추가 이중선, 변경 왼쪽 띠.
5. 삭제는 취소선 + 흐리게. 지우지 않고 남긴다.
6. 그대로를 흐리게(archify .38, pr-lens .82, Understand-Anything .25) 또는 접기(pr-lens 행, diagram-design PRESERVED).
7. 필드 행 표시. 부호 열 + 옅은 띠(answer-me-with-html), 기호 없이 글자색 + 취소선(pr-lens), 그림 밖 목록(archify).
8. old → new. 타입 칸 안 `옛(취소선) → 새`(pr-lens), 그림 밖 목록(diagram-design, archify). 다수는 보이지 않는다.
9. Before·Changes·After 전환 또는 나란히(archify, answer-me-with-html, diagram-design, system-design-101).
10. 카운트 요약 `+n −n`.
11. 텍스트 diff 줄 접두(show-me).
12. changed와 affected 구분(Understand-Anything).

## 필드 형식

- 타입만: diagram-design, archify, answer-me-with-html, pr-lens 데이터 모델, drawio-skill.
- 섞음: pr-lens 흐름 `payload`(타입 + 변경 후 sample + fixture 경로), system-design-101, system-design-primer.
- 실제 값 위주: excalidraw-diagram-skill.
- 11-13 결정(타입 기본, 판단에 필요한 곳만 코드·테스트·로그에서 찾은 값)과 어긋나는 방식은 없다. pr-lens `payload`가 같은 방향이다.

## 결정

수정은 `~`와 파랑(`#1971c2`)으로 정했다. 필드 행은 `+`·`~`·`−`, 박스는 글자 배지 `NEW`·`CHANGED`·`REMOVED`. 조사 다수(호박색)와 다르지만 11-13에 사용자가 주황을 기각하고 파랑을 골랐다. 캔버스 스냅샷 `session12-parts-defaults`.

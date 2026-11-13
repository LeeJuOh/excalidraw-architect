# ③-2 계약 블록 모양 조사

대상: 바뀐 API 계약을 그림 밖 목록에 둘 때 블록의 머리와 틀. 몸통 필드 형식은 따로 정한다.
조사: 2026-11-14 열한 번째 세션. 서브에이전트 셋이 읽었다. [img]는 이미지 확인, [doc]은 문서, [code]는 코드, [inf]는 추론.
캔버스 스냅샷: `session11-q2-contract-eight`.

| 레포 | 커밋 | 방식 | 근거 |
|---|---|---|---|
| pr-lens | `12da0b0` | 2. 제목 + `Type → Type` 부제, 아이콘·띠 없음, Request/Response 탭, Shape/Sample. 3. 카드 머리줄(아이콘 칩 + 제목 + mono 부제 + 구분선) | [img] `docs/showcase/welcome.payload.gif`, [code] `packages/renderer/src/svg/architecture.ts:107-150`, `datamodel.ts:177-228` |
| whiteboard | `16d979ca` | 7. 코드 카드(TS 배지, 파일 경로, `A` 표시, 시그니처) | [img] `docs/assets/diagram-to-code.webp`, [doc] `packages/review/instructions/authoring.md:34` |
| archify | `a4065941` | 4. UML interface 상자(색 머리 띠, 글자 칩, `«interface»`). 8. 색 점 + 제목 + 목록 카드 | [img] `examples/class-payment-processors-rendered.html` 렌더, [code] `renderers/class/render-class.mjs:96-100` |
| humanlayer-skills (show-me) | `4d69d20` | 1. `diff`/`ts` 코드 블록 | [doc] `plugins/show-me/skills/show-me/SKILL.md:59-116` |
| visual-explainer | `9d5f880` | 없음. 화살표 라벨과 큰 확대 그림만 | [doc] `references/diagrams.md:25,76` |
| Understand-Anything | `98d6dca` | 5. 위에 종류 태그, 왼쪽 색 줄, `METHOD /path`, 필드 없음 | [code] `CustomNode.tsx:18,48`, [inf] ENDPOINT 모양 |
| diagram-design | `e57eda6` | 4. 머리 띠 + `TABLE` 태그(표 카드). 5. 위 표시 `~ api · CHANGED` | [img] `docs/screenshots/db-schema.png`, `architecture-delta.png`, [doc] `type-db-schema.md:11-14` |
| excalidraw-diagram-skill | `8646fcc` | 1. 어두운 코드 블록(실제 JSON) | [doc] `SKILL.md:58,78-79`, `references/color-palette.md:42-49` |
| answer-me-with-html | `053619b` | 없음. 엔티티 상자(이름 + 구분선 + `name type`)만 | [code] `src/components/er.js:364-387` |
| effective-html | `5ce160a` | 없음. 경로를 고르면 그림 밖 단계 패널 | [img] `site/public/catalog/featured/workspaces-architecture-poster.jpg` |
| drawio-skill | `053600a` | 4 계열. `«service»` 카드, `Rpc(Req): Resp`. OpenAPI는 메서드 색 노드 한 줄 | [code] `scripts/protoimports.py:429-436`, `openapiimports.py:26-31` |
| open-design | `87a4f91c3` | 없음 | [doc] `design-templates/docs-page`, `skills/hand-drawn-diagrams` |
| system-design-101 | `b28380a` | 6. 점선 콜아웃, 형식 이름 제목(`JSON`), 리더선 | [img] `how-does-grpc-work.md:14` → `0210-grpc.png` |
| system-design-primer | `ae9bbd7` | 1. 그림 아래 curl 블록 + "Response:" + JSON 블록 | [doc] `solutions/system_design/pastebin/README.md:149-189` |
| stack-diagram | `1ed53e3` | 없음. 화살표 라벨 1~2단어 | [doc] `skills/stack-diagram/references/geometry.md:53` |
| system-design-academy | `8085013` | 없음(README 색인). 링크 글은 `Field | Description` 표 + JSON 예시 | [doc] systemdesign.one 접속 상태 글 |
| anatomy | `1482e84` | 없음. 그림 안 라벨을 금지 | [doc] `SKILL.md:115` |

## 서로 다른 방식

1. 코드 블록, 머리 없음.
2. 제목 + 타입 부제.
3. 아이콘 + 제목 + 부제 + 구분선. 정한 표 카드 나-1과 같다.
4. 머리 띠 + 종류 태그. 지금 정한 다.
5. 위에 종류 표시 + 왼쪽 색 줄.
6. 점선 콜아웃 + 형식 제목.
7. 코드 카드(파일 배지 + 경로).
8. 색 점 + 제목 + 불릿.

## 결정

4번(회색 머리 띠 + 종류 태그)을 유지한다. 에이전트 추천은 3번이었고 사용자가 "4가 나은거같은데"라고 답했다. 표 카드 머리줄도 4번에 맞췄다(스냅샷 `session11-table-header-ab`).

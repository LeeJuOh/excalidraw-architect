---
topic: drawio-mcp-comparison
date: 2026-09-19
---

# drawio-mcp 비교 → archdraw 반영 후보 4개 (1번 완료, 2번부터 재개)

## Goal

`references/drawio-mcp/`(jgraph 공식) 비교에서 골라낸 관행 4개를 하나씩 결정해 이슈에 반영한다. 1번(규격 SSOT)은 이 세션에서 결정·반영·커밋까지 끝났다. 남은 것은 2번(좌표 규칙)·4번(서버 normalize)·07 박스 강등 갭·작은 것들.

## First Action

`/grill-with-docs`로 **2번 좌표 규칙 Q1**을 사용자에게 **하나만** 묻는다. 질문 전에 맥락 두 줄: drawio는 LLM에게 "x,y 계산 말고 열·행 번호만 정하고 공식(열×간격+여백)으로 찍어라, 다시 검토 말라"고 못 박는다(`references/drawio-mcp/shared/xml-reference.md` 첫 절). 적용 범위는 에이전트가 백지에서 새로 그리는 요소만 — 사용자가 옮긴 요소·초안 정식화는 PRD "사용자가 옮긴 배치 = 정답"대로 사용자 배치 우선.

> **Q1 좌표 계산 주인**: (a) 에이전트가 규격 md의 그리드 공식으로 직접 찍음, 서버 변경 없음 (b) 서버가 노드·열·행만 받아 배치, 새 이슈 (c) 지금은 (a), 02 도그푸딩에서 겹침·선 엉킴 반복되면 (b)로 승격. 추천 (c).

답 받으면 Q2(박스 크기)·Q3(종류별 열·행 의미)를 순서대로 하나씩. 아래 "2번 남은 질문" 참조.

## Context

세션 흐름: 큰그림 보고 → 1번 착수 → 사용자가 "서버 코드 고치는 거냐" → (a) 서버가 스킬 파일 읽기 vs (b) 툴 삭제 논쟁 → 사용자가 "MCP-only 사용자도 챙기자, 포크니까 서버 수정 OK" → `/research`로 MCP 스펙·공식 서버 관행 조사 → 제3안(서버 md → `instructions`+`resources`, 툴 삭제) 확정 → 사용자 요청으로 MCP 기초(JSON-RPC·stdio·SSE) 설명 여러 턴 → Codex 지원 여부 공식 문서 확인 → 문서 반영 → 사용자 "이슈 착오 없게 적었나" → 서버 몫을 이슈 09로 분리 → 커밋 → 핸드오프.

사용자 특성: 질문 한 번에 하나. 답이 길면 "장황하다"고 끊는다. 결론 한 줄 → 표/그림 → 질문 하나. MCP 내부 동작을 처음 접하는 부분이 있어 "서버가 파일을 읽는다 = 에이전트에게 텍스트를 넘겨주는 통로"처럼 역할 경계를 그림으로 보여주면 통했다.

## Current Progress

브랜치 `main`. 커밋 `5dff78c` "Make drawing guide a single server-owned md delivered via MCP instructions and resources; add ADR-0006, research note, and issue 09." 워킹트리에는 이 핸드오프만 남음(커밋 예정).

`5dff78c`에 들어간 것(`git show --stat 5dff78c`로 확인 가능):
- 신규 `docs/adr/0006-canvas-guide-single-source-via-mcp.md` — 결정·대안 3개·결과.
- 신규 `docs/research/2026-09-19-mcp-guidance-delivery.md` — MCP 스펙 프리미티브 의도, Claude Code 2KB 절단, 공식 서버(everything·GitHub MCP) `instructions` 사용, Codex `instructions`/`resources` 지원 확인(공식 문서 + openai/codex PR #5239 머지).
- 신규 `.scratch/archdraw-skill/issues/09-canvas-guide-single-source.md` — 서버 몫. Blocked by 01. 완료 조건 7개.
- 수정 이슈 03 — 서버 작업 제거, "리소스 `guide://canvas` 가리키기"만 남김, Blocked by에 09 추가, 완료 조건 1개 추가(스킬 문서에 px 값 없음).
- 수정 이슈 02 — Blocked by에 09 추가.
- 수정 `spec.md` — 순서 01 → 09 → 03 → 04~08 → 02, 표에 09 행, "yctimlin과의 경계" 절 규격 원본 서버로 변경, 7-4·레포 구성·MCP "손" 줄.
- 수정 `AGENTS.md` gotcha — 업스트림 머지 시 `read_diagram_guide`·`design-guide.ts` 되살아나면 지우기.

이 세션은 서버 코드·스킬 파일을 바꾸지 않았다(PRD 단계, 코드 0줄 원칙 유지).

## 가져올 것 4개 — 상태

| # | 뭐 | 상태 |
|---|---|---|
| 1 | 규격 SSOT | **완료.** ADR-0006, 이슈 09(서버)·03(스킬). |
| 2 | 좌표 규칙 | **미착수.** Q1 던진 상태에서 답 안 받음. 질문 3개 아래. |
| 3 | Codex 플러그인 실물 | 참고용, 결정 불필요. 01 생성 스크립트 근거(`references/drawio-mcp/plugins/codex/drawio/`). |
| 4 | 서버 normalize | 미논의. `references/drawio-mcp/shared/normalize-model.js` — LLM 출력을 렌더 전 항상 수리, 멱등. 05 frame "자식이 밖으로 나가면 frame 키움"에 서버 생성 경로만 적용할지. |

작은 것(선택, 미논의): 스킬 Troubleshooting 표(문제/원인/해결), README "Data residency" 한 줄.

### 2번 남은 질문 (하나씩)
1. 좌표 계산 주인 — First Action의 Q1.
2. 박스 크기: 고정(140×60, 줄바꿈) vs 라벨 길이 기준(`max(160, 글자수×12)`, 열 간격은 열 최대 너비). 추천 라벨 기준 — 스토리 5 "진짜 이름"이 잘리면 안 됨.
3. 종류별 (열,행) 의미: 시퀀스는 열=참여자·행=시간, 박스-화살표는 행=층·열=형제. 21행 각각이 아니라 그림 **종류** 5~6개 단위로. 추천 종류 단위.

결과가 들어갈 곳: 2번 규칙은 **규격 md(이슈 09 소유, 서버 패키지)** 에 들어간다 — 1번 결정으로 `canvas-ops.md`는 규격을 담지 않는다. 좌표 규칙이 "그리기 규격"인지 "스킬 판단 규칙"인지 Q1~3 답 보고 09/03 중 배정. 그리드 공식·Do NOT 목록은 09, 종류별 열·행 의미는 라우팅 표와 붙으니 03일 가능성.

## Decisions Made

- **1번 제3안** — 상세 ADR-0006. 요지: 규격 원본은 서버 패키지 md 한 벌, 서버가 시작 시 읽어 initialize `instructions`(앞 512자 핵심·2KB 이내)와 리소스 `guide://canvas`(전문)로 전달, `read_diagram_guide` 툴·`design-guide.ts` 문자열 삭제, 스킬은 리소스를 가리킴. 기각: 서버가 스킬 폴더 읽기(npm 별도 배포라 경로 모름), drawio식 툴 description 결합(Claude Code 2KB 절단), 툴 삭제만(MCP-only 사용자 못 받음).
- **MCP-only 사용자 지원한다** — 사용자 명시. 스킬 없이 서버만 등록해도 규격 받게.
- **조작법 vs 규격 구분** — 조작법(커맨드 호출 순서)은 스킬 `canvas-ops.md`, 규격(치수·색·바인딩·그리기 순서)은 서버 md. 그림 종류 템플릿은 md에 안 넣음(라우팅 표 담당).
- **09 분리** — 03이 이미 완료 조건 12개라 서버 작업은 별도 티켓. 사용자 확정.
- **그리드는 에이전트가 백지에서 그리는 요소에만** — 초안 정식화·사용자 이동 요소는 사용자 배치. (내 전제, Q1 답에서 같이 확정할 것)
- **Do NOT 목록은 좌표·배치에만** — 그림 종류 판단에서 생각을 줄이지 않는다. (내 추천, 미확정)
- 이전 세션 유지: 멀티호스트 방식 우리 것 유지, GitHub raw URL 런타임 fetch 안 함, 핸드오프 경로 `docs/handoff`.

## 발견된 스펙 갭 (미처리)

- **07 박스 단위 강등 미정의.** 스토리 33은 박스마다 `코드`/`설계` 태그인데 이슈 07은 선 강등만 정의. 박스의 `코드` 태그가 틀렸을 때 무엇이 되는지 없음. 07 착수 전 한 줄 필요.
- Codex가 `instructions`를 시스템 프롬프트에 넣는지는 공식 문서에 없음("reads… uses it as server-wide guidance"까지). 09 완료 조건에 01 실측 항목으로 넣어둠.
- Codex `/drawio:drawio` 표기 주장(`references/drawio-mcp/plugins/codex/drawio/DEVELOPING.md`) vs 우리 R11 `$archdraw`/`/skills`. 01 설치 확인 때 같이.

## What Worked

- **"정석이냐"에 추측 대신 `/research`** — 내가 (b)를 "정석"이라 했다가 사용자가 되물었고, 리서치가 제3안을 가져왔다. 스펙 원문·공식 서버 코드·Claude Code 문서 셋이 같은 곳을 가리키니 바로 수용됐다.
- **역할 경계 그림** — "서버가 파일 읽는다"를 사용자가 "서버가 규칙을 실행하나"로 오해했을 때, `서버 = 텍스트 넘겨주는 통로`, `판단 = 에이전트` 표/트리로 보여주니 풀렸다.
- **"이슈 착오 없게 적었나" 자문에 정직하게 "부족"** — npm `files`에 md 없음, 완료 조건 0개, md 범위 애매 세 구멍을 찾아 09로 분리. 사용자가 바로 승인.
- SDK 지원 확인은 `npm pack @modelcontextprotocol/server@2.0.0` 받아 `.d.mts` grep(`node_modules` 없음). `instructions?: string`·`registerResource(` 존재 확인.

## What Didn't Work

- ⚠️ "정석은 (b)"라고 근거 없이 단정했다가 되돌렸다. 이 사용자에겐 "확인 안 된 내 판단"이라고 표시하거나 확인 후 말할 것.
- ⚠️ 09 제안 답변이 길어 "장황하다, 갑자기 먼소리야"로 끊겼다. 구멍 3개 + 질문 하나로 줄이니 통과. 완료 조건 초안은 묻고 나서.
- ⚠️ "안 고친다"고 한 AGENTS.md를 나중에 gotcha 때문에 고쳤다. 처음부터 "머지 gotcha 생기면 고친다"로 말했어야.
- MCP 기초 설명(JSON-RPC·stdio·SSE·REST 비교)에 여러 턴 썼다. 결정 자체엔 불필요했지만 사용자가 원해서 한 것 — 다음 세션도 물으면 짧게 답하고 그릴로 복귀.

## Next Steps

1. 2번 Q1 → Q2 → Q3, 하나씩. 결과를 09(그리드 공식·Do NOT)와 03(종류별 열·행)에 배정해 반영.
2. 4번(05 normalize)·작은 것들 논의할지 사용자에게 한 줄로 묻기.
3. 07 갭(박스 강등) 이슈 07에 한 줄 추가.
4. 반영 후 커밋(지시 있을 때). push는 지시 없으면 안 함.

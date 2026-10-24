---
topic: redesign-reference-research
date: 2026-10-24
---

# 재설계 전 참고 레포 조사 — 5개 그룹으로 나누고 그룹마다 설명한다

> **이 핸드오프는 지난 상태다.** 원장 `docs/research/2026-10-24-redesign-references.md`를 만들었다. 이어서 하려면 원장 맨 아래 "이어서 하기"부터 읽는다.

## Goal

archdraw를 다시 설계하기 전에, 관련 참고 레포와 위키를 모두 리스트업하고 분석한다. 그 결과로 우리 제품 방향을 정한다.

- 제품 목표: 에이전트와 사람이 Excalidraw 캔버스의 그림으로 소통한다. 그림으로 설명하고, 판단을 받고, 그 판단을 에이전트에게 돌려준다. 백엔드·소프트웨어 아키텍처 그림에 특히 강하다.
- 사용자가 지금 아는 문제 (이것뿐이 아니다. 조사로 더 찾는다):
  1. 직접 써 보니 그림이 하나도 마음에 들지 않는다. 백엔드 그림도.
  2. 색이 없어서 통일감이 없고 경계가 안 보인다. 경계별 색을 원한다. 그런데 그림의 레벨(C4 등)에 따라 "경계"가 바뀌므로 색도 바뀌어야 한다("유동적"). 이 뜻은 내 해석이고 사용자 확인 전이다.
  3. 스킬이 여러 개이고 지시문이 길다. poteto-mode처럼 스킬 하나가 라우팅하고 지시문이 짧기를 원한다.
  4. 사용자 프로젝트의 아키텍처(헥사고날, MSA 등)에 맞춰 그리지 못한다.
- 순서: ① 리스트업 → ② 분석(우리 제품과 비교해서 문제 목록을 새로 만든다) → ③ 제품 방향 결정. **지금 ①.**

10/17 핸드오프(`2026-10-17-drawing-quality-review.md`)의 "시험 세트 → 지금 archdraw로 그리기"는 이 조사 뒤로 미룬다.

## First Action

1. 원장 문서 위치를 사용자에게 확인받는다. 내 추천은 `docs/research/2026-10-24-redesign-references.md`(질문 대기 중, 사용자가 pause로 끊음). 근거는 아래 Decisions.
2. 확인되면 아래 "그룹 1 설명 재료"로 그룹 1을 사용자에게 설명한다. **그룹 한 개씩** (사용자 요청). 그 뒤 원장에 쓴다.

## Context

- 사용자는 ADHD. 짧은 보고, 질문 한 번에 하나, 구체 예시 먼저.
- 사용자는 `/pstack:in-your-own-words`로 내 이해를 자주 확인한다. 이 세션에서 여러 번 틀렸다(What Didn't Work).
- 기존 조사: `docs/agents/design-references.md`(10/14, 10/17). 질문별 "지도"다. 다시 하지 않는다.
- `references/` = llm-wiki `raw/repos` 심링크 대상(확인함). 385개.
- 이 세션에서 archdraw MCP 서버가 연결되지 않았다(`Connection closed`). 원인은 보지 않았다.

## 5개 그룹 (사용자 승인: "추천 그룹으로 나누고 설명해봐")

에이전트가 그림 하나를 만드는 순서로 나눈다. 10/17의 문제 4층과 거의 같다.

표시: ✓ = `design-references.md`에 있음 · ★ = 새 후보(로컬 있음) · ☁ = 플러그인 마켓 목록에만 있음, 로컬 없음. 설명은 README 기준이고 실행 확인 전이다.

| 그룹 | 질문 | 레포 |
|---|---|---|
| 1. 코드 읽기 | 사용자 코드에서 구조를 어떻게 뽑나? | ✓ Understand-Anything, gitdiagram, archify, CodeWiki, pr-lens · ★ GitNexus, codegraph, graphify, code-review-graph, codesight, lat.md, `agents/plugins/c4-architecture` |
| 2. 무엇을 그리나 | 아키텍처를 어떤 레벨과 그림 종류로 그리나? | ✓ c4-model-skill, diagram-design · ★ clean-architecture-skills, system-design-101, system-design-primer, system-design-academy, system-design-notes, engineering-handbook, awesome-scalability, awesome-backend · ☁ sdlc-kit-extended, diagrams(Kroki) |
| 3. 어떻게 보이나 | 배치·색·스타일을 어떻게 통일하나? | ✓ excalidraw-diagram-skill · ★ impeccable, taste-skill, huashu-design, awesome-design-md, awesome-claude-design · ☁ hdldiagzero(clock domain마다 색 = 경계별 색 사례), dataink, distill-design |
| 4. 판단 돌려받기 | 보여 주고 판단을 어떻게 돌려받나? | ✓ html-plan, answer-me-with-html, effective-html, visual-explainer, comprendo, open-design, learning-opportunities, no-numb, rubberduck-mcp · ★ snip, `humanlayer-skills/plugins/show-me`, `plugins-for-claude-natives/plugins/interactive-review`, slides-grab, `claude-plugins-community/eli5` · ☁ openhop, bloom, html-skills, codebase-visualizer, feynman, jointjs-code-playground |
| 5. 제품 껍데기 | 1~4를 어떤 캔버스와 스킬 구조로 만드나? | 캔버스: ✓ mcp-excalidraw-yctimlin, excalidraw-toolkit, excalidraw-mcp, drawio-skill, drawio-mcp, whiteboard · ★ tldraw-desktop(= tldraw-offline), open-pencil · ☁ excalidrawer, excalidraw-plugin(yogsma), canvs-claude-plugin, next-ai-drawio, tldiagram-create-diagram, miro, whimsical, paper-desktop, superdesign. 스킬 구조: ✓ pstack, mattpocock-skills, superpowers · ★ pstack-claude, impeccable(스킬 1개에 명령 24개) |

- food-ordering-system은 뺐다. 도그푸딩 시험 샘플이지 참고 자료가 아니다(사용자 지적).
- ☁ 원본 주소는 `references/claude-plugins-community/.claude-plugin/marketplace.json`의 `source`에 있다. ☁를 리스트에 둘지(두면 클론 필요) 사용자 답 대기.

### 그룹 1 설명 재료 (README에서 읽음)

- GitNexus: 코드베이스를 지식 그래프로 색인한다(의존성, 호출 체인, 클러스터, 실행 흐름). CLI + MCP. `analyze` 한 번에 스킬·훅·AGENTS.md를 만든다.
- codegraph: 로컬 코드 그래프. 에이전트에게 좁은 맥락을 준다.
- graphify: tree-sitter AST로 코드 맵을 만든다(LLM 없음, 결정적). 엣지마다 `EXTRACTED`/`INFERRED`를 붙인다.
- code-review-graph: tree-sitter로 구조 지도를 만들고 증분 갱신한다. 리뷰용.
- codesight: AST, 프레임워크 감지 30+, ORM 파서 14, MCP 툴 14.
- lat.md: 도메인 지식과 설계 결정을 `lat.md/` 폴더의 markdown 그래프로 둔다. 에이전트가 갱신한다.
- Understand-Anything: 멀티 에이전트로 지식 그래프를 만든다. 구조 뷰와 도메인 뷰(업무 흐름)가 있다.
- gitdiagram: 레포 → 인터랙티브 아키텍처 그림, 1분 영상. MCP 있음.
- archify: 설명이나 레포 → 소스 링크가 있는 인터랙티브 HTML 그림.
- CodeWiki: 의존성 그래프 → 모듈 계층 → 모듈마다 문서 + Mermaid 그림.
- pr-lens: 기존 구조 안에서 변경 부분과 데이터 흐름을 보여 준다(`design-references.md`).
- `agents/plugins/c4-architecture`: 에이전트 4개(`c4-code`, `c4-component`, `c4-container`, `c4-context`). 코드에서 아래에서 위로 C4를 만든다.

## Decisions Made

- 조사 범위는 예시로 든 스킬(html-plan, show-me 등)에 한정하지 않는다. 목표 기준으로 모두 모은다.
- 문제 4개에 갇히지 않는다. 분석 단계에서 우리 제품과 비교해 문제를 새로 찾는다.
- 그룹은 위 5개(사용자 승인).
- (추천, 미확인) 원장은 `docs/research/2026-10-24-redesign-references.md`. 근거: `design-references.md` 마지막 절 "조사 문서에 남기고 이 지도에는 링크만", `docs/research/`에 날짜 붙은 조사 2개가 선례, `.scratch/`는 스펙과 티켓 자리(`AGENTS.md`). 지도에는 링크 한 줄만 더한다.

## What Didn't Work

- ⚠️ 첫 답에서 10/17 핸드오프만 보고 "판단 질문 확정이 다음"이라고 했다. 사용자는 재점검(참고 프로젝트부터 다시 설계)을 뜻했다.
- ⚠️ "기록에 없다"고 했지만 있었다(10/17 세션의 "그림 산출물이 맘에 안 들어서 재점검"). 기록을 좁게 읽었다.
- ⚠️ 이미 조사한 문서(`design-references.md`)를 놓치고 새로 조사하려 했다. 사용자가 막았다.
- ⚠️ 목표를 "html-plan, show-me 같은 스킬을 캔버스로"라고 좁게 말했다. 사용자: "국한되지 말라고".
- 시험 샘플(food-ordering-system)을 참고 레포에 넣었다.
- 사용자가 모르는 레포가 많다고 했다. 새 후보는 출처(llm-wiki 레포인지, 마켓 목록인지)를 함께 적는다.

## Next Steps

1. 원장 위치 확인 → 원장 만들기.
2. 그룹 1~5를 한 개씩 사용자에게 설명하고 원장에 쓴다.
3. 위키 목록: `wiki/index.md`(890줄)에서 그룹별 관련 글을 뽑는다. 아직 안 했다. 큰 출력은 서브에이전트에 맡긴다.
4. ☁ 처리 결정 → 필요하면 클론.
5. ② 분석: 그룹마다 레포를 README 너머 관련 파일까지 읽고 우리 제품과 비교해 문제 목록을 만든다.
6. ③ 제품 방향 결정. 그다음 10/17의 시험 세트와 색 규칙(ADR-0016) 작업으로 돌아간다.

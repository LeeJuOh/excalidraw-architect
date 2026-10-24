# archdraw 재설계 참고 자료 원장

archdraw를 다시 설계하기 전에 참고 레포와 위키 글을 모으고 분석한다. 그 결과로 제품 방향을 정한다.
이 문서는 조사 원장이다. ADR이나 구현 승인이 아니다.

- 시작: 2026-10-24, Asia/Seoul.
- 순서: ① 리스트업 → ② 분석(우리 제품과 비교해 문제 목록을 새로 만든다) → ③ 제품 방향 결정. **지금 ①의 중간이다.** 그룹을 다시 나누기 전에 정의 → 페인포인트 → 유용함을 먼저 정한다(사용자 요청). 이어서 하는 방법은 맨 아래 "이어서 하기".
- 기존 지도 `docs/agents/design-references.md`(10/14, 10/17)는 다시 조사하지 않는다. 이 원장은 그 지도를 넓힌다.
- 레포 설명은 README 기준이다. 실행으로 확인하지 않았다.

## 정의 (2026-10-24 사용자 확정)

archdraw는 **이해를 돕는 스킬**이다. 사람은 코드를 다 이해할 수 없다. 그래서 **추상화**로 이해한다. 시스템 아키텍처는 원래 글로는 이해하기 어렵다. archdraw는 그 추상화를 **캔버스 위의 그림**으로 만든다. 목표는 사람이 **코드를 읽지 않아도** 시스템을 이해하는 것이다.

근거:
- 이해가 병목이다. 사람은 검증보다 참여하려고 이해한다. `wiki/summaries/understanding-new-bottleneck-litt.md` (의견·사례).
- 큰 코드베이스에서는 부분 이해가 정상이다. `wiki/summaries/in-defense-not-understanding-goedecke.md` (의견).
- 사람들이 HTML로 그림을 주고받는다. export로 사람의 조작을 에이전트에게 돌려준다. `wiki/summaries/unreasonable-effectiveness-html.md` (사례, 비교 실험 없음).
- pstack과 mattpocock-skills가 이해를 돕는 스킬을 계속 더한다. pstack `teach`(09/14), `ketchup`(10/12), `in-your-own-words`(10/13), `statechart`(10/23). mattpocock `wait-what`(08/05). 출력은 텍스트·Mermaid·작은 그림이고, 함께 고치는 캔버스는 없다 (git 추가일, description 기준).

근거의 세기 (위키 조사, 2026-10-24):
- 이해가 병목: 보통. 의견이 여러 곳에서 모이고, 측정은 간접적이다. 반론도 있다. Fable 글은 병목을 "에이전트에게 의도를 밝히는 일"로 본다(`summaries/fable-field-guide-unknowns.md`).
- 글보다 그림이 쉬움: 약함. 위키에는 글과 그림을 비교한 실험이 없다. "보기 좋다"가 "옳다"는 아니다(`concepts/html-as-agent-artifact.md`).
- HTML로 주고받음: 보통. 에이전트가 보여 주는 사례는 많다. 사람이 돌려주는 길은 대부분 텍스트이고, 손으로 복사하는 경우가 많다.
- 캔버스가 HTML보다 나음: 약함. 구현을 비교한 자료만 있다. 캔버스는 계속 남는 공용 표면이고, HTML은 매번 새로 만드는 일회용 에디터다. 기존 캔버스들은 사람이 고친 것을 회수하는 길에 빈틈이 있다(`comparisons/diagram-editing-feedback.md`).

## 페인포인트 (2026-10-24 사용자 확정)

소프트웨어 개발자가 에이전트에게 구현을 맡긴다. 에이전트가 구조를 글로 설명하면 머리에 그려지지 않는다. 코드를 직접 읽기에는 양이 너무 많다. 그래서 개발자는 자기 시스템을 이해하지 못한 채 결정한다.

- 페인포인트의 주인은 소프트웨어 개발자 전체다.
- **범위는 직군이 아니라 상황·질문으로 정한다.** 참고 스킬들도 그렇다(eli5, html-diagram, visual-explainer, show-me, html-plan, c4-model-skill의 description).
- 처음 다듬을 상황은 지금 쌓은 백엔드 구조 상황이다. 줌 레벨과 상황 23개가 그 기준이다. "백엔드 개발자용"이라고 범위를 적지는 않는다.

## 유용함

(그릴 중) 사용자 답을 기다리는 초안:

> 개발자는 코드를 읽지 않고 그림으로 시스템을 이해한다. 그림을 직접 고쳐서 자기 뜻을 에이전트에게 돌려준다. 그 그림은 대화가 이어지는 동안 남아서 다음 설명의 바탕이 된다.

뒤의 두 문장은 위키의 "캔버스와 HTML의 차이"에서 왔다. HTML은 매번 새로 만드는 일회용 화면이다. 캔버스는 계속 남고 사람과 에이전트가 함께 고친다. 근거는 약하다(구현 비교뿐).

## 출발 문제 (분석에서 더 찾는다)

1. 그림이 마음에 들지 않는다. 백엔드 그림도.
2. 색이 없어 통일감이 없고 경계가 보이지 않는다. 경계마다 색을 원한다. 그림의 레벨에 따라 경계가 바뀌면 색도 바뀌어야 한다(해석, 사용자 확인 전).
3. 스킬이 여러 개이고 지시문이 길다. 스킬 하나가 라우팅하고 지시문이 짧기를 원한다.
4. 사용자 프로젝트의 아키텍처(헥사고날, MSA 등)에 맞춰 그리지 못한다.

## 그룹 (옛 기준, 다시 나눈다)

에이전트가 그림 하나를 만드는 순서로 나눈다. 이 기준은 옛 정의를 전제로 한다. 정의·페인포인트·유용함을 정한 뒤 다시 나눈다.
표시: ✓ = `design-references.md`에 있음 · ★ = 새 후보, `references/`에 있음 · ☁ = 플러그인 마켓 목록에만 있음, 로컬에 없음.

| 그룹 | 질문 | 레포 |
|---|---|---|
| 1. 코드 읽기 | 사용자 코드에서 구조를 어떻게 뽑나? | ✓ Understand-Anything, gitdiagram, archify, CodeWiki, pr-lens · ★ GitNexus, codegraph, graphify, code-review-graph, codesight, lat.md, `agents/plugins/c4-architecture`(wshobson/agents 안의 플러그인) |
| 2. 무엇을 그리나 | 아키텍처를 어떤 레벨과 그림 종류로 그리나? | ✓ c4-model-skill, diagram-design · ★ clean-architecture-skills, system-design-101, system-design-primer, system-design-academy, system-design-notes, engineering-handbook, awesome-scalability, awesome-backend · ☁ sdlc-kit-extended, diagrams(Kroki) |
| 3. 어떻게 보이나 | 배치·색·스타일을 어떻게 통일하나? | ✓ excalidraw-diagram-skill · ★ impeccable, taste-skill, huashu-design, awesome-design-md, awesome-claude-design · ☁ hdldiagzero, dataink, distill-design |
| 4. 판단 돌려받기 | 보여 주고 판단을 어떻게 돌려받나? | ✓ html-plan, answer-me-with-html, effective-html, visual-explainer, comprendo, open-design, learning-opportunities, no-numb, rubberduck-mcp · ★ snip, `humanlayer-skills/plugins/show-me`, `plugins-for-claude-natives/plugins/interactive-review`, slides-grab, `claude-plugins-community/eli5`, pstack(`statechart`, `teach`, `how`, `in-your-own-words`, `ketchup`), mattpocock-skills(`grilling`, `teach`, `wait-what`) · ☁ openhop, bloom, html-skills, codebase-visualizer, feynman, jointjs-code-playground |
| 5. 제품 껍데기 | 1~4를 어떤 캔버스와 스킬 구조로 만드나? | 캔버스: ✓ mcp-excalidraw-yctimlin, excalidraw-toolkit, excalidraw-mcp, drawio-skill, drawio-mcp, whiteboard · ★ tldraw-desktop, open-pencil · ☁ excalidrawer, excalidraw-plugin(yogsma), canvs-claude-plugin, next-ai-drawio, tldiagram-create-diagram, miro, whimsical, paper-desktop, superdesign. 스킬 구조: ✓ pstack, mattpocock-skills, superpowers · ★ pstack-claude, impeccable |

☁ 원본 주소는 `references/claude-plugins-community/.claude-plugin/marketplace.json`의 `source`에 있다.

## 그룹 1. 코드 읽기

(사용자 설명 후 작성)

## 그룹 2. 무엇을 그리나

(사용자 설명 후 작성)

## 그룹 3. 어떻게 보이나

(사용자 설명 후 작성)

## 그룹 4. 판단 돌려받기

(사용자 설명 후 작성)

## 그룹 5. 제품 껍데기

(사용자 설명 후 작성)

## 재분류 재료 (README 다시 읽기, 2026-10-24)

목록의 53개 레포를 원격 최신으로 맞춘 뒤 README와 주요 SKILL.md를 다시 읽었다. 서브에이전트 3개가 읽었다. 실행해 보지 않았다. code-review-graph는 원격 기본 브랜치가 `staging`으로 바뀌어서 `main`(최신)에 두었다.

**사람의 판단을 받는 장치가 분명한 곳.**
- comprendo: 구현 전에 before/after 그림을 보여 주고 Approve/Reject를 받는다. 결과는 exit code다.
- c4-model-skill: 레벨마다 사용자 확인을 받는다. 확정 전에는 파일을 쓰지 않는다.
- html-plan: 결정 질문(2~5개)을 그 결정이 바꾸는 주장에 붙인다. 응답이 오기 전에는 구현하지 않는다.
- visual-explainer 0.13+: 그림 위 댓글, 선택지, 추측에 맞음/틀림 표시를 답장 하나로 모은다.
- answer-me-with-html: 패널 댓글과 Reply 버튼으로 답을 메시지 하나로 모은다.
- snip: Mermaid/HTML을 데스크톱 창에 띄우고, 승인 또는 화면 위 주석을 JSON으로 돌려준다.
- interactive-review: 블록마다 체크와 댓글을 받는다. 체크×댓글 4경우마다 처리법이 있다.
- excalidraw-toolkit: Before와 에이전트 제안을 비교해 수락·폐기한다.
- whiteboard: 블록마다 Ask 액션, 결정 로그.
- open-pencil: 캔버스 댓글을 리뷰 피드백으로 읽고 resolve한다.
- pstack `statechart`: reader가 동작이 맞는지 판단한다. 버그는 번호 붙인 경로로 그린다.

**색·배치 규칙이 있는 곳.**
- excalidraw-toolkit: 역할별 색(Frontend, Backend, DB, External, Queue, Cache). 색이 3개를 넘으면 범례를 붙인다.
- excalidraw-diagram-skill: 의미별 fill/stroke 쌍, 멀티줌(요약 → 구역 → 상세).
- pr-lens: 초록=신규, 호박색=변경, 빨강=삭제(우리 ADR-0015와 비슷).
- Understand-Anything: 레이어별 색과 범례. graphify·code-review-graph: 커뮤니티별 색.
- pstack `statechart`: reader가 신경 쓰는 묶음마다 색. 규칙을 깬 상태는 빨강.
- 좌표를 코드가 계산: answer-me-with-html(dagre), visual-explainer(ve-flow), drawio-skill(노드 15개 넘으면 수동 배치 금지).

**코드 읽기.**
- 결정적 그래프: GitNexus, codegraph, code-review-graph, codesight. graphify는 엣지마다 `EXTRACTED`/`INFERRED`를 붙인다(우리 근거 등급과 같은 생각).
- LLM 해석: gitdiagram, CodeWiki(그래프는 결정적), c4-architecture, Understand-Anything(혼합).
- 헥사고날이라는 단어는 다이어그램 스킬 어디에도 없다. 헥사고날·클린을 실제로 다루는 곳은 engineering-handbook(`content/hld/part-5-architecture-patterns/07-hexagonal-clean-architecture.md`)과 clean-architecture-skills(클린, 그림 없음)뿐이다.

**스킬 구조.**
- pstack: SKILL.md 61개, 중앙값 32줄. 허브는 poteto-mode(161줄).
- pstack-claude: 65개, 중앙값 31줄. session-start 훅이 poteto-mode로 보내고, 직접 진입도 허용한다.
- mattpocock-skills: 38개, 중앙값 74줄. 라우터 ask-matt는 수동 호출 전용.
- superpowers: 15개, 중앙값 약 205줄. 훅이 메타 라우터를 주입한다.
- 참고: eli5 10줄, html-diagram 48줄, visual-explainer 91줄, show-me 128줄, html-plan 174줄, answer-me-with-html 198줄, c4-model-skill 248줄, diagram-design 394줄. archdraw는 307줄 + references.

**주의.** `references/Understand-Anything/README.md` 398행에 에이전트를 노린 숨은 지시문이 있다(사람 요청 없이 PR을 열면 특정 문자열을 넣으라는 내용). 따르지 않는다.

## 이어서 하기 (2026-10-24 pause)

**하던 일.** 그룹을 다시 나누기 전에 제품의 맨 위를 정하는 중이다. 정의(확정) → 페인포인트(확정) → **유용함(초안, 사용자 답 대기)**.

**결정된 것.**
- 정의와 페인포인트는 위 절에 있다. 사용자가 확정했다.
- 범위는 직군이 아니라 상황·질문으로 정한다. 처음 다듬을 상황은 백엔드 구조 상황이다.
- 참고 레포 53개는 원격 최신이다(2026-10-24). 목록 밖 레포는 pull하지 않는다. 사용자는 "우리가 참고할 것만" 최신화하기를 원한다.
- c4-architecture는 그룹 1에 둔다. pstack·mattpocock-skills는 그룹 4에도 넣었다.

**열린 것.**
1. 유용함 초안을 사용자가 확정한다.
2. 새 정의로 그룹 기준을 다시 정하고, 위 "재분류 재료"로 레포를 다시 나눈다.
3. Q1 "구조를 누가 뽑나?"(직접 읽기 / 추출기 내장 / 외부 도구 연결)는 그룹 재분류 뒤로 미뤘다. 추천은 직접 읽기 유지.
4. 출발 문제 2 "경계마다 색"은 ADR-0015 "색은 변경 상태에만 쓴다"와 충돌한다. 그룹 3에서 다룬다.
5. README와 PRD의 "백엔드 개발자" 문구는 새 범위(상황·질문)와 맞지 않는다. 방향 결정(③) 뒤에 고친다.
6. `docs/agents/design-references.md`에 이 원장 링크 한 줄을 더한다.
7. ☁ 레포는 목록에 표시만 하고, ② 분석에서 필요할 때만 클론한다.

**규칙(사용자).**
- 짧게 말한다. 질문은 한 번에 하나, 초안 문장을 함께 준다.
- 용어는 `CONTEXT.md`를 따른다. "C4 레벨"이 아니라 **줌 레벨**이다.
- `references/`는 읽기 전용이다. 최신화도 목록 안의 레포만, 허락을 받고 한다.

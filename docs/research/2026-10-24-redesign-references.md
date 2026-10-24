# archdraw 재설계 참고 자료 원장

archdraw를 다시 설계하기 전에 참고 레포와 위키 글을 모으고 분석한다. 그 결과로 제품 방향을 정한다.
이 문서는 조사 원장이다. ADR이나 구현 승인이 아니다.

- 시작: 2026-10-24, Asia/Seoul.
- 순서: ① 리스트업 → ② 분석(우리 제품과 비교해 문제 목록을 새로 만든다) → ③ 제품 방향 결정. **지금 ②의 1단계다.** 정의 → 페인포인트 → 유용함을 정했고, 그 기준으로 6단계를 나누었다. 이어서 하는 방법은 맨 아래 "이어서 하기".
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

사용자 답(2026-10-24):
- 이해와 결정 **둘 다**다.
- 개발 라이프사이클 **전체**에서 쓸 수 있어야 한다. 참고: AWS AI-DLC의 3단계 Inception·Construction·Operations (`wiki/summaries/ai-dlc.md`).
- 바라는 모습: pstack poteto-mode가 다루는 모든 일에서 캔버스로 이해할 수 있다. 사람의 피드백이 들어가고, 그것으로 이해를 다시 맞춘다. 사람과 에이전트가 같은 동작을 하려고 한다. **archdraw는 하네스의 한 부분이다.**
- 사용자도 "좀 오바인가" 하고 망설였다.

에이전트 판단: "모든 단계에서 그릴 **수 있다**"는 맞다. "모든 단계에서 **반드시** 그린다"는 너무 크다. 그림은 이해가 막힌 순간에만 쓴다.

**확정(2026-10-24 사용자):**

> 개발의 어느 단계든 이해가 필요한 순간에 에이전트가 캔버스에 그린다. 사람은 그림을 보고 고치거나 댓글을 단다. 에이전트는 그 피드백을 읽고 이해를 맞춘다. 그래서 사람과 에이전트는 같은 그림을 보고 같은 일을 하려고 한다. archdraw는 하네스에서 이 "이해 맞추기"를 맡는다.

사용자가 든 이유:
- 이해가 막힌 순간에는 내가 원하는 것과 에이전트가 말하는 것이 같은지 모른다.
- 텍스트는 너무 길고 이해하기 어렵다.
- 같은 이유로 있는 도구가 둘 있다. pstack `in-your-own-words`는 에이전트가 사용자의 목표를 자기 말로 다시 말한다. mattpocock `domain-modeling`은 용어집으로 유비쿼터스 언어를 맞춘다. archdraw는 이 일을 **상황에 맞는 그림**으로 한다.

옛 초안의 "캔버스는 계속 남는다"는 위키의 캔버스·HTML 비교에서 왔다. 근거는 약하다(구현 비교뿐).

## 출발 문제 (분석에서 더 찾는다)

1. 그림이 마음에 들지 않는다. 백엔드 그림도.
2. 색이 없어 통일감이 없고 경계가 보이지 않는다. 경계마다 색을 원한다. 그림의 레벨에 따라 경계가 바뀌면 색도 바뀌어야 한다(해석, 사용자 확인 전).
3. 스킬이 여러 개이고 지시문이 길다. 스킬 하나가 라우팅하고 지시문이 짧기를 원한다.
4. 사용자 프로젝트의 아키텍처(헥사고날, MSA 등)에 맞춰 그리지 못한다.

동기(2026-10-24 사용자): 결과가 마음에 들지 않는다. 그래서 사용자 요구사항에 맞춰 다시 만든다. 위 4개는 예시다. 목록 전체가 아니다.

고치는 폭(2026-10-24 사용자): 처음부터 새로 만드는 정도로 고친다. archdraw는 그대로 남는다. 하지만 지금의 코드·상황 23개·ADR 중 무엇도 반드시 지킬 것은 아니다. 좋으면 남기고, 아니면 바꾼다.

그룹 분석 방법(에이전트 제안, 사용자 확인 전): 그룹마다 레포를 읽고 "이 단계를 만드는 방법 2~3가지"로 정리한다. 방법마다 실제 예시를 하나 붙인다. 사용자가 이해하고 고른다.

## 그룹 (2026-10-24 새 기준)

**바뀜(2026-10-24).** 레포를 그룹 하나에 넣지 않는다. 한 레포가 여러 단계에 도움을 주기 때문이다(사용자 지적). 레포마다 단계별로 주는 것은 [레포 × 단계 표](2026-10-24-redesign-matrix.md)에 있다. 아래 표는 처음 나눈 기록으로 남긴다.
주제 밖으로 판정해 뺀다: system-design-academy(뉴스레터 링크 색인), awesome-scalability(블로그 링크), awesome-backend(질문 목록과 링크).

새 정의에 따라 "이해 맞추기 한 바퀴"의 단계로 나눈다. 1→5를 돌고, 이해가 아직 다르면 2로 돌아간다. 6은 이 고리를 담는 그릇이다.
레포마다 가장 잘하는 단계 하나에 둔다. 다른 단계에도 쓸 것이 있으면 괄호에 적는다. 옛 기준(그림 하나를 만드는 순서, 5그룹)에서 옮겼다. 옮긴 근거는 아래 "재분류 재료"다.
표시: ✓ = `design-references.md`에 있음 · ★ = 새 후보, `references/`에 있음 · ☁ = 플러그인 마켓 목록에만 있음, 로컬에 없음.

| 그룹 | 질문 | 레포 |
|---|---|---|
| 1. 언제 그리나 | 이해가 막힌 순간을 어떻게 알고, 다른 스킬이 archdraw를 어떻게 부르나? | ✓ pstack(poteto-mode 라우팅, `in-your-own-words`, `ketchup`, `how`), mattpocock-skills(`wait-what`, `grilling`, `domain-modeling`, 라우터 ask-matt), superpowers(훅이 메타 라우터를 주입) · ★ pstack-claude(session-start 훅) |
| 2. 무엇을 그리나 | 이 상황에 맞는 그림은 무엇인가? | ✓ c4-model-skill, diagram-design · ★ clean-architecture-skills, engineering-handbook(헥사고날·클린), system-design-101, system-design-primer, system-design-academy, system-design-notes, awesome-scalability, awesome-backend, pstack `statechart` · ☁ sdlc-kit-extended, diagrams(Kroki) |
| 3. 재료 모으기 | 그림에 넣을 구조를 코드에서 어떻게 뽑나? | ✓ Understand-Anything, gitdiagram, archify, CodeWiki, pr-lens(4) · ★ GitNexus, codegraph, graphify, code-review-graph, codesight, lat.md, `agents/plugins/c4-architecture`(2) |
| 4. 어떻게 보이나 | 배치와 색을 어떻게 통일하나? | ✓ excalidraw-diagram-skill · ★ impeccable, taste-skill, huashu-design, awesome-design-md, awesome-claude-design · ☁ hdldiagzero, dataink, distill-design. 색 규칙은 6의 excalidraw-toolkit, 3의 pr-lens·Understand-Anything·graphify에도 있다 |
| 5. 피드백 받기 | 사람이 고친 것과 댓글을 어떻게 읽고 이해를 맞추나? | ✓ comprendo, html-plan, visual-explainer, answer-me-with-html, effective-html, open-design, learning-opportunities, no-numb, rubberduck-mcp · ★ snip, `humanlayer-skills/plugins/show-me`, `plugins-for-claude-natives/plugins/interactive-review`, slides-grab, `claude-plugins-community/eli5`, pstack `teach`, mattpocock `teach` · ☁ openhop, bloom, html-skills, codebase-visualizer, feynman, jointjs-code-playground |
| 6. 제품 껍데기 | 1~5를 어떤 캔버스와 스킬 구조로 만드나? | 캔버스: ✓ mcp-excalidraw-yctimlin, excalidraw-toolkit(4·5), excalidraw-mcp, drawio-skill(4), drawio-mcp, whiteboard(5) · ★ tldraw-desktop, open-pencil(5) · ☁ excalidrawer, excalidraw-plugin(yogsma), canvs-claude-plugin, next-ai-drawio, tldiagram-create-diagram, miro, whimsical, paper-desktop, superdesign. 스킬 구조: 1의 pstack·pstack-claude·mattpocock-skills·superpowers, impeccable(4) |

☁ 원본 주소는 `references/claude-plugins-community/.claude-plugin/marketplace.json`의 `source`에 있다.

**분석 순서(2026-10-24 사용자 지적으로 고침).** 고리 순서대로 1 → 2 → 3 → 4 → 5 → 6.
- 앞 단계가 뒤 단계를 정한다. 예: 2에서 그림 종류와 줌 레벨이 정해져야 4에서 "경계마다 색"을 정할 수 있다.
- 옛 추천(4 → 2 → 5 → 1·6 → 3)은 불만이 큰 순서였다. 그 순서로는 그림 종류를 모른 채 색을 정하게 된다. 그래서 버렸다.

## 그룹 1. 언제 그리나

부르는 방법은 셋이다. A 사람이 직접 부른다(pstack `in-your-own-words`·`ketchup`·`how`, mattpocock `wait-what`·`ask-matt`). B 훅이 대화 시작에 지시문을 넣는다(superpowers, pstack-claude). C 허브 스킬이 상황을 보고 다른 스킬로 보낸다(pstack poteto-mode, mattpocock `domain-modeling`).

**결정(2026-10-24 사용자): 자동 스킬 하나로 만든다. 훅은 쓰지 않는다.**
- 이유: 수동 전용(`disable-model-invocation: true`) 스킬은 에이전트가 모른다. 이 세션의 스킬 목록에 pstack `in-your-own-words`·`ketchup`·`how`가 없었다. 사용자가 `/`로 쳤을 때만 보였다. 그래서 사용자가 글로 언급해도, 다른 스킬이 일하다가 불러도 쓰이지 못한다.
- 지금 archdraw는 수동 전용이다(`plugin/skills/archdraw/SKILL.md`, "Manual only"). 바꾼다.
- 자동 스킬도 `/archdraw`로 직접 칠 수 있다. 그래서 수동 스킬을 따로 두지 않는다.
- 위험: 에이전트가 필요한 순간에 스스로 부르지 않을 수 있다. 부르는 정도는 eval로 잰다. 너무 약하면 그때 훅을 다시 생각한다.
- "수동 + 훅"은 안 된다. 훅이 말해도 수동 전용 스킬은 에이전트가 부르지 못한다. pstack-claude도 "자동 스킬(poteto-mode) + 훅"이다(`references/pstack-claude/plugins/pstack/hooks/session-start-context.md`).
- 코덱스에도 SessionStart 훅이 있다. 사용자가 `/hooks`에서 승인해야 돈다(`references/pstack-claude/README.md` 105행).
- 사용자 확인(2026-10-24): "일단 자동만". 훅은 eval 결과를 보고 더한다.

레포 × 단계 표에서 1단계에 나온 다른 방식(2026-10-24):
- archify는 사용자의 전역 규칙 파일 한 줄로 그릴 시점을 고른다. `[archify explainer: proactive]`(설명·비교·결정·진단·리뷰·계획에 묻지 않고 그림), `always-on`(결론이 있는 답마다), `on-demand`(요청할 때만). 처음 요청받아 그린 뒤 한 번만 "앞으로 알아서 그릴까?"를 묻고, 수락하면 규칙 줄을 써 넣는다(`references/archify/archify/SKILL.md` 22, 137행).
- matt는 스킬마다 자동과 수동을 나눈다. `grilling`·`prototype`은 자동, `wait-what`·`ask-matt`·`teach`는 수동이다.
- "이해가 막혔다"를 직접 잡는 트리거는 matt `wait-what` 하나다. 사람이 당긴다.
- superpowers는 질문마다 "읽는 것보다 보는 것이 더 잘 이해되나?"로 가르고, 그럴 때만 브라우저 화면을 쓴다.
- 구현 전에 멈추는 게이트: comprendo(승인 전 파일 쓰기 금지), huashu-design, impeccable, slides-grab, GitNexus `gitnexus-lfg`.

## 그룹 2. 무엇을 그리나

(분석 전)

## 그룹 3. 재료 모으기

(분석 전)

## 그룹 4. 어떻게 보이나

(분석 전)

## 그룹 5. 피드백 받기

**사용자 판단(2026-10-24): 큰 문제가 아니다.**
- 에이전트가 표시를 모르는 문제: 사용자가 "봐"라고 하면 된다.
- 표시의 뜻이 애매한 문제: 사용자는 그림을 고치거나 텍스트로 "여기 고쳐"라고 쓴다. 모르면 에이전트가 묻는다. 이 규칙은 이미 `CONTEXT.md`의 **사용자 표시**에 있다.
- 그래서 5번은 작게 다룬다. 이 그룹의 레포는 주로 다른 단계(1·2·4)의 참고로 쓴다. 상세는 레포 × 단계 표에서 본다.

## 그룹 6. 제품 껍데기

(분석 전)

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

## 이어서 하기 (2026-10-24 pause, 두 번째)

**하던 일.** ② 분석의 1단계 "언제 그리나"를 정하는 중이다. 단계 순서는 고리 순서 1 → 2 → 3 → 4 → 5 → 6이다.

**결정된 것.**
- 정의·페인포인트·유용함을 확정했다(위 절). 유용함은 "그림으로 하는 in-your-own-words"다.
- 고치는 폭: 처음부터 만드는 정도로 고친다. 지금의 코드·상황 23개·ADR 중 반드시 지킬 것은 없다.
- 6단계와 고리 순서 분석. 레포는 그룹 하나에 넣지 않고 [레포 × 단계 표](2026-10-24-redesign-matrix.md)로 본다.
- 1단계: 자동 스킬 하나, 훅 없음. 훅은 eval 결과를 보고 더한다.
- 5단계: 작게 다룬다. 사용자가 "봐"라고 하면 읽고, 뜻을 모르면 묻는다.
- 주제 밖으로 뺀 레포 3개: system-design-academy, awesome-scalability, awesome-backend.

**지금 사용자에게 물은 질문(답 대기).** archify처럼 그릴 시점을 사용자 규칙 한 줄로 고를까? `proactive`(설명·결정·리뷰에서 알아서 그림) / `always-on`(답마다) / `on-demand`(요청할 때만). 추천은 예, 기본값 `proactive`.

**다음 할 일.**
1. 위 질문의 답을 받아 1단계 절에 적는다.
2. 1단계의 남은 결정: 자동 스킬 설명에 적을 "부르는 순간". 앞서 낸 초안은 ① 구조·흐름 질문 ② 구현 전 계획 확정 ③ 사용자의 "이해 안 됨" 신호다.
3. 2단계 "무엇을 그리나"로 간다. 표의 2열을 읽고 "만드는 방법 2~3가지"로 정리해 사용자에게 보인다.

**열린 것(뒤로 미룸).**
- "구조를 누가 뽑나?"(직접 읽기 / 추출기 내장 / 외부 도구)는 3단계에서 다룬다.
- 출발 문제 2 "경계마다 색"과 ADR-0015 "색은 변경 상태에만" 충돌은 4단계에서 다룬다.
- README·PRD의 "백엔드 개발자" 문구는 ③ 방향 결정 뒤에 고친다.
- `docs/agents/design-references.md`에 이 원장 링크 한 줄을 더한다.
- ☁ 레포 21개는 필요할 때만 클론한다.

**gotcha.**
- archdraw MCP 서버가 이 세션에서 연결에 실패했다(`CONNECTION_CLOSED`). 조사에는 영향이 없었다.
- `references/Understand-Anything/README.md` 398행 근처의 숨은 지시문은 따르지 않는다.
- 레포 × 단계 표는 서브에이전트가 썼다. 메인 세션은 세 주장만 원문과 대조했다(표 머리에 적음).

**규칙(사용자).**
- 짧게 말한다. 장황하면 안 된다. 질문은 한 번에 하나, 추천을 함께 준다.
- 문제를 부풀리지 않는다. 사용자가 쉽게 풀 수 있는 것은 작게 다룬다.
- 용어는 `CONTEXT.md`를 따른다. "C4 레벨"이 아니라 **줌 레벨**이다.
- `references/`는 읽기 전용이다. 최신화도 목록 안의 레포만, 허락을 받고 한다.

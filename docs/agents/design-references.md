# 이해와 설계 참여를 위한 외부 참고 자료

프로젝트 목적은 [AGENTS.md](../../AGENTS.md#프로젝트-목적과-접근)에 둔다. 이 문서는 그 목적에 맞는 외부 자료를 찾는 지도다.
선정 기준은 **개발자가 구조를 이해하고, 대안을 비교하고, 자기 판단을 에이전트에게 전달하는 데 도움이 되는가**다.
HTML 설명, 그림, 실행 가능한 프로토타입, 질문과 학습 도구를 함께 다룬다.

## 사용 순서

1. 지금 결정할 질문을 한 문장으로 적고, 아래에서 해당 절을 고른다.
2. [위키 인덱스](../../wiki/index.md)에서 관련 항목을 확인한 뒤 해당 위키 글을 읽는다. 구현 근거가 필요하면 연결된 레포의 README → 관련 하위 경로 순서로 확인한다.
3. 답에는 **확인한 근거, 이 프로젝트에 적용할 판단, 남은 미확인 사항**을 구분한다. 질문에 답할 근거와 적용 한계가 확인되면 조사를 마친다.

| 지금 결정할 질문 | 읽을 절 |
|---|---|
| 어떤 이해와 판단을 개발자에게 남길 것인가? | [이해와 참여](#이해와-참여) |
| 설명을 어떤 화면으로 보여주고, 사용자 판단을 어떻게 돌려받을 것인가? | [시각적 설명과 피드백](#시각적-설명과-피드백) |
| 코드 구조와 변경안을 어떻게 탐색하고 함께 고칠 것인가? | [구조 탐색과 공동 편집](#구조-탐색과-공동-편집) |
| 구현 전에 무엇을 합의하고, 결정 이유를 어떻게 남길 것인가? | [설계 합의와 의도 보존](#설계-합의와-의도-보존) |
| 사용자가 이해했는지 어떻게 확인하고 학습을 도울 것인가? | [이해 확인과 학습](#이해-확인과-학습) |

## 확인 범위와 선정 경계

- 2026-10-14 정리. 위키 분석 글과 로컬 레포 README를 읽고 레포의 `origin` 소유자를 확인했다. 아래 기능 설명은 문서 기준이며 실행 검증 결과가 아니다.
- 연결 이유는 이 프로젝트에 대한 적용 판단이다. 자료에 도구나 절차가 있다는 사실만으로 공동 이해가 향상됐다고 판단하지 않는다.
- 사용자가 만든 `LeeJuOh/claude-code-zero`와 그 안의 `vision-powers`, `rubber-duck-tutor`는 외부 참고 목록에서 제외한다.
- 링크는 프로젝트의 읽기 전용 심링크를 거친다. GitHub에서는 로컬 자료 링크가 열리지 않을 수 있다. 원문 주소는 각 위키 글에, 원격 레포 주소는 각 README와 git 설정에 있다.
- 현재 결정은 [ADR](../adr/)을 따른다. 외부 방식이 다른 경우에는 비교 대안으로 다룬다. 내부 상태 소유·동시 편집 구조는 [기존 아키텍처 조사](../research/2026-10-10-architecture-for-shared-understanding.md)에서 이어서 본다.

## 이해와 참여

기능의 가치를 판단할 때 읽는다. 사람이 설명을 읽는 것, 구조를 이해하는 것, 설계를 결정하는 것을 구분한다.

| 위키 글 | 참고할 질문·관점 |
|---|---|
| [Understanding is the New Bottleneck — Geoffrey Litt](../../wiki/summaries/understanding-new-bottleneck-litt.md) | 다음 설계에 참여하려면 어떤 이해가 필요한가? 설명·직접 조작하는 환경·공유 공간을 제안한다. |
| [DDD와 AI 코딩 — Miłosz Smółka](../../wiki/summaries/ddd-and-ai-coding-smolka.md) | 문제·용어·설계에 함께 합의하고, 구현에서 배운 것을 모델에 반영하는 과정. |
| [Comprehension Debt — Addy Osmani](../../wiki/summaries/comprehension-debt-osmani.md) | 코드 생성이 사람의 이해를 앞지를 때 생기는 격차. 테스트 통과와 시스템 이해를 구분한다. |
| [In Defense of Not Understanding Your Codebase — Sean Goedecke](../../wiki/summaries/in-defense-not-understanding-goedecke.md) | 대규모 시스템에서 부분 이해가 정상이라는 반대 관점. 이해를 요구할 범위와 비용을 판단한다. |
| [유비쿼터스 언어](../../wiki/concepts/ubiquitous-language.md) | 사람·문서·코드·에이전트가 공유하는 이름과 의미. 용어의 일관성은 업무 영역 안에서 유지한다. |

## 시각적 설명과 피드백

설명 매체와 사용자 입력 방식을 정할 때 읽는다. HTML도 직접적인 참고 대상이다. 사용자가 본 결과를 다음 에이전트 작업에 연결하는 방식까지 확인한다.

| 위키 글 | 참고할 질문·관점 |
|---|---|
| [The Unreasonable Effectiveness of HTML — Thariq Shihipar](../../wiki/summaries/unreasonable-effectiveness-html.md) | 공간 관계·동작·대안을 보여주고, 화면 조작을 텍스트로 내보내 에이전트에 돌려주는 과정. |
| [HTML as Agent Artifact](../../wiki/concepts/html-as-agent-artifact.md) | 시각적 산출물을 출력과 다음 입력으로 사용하는 여러 접근의 비교. |
| [독자 중심 기술 글쓰기](../../wiki/concepts/reader-centered-technical-writing.md) | 독자의 선행 지식, 설명 순서, 내용 보존, 화면 가독성. 쉬운 문체와 실제 이해는 별도로 확인한다. |

| 외부 레포 | 참고할 부분 |
|---|---|
| [answer-me-with-html](../../references/answer-me-with-html/README.md) | 설명·그림·코드·비교표를 한 HTML 페이지로 구성한다. 미결정 사항의 선택과 답변 수집도 참고한다. [위키 분석](../../wiki/summaries/answer-me-with-html.md). |
| [effective-html](../../references/effective-html/README.md) | 질문에 맞게 계획·다이어그램·와이어프레임·동작하는 프로토타입을 선택한다. |
| [html-plan](../../references/claude-plugins-community/html-plan/README.md) | 구현 계획을 주장 트리(무엇 → 어떻게 → 어디)로 쓰고, 주장마다 증거(목업·상태 머신·호출 스택·스키마·코드) 하나를 붙인다. 결정은 그 결정이 바꾸는 주장에 둔다. 사용자가 고른 답·스키마 수정·코멘트를 응답 하나로 에이전트에게 돌려준다. Thariq Shihipar 작성. 커뮤니티 마켓플레이스 미러 안에 있다. effective-html의 같은 이름 스킬과 다르다. |
| [visual-explainer](../../references/visual-explainer/README.md) | 구조·변경·계획을 읽는 순서와 HTML 화면 구성. [위키 분석](../../wiki/summaries/visual-explainer.md). |
| [diagram-design](../../references/diagram-design/README.md) | 설명할 관계에 맞는 그림 종류·정보량·HTML/SVG 표현. [위키 분석](../../wiki/summaries/diagram-design.md). 색 규칙은 [ADR-0015](../adr/0015-color-only-for-change-status.md)를 따른다. |
| [comprendo](../../references/comprendo/README.md) | 계획과 구현 사이에 승인 단계를 둔다. 현재 구조와 바뀐 구조의 아키텍처 그림을 나란히 보여주고, 새 요소를 강조한다. 사용자의 승인·거절을 에이전트에게 돌려준다. |
| [open-design](../../references/open-design/README.md) | 프로토타입을 공유하고 피드백을 받아 같은 프로젝트에서 수정하는 과정. UI 설계 분야의 보조 사례다. |

## 구조 탐색과 공동 편집

기존 코드와 변경안을 보여주거나, 사용자 교정을 다음 에이전트 작업에 반영할 때 읽는다.
도구들을 넓게 비교해야 하면 [코드 이해 도구 비교](../../wiki/comparisons/code-understanding-tools.md)에서 사람 온보딩·지식 보존·에이전트 검색 목적을 먼저 구분한다.

| 외부 레포 | 참고할 부분 |
|---|---|
| [whiteboard](../../references/whiteboard/README.md) | 공동 설계 공간, 그림에서 코드로 이동, 에이전트의 결정 기록. [위키 분석](../../wiki/summaries/whiteboard.md). 커밋 고정 근거 방식과 이 프로젝트의 선택은 [ADR-0005](../adr/0005-server-checks-evidence-and-demotes.md)에서 비교한다. |
| [archify](../../references/archify/README.md) | 인터랙티브 그림에서 필요한 구조·경로·소스를 탐색하는 방식. |
| [Understand-Anything](../../references/Understand-Anything/README.md) | 구조 그래프·업무 흐름·설명·가이드 투어로 전체에서 필요한 부분으로 들어가는 방식. |
| [gitdiagram](../../references/gitdiagram/README.md) | 레포 구조의 그림과 코드 연결. 처음 구조를 파악하는 경험. [위키 분석](../../wiki/summaries/gitdiagram.md). |
| [pr-lens](../../references/pr-lens/README.md) | 기존 구조 안에서 변경 부분을 구분하고 데이터 흐름을 순서대로 보여주는 방식. [위키 분석](../../wiki/summaries/pr-lens.md). 실제 변경 영향은 코드에서 별도로 확인한다. |
| [drawio-skill](../../references/drawio-skill/README.md) | 사람이 고친 배치를 유지하는 갱신, 여러 관점의 그림, 변경 비교. |
| [excalidraw-toolkit](../../references/excalidraw-toolkit/README.md) | 같은 매체의 경쟁 사례. 기존 `.excalidraw`를 요소 ID로 범위를 정해 고치고, 사람의 메모와 배치를 보존한다. 고치기 전과 후의 PNG와 변경 기록을 돌려준다. 코드가 바뀐 뒤 수동 수정을 지키며 그림을 갱신한다. |
| [mcp-excalidraw-yctimlin](../../references/mcp-excalidraw-yctimlin/README.md) | 포크 원본. 라이브 캔버스를 읽고, 고치고, 다시 확인하는 기반. 포크 선택은 [ADR-0001](../adr/0001-fork-upstream-server.md). |
| [excalidraw-diagram-skill](../../references/excalidraw-diagram-skill/README.md) | 개념에 맞는 그림 형태, 실제 코드·데이터 예시, 렌더링 후 시각 검증. [위키 분석](../../wiki/summaries/excalidraw-diagram.md). 재사용 범위는 AGENTS.md의 포크 근거 규약을 따른다. |
| [drawio-mcp](../../references/drawio-mcp/README.md) · [excalidraw-mcp](../../references/excalidraw-mcp/README.md) | 채팅의 그림과 편집 화면을 연결하는 경험. 호스트 지원은 적용 시 확인한다. 공식 Excalidraw MCP의 기존 기각 이유는 ADR-0001에 있다. |
| [CodeWiki](../../references/CodeWiki/README.md) | 모듈별 문서와 그림으로 기존 시스템을 설명하는 온보딩 방식. |

## 설계 합의와 의도 보존

말로 정할 질문, 직접 보고 결정할 질문, 다음 구현에 남길 내용을 구분할 때 읽는다.

| 위키 글 | 참고할 질문·관점 |
|---|---|
| [Finding Your Unknowns — Thariq Shihipar](../../wiki/summaries/fable-field-guide-unknowns.md) | 미정 사항과 숨은 가정을 질문·목업·구현 기록으로 드러낸다. |
| [Align Before You Build — Matt Pocock](../../wiki/summaries/grill-with-docs-pocock.md) | 질문으로 설계와 용어를 맞추고 합의를 기록한다. |
| [Grill 운용 실패 — Matt Pocock](../../wiki/summaries/grill-failure-modes-pocock.md) | 대화만으로 답하기 어려운 질문에서 프로토타입으로 넘어갈 시점. |
| [Handoff와 Prototype — Matt Pocock](../../wiki/summaries/handoff-prototype-pocock.md) | 설계 질문에 답하는 작은 실행물과 세션 사이의 맥락 전달. |
| [Effective Software Design Document — Michael Lynch](../../wiki/summaries/effective-software-design-doc.md) | 중요한 제약·대안·결정 이유를 남기는 방법. |
| [pstack Guide Pt. 2 — Lauren Tan](../../wiki/summaries/pstack-guide-pt2.md) | 문제를 재진술하고 동작·결정 이력을 조사하며 설계 방향을 잡는 방법. |
| [의도 부채](../../wiki/concepts/intent-debt.md) · [Grill·ADR·의도 연결](../../wiki/comparisons/grill-adr-intent-design-flow.md) | 사용자 문제, 결정 이유, 구현 결과를 이어서 확인한다. 원문 주장과 위키의 조합 제안을 구분한다. |

| 외부 레포 | 참고할 부분 |
|---|---|
| [mattpocock-skills](../../references/mattpocock-skills/README.md) | 설계 질문·도메인 모델링·프로토타입을 연결하는 작은 절차. |
| [pstack](../../references/pstack/README.md) | `how`·`why`·`teach`로 동작과 이유를 배우고 `architect`로 대안을 조사하는 방식. 로컬 사본은 외부 미러다. |
| [c4-model-skill](../../references/c4-model-skill/README.md) | C4 모델로 소프트웨어 구조를 수준별로 그린다. 새 설계·코드 문서화·문서 추출·리뷰·갱신을 모드로 나눈다. 질문은 한 번에 5개까지, 수준마다 사용자 확인을 받는다. |
| [superpowers](../../references/superpowers/README.md) | 목적을 묻고 설계를 읽을 수 있는 작은 단위로 보여주며 합의하는 과정. |
| [rubberduck-mcp](../../references/rubberduck-mcp/README.md) | 에이전트가 불확실한 부분을 사용자에게 묻는 대화 통로. `superiorsd10`의 외부 레포이며 사용자 소유 튜터와 별개다. |

## 이해 확인과 학습

설명을 제공한 뒤 무엇을 확인할지, 작업 흐름에 어느 정도 개입할지 정할 때 읽는다.

| 자료 | 참고할 부분·적용 한계 |
|---|---|
| [explain-diff — Geoffrey Litt](../../wiki/summaries/explain-diff-skill.md) | 배경 → 직관 → 코드 → 퀴즈. 사람이 변경을 판단하기 전에 이해를 쌓는 설명 순서. |
| [AI와 스킬 형성 — Anthropic 연구](../../wiki/summaries/ai-skill-formation-rct.md) | AI 사용 방식과 학습의 관계. 그림 협업의 효과를 검증한 연구는 아니다. |
| [learning-opportunities 레포](../../references/learning-opportunities/README.md) | 실제 프로젝트 변경을 바탕으로 선택형 학습 활동과 레포 탐색 학습을 제공한다. |
| [no-numb 레포](../../references/no-numb/README.md) | 변경 이해 퀴즈를 기본 통과 조건으로 둔다. 강제 확인과 선택형 학습의 비용을 비교할 사례이며 이 프로젝트에 도입한 규칙은 아니다. |

## 목록을 갱신할 때

새 자료는 답할 설계 질문이 있는 절에 추가하고, 연결 이유를 한 줄로 적는다.
위키 글이나 README에서 바로 확인할 수 있는 설치법·버전·성능 수치는 원문에 둔다.
동작을 구현 근거로 사용할 때는 관련 소스와 확인 시점을 조사 문서에 남긴다. 이 지도에는 해당 조사로 가는 링크만 추가한다.

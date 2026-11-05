# archdraw 재개편 목표와 참고 자료

2026-11-06 대화에서 확인한 목표, 표현 요구, 참고 자료를 모은다. 스킬을 전면 재개편할 때의 출발점이다. 세부 동작과 구현 순서는 기능별로 정한 뒤 `.scratch/<feature-slug>/`에 명세와 이슈로 작성한다.

## 해결하려는 문제

개발자는 구현을 에이전트에게 맡겨도 시스템의 구조와 변경 이유를 이해하고 설계를 결정해야 한다. 코드를 전부 읽거나 긴 글 설명을 해석하는 부담을 줄여야 한다. 에이전트가 개발자의 의도를 잘못 이해한 부분도 개발자가 짚을 수 있어야 한다.

archdraw는 사람과 에이전트가 같은 캔버스를 보며 서로의 이해를 맞추는 스킬이다. 그림은 두 참여자가 구조와 동작을 논의하는 공통 언어다. 에이전트가 그린 결과를 사람이 읽는 과정과, 사람이 고치거나 그린 내용을 에이전트가 이해하는 과정을 함께 다룬다.

## 원하는 사용 경험

1. 에이전트는 현재 질문에 맞는 그림으로 자기 이해를 보여준다.
2. 사용자는 그림에서 의도와 다른 부분을 짚는다. 직접 고치거나 새로 그릴 수도 있다.
3. 에이전트는 사용자 표시를 읽고 자기 이해와 그림을 고친다.
4. 더 깊게 볼 부분이 생기면 그림을 추가한다. 사용자는 큰 구조와 세부 동작을 오간다.

대상은 기존 코드, 변경안, 새 설계, 기술 개념이다. 아키텍처·서비스 구성·시퀀스·상태·데이터 관계 등 질문에 맞는 그림을 쓴다. 그림의 종류와 깊이는 사용자가 지금 이해하거나 결정하려는 내용에 맞춘다.

그림의 정확성과 디자인은 사용자가 구조를 이해하고, 틀린 부분을 짚고, 다음 변경을 결정하도록 도와야 한다.

## 스킬 구조의 필수 참고

**pstack은 이번 재개편의 필수 참고다.** 사용자는 원칙·템플릿을 두고 스킬 하나가 필요한 절차로 안내하는 구조를 원했다. 11/06에 이를 다시 확인했다. 동작과 디자인의 주요 레퍼런스 5개와 별도로 다룬다.

참고 원문은 [pstack 라우터](../../references/pstack/skills/poteto-mode/SKILL.md), [플레이북](../../references/pstack/skills/poteto-mode/playbooks/), [teach](../../references/pstack/skills/teach/SKILL.md)다. [위키 구조 분석](../../wiki/summaries/pstack-skill-design.md)은 읽기 안내로 쓴다.

| 구성 | archdraw에서 참고할 역할 |
|---|---|
| 진입점 | 현재 질문에 필요한 절차와 자료를 고른다. |
| 원칙 | 그림의 범위·근거·표현을 판단하는 공통 기준을 둔다. |
| 절차 | 선택한 작업의 순서와 완료 기준을 필요할 때 읽는다. |
| 템플릿과 참고 자료 | 그림 종류·계약 메모·디자인 예시를 해당 작업에서 읽는다. |

pstack의 스킬 수나 공통 지시문 전체를 복제하는 것이 목표는 아니다. 필요한 판단만 분리하고 실제 사용 결과로 구조를 확인한다. `teach`의 조사 결과 재사용과 그림을 단계별로 더하는 설명 방식도 참고한다.

이전 원장에서 확정된 다음 방향도 유지한다. 원장을 삭제하며 새 문서에서 빠졌던 내용이다.

- 자동으로 호출할 수 있는 스킬 하나를 진입점으로 둔다. 사용자가 직접 부르는 경로도 함께 둔다.
- 훅은 우선 쓰지 않는다. 호출이 부족하면 평가 결과를 보고 다시 검토한다.
- pstack·mattpocock과 함께 쓰며 다른 스킬이 작업 중 archdraw를 부를 수 있어야 한다. 역할을 어디까지 겸할지는 기능별로 정한다.
- 피드백은 작게 시작한다. 사용자가 "봐"라고 하면 캔버스를 읽고, 표시의 뜻을 모르면 묻는다.
- 리뷰·버그·계획 같은 작업 순간만으로 내부 절차를 나누지 않는다. 그림이 답할 근본 질문을 기준으로 분류한다. 실제 분류는 아직 정하지 않았다.

## 계약과 데이터 표현

사용자는 show-me의 diff 표현처럼 API 응답, 메시지 페이로드, DB 테이블과 데이터를 읽기 쉽게 보여주길 원한다. 아키텍처나 다이어그램 옆에 메모로 붙이는 방식을 선호한다고 제안했다.

그림은 참여자와 관계를 보여주고, 메모는 그 관계에서 다루는 구체적인 데이터를 보여주는 방향이다.

| 대상 | 메모에서 확인할 내용 |
|---|---|
| API | 메서드·경로, 요청과 응답, 상태 코드, 실제 값 예시. |
| 메시지 | 토픽·이벤트 이름, 페이로드의 모양과 값 예시. |
| DB | 테이블·컬럼·키, 저장되는 행의 예시. 구조와 데이터를 구분한다. |

다음 표현 방식은 에이전트 제안이다. API·메시지 메모는 해당 화살표 옆에 두고, DB 메모는 관련 DB나 접근 관계 옆에 둔다. 평소에는 JSON·SQL·표처럼 내용에 맞는 형식을 쓴다. 변경을 설명할 때는 메모 안에서 줄 단위 diff로 차이를 보여준다.

아래는 주문 API 응답 변경을 설명하는 가상 예시다.

```diff
POST /orders → 201 Created

 {
   "orderId": "ord_123",
-  "status": "created"
+  "status": "pending",
+  "paymentId": null
 }
```

메모의 위치·크기·정보량과 펼쳐 보는 방식은 디자인 스펙에서 정한다. 데이터 관계 자체가 질문이면 ERD 같은 독립 그림을 쓸 수 있다. 계약 메모와 데이터 모델 그림의 분담도 함께 정한다.

기존 [계약 지침](../../plugin/skills/archdraw/references/situations/contract.md)은 경계의 주소와 실제 값, 화살표 옆 메모를 이미 규정한다. [캔버스 규격](../canvas-guide.md)의 Contract note는 줄 단위 diff를 규정한다. 재개편에서는 이 요구를 유지하면서 실제 표현과 읽기 경험을 다시 설계한다. 기존 규칙의 존재가 원하는 품질을 달성했다는 뜻은 아니다.

## 참고 자료를 고르는 기준

사용자는 `show-me`와 archify를 주 참고 대상으로 삼고, whiteboard도 주요 후보라고 확인했다. 디자인은 이 도구들과 다른 참고 레포에서도 함께 본다. 시스템 아키텍처·서비스 아키텍처·시스템 디자인·UML 샘플은 보완 자료다.

더 목표에 맞는 자료가 있으면 기존 후보보다 높이 평가한다. 다음 질문을 기준으로 비교한다.

참고 자료와 기능의 채택 기준은 사람이 구조·동작·변경 결과를 이해하고 자기 의도를 전달해 설계에 참여할 수 있는가다. 특정 도구의 외형이나 기능 목록을 재현하는 것이 목적은 아니다.

- 지금 질문에 필요한 구조와 동작을 알아보기 쉬운가.
- 전체 맥락을 유지하며 필요한 부분을 깊게 볼 수 있는가.
- 사람이 틀린 부분을 짚고 수정 의도를 에이전트에게 전달하기 쉬운가.
- 그림·설명·코드 근거·데이터 예시가 연결되는가.
- 같은 부분과 바뀐 부분을 구분하기 쉬운가.

## 동작과 디자인의 주요 레퍼런스

아래의 적용 판단은 이번 조사에서 정리한 추천이다. 개별 기능을 그대로 도입한다는 결정은 아니다.

| 자료 | 우선 참고할 부분 | 적용할 때 구분할 점 |
|---|---|---|
| [show-me](../../references/humanlayer-skills/plugins/show-me/skills/show-me/SKILL.md) | 현재 질문에 답하는 최소 표현. 필요한 호출·상태·책임만 남기는 기준. 짧은 설명과 그림의 배치. 변경 부분을 드러내는 diff. | 자체 캔버스나 양방향 편집 구현은 없다. |
| [archify](../../references/archify/README.md), [디자인 문서](../../references/archify/DESIGN.md), [탐색 지침](../../references/archify/archify/references/viewer-runtime.md) | 주 경로 강조와 주변 맥락 유지. 선택한 요소의 상세·관계·코드 근거 열기. 설명 단계와 그림 연결. | 작성된 경로 탐색과 실제 실행 추적은 다르다. HTML 렌더러 전체 도입은 결정하지 않았다. |
| [whiteboard](../../references/whiteboard/README.md), [작성 지침](../../references/whiteboard/packages/review/instructions/authoring.md) | 그림에서 코드로 이동. 선택한 부분을 질문 맥락으로 전달해 다시 그리기. 진입점에서 독자가 이해할 순서로 변경 설명. 계약의 코드 표현과 데이터 모델 보기. | 교정 전달의 디자인에서 우선 비교한다. 별도 IDE와 코드 리뷰용 문서 구조는 이 프로젝트의 필수 조건이 아니다. |
| [visual-explainer](../../references/visual-explainer/README.md), [계획 표현](../../references/visual-explainer/plugins/visual-explainer/references/plans.md) | 설명의 주장과 그림의 해당 부분 연결. 선택에 따라 그림 변경. 사용자 응답을 다음 수정으로 연결. | 일반 브라우저의 응답 복사와 지원 호스트의 채팅 전달을 구분한다. 자유 편집 캔버스와는 다르다. |
| [diagram-design](../../references/diagram-design/README.md), [정보량과 분할](../../references/diagram-design/skills/diagram-design/references/layout-budget.md), [변경 전후](../../references/diagram-design/skills/diagram-design/references/type-architecture-delta.md) | 의미에 맞는 그림 선택. 간격·범례·전체와 상세 분할. 같은 요소의 위치와 ID를 유지하는 변경 비교. | 노드 수 제한과 색·점선 규칙은 이 프로젝트에 맞게 다시 정한다. |

질문을 그림으로 바꾸는 기준은 show-me를 먼저 본다. 구조 탐색의 디자인은 archify를 먼저 본다. 교정 전달은 whiteboard를, 대안 선택은 visual-explainer를 우선 비교한다. 목적별로 적합성을 판단한다.

## 이번에 함께 볼 표현 자료

[excalidraw-diagram-skill](../../references/excalidraw-diagram-skill/README.md)을 계약·데이터 표현의 보완 자료로 추가한다. [SKILL.md](../../references/excalidraw-diagram-skill/SKILL.md)의 Evidence Artifacts는 실제 코드, JSON 페이로드, 입력·출력 예시를 그림에 놓는 방법을 다룬다. 개요·영역·세부 예시를 함께 구성하고 렌더 결과를 보고 고치는 절차도 있다.

API 응답·메시지·DB 메모 요구와 직접 맞으므로 이번 재개편에서 함께 읽는다. 문장이나 구현을 복사하지 않고 아이디어를 참고한다. 실제 값 예시를 표시하는 것과 관계의 정확성을 검증하는 것은 구분한다.

기본 참고는 동작·디자인 5개, 스킬 구조의 pstack 1개, 계약·데이터 표현 보완 1개다. 아래 추가 요구의 참고 4개까지 포함해 11개를 다룬다. 각 자료는 필요한 부분을 선택해서 읽는다.

## 이번 재개편에 포함할 네 가지 요구

사용자는 다음 네 가지를 모두 이번 재개편에서 함께 다루기로 했다. 특히 전체 맥락을 유지하는 상세 탐색을 강하게 선호했다. 네 자료를 해당 기능의 설계에 함께 참고하고, 구체적인 동작과 구현 순서는 스펙에서 정한다.

| 참고 자료 | 원하는 방향 | 설계할 때 정할 내용 |
|---|---|---|
| [drawio-skill](../../references/drawio-skill/skills/drawio-skill/references/diagram-ir.md) | 사람이 고친 그림을 다음 갱신에서 어떻게 다룰지 명확히 한다. | 위치·스타일·라벨·속성별 보존 규칙과 충돌 처리. |
| [pr-lens](../../references/pr-lens/packages/cli/README.md) | 사람이 정한 이름과 묶음을 다음 그림에서도 유지한다. | 그림 한 장의 수정과 프로젝트에서 계속 사용할 표현의 구분. 교정 규칙의 저장·갱신 방식. |
| [Understand-Anything](../../references/Understand-Anything/understand-anything-plugin/skills/understand-explain/SKILL.md) | 큰 구조에서 상세로 들어가도 호출하는 쪽·호출받는 쪽·소속 영역을 함께 이해한다. | 내부와 주변 관계를 얼마나 보여줄지, 원래 그림과 상세 그림을 어떻게 연결할지. archify와 함께 비교한다. |
| [anatomy](../../references/anatomy/SKILL.md) | 구조나 조건을 바꾸면 동작과 결과가 어떻게 달라지는지 보여주는 설명 방식을 참고한다. | 설계 대안 비교와 기술 개념 설명에 맞는 표현. 정적인 비교·단계별 그림·상호작용 중 질문에 필요한 방식. |

anatomy에서는 설명 방식을 참고한다. 사용자는 3D·애니메이션·조작 기능 자체를 요청한 것이 아니다. 아키텍처를 바꿀 때 생기는 동작 차이와, 캐시처럼 입력·상태·결과가 연결되는 기술 개념 설명을 모두 원한다. 예를 들어 동기 처리와 큐 기반 비동기 처리를 비교할 때, 박스의 차이에 더해 응답 시점·작업 주체·실패 후 처리의 차이를 보여준다. 실제 시스템에서 관찰한 결과와 설계상 예상하는 결과는 구분한다.

사람의 편집 중 무엇을 보존할지는 이번 스펙에서 정한다. 자동 병합이나 교정 규칙 저장까지 구현할지는 별도 판단이다. drawio-skill은 양쪽이 같은 항목을 다르게 바꾼 충돌을 보존하지만, 사람만 바꾼 라벨을 덮을 수 있다. [갱신 코드](../../references/drawio-skill/skills/drawio-skill/scripts/diagram_ir.py)의 조건을 확인했으며, 모든 수동 수정 보존의 모범 사례로 취급하지 않는다.

[open-design](../../references/open-design/apps/web/src/runtime/comment-bridge.ts)도 검토했다. 댓글에 대상 ID·선택자·좌표를 붙이고 대상을 못 찾으면 별도 메시지를 보낸다. 현재는 whiteboard의 선택 맥락과 역할이 겹치므로 우선순위를 낮춘다. 표시 대상이 모호하거나 수정 후 사라지는 문제가 생기면 다시 본다.

옛 목록의 코드 그래프 추출 도구는 구조 수집 방식이 필요해질 때 비교한다. 승인 버튼·강제 퀴즈 중심 도구는 현재의 작은 피드백 범위를 정하는 주 자료로 쓰지 않는다. 단순 링크 색인은 구체적인 그림이나 구현 원문을 찾는 입구로만 쓴다.

## 그림 표현을 보완할 샘플

| 자료 | 읽을 부분 |
|---|---|
| [ByteByteGo System Design 101](../../references/system-design-101/README.md) | [알림 시스템](../../references/system-design-101/data/guides/how-does-a-typical-push-notification-system-work.md)의 단계별 설명, [실시간 통신 비교](../../references/system-design-101/data/guides/shortlong-polling-sse-websocket.md), [캐시 전략 비교](../../references/system-design-101/data/guides/top-5-caching-strategies.md). |
| [stack-diagram](../../references/stack-diagram/README.md), [예시](../../references/stack-diagram/docs/hero.png) | 서비스 묶음, 기술 이름과 역할의 구분, 관계 label, 화살표와 글자의 간격. |
| [C4 표기 지침](https://c4model.com/diagrams/notation), [검토 항목](https://c4model.com/diagrams/checklist), [OMG UML](https://www.omg.org/spec/UML/2.5.1) | 그림의 범위와 관계 의미, 필요한 그림의 표기법. |
| [AWS Reference Architecture Diagrams](https://docs.aws.amazon.com/reference-architecture-diagrams/) | 배포 경계와 서비스 조합을 그리는 공식 샘플의 진입점. |

표기법과 시각 스타일은 구분한다. C4는 특정 표기법을 강제하지 않고 제목·범위·범례·관계 설명을 권한다. UML·C4 샘플의 외형만으로 archdraw의 디자인을 정하지 않는다.

## 문제와 목표를 이해할 위키

| 자료 | 이 프로젝트에서 읽을 이유 |
|---|---|
| [Understanding is the New Bottleneck](../../wiki/summaries/understanding-new-bottleneck-litt.md) | 사람이 다음 설계에 참여하려고 이해한다는 목적. 설명과 함께 생각하는 공간을 연결한다. 발표와 사용 경험이다. |
| [Comprehension Debt](../../wiki/summaries/comprehension-debt-osmani.md) | 코드가 늘어나는 속도와 사람이 이해하는 속도의 차이. 테스트 통과와 이해를 구분하는 문제 설명이다. |
| [Here Be Monsters](../../wiki/summaries/here-be-monsters-adrq.md)와 [부분 이해 옹호](../../wiki/summaries/in-defense-not-understanding-goedecke.md) | 전체 코드를 다 읽지 않아도 시스템을 소유하고, 필요한 부분을 깊게 보는 기준. 두 글은 경험과 의견이다. |
| [유비쿼터스 언어](../../wiki/concepts/ubiquitous-language.md) | 그림의 이름과 관계를 공유하는 언어로 다룬다. 함께 모델을 고치는 활동에 주목한다. |
| [시각적 피드백 계약](../../wiki/concepts/visual-feedback-contracts.md) | 사람이 고친 대상과 뜻을 다음 작업으로 잇는다. 열람·이해·승인·수정 완료를 구분한다. 여러 구현의 위키 종합이다. |
| [의도 부채](../../wiki/concepts/intent-debt.md) | 코드만 읽어 복원할 수 없는 선택 이유를 남기는 문제. 개념 정리와 사고실험이다. |

[공동 이해 참고 도구 비교](../../wiki/comparisons/shared-understanding-reference-tools.md)는 관련 구현을 더 찾을 때의 지도다. 그 문서가 가리키는 예전 프로젝트 선정 문서는 삭제됐으므로 현재 방향은 이 문서를 따른다.

[AI와 스킬 형성 실험](../../wiki/summaries/ai-skill-formation-rct.md)은 평가 방법을 정할 때 읽는다. 새 라이브러리 학습 직후 평가라는 범위를 유지한다. 캔버스의 효과나 강제 퀴즈의 필요성을 입증하는 자료로 쓰지 않는다. [Explain Diff](../../wiki/summaries/explain-diff-skill.md)는 변경 설명 순서를 다룰 때 읽는다.

## 다음에 정할 내용

- 첫 버전에서 지원할 그림 종류와 줌 레벨 이동 방식.
- 그림·설명·계약 메모를 함께 놓는 배치와 정보량.
- 사람이 고친 내용과 질문을 에이전트가 읽고 반영하는 구체적인 절차.
- 사람이 정한 이름·묶음을 다음 그림에 반영하는 범위와 방식.
- 설계 대안과 조건 변화에 따른 동작 차이를 보여주는 표현 방식.
- 다른 스킬과의 역할 분담, 자동 호출 조건, 원칙·절차·템플릿의 구체적인 분리.
- 그림을 보고 사용자가 오류를 짚거나 다음 설계를 결정할 수 있는지 확인할 평가 과제.

색과 선의 뜻도 재검토 대상이다. archify의 종류별 색과 diagram-design의 강조색은 현재 [ADR-0015](../adr/0015-color-only-for-change-status.md)와 충돌한다. 여러 샘플의 응답·비동기·배포 점선은 [CONTEXT.md](../../CONTEXT.md)의 점선 뜻과 다르다. 새 표기법을 정하면 관련 ADR·용어·캔버스 규격을 함께 갱신한다.

## 기존 시스템 문서의 역할

| 문서 | 남기는 이유 |
|---|---|
| [README](../../README.md), [한국어 README](../../README.ko.md) | 현재 제품 설명과 설치·사용 안내. 재개편 구현에 맞춰 갱신한다. |
| [CONTEXT.md](../../CONTEXT.md), `docs/adr/` | 현재 용어와 결정 근거. 새 설계가 바꾸는 결정을 식별할 때 읽는다. |
| [캔버스 규격](../canvas-guide.md), [현재 스킬](../../plugin/skills/archdraw/SKILL.md)과 참고 문서 | 현재 동작을 지시하는 원본. 새 스킬로 교체할 때 함께 정리한다. |
| [MCP 안내문 전달 조사](2026-09-19-mcp-guidance-delivery.md) | ADR-0006과 ADR-0014가 인용하는 기존 시스템의 결정 근거. |
| [AGENTS.md](../../AGENTS.md), `docs/agents/`, [archdraw-report](../../tools/archdraw-report/README.md) | 프로젝트 작업 규약과 현재 도그푸딩 도구의 사용 안내. |

이 문서가 예전 재설계 조사 원장과 레포별 단계 비교표를 대체한다. 폐기한 방향과 넓은 후보 목록은 Git 기록에 남긴다. 기존 시스템 문서를 유지하는 것은 그 설계를 새 스킬에도 그대로 채택한다는 뜻이 아니다.

## 조사 근거

로컬 스킬·설계 문서를 읽고 archify, whiteboard, diagram-design, stack-diagram의 예시 이미지를 확인했다. 제품을 실행해 피드백 왕복을 비교한 결과는 아니다. ByteByteGo는 가이드 본문과 이미지 주소, AWS는 목록을 확인했다. UML 규격 본문 전체는 확인하지 않았다.

확인한 로컬 커밋은 humanlayer-skills `653b6411`, archify `25cf3708`, whiteboard `bdaf2fd3`, visual-explainer `5f37886`, diagram-design `0b9b10c`, stack-diagram `1ed53e3`, system-design-101 `b28380a`다. 웹 자료는 2026-11-06에 확인했다.

추가 대조한 로컬 커밋은 pstack `18b6c36`, excalidraw-diagram-skill `8646fcc`다. 이전 조사 원장과 비교표는 프로젝트 커밋 `61544aa457c4221dff402d37459c87d3f4202a66`의 `docs/research/2026-10-24-redesign-references.md`와 `docs/research/2026-10-24-redesign-matrix.md`를 `git show`로 읽었다. 이 기록의 후보와 기존 합의를 대조해 이번 참고 범위를 정했다.

추가 자료 대조는 drawio-skill `5727082`, pr-lens `0616f49`, Understand-Anything `e24fcf6`, anatomy `1482e84`, open-design `e03d5c23`의 문서·관련 소스를 읽은 결과다. 각 제품의 동작을 실행한 비교는 아니다.

# archdraw 재개편 목표와 참고 자료

2026-11-06에 작성했다. 2026-11-07 대화의 목표 구체화, 최근 위키 검토, 최신화한 참고 레포 검수 결과를 반영했다. 스킬을 전면 재개편할 때의 출발점이다. 세부 동작과 구현 순서는 기능별로 정한 뒤 `.scratch/<feature-slug>/`에 명세와 이슈로 작성한다.

## 해결하려는 문제

개발자는 구현을 에이전트에게 맡기면서 코드를 직접 읽는 시간이 줄어든다. 그래도 아키텍처·디자인·코드 관리 방향을 정하고 변경안을 판단해야 한다. 구조와 동작, 변경 이유를 이해할 수단이 필요하다.

사용자는 에이전트가 이해한 목표와 해결하려는 문제를 전문적인 그림·아키텍처·다이어그램으로 보고 싶어 한다. 긴 글과 전체 코드를 매번 읽는 부담을 줄이고, 책임 경계·데이터·순서·실패 처리·트레이드오프를 판단하려는 것이다. 필요한 부분은 실제 코드와 실행 근거로 내려가 확인할 수 있어야 한다.

에이전트가 하는 제안과 기존 로직 설명을 빠르고 쉽게 이해하는 도구로도 쓴다.

archdraw는 사람과 에이전트가 같은 캔버스를 보며 그 이해를 맞추는 스킬이다. 자신이 에이전트에게 맡긴 구현뿐 아니라 동료나 다른 에이전트의 작업을 이해하고 리뷰할 때도 쓴다. 그림은 두 참여자가 구조와 동작을 논의하는 공통 언어다. 사람이 그림을 읽는 과정과, 사람이 고치거나 그린 내용을 에이전트가 이해하는 과정을 함께 다룬다.

## 원하는 사용 경험

1. 에이전트는 현재 질문에 맞는 그림으로 자기 이해를 보여준다.
2. 사용자는 그림에서 의도와 다른 부분을 짚는다. 직접 고치거나 새로 그릴 수도 있다.
3. 에이전트는 사용자 표시를 읽고 자기 이해와 그림을 고친다.
4. 더 깊게 볼 부분이 생기면 그림을 추가한다. 사용자는 큰 구조와 세부 동작을 오간다.

대상은 기존 코드, 변경안, 새 설계, 기술 개념이다. 아키텍처·서비스 구성·시퀀스·상태·데이터 관계 등 질문에 맞는 그림을 쓴다. 그림의 종류와 깊이는 사용자가 지금 이해하거나 결정하려는 내용에 맞춘다.

성공 기준은 사용자가 그림에서 구조와 변경 이유를 설명하고, 잘못된 이해를 짚고, 자기 의도를 전달해 다음 설계를 결정할 수 있는가다. 그림의 개수나 외형만으로 성공을 판단하지 않는다. 이 기준은 아직 평가 과제로 검증하지 않았다.

기존 코드의 사실, 아직 구현하지 않은 변경안, 설명용 가정, 실제 실행에서 확인한 결과를 구분한다. 코드 링크가 유효하거나 그림이 렌더됐다는 사실만으로 관계와 설명의 정확성을 보증하지 않는다.

## 스킬 구조의 필수 참고

**pstack은 이번 재개편의 필수 참고다.** 사용자는 원칙·템플릿을 두고 스킬 하나가 필요한 절차로 안내하는 구조를 원했다. 11/06에 이를 다시 확인했다. 동작·디자인 참고와 별도로 다룬다.

참고 원문은 [pstack 라우터](../../references/pstack/skills/poteto-mode/SKILL.md), [플레이북](../../references/pstack/skills/poteto-mode/playbooks/), [teach](../../references/pstack/skills/teach/SKILL.md)다. [위키 구조 분석](../../wiki/summaries/pstack-skill-design.md)은 읽기 안내로 쓴다.

| 구성 | archdraw에서 참고할 역할 |
|---|---|
| 진입점 | 현재 질문에 필요한 절차와 자료를 고른다. |
| 원칙 | 그림의 범위·근거·표현을 판단하는 공통 기준을 둔다. |
| 절차 | 선택한 작업의 순서와 완료 기준을 필요할 때 읽는다. |
| 템플릿과 참고 자료 | 그림 종류·계약 메모·디자인 예시를 해당 작업에서 읽는다. |

pstack에서는 필요한 판단을 원칙·절차·템플릿으로 나누는 구조를 참고한다. `teach`의 조사 결과 재사용과 그림을 단계별로 더하는 설명 방식도 참고한다. 기능·버그·배포 같은 개발 작업별 플레이북 전체를 archdraw의 그림 분류로 옮기지는 않는다.

이전 원장에서 확정된 다음 방향도 유지한다. 원장을 삭제하며 새 문서에서 빠졌던 내용이다.

- 자동으로 호출할 수 있는 스킬 하나를 진입점으로 둔다. 사용자가 직접 부르는 경로도 함께 둔다.
- 훅은 우선 쓰지 않는다. 호출이 부족하면 평가 결과를 보고 다시 검토한다.
- pstack·mattpocock과 함께 쓰며 다른 스킬이 작업 중 archdraw를 부를 수 있어야 한다. 역할을 어디까지 겸할지는 기능별로 정한다.
- 피드백은 작게 시작한다. 사용자가 "봐"라고 하면 캔버스를 읽고, 표시의 뜻을 모르면 묻는다.
- 리뷰·버그·계획 같은 작업 순간만으로 내부 절차를 나누지 않는다. 그림이 답할 근본 질문을 기준으로 분류한다. 실제 분류는 현재 [상황 23개](../../plugin/skills/archdraw/references/routing-table.md)에서 출발해 유지·통합·보완을 정한다.

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

사용자는 whiteboard·archify·show-me를 목표에 가장 가까운 주 참고 대상으로 확인했다. HTML로 설명하는 레포에서도 필요한 그림 선택·배치·탐색·비교 방법을 참고한다. HTML 출력, 별도 IDE, 각 도구의 전체 기능을 도입한다는 뜻은 아니다.

채택 기준은 사람이 코드를 일일이 읽지 않아도 구조·동작·변경 결과를 이해하고 설계에 참여할 수 있는가다. 다음 질문으로 필요한 부분을 고른다.

- 지금 이해하거나 판단할 내용에 맞는 그림인가.
- 책임 경계·데이터·순서와 달라진 부분을 구분하기 쉬운가.
- 전체 맥락을 유지하며 필요한 부분을 깊게 보고 근거로 내려갈 수 있는가.
- 사람이 잘못된 이해를 짚고 수정 의도를 전달할 수 있는가.

아래 표는 2026-11-07 검수에 따른 적용 추천이다. 개별 기능의 구현 결정과 순서는 아직 정하지 않았다.

## 주 참고 세 레포

| 자료 | archdraw에서 참고할 부분 | 확인한 경계 |
|---|---|---|
| [whiteboard 작성 지침](../../references/whiteboard/packages/review/instructions/authoring.md), [선택 맥락](../../references/whiteboard/packages/review/src/agent-selection.ts) | 무엇을 왜 바꾸는지 먼저 설명하고 컴포넌트·데이터·제어 흐름으로 내려간다. 시퀀스·분기·DB·계약에 맞는 표현을 고른다. 선택한 부분과 버전을 질문에 붙이는 방식도 참고한다. | 문서 블록과 코드 중심이다. 별도 IDE와 PR 관리 구조는 필수 조건이 아니다. 자유 손그림의 의미 해석과 편집 병합은 별도 설계가 필요하다. |
| [archify 탐색 지침](../../references/archify/archify/references/viewer-runtime.md), [근거 조사](../../references/archify/archify/references/repository-authoring.md), [코드 인용](../../references/archify/archify/explainer/sources.mjs) | 원래 배치를 유지하며 관계·경로·상세를 읽는다. 설명 단계와 그림을 연결하고 지정 커밋의 근거 코드를 확인한다. | 탐색 대상은 작성된 관계다. 실제 실행 추적이나 전체 변경 영향을 수집한 결과가 아니다. 유효한 코드 인용도 그림의 주장을 자동 증명하지 않는다. |
| [show-me](../../references/humanlayer-skills/plugins/show-me/skills/show-me/SKILL.md) | 현재 질문에 필요한 최소 표현을 고른다. 호출 순서는 호출 트리, 상호작용은 시퀀스, 변경은 diff로 보여준다. 책임이나 순서가 생략되면 전체 구조를 보여준다. | 근거 수집과 사용자 편집 보존은 구현하지 않는다. API 응답 diff로의 적용은 우리의 설계 판단이다. |

## 필요한 부분을 보완할 레포

| 자료 | archdraw에서 참고할 부분 | 그대로 적용하지 않을 부분 |
|---|---|---|
| [visual-explainer의 계획](../../references/visual-explainer/plugins/visual-explainer/references/plans.md), [상태 탐색](../../references/visual-explainer/plugins/visual-explainer/references/machines.md) | 주장·그림·코드 근거를 연결한다. 사건별 상태 변화와 실패 경로를 설명한다. | 탐색은 지정한 사건과 모델 범위에 한정된다. 실제 코드에서 읽은 상태 전이와 복사한 모델을 구분한다. 일반 브라우저의 응답 복사와 Glimpse의 채팅 전송도 다르다. |
| [answer-me-with-html](../../references/answer-me-with-html/skills/answer-me-with-html/SKILL.md), [응답 처리](../../references/answer-me-with-html/src/runtime/reply-text.js), [부분 수정](../../references/answer-me-with-html/src/patch.js) | 내용 작성과 배치 계산을 나눈다. 그림·표·코드·질문을 함께 놓고 패널 단위로 수정한다. 추천과 실제 선택을 구분한다. | 모든 답변의 HTML 생성과 렌더러 전체 도입은 필요하지 않다. 패널 수정은 공동 캔버스 편집 병합과 다르다. |
| [Effective HTML의 그림 선택](../../references/effective-html/skills/html-diagram/SKILL.md), [배치 비교](../../references/effective-html/skills/html-wireframe/SKILL.md) | 질문에 맞는 그림을 고른다. 함께 보여야 하는 정보와 펼쳐 볼 정보를 나눈다. 같은 내용으로 구조가 다른 배치를 비교한다. | 상호작용은 판단에 도움이 될 때 선택한다. 공동 편집 서버나 이해 판정 기능으로 취급하지 않는다. |
| [diagram-design의 변경 비교](../../references/diagram-design/skills/diagram-design/references/type-architecture-delta.md), [검사 코드](../../references/diagram-design/scripts/verify-architecture-delta.py) | 같은 요소의 ID·위치를 유지하고 실제 이동·이름 변경·연결 변경을 구분한다. | 고정 노드 수와 색·점선 규칙은 다시 정한다. 구조 검사는 아키텍처 설명의 사실성을 증명하지 않는다. |
| [excalidraw-diagram-skill](../../references/excalidraw-diagram-skill/SKILL.md), [렌더러](../../references/excalidraw-diagram-skill/references/render_excalidraw.py) | 실제 JSON·이벤트·입출력 예시를 그림에 배치하고 렌더 결과를 보고 고친다. 계약 메모의 보완 자료다. | 실제 값 예시와 시각 검수는 관계의 정확성 검사와 다르다. 문장과 구현은 복사하지 않는다. |
| [Understand-Anything의 설명 절차](../../references/Understand-Anything/understand-anything-plugin/skills/understand-explain/SKILL.md), [GraphView](../../references/Understand-Anything/understand-anything-plugin/packages/dashboard/src/components/GraphView.tsx) | 상세 설명 전에 호출자·피호출자·소속과 실제 코드를 함께 읽는다. | 화면은 선택한 레이어의 노드를 먼저 거른다. focus도 그 안의 한 단계 이웃으로 제한된다. 외부 맥락을 항상 보존한다는 기존 해석을 줄인다. |
| [pr-lens 교정 적용](../../references/pr-lens/packages/renderer/src/corrections.ts), [설정 탐색](../../references/pr-lens/packages/cli/src/config-file.ts) | 사람이 정한 이름·묶음을 명시적인 규칙으로 반복 적용한다. 한 그림의 수정과 프로젝트 규칙을 구분한다. | 자유 편집을 자동으로 규칙화하지 않는다. ID와 파일 경로가 바뀌면 규칙이 맞지 않을 수 있다. |
| [drawio-skill의 중간 표현](../../references/drawio-skill/skills/drawio-skill/references/diagram-ir.md), [갱신 코드](../../references/drawio-skill/skills/drawio-skill/scripts/diagram_ir.py) | 의미·위치·스타일을 나눠 보존 대상과 충돌 조건을 정한다. | 사람만 바꾼 label은 새 source로 덮는다. 양쪽이 바꿨을 때는 사람 값을 유지하고 충돌을 보고한다. 완성된 수동 수정 보존 해법으로 쓰지 않는다. |
| [open-design의 대상 재탐색](../../references/open-design/apps/web/src/comments/anchor.ts), [댓글 전달](../../references/open-design/apps/web/src/comments.ts) | 그림 수정 후 사용자 표시의 대상이 유지됐는지, 다시 찾았는지, 불확실한지, 사라졌는지 구분한다. | DOM 선택자를 Excalidraw 요소 ID와 그림 버전에 맞게 바꿔야 한다. whiteboard와 중복된다는 이유로 낮췄던 기존 평가를 보완 참고로 상향한다. |
| [anatomy 모델](../../references/anatomy/examples/test-rig/rig.ts), [스킬](../../references/anatomy/SKILL.md) | 입력·상태·표시 결과를 같은 모델에서 계산하는 원칙을 참고한다. | 박스·화살표 대신 물리 기계를 만들고 많은 부품을 요구하는 외형은 목적에 맞지 않는다. 3D와 애니메이션 자체를 요구한 것은 아니다. |

pstack은 앞의 스킬 구조 절에서, 시스템 설계와 배치 샘플은 아래 절에서 다룬다. 이름을 올린 레포의 모든 기능을 읽거나 도입하는 것이 목표는 아니다. 해당 질문에 필요한 원문과 구현을 골라 읽는다.

## 이번 설계에서 구체화할 네 가지 요구

사용자는 다음 네 가지를 이번 재개편에서 함께 다루기로 했다. 특히 전체 맥락을 유지하는 상세 탐색을 선호했다.

| 요구 | 스펙에서 정할 내용 |
|---|---|
| 사람이 고친 그림의 다음 갱신 | 위치·스타일·label·속성별 보존 규칙과 충돌 처리. |
| 사람이 정한 이름과 묶음 유지 | 한 그림의 수정과 프로젝트에서 계속 사용할 표현의 구분. 교정 규칙의 저장·갱신 여부. |
| 전체 맥락을 유지하는 상세 탐색 | 내부와 외부 호출 관계를 얼마나 보여줄지, 원래 그림과 상세 그림을 어떻게 연결할지. |
| 설계 대안과 조건 변화 설명 | 응답 시점·작업 주체·실패 처리의 차이. 정적 비교·단계별 그림·상호작용 중 질문에 맞는 표현. |

자동 병합이나 교정 규칙 저장까지 구현할지는 아직 정하지 않았다. 동기 처리와 큐 기반 비동기 처리의 비교, 캐시의 입력·상태·결과 설명은 사용 장면의 예다. 승인 버튼이나 강제 퀴즈는 합의한 요구가 아니다.

## 그림 표현을 보완할 샘플

| 자료 | 읽을 부분 |
|---|---|
| [ByteByteGo System Design 101](../../references/system-design-101/README.md) | [알림 시스템](../../references/system-design-101/data/guides/how-does-a-typical-push-notification-system-work.md)의 단계별 설명, [실시간 통신 비교](../../references/system-design-101/data/guides/shortlong-polling-sse-websocket.md), [캐시 전략 비교](../../references/system-design-101/data/guides/top-5-caching-strategies.md). |
| [System Design Primer](../../references/system-design-primer/README.md), [소셜 그래프 예제](../../references/system-design-primer/solutions/system_design/social_graph/README.md) | 요구·제약·가정에서 개요 구조와 핵심 컴포넌트로 내려간다. 병목과 트레이드오프에 따라 구조를 바꾸는 설명 순서와 캐시 전략의 동작 비교를 참고한다. 면접용 가정·수치를 실제 프로젝트의 근거로 쓰지 않는다. |
| [stack-diagram](../../references/stack-diagram/README.md), [예시](../../references/stack-diagram/docs/hero.png) | 서비스 묶음, 기술 이름과 역할의 구분, 관계 label, 화살표와 글자의 간격. |
| [C4 표기 지침](https://c4model.com/diagrams/notation), [검토 항목](https://c4model.com/diagrams/checklist), [OMG UML](https://www.omg.org/spec/UML/2.5.1) | 그림의 범위와 관계 의미, 필요한 그림의 표기법. |
| [AWS Reference Architecture Diagrams](https://docs.aws.amazon.com/reference-architecture-diagrams/) | 배포 경계와 서비스 조합을 그리는 공식 샘플의 진입점. |

System Design 101은 동작과 기술 비교를 설명하는 샘플로, Primer는 요구와 제약에서 설계 선택의 이유를 설명하는 샘플로 추천한다. stack-diagram에서는 글자까지 노드의 경계에 포함하는 [배치 규칙](../../references/stack-diagram/skills/stack-diagram/references/geometry.md)을 참고한다. 기술 이름만 보고 관계를 추정하는 작성 지침은 실제 코드 설명에 적용하지 않는다.

[System Design Academy](../../references/system-design-academy/README.md)는 사례를 찾는 색인으로 둔다. 레포에는 README와 라이선스가 있고, 설계 본문과 그림은 연결된 외부 글에 있다. 확인한 [접속 상태 설계 글](https://systemdesign.one/real-time-presence-platform-system-design/)은 요구사항·API 페이로드·저장 구조·대안·한계를 함께 설명한다. 필요한 개별 글을 읽고 그 글을 근거로 남긴다. 색인에 실린 제목이나 수치만으로 실제 기업의 운영 구조를 단정하지 않는다.

표기법과 시각 스타일은 구분한다. C4는 특정 표기법을 강제하지 않고 제목·범위·범례·관계 설명을 권한다. UML·C4 샘플의 외형만으로 archdraw의 디자인을 정하지 않는다.

## 최근 AI 개발 흐름과의 관계

2026-10-31부터 11-07까지 작성·갱신한 위키를 읽고 원문과 대조했다. 아래 날짜는 원문의 게시일이다. 위키가 최근에 갱신됐다는 사실을 새 주장이나 독립적인 증거로 세지 않는다.

| 자료 | 확인한 주장과 archdraw 적용 판단 |
|---|---|
| [Critical thinking when agents do the work](../../wiki/summaries/critical-thinking-agents-osmani.md), 11-03 | Addy Osmani는 구현과 검토를 맡겨도 결과를 설명하고 판단할 책임은 남는다고 본다. 전체 코드를 항상 기억하기보다 필요한 이해를 다시 구성한다. archdraw에서는 구조·선택 이유·가정·검증 결과를 읽고 필요한 부분을 깊게 보는 데 연결한다. |
| [How I work with Agents](../../wiki/summaries/how-i-work-with-agents-ball.md), 10-26 | Thorsten Ball은 다이어그램의 화살표 수준에서 이해하는지, 실제 사용 과정을 검증했는지, 나중에 고칠 수 있는지를 묻는다. 중요한 코드와 DB 마이그레이션은 직접 본다. 그림으로 이해하고 필요한 코드로 내려가는 사용 방식에 맞는다. |
| [Two kinds of code review](../../wiki/summaries/two-kinds-of-code-review-bleasel.md), 10-24 | Hayden Bleasel은 사람이 변경의 범위와 방향을 판단한다고 설명한다. 책임 경계·의존 관계·복잡도를 보여주면 다른 사람의 작업 리뷰에도 도움이 될 것이라는 적용 판단이다. |
| [What My Pull Requests Look Like Now](../../wiki/summaries/what-my-prs-look-like-now-hugorcd.md), 10-27 | Hugo는 코드를 덜 읽을수록 변경의 목적, 설계 결정의 주체, 실제 동작 증거가 중요하다고 본다. 그림의 설명에서 실제 코드·데이터·전후 결과로 연결할 이유다. |
| [Addressing the code review bottleneck](../../wiki/summaries/code-review-bottleneck-holmes.md), 11-06 | Warp의 BHolmesDev는 자체 검증 후 사람이 볼 변경 범위와 주의할 부분을 제시하자고 권한다. 변경 설명에서 무엇을 보여줄지의 보완 기준이다. |

이 자료들은 실무 경험·의견·벤더 사례다. 업계 전체가 코드를 읽지 않는다는 측정이나 archdraw의 효과를 입증한 실험은 아니다. 우리의 목표와 맞는 부분은 사람이 목적·구조·방향을 판단하려면 이해가 필요하다는 점이다. 그림은 검증 결과와 선택 이유를 읽는 수단이며, 그림을 봤다는 사실이 이해나 승인 증거는 아니다.

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
- 그림을 보고 사용자가 오류를 짚거나 다음 설계를 결정할 수 있는지 확인할 평가 과제. 방향은 정했다. 이 레포와 구조를 아는 샘플 레포에 직접 쓴다. 레포·커밋·질문 3~5개를 고정하고, 스킬을 고칠 때마다 같은 조건으로 다시 그려 비교한다. 사용자가 모르게 그림에 틀린 내용 하나를 넣고, 사용자가 그것을 찾는지 본다. 그림과 코드의 일치는 에이전트가 대조한다. 이해 속도와 오류 발견은 사용자가 판단한다. 질문은 아직 쓰지 않았다.
- 성공 기준에 이해 속도를 넣을지.

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

2026-11-07에 대상 복제본의 HEAD를 원격 기본 브랜치와 대조했다. Primer의 기본 브랜치는 `master`이고 나머지는 `main`이다. 아래 값은 검수 시점의 커밋이다. 최신 여부와 기능의 정확성은 별도로 확인한다.

| 레포 | 검수 커밋 |
|---|---|
| whiteboard | `16d979ca` |
| archify | `a4065941` |
| humanlayer-skills의 show-me | `4d69d20f` |
| pstack | `e3886163` |
| visual-explainer | `9d5f880b` |
| answer-me-with-html | `053619b9` |
| effective-html | `5ce160a3` |
| diagram-design | `e57eda61` |
| excalidraw-diagram-skill | `8646fcc9` |
| Understand-Anything | `98d6dca7` |
| pr-lens | `12da0b01` |
| drawio-skill | `053600a8` |
| open-design | `87a4f91c` |
| anatomy | `1482e846` |
| system-design-101 | `b28380a4` |
| system-design-primer | `ae9bbd7b` |
| stack-diagram | `1ed53e3e` |
| system-design-academy | `80850131` |

각 레포의 README에서 관련 지침·소스·예제로 범위를 좁혀 읽었다. archify·stack-diagram·Effective HTML·Primer의 저장된 예시 이미지도 확인했다. 별도로 실행한 검사는 다음과 같다.

| 대상 | 실행한 범위와 결과 |
|---|---|
| drawio-skill의 `reconcile` | 메모리 입력으로 label 변경 두 경우를 비교했다. 사람만 바꾸면 source 값으로 덮었다. 양쪽이 바꾸면 사람 값을 유지하고 충돌을 반환했다. 두 경우 모두 위치와 스타일은 유지했다. |
| answer-me-with-html의 `replyText`, `parseDiff` | 미응답·추천 확인·다른 선택과 패널 맥락을 구분했다. 유효한 diff와 줄 수가 맞지 않는 diff를 구분했다. |
| visual-explainer의 `loadModel` | 제공된 `player.model`과 실제 reducer 예제를 실행했다. 상태 4개, 위반 규칙 1개, 최단 실패 경로 1단계를 확인했다. 임의 프로젝트의 상태 모델 정확성을 검증한 결과는 아니다. |
| diagram-design | `python3 scripts/verify-architecture-delta.py --all`로 제공된 비교 예제 3개의 구조 검사가 통과했다. |

모든 제품을 실행해 같은 질문과 피드백 왕복을 비교한 결과는 아니다. ByteByteGo는 본문과 이미지 주소를 읽었다. C4·AWS의 표기·샘플 진입점은 11-06 조사에서 확인했고, UML 규격 전체는 읽지 않았다. Academy의 접속 상태 글은 11-07에 본문을 읽었으며, 그 설계의 운영 정확성을 검증하지 않았다.

최근 글 중 Bleasel의 웹 원문은 확인했다. Hugo 페이지의 도구 접근 오류와 X 접근 제한 때문에 해당 글은 보존된 원문 클립과 대조했다. [OpenAI의 팀 운영 가이드](https://learn.chatgpt.com/guides/build-ai-native-engineering-team)와 [Anthropic의 SDLC 플레이북](https://claude.com/resources/articles/the-ai-native-sdlc-playbook)도 웹 원문을 대조했다. 각각 기존 가이드의 재게시·번역을 새 근거로 중복 계산하지 않았다.

재사용 조건도 검수 시점에 확인했다. archify는 현재 [Apache-2.0과 기존 MIT 기여의 경계](../../references/archify/NOTICE)를 명시한다. System Design 101은 [CC BY-NC-ND 4.0](../../references/system-design-101/LICENSE.md), Primer는 [CC BY 4.0](../../references/system-design-primer/LICENSE.txt)이다. excalidraw-diagram-skill에는 추적되는 LICENSE 파일이 없어 아이디어만 참고한다. 이 문서는 그림이나 구현을 복사하기로 정한 문서가 아니다.

이전 합의 대조에는 프로젝트 커밋 `61544aa457c4221dff402d37459c87d3f4202a66`의 `docs/research/2026-10-24-redesign-references.md`와 `docs/research/2026-10-24-redesign-matrix.md`를 사용했다. 당시 조사와 이번 최신 검수의 근거를 구분한다.

## 이어서 하기

2026-11-07에 멈췄다.

- 이 문서의 설계 방향을 검수했고 고칠 설계 문제는 없었다. 재개편은 그림 규칙과 화면을 포함해 모두 다시 정한다는 전제다. 그래서 현재 규칙과 비교해 낸 지적은 철회했다.
- 다음 작업은 이 레포에서 쓸 평가 질문 세 개의 초안이다. 그다음 첫 결정인 그림 종류를 현재 상황 23개에서 출발해 정한다.
- 사용자에게 설명할 때는 예시 하나로 짧게 말한다. 현재 규칙과 다르다는 이유만으로 문제를 만들지 않는다.

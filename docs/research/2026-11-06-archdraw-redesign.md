# archdraw 재개편 목표와 참고 자료

2026-11-06에 작성했다. 2026-11-07 대화의 목표 구체화, 최근 위키 검토, 최신화한 참고 레포 검수 결과를 반영했다. 스킬을 전면 재개편할 때의 출발점이다. 세부 동작과 구현 순서는 기능별로 정한 뒤 `.scratch/<feature-slug>/`에 명세와 이슈로 작성한다. 2026-11-13에 사용자 정정과 11-08 결정을 목표 절에 반영했다. 재개편을 이어서 할 때는 "이어서 하기"부터 읽는다.

## 해결하려는 문제

사람은 계속 설계한다. 개발자는 구현을 에이전트에게 맡기면서 코드를 직접 읽는 시간이 줄어든다. 그래도 아키텍처·디자인·코드 관리 방향을 정하고 변경안을 판단해야 한다. 구조와 동작, 변경 이유를 이해할 수단이 필요하다.

사용자는 에이전트가 이해한 목표와 해결하려는 문제를 전문적인 그림·아키텍처·다이어그램으로 보고 싶어 한다. 긴 글과 전체 코드를 매번 읽는 부담을 줄이고, 책임 경계·데이터·순서·실패 처리·트레이드오프를 판단하려는 것이다. 필요한 부분은 실제 코드와 실행 근거로 내려가 확인할 수 있어야 한다.

에이전트가 하는 제안과 기존 로직 설명을 빠르고 쉽게 이해하는 도구로도 쓴다.

archdraw는 사람과 에이전트가 같은 캔버스를 보며 그 이해를 맞추는 스킬이다. 자신이 에이전트에게 맡긴 구현뿐 아니라 동료나 다른 에이전트의 작업을 이해하고 리뷰할 때도 쓴다. 그림은 두 참여자가 구조와 동작을 논의하는 공통 언어다. 사람이 그림을 읽는 과정과, 사람이 고치거나 그린 내용을 에이전트가 이해하는 과정을 함께 다룬다.

한 줄 정의는 사용자의 말로 "에이전트가 캔버스에 아키텍처 그림을 그리고, 사용자와 같이 보며 고친다"다. 개발 과정 전체에서 사람이 판단하고 결정할 일과 가지고 있어야 할 지식을 그림으로 돕는다(2026-11-13 사용자 정정). 11-08에 적은 "사람이 설계에 참여하는 능력을 잃는다"는 사용자의 뜻과 달라서 뺐다.

사용자가 든 쓰는 때는 네 가지다.

- 에이전트와 같이 설계할 때. grill-with-docs나 pstack의 설계 스킬과 함께 쓴다.
- 남이 구현한 것을 볼 때.
- 자신의 작업이지만 구현을 위임해 기억나지 않을 때.
- 설계나 아키텍처의 기억이 희미할 때.

### 캔버스를 쓰는 이유

- **HTML 대신 캔버스를 쓴다.** 사용자가 의도와 피드백을 주기 쉽기 때문이다. HTML은 피드백을 주는 방법이 까다롭다고 사용자는 본다. 사용자 판단이며 비교해 확인하지 않았다.
- **캔버스는 직접 유지한다(2026-11-13 사용자 결정).** Claude Whiteboard로 교체하지 않는다. 이유는 Claude에 묶이기 때문이다. archdraw는 Claude Code와 Codex를 함께 지원한다. Claude Whiteboard는 Claude의 `Artifact` 도구로만 그리고, 그림을 claude.ai에 저장하며, 표기와 기능을 우리가 고칠 수 없다. Codex에 그 도구가 없다는 것은 에이전트 추론이다. 구현 뒤 비교에서 보드를 만들 때는 레포 구조 일부가 claude.ai에 올라가므로 그때 사용자 승인을 받는다.
- **Claude Whiteboard가 나왔어도 재개편은 계속한다(2026-11-13 사용자 결정).** Claude Whiteboard는 claude.ai의 Whiteboard Artifact 타입이다. 주 참고 "whiteboard"는 dev.fast 제품이며 서로 다르다.
- **Claude Whiteboard의 위치는 확정하지 않았다.** 사용자의 제안은 우리 문제의 근거, 결과물 비교 대상, 경쟁 제품이다. 에이전트의 단서는 두 가지다. 발표문은 팀 브레인스토밍과 "결과를 다른 도구로 옮기면 Claude가 이후 수정을 보지 못한다"는 문제를 말한다(위키 요약 기준). 그래서 같이 고치는 화면이라는 수단의 근거이고, 코드 구조 이해라는 문제의 근거는 아니다. 겹치는 곳은 캔버스 왕복이며, 코드 근거·아키텍처 표기·계약 메모는 겹치지 않는다(안내문을 읽은 범위).

### 사람이 판단하는 것과 알아야 하는 것: 후보

2026-11-13에 사용자가 위키에서 찾으라고 했다. 에이전트가 그날 읽은 위키 요약에서 뽑은 후보이며 전수 조사가 아니다. 모두 실무 의견과 경험이고 측정 결과가 아니다. 그림이 담을 내용으로 쓸지는 사용자가 정하지 않았다.

| 구분 | 내용 | 읽은 위키 요약 |
|---|---|---|
| 판단·결정 | 무엇을 만들지, 누구에게 영향이 가는지, 배포해도 안전한지. | `summaries/critical-thinking-agents-osmani.md` |
| 판단·결정 | 변경의 범위와 방향. 맞는 곳을 건드렸는지, 접근법이 옳은지. | `summaries/two-kinds-of-code-review-bleasel.md` |
| 판단·결정 | 에이전트가 스스로 정한 것. 기본값, 범위 밖으로 둔 것, 충돌한 요구의 해석. | `summaries/critical-thinking-agents-osmani.md` |
| 판단·결정 | 틀리면 피해가 큰 곳. 중심 파일 몇 개와 DB 마이그레이션. | `summaries/how-i-work-with-agents-ball.md` |
| 지식 | 전체의 원거리 지도와 위험한 곳의 위치. | `summaries/here-be-monsters-adrq.md` |
| 지식 | 화살표 다이어그램 수준의 이해. | `summaries/how-i-work-with-agents-ball.md` |
| 지식 | "왜 이렇게 했어?"에 답할 이유와 확인한 것. | `summaries/critical-thinking-agents-osmani.md` |
| 지식 | 무엇을 모르는지. | `summaries/critical-thinking-agents-osmani.md` |
| 지식 | 다음 아이디어를 낼 수 있는 개념들. | `summaries/understanding-new-bottleneck-litt.md` |

### 배경: 11-08에 든 이유

11-08에 중심 문제의 이유로 세 가지를 들었다. 중심 문제의 표현은 11-13에 정정됐고, 이 세 가지는 배경으로 남긴다. 모두 의견이다.

- 에이전트가 사람이 평가하는 속도보다 빨리 코드를 만든다(Osmani "Comprehension Debt").
- 에이전트가 스스로 내린 결정과 이유가 보이지 않는다(whiteboard `README.md:75`, 위키 `concepts/intent-debt.md`).
- 출력이 그럴듯할수록 사람이 다시 확인하지 않는다(Osmani "Critical thinking", 위키 `concepts/cognitive-surrender.md`).

## 원하는 사용 경험

1. 에이전트는 현재 질문에 맞는 그림으로 자기 이해를 보여준다.
2. 사용자는 그림에서 의도와 다른 부분을 짚는다. 직접 고치거나 새로 그릴 수도 있다.
3. 에이전트는 사용자 표시를 읽고 자기 이해와 그림을 고친다.
4. 더 깊게 볼 부분이 생기면 그림을 추가한다. 사용자는 큰 구조와 세부 동작을 오간다.

대상은 기존 코드, 변경안, 새 설계, 기술 개념이다. 아키텍처·서비스 구성·시퀀스·상태·데이터 관계 등 질문에 맞는 그림을 쓴다. 그림의 종류와 깊이는 사용자가 지금 이해하거나 결정하려는 내용에 맞춘다.

성공 기준은 사용자가 그림에서 구조와 변경 이유를 설명하고, 잘못된 이해를 짚고, 자기 의도를 전달해 다음 설계를 결정할 수 있는가다. 그림의 개수나 외형만으로 성공을 판단하지 않는다. 이 문단은 에이전트가 쓴 후보이며 확정한 기준이 아니다. 2026-11-13 다섯 번째 세션에서 사용자가 답했다. 잘 만들어졌는지는 써보면서 안다. 결과물을 확인하고, 같은 지시로 다른 스킬·기능과 비교한다. 비교 방법은 "다음에 정할 내용"의 평가 과제에 있다.

기존 코드의 사실, 아직 구현하지 않은 변경안, 설명용 가정, 실제 실행에서 확인한 결과를 구분한다. 코드 링크가 유효하거나 그림이 렌더됐다는 사실만으로 관계와 설명의 정확성을 보증하지 않는다.

### 11-08에 정한 것

11-08 두 번째 세션에서 위키와 주 참고 세 레포 원문으로 정했다. 사용자는 11-13에 이 목록의 요약을 다시 봤고 중심 문제 항목만 정정했다. 정정한 내용은 "해결하려는 문제"에 있다.

- 사용 장면: 주 장면과 장면별 모드를 두지 않는다. 에이전트가 질문과 맥락을 보고 가장 맞는 그림을 고른다. 현재 스킬의 방식(상황 23개, `routing-table.md`)과 같다. 사용자는 모드를 고르지 않는다. 예를 들어 "이 PR에서 무엇이 바뀌었어?"에는 전후 비교를, "이 서비스는 어떻게 생겼어?"에는 구조 지도를, "A안과 B안 중 무엇이 나아?"에는 두 안을 나란히 그린다. 장면의 예는 변경 리뷰, 기존 기능 이해, 버그를 찾으려고 기능을 알아볼 때, 대화 중 제안 이해와 선택이다. 이 예는 제한 목록이 아니다. 분류 기준(현재의 주제별, show-me의 질문 모양별)과 첫 버전의 지원 범위는 스펙에서 정한다.
- 이해 수준: 그림은 질문의 답만 그리지 않고 질문에 관련된 아키텍처를 그린다. 질문하지 않은 문제를 사용자가 지도에서 발견하게 하기 위해서다. 시스템 전체는 사용자가 원할 때만 그린다. 근거는 whiteboard `authoring.md:29`, archify `SKILL.md:38`·`repository-authoring.md:43-44`, show-me `SKILL.md:109,126`, 위키 Quiroga·Ball·Litt(의견·경험)다. "질문보다 얼마나 넓게"의 경계는 에이전트 추론이다.
- 추상화 수준 이동: 사용자는 언제든 줌인·줌아웃해 추상화 수준을 올리고 내린다. 에이전트는 다음에 볼 곳을 이유와 함께 제안한다. 강제하지 않는다. 근거는 위키 critical-thinking(Osmani, 의견)과 code-review-bottleneck(Holmes, 벤더 사례)다. 같은 그림 안에서 줌할지 다른 그림으로 할지는 스펙에서 정한다.
- 제안 기준: 에이전트가 "더 볼 만한 곳"으로 고르는 기준은 세 가지다. 에이전트가 스스로 정한 것, 에이전트가 확인하지 않은 것, 틀리면 피해가 큰 것이다. 사용자가 그림만 보고는 찾기 어려운 곳이기 때문이다. 근거는 whiteboard Decision log(`README.md:75`), archify의 "missing source evidence"(`SKILL.md:128`), 위키 Osmani·Hugo·Ball(의견·경험)이다.
- 참여자: 캔버스를 같이 쓰는 것은 개발자 한 명과 에이전트다. 다른 사람에게는 완성된 그림을 MR이나 사내 문서로 전달한다. 여러 사람이 같은 캔버스를 동시에 고치지 않는다. 세 레포가 모두 이렇게 한다(whiteboard `authoring.md:1`·`README.md:89`, archify `README.md:170`·`viewer-runtime.md:52`, show-me `SKILL.md:7`). 반대 의견으로 Litt는 팀이 함께 이해해야 한다고 본다(의견).
- 보는 대상: 기본은 소프트웨어 아키텍처와 계약이다. 계약은 경계를 넘는 모든 것이다. API, DB 테이블, Kafka 같은 메시지 토픽 등의 실제 모양과 값이다. 사용자가 원하면 구현(함수, 클래스, 로직)까지 내려간다. 어떤 형태로 그릴지는 사용 장면과 같이 에이전트가 질문에 맞게 고른다. 이 기준은 모든 장면에 공통이다. 근거는 whiteboard의 Design 절 "components, data and control flow, not functions"와 그다음 Implementation 절(`authoring.md:29,36`), show-me의 의사코드·호출 트리(`SKILL.md:9-27`), archify의 요소별 코드 위치(`repository-authoring.md:78-83`)다. 세 레포 모두 기본은 구조이고 필요할 때 구현으로 내려간다.
- 구현 수준의 표현: 의사코드와 호출 순서는 박스와 화살표로 그리지 않는다. 캔버스에서 관련 요소 옆에 텍스트 메모로 붙이고 코드 위치를 단다. 계약 메모와 같은 방식이다. 세 레포 모두 이 수준을 텍스트로 두고 그림 옆에 붙인다(show-me `SKILL.md:9-27,126`, whiteboard `README.md:71`·`authoring.md:36`, archify `explainer-authoring.md:82,219`).

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
| [Claude Whiteboard 타입 안내](https://claude.ai/artifact/PLsEyfjXbDUM1iasW7rjLR), [위키 요약](../../wiki/summaries/claude-whiteboard-artifact-type.md) | 에이전트가 마지막으로 읽은 버전을 붙여 쓰고, 사람이 그 사이 고쳤으면 쓰기를 거부한다. 캔버스에 적힌 글은 지시가 아니라 데이터로 다룬다. 쓰기 전에 고칠 영역을 먼저 표시한다. 브라우저가 선택 요소·보는 범위·겹침과 잘림·읽지 않은 사람 편집을 에이전트에 보낸다. 사람의 묶음·글자·색을 유지하고 큰 재배치는 제안만 한다. 같은 내용은 기존 요소를 고치고 옆에 새로 그리지 않는다. | 기본 검증 생략, 표시 종류 4개 제한, 적은 글자, 작은 보드 크기는 코드와 맞는 설계 그림과 계약 메모에 맞지 않는다. 2026-11-13에 릴리스 `1794543257-7a56`의 안내문을 읽었고 보드 생성과 편집 왕복은 실행하지 않았다. 현재 archdraw에 이미 있는 항목인지는 대조하지 않았다. 참고할 부분은 에이전트가 고른 후보이며 사용자가 확정하지 않았다. |
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

- 첫 버전에서 지원할 그림 종류와 줌 레벨 이동 방식. 큰 구조와 세부의 연결에는 두 안이 있다. 계속 남는 지도 하나에 상세 그림을 붙이는 안과 질문마다 새 그림을 그리는 안이다. 에이전트 추천은 지도 안이며 사용자에게 묻지 않았다. 읽을 원문은 archify `viewer-runtime.md`, Understand-Anything의 GraphView와 설명 절차, diagram-design의 변경 비교다.
- 그림·설명·계약 메모를 함께 놓는 배치와 정보량.
- 사람이 고친 내용과 질문을 에이전트가 읽고 반영하는 구체적인 절차.
- 사람이 정한 이름·묶음을 다음 그림에 반영하는 범위와 방식.
- 설계 대안과 조건 변화에 따른 동작 차이를 보여주는 표현 방식.
- 다른 스킬과의 역할 분담, 자동 호출 조건, 원칙·절차·템플릿의 구체적인 분리. 근거 수집은 pstack·mattpocock 스킬이 하고 archdraw는 그림과 피드백 왕복을 맡는 안을 에이전트가 제안했다. 합의하지 않았다.
- 그림을 보고 사용자가 오류를 짚거나 다음 설계를 결정할 수 있는지 확인할 평가 과제. 방향은 정했다. 이 레포와 구조를 아는 샘플 레포에 직접 쓴다. 레포·커밋·질문 3~5개를 고정하고, 스킬을 고칠 때마다 같은 조건으로 다시 그려 비교한다. 사용자가 모르게 그림에 틀린 내용 하나를 넣고, 사용자가 그것을 찾는지 본다. 그림과 코드의 일치는 에이전트가 대조한다. 이해 속도와 오류 발견은 사용자가 판단한다. 질문은 아직 쓰지 않았다. 도구와 스킬 구현을 마친 뒤 같은 레포·커밋에 같은 지시를 주고 다른 도구로도 그려 결과물을 나란히 비교한다(2026-11-13 사용자 결정). 비교 도구는 Claude Whiteboard, dev.fast whiteboard, show-me, archify다. Claude Whiteboard는 claude.ai의 Whiteboard Artifact 타입이며 주 참고의 dev.fast whiteboard와 다른 제품이다. 비교해서 볼 것은 그림의 디자인, 구조의 정확성, 사용자의 오류 발견이다. 각 도구가 Claude Code에서 실제로 도는지는 확인하지 않았다. 스펙 전에 현재 스킬로 기준 그림을 만들지도 정하지 않았다.
- 성공 기준에 이해 속도를 넣을지.
- 변경안(`proposed`)을 근거 표시와 별도 축으로 둘지(2번에서 넘어옴).

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

2026-11-13 다섯 번째 세션에서 멈췄다. 정한 것은 앞의 "해결하려는 문제"와 "원하는 사용 경험", 그리고 아래 닫힌 질문에 있다. 이 절은 남은 질문과 진행 방식을 둔다. 11-08에는 남은 답을 모두 받은 뒤 이전 결정과 비교하고 한 번에 반영하기로 했다. 11-13에 사용자가 정정한 목표에 맞춰 문서를 정리하라고 해서 그 순서를 바꿨다. 이전 세션의 기록 전문은 커밋 `a5d3f8b`의 이 문서에 있다.

### 다음 행동

아래 질문을 위에서부터 하나씩 닫는다. 사용자가 답하고 그 답을 이 문서에 적으면 질문 하나가 닫힌다. 다섯 개가 모두 닫히면 "다음에 정할 내용"으로 간다. 1번과 2번은 닫혔다.

**재개 첫 행동: 3번을 처음부터 다시 묻는다.** 다섯 번째 세션 끝에 3번의 첫 형태를 물었고 답을 받지 않았다. 그 질문은 "그림에서 틀린 곳을 에이전트에게 어떻게 알려줄까"였다. 상황은 사용자가 `publish` 화살표가 틀렸다고 알려주려는 때다. 선택지는 셋이었다.

- 가. 선택하고 말하기. 캔버스에서 화살표를 클릭하고 채팅에 "이거 아니야"라고 쓴다. whiteboard 방식이다(`agent-selection.ts:12-50`).
- 나. 복사해서 붙여넣기. 화살표의 버튼으로 "publish 화살표에 대해"를 복사해 채팅에 붙인다. archify 방식이다(`reader.js:528-529`).
- 다. 말로만. 채팅에 "publish 화살표 틀렸어"라고 쓴다. show-me처럼 되읽는 기능이 없다.
- 에이전트 추천은 가였다. 복사 단계가 없고, archify의 복사는 결과물이 에이전트와 끊긴 HTML 파일이라서라는 에이전트 추론이다. 지금 캔버스에 선택을 에이전트에게 넘기는 기능이 있는지는 확인하지 않았다. 다시 묻기 전에 `frontend/src/App.tsx`와 `src/server.ts`에서 확인한다.

### 남은 질문

**1. 재개편한 archdraw가 잘 만들어졌는지를 나중에 무엇을 보고 판단하는가.** 후보는 "원하는 사용 경험"의 성공 기준 문단이다.

- 상태: 닫혔다(2026-11-13 다섯 번째 세션). 사용자의 답은 "이거는 써보면서 알아야지. 그래서 결과물 확인할 거고, 같은 지시로 다른 스킬이나 기능들과 비교하기로 했다"다. 기준을 미리 확정하지 않는다. 아래 11-08의 세 가지는 후보로 남긴다. 다시 묻지 않는다.
- 11-08의 질문 문장: "archdraw의 성공을 '사용자가 그림을 보고 세 가지를 할 수 있다'로 정할까요? 구조와 변경 이유를 자기 말로 설명한다, 틀린 곳을 찾는다, 다음 설계를 정한다." 그림 수·외형·"봤다"·"좋다"는 성공으로 세지 않는다. 첫 세션 초안은 봤다·이해했다·동의했다·반영됐다를 서로 다른 상태로 봤다.
- 근거: 세 레포는 사람의 이해를 확인하지 않고 결과물만 검사한다. 그래서 근거는 위키다. `comparisons/shared-understanding-reference-tools.md`는 봤다·퀴즈 답했다·설계 골랐다·구현 확인했다를 다른 사건으로 본다(위키 종합). `concepts/visual-feedback-contracts.md`는 보여 준 기록이 이해나 동의의 증거가 아니라고 쓴다(위키 종합). 측정 방법은 "다음에 정할 내용"의 평가 과제에서 따로 정한다.

**2. 근거 표시. 그림에 "어떻게 알았는지"를 어떻게 보이는가.**

- 상태: 닫혔다(2026-11-13 다섯 번째 세션). 사용자가 캔버스 예시를 보며 정했다.
  - 코드에서 확인하지 못한 관계(visual-explainer의 `guess`)만 표시한다. 선은 실선으로 두고 옆에 "unknown: 무엇을 모르는지"를 글로 적는다. 근거는 archify `repository-authoring.md:57-61`(주장 옆에 명시적 unknown)과 visual-explainer `plans.md:101`(표시 없음은 읽은 것, `guess`는 코드에서 확인하지 못한 것)이다.
  - 점선으로 그리지 않는다. 점선을 추측의 뜻으로 쓰는 주 참고 레포는 없고, archify는 점선을 비동기 배치의 뜻으로 쓴다(`authoring-defaults.md:49`).
  - 읽은 코드를 이어 내린 결론(visual-explainer의 `inferred`)에는 표시하지 않는다. 읽은 코드에 근거가 있고, 사용자가 먼저 의심할 곳은 코드 근거가 없는 곳이라는 에이전트 추론이다. archify도 unknown 한 종류만 둔다.
  - 캔버스에 코드 링크를 넣지 않는다. 코드 위치는 사용자가 채팅에 묻고 에이전트가 `파일:줄`로 답한다. 물을 때마다 지금 코드를 읽으므로 줄 번호가 낡는 문제(사용자가 걱정했다)가 생기지 않는다. 캔버스 안의 코드 보기 화면은 사용자가 "별로"라고 해서 뺐다. 에이전트 없이 캔버스만 볼 때는 코드로 갈 수 없다. Codex 터미널에서 `파일:줄`을 누를 수 있는지는 확인하지 않았다. 참고로 whiteboard는 그림을 누르면 코드로 가고(`README.md:65-67`), archify는 요청할 때만 `SRC n` 링크를 단다(`README.md:366`). show-me는 링크가 없다.
- 뒤로 미룬 것: 변경안(`proposed`)을 근거 표시와 별도 축으로 둘지. "다음에 정할 내용"에서 다룬다. 아래는 이전 세션의 기록이다.

- 원문 요약: archify는 커밋을 고정하고 검증된 요소에만 `SRC n` 표시를 단다. 검증 못 한 인용은 일반 참조로 남긴다(`archify/explainer/sources.mjs:264-265`, `README.md:366`). 모르는 것은 "explicit unknown"으로 적는다(`repository-authoring.md:57-61`). whiteboard는 코드 링크에 base·head·커밋과 줄 범위를 붙이고, 넘기기 전에 보드를 다시 읽어 확인 안 된 주장을 고친다(`authoring.md:40,54`). show-me는 확인 여부를 구분하지 않는다.
- 첫 세션의 결정: 그림의 요소마다 어떻게 알았는지를 캔버스에 보이게 표시한다. 그림이 그럴듯할수록 사용자가 틀린 곳을 찾기 어렵기 때문이다. 위키만 읽고 정했으므로 다시 묻는다.
- 첫 세션의 제안: 이름 후보는 `evidence`다. 현재 그리기 도구의 입력 칸 이름과 같다. `CONTEXT.md`는 "출처"를 피할 말로 둔다. 종류 후보는 `code`·`run`·`log`·`doc`·`human`·`assumed`·`not-found`다. 화면에서는 확인됨과 확인 안 됨만 크게 보이는 안이다. 변경안(`proposed`)을 이 표시에서 빼서 변경 상태라는 별도 축으로 둘지가 열린 질문이다. 사용자는 이 구분이 애매하다고 했다.
- 더 읽을 원문: visual-explainer의 주장·근거 연결(`references/visual-explainer/plugins/visual-explainer/references/plans.md`).

**3. 피드백 왕복. 사용자 표시가 에이전트에게 어떻게 돌아가는가.**

- 원문 요약: whiteboard는 선택을 타입으로 넘긴다. 블록 ID, 인용, base·head, 에이전트가 읽은 revision이 들어 있고, 수정 뒤에도 같은 블록을 다시 찾는다(`packages/review/src/agent-selection.ts:12-50`). archify는 패널 ID와 인용을 담은 메시지를 복사하게 하고, 그 패널만 고친다(`archify/explainer/reader.js:528-529`). show-me는 되읽지 않는다. 위키 `comparisons/diagram-editing-feedback.md`는 배치·내용 수정·결정 의도의 보존을 나누고, 좌표 변화만으로 설계 의도를 추론하지 말라고 쓴다.
- 캔버스 수정의 뜻을 에이전트가 어떻게 읽을지도 여기서 정한다. 예를 들어 박스를 다른 박스 안으로 옮긴 것이 구조 변경인지 정리인지다.
- 첫 세션 초안: 에이전트는 사용자가 어느 버전의 어느 요소를 어떻게 바꿨는지 읽고, 반영한 것과 그대로 둔 것을 알린다.
- Claude Whiteboard에서 가져올 것은 후순위이며 여기서 하나씩 정한다. 후보는 "필요한 부분을 보완할 레포" 표에 있다. 후보 중 버전 검사만 설명했다. 사용자가 이해했다는 답은 받지 않았다. 설명에 쓴 근거는 `src/server.ts`의 요소 수정(받은 값을 기존 요소에 덮어쓰고 읽은 시점을 비교하지 않는다)과 `POST /api/elements/sync`(브라우저가 보낸 전체로 교체한다)다. 코드만 읽었고 실행하지 않았다.

**4. 이름. 그림에 쓰는 이름을 누가 정하고 고치는가.**

- 위키 `concepts/ubiquitous-language.md`는 문서를 생성한 것이 공유된 이해가 아니라고 쓴다.
- 첫 세션 초안: 이름은 사람과 에이전트가 함께 정하고 고친다.

**5. 꼭 다룰 것 목록.** "이번 설계에서 구체화할 네 가지 요구"와 계약 메모를 다시 정한다.

- 사용 흐름 4단계에서 목록을 다시 뽑는 안을 에이전트가 제안했고 답을 받지 않았다. 이 안에서 새로 생기는 항목은 그림 종류 고르기, 사용자 표시 방법, 사용자 표시 읽기, 코드·실행 근거로 내려가기다.

원문을 다시 확인할 때는 `wiki/index.md`와 세 레포의 위 파일부터 읽는다.

### 진행 방식

- 전면 개편이다. 그림 규칙·화면과 "꼭 다룰 것" 목록도 다시 정한다. 현재 규칙과의 차이는 문제로 세지 않는다.
- 지금은 스펙만 정한다. 코드 구현 방향은 스펙 뒤에 다룬다.
- 질문 전에 주 참고 세 레포가 그 문제를 어떻게 풀었는지 원문으로 확인하고, 그것으로 선택지를 만든다. 제안마다 원문 확인인지 에이전트 추론인지 표시한다.
- 질문은 한 번에 하나다. 순서는 왜 묻는지, 주문 API 같은 구체적인 예 하나, 사용자가 이해했다는 답, 선택지와 추천이다.
- 질문에는 "남은 질문"의 번호를 붙이고 내용도 함께 쓴다(예: "3번. 틀린 곳 알려주기"). 사용자가 다섯 번째 세션 끝에 번호를 붙이라고 했다. 선택지에는 질문 번호와 헷갈리지 않게 가·나·다를 쓴다. 번호는 중간에 바꾸지 않는다.
- 답은 결론 한 줄과 불릿 몇 개다. 11-13에도 보고가 장황하다는 말을 여러 번 들었다.
- 선택지와 추천마다 근거를 같이 댄다. 근거는 참고 레포 원문(파일:줄)이나 위키 아티클이다. 근거가 없으면 "에이전트 추론"이라고 쓴다. 다섯 번째 세션에서 사용자가 근거를 여러 번 요구했다. 근거 없이 넣은 추천(점선, 코드 글자로 찾기)은 대조해 보니 뒤집혔다. 현재 archdraw의 동작은 근거로 쓰지 않는다. 재개편 대상이기 때문이다.
- 캔버스에 보이는 모습을 정하는 질문은 처음부터 캔버스에 예시를 그려 보여준다. 그릴 때는 이전 그림을 지우고 지금 질문의 선택지만 그린다. 글로만 설명하면 사용자가 이해하지 못했다.
- 사용자가 고르지 않은 것을 정한 것으로 적지 않는다. "진행하자"는 에이전트가 낸 제안의 승인이 아니다. 다섯 번째 세션에서 1번을 미룬 것과 `SRC 1`을 정했다고 적은 것이 이 실수였다.
- 한 질문 안에 다른 질문(예: 링크의 낡음, 커밋 고정)을 섞지 않는다. 생긴 질문은 "다음에 정할 내용"으로 미룬다.
- 목표와 문제는 사용자의 표현으로 적는다. 11-08의 중심 문제는 에이전트가 고쳐 쓴 문장이었고 사용자가 11-13에 자기 뜻이 아니라고 했다.
- `AGENTS.md`의 목적 문장은 11-13에 이 문서에 맞춰 고쳤다. 사용자가 보았고 표현을 확정한다는 답은 받지 않았다.
- 그림의 형태(의사코드, 클래스 다이어그램 등)는 에이전트가 질문에 맞게 고른다.
- 문서의 다른 절에 있는 요구도 범위 안이면 사용자가 꺼내기 전에 먼저 묻는다.
- 사용자가 비교를 이해하기 어려우면 캔버스에 와이어프레임을 그려 보여준다.
- 소프트웨어 용어는 한국어가 어색하면 영어로 쓴다.

### 막힌 것

- `../references`가 11-13 15:37에 비었고 원인은 확인하지 않았다. 다섯 번째 세션에서 에이전트가 네 레포를 검수 커밋으로 다시 복제했다(whiteboard `16d979ca`, archify `a4065941`, humanlayer-skills `4d69d20f`, visual-explainer `9d5f880b`). 나머지 레포는 없다. 필요한 질문이 올 때 복제한다.
- 다섯 번째 세션의 예시 그림은 그 세션의 캔버스 서버에만 있었다. 다음 세션에서는 새로 그린다.

### 11-08 첫 세션 결정과의 대조

첫 세션은 위키만 읽고 정했다. 두 번째 세션이 원문으로 다시 정했다. 대조는 에이전트가 했고 사용자가 확인하지 않았다.

| 첫 세션 | 지금 |
|---|---|
| 목표로 하는 이해는 모든 줄의 이해가 아니다. 무엇이 잘못됐는지 알아챌 만큼 알고, 필요한 곳은 그때 깊게 본다. 기본 그림은 얕고, 깊이는 사용자가 원할 때 더한다. | "11-08에 정한 것"의 이해 수준과 추상화 수준 이동으로 다시 정했다. |
| 이해의 단위는 개발자 한 명과 에이전트다. 결과 그림은 다른 사람에게 전한다. | 참여자 항목과 같다. |
| 그림의 요소마다 어떻게 알았는지를 캔버스에 표시한다. | 남은 질문 2에서 바꿨다. 코드에서 확인하지 못한 관계에만 unknown 글을 단다. |
| 줌 단계는 다른 그림으로 둔다. 같은 그림 안에서 박스를 펼치는 방식은 쓰지 않는다. | 다시 열렸다. 스펙에서 정한다. |
| 목표 문장 초안. | 문제 줄은 11-13 사용자 정정이 대신한다. 성공·피드백 왕복·이름 줄은 남은 질문 1·3·4로 옮겼다. |

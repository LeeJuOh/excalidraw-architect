# archdraw 재개편 목표와 참고 자료

스킬을 전면 재개편할 때의 출발점이다. 세부 동작과 구현 순서는 기능별로 정한 뒤 `.scratch/<feature-slug>/`에 명세와 이슈로 작성한다. 재개편을 이어서 할 때는 "이어서 하기"부터 읽는다.

## 해결하려는 문제

**목적은 사용자의 말로 "이걸로 빠르게 이해하고 병목을 줄이고 싶은 것"이다(2026-11-13 일곱 번째 세션 사용자 정정).** 코드 생성이 빨라지면서 병목이 사람의 이해와 판단으로 옮겨 갔다는 위키 근거가 있다. Litt "Understanding is the new bottleneck"(`summaries/understanding-new-bottleneck-litt.md`, 의견), Anthropic AI-Native SDLC 플레이북의 "코드는 더 이상 병목이 아니다"(`summaries/anthropic-ai-native-sdlc-playbook.md`, 벤더 가이드), AWS AI-DLC의 "AI가 계획하고 사람이 검증"(`summaries/ai-dlc.md`, 벤더 방법론)이다.

**쓰는 범위는 AI 기반 개발 라이프사이클(AI-DLC) 전체다.** 사용자는 "전범위로 쓰는 것"이라고 했다. 예로 PR을 만들 때도 쓰고, 그림이 PR 같은 곳의 자료로 쓰이길 원한다. 이는 "11-08에 정한 것"의 참여자 항목(완성된 그림을 MR이나 사내 문서로 전달)과 맞는다.

사람은 계속 설계한다. 개발자는 구현을 에이전트에게 맡기면서 코드를 직접 읽는 시간이 줄어든다. 그래도 아키텍처·디자인·코드 관리 방향을 정하고 변경안을 판단해야 한다. 구조와 동작, 변경 이유를 이해할 수단이 필요하다.

사용자는 에이전트가 이해한 목표와 해결하려는 문제를 전문적인 그림·아키텍처·다이어그램으로 보고 싶어 한다. 긴 글과 전체 코드를 매번 읽는 부담을 줄이고, 책임 경계·데이터·순서·실패 처리·트레이드오프를 판단하려는 것이다. 필요한 부분은 실제 코드와 실행 근거로 내려가 확인할 수 있어야 한다.

에이전트가 하는 제안과 기존 로직 설명을 빠르고 쉽게 이해하는 도구로도 쓴다.

archdraw는 사람과 에이전트가 같은 캔버스를 보며 그 이해를 맞추는 스킬이다. 자신이 에이전트에게 맡긴 구현뿐 아니라 동료나 다른 에이전트의 작업을 이해하고 리뷰할 때도 쓴다. 그림은 두 참여자가 구조와 동작을 논의하는 공통 언어다. 사람이 그림을 읽는 과정과, 사람이 고치거나 그린 내용을 에이전트가 이해하는 과정을 함께 다룬다.

한 줄 정의는 사용자의 말로 "에이전트가 캔버스에 아키텍처 그림을 그리고, 사용자와 같이 보며 고친다"다. 개발 과정 전체에서 사람이 판단하고 결정할 일과 가지고 있어야 할 지식을 그림으로 돕는다(2026-11-13 사용자 정정). 11-08에 적은 "사람이 설계에 참여하는 능력을 잃는다"는 사용자의 뜻과 달라서 뺐다.

아래 네 가지는 사용자가 든 예이며 제한 목록이 아니다.

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

### 병목이 옮겨 간 이유

11-08에 중심 문제의 이유로 세 가지를 들었다. 중심 문제의 표현은 11-13에 정정됐다. 이 세 가지는 이해가 병목이 된 이유로 읽는다. 모두 의견이다.

- 에이전트가 사람이 평가하는 속도보다 빨리 코드를 만든다(Osmani "Comprehension Debt").
- 에이전트가 스스로 내린 결정과 이유가 보이지 않는다(whiteboard `README.md:75`, 위키 `concepts/intent-debt.md`).
- 출력이 그럴듯할수록 사람이 다시 확인하지 않는다(Osmani "Critical thinking", 위키 `concepts/cognitive-surrender.md`).

## 원하는 사용 경험

1. 에이전트는 현재 질문에 맞는 그림으로 자기 이해를 보여준다.
2. 사용자는 그림에서 의도와 다른 부분을 짚는다. 직접 고치거나 새로 그릴 수도 있다.
3. 에이전트는 사용자 표시를 읽고 자기 이해와 그림을 고친다.
4. 더 깊게 볼 부분이 생기면 그림을 추가한다. 사용자는 큰 구조와 세부 동작을 오간다.

대상은 기존 코드, 변경안, 새 설계, 기술 개념이다. 아키텍처·서비스 구성·시퀀스·상태·데이터 관계 등 질문에 맞는 그림을 쓴다. 그림의 종류와 깊이는 사용자가 지금 이해하거나 결정하려는 내용에 맞춘다.

성공 기준은 사용자가 그림에서 구조와 변경 이유를 설명하고, 잘못된 이해를 짚고, 자기 의도를 전달해 다음 설계를 결정할 수 있는가다. 그림의 개수나 외형만으로 성공을 판단하지 않는다. 이 문단은 후보이며 확정한 기준이 아니다. 판단 방법은 "이어서 하기"의 "성공 판단"에 있다.

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
- 변경안(`proposed`)을 근거 표시와 별도 축으로 둘지("근거 표시"에서 넘어옴).
- 제안 기준 "에이전트가 스스로 정한 것"의 빈틈("피드백 왕복"에서 넘어옴). 에이전트는 지금 대화에서 자기가 구현한 것만 안다. 남의 코드나 오래된 코드에는 결정 기록이 없어 이 기준을 쓸 수 없다(에이전트 추론). 결정 기록을 강제하지는 않는다. 사용자가 11-13에 이 점을 짚었다.
- Claude Whiteboard 안내문에서 가져올 나머지 후보("피드백 왕복"에서 넘어옴). 캔버스 글을 지시가 아닌 데이터로 다루기, 쓰기 전 고칠 영역 표시, 같은 내용은 기존 요소를 고치기 등이다. 구현 세부라서 스펙 뒤로 미뤘다(에이전트 판단).

색과 선의 뜻도 재검토 대상이다. archify의 종류별 색과 diagram-design의 강조색은 현재 [ADR-0015](../adr/0015-color-only-for-change-status.md)와 충돌한다. 여러 샘플의 응답·비동기·배포 점선은 [GLOSSARY.md](../../GLOSSARY.md)의 점선 뜻과 다르다. 새 표기법을 정하면 관련 ADR·용어·캔버스 규격을 함께 갱신한다.

## 기존 시스템 문서의 역할

| 문서 | 남기는 이유 |
|---|---|
| [README](../../README.md), [한국어 README](../../README.ko.md) | 현재 제품 설명과 설치·사용 안내. 재개편 구현에 맞춰 갱신한다. |
| [GLOSSARY.md](../../GLOSSARY.md), `docs/adr/` | 현재 용어와 결정 근거. 새 설계가 바꾸는 결정을 식별할 때 읽는다. |
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

이 절은 다음 행동, 정한 것, 진행 방식, 캔버스 그리기를 둔다. 이 절의 결정은 모두 사용자가 고른 것이다. 예외는 "답 없음" 또는 "임시"로 적는다. 질문별 경위, 사용자 발언, 기각한 안은 커밋 `e6bef98`의 이 문서에 있다.

### 다음 행동

1. **ADR·용어집 정리 시점에 답을 받는다.** 사용자가 11-14에 "재개편이니까 ADR이랑 CONTEXT.md 다 지워야 하나, 다시 해야 하나"라고 물었다(`CONTEXT.md`는 지금 `GLOSSARY.md`). 에이전트 의견(답 없음): 지금 지우지 않는다.
   - 진행 방식이 이미 현재 archdraw 동작을 근거로 쓰지 않는다. 그래서 남아 있어도 결정을 묶지 않는다.
   - 서버·배포 ADR 9개(0001·0002·0003·0007·0009·0010·0011·0013·0014)는 재개편 뒤에도 코드의 이유로 남는다(에이전트 추론).
   - 그림 규칙 ADR 6개(0004·0005·0006·0008·0012·0015)와 `GLOSSARY.md`는 스펙을 다 정한 뒤 한 번에 유지·대체·폐기로 나눈다. 용어집은 새 스펙의 말로 다시 쓴다. 그때까지 한 줄씩 고치지 않는다.
   - 받아들여지면 `GLOSSARY.md:57` 계약 정의 수정도 그때로 미룬다. 지금 정의("그 경계의 원래 모양대로 글자로 써서 해당 화살표 옆에 둔다")는 아래 "계약"의 자리·카드 결정과 맞지 않는다. 수정 안은 "경계를 넘는 데이터의 약속된 모양. 주소와 필드(이름과 타입)로 이루어진다"다.
2. **더할 것을 찾는다.** `wiki/index.md`에서 목적과 관련된 아티클(이해 병목, 리뷰 병목, AI-DLC, comprehension debt 등)과 참고 레포를 본다. 아래 "꼭 다룰 것" 8개가 놓친 할 일을 찾는다. 찾은 것마다 근거와 추천을 붙여 하나씩 묻는다. 질문마다 목적과의 관계를 먼저 말한다.
3. **"다음에 정할 내용"으로 간다.**

### 정한 것

**꼭 다룰 것(임시, 11-13).** 사용자가 "일단 이렇게 하고"로 받았다. "이번 설계에서 구체화할 네 가지 요구"를 대신한다.

| # | 할 일 | 상태 |
|---|---|---|
| ① | 질문에 맞는 그림 고르기 | "11-08에 정한 것". 그림 종류별 디자인도 여기서 하나씩 정한다. |
| ② | 질문 관련 아키텍처 그리기, 줌인·줌아웃, 다음 볼 곳 제안 | "11-08에 정한 것". |
| ③ | 계약 보여 주기 | 부품 모두 닫힘. 아래 "계약". |
| ④ | 확인 못 한 관계에 unknown 표시 | 닫힘. 아래 "근거 표시". |
| ⑤ | 사용자 표시 읽기, 동시 수정 거절, 고친 것 알리기. 묶음 안으로 옮긴 것도 여기서 묻는다 | 닫힘. 아래 "피드백 왕복". |
| ⑥ | 용어집 용어 쓰기, 코드 이름 괄호, 용어집이 없을 때 한 번 알리기 | 닫힘. 아래 "이름". |
| ⑦ | 설계 대안 나란히 비교 | 정하지 않음. |
| ⑧ | 다른 작업 중에 부르기. 예: PR 작성 중에 사용자나 다른 스킬이 부르고, 그린 그림은 그 PR의 자료가 된다 | 사용 장면이다. 내보내기 기능이 아니다. 현재 서버에는 `export_to_image`·`export_to_excalidraw_url`이 있다(`src/core/mcp-dispatch.ts:537,664`). |

**성공 판단.** 기준을 미리 정하지 않는다. 써 보며 결과물을 확인하고, 같은 지시로 다른 스킬·도구와 비교한다. 방법은 "다음에 정할 내용"의 평가 과제다. 11-08 후보(구조와 변경 이유를 설명한다, 틀린 곳을 찾는다, 다음 설계를 정한다)는 후보로 남기고 다시 묻지 않는다. 세 레포는 사람의 이해를 확인하지 않는다. 위키 `concepts/visual-feedback-contracts.md`는 보여 준 기록이 이해나 동의의 증거가 아니라고 쓴다.

**근거 표시.**

- 코드에서 확인하지 못한 관계만 표시한다. 선은 실선이고, 옆에 회색 작은 글 `unknown: 재시도 여부`처럼 무엇을 모르는지 적는다. 근거는 archify `repository-authoring.md:57-61`(명시적 unknown), visual-explainer `plans.md:101`(`guess`)이다.
- 점선은 추측의 뜻으로 쓰지 않는다. 참고 레포 어디도 그렇게 쓰지 않는다. archify는 비동기 배치(`authoring-defaults.md:49`), diagram-design은 선택·응답·비동기·삭제·영역 경계(`SKILL.md:213`, `type-architecture-delta.md:32`, `type-deployment.md:9`), stack-diagram은 개발·배포 시점 관계(`SKILL.md:37`)에 쓴다.
- 읽은 코드에서 이어 내린 결론에는 표시하지 않는다. 사용자가 먼저 의심할 곳은 코드 근거가 없는 곳이다(에이전트 추론).
- 캔버스에 코드 링크를 넣지 않는다. 사용자가 채팅에서 물으면 에이전트가 지금 코드를 읽어 `파일:줄`로 답한다. 줄 번호가 낡지 않는다. 대가로 캔버스만 볼 때는 코드로 갈 수 없다.

**피드백 왕복.**

- 틀린 곳 알려주기. 사용자는 말이나 캔버스에 그린 표시로 알려준다. 에이전트는 둘 다 읽고, 어느 요소인지 애매하면 되묻는다. 요소 ID 복사 같은 기능은 써 보고 헷갈림이 잦으면 더한다. 반대 근거로 dev.fast whiteboard(`packages/review/src/review-api/http.ts:1138,1157`)와 archify(`reader.js:527-528`)는 처음부터 ID 복사를 둔다.
- 캔버스를 직접 고친 뜻 읽기. 자리만 옮긴 것은 정리로 보고 그 자리를 유지한다. 묶음 안으로 넣기·화살표 변경·이름 변경처럼 뜻이 바뀔 수 있는 수정은 한 줄로 묻는다(예: "Kafka를 결제 서비스 안으로 옮기셨는데, 소속을 바로잡은 건가요?"). 근거는 위키 `comparisons/diagram-editing-feedback.md:24,58`(배치 보존, 좌표만으로 의도 확정 금지)이다. 서버는 변경 목록을 주지 않으므로 에이전트가 이전 그림과 비교한다. 프레임 안으로 넣으면 `frameId`가 바뀐다(`src/core/describe.ts:79`, 에이전트 추론).
- 동시 수정. 에이전트가 읽은 뒤 그림이 바뀌었으면 에이전트의 쓰기를 거절한다. 에이전트는 최신 그림을 다시 읽고 다시 고친다. 사용자 수정이 말없이 사라지지 않게 하기 위해서다. 근거는 Claude Whiteboard 안내문과 dev.fast whiteboard의 버전 불일치 거절(`http.ts:434-438`)이다. 다른 방식은 drawio-skill의 필드 단위 병합(`scripts/diagram_ir.py:1181-1239`)이다. 거절이 잦으면 병합으로 바꾼다. 현재 서버는 읽은 시점을 비교하지 않고 덮어쓴다(`src/server.ts:398-404`). 브라우저 동기화 `POST /api/elements/sync`는 장면 전체를 지우고 교체한다(`src/server.ts:1017`). 둘 다 코드만 읽었다.
- 고친 뒤 알리기. 고친 것과 안 고친 것·이유를 한두 줄로 알린다(예: "고침: publish 화살표 → Outbox. 안 고침: Kafka 위치(코드에 근거 없음)"). 가까운 근거는 drawio-skill의 `added`·`changed`·`removed`·`conflicts`(`diagram_ir.py:1402-1407`)다.
- 나중에 참고할 것. open-design의 댓글 재탐색 상태 `anchored`·`reanchored`·`stale`·`lost`(`apps/web/src/comments/anchor.ts:56-82`)는 요소를 가리키는 기능을 더할 때 본다. answer-me-with-html의 "untouched: 추천"(`src/runtime/reply-text.js:14-18`)은 변경안(`proposed`) 표시를 정할 때 본다.
- 현재 캔버스는 브라우저 선택을 에이전트에 넘기지 않는다. `src/core/canvas-state.ts:18`의 `selectedElements`를 채우는 코드가 없다(grep).

**이름.** 그림의 이름은 DDD 유비쿼터스 언어의 문제로 다룬다.

- 용어집이 있으면 에이전트가 찾아 그 용어를 쓴다. 파일 이름과 형식은 정하지 않는다. 사용자가 그림에서 용어를 바꾸면 "용어집에 넣을까요?"라고 한 줄로 묻는다. pr-lens도 설정의 `glossary`로 팀 용어 문서를 읽는다(`packages/schema/README.md:199,222`). 읽고 추가를 묻는 도구는 없다.
- 용어집이 없으면 이번 대화 안에서 한 대상에 이름 하나를 쓰고 사용자의 말을 우선한다(archify `explainer-authoring.md:93`). 사용자가 이름을 처음 고칠 때 한 대화에 한 번 알린다(예: "이 이름은 이번 대화에서만 씁니다. 프로젝트에 용어 문서가 있으면 다음 대화에도 씁니다."). 용어집을 만들자고 권하지 않는다. README에도 같은 동작을 적는다.
- 고친 이름만 따로 저장하는 파일은 두지 않는다. pr-lens는 `map.rename`을 쓰지만(`packages/renderer/src/corrections.ts:68-94`), 용어집과 함께 두면 같은 용어가 두 곳에 나뉜다(에이전트 추론).
- 코드 이름은 괄호로 같이 쓴다. 예: "주문 알림 (`OrderEventPublisher`)". 캔버스에 코드 링크가 없으므로 표시 이름과 코드를 잇는 자리다.

**계약(③).** 경계를 넘는 것(API, 메시지 토픽, DB 테이블, 설정)의 모양을 보인다.

- 보일 계약. 바뀌거나 추가된 계약과 사용자가 물은 계약만 필드를 보인다. 그대로인 계약은 화살표에 이름만 둔다. 근거는 diagram-design의 "그대로는 조용한 배경"(`type-architecture-delta.md:26`)과 visual-explainer의 콜아웃 3~6개(`diagrams.md:66-68`)다.
- 자리. 바뀐 계약의 화살표에는 번호와 이름(`① POST /payments`)만 둔다. 계약 블록은 그림 밖 목록에 둔다. 다섯 레포가 같은 방식이다(visual-explainer `diagrams.md:66-72`, system-design-101 `how-does-grpc-work.md:20-30`, system-design-primer `pastebin/README.md:151-162`, archify `authoring-defaults.md:45`, diagram-design `type-architecture-delta.md:18-33`). 참고 레포의 화살표 라벨은 12~17자다.
- 필드 형식. 타입이 기본이다. 단위·허용 값처럼 타입만으로 판단이 안 되는 곳에만 값을 붙인다(예: `amount: number // 원, 예: 12900`, `status: "PAID" | "FAILED"`). 값은 코드·테스트·로그에서 찾은 것만 쓴다. 근거는 pr-lens의 "데이터가 아니라 모양"(`packages/schema/README.md:81`)과 excalidraw-diagram-skill의 실제 형식 찾기(`SKILL.md:58,79`)다.
- 계약 블록 모양. 흰 카드에 회색 머리 띠를 둔다. 머리 띠 왼쪽은 `① POST /payments`와 그 아래 타입 요약 `PaymentRequest → PaymentResult`다. 타입 요약은 코드에 타입 이름이 있을 때만 쓴다. 오른쪽은 종류 태그 `API`다. 아래에 `REQUEST`·`RESPONSE 200` 구역을 위아래로 둔다. 조사표는 `surveys/2026-11-14-contract-block.md`, 그림은 스냅샷 `session11-q2-contract-eight`의 4번이다.
- 표 카드. DB 테이블은 저장소 박스 안, 설정값은 설정 박스 안에 둔다.
  - 머리 띠는 계약 블록과 같다. 왼쪽에 표시 이름(`Payment`)과 부제(`payments · 10 columns`, Redis는 `session:{id} · TTL 30m`), 오른쪽에 종류 태그(`TABLE`·`COLLECTION`·`HASH`·`CONFIG` 등)를 둔다. 아이콘은 두지 않는다.
  - 행은 변경 기호, 키 칩(`PK`·`FK`·`UQ`, 이름 앞, 회색 채움), 이름(mono), 타입(오른쪽) 순이다. NULL 허용은 `type?`이고 `?`가 없으면 NOT NULL이다(whiteboard `database-lens.tsx:1248`). 그대로인 컬럼은 `+ N unchanged columns`로 접는다. 행 배경은 교차하지 않는다(diagram-design 원형과 다르다).
  - 아래 `CONSTRAINTS` 구역에는 바뀌었거나 판단에 필요한 제약만 둔다(CHECK, DEFAULT, INDEX, FK 규칙, 벡터의 distance·인덱스). 근거는 diagram-design `type-db-schema.md:14`다.
  - 저장소 종류와 관계없이 같은 카드다. 근거는 pr-lens `svg/datamodel.ts:62-236`·`schema/README.md:81`(`table` 하나가 "테이블, 컬렉션, 키 묶음")과 whiteboard `database_lens.ts:24-25,49`(`relational`·`document`를 같은 카드로, 중첩 필드는 들여쓰기)다. Mongo 중첩 필드는 들여쓰고, 벡터는 `vector float[1536]` 행 하나로 둔다. 벡터 DB를 다루는 레포는 없어 벡터 행은 에이전트 추론이다.
  - 원래 정의(DDL, JPA 엔티티, Mongoose 스키마, 컬렉션 생성 호출)는 캔버스에 두지 않는다. 사용자가 물으면 채팅에 `파일:줄`과 원문 일부를 보인다.
- 변경 표시. 그림마다 상황(기존·변경·추가)을 고르지 않는다. 요소와 필드마다 그대로·추가·수정·삭제를 붙인다. 기존 동작 그림은 모두 "그대로"라 전체 모양이 된다. 근거는 pr-lens 컬럼별 `delta`(`schema/README.md:58-64,81`)와 diagram-design 요소별 상태(`type-architecture-delta.md:26-35`)다.
  - 필드 행은 `+`·`~`·`−`와 색이다. 바뀐 타입은 `int`(취소선) `→ bigint`다. 삭제 행은 취소선과 흐리게다.
  - 박스·화살표는 추가 초록, 수정 파랑 `#1971c2`, 삭제 빨강·파선·흐리게·취소선이다. 고정 영어 글자 배지 `NEW`·`CHANGED`·`REMOVED`를 단다(pr-lens `svg/datamodel.ts:71-139`, diagram-design `docs/screenshots/architecture-delta.png`). 그대로는 검정 1px이다.
  - 수정 색 파랑은 사용자가 주황을 기각하고 고른 것이다. 조사에서는 호박색·주황·노랑이 6곳으로 많고, `~`는 3곳이 쓴다(`surveys/2026-11-14-change-marker.md`).
  - ADR-0015(수정은 노랑, 계약 안 변경은 `+`·`−` 줄)와 다르다. 새 ADR이 ADR-0015를 대체한다.
- 데이터 예시 행(실제 값이 든 가로 표, system-design-101 샤딩 그림)은 계약 부품이 아니다. ①에서 "데이터 분포" 같은 그림 종류로 정한다(에이전트 추론).

**색과 글씨체.** 두 층으로 나눈다.

- 전역: 글씨체, 중립 회색 톤, 변경 3색(초록·파랑·빨강). 변경 3색은 변경에만 쓴다.
- 그림 종류별(①에서 정함): 그룹·경계 배경, 주요 경로 강조색, 요소 종류별 색. 레포마다 쓰임이 다르다(stack-diagram `SKILL.md:35-37`, archify `DESIGN.md:102-148`, visual-explainer `style-guide.md:10,18`). 조사표는 `surveys/2026-11-14-color-font.md`다.
- 글씨체: 이름·보조 글은 Nunito(Excalidraw 6), 코드 이름·타입·계약 필드는 Comic Shanns(8, mono)다. 이름 sans + 코드 mono는 7곳이 쓴다. Cascadia(3)는 Excalidraw 0.18.1에서 deprecated다(`src/types.ts:341-342`). 한글은 대체 글꼴로 나온다.
- 괄호 라벨: 박스 안은 둘째 줄에 mono 회색 코드 이름, 박스 밖 글은 괄호다.

**순서.** 부품을 먼저 정했다. 그림 종류(시퀀스, 상태, ERD 등)별 디자인은 ①에서 다룰 그림을 정할 때 하나씩 정한다. 지금 스킬의 상황 23개(`plugin/skills/archdraw/references/routing-table.md`)도 재개편 대상이다.

### 진행 방식

- 전면 개편이다. 그림 규칙·화면과 "꼭 다룰 것" 목록도 다시 정한다. 현재 규칙과의 차이는 문제로 세지 않는다.
- 지금은 스펙만 정한다. 코드 구현 방향은 스펙 뒤에 다룬다.

**조사.** 디자인·표현을 묻거나 정한 결정을 다시 볼 때는 이 순서를 따른다.

1. `docs/research/design-refs.txt`의 레포를 모두 읽는다. 레포가 많으면 서브에이전트 셋에 나눠 읽힌다.
2. 조사표 `docs/research/surveys/<날짜>-<주제>.md`를 만든다. 레포마다 한 행에 커밋, 방식(없으면 "없음"), 근거(`파일:줄` 또는 이미지 경로)를 쓴다. 앞 조사표에서 같은 커밋으로 "없음"을 확인한 레포는 그 행을 옮겨 쓴다.
3. `node scripts/check-survey.mjs <조사표>`를 돌린다. 통과하면 다음으로 간다.
4. 찾은 서로 다른 방식을 모두 선택지로 낸다. 선택지 수는 조사 결과가 정한다. 질문할 때 조사표 경로를 같이 보인다.

**근거.** 선택지와 추천마다 참고 레포 원문(`파일:줄`)이나 위키 아티클을 댄다. 근거가 없으면 "에이전트 추론"이라고 쓴다. 현재 archdraw의 동작은 재개편 대상이라 근거로 쓰지 않는다.

**디자인 정하기.**

- 기능 하나씩 작게 정한다. 공통 규칙(색, 기호, ADR 충돌)도 그 중에 생기면 작은 질문 하나로 묻는다.
- ③의 남은 부품은 에이전트가 조사 근거로 기본값을 정해 한 장에 그렸다. 사용자가 짚은 부품만 대안을 그려 물었다. 짚지 않은 부품은 기본값이 정한 것이 됐다. 이 방식을 그림 종류별 디자인에도 쓸지는 답 없음이다.
- 부품 모양은 그 부품이 쓰일 경우를 모두 그려 비교한다(예: 표 카드는 PG·MongoDB·벡터 DB·Redis). 참고 원형이 판단에 필요한 정보를 빼면 그 점을 먼저 말하고 보완안을 같이 그린다(예: NULL 허용, 제약조건).
- 사용자가 고른 결정은 조사 결과가 달라도 그대로 둔다. 바꿀 근거가 생기면 따로 묻는다.

**캔버스 예시.** 보이는 모습을 정하는 질문은 처음부터 캔버스에 그린다. 참고 레포의 디자인을 먼저 읽고 그 모양대로 그린다. 라이트 모드와 다크 모드를 같이 보인다. 그리기 전에 이전 그림을 스냅샷으로 저장하고, 지금 질문의 선택지만 그린다. "메모", "블록" 같은 새 말도 그림으로 먼저 보인다.

**질문.**

- 질문은 한 번에 하나이고, 한 질문을 잘게 쪼개지 않는다. 그 질문을 닫은 뒤 다음 질문으로 간다. 생긴 다른 질문은 "다음에 정할 내용"으로 미룬다. 한 질문이 두 상황을 섞었다고 보이면, 나눠 묻기 전에 나눌지부터 확인한다.
- 형식은 이 순서다. 첫 줄에 무엇을, 어떤 상황에서 그릴 때의 모양인지 쓴다. 이어서 왜 묻는지, 캔버스 예시, 선택지(가·나·다), 추천과 근거를 쓴다.
- 사용자가 겪는 일과 그 결과로 묻는다. 클릭·단축키 같은 조작 방법은 구현으로 미룬다.
- 추천은 예시와 같은 답에 낸다. 사용자가 되물으면 약한 근거와 차선을 그대로 말한다.
- 질문과 관계있는 근거만 꺼낸다. 비유 대신 실제 이름을 쓴다. whiteboard는 dev.fast whiteboard(`references/whiteboard`)와 Claude Whiteboard(claude.ai Artifact 타입)로 이름을 나눠 쓴다.

**보고.** 결론 한 줄과 불릿 몇 개로 쓴다. 진행 상황과 다음 할 일도 같다. 각 항목이 끝낸 일인지 할 일인지 첫 말로 밝힌다.

**기록.**

- 사용자가 고른 것만 정한 것으로 적는다. "진행하자"는 제안의 승인이 아니다. 답하지 않은 제안은 "답 없음"으로 적는다.
- 질문이 닫히면 "정한 것"에 결정과 근거만 적는다. 경위와 사용자 발언은 커밋 기록에 맡긴다.
- 목표와 문제는 사용자의 표현으로 적는다. 목적을 설명할 때는 "해결하려는 문제" 첫 두 문단을 기준으로 한다. 상세와 근거는 그 절에만 둔다. 사용자의 짧은 말은 말한 뜻(예: 사용 장면) 그대로 적는다.

**그 밖.**

- 그림의 형태(의사코드, 클래스 다이어그램 등)는 에이전트가 질문에 맞게 고른다.
- 문서의 다른 절에 있는 요구도 범위 안이면 사용자가 꺼내기 전에 먼저 묻는다.
- 소프트웨어 용어는 한국어가 어색하면 영어로 쓴다.

### 캔버스 그리기

- 캔버스 세션이 없으면 `node dist/bin.js session start --project <레포>`로 띄운다. `dist/server.js`를 직접 띄우면 `ARCHDRAW_PROJECT_ROOT` 오류가 난다.
- `POST /api/elements/batch`로 그린다. `POST /api/export/image`(`{"format":"png"}`)로 확인한다. 브라우저 탭이 열려 있어야 한다. 그리기 전에 `POST /api/snapshots`로 이전 그림을 저장한다. 그린 스크립트는 커밋하지 않는다.
- 스냅샷은 `~/.excalidraw-architect/snapshots/excalidraw-architect-09860e67/`에 있다. 최근 것은 `session12-parts-defaults`(부품 기본값)와 `session12-fonts`(글씨체 네 안)다.
- 다크 모드는 Excalidraw가 캔버스 전체에 `invert(93%) hue-rotate(180deg)`를 씌운다. 흉내 낼 때는 내보낸 PNG에 `magick in.png -color-matrix "-0.86 0 0 0 0 0.93  0 -0.86 0 0 0 0.93  0 0 -0.86 0 0 0.93  0 0 0 1 0 0  0 0 0 0 1 0  0 0 0 0 0 1" -color-matrix "-0.574 1.430 0.144  0.426 0.430 0.144  0.426 1.430 -0.856" out.png`를 쓴다. 그 PNG를 `POST /api/files`로 올리고 `image` 요소(`fileId`)로 옆에 둔다. 어두운 채움 블록은 다크 모드에서 밝게 뒤집혀 "어두운 코드 블록"의 뜻이 사라진다.

### 막힌 것

없음. 참고 레포 폴더가 비면 `check-survey.mjs`가 알린다. 그때는 조사표의 커밋으로 바로 복제하고 사용자에게 알린다.

# 요청 묶음 5행 — 그림 표현과 필수요소 조사

> 조사일 2026-09-12 · 대상: [review.md](review.md) R09 다음 질문 6 "리서치 실행 ②"의 **요청 묶음**(API 동작 / 인증·권한 / API 계약 / 재시도·분기 / 엔티티 생명주기). 행을 제안하는 문서이지 결정하는 문서가 아니다.
> 본보기: [saga·CQRS·이벤트 소싱 조사](research-saga-cqrs-event-sourcing.md). 그 문서 §1·§3만 참고했고 세 패턴을 다시 조사하지 않았다.
> **확인 방법.** 1차 출처를 WebFetch로 직접 열었다. OMG UML 2.5.1은 PDF(18MB)를 내려받아 `pdftotext`로 뽑은 원문에서 절 번호로 읽었다. 그림 5장은 이미지 파일을 받아 직접 봤다(Azure 비동기 요청-응답·서킷브레이커·재시도, AWS EC2 생명주기).
> 표시: **[봄]** 그림 직접 봄 / **[alt]** alt·캡션·본문으로만 앎 / **(요약)** 요약 모델을 거친 인용이라 원문 재대조를 못 함.
> 국내 회사 기술 블로그는 서브에이전트 하나가 같은 규칙으로 조사했다(§5 "확인" 칸의 **에이전트**). 그 에이전트는 그림 11장을 내려받아 직접 봤다고 보고했고 인용에 절 제목을 붙여 왔다. **나는 그 인용을 원문에서 다시 대조하지 못했다** — 그래서 "에이전트" 표시를 붙인다.
> **로컬 확인.**
> - `wiki/index.md` 346줄 전문 + 키워드(`retry|backoff|state machine|auth|oauth|jwt|openapi|http|idempot|api|contract|lifecycle|circuit`) 검색: 이 묶음에 쓸 페이지 0건. 걸린 줄은 전부 하네스 엔지니어링 문서다.
> - `raw-articles/`: 같은 키워드로 2건뿐이며 둘 다 OpenAI 모델 가이드(`Model guidance OpenAI API*.md`) — 무관.
> - archify `scenarios.mjs` 전문: 이 묶음과 겹치는 레시피는 `api-request`·`async-roundtrip`·`object-lifecycle` 셋. 인증·권한, API 계약, 재시도·분기 레시피는 **없다**.
>
> **표기.** `[ID §절]`은 §5 출처 ID와 원문 절 제목이다. **(추론)**은 출처가 아니라 이 문서의 판단이다.

## 1. 요약

### 다섯 행 제안

| 상황 | 답하는 질문 | 그림 종류 | 필수요소 | 경계(이럴 땐 다른 행) |
|---|---|---|---|---|
| **API 동작** | 이 요청은 누가 누구를 어떤 순서로 부르고, 무엇을 돌려주며, 실패하면 어디로 갈라지나? | 시퀀스(UML 17.8 기호): 참여자 = 머리 상자 + 세로선, 동기 = 채운 화살촉·비동기 = 열린 화살촉(점선 아님 — §4-3), 실행 구간 = 세로선 위 가는 상자, 조건 갈래 = `alt`/`opt` 프레임 + `[조건]` | ① 호출자·피호출자 ② 요청·응답(이름·주요 인자·상태 코드) ③ 메시지별 동기/비동기 ④ 실패·대체 경로(성공·실패·**결과 모름** 3갈래) ⑤ 비동기 후속(초기 응답·큐·백그라운드 작업·완료 통지·재시도·타임아웃 — 동기 API면 "없음 확인") ⑥ 호출별 타임아웃·마감 | 실패에 보상이 붙으면 saga / 한 호출의 재시도 수치는 재시도·분기 / 주고받는 내용의 모양이 쟁점이면 API 계약 / 인증 자체가 질문이면 인증·권한 |
| **인증·권한** | 이 요청의 자격은 누가 발급·검증하고, 언제 만료되며, 만료·부족하면 무엇이 돌아오나? | 시퀀스 + 신뢰 경계(캔버스 근사형: 경계를 세로 띠로 긋고 띠를 넘는 메시지에 검사 표시 — UML엔 신뢰 경계 기호가 없다) | ① 참여자와 발급·검증 주체 ② 자격 증명 종류와 전달 방식 ③ 수명(토큰 `exp`·세션 idle/absolute) ④ 갱신·재인증 시점 ⑤ 만료·거부 응답(401·403)과 그 뒤 흐름 ⑥ 권한 검사 지점과 규칙 ⑦ 신뢰 경계 | 인증이 답이 아니면 API 동작 그림에 참여자 하나로만 / 경계가 어디냐가 질문이면 시스템 개요 / 필요한 스코프만 적을 땐 API 계약 |
| **API 계약** | 이 엔드포인트는 무엇을 받고 무엇을 돌려주며, 에러와 버전은 어떻게 약속돼 있나? | **표준 표기 못 찾음**(§4-4). 캔버스 근사형: 머리에 메서드+경로·버전, 요청 칸·응답 칸 두 상자에 실제 페이로드, 아래 에러 표(코드·상태·본문 형식). 서비스 사이 제공/필요 관계를 보일 때만 UML 인터페이스 기호(lollipop/socket) | ① 엔드포인트·오퍼레이션 식별 ② 실제 요청 페이로드 ③ 실제 응답 페이로드와 상태 코드 ④ 에러 코드와 에러 본문 형식 ⑤ 버전 정책과 호환성 규칙 ⑥ 필요한 인증·스코프 ⑦ 멱등·재시도 계약 | 호출 순서가 답이면 API 동작 / 저장 스키마면 데이터 모델 / 이벤트 메시지 계약이면 이벤트 토폴로지 |
| **재시도·분기** | 이 호출이 실패하면 무엇을 다시 하고, 몇 번·얼마 간격으로 하며, 포기하면 어디로 보내나? | 상태도(확정, 판정 안 함 — 다만 출처는 넷으로 갈린다 §4-1). 기호는 UML 14.2.4: 상태 = 둥근 사각형, 전이 라벨 = `트리거 [조건] / 동작`, 시작 = 채운 원, 종료 = 이중 원, 갈래 = 마름모 | ① 재시도 대상 조건(재시도 vs 즉시 실패, 타임아웃 포함) ② 백오프(초기 간격·배수·상한·지터) ③ 최대 횟수와 계층 중복 여부 ④ 포기 후 경로(폴백 응답·DLQ·수동) ⑤ 차단 장치(서킷브레이커 상태·재시도 예산) ⑥ 재시도 안전성(멱등) | 보상이 붙으면 saga / 엔티티의 상태 집합이면 생명주기 / 컨슈머 전체의 DLQ 지형이면 이벤트 토폴로지 |
| **엔티티 생명주기** | 이 엔티티는 어떤 상태를 거치고, 무엇이 상태를 바꾸며, 어떻게 끝나나? | 상태 다이어그램(UML 14.2.4 기호 그대로) | ① 시작·진행 상태 ② 전이 트리거와 조건 ③ 대기·재시도 상태 ④ 모든 종료 상태 ⑤ 되돌릴 수 없는 전이·복귀 불가 표시(구 "불가 전이") | 실패 시 되돌림·전진이면 saga / 상태를 이벤트로 저장·복원하면 이벤트 소싱 / 한 호출의 재시도 수치면 재시도·분기 / 지속 상태가 없고 참여자 상호작용이 질문이면 API 동작 |

### 판단

1. **빈 칸 5개(답하는 질문)는 전부 출처로 채웠다.** API 동작·엔티티 생명주기는 archify `question`을 옮겨 다듬었고[ARCHIFY], 나머지 셋은 출처가 "이 문서가 푸는 문제"라고 말한 문장에서 만들었다(인증·권한 = OAuth 4 역할과 만료·갱신 그림 [RFC6749 Fig.1·2], API 계약 = "에러 코드 문자열은 API 계약의 일부" [AZURE-GUIDE], 재시도·분기 = Azure 재시도 3분류 [AZ-RETRY §Retry strategies]). 질문 문장 자체는 (추론)이다.
2. **그림 종류 빈칸 2개를 채운다.**
   - 9/5표의 **"시퀀스 변형"**은 정체가 불명이었다. 출처가 실제로 그린 것은 시퀀스이고(Auth0은 제목이 "Authorization sequence diagram"[AUTH0-ACF], OAuth·OIDC는 참여자 상자 + 번호/문자 붙인 메시지), 시퀀스에 없는 유일한 요소가 **신뢰 경계**다[OWASP-TM §Trust Boundary]. "변형" = 시퀀스 + 신뢰 경계라고 읽는다(추론).
   - 9/5표의 **"계약 다이어그램"**은 표준 표기가 아니다. OpenAPI·AsyncAPI·Pact 모두 다이어그램 표기를 정의하지 않는다(§4-4). 캔버스 근사형으로 적는다.
3. **9/5표와 archify가 겹치는 3쌍을 합쳤다**(작업 지시의 메모대로). 참여자 ≈ 호출자·피호출자 → **호출자·피호출자**, 실패 지점 ≈ 에러·대체 경로 → **실패·대체 경로**, 동기/비동기 ≈ 비동기 후속 → **둘로 나눠 유지**(메시지 화살표의 성질 ③과 응답 이후의 일 ⑤는 그림에서 다른 자리를 차지한다 — 추론).
4. **"불가 전이"는 수정한다.** 그리라고 말한 1차 출처가 없다. UML에서는 그리지 않은 전이가 곧 일어나지 않는 전이이고[UML251 §14.2.3.9.5], XState의 "forbidden transition"은 그림 요소가 아니라 부모 전이를 막는 모델 장치다[XSTATE]. 대신 실제 문서들은 **되돌릴 수 없음을 문장으로** 적는다(EC2 `terminated` "cannot be started"[AWS-EC2LC], Stripe `canceled` "can't be undone"[STRIPE-LC], K8s "terminal phases—Pods do not transition out"[K8S-POD]). 항목명을 "되돌릴 수 없는 전이·복귀 불가 표시"로 바꾼다. 순수한 불가 전이 목록은 **제거 후보**로 남긴다(02에서 확인).
5. **새 필수요소 6개를 추가한다.** API 동작 ⑥ 타임아웃·마감[SRE-CASCADE], 인증·권한 ①·⑥[RFC6749, OWASP-AUTHZ], API 계약 ①·⑥·⑦[OAS31, IDEMKEY], 재시도·분기 ⑤ 차단 장치[AZ-CB, AWS-SDKRETRY, GRPC-A6, SRE-OVERLOAD]·⑥ 멱등[AZ-RETRY §Idempotency].
6. **R05(점선 의미)에 쓸 근거가 나왔다.** UML은 동기/비동기를 **화살촉 모양**으로 가른다("An asynchronous Message … has an open arrow head. A synchronous Message … has a filled arrow head")[UML251 §17.4.4.1]. 점선은 UML에서 **응답(reply)** 메시지다. 통신 방식을 점선으로 표시하지 않아도 표준 표기가 성립한다(§4-3).
7. **재시도·분기의 상태도는 판정하지 않았다**(확정 사항). 다만 출처가 갈린다는 사실은 §4-1에 적었다 — 상태도로 그린 것은 서킷브레이커이고, Azure 재시도 패턴 자신의 그림은 시도 3번을 시간순으로 늘어놓은 메시지 그림이다[봄]. 국내 사례도 플로우차트(컬리)와 시퀀스(우아한형제들 Task Queue)로 갈린다.
8. **국내 사례가 결론 둘을 흔든다.**
   - 배송 로봇 상태도에는 **종료 상태가 없다** — `유휴`로 되돌아오는 닫힌 순환이다[WOOWA-SM 봄]. 순환형 생명주기가 실제로 있으므로 ④ "모든 종료 상태"는 "없음 확인"이 가능한 항목으로 둔다.
   - 타임아웃 **값**을 공개한 국내 글은 하나도 없었다(에이전트 보고). 재시도·서킷브레이커 값은 반대로 아주 상세하다. API 동작 ⑥은 그래서 약한 추가다(§4-8).
9. **국내 사례가 결론 셋을 굳힌다.** 인가를 시퀀스로 그린 실물이 있고[WOOWA-OSORI 봄], 오류 응답을 점선으로 그린 실물이 있고[KAKAOPAY-HTTP 봄], 호출 결과를 성공·실패·**알 수 없음** 3갈래로 그린 실물이 있다[KAKAOPAY-MSA 봄].

## 2. 행별 조사 결과

### 2.1 API 동작

**질문 후보**
- "Who calls whom, in what order, and what returns?" [ARCHIFY `api-request`]
- "What happens after the initial request returns?" [ARCHIFY `async-roundtrip`] — R09 확정대로 이 행의 필수요소로 흡수한다.
- 시퀀스가 답하는 것: "A sequence diagram describes an Interaction by focusing on the sequence of Messages that are exchanged, along with their corresponding OccurrenceSpecifications on the Lifelines." [UML251 §17.8]
- PRD 사용자 발화 "이 API 부르면 뭐가 일어나" [PRD 스토리 1]

**출처의 그림**

| 출처 | 그림 종류 | 그려진 요소 | 확인 |
|---|---|---|---|
| AZ-ASYNC 첫 그림 | 시퀀스 | lifeline 4개(Client / API endpoint / Status endpoint / Resource URI), 메시지 8개: `POST`→`HTTP 202`, `GET`→`HTTP 200`, `GET`→`HTTP 303`, `GET`→`HTTP 200`. 실행 구간 상자는 API endpoint에만 | [봄] |
| AZ-ASYNC 구현 그림 | 번호 붙인 박스-화살표 | client→API→queue→worker→blob storage, client→status endpoint→blob storage (7단계) | [alt] |
| UML251 Table 17.1·17.2 | 시퀀스 기호 목록 | 노드: Frame·Lifeline·ExecutionSpecification·InteractionUse·CombinedFragment·StateInvariant·Continuation·Coregion·DestructionOccurrenceSpecification·DurationConstraint·TimeConstraint / 경로: Message·LostMessage·FoundMessage·GeneralOrdering | [alt] (표 본문은 원문 대조, 그림 칸은 PDF 이미지라 못 봄) |
| AZ-RETRY | 시도 나열 메시지 그림 | Application ↔ Hosted service, 요청 3개에 `500`·`500`·`200`, 밑에 1·2·3 설명 줄 | [봄] |
| AUTH0-ACF | "Authorization sequence diagram" | User / Application / Auth0 Authorization Server / API, 번호 붙인 10단계 | [alt] (요약) |
| ARCHIFY `api-request`·`async-roundtrip` | 시퀀스 | include: callers and callees / request and return messages / fallback or error path / async side effects · initial acknowledgement / queue or scheduler / background work / callback, retry, and timeout | 원문 읽음 |
| KAKAOPAY-HTTP | 시퀀스 | lifeline 3개(`A API`/`B API`/`C API`). 요청은 실선, **오류 응답은 점선**. 오류 화살표마다 노란 노트로 실제 페이로드 `{"message": "Invalid Value", "status": 400, "code": "C001"}` — C의 에러 바디가 B를 거쳐 A까지 원형 그대로 전달되는 것이 논점 | 에이전트 [봄] |
| KAKAOPAY-MSA | 분기 트리(시퀀스 아님) | 액터→`주문요청`→마름모 `신규건?`→Y `결제요청`/N `기존 건 확인 후 보정 처리`. 각 호출 결과가 **`성공(S)`·`실패(F)`·`알 수 없음(U)` 3갈래**로 갈라지고, U에서 `재요청? 취소?`로 또 3갈래. 3단계째 U 뒤에 빨간 X와 `트랜잭션 종료` | 에이전트 [봄] |
| KAKAOPAY-MSA(둘째 그림) | 박스-화살표 | `결제서비스`→`페이머니`·`페이상품권`·`포인트`·`카드`, **서비스마다 자기 DB를 매달아** 그림 | 에이전트 [봄] |
| TOSSPAY-API | 그림 없음(본문·페이로드 예시) | 동기 API와 비동기 웹훅의 역할 분담, 웹훅 페이로드 JSON | 에이전트 |

→ 요청 흐름을 그린 1차 출처는 전부 시간축 그림이다. Azure는 폴링 흐름을 **UML 시퀀스 모양 그대로** 그렸다. 국내 사례 둘은 갈린다 — 카카오페이 HTTP 클라이언트 글은 시퀀스, 네트워크 예외 글은 **결과가 3갈래로 갈라지는 분기 트리**다. 뒤쪽은 "응답을 못 받았을 때"가 질문이라 시간축보다 갈래가 답이 된다(추론).

**필수요소 후보**

| 후보 | 근거 인용 | 값 3종으로 채울 수 있나 |
|---|---|---|
| ① 호출자·피호출자 | "A Lifeline is shown using a symbol that consists of a rectangle forming its 'head' followed by a vertical line … that represents the lifetime of the participant." [UML251 §17.3.4.1] / include "callers and callees" [ARCHIFY] | 실제 값 / 없음 확인(외부 호출 없음) / 확인 못 함 |
| ② 요청·응답(이름·주요 인자·상태 코드) | 메시지 라벨 BNF `<message-name> [‘(’[<input-argument-list>]’)’]`, 응답 라벨은 `[<assignment-target> ‘=’]` + 반환값 [UML251 §17.4.4.1] / 메서드별 상태 코드 표(GET 200·204·404, POST 200·201·204·400·405, PUT 200·201·204·409, PATCH 200·400·409·415, DELETE 204·404) [AZ-APIDESIGN §Define RESTful web API methods] | 실제 값 / 없음 확인(본문 없음 204) / 확인 못 함 |
| ③ 메시지별 동기/비동기 | "An asynchronous Message (messageSort equals asynchCall or asynchSignal) has an open arrow head. A synchronous Message (messageSort equals synchCall) has a filled arrow head." [UML251 §17.4.4.1] | 실제 값 / — / 확인 못 함 |
| ④ 실패·대체 경로 | 조건 갈래 표기: "The notation for a CombinedFragment … is a solid-outline rectangle. The operator is shown in a pentagon in the upper left corner", 조건은 "shown in square brackets covering the lifeline where the first event occurrence will occur" [UML251 §17.6.4] / "The 4xx class of status code indicates that the client appears to have erred." [RFC9110 §15.5] / 에러 본문 형식 [RFC9457] / include "fallback or error path" [ARCHIFY] / **결과 모름을 따로 그린다**: "타임아웃과 같은 상황은 요청에 대한 성공 응답을 받지 못했지만, 트랜잭션의 결과가 성공했는지 실패했는지 명확하게 판단하기 어려운 경우입니다." · "이런 상황을 쉽게 실패로 간주하면 꽤나 난감한 상황이 벌어질 수 있습니다." [KAKAOPAY-MSA §알 수 없는 에러 처리] / 오류 응답을 상류까지 전달: "연속된 호출 흐름 중 오류가 발생할 경우 해당 오류 응답을 최초의 호출지까지 전달해야 할 필요성" [KAKAOPAY-HTTP] | 실제 값 / 없음 확인(에러 경로 없음) / 확인 못 함 |
| ⑤ 비동기 후속 | "The API responds synchronously as quickly as possible. It returns an HTTP 202 (Accepted) status code"; 202는 `Location`("A URL that the client polls for a response status")과 `Retry-After`("An estimated completion time for processing")를 포함해야 한다; 상태 응답 필드 `status`(Pending·Running·Succeeded·Failed·Canceled)·`createdAt`·`lastUpdatedAt`·`percentComplete`·`error` [AZ-ASYNC §Solution, §Problems and considerations] / "An asynchronous method should return HTTP status code 202 (Accepted)… Include the URI of the status endpoint in the Location header" [AZ-APIDESIGN §Implement asynchronous methods] / 웹훅 쪽: "Stripe attempts to deliver events to your destination for up to three days with an exponential back off in live mode." [STRIPE-WH §Automatic retries] | 실제 값 / **없음 확인(동기 API)** / 확인 못 함 |
| ⑥ 호출별 타임아웃·마감 | "Rather than setting independent deadlines per hop, servers should propagate the original deadline downward, checking remaining time before performing expensive operations." [SRE-CASCADE] / 타임아웃이 곧 실패 경로다: "A `Task` state failed because it ran longer than the `TimeoutSeconds` value" [AWS-SFN §States.Timeout] / include "callback, retry, and timeout" [ARCHIFY `async-roundtrip`] / **반대 신호**: 국내 회사 글에서 타임아웃 값을 공개한 사례 0건(§4-8) | 실제 값 / 없음 확인(타임아웃 없음 = 위험이 드러난 값) / 확인 못 함 |

넣지 않은 것:
- **인증 단계.** archify는 시퀀스에 넣으라 하고 Azure는 그림에서 빼라 한다(§4-2). 경계 문장으로 처리하고 필수요소로는 넣지 않는다(추론).
- **캐시 적중/미스.** archify `api-request` include에 있지만(`cache miss`는 신호어), 이는 레시피의 예제 소재이지 값이 필요한 항목이 아니다 — ④ 대체 경로에 흡수(추론).
- **멱등키.** API 계약 ⑦과 재시도·분기 ⑥이 맡는다. 다만 Azure는 이 그림 맥락에서 요구한다: "You can require clients to supply an idempotency key … If the back end receives a duplicate key, it should return the existing status resource instead of enqueuing a second work item." [AZ-ASYNC]

**현재 값 판정**

| 항목 | 출처 표기 | 판정 | 근거 |
|---|---|---|---|
| 그림 종류 = 시퀀스 | PRD·9/5표 | **유지** | 요청 흐름을 그린 1차 출처가 전부 시간축 그림. Azure 폴링 그림이 UML 시퀀스 모양 그대로다 [봄]. |
| 참여자 | 9/5표 | **수정(이름)** → 호출자·피호출자 | archify와 같은 항목. UML은 lifeline이라 부른다. |
| 동기/비동기 | 9/5표 | **유지+보강** → 메시지별 동기/비동기 | 화살촉으로 구분하는 표준 표기가 있다 [UML251 §17.4.4.1]. |
| 실패 지점 | 9/5표 | **수정** → 실패·대체 경로(성공·실패·**결과 모름** 3갈래) | archify `fallback or error path`와 같은 항목이고, UML엔 `alt` + `[조건]`이라는 표기가 있다. "지점"만으로는 갈라진 뒤 무엇이 되는지 값이 안 나온다(추론). 3갈래는 카카오페이가 그림으로 그렸고[KAKAOPAY-MSA 봄], saga 조사에서도 같은 값이 나왔다(카카오페이 Unknown·토스뱅크 "결과 확인 필요"). |
| 요청·응답 | archify | **유지+보강** → 이름·주요 인자·상태 코드 | 메시지 라벨 BNF와 Azure 상태 코드 표. |
| 에러·대체 경로 | archify | **병합** → ④ | 위와 같은 항목. |
| 비동기 후속(초기 응답·큐·백그라운드 작업·콜백·재시도·타임아웃) | archify + R09 확정 | **유지+보강** | Azure가 값을 구체적으로 준다: 202 + `Location` + `Retry-After` + 상태 리소스 필드 5종 + 완료 시 303. |
| (없음) | — | **추가(약함)** ⑥ 호출별 타임아웃·마감 | SRE의 마감 전파. 단 성능 병목 행과 겹칠 소지가 있고(§3), 값을 공개한 국내 사례가 없다(§4-8). 02에서 먼저 떨어질 후보다. |

### 2.2 인증·권한

**질문 후보**
- 자격을 누가 발급하고 누가 검증하나: OAuth의 네 역할과 (A)~(F) 흐름 [RFC6749 Fig.1]
- 만료되면 어떻게 되나: Figure 2가 그린 것이 정확히 이 질문이다 — `(E) Access Token → (F) Invalid Token Error → (G) Refresh Token → (H) Access Token` [RFC6749 Fig.2 "Refreshing an Expired Access Token"]
- 언제 다시 로그인시키나: "At AAL2, authentication of the subscriber SHALL be repeated at least once per 12 hours during an extended usage session, regardless of user activity. Reauthentication … SHALL be repeated following any period of inactivity lasting 30 minutes or longer." [NIST-63B §7.2]
- 누가 무엇을 할 수 있나(인가): "Permission should be validated correctly on every request, regardless of whether the request was initiated by an AJAX script, server-side, or any other source." [OWASP-AUTHZ]

**출처의 그림**

| 출처 | 그림 종류 | 그려진 요소 | 확인 |
|---|---|---|---|
| RFC6749 Fig.1 | ASCII 박스-화살표(참여자별 상자 + 문자 붙인 메시지) | Client / Resource Owner / Authorization Server / Resource Server, (A) Authorization Request → (B) Authorization Grant → (C) Grant → (D) Access Token → (E) Access Token → (F) Protected Resource | [봄] (ASCII 원문) |
| RFC6749 Fig.2 | 같음 | (A)~(H). 만료·오류·갱신이 한 그림에: `(F) Invalid Token Error`, `(G) Refresh Token`, `(H) Access Token & Optional Refresh Token` | [봄] |
| RFC6749 Fig.3 | 같음 + 리디렉션 경로 | Resource Owner / User-Agent / Client / Authorization Server, (A) Client Identifier & Redirection URI → (B) User authenticates → (C) Authorization Code → (D) Code & Redirection URI → (E) Access Token (w/ Optional Refresh Token) | [봄] |
| OIDC | 8단계 목록 + 흐름 그림 | RP / End-User / OP 사이 5단계 | [alt] (요약) |
| AUTH0-ACF | "Authorization sequence diagram" | User / Application / Auth0 Authorization Server / API, 10단계 | [alt] (요약) |
| OWASP-TM | DFD 요소 정의(그림 아님) | External Entity / Process / Data Store / Data Flow("The direction of the data movement is represented by the arrow") / Trust Boundary | 본문 |
| WOOWA-OSORI | **UML 시퀀스**(캡션 "동작흐름도") | lifeline 3개(`CLIENT`/`OSORI`/`SERVER`) + 활성화 박스. 번호 메시지 4개: `1: checkAuth(userId, url)` → `2: return ok` → `3: request()` → `4: response()`. 권한 검사가 실제 요청 **앞에** 별도 참여자로 | 에이전트 [봄] |
| TOSS-GW | 박스-화살표(발표 장표 "유저 / User Resolving") | `App --Key--> Gateway --Key--> Auth`, `Auth --Passport--> Gateway`, `Gateway --Passport--> Service --Passport--> Service`. 앱은 Key만, Passport는 Gateway가 받아 하위로 전파 | 에이전트 [봄] |
| TOSS-ZT | 번호 붙인 3단계 그림 | `1. Application access` / `2. Authentication`(사용자→`IAM`, Touch ID) / `3. Access`. IAM 위에 빨간 글씨 검사 항목 `Role, Trust Network, UEM Asset Check, EPP Process & Compliance Check`, IAM→리소스 구간 라벨 `SAML or OIDC`, 오른쪽에 SaaS/On-Premise/Public Cloud | 에이전트 [봄] |

→ 인증 흐름은 **시퀀스로 그린다**는 데 출처가 일치한다. 다만 표준(RFC)의 그림은 lifeline 없는 참여자 상자 + 문자 라벨이고, 벤더(Auth0)만 UML 시퀀스로 부른다. **신뢰 경계는 어느 인증 그림에도 그려져 있지 않다** — 경계 개념은 위협 모델링 문서에만 있다.

**필수요소 후보**

| 후보 | 근거 인용 | 값 3종 |
|---|---|---|
| ① 참여자와 발급·검증 주체 | 네 역할과 (A)~(F) [RFC6749 Fig.1] / "the resource server is then supposed to verify the intended audience. If the access token fails the intended audience validation, the resource server refuses to serve the respective request." [RFC9700 §4.10.2] / "앱에서 유저 식별키와 함께 API를 요청하게 되면 Gateway에서 이 키를 토대로 인증 서버에 Passport를 요청합니다." · "Gateway는 이를 serialize 하여 서비스에 전파합니다." [TOSS-GW §유저 Passport] | 실제 값 / — / 확인 못 함 |
| ② 자격 증명 종류와 전달 방식 | "the client uses the 'Bearer' authentication scheme to transmit the access token" + `Authorization: Bearer mF_9.B5f-4.1JqM` [RFC6750 §2.1]; 본문·쿼리 전달은 §2.2·§2.3 / JWT면 클레임 집합 [RFC7519 §4.1] | 실제 값 / — / 확인 못 함 |
| ③ 수명(토큰 `exp`·세션 idle/absolute) | "The 'exp' (expiration time) claim identifies the expiration time on or after which the JWT MUST NOT be accepted for processing." [RFC7519 §4.1.4] / "All sessions should implement an idle or inactivity timeout" · "All sessions should implement an absolute timeout, regardless of session activity" · "Common idle timeouts ranges are 2-5 minutes for high-value applications and 15-30 minutes for low risk applications" [OWASP-SESSION §Session Expiration] / AAL2 12시간·30분 [NIST-63B §7.2] | 실제 값 / 없음 확인(무기한 토큰 = 위험이 드러난 값) / 확인 못 함 |
| ④ 갱신·재인증 시점 | "Refresh tokens … are used to obtain a new access token when the current access token becomes invalid or expires" [RFC6749 §1.5] / "Refresh tokens for public clients MUST be sender-constrained or use refresh token rotation" [RFC9700 §2.2.2] / "The session ID must be renewed or regenerated by the web application after any privilege level change" [OWASP-SESSION] / `max_age` = "allowable elapsed time in seconds since the last time the End-User was actively authenticated", `prompt=login` [OIDC §3.1.2.1] | 실제 값 / 없음 확인(갱신 없음 = 만료 시 재로그인) / 확인 못 함 |
| ⑤ 만료·거부 응답과 그 뒤 흐름 | `invalid_token`: "The access token provided is expired, revoked, malformed, or invalid … SHOULD respond with the HTTP 401 (Unauthorized) status code"; `insufficient_scope`: "The request requires higher privileges than provided by the access token … HTTP 403 (Forbidden)" [RFC6750 §3.1] / "401 (Unauthorized) … lacks valid authentication credentials"; "403 (Forbidden) … understood the request but refuses to fulfill it" [RFC9110 §15.5.2·§15.5.4] | 실제 값 / — / 확인 못 함 |
| ⑥ 권한 검사 지점과 규칙 | "Access control checks must be performed server-side, at the gateway, or using serverless function." · "an application should be configured to deny access by default." · "Perform access control checks on _every_ request for the _specific_ object"(IDOR) [OWASP-AUTHZ] / "the resource server MUST verify, for every request, whether the access token sent with that request was meant to be used for that particular resource server" [RFC9700 §4.10.2] / "Permission must be checked prior to checking if the resource or parent exists."(없으면 `PERMISSION_DENIED`/403) [AIP-193] / "서버에 요청을 보내기전에 먼저 Osori에 유저ID와 접근할 URL을 파라미터로 전송" [WOOWA-OSORI §동작방식] / "복호화 과정에서 인증 / 인가 로직이 처리되고 복호화 된 데이터와 유저 정보를 서비스로 넘겨주게 됩니다." [TOSS-GW] | 실제 값 / 없음 확인(검사 없음) / 확인 못 함 |
| ⑦ 신뢰 경계 | "The privilege boundary (or trust boundary) shape is used to represent the change of trust levels as the data flows through the application." · "Boundaries show any location where the level of trust changes." · 진입점은 "the interfaces through which potential attackers can interact with the application" [OWASP-TM] / 경계마다 무엇을 보는지의 실물: "Role이 있는 사용자라도 EPP와 연계하여 접근할 때마다 Device 보안성 검증" · "신뢰된 Network 인지, 회사 자산인지, Device의 보안 수준은 준수되는지를 검증을 추가로" [TOSS-ZT] | 실제 값 / 없음 확인(한 경계 안) / 확인 못 함 |

**현재 값 판정**

| 항목 | 출처 표기 | 판정 | 근거 |
|---|---|---|---|
| 그림 종류 "시퀀스 변형" | 9/5표(둘째 버전) | **수정** → 시퀀스 + 신뢰 경계 | 출처가 그린 건 전부 시간순 메시지 그림이고, 시퀀스에 없는 요소는 신뢰 경계뿐이다(UML 기호 목록에 없음 [UML251 Table 17.1]). 인가를 활성화 박스까지 갖춘 UML 시퀀스로 그린 국내 실물이 있다[WOOWA-OSORI 봄]. "변형"의 내용을 이렇게 채운다(추론). |
| 토큰 수명 | 9/5표 | **유지+보강** → 토큰 `exp`와 세션 수명 | RFC7519 `exp`, OWASP idle/absolute, NIST 12시간/30분. 세션 기반 인증에도 값이 있어야 해서 이름을 넓힌다. |
| 갱신 시점 | 9/5표(둘째 버전) | **유지+보강** → 갱신·재인증 시점 | 리프레시(RFC6749 Fig.2)뿐 아니라 권한 상승 시 세션 재발급[OWASP-SESSION], `max_age`·`prompt=login`[OIDC]. |
| 만료 처리 | 9/5표 | **유지+보강** → 만료·거부 응답(401·403)과 그 뒤 흐름 | RFC6750의 오류 3종이 상태 코드까지 정해 준다. "처리"만으로는 값이 안 나온다(추론). |
| 신뢰 경계 | 9/5표(둘째 버전) | **유지** | OWASP 정의를 그대로 쓴다. |
| (없음) | — | **추가** ① 참여자와 발급·검증 주체 | OAuth 네 역할이 모든 그림의 뼈대다. |
| (없음) | — | **추가** ② 자격 증명 종류와 전달 방식 | Bearer/JWT/세션 쿠키 중 무엇인지에 따라 나머지 값이 달라진다. |
| (없음) | — | **추가** ⑥ 권한 검사 지점과 규칙 | 인가(누가 무엇을 할 수 있나)를 이 행에 넣는 근거. 단 §4-5 참조. |

### 2.3 API 계약

**질문 후보**
- 계약이 무엇을 담나: Operation Object의 `requestBody`("The request body applicable for this operation")와 `responses`("The list of possible responses as they are returned from executing this operation") [OAS31 §4.8.10]
- 에러도 계약인가: "DO document the service's top-level error code strings; they are part of the API contract" [AZURE-GUIDE]
- 무엇을 바꾸면 깨지나: 금지 목록 [AIP-180]
- 예시가 필요한가: Pact는 "contract by example"이며 "a collection of test cases, each of which describes a single concrete request/response pair" [PACT] / PRD 스토리 24 "API 계약 그림에 실제 요청/응답 페이로드가 있기를"

**출처의 그림**

| 출처 | 그림 종류 | 그려진 요소 | 확인 |
|---|---|---|---|
| OAS31 | **그림 없음** | 객체 구조만(Operation·RequestBody·Responses·Response·Example·Server·Security Requirement·Info) | 본문 |
| ASYNCAPI | **그림 표기 없음** | info / servers / channels / operations(`send`·`receive`) / components. "The provided documentation contains no reference to any diagram notation system defined by AsyncAPI." | 본문 (요약) |
| PACT | 그림은 외부 애니메이션 링크뿐, 자체 표기 없음 | 소비자 테스트가 계약 생성 → 제공자가 검증 | 본문 (요약) |
| UML251 §10.4.4 | 인터페이스 기호 | "representing the Interface by a circle or ball, often also called lollipop, labeled with the name of the Interface, attached by a solid line to the BehavioredClassifier that realizes this Interface" / 필요 쪽은 "a half-circle or socket" | [alt] |
| AZ-APIDESIGN | 표·코드 블록 | 메서드×리소스 표, 상태 코드 표, 버전 4방식의 요청/응답 예시 | 본문 |
| TOSSPAY-API | 그림 없음 | 에러 응답 실물 `{"code": "INVALID_CARD_COMPANY", "message": "유효하지 않은 카드사입니다."}`, 경로 버저닝 실물 `https://api.tosspayments.com/v1/payments/{paymentKey}`, 헤더 `TossPayments-api-security-mode: ENCRYPTION` | 에이전트 |
| KAKAOPAY-OAS | 그림 없음(OAS 산출물) | `openapi: 3.0.1` + `info.version` + `paths./api/v1/samples/{sampleId}.get.responses.'200'.content.application/json.examples` | 에이전트 |
| KURLY-RESTDOCS | 그림 없음 | 문서 누락 감시 대상 3종(추가 필드·응답값·상태값) | 에이전트 |

→ **"계약 다이어그램"이라는 표준 표기는 없다.** 국내 사례도 마찬가지다 — 계약을 그림으로 그린 글은 없고 전부 **문서 산출물(OAS·스니펫)과 페이로드 예시**로 다룬다. 계약을 다루는 명세들은 전부 텍스트 문서 형식이고, 표준 표기로 가장 가까운 것은 UML의 제공/필요 인터페이스(lollipop/socket)인데 이것은 **누가 무엇을 제공·필요로 하는지**만 보이고 페이로드·에러·버전은 담지 못한다(추론).

**필수요소 후보**

| 후보 | 근거 인용 | 값 3종 |
|---|---|---|
| ① 엔드포인트·오퍼레이션 식별 | `operationId` "Unique string used to identify the operation." [OAS31 §4.8.10] / 비동기면 channel + operation의 `action`(`send`/`receive`) [ASYNCAPI] / PRD 스토리 5 "박스 라벨이 `POST /auth/token`" | 실제 값 / — / 확인 못 함 |
| ② 실제 요청 페이로드 | RequestBody `content` "REQUIRED. The content of the request body."; Example Object `value` "Embedded literal example." [OAS31 §4.8.13·§4.8.19] / Pact "contract by example" [PACT] / PRD 스토리 24 | 실제 값 / 없음 확인(본문 없음) / 확인 못 함 |
| ③ 실제 응답 페이로드와 상태 코드 | Responses Object는 상태 코드를 키로 쓰고 `default`는 "The documentation of responses other than the ones declared for specific HTTP response codes." [OAS31 §4.8.16] / 메서드별 상태 코드 표 [AZ-APIDESIGN] / **빠지면 드러나는 것**: "API가 변경되며 누락된 부분(추가 필드, 응답값, 상태값)을 API 문서 생성과정에서 즉각적으로 확인할 수 있습니다." [KURLY-RESTDOCS §"Spring REST Docs"가 테스트를 강제하는 이유] | 실제 값 / 없음 확인(204) / 확인 못 함 |
| ④ 에러 코드와 에러 본문 형식 | "DO document the service's top-level error code strings; they are part of the API contract"; ErrorDetail은 `code`·`message` 필수 [AZURE-GUIDE] / 문제 유형 정의는 "(1) a type URI …, (2) a title …, (3) the HTTP status code for it to be used with" [RFC9457] / "All error responses must include an `ErrorInfo` within `details`." [AIP-193] / 같은 2필드 분리를 국내도 쓴다: "가맹점은 message를 그대로 노출하거나, code를 기준으로 자체 메시지를 보여줄 수 있습니다." [TOSSPAY-API §오류 처리: 투명하고 유연하게] / 상태 코드 고르는 규칙: "결국 '4xx인가, 5xx인가'는 오류 책임이 클라이언트냐 서버냐를 구분하는 기준입니다." · "비즈니스 예외: '최소 주문 금액 미달'과 같이 클라이언트의 입력이나 조건이 맞지 않을 때는 `400 Bad Request` 응답" [WOOWA-4XX] | 실제 값 / 없음 확인 / 확인 못 함 |
| ⑤ 버전 정책과 호환성 규칙 | 4방식(URI·쿼리·헤더·미디어 타입)과 각각의 대가 [AZ-APIDESIGN §Implement versioning] / "use `YYYY-MM-DD` date values, with a `-preview` suffix" [AZURE-GUIDE] / "Google APIs must not expose minor or patch version numbers." [AIP-185] / "Each monthly release includes only backward-compatible changes… The current version is 2026-08-26.dahlia." + `Stripe-Version` 헤더 [STRIPE-VER] / 깨지는 변경 목록: 제거·개명·타입 변경·기본값 변경·"APIs must not change visible behavior or semantics in ways that are likely to break reasonable user code" [AIP-180] / "API에 버전을 부여해, 각 버전을 완전히 독립된 API처럼 관리합니다." [TOSSPAY-API §7️⃣ API 버저닝] | 실제 값 / 없음 확인(버전 없음) / 확인 못 함 |
| ⑥ 필요한 인증·스코프 | Security Requirement Object: "Only one of the security requirement objects need to be satisfied to authorize a request." [OAS31 §4.8.30] / 부족하면 403 `insufficient_scope` [RFC6750 §3.1] | 실제 값 / 없음 확인(공개 API) / 확인 못 함 |
| ⑦ 멱등·재시도 계약 | "The resource MAY require time based idempotency keys … The resource SHOULD define such expiration policy and publish it in the documentation." + 같은 키 다른 페이로드는 422, 진행 중 재시도는 409 [IDEMKEY] / "All `POST` requests accept idempotency keys." · 키는 24시간 뒤 삭제 가능 [STRIPE-IDEM] / "PUT requests must be *idempotent*" [AZ-APIDESIGN] | 실제 값 / 없음 확인(멱등키 없음) / 확인 못 함 |

**현재 값 판정**

| 항목 | 출처 표기 | 판정 | 근거 |
|---|---|---|---|
| 그림 종류 "계약 다이어그램" | 9/5표(둘째 버전) | **수정** → 표준 표기 없음, 캔버스 근사형 | OpenAPI·AsyncAPI·Pact 어디에도 다이어그램 표기가 없다. 가장 가까운 표준은 UML lollipop/socket이지만 담는 정보가 다르다. |
| 실제 요청/응답 페이로드 | PRD 스토리 24 | **유지** | OAS Example Object, Pact "contract by example". 국내도 예시를 계약의 몸통으로 쓴다(카카오페이 OAS `examples`, 토스페이먼츠 에러 본문 실물). 협의 중 어긋남을 잡는 장치도 예시 비교다: "실제 응답 값과 목 데이터를 비교하며 협의가 이뤄진 API 스펙에서 틀린 부분" [WOOWA-MOCK]. |
| 에러 코드 | 9/5표(둘째 버전) | **유지+보강** → 에러 코드와 에러 본문 형식 | Azure는 에러 코드를 계약이라고 못박고, RFC9457·AIP-193은 본문 형식까지 요구한다. |
| 버전 정책 | 9/5표(둘째 버전) | **유지+보강** → 버전 정책과 호환성 규칙 | 정책(어디에 버전을 싣나)과 규칙(무엇이 깨지는 변경인가)이 다른 값이다 [AIP-180]. |
| (없음) | — | **추가** ① 엔드포인트·오퍼레이션 식별 | 계약 그림이 어느 오퍼레이션의 계약인지 없으면 값이 붙을 자리가 없다(추론 + `operationId`). |
| (없음) | — | **추가** ⑥ 필요한 인증·스코프 | OAS가 오퍼레이션 단위로 요구한다. 흐름은 인증·권한 행. |
| (없음) | — | **추가** ⑦ 멱등·재시도 계약 | IETF 초안이 "문서에 공표하라"고 요구한다. 재시도·분기 행의 ⑥과 같은 사실의 계약 쪽 얼굴이다. |
| 근거 태그 | 메모 | (판정 아님) | 협의 중 계약은 `설계` 태그 + 실선 + 새 색 [review.md R09 "대화 중 사용"]. 필수요소 항목이 아니다. |

### 2.4 재시도·분기

**질문 후보**
- 무엇을 다시 하나: 3분류 — "**Cancel**. If the fault indicates that the failure isn't transient…", "**Retry immediately**…", "**Retry after delay**…" [AZ-RETRY §Retry strategies]
- 몇 번·얼마 간격: `IntervalSeconds`·`MaxAttempts`·`BackoffRate`·`MaxDelaySeconds`·`JitterStrategy` [AWS-SFN §Retrying after an error]
- 포기하면 어디로: "When a state reports an error and either there is no `Retry` field, or if retries fail to resolve the error, Step Functions scans through the catchers … the state machine transitions to the state named in the `Next` field." [AWS-SFN §Fallback states]

**출처의 그림**

| 출처 | 그림 종류 | 그려진 요소 | 확인 |
|---|---|---|---|
| AZ-CB | **상태도** | 둥근 사각형 3개(Closed / Half-Open / Open), 각 상자 안에 `entry /`·`do /`·`exit /` 칸(예: Closed의 `entry / reset failure counter`, `do / if operation succeeds return result else increment failure counter return failure`). 전이 라벨 4개: Failure threshold reached(Closed→Open), Timeout timer expired(Open→Half-Open), Success count threshold reached(Half-Open→Closed), Operation failed(Half-Open→Open) | [봄] |
| AZ-RETRY | 시도 나열 메시지 그림 | Application ↔ Hosted service, 500·500·200 | [봄] |
| AWS-SFN | 그림 없음(상태 기계 정의 JSON) | `Retry` 배열 = retrier, `Catch` 배열 = catcher, `Next`로 fallback 상태 이동 | 본문 |
| AWS-SQSDLQ | 그림 없음 | redrive policy·`maxReceiveCount`·redrive allow policy | 본문 |
| GRPC-A6 / AWS-SDKRETRY / TEMPORAL-RETRY | 그림 없음, 파라미터 표 | maxAttempts·initialBackoff·maxBackoff·backoffMultiplier·retryableStatusCodes / 모드 3종·토큰 버킷 / Initial Interval·Backoff Coefficient·Maximum Interval·Maximum Attempts | 본문 |
| WOOWA-CB | **상태 전이도** | 둥근 사각형 3개(`CLOSED`·`OPEN`·`HALF_OPEN`), 전이 4개에 조건 라벨 `[failure rate above a threshold]`, `[after wait duration]`, `[failure rate below a threshold]`, `[failure rate above a threshold]`. **본문에만 있는 `DISABLED`·`FORCED_OPEN` 2상태는 그림에 없음** | 에이전트 [봄] |
| KURLY-RETRY | **플로우차트**(캡션 "Spring Kafka의 RetryableTopic이 적용된 컨슘 흐름도") | 스윔레인 2개(메인 토픽 / 재시도 토픽). `카프카 메시지 컨슘`→`입고 예정 정보 생성`→마름모 `성공`→N이면 재시도 레인으로. 재시도 레인에 설정값이 글자로 박힘(`backoff=10분`, `attampts=145회`), 마름모 `메시지가 발행된지 10분이 지났는가?`(대기 루프)와 `현재 시도 횟수가 145회 미만?`, N이면 `데드레터 발행`→`종료`. **성공 종료·데드레터 종료 두 경로를 다 그림** | 에이전트 [봄] |
| WOOWA-TASKQ | **시퀀스**(캡션 "실패 & 재시도 시나리오") | lifeline 3개(`Worker`/`DB`/`Worker2`). `작업 선점 (IN_PROGRESS)`→`update Heartbeat`→노트 `⚠️ 작업 실패`→`retry_count += 1`→`상태 변경 (PENDING)`→`Worker2 작업 선점`→노트 `✅ 작업 성공`→`작업 완료 (DONE)`. 재시도를 **다른 워커가 집어간다**는 것까지 | 에이전트 [봄] |

→ **상태도로 그려진 것은 서킷브레이커다**(Azure·우아한형제들 둘 다). 재시도 자체를 그린 그림은 Azure가 시도 3번의 시간 나열, 컬리가 플로우차트, 우아한형제들이 시퀀스다(§4-1).

**필수요소 후보**

| 후보 | 근거 인용 | 값 3종 |
|---|---|---|
| ① 재시도 대상 조건 | 3분류 [AZ-RETRY §Retry strategies] / 분류 표: transient(`RequestTimeout`, 5xx…) 50ms, throttling(`ThrottlingException`…) 1,000ms, "Non-retryable errors (such as `AccessDeniedException`, `ValidationException`, `ResourceNotFoundException`) are returned to your code immediately." [AWS-SDKRETRY §Which errors are retried] / `retryableStatusCodes` "must be non-empty" [GRPC-A6] / 비재시도 오류 유형 [TEMPORAL-RETRY] / `ErrorEquals` [AWS-SFN] | 실제 값 / 없음 확인(전부 재시도 안 함) / 확인 못 함 |
| ② 백오프(초기·배수·상한·지터) | `delay = random(0, 1) × min(20,000 ms, base_delay × 2^retry)` [AWS-SDKRETRY §Backoff formula] / "The initial retry attempt will occur after `initialBackoff * random(0.8, 1.2)`…" [GRPC-A6] / `sleep = random(0, min(cap, base * 2 ** attempt))` = Full Jitter, "Full Jitter" 가 총 작업량이 가장 적고 무지터 지수 백오프는 "the clear loser" [AWS-JITTER] / `IntervalSeconds`·`BackoffRate`·`MaxDelaySeconds`·`JitterStrategy`(FULL/NONE, 기본 NONE) [AWS-SFN] / 기본값 Initial Interval 1초·Backoff Coefficient 2.0·Maximum Interval 100×Initial [TEMPORAL-RETRY] / 국내 실제 값: 아웃박스 `max-retries: 3`·`initial-delay: 2000`·`max-delay: 60000`·`multiplier: 2.0`, 재시도 토픽 `backoff = 600000L`(10분) [KURLY-RETRY §아웃박스 패턴·재시도 토픽] / PRD 스토리 21 | 실제 값 / 없음 확인(즉시 재시도) / 확인 못 함 |
| ③ 최대 횟수와 계층 중복 | `MaxAttempts` 기본 3 [AWS-SFN] / `max_attempts` 기본 3 = "one initial request and up to two retries" [AWS-SDKRETRY] / `maxAttempts` "must be two or greater" [GRPC-A6] / Maximum Attempts 기본 ∞ [TEMPORAL-RETRY] / "Limit retries per request. Don't retry a given request indefinitely." · "Avoid amplifying retries by issuing retries at multiple levels: a single request at the highest layer may produce a number of attempts as large as the _product_ of the number of attempts at each layer."(3계층×4시도 = 64) [SRE-CASCADE] / 국내 실제 값: `attempts = "145"`(10분 간격 ≈ 24시간) [KURLY-RETRY], 최대 재시도 3회 [WOOWA-TASKQ §재시도 처리] | 실제 값 / 없음 확인(재시도 없음) / 확인 못 함 |
| ④ 포기 후 경로 | catcher의 `Next` [AWS-SFN §Fallback states] / "`maxReceiveCount` is the number of times a consumer can receive a message from a source queue before it is moved to a dead-letter queue." + "always set the retention period of a dead-letter queue to be longer than the retention period of the original queue" [AWS-SQSDLQ] / Open 상태에서 "rather than returning a failure and raising an exception, the **Open** state can return a default value" [AZ-CB] / "Sometimes manual intervention is the only way to recover"(saga 조사 §2.1 인용, [AZ-COMP]) / 국내: `@DltHandler`로 데드레터 수신, 그림에 `데드레터 발행`→`종료` 경로 [KURLY-RETRY 봄] / "3회 미만 - PENDING으로 되돌려 재시도" · "3회 이상 - 최종 실패 처리" [WOOWA-TASKQ] / 사람이 다시 쏘는 경로: "개발자센터에서 웹훅 전송 내역 조회와 수동 재전송 기능을 제공" [TOSSPAY-API §4️⃣ 안정적인 재전송] | 실제 값 / 없음 확인(그냥 에러 반환) / 확인 못 함 |
| ⑤ 차단 장치(서킷브레이커·재시도 예산·스로틀) | "You can implement the proxy as a state machine that includes the following states" + Closed/Open/Half-Open 정의와 임계값·타이머 [AZ-CB §Solution] / 토큰 버킷: 용량 500, 일시 오류 재시도 14토큰, 스로틀 재시도 5토큰, 성공 시 복구 [AWS-SDKRETRY §Retry quota] / "Every failed RPC will decrement the token_count by 1 … If token_count is less than or equal to maxTokens / 2, then RPCs will not be retried." [GRPC-A6] / "a server-wide retry budget. For example, only allow 60 retries per minute" [SRE-CASCADE] / 클라이언트 스로틀 K=2, 과부하 시 "overloaded; don't retry" [SRE-OVERLOAD] / 토큰 버킷 vs 서킷브레이커 비교 [BROOKER] / 국내 실제 값: `failure-rate-threshold=50`, `wait-duration-in-open-state=10s`, `sliding-window-size=10`(COUNT_BASED) [WOOWA-CB] | 실제 값 / 없음 확인(차단 장치 없음 = 위험이 드러난 값) / 확인 못 함 |
| ⑥ 재시도 안전성(멱등) — 아래 판정표 참조 | "동일한 요청을 여러 번 보내도 같은 응답을 줄 수 있으면 해당 API는 멱등성이 있다고 표현합니다." · "한 번 성공, 실패가 되었다면 동일한 결제 요청이 이후 여러 번 와도 같은 응답을 준다." [KAKAOPAY-MSA §멱등성 API] / "Kafka 리스너에서 멱등성을 보장할 수 있는 설계가 미리 마련되어야 합니다." [KURLY-RETRY] / 중복 실행 방지 수단: "Redis 분산 락을 이용해 선점함으로써, 여러 Worker 간의 중복 처리를 방지" [WOOWA-TASKQ] | 실제 값 / 없음 확인(비멱등) / 확인 못 함 |
| ⑥ 재시도 안전성(멱등) | "Consider whether the operation is idempotent. If so, it's inherently safe to retry. Otherwise, retries could cause the operation to be executed more than once, with unintended side effects." [AZ-RETRY §Idempotency] / "By definition, GET, HEAD, PUT, and DELETE methods are idempotent, whereas POST is not." [RFC9110 §9.2.2] / 커밋된 스트림은 재시도 불가 [GRPC-A6] | 실제 값 / 없음 확인(비멱등) / 확인 못 함 |

넣지 않은 것:
- **로깅 규칙.** "log early failures as *informational entries* and only the failure of the last of the retry attempts as an actual error" [AZ-RETRY] — 그리기 항목이 아니라 구현 지침이다(추론).
- **서버가 지시하는 지연**(`Retry-After`, `x-amz-retry-after`) [RFC9110 §10.2.3, AWS-SDKRETRY]. ②의 값 중 하나로 적는다.

**현재 값 판정**

| 항목 | 출처 표기 | 판정 | 근거 |
|---|---|---|---|
| 그림 종류 = 상태도 | PRD(9/5 플로우차트 폐기) | (판정 안 함 — 확정) | 다만 출처는 갈린다(§4-1). |
| 조건 | 9/5표(둘째 버전) | **유지+보강** → 재시도 대상 조건(재시도 vs 즉시 실패, 타임아웃 포함) | 출처 넷이 전부 "어떤 실패를 재시도하나"를 먼저 정의한다. |
| 백오프 간격 | 9/5표·PRD 스토리 21 | **유지+보강** → 초기 간격·배수·상한·지터 | 간격 하나로는 값이 안 된다. 네 출처가 모두 4개 파라미터를 쓴다. 지터는 AWS가 이름까지 붙였다. |
| 최대 횟수 | 9/5표·PRD 스토리 21 | **유지+보강** → 최대 횟수와 계층 중복 여부 | SRE의 곱셈 경고. 한 계층의 횟수만 그리면 실제 시도 수를 못 읽는다. |
| DLQ | 9/5표(둘째 버전) | **수정** → 포기 후 경로(폴백 응답·DLQ·수동) | DLQ는 큐 기반일 때의 한 값이다. 동기 호출이면 폴백 응답·에러 반환이 그 자리다 [AZ-CB]. 국내 그림들은 **종료 경로를 둘 이상 그린다**(컬리: 성공 종료·데드레터 종료 [봄]). 수동 재전송도 실제 경로다 [TOSSPAY-API]. |
| (없음) | — | **추가** ⑤ 차단 장치 | 재시도만 그린 그림은 과부하 증폭을 못 보여 준다 [SRE-CASCADE, SRE-OVERLOAD]. 서킷브레이커는 같은 상태도 위에 그릴 수 있다 [AZ-CB 봄, WOOWA-CB 봄]. |
| (없음) | — | **추가** ⑥ 재시도 안전성(멱등) | Azure가 재시도의 전제로 명시하고, 국내 결제·입고 사례가 둘 다 멱등을 선결 조건으로 적는다 [KAKAOPAY-MSA, KURLY-RETRY]. |

### 2.5 엔티티 생명주기

**질문 후보**
- "Which states exist, what events move between them, and how does it end?" [ARCHIFY `object-lifecycle`]
- 무엇이 상태를 바꾸나: 전이 라벨 BNF `[<trigger> [‘,’ <trigger>]* [‘[‘ <guard>’]’] [‘/’ <behavior-expression>]]` [UML251 §14.2.4.8]
- 어떻게 끝나나: "never hide an ending" [ARCHIFY] / "`Succeeded` and `Failed` are terminal phases—Pods do not transition out of these states." [K8S-POD]

**출처의 그림**

| 출처 | 그림 종류 | 그려진 요소 | 확인 |
|---|---|---|---|
| AWS-EC2LC | **상태도** | 둥근 사각형 6개(pending·running·stopping·stopped·shutting-down·terminated) + 시작 아이콘. 화살표 라벨: Launch, Reboot(running의 자기 전이), Stop or hibernate, Start, Terminate(pending·running·stopping·stopped 넷에서 각각). `terminated`는 나가는 화살표가 없다. 파란 점선 상자로 "EBS-backed instances only" 영역 표시 | [봄] |
| AZ-CB | 상태도 | Closed/Half-Open/Open + `entry/do/exit` 칸(§2.4) | [봄] |
| K8S-POD | 표(상태도 없음) | Pending·Running·Succeeded·Failed·Unknown + 컨테이너 상태 Waiting·Running·Terminated | 본문 |
| STRIPE-LC | 표 | requires_payment_method · requires_confirmation · requires_action · processing · succeeded · canceled. 실패 시 "the PaymentIntent's status returns to `requires_payment_method` so that the payment can be retried", 취소는 "can't be undone" | 본문 (그림 확인 실패 §4-12) |
| UML251 §14.2.4 | 표기 정의 | "State is shown as a rectangle with rounded corners"; "A FinalState is shown as a circle surrounding a small solid filled circle"; "An initial Pseudostate is shown as a small solid filled circle"; "A choice Pseudostate is shown as a diamond-shaped symbol"; 상태 칸은 name/internal Behaviors/internal Transitions | [alt] |
| WOOWA-SM(범례 그림) | 상태도 문법 자체를 그린 범례 | `state`(회색 원) —`event`(검은 역삼각형)— transition(선) — `guard`(마름모) — `action`(사각형) → `state`. **가드와 액션을 전이 위에 별도 도형으로 분리** | 에이전트 [봄] |
| WOOWA-SM(배송 상태도) | 상태도 | 상태 7개(`유휴`·`픽업지로 이동 중`·`물품 적재 대기`·`물품 적재 중`·`전달지로 이동 중`·`물품 전달 대기`·`물품 전달 중`), 이벤트 역삼각형(`로봇이 배차됨`·`로봇이 도착함`·`로봇 적재함 열림/닫힘`·`물품 적재 완료됨`·`물품 전달 완료됨`), 가드 마름모 `적재함이 닫혔나?` 2곳, 액션 사각형 `로봇에게 이동 명령`. **종료 상태 없음 — `유휴`로 돌아오는 닫힌 순환** | 에이전트 [봄] |
| WOOWA-TASKQ | 시퀀스 3장(상태도 아님) | 상태 4개(`PENDING`·`IN_PROGRESS`·`DONE`·`FAILED`)와 전이 5개를 본문으로 열거. 같은 전이 `IN_PROGRESS→PENDING`에 트리거가 둘(재시도 / heartbeat 타임아웃 복구) | 에이전트 [봄] |

→ 생명주기를 그린 출처는 전부 상태도이고, **모든 전이에 라벨이 붙어 있다**. 종료 상태는 나가는 화살표가 없는 것으로 표현된다(EC2 `terminated` [봄]). 예외가 하나 있다 — 순환형 생명주기는 종료 상태가 아예 없다(WOOWA-SM [봄], §4-14).

**필수요소 후보**

| 후보 | 근거 인용 | 값 3종 |
|---|---|---|
| ① 시작·진행 상태 | "An initial Pseudostate is shown as a small solid filled circle … In a Region of a ClassifierBehavior StateMachine, the Transition from an initial Pseudostate may be labeled with the Event type of the occurrence that creates the object" [UML251 §14.2.4.6] / include "start and active states" [ARCHIFY] / EC2 `pending`은 "preparing to enter the `running` state" [AWS-EC2LC] | 실제 값 / — / 확인 못 함 |
| ② 전이 트리거와 조건 | 라벨 BNF `트리거 [가드] / 동작` [UML251 §14.2.4.8] / include "event-labelled transitions" [ARCHIFY] / EC2 화살표 라벨 [봄] / "A **transition** is a change from one finite state to another, triggered by an event." [XSTATE] / 가드를 그림에 별도 도형으로 그린다: "guard: event가 발생했을 때 그에 따른 transition을 실행할지를 판단하는 로직" + 마름모 `적재함이 닫혔나?` [WOOWA-SM 봄] / 같은 전이에 트리거가 둘일 수 있다(재시도 / heartbeat 타임아웃 복구) [WOOWA-TASKQ] | 실제 값 / — / 확인 못 함 |
| ③ 대기·재시도 상태 | include "wait and retry states" [ARCHIFY] / Stripe `processing`("can take up to a few days")·`requires_action` [STRIPE-LC] / EC2 `stopping`·`stopped` [AWS-EC2LC] / `물품 적재 대기`·`물품 전달 대기` [WOOWA-SM 봄] | 실제 값 / 없음 확인(대기 상태 없음) / 확인 못 함 |
| ④ 모든 종료 상태 | "A FinalState is shown as a circle surrounding a small solid filled circle." [UML251 §14.2.4.5] / include "all terminal outcomes", "never hide an ending" [ARCHIFY] / "`Succeeded` and `Failed` are terminal phases" [K8S-POD] / `DONE`·`FAILED` 둘 [WOOWA-TASKQ] / **반례**: 순환형은 종료 상태가 없다 [WOOWA-SM 봄] | 실제 값 / **없음 확인(순환형)** / 확인 못 함 |
| ⑤ 되돌릴 수 없는 전이·복귀 불가 표시 | "The instance has been permanently deleted and cannot be started." [AWS-EC2LC `terminated`] / "Cancellation invalidates the PaymentIntent for future payment attempts, releases any held funds, and can't be undone." [STRIPE-LC] / 그리지 않은 전이는 일어나지 않는다: 발화 집합은 "All Transitions in the set are enabled" 인 것들뿐이다 [UML251 §14.2.3.9.5] / 모델 장치로서의 금지 전이: "A **forbidden transition** is a transition that is explicitly defined but has no target or actions … prevents a parent state's transition from being selected for a specific event." [XSTATE] / 정의되지 않은 전이를 **조용히 무시**한다: "만약 이때 state machine의 현재 상태가 '유휴' 상태가 아니었다면 '로봇이 배차됨' 이벤트는 state machine에 아무런 변화도 일으키지 못합니다." [WOOWA-SM §Spring Statemachine 설정하기] | 실제 값 / 없음 확인(불가역 전이 없음) / 확인 못 함 |

넣지 않은 것:
- **상태 값의 실제 이름.** 관통 규칙 "진짜 이름"이 맡는다 [PRD §1].
- **상태 저장 위치(컬럼·enum).** 데이터 모델 행과 겹친다(추론).

**현재 값 판정**

| 항목 | 출처 표기 | 판정 | 근거 |
|---|---|---|---|
| 그림 종류 = 상태 다이어그램 | 9/5표 | **유지** | EC2·Azure CB가 같은 기호로 그렸다 [봄]. UML 14.2.4가 기호를 정의한다. |
| 전이 트리거 | 9/5표 | **유지+보강** → 전이 트리거와 조건(가드) | 라벨 BNF에 가드가 들어 있고, 가드가 없으면 같은 트리거의 두 전이를 구분 못 한다 [UML251 §14.2.3.9.3 Conflicting Transitions]. |
| 불가 전이 | 9/5표 | **수정** → 되돌릴 수 없는 전이·복귀 불가 표시 / **제거 후보** | 판단 4 참조. 그리라고 말한 1차 출처 없음. 국내 사례는 한 발 더 나간다 — 정의되지 않은 전이를 예외가 아니라 **no-op**으로 삼킨다[WOOWA-SM]. 즉 불가 전이는 "안 그린 것"이자 "안 정의한 것"이다. |
| 종료 상태 | 9/5표(둘째 버전) | **유지+단서** → 모든 종료 상태 | archify "never hide an ending", K8s terminal phases. 단 순환형 생명주기에는 종료가 없어 "없음 확인"이 정당한 값이다[WOOWA-SM 봄](§4-14). |
| 시작·진행 상태 | archify | **유지** | UML initial Pseudostate. |
| 대기·재시도 상태 | archify | **유지** | Stripe `processing`·`requires_action`이 실제 예. |

## 3. 인접 행과의 겹침 (전부 추론)

| 행 × 행 | 같은 질문인가 | 처리 |
|---|---|---|
| API 동작 × 인증·권한 | 아니다. 시퀀스라는 그림 종류는 같지만 질문이 다르다(R09 확정: 행을 나누는 기준은 질문). | 인증이 답이 아니면 API 동작 그림엔 인증 서버를 참여자 하나로만 넣는다. 출처가 정면으로 갈린다(§4-2). |
| API 동작 × API 계약 | 아니다. 순서(누가 언제) vs 내용(무엇을 주고받나). | 페이로드가 쟁점이면 계약 행. API 동작 그림의 ② 요청·응답은 이름·주요 인자까지만 적고 전체 페이로드는 계약 그림으로 넘긴다. |
| API 동작 × 재시도·분기 | 아니다. 한 번의 흐름 vs 실패 후 정책. | API 동작 ⑥ 타임아웃 값과 ⑤의 재시도는 재시도·분기 행의 ①~③을 가리킨다(saga 조사가 saga→재시도 행을 가리킨 것과 같은 방식). |
| API 동작 × 성능 병목(운영 묶음) | 부분 겹침. 새로 넣은 ⑥ 타임아웃·마감은 구간별 레이턴시와 이웃한다. | 시간이 얼마나 걸리나가 질문이면 성능 병목 행. 여기서는 "언제 포기하나"의 값만 적는다. 02에서 다시 본다. |
| API 동작 × 큐·배치 파이프라인(비동기 묶음) | 아니다. ⑤ 비동기 후속은 "이 요청 하나가 어디로 이어지나"이고, 파이프라인 행은 처리량·백프레셔다. | 202 뒤의 큐가 주제면 파이프라인 행. |
| 인증·권한 × 시스템 개요(구조 묶음) | 부분 겹침. 시스템 개요 필수요소에 이미 "소유·신뢰 경계"가 있다(R09 5번 합친 결과). | 경계가 **어디**인지는 시스템 개요, 경계를 **넘을 때 무엇을 검사**하는지는 이 행. |
| 인증·권한 × API 계약 | 아니다. 계약은 "이 오퍼레이션에 어떤 스코프가 필요한가" 한 줄, 이 행은 발급·검증·만료의 흐름. | 계약 ⑥이 이 행을 가리킨다. |
| API 계약 × 데이터 모델(구조 묶음) | 아니다. 전송 스키마 vs 저장 스키마. | "Avoid creating APIs that mirror the internal structure of a database." [AZ-APIDESIGN]가 둘이 다르다는 근거다. |
| API 계약 × 이벤트 토폴로지(비동기 묶음) | 부분 겹침. 이벤트 메시지도 계약이다(AsyncAPI channels/operations/messages). | 토픽·구독자 지형이 질문이면 토폴로지 행, 메시지 한 종류의 모양이 질문이면 이 행. |
| 재시도·분기 × 엔티티 생명주기 | 아니다. 둘 다 상태도다. 재시도 행은 **한 호출의 정책**(간격·횟수·차단), 생명주기는 **엔티티의 상태 집합과 끝**. | 재시도 상태가 엔티티 상태 표에도 나오면(예: `processing`) 두 그림이 그 이름을 공유한다. |
| 재시도·분기 × 이벤트 토폴로지 | DLQ가 두 행에 나온다. | 컨슈머 전체의 DLQ 지형은 토폴로지 행, 한 호출·한 메시지의 포기 경로는 이 행. saga 조사 §3의 "재처리" 중복과 같은 처리(추론). |
| 재시도·분기 × saga | 확정된 경계 그대로. saga ②의 재시도 단계와 ④의 복구 경로가 이 행 값을 참조한다 [saga 조사 §1 판단 3]. | 보상이 없으면 이 행. |
| 엔티티 생명주기 × saga | saga 상태도의 종료 상태 규칙과 이 행 ④가 같은 규칙이다 [saga 조사 §3]. | 실패 복구가 질문이면 saga. |
| 엔티티 생명주기 × 이벤트 소싱 | 확정된 경계 그대로. 이벤트 이름이 곧 전이 트리거인 경우가 많다 [saga 조사 §3]. | 기록의 저장·복원이 질문이면 이벤트 소싱. |
| 엔티티 생명주기 × 마이그레이션(비동기 묶음) | 아니다. 단계별 전환은 계획의 시간축이고 이 행은 한 엔티티의 상태. | — |

## 4. 출처 간 충돌·불확실한 점·못 찾은 것

1. **재시도를 상태도로 그리나 — 출처가 넷으로 갈린다.** 상태도로 그린 것은 **서킷브레이커**뿐이다 [AZ-CB 봄, WOOWA-CB 봄]. 재시도 자체는 ① 시도 3번의 시간 나열 [AZ-RETRY 봄] ② 스윔레인 플로우차트(대기 루프·횟수 마름모·데드레터 종료) [KURLY-RETRY 봄] ③ 시퀀스(Worker/DB/Worker2, 실패 노트와 상태 변경) [WOOWA-TASKQ 봄] ④ 그림 없이 상태 기계 정의 언어(`Retry`/`Catch`/`Next`) [AWS-SFN]로 그려졌다. gRPC·AWS SDK·Temporal은 파라미터 표만 준다. 상태도 확정은 판정 대상이 아니므로 기록만 한다. (⑤ 차단 장치를 필수요소로 넣으면 상태도가 자연스러워진다 — 추론)
2. **인증 단계를 API 시퀀스에 그리나 — 정면 충돌.** archify는 그리라고 한다: "Include authentication, cache hit or miss, persistence fallback, return messages…" [ARCHIFY `api-request` prompt]. Azure는 빼라고 한다: "treat these identity and authorization controls as baseline implementation concerns rather than explicit flow steps. Keep the diagram focused on orchestration, retry, compensation, and failure handling." [AZ-COMP §Example, saga 조사 §2.1에서 확인된 인용]. Azure 문장은 보상 트랜잭션 그림에 대한 것이라 API 시퀀스에 그대로 적용되는지는 불확실하다. 경계 문장으로 처리하고 02에서 확인한다.
3. **점선의 의미가 세 갈래다.** UML: 점선 = **응답(reply) 메시지**, 비동기 = 열린 화살촉 [UML251 §17.4.4.1]. yctimlin 디자인 가이드: dashed = 비동기·이벤트 [review.md R05]. 우리 CONTEXT: 점선 = 확인되지 않은 선·값. 국내 실물도 UML 쪽이다 — 카카오페이 시퀀스는 요청을 실선, **오류 응답을 점선**으로 그렸다 [KAKAOPAY-HTTP 봄]. → R05를 정할 때 UML 근거를 쓰면 통신 방식을 화살촉으로 옮길 수 있지만, 그러면 이번엔 **응답 점선**과 "확인 못 함 점선"이 부딪힌다. 시퀀스에서는 응답선을 점선으로 쓰지 않는 쪽이 안전하다(추론).
4. **"계약 다이어그램" 표준 표기를 못 찾았다.** OpenAPI 3.1은 문서 객체 구조만 정의하고 다이어그램 절이 없다. AsyncAPI 문서 구조 페이지에도 표기 정의가 없다. Pact는 "contract by example"이라 스키마 그림 자체를 쓰지 않는다. UML 인터페이스 기호(lollipop/socket)는 제공·필요 관계만 담는다 [UML251 §10.4.4]. 국내 글 넷(토스페이먼츠·카카오페이·컬리·우아한형제들)도 계약을 그림 없이 **산출물과 예시**로 다뤘다. 캔버스 근사형은 (추론)이다. — 이 행만 그림 종류가 표준에 기대지 못하므로 02에서 가장 먼저 깨질 칸이다(추론).
5. **인가(누가 무엇을 할 수 있나)를 시퀀스로 답할 수 있나 — 절반 풀렸다.** OWASP 인가 치트시트는 검사 위치·거부 기본값·모델(RBAC/ABAC/ReBAC)을 말하지만 **다이어그램을 제시하지 않는다**. 반면 국내에는 인가 검사를 UML 시퀀스로 그린 실물이 있다 — `checkAuth(userId, url)` → `return ok` → `request()` → `response()` [WOOWA-OSORI 봄]. 즉 **검사 지점**은 시퀀스로 답해진다. 정책 전체(역할×권한 표)는 여전히 그림이 아니다(추론). ⑥을 "권한 검사 지점과 규칙"으로 좁힌 판단을 유지한다.
6. **버전 정책이 출처마다 다르다.** AIP: 메이저만, `v1`, 마이너·패치 금지 [AIP-185]. Stripe: 날짜+코드네임(`2026-08-26.dahlia`), 월간 릴리스는 하위호환 [STRIPE-VER]. Azure: `api-version=YYYY-MM-DD` 쿼리 [AZURE-GUIDE]. Azure 아키텍처 가이드: URI·쿼리·헤더·미디어 타입 4방식을 대가와 함께 병렬 제시하고 "No versioning"도 인정 [AZ-APIDESIGN]. → 필수요소는 "정책이 무엇인가"를 묻지 값을 강제하지 않는다.
7. **최대 재시도 기본값이 다르다.** Step Functions 3 [AWS-SFN], AWS SDK 3(=1+2, DynamoDB만 4) [AWS-SDKRETRY], gRPC "must be two or greater" [GRPC-A6], Temporal ∞ [TEMPORAL-RETRY], Google SRE 요청당 3회 + 클라이언트 예산 10% + 프로세스당 60회/분 [SRE-CASCADE, SRE-OVERLOAD]. 지터 기본값도 갈린다(Step Functions 기본 `NONE`, AWS SDK는 항상 full jitter).
8. **타임아웃 값 고르는 법의 1차 출처를 못 열었다.** AWS Builders' Library "Timeouts, retries, and backoff with jitter"는 `aws.amazon.com`에서 `builder.aws.com`으로 301되고 본문이 자바스크립트라 WebFetch·curl 모두 빈 문서를 받았다. `web.archive.org`는 이 도구에서 차단된다. 대체로 AWS 아키텍처 블로그(지터 공식)와 Marc Brooker 개인 블로그(재시도 예산), Google SRE(마감 전파)를 썼다. **타임아웃 값을 어떻게 정하나**에 대한 1차 인용은 확보하지 못했다 — API 동작 ⑥의 근거는 "마감을 전파하라"까지다. 국내 글에서도 타임아웃 **값**(초·ms)을 공개한 사례가 0건이었다(에이전트 보고: 재시도·서킷브레이커 값은 상세히 공개하면서 타임아웃만 개념으로 다룬다). ⑥은 02에서 실제로 채워지는지 봐야 한다.
9. **Harel 원 논문을 못 봤다.** 저자 사이트(weizmann) PDF는 WebFetch·curl 모두 연결이 끊겼고(ECONNRESET ×2), 에든버러대 사본은 410, ScienceDirect는 열지 않았다. Semantic Scholar가 준 PDF는 논문이 아니라 워털루대 수업 발표 슬라이드였다 — **인용하지 않았다**. 상태도 표기의 근거는 전부 OMG UML 2.5.1로 잡았다.
10. **Microsoft REST API Guidelines 본문은 폐기됐다.** `microsoft/api-guidelines`의 루트 `Guidelines.md`는 "This document has been deprecated"만 남아 Azure판·Graph판으로 갈렸다. Azure판을 썼다 [AZURE-GUIDE].
11. **Azure 서비스별 재시도 기본값 표를 확인 못 했다.** `best-practices/retry-service-specific` URL은 무관한 페이지(Reliability in Azure)를 돌려줬다. 서비스별 실제 기본값(스토리지·Cosmos DB·Service Bus)은 확인 못 함.
12. **Stripe 생명주기 그림을 확인 못 했다.** 상태 설명은 표로 받았지만 페이지가 자바스크립트라 이미지 유무를 확인하지 못했다(`<img>` 0건). 표 값만 인용했다.
13. **국내 사례는 서브에이전트가 조사했고 나는 재대조하지 못했다.** 같은 규칙으로 위임해 14곳을 열었고 그림 11장을 직접 봤다고 보고받았다(§5 "에이전트" 표시). 인용문은 절 제목과 함께 왔지만 **내가 원문에서 다시 맞춰보지는 않았다.** 국내 인용에 기대는 결론(§4-1의 갈래 넷, §4-5의 인가 시퀀스, §4-14)은 이 한 겹을 안고 있다.
14. **순환형 생명주기에는 종료 상태가 없다.** 배송 로봇 상태도는 `유휴`로 되돌아오는 닫힌 순환이라 종료 상태를 그리지 않았다 [WOOWA-SM 봄]. archify는 "never hide an ending"이라고 하지만, 끝이 없는 대상이 실제로 있다. ④를 "없음 확인"으로 채울 수 있게 둔 이유다. 또 같은 글의 서킷브레이커 상태도는 본문에 있는 `DISABLED`·`FORCED_OPEN` 2상태를 **그림에서 뺐다** [WOOWA-CB 봄] — "모든 상태"를 강제하면 실무 그림보다 무거워진다는 반대 신호다(추론, 02에서 확인).
15. **결과가 셋인 호출은 시퀀스로 안 그려졌다.** 카카오페이는 성공·실패·알 수 없음(S/F/U) 3갈래를 **분기 트리**로 그렸다 [KAKAOPAY-MSA 봄]. 시간축이 아니라 갈래가 답이라서다(추론). API 동작 행이 이 그림을 어떻게 수용할지는 02에서 봐야 한다 — 지금 제안은 `alt` 프레임 안에 세 갈래를 넣는 것이다.
14. **archify에 세 행(인증·권한, API 계약, 재시도·분기)의 레시피가 없다.** 그러므로 이 세 행의 필수요소는 9/5표 + 공식 문서로만 대조했다. archify가 값을 주지 않았다는 사실 자체는 R09 5번 판단(archify include 전부 반영)과 충돌하지 않는다.

## 5. 출처 목록

확인일은 모두 **2026-09-12**다. 검색 요약·Medium 해설·SEO 블로그는 인용하지 않았다.

| ID | 출처 (URL) | 소유자 | 구분 | 확인 |
|---|---|---|---|---|
| UML251 | OMG Unified Modeling Language 2.5.1 — https://www.omg.org/spec/UML/2.5.1/PDF (PDF 내려받아 `pdftotext`) | OMG | 표준 | §10.4.4·§14.2.3.9·§14.2.4·§17.2.4·§17.3.4·§17.4.4·§17.6.4·§17.8 원문 대조. 그림은 PDF 이미지라 [alt] |
| RFC9110 | https://www.rfc-editor.org/rfc/rfc9110.html | IETF | 표준 | 원문 대조(§9.2.1·§9.2.2·§10.2.3·§15.3·§15.4.4·§15.5) |
| RFC9457 | https://www.rfc-editor.org/rfc/rfc9457.html | IETF | 표준 | 원문 대조 |
| RFC6749 | https://www.rfc-editor.org/rfc/rfc6749.html | IETF | 표준 | Figure 1·2·3 ASCII 원문 [봄], §1.4·§1.5 |
| RFC6750 | https://www.rfc-editor.org/rfc/rfc6750.html | IETF | 표준 | 원문 대조(§2.1~2.3·§3·§3.1) |
| RFC7519 | https://www.rfc-editor.org/rfc/rfc7519.html | IETF | 표준 | 원문 대조(§4.1.1~4.1.7) |
| RFC9700 | https://www.rfc-editor.org/rfc/rfc9700.html | IETF | 표준 | 원문 대조(§2.2·§2.3·§4.10.2) |
| IDEMKEY | https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-idempotency-key-header | IETF (초안) | 표준 초안 | 원문 대조 |
| OIDC | https://openid.net/specs/openid-connect-core-1_0.html | OpenID Foundation | 표준 | 원문 (요약) |
| OAS31 | https://spec.openapis.org/oas/v3.1.0.html | OpenAPI Initiative | 표준 | 원문 (요약) |
| ASYNCAPI | https://www.asyncapi.com/docs/concepts/asyncapi-document/structure | AsyncAPI Initiative | 공식 문서 | 원문 (요약) |
| NIST-63B | https://pages.nist.gov/800-63-3/sp800-63b.html | NIST | 표준 | §7.2 원문 대조. §7.1·§7.3은 응답에 안 잡힘 |
| OWASP-SESSION | https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html | OWASP | 1차 | 원문 대조 |
| OWASP-AUTHZ | https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html | OWASP | 1차 | 원문 (요약) |
| OWASP-TM | https://community.owasp.org/Threat_Modeling_Process | OWASP | 1차 | 원문 대조(리다이렉트 후) |
| AZ-ASYNC | https://learn.microsoft.com/en-us/azure/architecture/patterns/async-request-reply | Microsoft | 1차 | 본문 전문 + 시퀀스 그림 PNG [봄] |
| AZ-APIDESIGN | https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design | Microsoft | 1차 | 본문 전문(707줄) 직접 읽음 |
| AZ-RETRY | https://learn.microsoft.com/en-us/azure/architecture/patterns/retry | Microsoft | 1차 | 본문 전문 + 그림 PNG [봄] |
| AZ-CB | https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker | Microsoft | 1차 | 본문 전문 + 상태도 PNG [봄] |
| AZ-COMP | https://learn.microsoft.com/en-us/azure/architecture/patterns/compensating-transaction | Microsoft | 1차 | 이 문서에서는 직접 열지 않았다 — saga 조사 §2.1의 확인된 인용만 재사용 |
| AZURE-GUIDE | https://github.com/microsoft/api-guidelines/blob/vNext/azure/Guidelines.md | Microsoft | 1차 | 원문 (요약) |
| MSREST | https://github.com/microsoft/api-guidelines/blob/vNext/Guidelines.md | Microsoft | — | **폐기 문서 확인용**(§4-10) |
| AIP-180 | https://google.aip.dev/180 | Google | 1차 | 원문 (요약) |
| AIP-185 | https://google.aip.dev/185 | Google | 1차 | 원문 (요약) |
| AIP-193 | https://google.aip.dev/193 | Google | 1차 | 원문 (요약) |
| SRE-CASCADE | https://sre.google/sre-book/addressing-cascading-failures/ | Google | 1차 | 원문 (요약) |
| SRE-OVERLOAD | https://sre.google/sre-book/handling-overload/ | Google | 1차 | 원문 (요약) |
| GRPC-A6 | https://github.com/grpc/proposal/blob/master/A6-client-retries.md | gRPC | 1차 | 원문 (요약) |
| AWS-SFN | https://docs.aws.amazon.com/step-functions/latest/dg/concepts-error-handling.html | AWS | 1차 | 본문 전문 |
| AWS-SDKRETRY | https://docs.aws.amazon.com/sdkref/latest/guide/feature-retry-behavior.html | AWS | 1차 | 본문 전문 |
| AWS-JITTER | https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/ | AWS (Marc Brooker) | 1차 | 원문 (요약), 그래프 9장 [alt] |
| AWS-SQSDLQ | https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html | AWS | 1차 | 본문 전문 |
| AWS-EC2LC | https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-lifecycle.html (그림 `images/instance_lifecycle.png`) | AWS | 1차 | 본문 전문 + 상태도 PNG [봄] |
| TEMPORAL-RETRY | https://docs.temporal.io/encyclopedia/retry-policies | Temporal | 1차 | 원문 (요약) |
| XSTATE | https://stately.ai/docs/transitions | Stately (XState) | 1차 | 원문 (요약) |
| K8S-POD | https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/ | Kubernetes | 1차 | 원문 대조(phase 표) |
| STRIPE-LC | https://docs.stripe.com/payments/paymentintents/lifecycle | Stripe | 1차 | 본문(상태 표) 대조, 그림 미확인 |
| STRIPE-IDEM | https://docs.stripe.com/api/idempotent_requests | Stripe | 1차 | 본문 전문 |
| STRIPE-VER | https://docs.stripe.com/api/versioning | Stripe | 1차 | 본문 전문 |
| STRIPE-WH | https://docs.stripe.com/webhooks | Stripe | 1차 | 본문 전문 |
| PACT | https://docs.pact.io/ | Pact Foundation | 1차 | 원문 (요약) |
| AUTH0-ACF | https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow | Auth0 (Okta) | 1차(제품) | 원문 (요약), 그림 [alt] |
| BROOKER | https://brooker.co.za/blog/2022/02/28/retries.html | Marc Brooker | 1차 | 원문 (요약) |
| KAKAOPAY-MSA | https://tech.kakaopay.com/post/msa-transaction/ | 카카오페이 | 1차(사례) | 에이전트 [봄] |
| KAKAOPAY-HTTP | https://tech.kakaopay.com/post/make-http-client-design-flexible/ | 카카오페이 | 1차(사례) | 에이전트 [봄] |
| KAKAOPAY-OAS | https://tech.kakaopay.com/post/openapi-documentation/ | 카카오페이 | 1차(사례) | 에이전트 |
| TOSSPAY-API | https://toss.tech/article/payments-legacy-4 | 토스페이먼츠 | 1차(사례) | 에이전트 |
| TOSS-GW | https://toss.tech/article/slash23-server (SLASH 23 장표) | 토스 | 1차(사례) | 에이전트 [봄] |
| TOSS-ZT | https://toss.tech/article/slash23-security (SLASH 23 장표) | 토스 | 1차(사례) | 에이전트 [봄] |
| WOOWA-OSORI | https://techblog.woowahan.com/2519/ | 우아한형제들 | 1차(사례) | 에이전트 [봄] |
| WOOWA-CB | https://techblog.woowahan.com/15694/ | 우아한형제들 | 1차(사례) | 에이전트 [봄] |
| WOOWA-TASKQ | https://techblog.woowahan.com/23625/ | 우아한형제들 | 1차(사례) | 에이전트 [봄] |
| WOOWA-SM | https://techblog.woowahan.com/19491/ | 우아한형제들 | 1차(사례) | 에이전트 [봄] |
| WOOWA-MOCK | https://techblog.woowahan.com/20154/ | 우아한형제들 | 1차(사례) | 에이전트 |
| WOOWA-4XX | https://techblog.woowahan.com/21686/ | 우아한형제들 | 1차(사례) | 에이전트 |
| KURLY-RETRY | https://helloworld.kurly.com/blog/2026-outbox-pattern-and-retry-topic/ | 컬리 | 1차(사례) | 에이전트 [봄] |
| KURLY-RESTDOCS | https://helloworld.kurly.com/blog/spring-rest-docs-guide/ | 컬리 | 1차(사례) | 에이전트 |
| ARCHIFY | `references/archify/archify/recipes/scenarios.mjs` (로컬, 읽기 전용) | archify (MIT) | 1차 | 전문 읽음 |
| PRD | `.scratch/archdraw-skill/spec.md` | 이 레포 | 내부 | 전문 읽음 |
| REVIEW | `.scratch/archdraw-skill/review.md` | 이 레포 | 내부 | 전문 읽음 |

열었지만 쓰지 못한 것: AWS Builders' Library 타임아웃·재시도 문서(본문 0바이트, §4-8), Harel 1987 원 논문(§4-9), Azure `retry-service-specific`(엉뚱한 페이지, §4-11).

에이전트가 열었지만 이 문서에서 인용하지 않은 것: 카카오페이 계정 토큰 글(https://tech.kakaopay.com/post/account-token-swift-concurrency/ — 역할 정의만, 수명 값·그림 없음), 우아한형제들 Hystrix 글(https://techblog.woowahan.com/2542/ — 임계값 수치 미공개), 컬리 OMS·주문 모니터링 글(주문 상태 목록도 상태 전이도도 없음), 카카오 소셜로그인 글(tech.kakao.com 2건 — 본문이 렌더링되지 않아 인용 불가).

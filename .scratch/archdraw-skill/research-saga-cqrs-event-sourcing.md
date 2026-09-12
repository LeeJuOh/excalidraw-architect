# saga · CQRS · 이벤트 소싱 — 그림 표현과 필수요소 조사

> 조사일 2026-09-12 · 대상: [review.md](review.md) R09 다음 질문 4 — 행을 제안하기 전에 근거를 모은다. 행을 결정하는 문서는 아니다.
> **확인 방법.** 1차 출처를 직접 열었다. 인용 문장은 원본 HTML·PDF 텍스트와 다시 대조했다. 그림은 이미지 파일을 받아 직접 봤다.
> 표시: **[봄]** 그림 직접 봄 / **[alt]** alt·캡션·본문으로만 앎 / **(요약)** 요약 모델을 거친 인용이라 원문 재대조를 못 함.
> 프레임워크 공식 문서와 회사 기술 블로그는 서브에이전트 2개가 같은 규칙으로 조사했다(§6 "확인" 칸의 "에이전트"). 그중 핵심 인용(AWS·Temporal·Camunda·카카오페이)은 원문에서 다시 대조했다.
> **로컬 확인.**
> - `wiki/index.md`: 세 패턴 페이지 없음(전문 읽기와 grep 모두 0건).
> - `raw-articles/`: 88개 중 `saga|cqrs|event|compensat|transaction` 매칭 0건.
> - archify `scenarios.mjs`: 레시피 11개 중 세 패턴 레시피 없음. 가까운 것은 `event-stream`·`object-lifecycle`·`data-lineage`·`async-roundtrip`.
>
> **표기.** `[ID §절]`은 §6 출처 ID와 원문 절 제목이다. **(추론)**은 출처가 아니라 이 문서의 판단이다.

## 1. 요약

### 세 행 제안

| 상황 | 답하는 질문 | 그림 종류 | 필수요소 |
|---|---|---|---|
| 분산 작업 실패 복구 (saga) | 여러 서비스에 걸친 작업이 중간에 실패하면 무엇을 되돌리고 무엇을 끝까지 밀어붙이나? | 상태도(단계 흐름): 노드는 단계와 담당 서비스, 실패 전이는 보상 체인으로, 종료 상태(성공·보상 완료·수동 개입)는 전부 표시 | ① 조율 방식과 진행 상태 저장 위치 ② 단계 분류(보상 가능·pivot·재시도) ③ 보상 동작·순서·범위 ④ 실패 판정과 복구 경로(거절·결과 모름·보상 실패) ⑤ 격리 부재 대응 |
| 읽기·쓰기 모델 분리 (CQRS) | 명령과 조회가 어떤 모델·저장소로 갈라지고, 조회는 쓰기 결과를 언제부터 보나? | 박스-화살표: 명령 경로와 조회 경로를 두 칸으로, 쓰기→읽기 동기화 화살표에 방식·지연 라벨 | ① 분리 수준(모델만 / 저장소까지) ② 명령 응답 방식과 거절 지점 ③ 읽기 저장소 동기화 방식 ④ 반영 지연 허용치와 stale 읽기 대응 ⑤ 읽기 모델 재구축 경로 |
| 이벤트 기록으로 상태 저장 (이벤트 소싱) | 이 엔티티의 상태는 어떤 이벤트 기록으로 남고, 그 기록에서 현재 상태를 어떻게 다시 만드나? | 박스-화살표: 명령 처리기 → 이벤트 스토어(스트림 하나를 버전 붙은 이벤트 칸으로) → 구독자(프로젝션·외부 연동) | ① 스트림 경계와 이벤트 이름 ② append 경로와 동시 쓰기 충돌 처리 ③ 상태 복원 방식(전체 리플레이 / 스냅샷) ④ 이벤트 스키마 변경 대응 ⑤ 리플레이 때 외부 부작용 차단 |

### 판단

1. **세 패턴 모두 새 행이 맞다 (추론).** 답하는 질문이 기존 7행 어디에도 들어가지 않는다(§3). 대신 행마다 "이럴 땐 다른 행" 경계 문장을 붙인다(archify `avoidWhen`과 같은 역할).
   - saga: 보상 없이 재시도만으로 끝나는 흐름이면 재시도·분기 행.
   - CQRS: 명령 쪽 분리 없이 읽기 복제본만 두면 저장소 토폴로지 행.
   - 이벤트 소싱: 원본이 상태 DB이고 이벤트가 outbox·CDC로 파생되면 이벤트 토폴로지·데이터 흐름 행. 이런 구성을 "event sourcing"이라 부르는 실제 사례가 있다(§5-10).
2. **CQRS의 경계가 가장 약하다 (추론).**
   - 필수요소 ③·④는 "데이터 흐름·파생 데이터" 행의 이동 방식·지연 허용치와 같은 값이다.
   - 새 행만 맡는 것은 ①·②·⑤와 stale 대응이다.
   - 02 도그푸딩에서 CQRS 질문이 "읽기 DB 언제 반영돼?" 하나로만 나오면 CQRS 행을 없앤다. 대신 16에 "읽기 모델 재구축"을 더한다.
3. **기존 행의 필수요소는 바꾸지 않는다 (추론).** 새 행이 기존 행의 값을 가리키게 한다.
   - 백오프·최대 횟수 → 재시도·분기 행
   - outbox·멱등키 → 이벤트 토폴로지 행의 전달 보장
   - 프로젝션 저장소 계보 → 데이터 흐름 행
4. **saga 초안은 질문과 그림 종류를 고친다(§4).**
   - 질문: 초안은 되돌리기만 전제한다. 출처는 전진 복구(재시도)를 같은 무게로 다룬다.
   - 그림 종류: 보상 경로를 그린 출처는 전부 상태도·흐름도였다. 시퀀스로 그린 출처는 없었다.
   - 필수요소: 넷 중 둘은 합쳐 바꾸고, 둘은 새로 더한다.

## 2. 패턴별 조사 결과

### 2.1 Saga

**질문 후보** (출처가 이 패턴이 푼다고 말하는 문제)
- "How to implement transactions that span services?" [MSIO-SAGA §Problem]
- 실패하면 되돌리나, 끝까지 가나? 원 논문의 두 갈래: "compensate for the executed transactions, backward recovery, or execute the missing transactions, forward recovery" [GMS87 §4 Backward Recovery]
- 어디부터 못 되돌리나? pivot은 "the point of no return in the saga" [AZ-SAGA §Key concepts in the Saga pattern]
- 전부 취소가 맞나? 대안 경로: "Offering the customer a room at a different hotel is preferable to canceling the flights." [AZ-COMP §Solution]
- 결과를 모르면? 카카오페이는 결과를 성공·실패·알 수 없음 셋으로 나눈다. 보상 요청의 응답도 못 받으면 "보상 트랜잭션의 보상 트랜잭션"을 요청해야 하는 상황이 된다고 적었다 [KAKAOPAY]. 토스뱅크는 "결과 확인 필요"를 별도 상태로 둔다 [TOSS].

**출처의 그림**

| 출처 | 그림 종류 | 그려진 요소 | 확인 |
|---|---|---|---|
| AZ-SAGA | 박스-화살표 3장 | 개요: Saga 점선 경계, Service×3(각 Local Transaction), Message/Event 화살표. 코레오그래피: Client request→Message broker↔Service A/B/C. 오케스트레이션: Client request→Orchestrator↔Service A/B/C. **실패 지점·보상 경로는 없음** | [봄] |
| AZ-COMP | 워크플로 | step 1→2→3 순차 실행. 어느 단계 뒤든 실패하면 compensating actions가 역순으로 돌고 "compensated state"로 끝남. 구현 그림: orchestrator, Service Bus, 단계·보상 기록 저장소, dead-letter queue, 관측 | [alt] |
| MSIO-SAGA | 번호 붙인 협력 그림 | POST /orders, 서비스 헥사곤과 《aggregate》, 이벤트 채널, 결과 이벤트 둘(Credit Reserved / Credit Limit Exceeded). 오케스트레이션판: Create Order Saga, Reserve Credit Command, Command Handler, Reply channel | [봄] |
| CQRSJ Fig 1·2 | 번호 붙인 메시지 흐름 | Customer, Order·Reservation·Payment aggregate, Order Process Manager. 명령은 속 빈 화살표, 이벤트는 검은 화살표(모양 구분은 내 관찰). 실패·보상 없음 | [봄] |
| GMS87 Fig 8.1 | 프로세스 박스 | 트랜잭션 T0–T5, save-point(sp), 병렬 프로세스 분기. 논문의 유일한 그림 | [봄] 스캔 |
| AWS-SO | 박스-화살표 + Step Functions 상태도 | ① orchestrator 박스 안에 T1–T3·실패·C1·C2 목록 ② Place Order→Update Inventory→Make Payment. 각 Choice의 ERROR 분기가 Revert Payment→Revert Inventory→Remove Order→Fail "Transaction rollback" 체인으로 합류 | 에이전트 [봄] |
| AWS-SC | 박스-화살표 | Message broker, 서비스×3과 각 DB, 이벤트 쌍 `T1 Order placed`/`C3 Order reverted` 등 | 에이전트 [봄] |
| TEMPORAL | 흐름도(mermaid) | 단계 4개. 각 단계의 Failure 엣지가 그 단계 자신의 보상으로 감. 보상끼리 역순 체인, 끝은 End: Failed | 에이전트 [alt] |
| CAMUNDA | BPMN | 태스크 경계의 compensation boundary event, 점선 association으로 이어진 "Undo A" 보상 태스크, compensation throw event, 병렬 A·B | 에이전트 [봄] |
| TOSS | 상태도 + 시나리오 슬라이드 | "Orchestration Saga: State Machine" 상태: 환전 시작 / 출금 성공 / 출금·입금 결과 확인 필요 / 출금 취소 필요 / 환전 실패 / 환전 성공. 전이 라벨: 결과 모름·성공 확인·실패 확인. 상태 로그 경로를 겹쳐 그림. 동기(HTTP)·비동기(메시징) 구간 구분, 지연 재시도 토픽·DLQ·배치 재처리 | 에이전트 [봄] |
| UBER | 박스-화살표 | 옛 saga 구조 그림에 코디네이터·보상 단계 없음. 새 구조는 Transaction Coordinator + Entity Statechart | 에이전트 [봄] |

→ **보상 경로를 그린 출처는 전부 상태도·흐름도로 그렸다**(AWS Step Functions·Temporal·Camunda·Azure 보상 트랜잭션·토스). 박스-화살표 그림은 조율 구조만 보이고, 대개 실패 경로를 뺐다(Azure saga·microservices.io·CQRS Journey·Uber). saga를 UML 시퀀스로 그린 출처는 찾지 못했다.

**필수요소 후보**

| 후보 | 근거 | 값 3종으로 채울 수 있나 |
|---|---|---|
| ① 조율 방식과 진행 상태 저장 위치 | "The orchestrator performs saga requests, stores and interprets the states of each task" [AZ-SAGA §Orchestration] / 코레오그래피 단점 "It's difficult to track which commands each saga participant responds to." [AZ-SAGA §Choreography] / "Both components require a log to record the activities of sagas and transactions" [GMS87 §4] / "the system records information about each step and how to undo it" [AZ-COMP §Solution] / "The orchestrator can become a single point of failure" [AWS-SO §Issues and considerations] | 실제 값 / 없음 확인(코레오그래피라 중앙 상태 없음) / 확인 못 함 |
| ② 단계 분류: 보상 가능·pivot·재시도 | Azure 정의 셋(compensable·pivot·retryable) [AZ-SAGA §Key concepts] / "Pivot transaction (Ti) … GO/NO GO point", "Set of retriable transactions (Ti) … Can't fail" [CR-QCON (요약)] / "Design the workflow so that irreversible steps occur only after all critical validations succeed." [AZ-COMP §Problems and considerations] / 토스 순서 결정 "항상 출금부터 처리한다" [TOSS] | 단계마다 실제 값 / 없음 확인(pivot 없음 = 전 단계 보상 가능) / 확인 못 함 |
| ③ 보상 동작·순서·범위 | 보상은 "undoes, from a semantic point of view, any of the actions performed by Ti, but does not necessarily return the database to the state that existed when the execution of Ti began" [GMS87 §1] / "A compensating transaction might not need to undo the work in the exact reverse order" [AZ-COMP §Solution] / "invokes all compensation handlers at once without any specific order" [CAMUNDA] / 실패한 단계 자신을 보상 범위에 넣는지는 출처마다 다름(§5-4) | 실제 값 / 없음 확인(재시도 단계는 보상 없음) / 확인 못 함 |
| ④ 실패 판정과 복구 경로 | "A step might not fail immediately but instead get blocked. You might need to implement a timeout mechanism." · "Only stop the operation and trigger compensation if the step fails repeatedly or you can't recover it." [AZ-COMP §Problems and considerations] / "Sometimes manual intervention is the only way to recover from a failed step." [AZ-COMP §Solution] / 보상이 실패하면 시스템이 막힌다("the system is stuck", 스캔 판독) → 대체 코드(recovery block) 또는 수동 개입 [GMS87 §6 Other Errors] / "Compensating transactions might not always succeed, which can leave the system in an inconsistent state." [AZ-SAGA §Problems and considerations] / 결과 모름은 Unknown으로 저장한 뒤 재시도 안내 [KAKAOPAY] | 실제 값 / 없음 확인(처리 없음 = 위험이 드러난 값) / 확인 못 함 |
| ⑤ 격리 부재 대응 | "no effort is made to notify or abort transactions that might have seen the results of Ti" [GMS87 §1] / lost update·dirty read·fuzzy read와 대응책 6종 [AZ-SAGA §Strategies to address data anomalies] / "The use of a PENDING state is an example of what is known as a semantic lock counter-measure." [MSIO-SAGA1] / "We recommend using semantic locking" [AWS-SO §Issues and considerations] / Temporal은 "intermediate states are visible to other processes"라고 인정만 함 [TEMPORAL] / Uber는 단계 사이의 "internally inconsistent state"를 이유로 saga를 버림 [UBER] | 실제 값(예: Order.PENDING) / 없음 확인 / 확인 못 함 |

넣지 않은 것:
- **단계 멱등성.** 재시도 단계 정의에 이미 들어 있다("Retryable transactions are idempotent" [AZ-SAGA]). ②에 흡수.
- **DB 갱신과 발행의 원자성.** 출처: "a service must atomically update its database and publish a message/event" [MSIO-SAGA §Resulting context], [AWS-SC]. 이벤트 토폴로지 행의 전달 보장 값이라 거기서 다룬다(추론).
- **인증·권한.** Azure가 그림에서 빼라고 명시한다: "treat these identity and authorization controls as baseline implementation concerns rather than explicit flow steps. Keep the diagram focused on orchestration, retry, compensation, and failure handling." [AZ-COMP §Example]. 출처가 그림 구성을 직접 지시한 유일한 문장이다.

### 2.2 CQRS

**질문 후보**
- "How to implement a query that retrieves data from multiple services in a microservice architecture?" [MSIO-CQRS §Problem]
- 단일 모델의 문제(data mismatch·lock contention·performance·security) [AZ-CQRS §Context and problem]. Greg Young: "It is not possible to create an optimal solution for searching, reporting, and processing transactions utilizing a single model." [GY-CQRS §Origins]
- "Staleness refers to the fact that in a collaborative environment, once data has been shown to a user, that same data may have been changed by another actor – it is stale." [UDI §Why CQRS]
- 어디에 적용하나? "for most systems CQRS adds risky complexity" · "CQRS should only be used on specific portions of a system" [FOWLER-CQRS]

**출처의 그림**

| 출처 | 그림 종류 | 그려진 요소 | 확인 |
|---|---|---|---|
| AZ-CQRS | 박스-화살표 | Presentation / Validation·Commands·Domain logic·Data persistence → Write data store → Read data store → Queries(generate DTOs). **저장소 사이 화살표에 방식·지연 라벨 없음** | [봄] |
| FOWLER-CQRS | 박스-화살표 + 주석 | UI, Service Interfaces, Command Model("executes validations, and consequential logic"), Query Model, 공유 DB 하나 | [봄] |
| MSIO-CQRS | 박스-화살표 | Order·Kitchen·Delivery·Accounting Service가 각자 이벤트 발행 → Event Handlers → Order History Service(findOrderHistory()) → Order History View database | [봄] |
| GY-CQRS Fig 12 | 박스-화살표 | 명령 측: Domain Object·Application Services·"Message Sent Ack/Nak Response". 조회 측: "Thin Read Layer (Direct to DTO)"·"Request DTO DTO returned". Data Storage →"Eventually"→ Data Storage | [봄] |
| AWS-CQRS | 박스-화살표(①–⑦) | Write APIs→Command→Write database→Event→Read database←Query←Read APIs | 에이전트 [봄] |
| ZALANDO·WOOWA-STORE | 박스-화살표 | 쓰기 원천 → 이벤트·CDC 토픽 → Updater → 읽기 저장소(DynamoDB·Redis) → Query API. **지연·신선도 수치는 본문에만 있고 그림엔 없음** | 에이전트 [봄] |

→ 모든 출처가 박스-화살표로 그렸다. 동기화 화살표에 라벨을 단 곳은 Greg Young("Eventually") 하나다.

**필수요소 후보**

| 후보 | 근거 | 값 3종 |
|---|---|---|
| ① 분리 수준 | 같은 저장소 안에서 모델만 분리 / 저장소까지 분리 [AZ-CQRS §Separate read models and write models] / "The in-memory models may share the same database" [FOWLER-CQRS] / "Strictly CQRS isn't really about events, since you can use CQRS without any events present in your design." [FOWLER-ED §CQRS] | 실제 값 / 확인 못 함 (분리가 행의 전제라 "없음 확인"은 해당 없음) |
| ② 명령 응답 방식과 거절 지점 | "the Application Server is allowed to reject the Command, if it were not allowed to, it would be an Event" [GY-CQRS §Commands] / 그림 속 "Ack/Nak Response" [GY-CQRS Fig 12] / "Even though a command may be valid, there still may be reasons to reject it." [UDI §Commands and Validation] / "commands don't need to be processed immediately – they can be queued." [UDI §Commands and Autonomy] | 실제 값(동기 결과 / 접수 후 비동기) / 확인 못 함 |
| ③ 읽기 저장소 동기화 방식 | "have the write model publish events … Use the Transactional Outbox pattern … make the read-model consumer idempotent" [AZ-CQRS §Separate models in different data stores] / "subscribing to Domain events" [MSIO-CQRS §Solution] / "events … offer the best mechanism for model synchronization" [GY-CQRS §The Command Side] / Marten Inline(쓰기와 같은 트랜잭션)·Async·Live [MARTEN (요약)] / 처리 위치 토큰·checkpoint [AXON, KURRENT] / RDS 읽기 복제본도 CQRS 구현으로 친다 [AWS-CQRS] | 실제 값 / 없음 확인(저장소 공유) / 확인 못 함 |
| ④ 반영 지연 허용치와 stale 읽기 대응 | "the read data might not show the most recent changes immediately … detecting and handling scenarios where a user acts on stale data requires careful consideration." [AZ-CQRS §Problems and considerations] / "Replication lag/eventually consistent views" [MSIO-CQRS §Resulting context] / "Most systems can be eventually consistent on the Query side." [GY-CQRS §Origins] / Zalando "delayed by up to 30 minutes", 배민스토어 이벤트 순서 역전 보정 [ZALANDO, WOOWA-STORE] | 실제 값 / 없음 확인(인라인 동기 갱신) / 확인 못 함 |
| ⑤ 읽기 모델 재구축 경로 | "completely disposable because it can be entirely rebuilt from the source data stores" [AZ-MV §Solution] / "regenerate materialized views … by replaying historical events" [AZ-CQRS §Benefits of combining the Event Sourcing and CQRS patterns] / "When a job first starts up, it can build up its state by consuming all the events in the log." [KLEPP] / Axon은 토큰 리셋 전에 처리기를 먼저 내려야 함 [AXON] | 실제 값 / 없음 확인(재구축 경로 없음) / 확인 못 함 |

### 2.3 이벤트 소싱

**질문 후보**
- "How to atomically update the database and send messages to a message broker?" [MSIO-ES §Problem]
- 쓰기 경합(write contention)과 감사 이력(auditability) [AZ-ES §Context and problem]
- "Temporal Query: We can determine the application state at any point in time." [FOWLER-ES §How it Works]
- "You want to capture intent, purpose, or reason in the data." [AZ-ES §When to use this pattern]

**출처의 그림**

| 출처 | 그림 종류 | 그려진 요소 | 확인 |
|---|---|---|---|
| AZ-ES | 박스-화살표 | presentation layer, reads→read-only store, writes→command handlers, "get cart events"→event store, queue or topic(cart created, item 1 added …). event handler 3개가 각각 이벤트 스토어 기록 / read-only store 갱신 / 외부 시스템 연동 | [alt] |
| MSIO-ES | before/after 박스 | ORDER table(ID·STATUS·TOTAL) → Event Store 안의 "Order 2345" 스트림(OrderCreated, Order Approved, …, OrderShipped). Order Service "add event / find events", Customer Service "Subscribe to events" | [봄] |
| GY-CQRS Fig 17·19 | 스트림·테이블 | Fig 17: 1–7번 칸이 쌓인 스트림과 방향 화살표. Fig 19: Events 테이블(AggregateId, Version …) | Fig 17 [봄], Fig 19 본문 |
| KURRENT | 스트림 칸 | `customer-321` 스트림 0–3번 칸, "Append at version 3" ✓ / "Append at version 2" ✗ | 에이전트 [봄] |
| AWS-ES | 박스-화살표 | 점선 Event Store 안 이벤트 목록 → FIFO 큐 3개 → View service(Materialized Views) / Payment service→External Payment Gateway / Trip service("Replay all ride events") | 에이전트 [봄] |
| MARTEN | 박스 흐름 | Event Storage의 High Water Mark·Current Progress, Slicing→Evolve→Projection Batch→Write, Side Effects는 "After Commit" | 에이전트 [봄] |
| NETFLIX·WIX | 시퀀스 / 박스-화살표 | Netflix: REST→Aggregate Service→Repository→Command Handler→Event Store 시퀀스, 거절 경로 포함. Wix: Command Topics→Aggregates→Domain Events→Materialize→read storage. **스냅샷·스키마 버전은 회사 그림 어디에도 없음** | 에이전트 [봄] |

→ 대부분 박스-화살표 그림 안에 스트림(이벤트 나열)을 넣었다. 시퀀스는 Netflix 1건뿐이다.

**필수요소 후보**

| 후보 | 근거 | 값 3종 |
|---|---|---|
| ① 스트림 경계와 이벤트 이름 | "Each entity in an event-sourced system has its own eventstream" [AZ-ES §Solution] / "The version number is unique and sequential only within the context of a given aggregate. This is because Aggregate Root boundaries are consistency boundaries." [GY-CQRS §Structure] / 결과 상태보다 의도를 담는 이벤트 [AZ-ES §Event design] | 실제 값 / 확인 못 함 |
| ② append 경로와 동시 쓰기 충돌 처리 | "reject an append if the stream changed since it was read. Upon rejection, the handler reloads the entity, reevaluates, and retries." [AZ-ES §Pattern advantages] / "if the expected version does not match the actual version it will raise a concurrency exception" [GY-CQRS §Operations] / 큐에 먼저 쓰면 "it is possible that an optimistic concurrency problem will occur on the write of the events" [GY-CQRS §Event Storage as a Queue] / 여러 엔티티에 걸친 충돌은 따로 처리해야 함 [AZ-ES §Conflict handling] | 실제 값 / 없음 확인(단일 writer 등) / 확인 못 함 |
| ③ 상태 복원 방식 | 리플레이로 복원(rehydration), 스냅샷은 "every N events" [AZ-ES §Solution, §Entity state re-creation] / "Rolling Snapshots are just a heuristic" [GY-CQRS §Rolling Snapshots] / "It is generally recommended to handle development without snapshotting as it can always be introduced later" [GY-CQRS §Building an Event Storage] | 실제 값 / 없음 확인(스냅샷 없음) / 확인 못 함 |
| ④ 이벤트 스키마 변경 대응 | "you should never update the event data". 전략 4종: tolerant deserialization·event versioning·upcasting·in-place migration("should be a last resort") [AZ-ES §Versioning events] / Marten·Axon의 upcaster [MARTEN, AXON (요약)] | 실제 값 / 없음 확인(버전 필드 없음) / 확인 못 함 |
| ⑤ 리플레이 때 외부 부작용 차단 | "those external systems don't know the difference between real processing and replays" · "gateways to be able to be disabled during the replay processing" [FOWLER-ES §External Updates] / "use feature flags to control external system updates" [AWS-ES §Issues and considerations] / "side effects such as payments or notifications trigger more than once" [AZ-ES §Idempotency requirements] / Marten `RaiseSideEffects()`는 재구축 때 호출되지 않음 [MARTEN (요약)] | 실제 값 / 없음 확인(외부 연동 없음) / 확인 못 함 |

넣지 않은 것:
- **프로젝션 목록.** CQRS 행 ③·⑤와 데이터 흐름 행이 맡는다.
- **발행 경로(스토어→브로커→구독자).** 이벤트 토폴로지 행이 맡는다. 출처: "Don't confuse an event store with an eventstream message broker." [AZ-ES §Event store options]
- **개인정보 삭제(crypto-shredding)** [AZ-ES]. "안 그림" 줄 후보.

## 3. 기존 행과의 겹침 분석 (전부 추론)

| 새 행 × 기존 행 | 같은 질문인가 | 처리 |
|---|---|---|
| saga × API 동작(비동기 후속) | 아니다. API 동작은 요청 하나의 호출 순서다. saga는 여러 로컬 트랜잭션의 실패 복구다. | 202 응답 뒤 saga가 돌면 API 동작 그림의 비동기 후속 값을 "saga: 이름, 별도 그림"으로 적는다. |
| saga × 재시도·분기 | 아니다. 재시도 행은 한 단계의 정책이다. saga ②의 재시도 단계와 ④의 보상 전환 조건이 그 값을 참조한다. Azure는 재시도로 충분하면 보상이 필요 없다고 한다 [AZ-COMP §When to use this pattern]. | 보상 없는 흐름은 재시도 행으로. 백오프·횟수는 재시도 행이 맡는다. |
| saga × 엔티티 생명주기 | 모양은 겹친다. 둘 다 상태도이고, 토스 saga 상태 머신은 곧 환전 건의 생명주기다. 질문은 다르다. 생명주기는 허용·불가 전이 규칙을, saga는 실패했을 때 되돌림과 전진을 묻는다. | 새 행. semantic lock(PENDING)은 생명주기 그림에서도 상태 하나로 나타난다. |
| saga × 이벤트 토폴로지 | 코레오그래피 saga는 토폴로지 그림과 모양이 같다(AZ-SAGA·AWS-SC). 하지만 토폴로지는 "누가 받나", saga는 "실패하면 뭘 하나"를 묻는다. Azure가 꼽은 코레오그래피 단점("difficult to track which commands each saga participant responds to")은 토폴로지 그림으로는 흐름이 안 보인다는 근거로 읽힌다. | 새 행. |
| CQRS × 데이터 흐름·파생 데이터 | 절반 겹친다. 읽기 저장소는 파생 데이터이고 [AZ-MV], ③·④는 16의 이동 방식·지연 허용치와 같은 값이다. 차이는 명령 경로·명령 응답·stale 대응이다. 저장소를 공유하는 CQRS(FOWLER·AZ)는 데이터가 이동하지 않아 16으로는 그릴 수 없다. | 새 행을 유지하되 02에서 다시 판정한다(§1 판단 2). |
| CQRS × 저장소 토폴로지(stale 허용 읽기) | 읽기 복제본을 읽기 모델로 쓰면 겹친다. Azure는 읽기 저장소가 "a read-only replica of the write store"일 수 있다고 하고 [AZ-CQRS], AWS는 RDS 복제본을 CQRS로 친다 [AWS-CQRS]. | 명령 쪽 분리가 없으면 저장소 토폴로지 행으로. |
| 이벤트 소싱 × 엔티티 생명주기 | 이벤트 이름이 곧 전이 트리거인 경우가 많다(OrderCreated→Approved→Shipped [MSIO-ES]). 하지만 생명주기는 전이 규칙을, 이벤트 소싱은 기록의 저장·복원·동시성·버전을 다룬다. | 새 행. 같은 엔티티라면 두 그림이 이벤트 이름을 공유한다. |
| 이벤트 소싱 × 이벤트 토폴로지 | 아니다. 출처가 둘을 구분한다. Azure: "Message brokers such as Apache Kafka typically lack per-entity stream queries and optimistic concurrency … they aren't a substitute for an event store." [AZ-ES]. Fowler도 event notification·event-carried state transfer·event sourcing을 다른 패턴으로 나눈다 [FOWLER-ED]. | 새 행. 스토어 이후의 발행·구독은 토폴로지 행이 맡는다. |
| 이벤트 소싱 × 데이터 흐름 | 이벤트 스토어가 16의 "원본" 값이 된다. Azure: "The event store is the write model and the single source of truth." [AZ-CQRS]. 판별 기준은 원본이 이벤트냐 상태 DB냐다. | 원본이 상태 DB면 이벤트 소싱 행이 아니다(§1 판단 1). |

**조사 중 기존 행이 바뀌었다.** 위 분석은 작업 지시에 적힌 기존 행 필수요소를 기준으로 했다. 조사 중에 [review.md](review.md) R09 질문 5가 확정되면서 기존 행에 archify include가 합쳐졌다(이벤트 토폴로지에 "상태 저장소·재처리·DLQ", 엔티티 생명주기에 "모든 종료 상태" 등). 결론은 바뀌지 않는다(추론).
- **"재처리"라는 말이 세 행에 겹친다.** 가리키는 대상은 다르다. 토폴로지의 재처리는 컨슈머가 토픽을 다시 읽는 것이다. CQRS ⑤는 읽기 모델을 새로 만드는 경로다. 이벤트 소싱 ⑤는 원본을 다시 돌릴 때 외부 부작용을 막는 장치다. 같은 시스템이면 세 값이 서로를 가리킨다.
- **saga 상태도의 종료 상태는 생명주기 행과 같은 규칙이다.** saga 상태도에서 "종료 상태 전부"를 표시하게 한 것은 생명주기 행의 새 요소 "모든 종료 상태"와 같은 그리기 규칙이다.

## 4. saga 초안 검증

| 초안 항목 | 판정 | 근거 |
|---|---|---|
| 질문 "…무엇을 어떤 순서로 되돌리나?" | **수정** → "무엇을 되돌리고 무엇을 끝까지 밀어붙이나?" | 원 논문부터 복구가 두 갈래다 [GMS87 §4]. pivot 뒤 단계는 retryable이다 [AZ-SAGA]. Azure 구현도 "This model uses retries first to preserve forward progress." [AZ-COMP §Example]. 순서는 필수요소 ③으로 옮긴다. |
| 그림 종류 "시퀀스(정상 경로 + 실패 지점별 보상 경로)" | **수정** → 상태도(단계 흐름) | 보상 경로를 그린 출처 5곳(AWS-SO·TEMPORAL·CAMUNDA·AZ-COMP·TOSS)이 전부 상태도·흐름도였고, 시퀀스는 0건이었다. 실패 지점마다 경로를 따로 그리지 않고, 단계마다 실패 전이 하나를 보상 체인에 합류시킨다(AWS·Temporal 방식). 참여 서비스는 노드 라벨로 적는다. |
| 조율 방식 | **유지+보강** → "조율 방식과 진행 상태 저장 위치" | 오케스트레이터가 단계 상태를 저장한다 [AZ-SAGA]. 원 논문의 saga log [GMS87]. 토스의 상태 로그 테이블 [TOSS]. |
| 단계별 보상 동작 | **수정** → ③ "보상 동작·순서·범위" | 보상은 원래 상태 복원이 아니다 [GMS87 §1]. 역순이 아닐 수 있고 병렬도 가능하다 [AZ-COMP]. 실패한 단계 자신을 넣는지는 출처마다 다르다(§5-4). |
| 되돌릴 수 없는 단계 | **수정** → ② "단계 분류(보상 가능·pivot·재시도)" | "되돌릴 수 없음"에는 두 종류가 있다. pivot(GO/NO GO 지점)과 retriable(끝까지 재시도) [AZ-SAGA, CR-QCON]. 둘은 실패 처리가 정반대라 구분해야 판단이 선다. |
| 보상 실패 시 처리 | **유지+보강** → ④ "실패 판정과 복구 경로" | 결과 모름(타임아웃)을 실패·거절과 따로 다룬다 [AZ-COMP, KAKAOPAY, TOSS]. 보상 실패는 원 논문에서 대체 코드나 수동 개입으로 [GMS87 §6], Azure에서 진행 기록 후 재개와 DLQ로 처리한다 [AZ-COMP]. |
| (없음) | **추가** ⑤ "격리 부재 대응" | Azure·Richardson·AWS가 모두 대응책을 요구한다. Uber가 saga를 버린 이유이기도 하다. |
| 용어 compensatable / pivot / retriable | ②에 그대로 쓴다 | Azure는 compensable·retryable로 표기한다. 동의어로 함께 적는다. |

## 5. 출처 간 충돌·불확실한 점·못 찾은 것

1. **saga라는 이름.** CQRS Journey는 조율자를 "process manager"라 부른다. saga라는 말은 바운디드 컨텍스트 여러 개에 걸친 장기 프로세스에만 쓰고, "the process manager does not perform any business logic"라고 한다 [CQRSJ §What is a process manager?]. Azure·AWS·Richardson은 조율자를 orchestrator라 부른다. 스킬 문구에 동의어를 함께 적어야 한다(추론).
2. **pivot 정의.**
   - Richardson 슬라이드: "not compensatable or retriable" [CR-QCON (요약)].
   - Azure: "the pivot transaction can be the last undoable, or compensable, transaction. Or it can be the first retryable operation" [AZ-SAGA].
   - Richardson 2023: "You should structure the Saga so there are no compensatable transactions." — pivot을 첫 단계로 두라는 뜻 [MSIO-MONO6].
   - AWS·Temporal·Camunda·Axon: 연 페이지에 이 용어 없음(에이전트).
3. **보상 순서.**
   - 역순: 원 논문(프로세스 안에서) [GMS87 §8], Temporal("in reverse order", 병렬 옵션 있음).
   - 역순이 아닐 수 있음: Azure.
   - 순서 없음: Camunda 기본값("without any specific order").
4. **보상 범위 — 실패한 단계 자신을 보상하나.**
   - 포함: Temporal 권장 방식("Register before Activity execution"; 보상은 멱등하게 짜고, 앞 단계가 실행되지 않았으면 no-op). AWS 상태도 설명 "If the workflow fails at the Update Inventory step, the orchestrator calls the Revert Inventory and Remove Order steps".
   - 제외: 같은 AWS 페이지의 다른 그림 "When step T3 fails (payment failure), the orchestrator runs the compensatory transactions C1 and C2". Camunda "The compensation handlers of active or terminated activities are not invoked."
   - 그래서 ③에 "범위"를 넣었다.
5. **보상이 실패하면.**
   - 원 논문: 막힌다 → 대체 코드 또는 수동 개입.
   - Azure: 진행 기록 + 멱등 재시도 + 수동 개입.
   - Temporal: "let compensations retry until they succeed".
   - 카카오페이: 보상을 끝없이 거듭하지 않고 Unknown으로 저장, 사용자 재시도로 넘김.
   - Camunda: 연 페이지에 정책 없음(에이전트).
6. **전달 보장이 정반대.** AWS: "Use first in, first out (FIFO) queues with at-most-once delivery to carry the events to the event store." [AWS-ES]. Azure: "Event delivery to consumers is typically at least once", 그래서 멱등을 요구 [AZ-ES]. Kurrent persistent 구독도 at-least-once다(에이전트).
7. **이벤트 소싱의 쓰기 경로.**
   - 스토어 앞에 큐: Azure 개요 그림(명령 처리기 → 큐 → 핸들러가 스토어에 기록), AWS 그림.
   - 스토어에 먼저 append: microservices.io("The event store also behaves like a message broker."), Greg Young(스토어를 큐로 사용), Kurrent·Marten·Axon.
   - Greg Young은 큐에 먼저 쓰면 낙관적 동시성 문제가 생긴다고 경고한다. ②에 "append 경로"를 넣은 이유다.
8. **동시성 수단.** AWS는 "versioning or by adding timestamps"라 쓰고, Azure도 타임스탬프를 언급한다. Greg Young·Kurrent·Marten·Axon은 aggregate 안의 버전·시퀀스 번호를 쓴다.
9. **스냅샷.**
   - Greg Young: 처음엔 스냅샷 없이 개발하라.
   - Azure: N개마다, 저장 비용과 저울질해서.
   - AWS: 백업·RPO 관점.
   - Kurrent 블로그: 스냅샷이 필요하다는 것 자체가 모델 설계 결함의 신호일 수 있다(에이전트, 요약).
10. **"event sourcing"이라는 이름을 넓게 쓰는 사례.**
    - AWS decompose 페이지: DynamoDB Streams(24시간 로그)로 명령 DB→조회 DB를 동기화하는 것을 event sourcing이라 부른다(에이전트).
    - Wix: "Entity-current-state storage is our source of truth"(에이전트).
    - 정의상 기준은 "The event store becomes the principal source of truth" [FOWLER-ED §Event-Sourcing]다. 라우팅은 이름이 아니라 원본이 무엇이냐로 판별해야 한다(추론).
11. **CQRS와 이벤트의 관계.** Fowler는 이벤트 없는 CQRS도 인정한다. Greg Young은 이벤트가 최선의 동기화 수단이라 한다. microservices.io는 이벤트 구독 자체를 해법의 정의에 넣었다.
12. **불확실하거나 못 찾은 것.**
    - saga를 UML 시퀀스로 그린 출처는 1차·프레임워크·회사 어디에서도 찾지 못했다.
    - Richardson의 compensatable/pivot/retriable 원 정의는 슬라이드 요약으로만 확인했다. 책 4장 원문은 못 봤다.
    - GMS87은 스캔 이미지로 읽었다. 인용 속 문장부호는 판독에 기댄다.
    - Greg Young의 이벤트 버전 관리 책은 목차만 열렸다.
    - Uber 원문은 재대조에 실패했다(HTTP 406). 에이전트가 WebFetch로 받은 결과만 있다.
    - Axon·Kurrent·Marten 인용 일부는 요약 모델을 거쳤다.
    - 라인·카카오(tech.kakao.com)·컬리의 직접 사례는 못 찾았다. 토스는 기술 블로그 대신 SLASH24 슬라이드다.
    - 회사 그림에는 스냅샷·스키마 버전·지연 수치가 없었다. 필수요소로 강제할 이유이면서, 실무에서 그만큼 안 그린다는 반대 신호이기도 하다(추론 — 02 도그푸딩에서 확인).
    - EventStorming·Domain Storytelling은 범위 밖이라 조사하지 않았다.

## 6. 출처 목록

확인일은 모두 **2026-09-12**다. 2차 출처(검색 요약, Medium 해설)는 인용하지 않았다. "구분"은 해당 주장을 소유한 출처인지를 뜻한다(회사 블로그는 자사 사례의 1차 출처다).

| ID | 출처 (URL) | 소유자 | 구분 | 확인 |
|---|---|---|---|---|
| GMS87 | "Sagas", ACM SIGMOD 1987 pp.249–259 — https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf (Cornell 강의 사본, 스캔) | Garcia-Molina & Salem | 1차 | 전 11쪽 직접 읽음 |
| AZ-SAGA | https://learn.microsoft.com/en-us/azure/architecture/patterns/saga | Microsoft | 1차 | 본문 전문, 그림 3장 [봄] |
| AZ-COMP | https://learn.microsoft.com/en-us/azure/architecture/patterns/compensating-transaction | Microsoft | 1차 | 본문 전문, 그림 alt |
| AZ-CQRS | https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs | Microsoft | 1차 | 본문 전문, 그림 1장 [봄] |
| AZ-ES | https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing | Microsoft | 1차 | 본문 전문, 그림 alt |
| AZ-MV | https://learn.microsoft.com/en-us/azure/architecture/patterns/materialized-view | Microsoft | 1차 | 본문 전문 |
| CQRSJ | Reference 6: A Saga on Sagas — https://learn.microsoft.com/en-us/previous-versions/msp-n-p/jj591569(v=pandp.10) | Microsoft patterns & practices (2012, 보관본) | 1차 | 본문 전문, Fig 1·2 [봄] |
| MSIO-SAGA | https://microservices.io/patterns/data/saga.html | Chris Richardson | 1차 | 원문 대조, 그림 2장 [봄] |
| MSIO-SAGA1 | https://microservices.io/post/microservices/2019/07/09/developing-sagas-part-1.html | Chris Richardson | 1차 | 원문 대조 |
| MSIO-MONO6 | https://microservices.io/post/architecture/2023/11/13/how-modular-can-your-monolith-go-part-6-transactional-commands.html | Chris Richardson | 1차 | 원문 대조 |
| CR-QCON | https://www.slideshare.net/chris.e.richardson/qconsf-acid-is-so-yesterday-maintaining-data-consistency-with-sagas | Chris Richardson (슬라이드) | 1차 | WebFetch 추출만(요약) |
| MSIO-CQRS | https://microservices.io/patterns/data/cqrs.html | Chris Richardson | 1차 | 원문 대조, 그림 [봄] |
| MSIO-ES | https://microservices.io/patterns/data/event-sourcing.html | Chris Richardson | 1차 | 원문 대조, 그림 [봄] |
| FOWLER-ES | https://martinfowler.com/eaaDev/EventSourcing.html | Martin Fowler | 1차 | 원문 대조 |
| FOWLER-CQRS | https://martinfowler.com/bliki/CQRS.html | Martin Fowler | 1차 | 원문 대조, 그림 [봄] |
| FOWLER-ED | https://martinfowler.com/articles/201701-event-driven.html | Martin Fowler | 1차 | 원문 대조 |
| GY-CQRS | CQRS Documents — https://cqrs.wordpress.com/wp-content/uploads/2010/11/cqrs_documents.pdf | Greg Young | 1차 | PDF 텍스트 추출, Fig 12·17 [봄] |
| GY-VER | Versioning in an Event Sourced System — https://leanpub.com/esversioning/read | Greg Young | 1차 | 목차만 열림, 인용 안 함 |
| UDI | https://udidahan.com/2009/12/09/clarified-cqrs/ | Udi Dahan | 1차 | 원문 대조(절 제목 포함) |
| KLEPP | https://www.confluent.io/blog/turning-the-database-inside-out-with-apache-samza/ | Martin Kleppmann (Confluent 블로그, 2015) | 1차 | 원문 대조 |
| AWS-SO | https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/saga-orchestration.html | AWS | 1차 | 에이전트 [봄] + 원문 대조 |
| AWS-SC | https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/saga-choreography.html | AWS | 1차 | 에이전트 [봄] + 원문 대조 |
| AWS-ES | https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/event-sourcing-pattern.html | AWS | 1차 | 에이전트 [봄] + 원문 대조 |
| AWS-CQRS | https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-data-persistence/cqrs-pattern.html | AWS | 1차 | 에이전트 [봄] |
| AWS-DECOMP | https://docs.aws.amazon.com/prescriptive-guidance/latest/patterns/decompose-monoliths-into-microservices-by-using-cqrs-and-event-sourcing.html | AWS | 1차 | 에이전트 |
| TEMPORAL | https://docs.temporal.io/design-patterns/saga-pattern | Temporal | 1차 | 에이전트 + 원문 대조 |
| CAMUNDA | https://docs.camunda.io/docs/components/modeler/bpmn/compensation-events/ | Camunda | 1차 | 에이전트 [봄] + 원문 대조 |
| AXON | https://docs.axoniq.io/axon-framework-reference/4.11/sagas/implementation/ · …/4.11/events/event-processors/ · …/4.12/events/event-versioning/ | AxonIQ | 1차 | 에이전트(일부 원문, 일부 요약) |
| KURRENT | https://docs.kurrent.io/getting-started/concepts · https://docs.kurrent.io/clients/java/v1.1/appending-events | Kurrent | 1차 | 에이전트 [봄](요약) |
| MARTEN | https://martendb.io/scenarios/command_handler_workflow.html · https://martendb.io/tutorials/read-model-projections | Marten (JasperFx) | 1차 | 에이전트 [봄](요약) |
| NETFLIX | https://netflixtechblog.com/scaling-event-sourcing-for-netflix-downloads-episode-2-ce1b54d46eec | Netflix (2017) | 1차(사례) | 에이전트, Wayback 사본 [봄] |
| UBER | https://www.uber.com/us/en/blog/fulfillment-platform-rearchitecture/ | Uber (2021) | 1차(사례) | 에이전트 [봄], 재대조 실패(406) |
| ZALANDO | https://engineering.zalando.com/posts/2025/03/event-driven-to-api.html | Zalando (2025) | 1차(사례) | 에이전트 [봄] |
| WIX | https://www.wix.engineering/post/the-reactive-monolith-how-to-move-from-crud-to-event-sourcing | Wix (2021) | 1차(사례) | 에이전트 [봄] |
| TOSS | SLASH24 「보상 트랜잭션으로 분산 환경에서도 안전하게 환전하기」 — https://static.toss.im/slash24/QR/slash24-23.pdf (세션 https://toss.im/slash-24/sessions/24) | 토스뱅크 (2024) | 1차(사례) | 에이전트, 슬라이드 76장 [봄] |
| KAKAOPAY | https://tech.kakaopay.com/post/msa-transaction/ | 카카오페이 (2022) | 1차(사례) | 에이전트 [봄] + 원문 대조 |
| WOOWA-STORE | https://techblog.woowahan.com/13101/ | 우아한형제들 (2023) | 1차(사례) | 에이전트 [봄] |
| ARCHIFY | `references/archify/archify/recipes/scenarios.mjs` (로컬, 읽기 전용) | archify (MIT) | 1차 | 전문 읽음 |

에이전트는 다음 사례도 보고했지만 이 문서에서는 인용하지 않았다. 그림이나 설계 결정이 약하거나 URL 기록이 없어서다: 우아한형제들 회원시스템(outbox, https://techblog.woowahan.com/7835/), 컬리 outbox·재시도 토픽(https://helloworld.kurly.com/blog/2026-outbox-pattern-and-retry-topic/), 토스증권 CQRS 리니지, Airbnb 결제 오케스트레이션, Shopify.

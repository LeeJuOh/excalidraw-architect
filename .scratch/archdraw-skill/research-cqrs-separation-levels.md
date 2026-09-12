# CQRS 분리 단계 · 읽기 모델 동기화 축 — 1차 출처 조사

조사일 2026-09-12.

**확인 방법.** 10개 페이지를 직접 열었다. 대부분은 `curl`로 원문 HTML/PDF를 받아 텍스트로 변환한 뒤 문장을 눈으로 대조했다(Fowler 2종, Dahan, Marten, Richardson, Axon 3종, Young PDF는 `pdftotext`). Azure 2종과 AWS는 WebFetch가 문서 본문을 통째로 반환해 그것을 인용했다.

**표시 규칙.**
- 표시 없는 인용 = 원문 텍스트를 직접 받아 대조함.
- `(요약)` = 요약 모델이 돌려준 문장만 있고 원문 대조를 못 함.
- `(전문)` = WebFetch가 요약이 아니라 문서 본문 전체를 반환함. 인용은 그 본문 기준.
- 주장마다 URL과 절 제목을 붙인다. 출처에 없으면 "출처 없음"이라고 적는다. 지어내지 않는다.

---

## §1 결론: 출처로 확인된 분리 단계

**핵심.** *분리 단계를 명시적으로 번호 매겨 문서화한 곳은 Azure 하나뿐이고, 거기서는 2단계다.* Azure는 "The following sections describe **two primary approaches** to implement read model and write model separation in CQRS."라고 못박는다(§Separate read models and write models). 나머지 출처는 단계 이름 없이 변형(variation)으로만 서술한다. 4단계 사다리는 어느 1차 출처에도 없다.

| 후보 단계 | 출처가 부르는 이름 | 인용 | URL · 절 |
|---|---|---|---|
| **(a) 코드/경로만 분리** (같은 모델·같은 저장소) | 이름 없음. Young은 "a read side and a write side", Fowler는 변형으로만 언급 | Young: "The service has been split into two separate services, a read side and a write side or the Command side and the Query side." — 이 시점에 데이터 모델은 아직 하나다. 뒤에서 "It really begs the question of **whether the two should exist reading the same data model** or perhaps they can be treated as if they were two integrated systems." | Young PDF §Command and Query Responsibility Segregation / §Origins (p.18–19), §The Command Side (p.23) |
| (a) 계속 | 이름 없음 | Fowler: "The two models might not be separate object models, it could be that **the same objects have different interfaces for their command side and their query side**, rather like views in relational databases. But usually when I hear of CQRS, they are clearly separate models." | https://martinfowler.com/bliki/CQRS.html (6번째 문단) |
| **(b) 모델 분리, 저장소 공유** | **"Separate models in a single data store"** = "the foundational level of CQRS", "a basic CQRS architecture" | Azure: "This approach represents **the foundational level of CQRS**, where both the read and write models **share a single underlying database** but maintain distinct logic for their operations. A basic CQRS architecture allows you to delineate the write model from the read model while relying on a shared data store." | https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs §Separate read models and write models → #### Separate models in a single data store (전문) |
| (b) 계속 | 이름 없음 | Fowler: "There's room for considerable variation here. **The in-memory models may share the same database**, in which case the database acts as the communication between the two models." | https://martinfowler.com/bliki/CQRS.html (5번째 문단) |
| (b) 계속 | **"Thin Read Layer"** | Young: "The domain has been bypassed. There is now a new concept called a **"Thin Read Layer"**. This layer **reads directly from the database** and projects DTOs." / "One benefit of the separate read layer is that it will not suffer from an impedance mismatch. It is connected directly to the data model." | Young PDF §The Query Side (p.20–21) |
| **(c) 같은 DB 안의 읽기 전용 테이블·뷰·MV** | **출처 없음** (아래 주석 참조) | — | — |
| **(d) 저장소까지 분리** | **"Separate models in different data stores"** = "A more advanced CQRS implementation" | Azure: "**A more advanced CQRS implementation** uses distinct data stores for the read and write models. Separation of the read and write data stores allows you to scale each model to match the load. It also enables you to use a different storage technology for each data store." | https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs §#### Separate models in different data stores (전문) |
| (d) 계속 | **"real-time ReportingDatabase"** | Fowler: "However they may also use **separate databases**, effectively making the query-side's database into a **real-time ReportingDatabase**. In this case there needs to be some communication mechanism between the two models or their databases." | https://martinfowler.com/bliki/CQRS.html (5번째 문단) |
| (d) 계속 | **"Separated Data Models with CQRS"** (Figure 12) | Young: "…perhaps they can be treated as if they were **two integrated systems**… The two distinct data sources allow the data models to be optimized to the task at hand. As an example the Read side can be modeled in 1NF and the transactional model could be modeled in 3nf." | Young PDF §The Command Side (p.23), Figure 12 |
| (d) 계속 | **"query data store"** (별도 저장소) | Dahan: "How about we create an **additional data store** whose data can be a bit out of sync with the master database – I mean, the data we're showing the user is stale anyway, so why not reflect in the data store itself." | https://udidahan.com/2009/12/09/clarified-cqrs/ §Queries, §Query Data Storage |
| (d) 계속 | **"view database"** | Richardson: "Define a **view database**, which is a read-only 'replica' that is designed specifically to support that query, or a group related queries." | https://microservices.io/patterns/data/cqrs.html §Solution |
| (d) 계속 | 이름 없음. "read replicas" / DB 조합 열거 | AWS: "The command side handles `create`, `update`, and `delete` requests. The query side runs the `query` part by using the **read replicas**." + RDBMS↔RDBMS, RDBMS↔NoSQL, NoSQL↔NoSQL, NoSQL↔RDBMS 4가지 조합 열거 | https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-data-persistence/cqrs-pattern.html (전문) |

### 확인 못 한 단계

**(c) 같은 DB 안에 읽기 전용 테이블·뷰·머티리얼라이즈드 뷰를 두는 단계 — 1차 출처에서 "CQRS 분리 단계"로 문서화된 곳 없음.** 근거:

- Azure CQRS 문서는 머티리얼라이즈드 뷰를 **(d) 별도 저장소 절 안에** 넣는다: "The read data store can use its own data schema that's optimized for queries. For example, it can store a [materialized view] of the data to avoid complex joins or O/RM mappings." → 같은 DB가 아니라 분리된 읽기 저장소의 이야기다.
- Azure Materialized View 문서는 같은 저장소 배치를 **배제하진 않지만** 단계로 서술하지 않는다: "Consider where you'll store the view. **The view doesn't have to be located in the same store or partition as the original data.** It can be a subset from a few different partitions combined." (§Issues and considerations) — "같은 곳에 둘 필요 없다"는 말이지 "같은 곳에 두는 것이 한 단계다"가 아니다.
- Fowler의 "rather like views in relational databases"는 **객체 인터페이스에 대한 비유**이지 실제 DB 뷰를 두라는 말이 아니다. (a) 항목의 문장을 끝까지 읽으면 주어가 "The two models…the same objects"임이 분명하다. 이 문장을 (c)의 근거로 쓰면 오독이다.
- Young PDF에는 같은 DB 내 읽기 전용 뷰/MV 단계가 없다. 목차 전체를 확인했다(아래 §3).

---

## §2 동기 / 비동기 축

**결론: 이 축을 나란히 이름 붙여 구분하는 1차 출처는 Marten과 Axon이다.** 둘 다 프레임워크 공식 문서이고, 이름·실행 시점·대가를 모두 명시한다. Young은 축의 존재를 한 문장으로 인정하고, 나머지 출처는 사실상 비동기만 서술한다.

### Marten — Inline / Async / Live (3종, 이름이 API 상수다)

세 수명주기를 한 자리에서 정의한다(§Projections 상단 목록).

- **Inline**: "Inline Projections (`ProjectionLifecycle.Inline`) are executed **at the time of event capture and in the same unit of work** to persist the projected documents" → **쓰기와 같은 작업 단위**임이 원문으로 확인된다.
- **Async**: "Asynchronous Projections (`ProjectionLifecycle.Async`) are executed by **a background process (eventual consistency)**"
- **Live**: "Live Aggregations (`ProjectionLifecycle.Live`) are executed **on demand** by loading event data and creating the projected view **in memory without persisting** the projected documents" → 2단 축이 아니라 3단이다. 읽기 시점 계산이라는 제3의 선택지가 있다.

**대가 (Marten 원문):**
- Inline의 대가: 메타데이터 제약. "some event metadata (`IEvent.Version` and `IEvent.Sequence`) is **not available during the execution of inline projections** when using the "Quick" append mode. If you need to use this metadata in your projections, please use asynchronous or live projections, or use the "Rich" append mode." (§Inline Projections)
- Async의 대가: eventual consistency (위 정의 문장에 괄호로 명시).
- Live의 대가: 매 요청 계산. "Aggregates are calculated upon **every request** by running the event stream through them, as compared to inline projections, which are computed at event commit time and stored as documents."
- 출처: https://martendb.io/events/projections/

### Axon — Subscribing vs Streaming(Tracking) (2종)

- 축 자체: "Event Processors come in roughly **two forms: Subscribing and Streaming**." (§Event Processors)
- **Subscribing(동기)**: "Subscribing Event Processors subscribe to a source of events and are **invoked by the thread managed by the publishing mechanism**." / 하위 문서: "Furthermore, the message source will use the **same thread** that receives the events to invoke the registered Subscribing Processors." / "When a model, for example, should be updated **within the same thread that published the event**, the Subscribing Processor becomes a reasonable solution."
- **Streaming(비동기)**: "Streaming Event Processors, on the other hand, **pull their messages from a source using a thread that it manages itself**." / "Furthermore, Streaming Processors use **separate threads** to process the events retrieved from the `StreamableMessageSource`." `(요약)` / "Even though **events are processed asynchronously from their publisher**, it is often desirable to process certain events in their publishing order." (§Sequential processing)

**대가 (Axon 원문):**
- Subscribing 실패 처리: "A Subscribing Event Processor will **report a publication error to the component that provided the event**." (§Error handling) — 즉 실패가 발행자에게 되돌아간다. 하위 문서에 "Whenever the error handler rethrows an exception, the `SubscribingEventProcessor` will have it **bubble up to the publishing component** of the event." `(요약)`
- Subscribing 범위 제약: "The simple bus solution makes the `SubscribableMessageSource` and thus the Subscribing Processor an approach to only receive _current_ events." `(요약)` → 과거 이벤트 replay 불가.
- Streaming 실패 처리: "In the case of a Streaming Event Processor, this means the processor will **go into error mode, releasing any tokens and retrying at an incremental interval (starting at 1 second, up to max 60 seconds)**."
- Streaming의 이득: 토큰 기반 replay. "the token provides a means to replay events by adjusting the position of tokens." `(요약)`
- 출처: https://docs.axoniq.io/axon-framework-reference/4.11/events/event-processors/ 및 `/subscribing/`, `/streaming/`

**⚠️ 주의 — Axon이 "같은 트랜잭션"이라고 말하지는 않는다.** 4.11 페이지 3개를 원문 대조했지만 Subscribing을 "same **transaction**"으로 규정하는 문장은 **찾지 못했다**. 확인되는 것은 "same **thread**"와 "발행자에게 예외가 되돌아간다"까지다. 같은 페이지의 §Transaction management는 프로세서 일반의 `TransactionManager` 설정 이야기이고("Axon uses the `TransactionManager` to attach a transaction to every Unit of Work."), Subscribing 전용 규정이 아니다. **"Axon subscribing = 쓰기와 같은 트랜잭션"이라고 쓰면 출처를 넘어선다.** 같은 트랜잭션임을 원문으로 못박은 곳은 Marten("same unit of work")이다.

### Young — 축을 한 문장으로 인정

"There are many well known integration patterns between multiple data sources in order to maintain synchronisity **either in a consistent or eventually consistent fashion**." (§The Command Side, p.23) → 동기/비동기 두 선택지를 나란히 둔다. 다만 각각에 이름을 붙이거나 대가를 나눠 적지는 않는다. 권고는 이벤트 쪽이다: "The model that is best suited is the introduction of events, events are a well known integration pattern and offer the best mechanism for model synchronization."

Young의 쪽별 일반 원칙: "Command: It is far easier to process transactions with consistent data than to handle all of the edge cases that eventual consistency can bring into play. / **Query: Most systems can be eventually consistent on the Query side.**" (p.19)

### Dahan — 트랜잭션 경계가 "이벤트 발행"까지다 (오독 주의)

Dahan은 **커맨드 처리와 이벤트 발행**을 한 트랜잭션으로 묶고, **읽기 저장소 갱신은 별도 비동기 컴포넌트**에 맡긴다. 두 문장이 붙어 있어 혼동하기 쉽다.

- "The publishing of the event is done **transactionally together with the processing of the command and the changes to its database**. That way, any kind of failure on commit will result in the event not being sent."
- "**The autonomous component which processes those events and updates the query data store** is fairly simple, translating from the event structure to the persistent view model structure."
- 대가(stale 읽기)를 전제로 깔고 시작한다: "Staleness refers to the fact that in a collaborative environment, once data has been shown to a user, that same data may have been changed by another actor – it is stale." (§Why CQRS) / "Since your queries are now being performed off of a separate data store than your master database, and **there is no assumption that the data that's being served is 100% up to date**, you can easily add more instances of these stores." (§Scaling Queries)
- 출처: https://udidahan.com/2009/12/09/clarified-cqrs/ §Keeping the query store in sync, §Why CQRS, §Scaling Queries

### 비동기만 서술하는 출처 (대가 문장)

- **Azure CQRS** (§Problems and considerations): "**Eventual consistency.** When the read databases and write databases are separated, the read data might **not show the most recent changes immediately**. This delay results in **stale data**. Ensuring that the read model store stays up-to-date with changes in the write model store can be challenging. Also, **detecting and handling scenarios where a user acts on stale data** requires careful consideration." (전문)
- **Azure CQRS** (§Separate models in different data stores) — 실패 시 처리를 구체적으로 지시한다: "Because you usually **can't enlist message brokers and databases into a single distributed transaction**, consistency problems can occur when you update the database and publish events. Use the **Transactional Outbox pattern** to persist the state change and event atomically, and make the read-model consumer **idempotent** to tolerate duplicate delivery." (전문)
- **Azure Materialized View** — 갱신 시점을 3가지로 나열하고 쓰기 부담을 경고한다: "When the source data for the view changes, the view must be updated to include the new information. You can **schedule this to happen automatically, or when the system detects a change to the original data**. In some cases it might be necessary to **regenerate the view manually**." / "Ideally it'll regenerate in response to an event indicating a change to the source data, although this **can lead to excessive overhead if the source data changes rapidly**." (§Solution, §Issues and considerations) → 쓰기 지연 대가를 명시한 드문 문장.
- **Azure Materialized View** (§When to use this pattern, 부적합 조건): "**Consistency is a high priority.** The views might not always be fully consistent with the original data."
- **Richardson** (§Resulting context, drawbacks): "**Replication lag/eventually consistent views**" / 갱신 방식: "The application keeps the database up to date by **subscribing to Domain events** published by the service that own the data." (§Solution)
- **AWS** (§CQRS pattern): "After the command is stored in the write database, **events are triggered to update the data in the read (query) database**." / 굵은 경고: "**Important** — The CQRS pattern typically results in **eventual consistency** between the data stores." / 채택 조건: "**Eventual consistency is acceptable for the read queries**." (전문)
- **Fowler**: 단계 이름은 없지만 인과를 짚는다. "Having separate models raises questions about how hard to keep those models consistent, which **raises the likelihood of using eventual consistency**."

---

## §3 출처 간 충돌 · 못 찾은 것

1. **단계 수가 출처마다 다르다.** Azure만 2단계로 명시("two primary approaches"). Fowler는 단계가 아니라 "considerable variation"으로 서술하며 같은 DB / 별도 DB / 같은 객체의 다른 인터페이스 3가지를 나열만 한다. Young은 서사적 진행(서비스 분리 → Thin Read Layer → 분리된 데이터 모델)이지 번호 매긴 단계가 아니다. **"CQRS는 N단계다"라고 단정하는 1차 출처는 없다.**
2. **(c) 같은 DB 내 읽기 전용 뷰/MV 단계는 어디에도 없다.** Azure는 MV를 별도 읽기 저장소 쪽에 놓고, MV 패턴 문서는 위치를 열어둘 뿐 CQRS 단계로 엮지 않는다. §1 각주 참조.
3. **Axon의 "같은 트랜잭션"은 확인 실패.** "same thread"까지만 확인됨. §2 경고 참조.
4. **Fowler CommandQuerySeparation 페이지는 CQRS를 한 번도 언급하지 않는다.** 원문 전체(444단어)를 확인했다. Meyer의 메서드 수준 분리만 다룬다: "we should divide an object's methods into two sharply separated categories: Queries… Commands…". 2005년 글이다. **CQS와 CQRS의 차이를 그 페이지에서 인용할 수는 없다.** 연결은 반대 방향으로만 존재한다 — CQRS 페이지가 "which it refers to as Command and Query respectively **following the vocabulary of CommandQuerySeparation**"라고 어휘 출처로만 인용한다. (https://martinfowler.com/bliki/CommandQuerySeparation.html)
5. **Young PDF에 "Direct to DTO" 절은 없다.** 목차 전체를 확인했다. §Command and Query Responsibility Segregation 아래는 Origins / The Query Side / The Command Side 3개뿐이고, "Thin Read Layer"는 절 제목이 아니라 §The Query Side(p.20) 본문의 용어다. "Direct to DTO"·"Going Direct to the Database" 문자열은 문서 전체에 없다. 가장 근접한 표현은 §Cost Analysis(p.51)의 "the Thin Read Layer **projecting directly to DTOs**"이다.
6. **Fowler CQRS의 그림에는 캡션도 alt 텍스트도 없다.** 원문 HTML의 `<img>` 태그를 확인했다: `images/cqrs/single-model.png`, `images/cqrs/cqrs.png` 둘 다 alt/title 속성이 없다. **그림에서 인용할 문구는 존재하지 않는다.** 공유 DB 근거는 본문 5번째 문단 문장뿐이다.
7. **Dahan 오독 위험.** "transactionally together with the processing of the command"는 **이벤트 발행**에 걸리는 말이지 읽기 저장소 갱신이 동기라는 뜻이 아니다. §2 참조.
8. **Azure 문서에 함정 하나.** "The read data store **can be a read-only replica of the write store** or have a different structure."(§Separate models in different data stores) — 읽기 전용 복제본은 (d)의 한 형태로 서술되지 (b)나 (c)가 아니다. AWS의 "read replicas"도 같은 위치다.
9. **모두 열람 성공.** 목록 10개 페이지 전부 열렸다. Young PDF만 WebFetch가 바이너리를 파싱하지 못해 `pdftotext`로 재처리했다(56페이지, 본문 1996줄 확보).

---

## §4 출처 목록

| URL | 소유자 | 확인 상태 |
|---|---|---|
| https://martinfowler.com/bliki/CQRS.html | Martin Fowler (원 저자) | 원문 대조 완료 (curl, 1229단어 전문) |
| https://martinfowler.com/bliki/CommandQuerySeparation.html | Martin Fowler (원 저자) | 원문 대조 완료 (curl, 444단어 전문). **CQRS 언급 0회** |
| https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs | Microsoft (공식 문서) | WebFetch가 본문 전체 반환 `(전문)`. 분리 단계 2종 명시 |
| https://learn.microsoft.com/en-us/azure/architecture/patterns/materialized-view | Microsoft (공식 문서) | WebFetch가 본문 전체 반환 `(전문)` |
| https://cqrs.wordpress.com/wp-content/uploads/2010/11/cqrs_documents.pdf | Greg Young (원 저자) | 원문 대조 완료 (`pdftotext`, 56p/1996줄). 목차·Thin Read Layer·Figure 12 확인 |
| https://udidahan.com/2009/12/09/clarified-cqrs/ | Udi Dahan (원 저자) | 원문 대조 완료 (curl, 본문 + 절 제목) |
| https://microservices.io/patterns/data/cqrs.html | Chris Richardson (원 저자) | 원문 대조 완료 (curl) |
| https://martendb.io/events/projections/ | Marten (프레임워크 공식) | 원문 대조 완료 (curl). Inline/Async/Live 정의 문장 확인 |
| https://docs.axoniq.io/axon-framework-reference/4.11/events/event-processors/ | AxonIQ (프레임워크 공식) | 원문 대조 완료 (curl) |
| https://docs.axoniq.io/axon-framework-reference/4.11/events/event-processors/subscribing/ | AxonIQ (프레임워크 공식) | 원문 대조 완료 (curl). "same thread" 확인, "same transaction" **미확인** |
| https://docs.axoniq.io/axon-framework-reference/4.11/events/event-processors/streaming/ | AxonIQ (프레임워크 공식) | 원문 대조 완료 (curl) |
| https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-data-persistence/cqrs-pattern.html | AWS (공식 문서) | WebFetch가 본문 전체 반환 `(전문)` |

추가로 연 1차 출처: 없음. 목록 10개로 두 질문 모두 답이 나왔다.

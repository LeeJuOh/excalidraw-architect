# 비동기·데이터 묶음 — 이벤트 토폴로지 · 큐·배치 파이프라인 · 데이터 흐름·파생 데이터 · 마이그레이션

> 조사일 2026-09-12 · 대상: [검수 인계](review.md) R09 다음 질문 6 "리서치 실행" ②의 네 묶음 중 **비동기·데이터**. 행을 제안하기 전에 근거를 모은다. 행을 결정하는 문서는 아니다.
> **확인 방법.** 1차 출처를 직접 열었다. 핵심 인용 15개는 원문 HTML·Markdown을 다시 받아 문장 단위로 재대조했다. 그림 2장은 이미지 파일을 받아 직접 봤다.
> 표시: **[원문]** 원문에서 재대조함 / **(요약)** WebFetch 요약 모델을 거쳐 원문 재대조를 못 함 / **[봄]** 그림 직접 봄 / **[alt]** alt·캡션·본문으로만 앎.
> **표기.** `[ID §절]`은 §5 출처 ID와 원문 절 제목이다. **(추론)**은 출처가 아니라 이 문서의 판단이다.
> **로컬 확인.**
> - `wiki/index.md`: 347줄 전문 읽음. 이벤트·큐·배치·계보·마이그레이션 페이지 없음. 가장 가까운 것은 `canva-session-revocations`(캐시 콜드스타트)로 네 행과 무관.
> - `raw-articles/`: 88개 중 `kafka|queue|batch|pipeline|stream|lineage|migrat|outbox|cdc|debezium|backpressure|dlq|event|data|etl|flink|beam|spark` 매칭 0건.
> - archify `scenarios.mjs`: 레시피 11개 전문 읽음. 이 묶음과 겹치는 것은 `event-stream`·`data-lineage` 둘. **큐·배치 파이프라인과 마이그레이션에 대응하는 레시피는 없다.**
> - **Kafka 공식 사이트 주의.** `kafka.apache.org/documentation/`은 20KB JS 셸이라 본문 인용이 불가능했다(버전별 정적 페이지 `/36/`·`/34/`도 같은 셸, `kafka-site` 미러는 404). 그래서 같은 문서의 원본인 `apache/kafka` 레포 `docs/*.md`를 인용한다(§4-11).

## 1. 요약

### 네 행 제안

| 상황 | 답하는 질문 | 그림 종류 | 필수요소 | 경계(이럴 땐 다른 행) |
|---|---|---|---|---|
| 이벤트 토폴로지 | 이 이벤트를 누가 발행하고 누가 받으며, 실패하면 어디로 가나? | 박스-화살표 토폴로지: 발행자·토픽·구독자를 세 열로, 토픽 박스에 순서 단위, 실패 경로(재시도·DLQ)는 옆으로 빠지는 화살표. **시간축 없음** | ① 토픽·채널 이름과 이벤트 이름 ② 발행자 ③ 구독자와 컨슈머 그룹 ④ 순서 보장 단위 ⑤ 전달 보장과 중복 대응 ⑥ 실패·재처리 경로 ⑦ 상태 저장소 | 시간순이 쟁점이면 API 동작의 "비동기 후속". 실패하면 무엇을 되돌리나면 saga. 원본이 이벤트 스토어면 이벤트 소싱. 처리 속도·적체가 쟁점이면 큐·배치 |
| 큐·배치 파이프라인 | 이 처리는 어디서 막히고, 얼마나 밀렸으며, 실패한 건은 어떻게 다시 도나? | 파이프라인 그래프: 노드=처리 단계, 엣지=단계 사이 흐름. 노드에 병렬 수, 엣지에 적체·처리량 라벨 | ① 처리 단계와 순서 ② 실행·재시작 단위 ③ 처리량과 적체 ④ 병렬 단위와 그 상한 ⑤ 백프레셔·흐름 제어 ⑥ 실패 처리와 재처리 경로 ⑦ 멱등성 | 저장소와 원본이 쟁점이면 데이터 흐름. 토픽 소유·구독자가 쟁점이면 이벤트 토폴로지. 단계 하나의 백오프·횟수는 재시도·분기 |
| 데이터 흐름·파생 데이터 | 이 데이터의 원본은 무엇이고, 어떤 단계를 거쳐 어디에 복제되며, 얼마나 늦어도 되나? | DFD 계열 박스-화살표: 박스=저장소·데이터 자산, 화살표=이동, 라벨=이동 방식과 주기. 외부 엔티티와 신뢰 경계 표시 | ① 원본(source of truth) 표시 ② 변환 단계 ③ 이동 방식 ④ 지연 허용치 ⑤ 저장소와 소비자 ⑥ 분류·신뢰 경계 | 처리 속도·실패 재처리가 쟁점이면 큐·배치. 원본이 이벤트 스토어면 이벤트 소싱. 읽기 모델 동기화면 CQRS와 같은 값 |
| 마이그레이션 | 지금 것에서 새 것으로 어떤 단계를 거쳐 옮기고, 각 단계에서 무엇이 어디를 읽고 쓰며, 어디까지 되돌릴 수 있나? | **단계 수만큼 같은 종류의 그림을 나란히.** 각 장은 그 단계의 읽기·쓰기 경로만 그린다. 단계 이름이 frame 제목 | ① 단계 목록과 현재 단계 ② 단계별 읽기·쓰기 경로 ③ 이중 쓰기 구간 ④ 원본 이동 시점 ⑤ 정합성 검증 방법 ⑥ 롤백 가능 구간과 만료 조건 ⑦ 정리 단계 | 다 끝난 뒤 구조면 해당 구조 행. 배포 단위 교체면 배치도. 코드 인터페이스 변경만이면 API 계약 |

### 판단

1. **네 행 모두 유지가 맞다 (추론).** 답하는 질문이 서로 다르고, 필수요소가 겹치는 칸도 같은 값을 서로 다른 이유로 요구한다(§3). 다만 **큐·배치와 데이터 흐름의 경계가 가장 약하다** — 아래 4번.
2. **"순서 보장 여부"는 그대로 두면 판단이 안 선다 (수정).** 출처는 전부 "여부"가 아니라 **단위**를 말한다. Kafka는 파티션 단위 [KAFKA-INTRO], Pub/Sub은 ordering key 단위이며 빈 키는 순서가 없다 [GPS-ORDER], SQS는 FIFO 큐에 DLQ를 붙이면 순서가 깨진다고 경고한다 [AWS-SQS-DLQ]. 값이 "예/아니오"면 그림을 봐도 키를 무엇으로 잡았는지 모른다.
3. **마이그레이션의 "before/after"는 폐기 (수정).** 1차 출처 중 두 장으로 그린 곳이 없다. Stripe 4단계 [STRIPE], Azure 4장 + DB 예제 3장 [AZ-SF], Fowler expand·migrate·contract 3장 [FOWLER-PC]. 전부 **단계 수만큼** 같은 종류의 그림을 낸다. "한 그림에 한 종류"와 충돌하지 않는다 — 각 장이 같은 종류(박스-화살표)이고 각자 한 단계에 답한다.
4. **큐·배치 × 데이터 흐름은 02에서 다시 판정 (추론).** 두 행 모두 "박스와 화살표로 흐름"을 그린다. 갈리는 지점은 **노드가 무엇이냐**다 — 큐·배치의 노드는 처리 단계(Beam PTransform, Airflow task, Spring Batch step), 데이터 흐름의 노드는 저장소·데이터 자산이다. 그런데 OpenLineage의 계보 그래프는 Job과 Dataset을 **둘 다** 노드로 갖는다 [OL]. 02 도그푸딩에서 두 질문이 한 발화로만 나오면 합친다.
5. **9/5표가 이 묶음에 준 값 중 틀린 것은 없었다.** 처리량·백프레셔·실패 처리·멱등성 넷 다 1차 출처가 뒷받침한다. 대신 **빠진 항목**이 많다(각 행 §2의 "추가" 판정).
6. **outbox·CDC를 행이 아니라 값으로 둔 기존 결정은 출처와 맞다.** outbox는 "DB 갱신과 메시지 발행의 원자성" 해법이지 그림 종류가 아니다 [MSIO-OB]. 실제 사례도 outbox를 이벤트 토폴로지 그림 안의 한 박스로 그린다 [KURLY, WOOWA-EVENT]. CDC도 데이터 흐름 그림의 화살표 라벨이다 [DBZ, AZ-SF].

## 2. 행별 조사 결과

### 2.1 이벤트 토폴로지

**질문 후보** (출처가 이 상황에서 답한다고 말하는 질문)

- "How can the sender broadcast an event to all interested receivers?" [EIP-PS §Problem] [원문]
- "Which events move through which topics, processors, groups, and failure paths?" [ARCHIFY event-stream] [원문]
- "What will the messaging system do with a message it cannot deliver?" [EIP-DLC §Problem] [원문]
- 발행자·구독자가 여럿이라는 것 자체가 질문을 만든다: "a topic can have zero, one, or many producers that write events to it, as well as zero, one, or many consumers that subscribe to these events" [KAFKA-INTRO §Main Concepts] [원문]
- PRD 사용자 발화 "이 이벤트 누가 받아"(스토리 23).

**출처의 그림**

| 출처 | 그림 종류 | 그려진 요소 | 확인 |
|---|---|---|---|
| KAFKA-STREAMS | 노드-엣지 그래프 | 원 6개가 곡선으로 연결. 라벨 "Source processor", "stream processor", "sink processor", 선에 "stream", 제목 "PROCESSOR TOPOLOGY". **박스가 아니라 원, 화살표가 아니라 무방향 선** | [봄] |
| DBZ | 박스-화살표 파이프라인 | MySQL·PostgreSQL 실린더 → 빨간 테두리 "Kafka Connect with Debezium source connectors" 안에 커넥터 박스 2개 → 회색 "Apache Kafka" 안에 토픽 3줄(각 줄이 칸 나열) → "Kafka Connect with sink connectors"(ElasticSearch·Infinispan·JDBC) → Elastic·Infinispan·Data Warehouse | [봄] |
| KAFKA-INTRO | 파티션 그림 | "This example topic has four partitions P1-P4. Two different producer clients are publishing, independently from each other, new events to the topic... Events with the same key (denoted by their color in the figure) are written to the same partition" | [alt] (캡션 [원문]) |
| EIP-PS | 채널 그림 | "It has one input channel that splits into multiple output channels, one for each subscriber." 입력 채널 1 → 구독자 수만큼 출력 채널 | [alt] (본문 [원문]) |
| EIP-DLC | 채널 그림 | 배달 못 한 메시지가 원래 목적지 대신 별도 채널로 빠지는 모양 | [alt] |
| KURLY | 아키텍처 2장 | 레거시: 외부채널 → API/폴링 → 인터페이스DB → 카프카 발행 → 리스너. 최종: 발행부(인터페이스 테이블 → 아웃박스 테이블 → 폴러 → Kafka), 수신부(메인 토픽 → 재시도 토픽 → DLT) | (요약) |
| WOOWA-EVENT | 계층도 | 어플리케이션 → SNS → SQS → 구독자. 이벤트 저장소와 재발행 배치 | (요약) |
| WOOWA-STORE | 발행-구독 흐름 | Producer → Kafka Cluster → Consumer. MSA들과 배민스토어 전시 시스템 연동. DynamoDB·Redis 이중 저장소 | (요약) |
| ARCHIFY | dataflow | producers, events, topics, ordered processors, consumer groups, state stores, replay paths, DLQ | [원문] |

→ **토폴로지 그림에 시간축을 넣은 출처가 없다.** 전부 정적 배치다. 시간순을 그린 것은 archify가 별도 레시피로 뺀 `async-roundtrip`(시퀀스)이고, 그 레시피는 "The primary question is topic topology and consumer ownership rather than time order"일 때 쓰지 말라고 명시한다 [ARCHIFY async-roundtrip §avoidWhen] [원문]. 이 행의 그림 종류에 "시간축 없음"을 적을 근거다.

**필수요소 후보**

| 후보 | 근거 인용 | 값 3종으로 채울 수 있나 |
|---|---|---|
| ① 토픽·채널 이름과 이벤트 이름 | 채널은 브로커마다 이름이 다르다 — "Depending on the protocol used, channels can be defined as a topic, queue, routing key, path, or subject" [ASYNCAPI-CH] (요약) / archify include "producers and event names" [원문] / 컬리는 메인 토픽·재시도 토픽·DLT 이름을 그림에 적는다 [KURLY] (요약) | 실제 값 / 없음 확인(단일 채널) / 확인 못 함 |
| ② 발행자 | "How can the sender broadcast an event to all interested receivers?" [EIP-PS] [원문] / "zero, one, or many producers that write events to it" [KAFKA-INTRO] [원문] / "Seller(본사 정보), Shop(지점 정보)의 정보가 변경되었을 때 Producer를 통해서 이벤트가 Kafka Cluster에 도달" [WOOWA-STORE] (요약) | 실제 값 / 없음 확인(외부 시스템이 발행) / 확인 못 함 |
| ③ 구독자와 컨슈머 그룹 | "Our topic is divided into a set of totally ordered partitions, each of which is consumed by exactly one consumer within each subscribing consumer group at any given time." [KAFKA-DESIGN §Consumer Position] [원문] / archify include "processors and consumer groups" [원문] / 구독자 수만큼 출력 채널 [EIP-PS] [원문] | 실제 값 / 없음 확인(구독자 없음 = 발행만 하고 아무도 안 받음, 드러나야 할 값) / 확인 못 함 |
| ④ 순서 보장 단위 | "Events with the same event key (e.g., a customer or vehicle ID) are written to the same partition, and Kafka guarantees that any consumer of a given topic-partition will always read that partition's events in exactly the same order as they were written." [KAFKA-INTRO] [원문] / "Messages published with the same ordering key are expected to be received in order" · "Messages with an empty ordering key are not ordered" · "ordered delivery decreases publish availability and increases end-to-end message delivery latency" [GPS-ORDER] (요약) / "Don't use a dead-letter queue with a FIFO queue if you don't want to break the exact order of messages" [AWS-SQS-DLQ] [원문] / 순서 역전 실제 사례와 보정: "이벤트의 순서가 보장되지 않는 상황에서 이벤트의 순서가 역전되는 현상이 발생될 수 있습니다" [WOOWA-STORE] (요약) | 실제 값(키 이름) / 없음 확인(순서 보장 안 함) / 확인 못 함 |
| ⑤ 전달 보장과 중복 대응 | 세 종류를 정의한다 — "_At most once_--Messages may be lost but are never redelivered. _At least once_--Messages are never lost but may be redelivered. _Exactly once_--Each message is processed once and only once." [KAFKA-DESIGN §Message Delivery Semantics] [원문] / 같은 절의 경고 "Many systems claim to provide 'exactly-once' delivery semantics, but it is important to read the fine print" [원문] / "Use Guaranteed Delivery to make messages persistent so that they are not lost even if the messaging system crashes." [EIP-GD] [원문] / outbox: "first store the message in the database as part of the transaction that updates the business entities" [MSIO-OB §Solution] [원문] / "Even when a sender application only sends a message once, the receiver application may receive the message more than once." [EIP-IR §Problem] [원문] / 실무: "Kafka 리스너에서 멱등성을 보장할 수 있는 설계가 미리 마련되어야" [KURLY] (요약) | 실제 값 / 없음 확인(보장 없음) / 확인 못 함 |
| ⑥ 실패·재처리 경로 | "When a messaging system determines that it cannot or should not deliver a message, it may elect to move the message to a Dead Letter Channel." [EIP-DLC §Solution] [원문] / "The `maxReceiveCount` is the number of times a consumer can receive a message from a source queue before it is moved to a dead-letter queue." [AWS-SQS-DLQ] [원문] / Pub/Sub은 최대 전달 시도 5~100을 설정해야 DLQ로 넘어간다 [GPS-DLQ] (요약) / "10분 간격으로 최대 24시간 동안, 즉 10분 간격으로 총 144회 재시도" 후 DLT [KURLY] (요약) / 되감기도 경로다 — "A consumer can deliberately _rewind_ back to an old offset and re-consume data." [KAFKA-DESIGN §Consumer Position] [원문] | 실제 값 / 없음 확인(DLQ 없음 = 실패가 사라짐, 드러나야 할 값) / 확인 못 함 |
| ⑦ 상태 저장소 | archify include "state, replay, and DLQ" [원문] / Kafka Streams는 상태 저장소를 토폴로지의 일부로 둔다 — "fault-tolerant local state" [KAFKA-STREAMS §Core Concepts] [원문] | 실제 값 / 없음 확인(무상태 처리기) / 확인 못 함 |

넣지 않은 것:
- **파티션 수·리텐션 설정.** 값은 있지만 "누가 받나"에 답하지 않는다. 과밀만 늘린다 (추론).
- **스키마·페이로드.** API 계약 행이 맡는다 (추론). AsyncAPI는 메시지 스키마를 같은 문서에 두지만, 그것은 문서 포맷이지 그림이 아니다.

**현재 값 판정**

| 항목 | 출처 표기 | 판정 | 근거 |
|---|---|---|---|
| 토픽명 | PRD 스토리 23 | **유지** (이름 수정: "토픽·채널 이름과 이벤트 이름") | 브로커마다 채널의 이름이 다르다 [ASYNCAPI-CH]. archify의 "event names"를 합친다 |
| 발행자 | PRD 스토리 23 / archify "발행자·이벤트 이름" | **유지** | [EIP-PS], [KAFKA-INTRO] 모두 발행자를 그림의 한 축으로 둔다 |
| 구독자 | PRD 스토리 23 | **수정** → "구독자와 컨슈머 그룹" | 구독자 목록만으로는 "같이 나눠 받는지, 따로 다 받는지"를 모른다. Kafka는 그룹 안에서 파티션당 하나만 받는다 [KAFKA-DESIGN]. archify "consumer groups"와 합친다 |
| 순서보장 여부 | PRD 스토리 23 / archify "토픽·순서 보장" | **수정** → "순서 보장 단위" | §1 판단 2 |
| 전달 보장(at-least-once·outbox·멱등키) | PRD(9/11 DDIA 추가) / archify "전달 보장" | **유지+보강** → "전달 보장과 중복 대응" | 세 종류 정의 [KAFKA-DESIGN]. 중복은 전달 보장의 따름결과라 같은 칸에 둔다 [EIP-IR] |
| 처리기·컨슈머 그룹 | archify | **유지** (③에 흡수) | 중복 이름이라 합친다 |
| 상태 저장소·재처리·DLQ | archify | **수정** → ⑥ "실패·재처리 경로"와 ⑦ "상태 저장소"로 분리 | 세 가지가 한 칸에 묶여 있어 하나만 채우고 넘어가기 쉽다. DLQ는 [EIP-DLC]·[AWS-SQS-DLQ]·[GPS-DLQ]가 독립 항목으로 다룬다 |
| (없음) | — | **추가** ⑥에 "재시도 채널" | 재시도 토픽은 DLQ와 다른 장치다. 컬리는 144회 재시도 뒤에야 DLT로 보낸다 [KURLY] |
| 그림 종류(빈 칸) | 9/5표 "pub/sub 토폴로지" | **채움** → 박스-화살표 토폴로지, 시간축 없음 | 출처의 그림이 전부 정적 배치다. "pub/sub"이라는 이름은 EIP 패턴 이름이라 유지해도 되지만, Kafka·SQS처럼 점대점 큐가 섞이면 틀린 이름이 된다 (추론) |

### 2.2 큐·배치 파이프라인

**질문 후보**

- "How can a messaging client process multiple messages concurrently?" — 앞 문장이 상황을 정의한다: "An application is using Messaging. However, it cannot process messages as fast as they're being added to the channel." [EIP-CC §Problem] [원문]
- "How can we perform complex processing on a message while maintaining independence and flexibility?" [EIP-PF §Problem] [원문]
- 어디서 막혔나: "If you see a back pressure warning (e.g. High) for a task, this means that it is producing data faster than the downstream operators can consume." [FLINK §Back Pressure] [원문]
- 실패한 건만 다시: "각 거래의 상태를 기반으로 실패 건만 선별적으로 재처리할 수 있습니다" [TOSS-SETTLE] (요약)

**출처의 그림**

| 출처 | 그림 종류 | 그려진 요소 | 확인 |
|---|---|---|---|
| BEAM | 파이프라인 DAG | "the boxes represent the parallel computations called PTransforms and the arrows with the circles represent the data (in the form of PCollections) that flows between the transforms" | (요약) |
| FLINK | job graph 색칠 | WebUI가 job graph의 태스크를 색으로 칠한다 — 파랑 idle, 빨강 busy, 검정 backpressured. 탭에는 OK(0–10%)·LOW(10–50%)·HIGH(50–100%) | (요약). 지표 이름은 [원문] — `backPressuredTimeMsPerSecond`, `idleTimeMsPerSecond`, `busyTimeMsPerSecond` |
| AIRFLOW | graph view | 노드=태스크·태스크 그룹, 엣지=의존 관계(조건·분기 라벨 가능). 선택한 DAG Run의 태스크 인스턴스 상태를 겹쳐 보여줌 | (요약) |
| SPRING-BATCH | 계층 그림 | Job → Step, JobInstance/JobExecution, ItemReader→Processor→Writer | (요약). 정의는 [원문] |
| KAKAOPAY-PART | 3장 | ① Manager Step이 분할하고 Worker Step들이 병렬 처리 ② 분할→실행→취합 3단계 ③ 건수별 처리 시간 로그 스케일 비교 그래프 | (요약) |
| KAFKA-STREAMS | 노드-엣지 그래프 | §2.1과 같은 그림 | [봄] |
| EIP-PF | 필터 사슬 | 필터가 파이프로 이어진 사슬. "Each filter exposes a very simple interface: it receives messages on the inbound pipe, processes the message..." | [alt] (본문 [원문]) |
| TOSS-SETTLE | 여러 장 | 집계 데이터 vs 거래별 개별 데이터 비교, 파티셔닝·인덱스 전략, 레거시 vs 신규 카나리 배포, 모듈러 연산 멀티스레드 분배 | (요약) |

→ **처리 단계를 노드로 두는 그래프가 공통형이다.** Beam(PTransform), Airflow(task), Kafka Streams(processor), EIP(filter)가 모두 같은 모양이다. 9/5표의 "데이터 흐름"은 노드를 저장소로 오해하게 만든다 (추론).

**필수요소 후보**

| 후보 | 근거 인용 | 값 3종으로 채울 수 있나 |
|---|---|---|
| ① 처리 단계와 순서 | "Use the Pipes and Filters architectural style to divide a larger processing task into a sequence of smaller, independent processing steps (Filters) that are connected by channels (Pipes)." [EIP-PF §Solution] [원문] / "A pipeline is a user-constructed graph of transformations that defines the desired data processing operations." [BEAM §Pipeline] [원문] / "A Step is a domain object that encapsulates an independent, sequential phase of a batch job." [SPRING-BATCH §Step] [원문] | 실제 값 / 없음 확인(단계 하나) / 확인 못 함 |
| ② 실행·재시작 단위 | "A JobInstance refers to the concept of a logical job run." [SPRING-BATCH §JobInstance] [원문] / JobExecution은 한 번의 시도이고 실패하면 여러 번 생긴다 [SPRING-BATCH §JobExecution] (요약) / "A Dag is a model that encapsulates everything needed to execute a workflow." [AIRFLOW-DAG] [원문] / backfill은 지난 구간을 다시 도는 단위다 [AIRFLOW-DAG] (요약) | 실제 값 / 없음 확인(상시 스트리밍이라 실행 단위 없음) / 확인 못 함 |
| ③ 처리량과 적체 | "it cannot process messages as fast as they're being added to the channel" [EIP-CC §Problem] [원문] / "To ensure that your subscribers are keeping up with the flow of messages, create a dashboard" [GPS-MON] (요약) / 세 지표가 합쳐 1000ms가 된다 [FLINK] [원문] / 실측 수치가 실제로 그려진다 — 100만 건 11분 22초 → 1분 53초, 500만 건 1시간 37분 25초 → 8분 55초 [KAKAOPAY-PART] (요약) / 390분 → 30분 [WOOWA-BATCH] (요약) / "하루에 수백만 케이스의 거래와 수천만 건의 데이터를 최대 10배 빠른 시간 안에 처리" [TOSS-SETTLE] (요약) | 실제 값 / 없음 확인(측정 안 함) / 확인 못 함 |
| ④ 병렬 단위와 그 상한 | "the maximum parallelism at which your application may run is bounded by the maximum number of stream tasks, which itself is determined by maximum number of partitions of the input topic(s) the application is reading from" [KAFKA-STREAMS §Parallelism Model] [원문] / "Create multiple Competing Consumers on a single channel so that the consumers can process multiple messages concurrently." [EIP-CC §Solution] [원문] / "1차 분할: 전체 처리 기간을 '월' 단위로 나누어 배치 작업을 실행 / 2차 분할: ... 다시 '일' 단위로 작업을 나누어 병렬 처리" [KAKAOPAY-PART] (요약) | 실제 값 / 없음 확인(단일 소비자) / 확인 못 함 |
| ⑤ 백프레셔·흐름 제어 | "The purpose of Reactive Streams is to provide a standard for asynchronous stream processing with non-blocking backpressure." [RS §Reactive Streams] [원문] / "backpressure is an integral part of this model in order to allow the queues which mediate between threads to be bounded" [RS §Goals, Design and Scope] [원문] / "Since back-pressure is mandatory the use of unbounded buffers can be avoided." [RS] [원문] / "If a task has no available output buffers, then that task is considered back pressured." [FLINK] (요약) / 흐름 제어를 손으로 넣은 사례 — 청크 실행 후 200밀리초 지연 리스너 [WOOWA-BATCH] (요약) | 실제 값 / **없음 확인(흐름 제어 없음 = 버퍼가 무한히 자람, 드러나야 할 값)** / 확인 못 함 |
| ⑥ 실패 처리와 재처리 경로 | 상태가 곧 실패 경로다 — "up_for_retry: The task failed, but has retry attempts left and will be rescheduled." · "upstream_failed: An upstream task failed and the Trigger Rule says we needed it" [AIRFLOW-TASK §Task Instances] [원문] / "execution_timeout controls the maximum time allowed for every execution" [AIRFLOW-TASK §Timeouts] [원문] / maxReceiveCount 초과 시 DLQ [AWS-SQS-DLQ] [원문] / "실패 건만 선별적으로 재처리" [TOSS-SETTLE] (요약) | 실제 값 / 없음 확인 / 확인 못 함 |
| ⑦ 멱등성 | "Design a receiver to be an Idempotent Receiver--one that can safely receive the same message multiple times." [EIP-IR §Solution] [원문] / 재시도가 있으면 반드시 따라온다 [KURLY] (요약) | 실제 값 / 없음 확인 / 확인 못 함 |

넣지 않은 것:
- **청크 사이즈·커밋 간격.** 값은 있지만([KAKAOPAY-PART] "두 방식 모두 chunkSize는 1,000으로 동일하게 설정") ④ 병렬 단위의 하위 값이다 (추론). 02에서 따로 필요해지면 승격.
- **윈도·워터마크.** [BEAM]의 "A watermark is a guess as to when all data in a certain window is expected to have arrived" [원문]은 스트리밍 집계에만 해당한다. 배치·큐에는 "없음 확인"만 반복될 것이다 (추론). 제거 후보로도 올리지 않고 아예 넣지 않는다.

**현재 값 판정**

| 항목 | 출처 표기 | 판정 | 근거 |
|---|---|---|---|
| 처리량 | 9/5표 | **유지+보강** → "처리량과 적체" | 처리량만으로는 밀렸는지 모른다. 적체는 별도 지표다 [GPS-MON, FLINK] |
| 백프레셔 | 9/5표 | **유지** | [RS]가 이 말의 1차 정의다. 표현은 "백프레셔·흐름 제어"로 넓힌다 — SQS·Pub/Sub에는 백프레셔 기제가 없어 "없음 확인"이 정답인 경우가 있다(§4-4) |
| 실패 처리 | 9/5표 | **수정** → "실패 처리와 재처리 경로" | "처리"만 있으면 재시도·DLQ·선별 재처리 중 무엇인지 안 적힌다 [AIRFLOW-TASK, AWS-SQS-DLQ, TOSS-SETTLE] |
| 멱등성 | 9/5표 둘째 버전 | **유지** | [EIP-IR] |
| (없음) | — | **추가** ① 처리 단계와 순서 | 출처 넷이 모두 단계를 노드로 그린다. 이게 없으면 그림 자체가 성립 안 한다 |
| (없음) | — | **추가** ② 실행·재시작 단위 | 배치는 "어디부터 다시 도나"가 판단의 중심이다 [SPRING-BATCH] |
| (없음) | — | **추가** ④ 병렬 단위와 그 상한 | 상한이 입력 파티션 수로 막힌다는 것은 그림에 없으면 오판한다 [KAFKA-STREAMS] |
| 그림 종류 | 9/5표 "데이터 흐름" | **수정** → 파이프라인 그래프(노드=처리 단계) | §2.2 그림 표. "데이터 흐름"은 16번 행의 이름이라 그대로 두면 두 행이 같은 그림으로 읽힌다 (추론) |
| 답하는 질문(빈 칸) | 없음 | **채움** | [EIP-CC §Problem], [FLINK §Back Pressure], [TOSS-SETTLE] |

### 2.3 데이터 흐름·파생 데이터

**질문 후보**

- "Where does data come from, how does it change, and who consumes it?" [ARCHIFY data-lineage] [원문]
- "Which root input columns are used to construct column x?" [OL-CL] (요약)
- 파생 데이터의 정의가 질문을 만든다: "If you lose your cache, you can rebuild it from the underlying database; thus, the contents of the cache are derived from the database." [KLEPP] (요약)
- PRD 구어 "이 데이터 어디서 와서 어디로 가?"

**출처의 그림**

| 출처 | 그림 종류 | 그려진 요소 | 확인 |
|---|---|---|---|
| DBZ | 박스-화살표 | §2.1과 같은 그림. **원본 DB(실린더) → 커넥터 → 토픽 → 싱크 커넥터 → 소비 시스템**. 이동 방식이 박스 이름으로 드러난다 | [봄] |
| OL | 객체 모델 | Job(Datasets를 소비·생산하는 프로세스), Run(Job의 시점 인스턴스), Dataset(이산적인 데이터의 추상) | [원문] |
| AZ-SF (DB 예제) | 3장 | ① 새 시스템이 레거시 DB를 읽고 씀 ② 새 도메인 DB 추가, ETL 초기 적재 + CDC 동기화, 레거시는 계속 읽고 씀 ③ 도메인 DB로 컷오버, 레거시 도메인 데이터 제거. 그림 옆 주석 셋: 라우팅 책임 이동 / 정합성 검증 완료 / "rollback is possible until the legacy database is fully decommissioned" | [alt] (alt 전문 [원문]) |
| DBT-FRESH | DAG | source 함수가 모델과 소스 사이 의존을 만든다 — "Using the `{{ source () }}` function also creates a dependency between the model and the source table." | (요약) |
| KAKAOPAY-FF | 4장 | 어드민-서빙 분리, 스케일아웃 시 어드민 집중, 폴링 흐름과 지연 구간, Redis를 매개로 한 비동기 경로 | (요약) |
| OWASP-TM | DFD | "trust boundaries, data flows, data stores, processes, and the external entities which may interact with the system" | (요약) |
| ARCHIFY | dataflow | sources and assets, transform stages, classification or consent, stores and consumers | [원문] |

**필수요소 후보**

| 후보 | 근거 인용 | 값 3종으로 채울 수 있나 |
|---|---|---|
| ① 원본(source of truth) 표시 | "Instead, you write to the log, and there is an explicit transformation process which takes the data on the log and applies it to the materialized views." [KLEPP] (요약) / "the new domain database is the system of record for that domain" [AZ-SF §Example] [원문] / "어드민 서버는 복잡한 피처 플래그의 설정 정보 생성 및 수정하며 데이터의 영속성 관리" [KAKAOPAY-FF] (요약) | 실제 값 / **없음 확인(원본이 둘 = 이중 원본, 드러나야 할 값)** / 확인 못 함 |
| ② 변환 단계 | transformation에 type(DIRECT/INDIRECT)·subtype(IDENTITY, AGGREGATION, SORT, FILTER)·description·masking이 붙는다 [OL-CL] (요약) / "A PTransform (or transform) represents a data processing operation, or a step, in your pipeline." [BEAM] (요약) / archify include "transform stages" [원문] | 실제 값 / 없음 확인(그대로 복제) / 확인 못 함 |
| ③ 이동 방식 | CDC의 구체형 — "The MySQL connector uses a client library for accessing the binlog. The PostgreSQL connector reads from a logical replication stream." [DBZ §Architecture] [원문] / "A change data capture (CDC) process syncs the domain data from the monolithic database to the new domain database." [AZ-SF §Example] [원문] / 세 선택지를 비교한 사례 — 직접 호출 / "주기적인 polling을 통해 어드민 서버의 설정 정보를 로컬 캐시에 저장" / 이벤트 기반, 최종적으로 Redis Pub/Sub + 로컬 캐시 [KAKAOPAY-FF] (요약) / archify prompt "distinguish streaming from batch paths" [원문] | 실제 값 / 없음 확인(같은 저장소) / 확인 못 함 |
| ④ 지연 허용치 | 임계값을 값으로 적는 표준형이 있다 — `freshness: warn_after: {count: 12, period: hour} / error_after: {count: 24, period: hour}` [DBT-FRESH] (요약) / 계산하려면 기준 칸이 필요하다 — "the `loaded_at_field` is required to calculate freshness for a table" [DBT-FRESH] (요약) / 폴링의 대가 "다음 polling이 일어날 때까지 장애가 유지" [KAKAOPAY-FF] (요약) | 실제 값(수치) / 없음 확인(동기 반영) / 확인 못 함 |
| ⑤ 저장소와 소비자 | "A Job is a process that consumes or produces Datasets." [OL §Job] [원문] / "A Dataset is an abstract representation of data... For databases, this should be a table." [OL §Dataset] [원문] / 그림에서 소비 시스템이 끝단에 선다 [DBZ] [봄] | 실제 값 / 없음 확인(소비자 없음 = 아무도 안 쓰는 파생 데이터) / 확인 못 함 |
| ⑥ 분류·신뢰 경계 | "it is important that the solution provides a clear view of trust boundaries, data flows, data stores, processes, and the external entities which may interact with the system" [OWASP-TM] (요약) / masking 플래그가 컬럼 단위로 붙는다 [OL-CL] (요약) / archify include "classification or consent" [원문] | 실제 값 / 없음 확인(민감 데이터 없음) / 확인 못 함 |

넣지 않은 것:
- **재구축 경로(리플레이).** "A materialized view is just a cached subset of the log, and you could rebuild it from the log at any time." [KLEPP] (요약)는 강한 근거지만, CQRS 행의 "읽기 모델 재구축 경로"와 같은 값이다(saga 조사 §2.2 ⑤). 중복이라 넣지 않고 그 행을 가리킨다 (추론).
- **동기화 실패 시 대체 동작.** [KAKAOPAY-FF]의 백업 폴링은 재시도·분기 행의 값이다 (추론).

**현재 값 판정**

| 항목 | 출처 표기 | 판정 | 근거 |
|---|---|---|---|
| 원본(source of truth) 표시 | PRD §3 16번 | **유지** | [AZ-SF], [KLEPP], [KAKAOPAY-FF] |
| 이동 방식(CDC·배치·동기 write-through) | PRD §3 16번 / archify "이동 방식" | **유지** | [DBZ], [AZ-SF]. 두 출처 표기가 같은 항목이라 합친다 |
| 지연 허용치 | PRD §3 16번 / archify | **유지+보강** → 수치와 위반 시 동작 | dbt는 warn/error 두 단계를 값으로 적는다 [DBT-FRESH]. "허용치"만 적고 넘어가면 위반했을 때 뭘 하는지 안 남는다 |
| 변환 단계 | archify | **유지** | [OL-CL], [BEAM] |
| 분류·동의 경계 | archify | **수정** → "분류·신뢰 경계" | OWASP는 같은 것을 trust boundary로 부르고, 이 말이 L1 시스템 컨텍스트·시스템 개요 행의 "소유·신뢰 경계"와 같은 용어다 [OWASP-TM] (추론) |
| 저장소·소비자 | archify | **유지** | [OL] |
| 원본(archify "원본") | archify | **유지** (①과 중복이라 합침) | 같은 뜻 |
| 그림 종류 | PRD "박스=저장소, 화살표=데이터 이동" | **유지+이름 부여** → DFD 계열 | 이름 붙은 표기가 실재한다(외부 엔티티·처리·데이터 저장소·데이터 흐름·신뢰 경계) [OWASP-TM]. 다만 DFD 원 표기 정의의 1차 출처는 못 찾았다(§4-1) |
| 답하는 질문 | PRD 구어 | **수정** → 한 문장으로 | "어디서 와서 어디로 가"는 이동만 묻는다. 출처는 원본·변환·소비자 셋을 함께 묻는다 [ARCHIFY data-lineage] |

### 2.4 마이그레이션

**질문 후보**

- 단계가 질문을 정의한다: "Dual writing to the existing and new tables to keep them in sync. / Changing all read paths in our codebase to read from the new table. / Changing all write paths in our codebase to only write to the new table. / Removing old data that relies on the outdated data model." [STRIPE §four step dual writing pattern] [원문]
- "Parallel change, also known as expand and contract, is a pattern to implement backward-incompatible changes to an interface in a safe manner, by breaking the change into three distinct phases: expand, migrate, and contract." [FOWLER-PC] (요약)
- 어디까지 되돌릴 수 있나: "You can roll back to the monolithic database during phase 2 and at the start of phase 3, when the domain tables and synchronization processes still exist in the monolithic database." [AZ-SF §Example] [원문]

**출처의 그림**

| 출처 | 그림 종류 | 그려진 요소 | 확인 |
|---|---|---|---|
| STRIPE | 단계마다 1장(4장) | ①"All new writes should update both stores" ② 두 테이블에서 읽어 결과를 비교하는 실험 ③ 새 저장소에 먼저 쓰고 옛 것으로 아카이브 ④ "the new table now becomes our source of truth" | (요약). 4단계 문장은 [원문] |
| AZ-SF | 4장 + DB 예제 3장 | 파사드가 레거시/신규로 라우팅 → 신규 비중 증가 → 레거시 폐기 → 파사드 제거. DB 예제는 §2.3 표 참조 | [alt] (alt 전문 [원문]) |
| FOWLER-PC | 3장 | expand / migrate / contract 각 단계 | (요약) |
| GHOST | 운영 모드 3종 | 레플리카에 붙어 마스터를 마이그레이션 / 마스터에 직접 / 레플리카에서 테스트 | (요약) |
| TOSS-LEDGER | 아키텍처 | 좌측 Oracle 기존 원장, 우측 AWS MySQL 신규 원장, 중앙 비동기 파이프라인과 Kafka, 이중 적재 흐름과 검증 배치의 피드백 루프 | (요약) |

→ **모든 출처가 단계 수만큼 그린다.** 두 장(before/after)으로 끝낸 1차 출처는 없었다.

**필수요소 후보**

| 후보 | 근거 인용 | 값 3종으로 채울 수 있나 |
|---|---|---|
| ① 단계 목록과 현재 단계 | 4단계 [STRIPE] [원문] / 3단계 expand·migrate·contract [FOWLER-PC] (요약) / 4단계(파사드 도입 → 비중 이동 → 레거시 폐기 → 파사드 제거) [AZ-SF §Solution] [원문] | 실제 값 / 없음 확인(단계 없이 한 번에 교체) / 확인 못 함 |
| ② 단계별 읽기·쓰기 경로 | 읽기와 쓰기 전환이 **서로 다른 단계**다 [STRIPE] [원문] / "the legacy system continues to read from and write to the monolithic database, and the new system writes to the new domain database" [AZ-SF §Example] [원문] / "기존 원장에 먼저 데이터를 저장한 뒤, 신규 원장에는 비동기 방식으로 적재했습니다" [TOSS-LEDGER] (요약) | 실제 값 / 없음 확인 / 확인 못 함 |
| ③ 이중 쓰기 구간 | "Dual writing to the existing and new tables to keep them in sync." [STRIPE] [원문] / "A change data capture (CDC) process syncs the domain data" [AZ-SF] [원문] / 실패 허용 설계 — "ThreadPool이 포화될 경우 해당 작업을 과감히 버리고, 별도 검증 배치를 통해 데이터 누락을 보완" [TOSS-LEDGER] (요약) / 전환기에 둘을 동시에 지원한다는 일반형 — "a period of time when the database supports both the old access pattern and the new ones simultaneously" [FOWLER-EVODB §transition phase] (요약) | 실제 값 / 없음 확인(이중 쓰기 없이 컷오버) / 확인 못 함 |
| ④ 원본 이동 시점 | "the new domain database is the system of record for that domain" [AZ-SF §Example] [원문] / "the new table now becomes our source of truth" [STRIPE] (요약) / "승인 서버는 신규 원장이 메인 원장의 지위를 얻기 전까지..." [TOSS-LEDGER] (요약) | 실제 값 / 없음 확인 / 확인 못 함 |
| ⑤ 정합성 검증 방법 | "Validate consistency between both databases before cutover." [AZ-SF §Example] [원문] / "매시 5분 간격으로 실행되어 복제 지연을 고려하면서 누락된 데이터를 재적재" [TOSS-LEDGER] (요약) / 두 경로의 결과를 비교하는 실험 도구 [STRIPE] (요약) / "두 시스템이 만든 데이터를 기반으로 두 데이터가 동일한지 검증을 진행합니다" [TOSS-SETTLE] (요약) | 실제 값 / **없음 확인(검증 없음, 드러나야 할 값)** / 확인 못 함 |
| ⑥ 롤백 가능 구간과 만료 조건 | "You can roll back to the monolithic database during phase 2 and at the start of phase 3... To roll back to the monolithic database after you remove the domain tables, stored procedures, and synchronization processes from the monolithic database, you must restore those objects and replay data changes. However, this process significantly increases effort and risk." [AZ-SF §Example] [원문] / 되돌리기용 스크립트를 다 만드는 건 값이 낮다 — "We haven't found this to be cost effective and beneficial enough to try all the time." [FOWLER-EVODB] (요약) / 컷오버를 미루는 방식의 안전장치 — "You can instruct gh-ost to postpone the cut-over... gh-ost will complete the row-copy but will not flip the tables." [GHOST] (요약) | 실제 값 / 없음 확인(되돌릴 수 없음 = 드러나야 할 값) / 확인 못 함 |
| ⑦ 정리 단계 | "Removing old data that relies on the outdated data model." [STRIPE] [원문] / contract 단계에서 옛 메서드와 지원 코드를 지운다 [FOWLER-PC] (요약) / "Treat the removal of legacy objects as a deliberate final step for each domain. Remove legacy objects only after the new system is validated." [AZ-SF §Example] [원문] | 실제 값 / 없음 확인(정리 계획 없음) / 확인 못 함 |

넣지 않은 것:
- **파사드·라우팅 계층.** [AZ-SF]의 중심 장치지만 DB 마이그레이션에는 없다. ② 읽기·쓰기 경로 값으로 드러난다 (추론).
- **스로틀링·부하 제어.** [GHOST]의 운영 기능이다. 계획 그림이 아니라 실행 도구의 설정이다 (추론).

**현재 값 판정**

| 항목 | 출처 표기 | 판정 | 근거 |
|---|---|---|---|
| 단계별 전환 | PRD 스토리 22 / 9/5표 | **유지+보강** → ① 단계 목록과 현재 단계 + ② 단계별 읽기·쓰기 경로 | 세 출처가 전부 단계마다 읽기·쓰기를 따로 옮긴다 [STRIPE, AZ-SF] |
| 이중쓰기 구간 | PRD 스토리 22 / 9/5표 | **유지** | [STRIPE], [TOSS-LEDGER] |
| 롤백 지점 | PRD 스토리 22 / 9/5표 | **유지+보강** → "롤백 가능 구간과 만료 조건" | "지점" 하나가 아니라 구간이고, 끝나는 조건이 있다 [AZ-SF] |
| (없음) | — | **추가** ⑤ 정합성 검증 방법 | 검증 없이 컷오버하면 안 된다고 두 출처가 단계로 못박는다 [AZ-SF, TOSS-LEDGER] |
| (없음) | — | **추가** ④ 원본 이동 시점 | 데이터 흐름 행의 "원본"이 이 그림에서는 움직인다. 언제 넘어가는지가 계획의 핵심 (추론) |
| (없음) | — | **추가** ⑦ 정리 단계 | [FOWLER-PC]의 contract, [STRIPE] 4단계. 이게 빠지면 전환기 구조가 영구화된다 |
| 그림 종류 | 9/5표 "before/after" | **수정** → 단계 수만큼 나란히 | §1 판단 3 |
| 답하는 질문(빈 칸) | 없음 | **채움** | [STRIPE], [AZ-SF], [FOWLER-PC] |

**"이미 정해진 것"과의 충돌 검토.** 변경안 표기 규칙은 "지금 구조 그림 위에 바뀌는 부분만 새 색, 구조가 크게 바뀌면 지금/바꾼 두 그림을 나란히"다. 마이그레이션 행은 그 규칙의 **확장**이지 충돌이 아니다 (추론) — 단계가 3~4개라 "두 그림"이 "N그림"이 될 뿐이고, 나란히 놓는 방식은 같다. 다만 마이그레이션 그림의 선은 대부분 아직 코드에 없으므로 근거 태그는 `설계`이고, 9/12에 넓힌 `설계` 정의("합의됐거나 논의 중인 계획·계약")에 그대로 들어맞는다.

## 3. 인접 행과의 겹침 (전부 추론)

| 두 행 | 같은 질문인가 | 처리 |
|---|---|---|
| 이벤트 토폴로지 × 큐·배치 | 아니다. 그림 모양은 겹친다(둘 다 노드-엣지). 토폴로지는 "누가 받나", 큐·배치는 "어디서 막히나"를 묻는다. Kafka Streams의 processor topology는 두 행 모두에 해당하는 유일한 그림이다 | 토픽 소유·구독자가 쟁점이면 토폴로지, 적체·재처리가 쟁점이면 큐·배치 |
| 이벤트 토폴로지 × API 동작(비동기 후속) | 아니다. archify가 두 레시피를 나누고 서로를 가리킨다 — async-roundtrip의 avoidWhen: "The primary question is topic topology and consumer ownership rather than time order" [원문] | 시간순이면 API 동작 행의 "비동기 후속" 값 |
| 이벤트 토폴로지 × saga(코레오그래피) | 아니다(saga 조사 §3에서 확정) | 실패하면 무엇을 되돌리나면 saga |
| 이벤트 토폴로지 × 이벤트 소싱 | 아니다. 스토어 이후의 발행·구독은 토폴로지가 맡는다(saga 조사 §2.3 "넣지 않은 것") | 원본이 이벤트 스토어면 이벤트 소싱 |
| 큐·배치 × 데이터 흐름 | **절반 겹친다.** archify가 data-lineage의 avoidWhen에 "The audience needs request timing or operational task ownership rather than data assets" [원문]라고 적어 둘을 나눈다. 하지만 OpenLineage 그래프는 Job과 Dataset을 둘 다 노드로 갖는다 [OL] | 노드가 처리 단계면 큐·배치, 저장소·자산이면 데이터 흐름. 02에서 재판정(§1 판단 4) |
| 큐·배치 × 재시도·분기 | 아니다. 재시도 행은 한 단계의 정책(백오프·최대 횟수)이고, 큐·배치는 파이프라인 전체의 적체와 재처리 경로다 | 백오프·횟수는 재시도 행이 맡는다. ⑥이 그 값을 가리킨다 |
| 큐·배치 × 성능 병목 | 겹칠 수 있다. Flink의 색칠된 job graph는 병목 찾기 그림이다 [FLINK]. 다만 성능 병목 행은 한 요청의 구간별 레이턴시 분해(PRD 스토리 20)이고, 큐·배치는 처리량과 적체다 | 한 요청의 시간 분해면 성능 병목, 파이프라인의 밀림이면 큐·배치 |
| 데이터 흐름 × CQRS | 절반 겹친다(saga 조사 §3에서 이미 기록). ③ 이동 방식·④ 지연 허용치가 CQRS ③·④와 같은 값 | 명령 경로 분리가 쟁점이면 CQRS |
| 데이터 흐름 × 저장소 토폴로지 | 아니다(추론). 토폴로지는 한 저장소의 복제·파티션 구성, 데이터 흐름은 저장소 **사이**의 이동이다 | 복제 방식·파티션 키면 저장소 토폴로지 |
| 데이터 흐름 × 이벤트 소싱 | 아니다. 원본이 무엇이냐로 갈린다(saga 조사 §3) | 원본이 이벤트 스토어면 이벤트 소싱 |
| 마이그레이션 × 데이터 흐름 | 겹친다. 마이그레이션 중간 단계 그림은 그 시점의 데이터 흐름 그림과 같은 모양이다 [AZ-SF DB 예제] | 계획(단계·롤백)이면 마이그레이션, 지금 상태(원본·계보)면 데이터 흐름 |
| 마이그레이션 × 배치도 | 아니다. 배치도의 롤백은 배포 롤백이고, 마이그레이션의 롤백은 데이터 원본을 되돌리는 것이다 [AZ-SF] | 배포 단위 교체면 배치도 |
| 마이그레이션 × API 계약 | 아니다. [FOWLER-PC]의 expand·contract는 인터페이스에도 적용되지만, 그 경우 값은 버전 정책과 에러 코드다 | 코드 인터페이스 변경만이면 API 계약 |

**saga 조사와의 정합.** saga 조사가 "outbox·멱등키 → 이벤트 토폴로지 행의 전달 보장"(§3 판단 3), "프로젝션 저장소 계보 → 데이터 흐름 행"으로 넘긴 값들을 이 조사가 받는다. 받은 자리는 각각 이벤트 토폴로지 ⑤, 데이터 흐름 ①·⑤다. 넘긴 쪽과 받은 쪽의 이름이 어긋나지 않는다.

## 4. 출처 간 충돌·불확실한 점·못 찾은 것

1. **DFD 표기의 1차 출처를 못 찾았다.** Yourdon·DeMarco, Gane·Sarson의 원문에 접근하지 못했다. 검색 결과는 전부 2차(도구 벤더 문서, IBM 해설, Lucidchart)라 인용하지 않았다. 대신 그 표기를 실제로 쓰는 1차 출처로 OWASP를 인용했다 [OWASP-TM]. 그래서 "DFD 계열"이라고만 적고 어느 표기(원이냐 둥근 사각형이냐)인지는 정하지 않는다.
2. **순서 보장의 단위가 출처마다 다르다.** Kafka는 파티션 [KAFKA-INTRO], Pub/Sub은 ordering key + 같은 리전 발행 [GPS-ORDER], SQS FIFO는 DLQ를 붙이면 깨진다 [AWS-SQS-DLQ]. 한 이름으로 못 묶어서 필수요소 이름을 "순서 보장 단위"로 두고 값에 브로커 용어를 적게 한다.
3. **exactly-once 주장에 대한 경고가 출처 안에 있다.** Kafka 문서가 스스로 "it is important to read the fine print" [원문]라고 적고, Pub/Sub은 exactly-once를 켜도 "A subscription might receive multiple copies of the same message due to publish side duplicates" (요약)라고 적는다. 전달 보장 칸에 "exactly-once"만 적히면 그림이 거짓이 될 수 있다 (추론).
4. **백프레셔가 모든 기제에 있는 게 아니다.** Reactive Streams는 필수라고 하고 [RS], Flink는 지표로 잰다 [FLINK]. 반면 SQS·Pub/Sub은 백프레셔 기제가 없고 적체 지표로만 드러난다 [AWS-SQS-DLQ, GPS-MON]. 그래서 ⑤는 "없음 확인"이 정답인 경우가 자주 생긴다 — 02에서 "없음 확인"만 반복되면 제거 후보다.
5. **보상·재시도의 층위가 겹쳐 보인다.** 컬리의 재시도 토픽 144회 [KURLY]는 큐·배치 ⑥이자 이벤트 토폴로지 ⑥이다. 같은 시스템이면 두 그림이 같은 값을 가리킨다 (추론).
6. **마이그레이션 그림 수가 출처마다 다르다.** Stripe 4, Fowler 3, Azure 4(+DB 예제 3). "몇 장"을 규칙으로 정하지 말고 "단계 수만큼"으로 두는 근거다 (추론).
7. **gh-ost는 중단·되돌리기를 말하지 않는다.** 컷오버 연기만 제공한다 [GHOST]. Azure는 롤백 구간을 명시한다 [AZ-SF]. 충돌이라기보다 층위 차이다(도구 vs 계획).
8. **역방향 마이그레이션 자동화는 권장되지 않는다.** [FOWLER-EVODB]는 비용 대비 효과가 없다고 한다. 그래서 ⑥을 "롤백 스크립트"가 아니라 "되돌릴 수 있는 구간"으로 적었다 (추론).
9. **우아한형제들 배치 글은 병렬·파티셔닝·실패 처리를 다루지 않는다** (요약 보고 기준). 처리량 수치(390분 → 30분)만 인용했다.
10. **archify에 큐·배치·마이그레이션 레시피가 없다.** 11개 중 가장 가까운 것은 `delivery-workflow`(CI/CD)와 `deployment-lifecycle`인데 둘 다 배포용이다. 그래서 이 두 행의 필수요소는 archify 대조 없이 1차 출처만으로 세웠다.
11. **Kafka 공식 사이트에서 본문을 못 읽었다.** `kafka.apache.org/documentation/`·`/36/`·`/34/`가 모두 20KB JS 셸이고 `kafka-site` 미러는 404였다. 인용은 같은 문서의 원본인 `apache/kafka` 레포 `docs/design/design.md`·`docs/getting-started/introduction.md`·`docs/streams/core-concepts.md`·`docs/streams/architecture.md`에서 했다. 내용은 같지만 URL이 사이트가 아니라 레포다.
12. **요약을 거친 인용이 남아 있다.** WebFetch는 요약 모델을 거친다. 이 문서의 핵심 15문장(EIP 6개, Stripe 4단계, Reactive Streams, OpenLineage, Beam, Flink, Spring Batch, Airflow, microservices.io)은 원문 HTML·Markdown을 다시 받아 재대조했다. 회사 블로그 인용(컬리·우아한형제들·토스·카카오페이)과 Google Cloud·dbt·OpenLineage 컬럼 계보는 **재대조하지 못했다**((요약) 표시).
13. **그림을 직접 본 것은 2장뿐이다.** Kafka Streams processor topology와 Debezium architecture. 나머지는 alt·본문 설명에 기댔다. 특히 Stripe 4장과 Fowler 3장은 그림 자체를 보지 못했다.

## 5. 출처 목록

확인일은 모두 **2026-09-12**다. 2차 출처(검색 요약, 도구 벤더 해설, Medium)는 인용하지 않았다. "구분"은 해당 주장을 소유한 출처인지를 뜻한다(회사 블로그는 자사 사례의 1차 출처다).

| ID | 출처 (URL) | 소유자 | 구분 | 확인 |
|---|---|---|---|---|
| KAFKA-INTRO | `docs/getting-started/introduction.md` — https://raw.githubusercontent.com/apache/kafka/trunk/docs/getting-started/introduction.md (사이트판 https://kafka.apache.org/intro) | Apache Kafka | 1차 | 원문 대조 |
| KAFKA-DESIGN | `docs/design/design.md` — https://raw.githubusercontent.com/apache/kafka/trunk/docs/design/design.md | Apache Kafka | 1차 | 원문 대조(77KB 전문) |
| KAFKA-STREAMS | `docs/streams/core-concepts.md` · `docs/streams/architecture.md` (raw.githubusercontent.com/apache/kafka/trunk/) · 그림 https://kafka.apache.org/43/images/streams-architecture-topology.jpg | Apache Kafka | 1차 | 원문 대조, 그림 [봄] |
| EIP-PS | https://www.enterpriseintegrationpatterns.com/patterns/messaging/PublishSubscribeChannel.html | Hohpe & Woolf | 1차 | 원문 대조, 그림 [alt] |
| EIP-DLC | https://www.enterpriseintegrationpatterns.com/patterns/messaging/DeadLetterChannel.html | Hohpe & Woolf | 1차 | 원문 대조 |
| EIP-CC | https://www.enterpriseintegrationpatterns.com/patterns/messaging/CompetingConsumers.html | Hohpe & Woolf | 1차 | 원문 대조 |
| EIP-PF | https://www.enterpriseintegrationpatterns.com/patterns/messaging/PipesAndFilters.html | Hohpe & Woolf | 1차 | 원문 대조 |
| EIP-IR | https://www.enterpriseintegrationpatterns.com/patterns/messaging/IdempotentReceiver.html | Hohpe & Woolf | 1차 | 원문 대조 |
| EIP-GD | https://www.enterpriseintegrationpatterns.com/patterns/messaging/GuaranteedMessaging.html | Hohpe & Woolf | 1차 | 원문 대조 |
| MSIO-OB | https://microservices.io/patterns/data/transactional-outbox.html | Chris Richardson | 1차 | 원문 대조 |
| ASYNCAPI-CH | https://www.asyncapi.com/docs/concepts/channel · https://www.asyncapi.com/docs/concepts/asyncapi-document/structure | AsyncAPI Initiative | 1차 | WebFetch(요약) |
| GPS-ORDER | https://docs.cloud.google.com/pubsub/docs/ordering | Google Cloud | 1차 | WebFetch(요약) |
| GPS-DLQ | https://docs.cloud.google.com/pubsub/docs/handling-failures | Google Cloud | 1차 | WebFetch(요약) |
| GPS-EOD | https://docs.cloud.google.com/pubsub/docs/exactly-once-delivery | Google Cloud | 1차 | WebFetch(요약) |
| GPS-MON | https://docs.cloud.google.com/pubsub/docs/monitoring · …/monitor-subscription | Google Cloud | 1차 | WebFetch(요약) |
| AWS-SQS-DLQ | https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html | AWS | 1차 | 원문 전문 반환 |
| RS | https://github.com/reactive-streams/reactive-streams-jvm (README = 명세 본문) · https://www.reactive-streams.org/ | Reactive Streams | 1차 | 원문 대조 |
| BEAM | https://beam.apache.org/documentation/basics/ | Apache Beam | 1차 | 원문 대조(핵심 3문장) |
| FLINK | https://nightlies.apache.org/flink/flink-docs-release-1.20/docs/ops/monitoring/back_pressure/ | Apache Flink | 1차 | 원문 대조(지표·정의) |
| SPRING-BATCH | https://docs.spring.io/spring-batch/reference/domain.html | Spring (VMware) | 1차 | 원문 대조 |
| AIRFLOW-DAG | https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/dags.html | Apache Airflow | 1차 | 원문 대조 |
| AIRFLOW-TASK | https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/tasks.html | Apache Airflow | 1차 | 원문 대조 |
| OL | https://openlineage.io/docs/spec/object-model | OpenLineage (LF AI & Data) | 1차 | 원문 대조 |
| OL-CL | https://openlineage.io/docs/spec/facets/dataset-facets/column_lineage_facet | OpenLineage | 1차 | WebFetch(요약) |
| DBZ | https://debezium.io/documentation/reference/stable/architecture.html · 그림 `_images/debezium-architecture.png` | Debezium | 1차 | 원문 대조(HTML 직접 수신), 그림 [봄] |
| DBT-FRESH | https://docs.getdbt.com/docs/build/sources | dbt Labs | 1차 | WebFetch(요약) |
| KLEPP | https://www.confluent.io/blog/turning-the-database-inside-out-with-apache-samza/ | Martin Kleppmann (Confluent 블로그) | 1차 | WebFetch(요약) |
| OWASP-TM | https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html | OWASP | 1차(DFD 사용자) | WebFetch(요약) |
| STRIPE | https://stripe.com/blog/online-migrations | Stripe | 1차(사례) | 원문 대조(4단계) |
| GHOST | https://github.blog/news-insights/company-news/gh-ost-github-s-online-migration-tool-for-mysql/ | GitHub | 1차(사례) | WebFetch(요약) |
| FOWLER-PC | https://martinfowler.com/bliki/ParallelChange.html | Martin Fowler | 1차 | WebFetch(요약) |
| FOWLER-SF | https://martinfowler.com/bliki/StranglerFigApplication.html | Martin Fowler | 1차 | WebFetch(요약) |
| FOWLER-EVODB | https://martinfowler.com/articles/evodb.html | Fowler & Sadalage | 1차 | WebFetch(요약) |
| AZ-SF | https://learn.microsoft.com/en-us/azure/architecture/patterns/strangler-fig | Microsoft | 1차 | 원문 전문 반환, 그림 [alt](alt 전문) |
| KURLY | https://helloworld.kurly.com/blog/2026-outbox-pattern-and-retry-topic/ | 컬리 | 1차(사례) | WebFetch(요약) |
| WOOWA-EVENT | https://techblog.woowahan.com/7835/ | 우아한형제들 | 1차(사례) | WebFetch(요약) |
| WOOWA-STORE | https://techblog.woowahan.com/13101/ | 우아한형제들 | 1차(사례) | WebFetch(요약) |
| WOOWA-BATCH | https://techblog.woowahan.com/13569/ | 우아한형제들 | 1차(사례) | WebFetch(요약) |
| KAKAOPAY-PART | https://tech.kakaopay.com/post/spring-batch-partitioning/ | 카카오페이 | 1차(사례) | WebFetch(요약) |
| KAKAOPAY-FF | https://tech.kakaopay.com/post/feature-flag/ | 카카오페이 | 1차(사례) | WebFetch(요약) |
| TOSS-LEDGER | https://toss.tech/article/payments-legacy-5 | 토스페이먼츠 | 1차(사례) | WebFetch(요약) |
| TOSS-SETTLE | https://toss.tech/article/payments-legacy-6 | 토스페이먼츠 | 1차(사례) | WebFetch(요약) |
| ARCHIFY | `references/archify/archify/recipes/scenarios.mjs` (로컬, 읽기 전용) | archify (MIT) | 1차 | 전문 읽음 |

조사 중 열었으나 인용하지 않은 것: Google Pub/Sub `monitor-subscription`(찾던 지표 이름이 없었음), Kafka 공식 사이트 `documentation.html`(JS 셸, §4-11), DFD 표기 검색 결과 전체(2차 출처만 나옴, §4-1).

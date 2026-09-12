# 운영 4행 — 장애 원인 분석 · 장애 대응 흐름 · 동시성·락 · 성능 병목

> 조사일 2026-09-12 · 대상: 라우팅 표 운영 묶음 4행. 행을 제안하기 위한 근거 수집이다. 행을 결정하는 문서는 아니다.
> **확인 방법.** 1차 출처만 열었다. 검색 요약·Medium 해설·SEO 블로그는 인용하지 않았다. WebSearch는 URL을 찾는 데만 썼다.
> 표시: **[봄]** 그림·PDF를 이미지로 직접 봄 / **[alt]** alt·캡션·본문으로만 앎 / **(요약)** WebFetch 요약 모델을 거쳐 원문 문장 재대조를 못 함.
> 인용의 등급이 셋이다. ① **직접 봄** — NIST PDF, Dapper PDF, Kleppmann 그림 2장은 파일을 받아 이미지로 읽었다. ② **원문 반환** — AWS Well-Architected 4개 페이지와 Redis 분산락 문서는 요약 없이 페이지 전문이 그대로 왔다. ③ **(요약)** — 나머지 WebFetch. §5 "확인" 칸에 등급을 적었다.
> **로컬 확인.**
> - `wiki/index.md`: 347행 전문 읽음. 장애·락·레이턴시 페이지 없음. 가장 가까운 것이 [`canva-session-revocations`](../../wiki/summaries/canva-session-revocations.md) 한 편(분산 시스템 캐시·콜드스타트)이고 이 4행과는 질문이 다르다.
> - `raw-articles/`: 88개 중 `incident|postmortem|outage|latency|perf|lock|deadlock|concurren|trace|profil|flame|sre|oncall|reliab|transaction|isolation` 매칭 2건인데 둘 다 에이전트 하네스 글이다(12-factor-agents, Gemini Agentic RAG). 관련 0건.
> - archify `scenarios.mjs`: 레시피 11개 id를 모두 확인했다 — `system-overview` `deployment-ownership` `agent-tool-call` `delivery-workflow` `incident-runbook` `api-request` `async-roundtrip` `data-lineage` `event-stream` `object-lifecycle` `deployment-lifecycle`. **장애 원인 분석·동시성·락·성능 병목에 해당하는 레시피가 없다.** 운영 묶음에서 archify가 값을 주는 행은 장애 대응 흐름 하나뿐이다(브리프의 메모와 일치).
>
> **표기.** `[ID §절]`은 §5 출처 ID와 원문 절 제목이다. **(추론)**은 출처가 아니라 이 문서의 판단이다.

## 1. 요약

### 네 행 제안

| 상황 | 답하는 질문 | 그림 종류 | 필수요소 | 경계 |
|---|---|---|---|---|
| 장애 원인 분석 | 이 장애는 시각별로 무슨 일이 있었고, 어디서 끊겼으며, 우리는 언제서야 알아챘나? | 타임라인: 가로 시간축 하나, 이벤트는 점+시각 라벨, 영향·감지 지연·관측 공백은 구간 막대. 한 사건의 벽시계 기록이라 구조는 그리지 않는다 | ① 시각별 이벤트(시작·감지·개입·완화·종료) ② 끊긴 지점 ③ 관측 공백(감지·진단 지연 구간) ④ 영향 범위와 규모 ⑤ 빗나간 가설 구간 | 다음에 또 나면 뭘 하나 = 장애 대응 흐름. 한 요청 안의 구간별 소요 = 성능 병목 |
| 장애 대응 흐름 | 장애가 감지되면 누가 무엇을 어떤 순서로 하고, 무엇을 보고 끝났다고 하나? | 스윔레인 플로우: 역할별 가로 레인 × 단계 진행. 액션은 사각형, 판단은 마름모, 담당 없는 단계는 빈 레인으로 드러낸다 | ① 감지 신호 ② 분류·심각도와 선언 기준 ③ 역할 배정(지휘·운영·소통) ④ 완화·롤백 동작 ⑤ 에스컬레이션 경로 ⑥ 복구 확인 기준과 전파 | 이미 난 장애의 시각별 원인 = 장애 원인 분석. 어디 떠 있나 = 배치도. 코드가 자동으로 재시도·분기 = 재시도·분기 |
| 동시성·락 | 동시에 도는 작업들이 무엇을 언제 잡고 언제 놓기에, 어디서 서로 막히거나 같이 들어가나? | 레인 타임라인: 참여자(트랜잭션·클라이언트·락 서비스·저장소)별 레인 × 가로 시간축. 보유는 구간 막대, 요청·대기·거절은 레인 사이 화살표 | ① 참여자 레인과 트랜잭션 경계 ② 락 대상과 모드·범위 ③ 획득·해제 시각과 보유 구간(획득 순서 포함) ④ 막히는 지점과 순환 대기 ⑤ 충돌 시 처리(재시도·타임아웃·피해자) ⑥ 만료·소유권 보호 | 호출 순서가 쟁점이면 API 동작(시퀀스). 이벤트 소싱의 동시 쓰기 충돌은 그 행. 전이 규칙은 엔티티 생명주기 |
| 성능 병목 | 이 요청의 시간은 구간별로 어디에 얼마나 쓰였고, 전체를 줄이려면 어디를 줄여야 하나? | 트레이스 워터폴: 공유 가로 시간축, 구간마다 막대 하나, 부모-자식은 들여쓰기, 겹치면 병렬·이어지면 직렬, 임계 경로는 강조. (플레임 그래프는 전용 렌더러가 필요하고 x축이 시간이 아니다 — 캔버스 근사형은 폭 비례 누적 막대, 워터폴과 같은 그림에 섞지 않는다) | ① 구간별 소요 ② 전체 대비 비율 ③ 직렬/병렬 구간 ④ 임계 경로 ⑤ 측정 기준(백분위수·표본·계측 지점) | 1회 장애의 벽시계 흐름 = 장애 원인 분석. 처리량·백프레셔 = 큐·배치 파이프라인. 락 대기로 느리면 동시성·락 |

### 판단

1. **빈 칸 4개는 출처로 채워진다.** 답하는 질문 4개, 그림 종류 3개(장애 대응 흐름·동시성·락·성능 병목)가 비어 있었다. 네 질문 모두 출처가 같은 말을 한다(§2). 그림 종류 셋도 출처가 실제로 그린 표기가 있다. 지어낸 칸은 없다.
2. **9/5 표의 "트랜잭션 경계"·"레이턴시 분해"는 그림 종류 이름이 아니다 (추론).** 둘 다 그림에 들어갈 **내용**이지 표기 형식이 아니다. 트랜잭션 경계는 동시성·락의 필수요소 ①로, 레이턴시 분해는 성능 병목의 질문 자체로 옮기고, 그림 종류 칸은 출처가 쓰는 표기 이름(레인 타임라인 / 트레이스 워터폴)으로 채운다.
3. **출처는 타임라인을 거의 "그리지" 않는다 (추론, 가장 약한 대목).** Google SRE 예시 포스트모템·AWS 사후 요약은 텍스트다. Cloudflare은 표 + 별도 시계열 그래프다. 타임라인을 그림으로 그리라고 말하는 1차 출처는 Howie 하나다("creating a more visual representation of the timeline allows you to see your incident from different points of view" [HOWIE-A]). 즉 **캔버스 타임라인은 출처 표기의 번역이다.** 02 도그푸딩에서 "표로 충분하다"가 나오면 이 행의 그림 종류를 다시 본다.
4. **동시성·락의 그림 종류는 직접 본 그림 2장이 결정한다.** Kleppmann의 두 그림은 `Lock service / Client 1 / Client 2 / Storage` 4레인 × 가로 time축에, "lock held by client 1" 보유 구간 라벨과 GC pause 회색 막대, 레인 사이 화살표(`get lease` `ok, token: 33` `write` `rejected: old token`)를 그린다 [KLEPP-FIG1·2, 봄]. MySQL·PostgreSQL의 데드락 예시는 그림이 아니라 두 세션의 시간순 서술인데, 축만 세우면 같은 형식이 된다(추론).
5. **"임계구역"(9/5)은 "보유 구간"과 같은 것이다 (추론).** 이름을 합쳐 ③ "획득·해제 시각과 보유 구간"으로 제안한다. 제거는 판정하지 않는다 — 합친 이름을 쓰되 값이 겹치면 02에서 드러난다.
6. **장애 대응 흐름에 역할이 빠져 있다.** archify include 4종(감지 신호·분류 담당·완화·롤백·복구 확인·전파)에는 "누가 지휘하나"가 없다. 1차 출처는 전부 역할 분리를 대응의 뼈대로 삼는다 — Google SRE 4역할, PagerDuty 6역할, NIST §2.2. 레인 그림의 레인이 곧 역할이므로 필수요소로 올린다.
7. **성능 병목은 "임계 경로"가 빠지면 판단이 안 된다.** 9/5의 세 항목(구간별 소요·비율·직렬/병렬)만으로는 "어디를 줄여야 전체가 줄어드나"에 답하지 못한다. Uber는 임계 경로에 없는 구간을 빠르게 해도 "zero impact"라고 명시한다 [CRISP].
8. **플레임 그래프는 워터폴과 섞으면 안 된다.** Brendan Gregg이 x축이 시간이 아니라고 못 박는다("it is not the passage of time" [FLAME]). 브리프가 요구한 "캔버스 근사형"은 폭 비례 누적 막대로 두되, 그림 종류 칸에 "시간축 아님"을 함께 적는다.

## 2. 행별 조사 결과

### 2.1 장애 원인 분석

**질문 후보** (출처가 이 상황에서 답한다고 말하는 질문)

- 무슨 일이 있었나: "A postmortem is a written record of an incident, its impact, the actions taken to mitigate or resolve it, the root cause(s), and the follow-up actions to prevent the incident from recurring." [SRE-PM] (요약)
- 시각별로 무엇을: "Describe key time points on the timeline to understand the events of the incident." [AWS-OPS11 §Implementation steps] (원문 반환)
- 언제서야 알아챘나: 같은 절의 질문 목록 — "Could you improve time to detection? Are there updates to metrics and alarms that would detect the incident sooner? Can you improve the time to diagnosis?" [AWS-OPS11] (원문 반환)
- 어디서 끊겼나: "An engineer looking only at the overall latency may know there is a problem, but may not be able to guess which service is at fault, nor why it is behaving poorly." [DAPPER §1 Introduction, 봄]
- 무엇이 헷갈렸나: "Was there any ambiguity or confusion about what was happening? This is very common and is often a signal about the difficulty or complexity of the failure, not about the knowledge or skills of the responders." [HOWIE-A] (요약)

**출처의 그림**

| 출처 | 그림 종류 | 그려진 요소 | 확인 |
|---|---|---|---|
| SRE-EX | 텍스트 타임라인 | `2015-10-21 (UTC)` 한 축에 시각 라벨 + 한 줄 설명. 경계 4종을 대문자로 표시: **OUTAGE BEGINS**(14:54) · **INCIDENT BEGINS**(15:01) · **OUTAGE MITIGATED**(15:36) · **OUTAGE ENDS**(16:00) · **INCIDENT ENDS**(16:30). 담당자 이름이 각 줄에 붙는다(docbrown, jennifer, martym, clarac) | (요약), 타임라인 전문 반환 |
| CF-1118 | 표 + 시계열 그래프 | 표 3열: `Time (UTC)` / `Status` / `Description`. Status 칸이 구간 이름이다(Normal · Impact starts · Investigation phase · 완화 · 해결). 별도 그래프 2장: "Volume of HTTP 5xx requests served by the Cloudflare network", "availability of Cloudflare internal APIs during the incident" | (요약) |
| AWS-PES | 산문 | 표 없음. 영향을 **세 구간**으로 쪼개 각각 시작·종료 시각을 적는다(DynamoDB 11:48 PM~2:40 AM, NLB 5:30 AM~2:09 PM, EC2 2:25 AM~10:36 AM). 원인 특정 시각(12:38 AM)과 완화 시각(1:15 AM)을 본문에 박는다 | (요약) |
| SRE-WB-PM | 포스트모템 문서 구조 + 차트 | 절: Executive Summary / Problem Summary(duration, products affected, user impact, detection, resolution) / Background / Impact / Root Causes and Trigger / Timeline / Lessons Learned / Action Items / Glossary. Fig 10-1·10-2 "Core vs. Edge QPS breakdown", Fig 10-5는 조직 지표(incident mean duration, **time to detect, time to resolve**, blast radius) | (요약) |
| HOWIE-A | 태그 붙인 타임라인(여러 벌) | 전사·알림 로그·온콜 스케줄·대시보드에서 이벤트를 뽑아 태그를 단다. 기본 태그 예시 "detection, diagnosing, repair completed", 심화 태그는 "when hypotheses about the contributing factors are raised and proved/disproved, when updates are provided to external stakeholders". 여러 타임라인이 "false-starts, red herrings, and progression of the event"를 드러낸다 | (요약) |
| ARCHIFY | — | 사후 분석 레시피 없음. `incident-runbook`의 avoidWhen이 사후 컴포넌트 토폴로지를 다른 뷰로 넘긴다 | 전문 읽음 |

→ **타임라인을 그림으로 그린 1차 출처가 없다.** 표(Cloudflare)·텍스트(Google·AWS)뿐이고, 시각화를 권하는 문장은 Howie 하나다. 대신 **시간축 위 구간**이라는 구조는 전부 같다 — 영향 구간, 감지 지연, 완화~종료 간격.

**필수요소 후보**

| 후보 | 근거 인용 | 값 3종으로 채울 수 있나 |
|---|---|---|
| ① 시각별 이벤트(시작·감지·개입·완화·종료) | 수집할 지표 목록이 그대로 있다: "Collect metrics such as deployment change, configuration change, incident start time, alarm time, time of engagement, mitigation start time, and incident resolved time." [AWS-OPS11] / 경계 4종 대문자 표시 [SRE-EX] / Status 칸 [CF-1118] | 실제 값(`로그`) / 없음 확인(해당 이벤트 없음) / 확인 못 함(점선) |
| ② 끊긴 지점 | "which service is at fault" [DAPPER §1] / "split the system in half and examine the communication paths between components" [SRE-TS §Diagnose] / Cloudflare은 Workers KV·프록시로 지목 [CF-1118] | 실제 값 / 없음 확인(부분 성능 저하만) / 확인 못 함 |
| ③ 관측 공백(감지·진단 지연 구간) | 32분 공백이 액션 아이템이 된 사례: 장비는 16:38에 빠졌는데 "the world started paging only at around 17:10" → "Add an alert when more than [X]% of our machines have been taken away from us"(P1) [SRE-WB-PM] / 영향 시작 11:28 vs 자동 탐지 11:31 [CF-1118] / 시작 11:48 PM vs 원인 특정 12:38 AM [AWS-PES] / 계측이 없어 못 본 사례: 250ms인데 RPC가 안 보였고 메서드별 시간 계측을 추가한 뒤에야 원인이 나왔다 [SRE-TS §App Engine 사례] / "Could you improve time to detection?" [AWS-OPS11] | 실제 값(구간 길이) / 없음 확인(즉시 감지) / 확인 못 함 |
| ④ 영향 범위와 규모 | "its impact" [SRE-PM] / Problem Summary에 duration·products affected·user impact·revenue impact [SRE-WB-PM] / 영향 구간 3개를 서비스별로 분리 [AWS-PES] / "Perform a complete assessment of incident impact"(포스트모템 체크리스트) [SRE-WB-PM] | 실제 값 / 없음 확인(내부 영향만) / 확인 못 함 |
| ⑤ 빗나간 가설 구간 | "when hypotheses about the contributing factors are raised and proved/disproved" · "false-starts, red herrings" [HOWIE-A] / Cloudflare은 상태 페이지까지 죽어 공격을 의심했다고 적는다(Aisuru DDoS 언급) [CF-1118] / "document what ideas you had, which tests you ran, and the results you saw" [SRE-TS §Test and Treat] | 실제 값 / 없음 확인(오진 없었음) / 확인 못 함 |

넣지 않은 것:
- **액션 아이템·재발 방지.** 출처는 전부 요구한다 [SRE-PM, AWS-OPS11, HOWIE-A]. 그러나 그림이 아니라 문서의 몫이다 — 캔버스에 그릴 대상이 아니다(추론).
- **근본 원인 한 줄.** Root Causes는 포스트모템의 칸이지 타임라인의 값이 아니다. 그림에서는 ②(끊긴 지점)가 그 자리를 맡는다(추론).
- **골든 시그널 4종**(latency·traffic·errors·saturation) [SRE-MON]. 어떤 지표를 봤는지는 ①의 이벤트 근거로 붙는다. 별도 항목으로 세우면 그림이 대시보드가 된다(추론).

**현재 값 판정**

| 항목 | 출처 표기 | 판정 | 근거 |
|---|---|---|---|
| 답하는 질문 (없음) | — | **채움** → "이 장애는 시각별로 무슨 일이 있었고, 어디서 끊겼으며, 우리는 언제서야 알아챘나?" | PRD 스토리 18("어디서 끊겼는지 시각별로")에 감지 시점을 더했다. [AWS-OPS11]의 질문 셋(detection·diagnosis·mitigation)이 전부 시각 간격을 묻는다 |
| 그림 종류 = 타임라인 | PRD·9/5 | **유지+보강** → 축·구간 막대를 규정 | 출처가 모두 시간축 위 구간으로 적는다. 다만 그림으로 그린 출처가 없어 근거가 약하다(§1 판단 3) |
| 시각별 이벤트 | 9/5 | **유지+보강** → ① 괄호로 다섯 종을 못 박음 | [AWS-OPS11]이 수집할 시각을 열거한다. [SRE-EX]는 경계를 대문자로 구분한다 |
| 끊긴 지점 | 9/5 | **유지** → ② | [DAPPER §1], [SRE-TS §Diagnose] |
| 관측 공백 구간 | 9/5 | **유지+보강** → ③ "관측 공백(감지·진단 지연 구간)" | 인용 없이 조립된 항목인데 1차 출처가 정면으로 뒷받침한다 [SRE-WB-PM 32분, CF-1118, AWS-PES, SRE-TS] |
| (없음) | — | **추가** ④ 영향 범위와 규모 | [SRE-PM], [SRE-WB-PM §Problem Summary], [AWS-PES]가 셋 다 먼저 적는 값이다 |
| (없음) | — | **추가** ⑤ 빗나간 가설 구간 | [HOWIE-A]가 타임라인 태그로 명시. [CF-1118]이 실제로 기록. 이게 없으면 "왜 오래 걸렸나"가 안 보인다(추론) |

근거 태그는 대부분 `로그`다(PRD 규약과 일치). ⑤만 `로그`(전사 기록) 또는 `설계`(회고 합의)로 갈릴 수 있다(추론).

### 2.2 장애 대응 흐름

**질문 후보**

- archify가 직접 쓴 질문: "How do responders detect, triage, mitigate, verify, and escalate?" [ARCHIFY `incident-runbook`]
- 언제 장애로 선언하나: "You may want to declare an incident if any of the following are true: Do you need to involve a second team? Is the outage visible to customers? Is the issue unsolved even after an hour of concentrated analysis?" [SRE-MI §When to declare an incident] (요약)
- 무엇이 먼저인가: "Customers do not care whether or not you fully understand what caused an outage. What they want is to stop receiving errors." — 완화가 원인 분석보다 앞 [SRE-WB-IR] (요약)
- 무엇을 보고 끝났다고 하나: "reached exit criterion of 30 minutes' nominal performance" [SRE-EX 16:30]
- 왜 절차를 문서로 두나: "A *runbook* is a documented process to achieve a specific outcome. ... At its simplest, a runbook is a checklist to complete a task." [AWS-RUN] (원문 반환)

**출처의 그림**

| 출처 | 그림 종류 | 그려진 요소 | 확인 |
|---|---|---|---|
| ARCHIFY | 워크플로 레인(`preset: signal-flow`, `motion: trace`) | 프롬프트가 그림 구성을 직접 지시한다: "turn this incident runbook into responder lanes. Show detection, triage, mitigation, escalation, communication, rollback, and recovery verification. **Separate decision gates from actions and make missing ownership visible.**" include 4종 = detection signal / triage owner / mitigation and rollback / verification and communication | 전문 읽음 |
| NIST-61r3 Fig 1 | 단계 순환도 | 박스 4개 일렬 + 되돌아오는 굵은 화살표 2개: `Preparation` → `Detection & Analysis` → `Containment Eradication & Recovery` → `Post-Incident Activity`. 캡션 "Fig. 1. Previous incident response life cycle model". **역할 레인 없음** | [봄] |
| NIST-61r3 Fig 2 | 3층 박스 다이어그램 | 위층 "Incident Response" 상자 안에 `Detect` `Respond` `Recover` 3박스와 순환 화살표, 가운데 `(Identify) Improvement` 한 줄, 아래층 "Preparation" 상자에 `Govern` `Identify` `Protect`. 층 사이는 초록 점선 양방향 화살표. 캡션 "Fig. 2. Incident response life cycle model based on CSF 2.0 Functions" | [봄] |
| NIST-61r3 Table 1 | 대응표 | 옛 4단계 ↔ CSF 2.0 Function 매핑(Preparation→Govern/Identify/Protect, Detection & Analysis→Detect, Containment·Eradication·Recovery→Respond/Recover, Post-Incident→Identify(Improvement)) | [봄] |
| SRE-MI | 그림 없음 | 역할 4종을 글로 정의: Incident Command / Operational Work / Communication / Planning. "The operations team should be the only group modifying the system during an incident." 살아 있는 사건 문서와 명시적 인수인계("You're now the incident commander, okay?") | (요약) |
| PD-ROLE | 그림 없음 | 역할 6종: Incident Commander / Deputy / Scribe / Subject Matter Expert / Customer Liaison / Internal Liaison. Scribe가 "Note in Slack important data, events, and actions, as they happen" | (요약) |
| AWS-RUN / AWS-PLAY | 표 템플릿 | 런북 표 머리: Runbook ID · Description · Tools Used · Special Permissions · Author · Last Updated · **Escalation POC**. 플레이북 표는 여기에 **Stakeholders · Communication Plan**이 더 붙는다 | 원문 반환 |

→ 출처가 두 갈래로 그린다. **역할 레인**(archify, 역할을 정의하는 Google·PagerDuty) vs **역할 없는 단계 순환도**(NIST Fig 1·2). 스킬은 레인을 기본으로 삼는다 — 레인이 없으면 "담당 없음"이 안 보이고, archify가 그걸 그림의 목적으로 못 박았다(추론).

**필수요소 후보**

| 후보 | 근거 인용 | 값 3종으로 채울 수 있나 |
|---|---|---|
| ① 감지 신호 | archify include 'detection signal' / "Borgmon detected high level of HTTP 500s and paged on-call." [SRE-EX §Detection] / "Develop a process to assess which events are significant and require monitoring. This involves setting thresholds..." [AWS-OPS10 §Events] / 화이트박스·블랙박스 구분 [SRE-MON] | 실제 값(알림 이름·임계값) / 없음 확인(사람 신고로만 앎 — 위험이 드러난 값) / 확인 못 함 |
| ② 분류·심각도와 선언 기준 | archify include 'triage owner' / SEV-1~SEV-5 정의와 "If you are unsure which level an incident is (e.g. not sure if SEV-2 or SEV-1), **treat it as the higher one**." [PD-SEV] / 선언 3조건 [SRE-MI §When to declare] / "Determine criteria escalating an event to an incident." · "Categorize incidents by severity, with predefined incident response plans for each category." [AWS-OPS10] | 실제 값 / 없음 확인(등급 체계 없음) / 확인 못 함 |
| ③ 역할 배정(지휘·운영·소통) | 4역할과 "everybody involved in the incident knows their role and doesn't stray onto someone else's turf" [SRE-MI §Recursive Separation of Responsibilities] / 6역할 [PD-ROLE] / "Establish a structured incident management process, including clear roles, communication protocols, and steps for resolution." [AWS-OPS10] / 역할 목록 Leadership·Incident handlers·Technology professionals·Legal·Public affairs·Asset owners [NIST-61r3 §2.2, 봄] | 실제 값(사람·팀) / 없음 확인(1인 온콜) / 확인 못 함(점선 레인 = 담당 미정) |
| ④ 완화·롤백 동작 | archify include 'mitigation and rollback' / "Mitigation – Stop the bleeding before full root cause analysis" [SRE-WB-IR] / "Identify investigation & repair actions (roll back, rate-limit services, etc) and delegate actions to relevant service experts." [PD-DUR] / 플레이북이 원인을 찾고 런북이 고친다: "In many cases, playbooks identify the root cause that a runbook is used to mitigate." [AWS-PLAY] | 실제 값 / 없음 확인(롤백 불가 — 위험이 드러난 값) / 확인 못 함 |
| ⑤ 에스컬레이션 경로 | archify signals·prompt의 'escalation' / 런북은 "guidance on error handling, tools, permissions, exceptions, and escalations in case a problem occurs"를 담아야 한다 [AWS-RUN] / "In situations where a root cause can't be identified, the playbook should have an escalation plan." [AWS-PLAY] / 템플릿의 Escalation POC 칸 [AWS-RUN, AWS-PLAY] / 1시간 미해결이면 선언 [SRE-MI] | 실제 값(누구·언제) / 없음 확인 / 확인 못 함 |
| ⑥ 복구 확인 기준과 전파 | archify include 'verification and communication' / "reached exit criterion of 30 minutes' nominal performance" [SRE-EX] / "Once the incident has recovered or is actively recovering, you can announce that the incident is over and that the call is ending." · "Provide regular status updates in Slack (roughly every 30mins)" [PD-DUR] / "Unless you acknowledge that an incident is happening and actively being addressed, people will automatically assume nothing is being done." [SRE-WB-IR] | 실제 값(종료 기준·주기) / 없음 확인(기준 없음) / 확인 못 함 |

넣지 않은 것:
- **사후 분석 연결.** NIST Fig 2의 Improvement 층, [AWS-OPS10 §Learn and improve]. 장애 원인 분석 행이 맡는다 — 대응 그림의 끝에 "→ 원인 분석 그림" 한 칸으로만 잇는다(추론).
- **사건 문서(live incident document).** [SRE-MI]가 IC의 가장 중요한 책임이라 한다. 그림의 값이 아니라 대응의 산출물이다(추론).
- **대기 순번표·온콜 스케줄.** 출처는 요구하지만([HOWIE-A]의 on-call schedules) 그림 종류가 다르다.

**현재 값 판정**

| 항목 | 출처 표기 | 판정 | 근거 |
|---|---|---|---|
| 답하는 질문 (없음) | — | **채움** → "장애가 감지되면 누가 무엇을 어떤 순서로 하고, 무엇을 보고 끝났다고 하나?" | archify question을 번역하되 verify를 살렸다. "무엇을 보고 끝났다고 하나"는 [SRE-EX]의 exit criterion과 [PD-DUR]에 근거 |
| 그림 종류 (없음) | — | **채움** → 스윔레인 플로우(역할 레인 × 단계, 액션/판단 분리) | [ARCHIFY]가 "responder lanes", "Separate decision gates from actions and make missing ownership visible"로 직접 지시. 역할 목록은 [SRE-MI, PD-ROLE, NIST §2.2] |
| 감지 신호 | archify | **유지** → ① | [SRE-EX §Detection], [AWS-OPS10] |
| 분류 담당 | archify | **수정** → ② "분류·심각도와 선언 기준" | "담당"만으로는 부족하다. 출처는 등급과 선언 기준을 함께 요구한다 [PD-SEV, SRE-MI, AWS-OPS10] |
| 완화·롤백 | archify | **유지** → ④ | [SRE-WB-IR], [PD-DUR] |
| 복구 확인·전파 | archify | **유지+보강** → ⑥ "복구 확인 **기준**과 전파" | 확인이 아니라 종료 기준이 값이다 [SRE-EX 16:30, PD-DUR] |
| (없음) | — | **추가** ③ 역할 배정 | 1차 출처 셋이 모두 역할 분리를 대응의 뼈대로 둔다. 레인 그림의 레인이 곧 이 값이다 |
| (없음) | — | **추가** ⑤ 에스컬레이션 경로 | archify 프롬프트에는 있는데 include에는 빠져 있다. AWS 런북·플레이북 템플릿이 둘 다 칸으로 갖는다 |

### 2.3 동시성·락

**질문 후보**

- 왜 막히나: "A deadlock is a situation in which multiple transactions are unable to proceed because each transaction holds a lock that is needed by another one. Because all transactions involved are waiting for the same resource to become available, none of them ever releases the lock it holds." [MYSQL-DL] (요약)
- 같은 말, 다른 엔진: "two (or more) transactions each hold locks that the other wants" [PG-LOCK §13.3.4 Deadlocks] (요약)
- 왜 같이 들어가나: "Safety property: Mutual exclusion. At any given moment, only one client can hold a lock." [REDIS-DLM §Safety and Liveness Guarantees] (원문 반환)
- 무엇을 걸어야 하나: 효율 목적과 정확성 목적을 가르라 — 효율용이면 실패해도 중복 작업뿐이고, 정확성용이면 실패가 데이터 손상이다 [KLEPP-LOCK §Why are you using a lock?] (요약)
- 어떤 순서로 잡나: "when different transactions update multiple tables or large ranges of rows, use the same order of operations ... in each transaction" [MYSQL-DL §How to Minimize and Handle Deadlocks] / "The best defense against deadlocks is generally to avoid them by being certain that all applications using a database acquire locks on multiple objects in a consistent order." [PG-LOCK §13.3.4]

**출처의 그림**

| 출처 | 그림 종류 | 그려진 요소 | 확인 |
|---|---|---|---|
| KLEPP-FIG1 | **레인 타임라인** | 4레인(`Lock service` 자물쇠 아이콘 / `Client 1` / `Client 2` / `Storage` 실린더), 오른쪽 끝에 `time` 화살표. 레인 위 굵은 선이 락 보유 구간이고 위에 라벨 "lock held by client 1", "lock held by client 2". Client 1 레인에 회색 막대 "stop-the-world GC pause". 레인 사이 화살표: `get lease` → `ok` → (`lease expired`에 X 표시) → Client 2의 `get lease`/`ok` → `write data`/`ok` → Client 1의 뒤늦은 `write data`가 Storage에서 별표(충돌)로 끝남 | [봄] |
| KLEPP-FIG2 | **레인 타임라인**(같은 형식) | 같은 4레인. 화살표 라벨에 토큰이 붙는다: `ok, token: 33` · `ok, token: 34` · `write token: 34` → `ok` · `write token: 33` → `rejected: old token` | [봄] |
| MYSQL-DLX | 두 세션 시간순 서술 | 표가 아니라 Client A / Client B 블록을 번갈아 배치. A가 `Animals`에 `FOR SHARE`, B가 `Birds`에 `FOR SHARE` 뒤 `UPDATE Animals`로 대기, 이어 A의 `UPDATE Birds`에서 `ERROR 1213 (40001): Deadlock found when trying to get lock; try restarting transaction`. `performance_schema.data_locks`·`data_lock_waits`로 대기 상태를 보여준다 | (요약) |
| PG-LOCK §13.3.4 | 산문 + SQL 블록 | 트랜잭션 1이 A→B, 트랜잭션 2가 B→A 순으로 잠그는 서술. 행 수준 예시는 `acctnum=11111`/`22222`를 교차로 UPDATE. 그림 없음 | (요약), 절 전문 반환 |
| MYSQL-DLD | 그림 없음, 이름만 | "The system monitors a 'wait-for graph' to detect deadlocks." 대기 목록 200개·락 100만 개 한계, 피해자는 작은 트랜잭션 | (요약) |
| WONDER-DL | 관계도 + 개념 도해 | 상품-주문 1:N 테이블 관계도, 그리고 두 작업이 서로의 자원을 기다리는 개념 그림. 트랜잭션 1(INSERT, FK 참조로 product 인덱스 레코드 S락 대기) vs 트랜잭션 2(UPDATE, X락 보유) | (요약) |
| WOOWA-LOCK | ERD + 로그 스크린샷 | User-Card 1:N ERD, 단일/동시 요청 로그 비교, 커넥션 ID가 달라지는 것을 보여주는 로그 | (요약) |

→ **보유 구간과 시간축을 함께 그린 출처는 Kleppmann 둘뿐이고, 그 형식이 레인 타임라인이다.** DB 문서들은 같은 내용을 그림 없이 시간순 서술로 적는다. wait-for graph는 MySQL이 이름으로만 쓰고 아무도 그리지 않는다(§4-5).

**필수요소 후보**

| 후보 | 근거 인용 | 값 3종으로 채울 수 있나 |
|---|---|---|
| ① 참여자 레인과 트랜잭션 경계 | "keep transactions that insert or update data small enough that they do not stay open for long periods of time" [MYSQL-DL] / 레인 4종이 참여자다 [KLEPP-FIG1, 봄] / `GET_LOCK` 수행 후 커넥션이 풀에 반환되어 `RELEASE_LOCK`이 다른 커넥션에서 실행되는 문제 → DataSource에서 직접 커넥션을 관리해 동일 커넥션 사용을 보장 [WOOWA-LOCK] | 실제 값(BEGIN~COMMIT 구간) / 없음 확인(트랜잭션 없이 단일 문장) / 확인 못 함 |
| ② 락 대상과 모드·범위 | "A record lock is a lock on an index record." · "Record locks always lock index records, even if a table is defined with no indexes." · gap lock/next-key lock 정의 · S·X·IS·IX 호환 행렬 [MYSQL-LOCK] / "Two transactions cannot hold locks of conflicting modes on the same table at the same time." [PG-LOCK] / 권고 락은 시스템이 강제하지 않는다 [PG-LOCK §13.3.5] / 트랜잭션 1이 product의 primary 인덱스 레코드에서 S락 대기 [WONDER-DL] | 실제 값(대상·모드) / 없음 확인(락 없음 — 낙관적 처리) / 확인 못 함 |
| ③ 획득·해제 시각과 보유 구간(획득 순서 포함) | 보유 구간 라벨 "lock held by client 1" [KLEPP-FIG1, 봄] / "The 'lock validity time' is the time we use as the key's time to live. It is both the auto release time, and the time the client has in order to perform the operation" [REDIS-DLM] / 같은 순서로 잠그라 [MYSQL-DL, PG-LOCK §13.3.4] / "the first lock acquired on an object in a transaction is the most restrictive mode that will be needed" [PG-LOCK] | 실제 값 / 없음 확인(단일 락) / 확인 못 함 |
| ④ 막히는 지점과 순환 대기 | 데드락 정의 2종 [MYSQL-DL, PG-LOCK] / "The system monitors a 'wait-for graph'" [MYSQL-DLD] / 순환 대기(circular wait) 형성 [WONDER-DL] / 상호배제 실패 쪽: 클라이언트 둘이 동시에 락을 쥔 그림 [KLEPP-FIG1, 봄] | 실제 값(사이클) / 없음 확인(사이클 없음 = 대기만) / 확인 못 함 |
| ⑤ 충돌 시 처리(재시도·타임아웃·피해자) | "When an application receives this error, it should abort the current transaction and retry the whole transaction from the beginning."(`could not serialize access due to concurrent update`, SQLSTATE 40001) [PG-ISO] / "InnoDB tries to pick small transactions to roll back" · `innodb_lock_wait_timeout` 폴백 [MYSQL-DLD] / "deadlocks can be handled on-the-fly by retrying transactions that abort due to deadlocks" [PG-LOCK] / "it should try again after a random delay" [REDIS-DLM §Retry on Failure] | 실제 값 / 없음 확인(처리 없음 — 위험이 드러난 값) / 확인 못 함 |
| ⑥ 만료·소유권 보호 | 펜싱 토큰 33/34와 "rejected: old token" [KLEPP-FIG2, 봄] / "`SET resource_name my_random_value NX PX 30000`" + 소유자만 해제(`DELEX key IFEQ`/Lua) · "Using just `DEL` is not safe as a client may remove another client's lock." [REDIS-DLM §Correct Implementation with a Single Instance] / "You should implement fencing tokens." [REDIS-DLM §Disclaimer about consistency] | 실제 값(TTL·토큰) / 없음 확인(단일 DB 락이라 만료 없음) / 확인 못 함 |

넣지 않은 것:
- **격리 수준과 이상 현상 4종**(dirty read·nonrepeatable read·phantom·serialization anomaly) [PG-ISO]. 그림의 값이 아니라 전제다. ⑤가 "재시도해야 하는가"로 그 결과만 받는다(추론).
- **분산 합의·시계 가정.** "bounded network delays, bounded process pauses, bounded clock error" [KLEPP-LOCK]. 값이 아니라 논증이다.
- **락 경합 성능 수치.** 성능 병목 행이 맡는다(추론).

**현재 값 판정**

| 항목 | 출처 표기 | 판정 | 근거 |
|---|---|---|---|
| 답하는 질문 (없음) | — | **채움** → "동시에 도는 작업들이 무엇을 언제 잡고 언제 놓기에, 어디서 서로 막히거나 같이 들어가나?" | 두 실패 모드를 한 질문에 담았다. 막힘=데드락 [MYSQL-DL, PG-LOCK], 같이 들어감=상호배제 실패 [REDIS-DLM, KLEPP-FIG1] |
| 그림 종류 = "트랜잭션 경계" | 9/5 | **수정** → 레인 타임라인 / "트랜잭션 경계"는 필수요소 ①로 이동 | 트랜잭션 경계는 표기 형식이 아니다(§1 판단 2). 보유 구간과 시간축을 그린 출처의 형식이 레인 타임라인이다 [KLEPP-FIG1·2, 봄] |
| 트랜잭션 경계 | PRD(스토리 19) | **유지** → ① | [MYSQL-DL], [WOOWA-LOCK]의 커넥션 경계 사고 |
| 락 획득 순서 | PRD·9/5 | **유지+보강** → ③ "획득·해제 시각과 보유 구간(획득 순서 포함)" | 순서만으로는 만료·중첩이 안 보인다. 해제 시각과 보유 구간이 있어야 [KLEPP-FIG1]의 실패가 그려진다 |
| 락 범위 | 9/5 | **수정** → ② "락 대상과 모드·범위" | 범위만으로 부족하다. 인덱스 레코드·갭·넥스트키와 S/X/IS/IX 모드가 값이다 [MYSQL-LOCK] |
| 임계구역 | 9/5 | **합침 제안** → ③에 흡수 | 임계구역 = 락 보유 구간과 같은 것(추론). 제거는 판정하지 않는다 — **제거 후보**로만 둔다 |
| 데드락 사이클 | 9/5 | **유지** → ④ | [MYSQL-DL, MYSQL-DLD, PG-LOCK, WONDER-DL] |
| (없음) | — | **추가** ⑤ 충돌 시 처리 | PostgreSQL은 재시도를 애플리케이션 의무로 못 박는다 [PG-ISO]. 이 값이 없으면 그림이 "막혔다"에서 끝난다 |
| (없음) | — | **추가** ⑥ 만료·소유권 보호 | 분산락이면 TTL·토큰이 정확성의 핵심이다 [KLEPP-FIG2, REDIS-DLM]. DB 락만 쓰면 "없음 확인" |

### 2.4 성능 병목

**질문 후보**

- 어디가 느린가: "An engineer looking only at the overall latency may know there is a problem, but may not be able to guess which service is at fault" [DAPPER §1, 봄]
- 어디를 줄여야 전체가 줄어드나: 임계 경로는 "the longest weighted path in the DAG"이고 "the sequence of late arrivers on whom the next tasks depend upon and hence the critical path has no wait states in it". OperationB는 시간을 많이 쓰지만 임계 경로에 없어 "speeding OperationB has zero impact on speeding OperationX" [CRISP] (요약)
- 왜 트레이스 한 건으로는 안 되나: "in a complex microservice environment, the Jaeger traces are hard to digest via visual inspection. Even a single trace can be very complicated." [CRISP]
- 어느 요청을 보고 있나: 평균은 속인다 — 100ms 평균에 "1% of requests might easily take 5 seconds" [SRE-MON §Worrying About Your Tail]
- 자원이 포화인가: "For every resource, check utilization, saturation, and errors." [USE] (요약)

**출처의 그림**

| 출처 | 그림 종류 | 그려진 요소 | 확인 |
|---|---|---|---|
| DAPPER Fig 2 | **스팬 워터폴** | 위쪽에 `(time)` 축, 아래 눈금 20·22·24·26·28·30. 스팬마다 가로 박스 하나이고 박스 안에 이름·`parent id`·`span id`. `Frontend.Request`(no parent id, span id: 1)가 전체 폭, 그 아래 `Backend.Call`(parent id:1, span id:2)과 `Backend.DoSomething`(parent id:1, span id:3)이 **서로 다른 구간**에 놓이고, 그 아래 `Helper.Call` 2개(parent id:3, span id:4·5)가 중첩된다. 캡션 "Figure 2: The causal and temporal relationships between five spans in a Dapper trace tree." | [봄] |
| DAPPER Fig 1 | 호출 트리 | `(user)`→`A (Frontend)`→`rpc1`→`B (Middle Tier)` / `rpc2`→`C`→`rpc3,rpc4`→`D,E (Backend)`. 캡션 "Figure 1: The path taken through a simple serving system on behalf of user request X." **구조 그림이라 시간축이 없다** | [봄] |
| DAPPER Fig 3 | 한 스팬 상세 | `span name = "Helper.Call"`, `span id`, `trace id`, `span parent id`, 가로 `(time)` 축 위에 Annotations와 `(Client) <Start> Client Send ... Client Recv <End>` / `(Server) Server Recv "foo" Server Send`. 캡션 "Figure 3: A detailed view of a single span from Figure 2." | [봄] |
| OTEL-PRIMER | 워터폴 | "Trace waterfall diagram"이라는 이름의 그림이 루트 스팬과 중첩 자식 스팬의 부모-자식 관계를 보여준다 | (요약) [alt] |
| CRISP Fig 3 | 워터폴 + 임계 경로 강조 | Jaeger 트레이스를 병렬 DAG로 그린 타임라인. 가로 박스 길이가 실행 시간에 비례하고 **임계 경로가 빨강**. OperationX(최상위)·A·B·C·D | (요약) [alt] |
| CRISP Fig 8·9 | 플레임 그래프 + 히트맵 | Fig 8 임계 경로 기여 서비스의 계층 분해(클릭 탐색), Fig 9 백분위수별 히트맵 + 플레임 그래프 3장 | (요약) [alt] |
| FLAME | 플레임 그래프 | "The x-axis shows the stack profile population, **sorted alphabetically (it is not the passage of time)**", "the y-axis shows stack depth, counting from zero at the bottom", "Each rectangle represents a stack frame. The wider a frame is is, the more often it was present in the stacks." 변종: icicle(뒤집기), flame chart("time on the x-axis instead of the alphabet"), differential | (요약) |
| USE | 절차 순서도 | 자원마다 errors→utilization→saturation을 확인하는 흐름도 | (요약) [alt] |
| WOOWA-ES | 수치 표 | 구간별 측정 지점(nginx `access.log`의 `request_time`, 슬로우 쿼리 수집기 0.7초 기준, aggregation 수행 시간, 데이터 노드 CPU)과 개선 전후(카테고리 필터 115ms / 980ms / 104ms, p99.9·p99.99 20% 개선) | (요약) |
| JAEGER | — | 공식 문서에 트레이스 상세 뷰(간트·워터폴)의 설명이 없다. 임베드 설정의 `uiTimelineCollapseTitle` 같은 이름만 있다 | (요약) **확인 실패** |

→ **워터폴이 표준 표기다.** Dapper가 2010년에 이 형식으로 그렸고[봄], OpenTelemetry가 "Trace waterfall diagram"이라 부르며, Uber가 같은 형식 위에 임계 경로를 덧칠한다. 플레임 그래프는 같은 도구 묶음에 있지만 **축이 다르다**(시간 아님).

**필수요소 후보**

| 후보 | 근거 인용 | 값 3종으로 채울 수 있나 |
|---|---|---|
| ① 구간별 소요 | 스팬 박스의 길이가 곧 값이다 [DAPPER Fig 2, 봄] / "Span start and end times as well as any RPC timing information are recorded by Dapper's RPC library instrumentation." [DAPPER §2.1] / 스팬은 "a single unit of work or operation"이고 시간 정보를 담는다 [OTEL-TRACE] | 실제 값(ms) / 없음 확인(계측 없는 구간 = 0이 아니라 "확인 못 함") / 확인 못 함(점선) |
| ② 전체 대비 비율 | 집계는 "a summation of the time contributions of each operation on each critical path into a global pool of operations" [CRISP] / 플레임 그래프의 폭이 비중이다 [FLAME] / 카테고리 필터 하나가 115ms→980ms를 만든 사례 [WOOWA-ES] | 실제 값(%) / 없음 확인 / 확인 못 함 |
| ③ 직렬/병렬 구간 | "child-of relation represents a request-response relationship where the parent waits for the child"(직렬) vs "follow-from relation represents a 'fire-and-forget' mode of operation where the parent does not wait"(병렬) [CRISP] / Fig 2에서 `Backend.Call`과 `Backend.DoSomething`이 겹치지 않고, `Helper.Call` 둘은 겹친다 [DAPPER, 봄] / 비동기는 span link로 잇는다 [OTEL-TRACE §Span Links] | 실제 값 / 없음 확인(전부 직렬) / 확인 못 함 |
| ④ 임계 경로 | 정의와 "no wait states in it" [CRISP] / "speeding OperationB has zero impact" [CRISP] / Fig 3에서 빨강으로 강조 | 실제 값 / 없음 확인(단일 경로라 자명) / 확인 못 함 |
| ⑤ 측정 기준(백분위수·표본·계측 지점) | "collect request counts bucketed by latencies" 그리고 평균의 함정 [SRE-MON] / 집계를 "at P50, P95, and P99 percentile of end-to-end latency values"로 나눈다 [CRISP] / 샘플링: "a sample of just one out of thousands of requests provides sufficient information for many common uses" [DAPPER §1.1, 봄] / 측정 지점을 nginx `request_time`·슬로우 쿼리 0.7초·p99.9·p99.99로 밝힌다 [WOOWA-ES] | 실제 값 / 없음 확인(단건 수동 측정) / 확인 못 함 |

넣지 않은 것:
- **자원 포화(USE).** [USE]가 자원별 utilization·saturation·errors를 요구하고 [WOOWA-ES]도 CPU를 함께 본다. 그러나 자원 축을 요청 시간축 그림에 넣으면 종류가 섞인다. **경계**로 둔다: 자원 포화가 쟁점이면 이 그림이 아니다(추론). 02에서 "포화 자원" 항목이 필요하다는 신호가 나오면 다시 본다.
- **시계 오차(clock skew).** [CRISP Fig 5·6·7]이 다루고 [DAPPER §2.1]도 언급한다. 그리기 정확도 문제지 판단 값이 아니다(추론).
- **개선 후 수치.** before/after는 변경안 규칙(지금 그림 위에 새 색)이 맡는다.

**현재 값 판정**

| 항목 | 출처 표기 | 판정 | 근거 |
|---|---|---|---|
| 답하는 질문 (없음) | — | **채움** → "이 요청의 시간은 구간별로 어디에 얼마나 쓰였고, 전체를 줄이려면 어디를 줄여야 하나?" | PRD 스토리 20("어디가 전체의 몇 %인지")에 [CRISP]의 "줄여도 소용없는 구간이 있다"를 더했다 |
| 그림 종류 = "레이턴시 분해" | 9/5 | **수정** → 트레이스 워터폴(+ 플레임 그래프 근사형 단서) | "레이턴시 분해"는 표기 이름이 아니라 하는 일이다. 출처의 표기 이름은 워터폴이다 [OTEL-PRIMER, DAPPER Fig 2 봄, CRISP Fig 3] |
| 구간별 소요 | 9/5 | **유지** → ① | [DAPPER §2.1, 봄], [OTEL-TRACE] |
| 전체 대비 비율 | 9/5 | **유지** → ② | [CRISP], [FLAME] |
| 직렬/병렬 구간 | 9/5 | **유지+보강** → ③ 판별 근거(child-of / follow-from)를 값에 적는다 | [CRISP], [DAPPER Fig 2 봄] |
| (없음) | — | **추가** ④ 임계 경로 | 셋만으로는 "어디를 줄이나"에 답이 안 된다. 출처가 정면으로 그 문제를 푼다 [CRISP] |
| (없음) | — | **추가** ⑤ 측정 기준 | 어느 백분위수의 어느 표본인지 없으면 숫자가 비교 불가다 [SRE-MON, CRISP, DAPPER 샘플링, WOOWA-ES] |

## 3. 인접 행과의 겹침 (전부 추론)

| 행 × 인접 행 | 같은 질문인가 | 처리 |
|---|---|---|
| 장애 원인 분석 × 장애 대응 흐름 | 아니다. 하나는 1회 사건의 기록(`로그`), 하나는 재사용할 절차(`설계`)다. 출처도 문서를 나눈다 — 런북·플레이북은 반복 절차 [AWS-RUN, AWS-PLAY], 사후 분석은 이번 사건의 시각 수집 [AWS-OPS11]. NIST Fig 2도 Detect/Respond/Recover와 Improvement를 다른 층에 둔다 [봄] | 두 행 유지. 대응 그림의 끝에서 원인 분석 그림을 가리킨다 |
| 장애 원인 분석 × 성능 병목 | 둘 다 시간축인데 **축의 정체가 다르다.** 벽시계 1회 기록 vs 요청 1건의 경과 시간(반복 측정 가능). 섞으면 "14:54"와 "42ms"가 한 축에 온다 | 경계 문장을 양쪽에 넣는다. 판별 기준은 "축이 시각인가 소요인가" |
| 장애 원인 분석 × 마이그레이션(다른 묶음) | 아니다. 마이그레이션은 계획된 전환의 before/after다 | 없음 |
| 장애 대응 흐름 × 배치도(다른 묶음) | 아니다. archify가 명시적으로 나눈다 — `incident-runbook`의 avoidWhen이 "post-incident component topology"를 다른 뷰로 넘긴다 | 이미 확정된 분리(9/11 결정)를 유지 |
| 장애 대응 흐름 × 재시도·분기(다른 묶음) | 아니다. 재시도·분기는 코드가 자동으로 하는 분기(상태도), 대응 흐름은 사람이 레인을 나눠 하는 절차. 다만 둘 다 "실패하면 무엇을"이라 발화가 겹칠 수 있다 | 경계: 사람이 판단·조치하면 대응 흐름, 코드가 자동이면 재시도·분기 |
| 장애 대응 흐름 × saga(확정 행) | 아니다. saga의 보상은 코드가 도는 자동 복구다. 다만 saga ④의 "수동 개입"이 이 행을 가리킨다 | saga 그림의 수동 개입 종료 상태에서 대응 흐름 그림으로 잇는다 |
| 동시성·락 × API 동작(다른 묶음) | **모양이 가장 닮았다.** 둘 다 레인 + 화살표다. 질문이 다르다 — API 동작은 호출 순서와 응답, 동시성·락은 **보유 구간의 겹침**이다. Kleppmann 그림에서 판단을 만드는 것은 화살표가 아니라 "lock held by" 구간 막대다 [봄] | 경계 문장 필수. 판별: 그림에서 구간 막대를 지웠을 때 답이 사라지면 동시성·락 행 |
| 동시성·락 × 이벤트 소싱(확정 행) | 아니다. 이미 확정 — 낙관적 동시성(append 거절·재시도)은 이벤트 소싱 행 필수요소 ② | 이벤트 스토어 얘기면 그 행으로 |
| 동시성·락 × saga(확정 행) | 아니다. saga ⑤ 격리 부재(semantic lock)는 서비스 여러 개에 걸친 중간 상태 노출이고, 이 행은 한 자원의 상호배제다 | saga 행에서 PENDING 상태를 쓰면 그 행의 값 |
| 동시성·락 × 엔티티 생명주기(다른 묶음) | 아니다. 생명주기는 허용·불가 전이 규칙, 이 행은 같은 시각에 누가 무엇을 쥐었나 | 없음 |
| 동시성·락 × 성능 병목 | 부분 겹침. 락 대기가 레이턴시의 한 구간일 수 있다. 질문이 다르다 — "왜 느린가"의 답이 대기면 병목 행에서 구간 하나로 끝나고, "왜 서로 막히나"를 물으면 이 행 | 경계: 병목 그림의 한 구간이 락 대기로 밝혀지면 그때 이 행 그림을 따로 그린다 |
| 성능 병목 × 큐·배치 파이프라인(다른 묶음) | 아니다. 파이프라인은 처리량·백프레셔(정상 상태의 흐름), 병목은 요청 1건의 경과 시간 분해 | 경계: 축이 "건/초"면 파이프라인, "ms"면 병목 |
| 성능 병목 × 시스템 개요·의존 도달 범위(다른 묶음) | 아니다. Dapper Fig 1(호출 트리, 구조)과 Fig 2(워터폴, 시간)가 같은 요청의 다른 그림이라는 것이 그대로 증거다 [봄] | 구조를 묻는 발화면 다른 행. 같은 요청이라도 그림을 나눈다 |

## 4. 출처 간 충돌·불확실한 점·못 찾은 것

1. **타임라인을 그림으로 그린 1차 출처가 사실상 없다.** Google SRE는 텍스트, AWS는 산문, Cloudflare은 표다. 시각화를 권하는 문장은 Howie 하나다. 이 행의 그림 종류는 출처 표기의 번역이며, 02 도그푸딩에서 반증될 수 있다(추론). 반대로 Cloudflare은 **시계열 그래프**를 따로 싣는데, 이건 캔버스에 그릴 대상이 아니다(관측 도구의 출력).
2. **"root cause"인가 "contributing factors"인가.** Google SRE는 "Root Causes"를 포스트모템의 칸으로 둔다 [SRE-WB-PM]. AWS도 "root cause"를 쓰면서 같은 문서에서 "contributing factors"를 섞어 쓴다 [AWS-OPS11 §Implementation guidance: "Use a process to determine contributing factors" + "Communicate incident root causes as appropriate"]. Howie는 서술적 접근을 권한다. **불확실:** Howie 페이지에서 "contributing factors를 왜 root cause 대신 쓰는가"라는 설명 문장을 WebFetch가 찾지 못했다고 답했다(검색 요약에는 그 취지가 있었으나 원문 대조 실패). 스킬 문구는 한쪽 용어를 고르지 말고 "끊긴 지점"이라는 그림 용어를 쓰는 편이 안전하다(추론).
3. **대응 흐름의 그림이 두 갈래다.** NIST는 역할 없는 단계 순환도(Fig 1·2)[봄], archify는 역할 레인이다. 어느 쪽이 기본인지 정하는 출처가 없다. 레인을 고른 이유는 archify가 "make missing ownership visible"을 목적으로 못 박아서다(추론).
4. **심각도 체계가 출처마다 다르다.** PagerDuty는 SEV-1~5를 고정 정의로 준다 [PD-SEV]. AWS는 조직이 정의하라고만 한다 [AWS-OPS10]. Google SRE는 등급 대신 선언 조건 3개를 준다 [SRE-MI]. 스킬이 등급 값을 정하면 안 된다 — 필수요소는 "그 조직의 기준이 무엇인가"까지다(추론).
5. **wait-for graph는 이름만 있고 아무도 그리지 않는다.** MySQL이 용어를 쓰고 [MYSQL-DLD], PostgreSQL은 "automatically detects deadlock situations"라고만 한다. 데드락 사이클을 별도 그래프로 그릴 근거는 약하다 — 레인 타임라인의 교차 화살표로 같은 것이 보인다(추론).
6. **데드락 피해자 선정 규칙이 엔진마다 다르다.** MySQL: "InnoDB tries to pick small transactions to roll back". PostgreSQL: "Exactly which transaction will be aborted is difficult to predict and should not be relied upon." 필수요소 ⑤의 값은 엔진 기본값이 아니라 애플리케이션의 재시도 처리여야 한다(추론).
7. **Redlock 논쟁이 출처 안에 병기돼 있다.** Redis 공식 문서가 §Disclaimer about consistency에서 "You should implement fencing tokens"와 "Redis is not using monotonic clock for TTL expiration"을 스스로 적고, 문서 끝에 Kleppmann의 반론 링크를 단다 [REDIS-DLM]. 즉 ⑥(만료·소유권 보호)은 한쪽 편이 아니라 양쪽이 합의한 값이다.
8. **플레임 그래프의 x축이 시간이 아니다** [FLAME]. 같은 조사에서 Uber는 플레임 그래프와 워터폴을 한 도구 안에서 함께 쓴다 [CRISP Fig 3 vs Fig 8]. 캔버스에서 둘을 한 그림에 겹치면 축이 모순된다 — 그림 종류 칸에 경고를 넣었다(추론).
9. **"워터폴"이라는 이름의 근거가 OpenTelemetry 한 곳이다.** Jaeger 공식 문서에는 트레이스 상세 뷰의 설명이 없었다(확인 실패). Dapper는 그림만 있고 이름이 없다. 이름을 굳이 쓸 필요는 없고, 그림 종류 칸의 설명 문장이 실체다(추론).
10. **못 찾거나 확인 실패한 것.**
    - GitLab 2017 DB 장애 포스트모템: URL 2개 모두 HTTP 403. 내용 인용 없음.
    - Atlassian Incident Handbook·인시던트 타임라인 문서·심각도 문서: 페이지가 내비게이션만 반환하고 본문이 잘렸다. 3회 시도 후 포기 — 이 문서는 Atlassian을 인용하지 않는다.
    - 국내 대형 장애 공개 보고서: 검색으로 1차 출처를 찾지 못했다. 국내 사례는 우아한형제들·원더월 두 건(락·성능)만 썼고 장애 대응·사후 분석의 국내 1차 사례는 없다.
    - Dapper는 1~6쪽만 읽었다. 트레이스 조회 UI를 다루는 5장은 확인하지 않았다.
    - Howie의 보고서 절 구조: 외부 템플릿 문서를 가리키기만 하고 본문에 목차가 없었다.
    - Jaeger UI의 간트/워터폴 서술: 공식 문서에서 확인 실패(§4-9).
    - Brendan Gregg의 USE·플레임 그래프 그림은 이미지로 보지 않았다([alt]·요약).

## 5. 출처 목록

확인일은 모두 **2026-09-12**다. "확인" 칸의 등급: **직접 봄**(이미지·PDF를 내가 읽음) / **원문 반환**(요약 없이 페이지 전문이 옴) / **(요약)**(WebFetch 요약 모델을 거침).

| ID | 출처 (URL) | 소유자 | 구분 | 확인 |
|---|---|---|---|---|
| SRE-PM | https://sre.google/sre-book/postmortem-culture/ | Google | 1차 | (요약) — 정의 문장 외에는 소출력 |
| SRE-EX | https://sre.google/sre-book/example-postmortem/ | Google | 1차 | (요약), 타임라인 전문 반환 |
| SRE-MI | https://sre.google/sre-book/managing-incidents/ | Google | 1차 | (요약) |
| SRE-TS | https://sre.google/sre-book/effective-troubleshooting/ | Google | 1차 | (요약) |
| SRE-MON | https://sre.google/sre-book/monitoring-distributed-systems/ | Google | 1차 | (요약) |
| SRE-WB-IR | https://sre.google/workbook/incident-response/ | Google | 1차 | (요약) |
| SRE-WB-PM | https://sre.google/workbook/postmortem-culture/ | Google | 1차 | (요약) |
| PD-ROLE | https://response.pagerduty.com/before/different_roles/ | PagerDuty | 1차 | (요약) |
| PD-SEV | https://response.pagerduty.com/before/severity_levels/ | PagerDuty | 1차 | (요약) |
| PD-DUR | https://response.pagerduty.com/during/during_an_incident/ | PagerDuty | 1차 | (요약) |
| PD-PM | https://response.pagerduty.com/after/post_mortem_process/ | PagerDuty | 1차 | (요약) |
| HOWIE-A | https://howie-guide.pagerduty.com/analyze/ | PagerDuty (원저 Jeli — Maguire·Jones·Huerta Granda) | 1차 | (요약) |
| HOWIE-R | https://howie-guide.pagerduty.com/report/ | PagerDuty (Jeli) | 1차 | (요약), 목차 확인 실패 |
| NIST-61r3 | NIST SP 800-61r3, April 2025 — https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r3.pdf | NIST | 표준 | PDF 직접 읽음(앞 10쪽 + 본문 4~9쪽). Fig 1·Fig 2·Table 1 [봄] |
| AWS-RUN | OPS07-BP03 Use runbooks to perform procedures — https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_ready_to_support_use_runbooks.html | AWS | 1차 | 원문 반환 |
| AWS-PLAY | OPS07-BP04 Use playbooks to investigate issues — https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_ready_to_support_use_playbooks.html | AWS | 1차 | 원문 반환 |
| AWS-OPS10 | OPS10-BP01 Use a process for event, incident, and problem management — https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_event_response_event_incident_problem_process.html | AWS | 1차 | 원문 반환 |
| AWS-OPS11 | OPS11-BP02 Perform post-incident analysis — https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_evolve_ops_perform_rca_process.html | AWS | 1차 | 원문 반환 |
| AWS-PES | Summary of the Amazon DynamoDB Service Disruption in N. Virginia (2025-10) — https://aws.amazon.com/message/101925 | AWS | 1차(사례) | (요약) |
| CF-1118 | Cloudflare outage on November 18, 2025 — https://blog.cloudflare.com/18-november-2025-outage/ | Cloudflare | 1차(사례) | (요약), 타임라인 표 반환. 그래프는 캡션만 [alt] |
| MYSQL-LOCK | https://dev.mysql.com/doc/refman/8.4/en/innodb-locking.html | Oracle | 1차 | (요약), 락 정의·호환 행렬 반환 |
| MYSQL-DL | https://dev.mysql.com/doc/refman/8.4/en/innodb-deadlocks.html | Oracle | 1차 | (요약) |
| MYSQL-DLX | https://dev.mysql.com/doc/refman/8.4/en/innodb-deadlock-example.html | Oracle | 1차 | (요약) |
| MYSQL-DLD | https://dev.mysql.com/doc/refman/8.4/en/innodb-deadlock-detection.html | Oracle | 1차 | (요약) |
| PG-LOCK | https://www.postgresql.org/docs/current/explicit-locking.html | PostgreSQL Global Development Group | 1차 | (요약), §13.3.4·13.3.5 전문 반환 |
| PG-ISO | https://www.postgresql.org/docs/current/transaction-iso.html | PostgreSQL GDG | 1차 | (요약) |
| KLEPP-LOCK | How to do distributed locking — https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html | Martin Kleppmann | 1차 | 본문 (요약) |
| KLEPP-FIG1 | https://martin.kleppmann.com/2016/02/unsafe-lock.png (캡션: "Unsafe access to a resource protected by a distributed lock") | Martin Kleppmann | 1차 | **직접 봄** [봄] |
| KLEPP-FIG2 | https://martin.kleppmann.com/2016/02/fencing-tokens.png (캡션: "Using fencing tokens to make resource access safe") | Martin Kleppmann | 1차 | **직접 봄** [봄] |
| REDIS-DLM | Distributed Locks with Redis — https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/ | Redis | 1차 | 원문 반환(전문) |
| WOOWA-LOCK | MySQL을 이용한 분산락으로 여러 서버에 걸친 동시성 관리 — https://techblog.woowahan.com/2631/ | 우아한형제들 | 1차(사례) | (요약) |
| WONDER-DL | 데드락 발생 원인과 로그 분석 — https://tech.wonderwall.kr/articles/deadlock/ | 원더월 | 1차(사례) | (요약) |
| WOOWA-ES | 검색 성능 개선을 위한 Elasticsearch 인덱스 구조와 쿼리 최적화 — https://techblog.woowahan.com/20161/ | 우아한형제들 | 1차(사례) | (요약) |
| DAPPER | Dapper, a Large-Scale Distributed Systems Tracing Infrastructure (Google Technical Report dapper-2010-1, April 2010) — https://static.googleusercontent.com/media/research.google.com/en//archive/papers/dapper-2010-1.pdf | Sigelman 외 (Google) | 1차 | PDF 직접 읽음 1~6쪽. Fig 1·2·3 [봄] |
| OTEL-TRACE | https://opentelemetry.io/docs/concepts/signals/traces/ | OpenTelemetry (CNCF) | 1차 | (요약) |
| OTEL-PRIMER | https://opentelemetry.io/docs/concepts/observability-primer/ | OpenTelemetry (CNCF) | 1차 | (요약), 그림은 [alt] |
| CRISP | CRISP: Critical Path Analysis for Microservice Architectures — https://www.uber.com/en-US/blog/crisp-critical-path-analysis-for-microservice-architectures/ | Uber | 1차(사례) | (요약), 그림 10장 캡션 [alt] |
| FLAME | Flame Graphs — https://www.brendangregg.com/flamegraphs.html | Brendan Gregg | 1차 | (요약) |
| USE | The USE Method — https://www.brendangregg.com/usemethod.html | Brendan Gregg | 1차 | (요약) |
| JAEGER | https://www.jaegertracing.io/docs/latest/frontend-ui/ | Jaeger (CNCF) | 1차 | (요약) — **확인 실패**(트레이스 상세 뷰 서술 없음) |
| ARCHIFY | `references/archify/archify/recipes/scenarios.mjs` (로컬, 읽기 전용) | archify (MIT) | 1차 | 레시피 11개 id 전부 확인, `incident-runbook` 블록 전문 |

열었으나 인용하지 못한 것: GitLab 2017 DB 장애 포스트모템(403 ×2), Atlassian Incident Management Handbook·인시던트 타임라인·심각도 문서(본문 미반환 ×3).

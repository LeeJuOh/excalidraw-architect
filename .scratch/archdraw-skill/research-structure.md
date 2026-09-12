# 구조 묶음 5행 — 라우팅 표 값 대조

> 조사일 2026-09-12 · 대상: [review.md](review.md) R09 다음 질문 6 "리서치 실행" ② 구조 묶음(시스템 개요 / 배치도 / 저장소 토폴로지 / 데이터 모델 / 의존 도달 범위).
> 행을 결정하는 문서가 아니다. 현재 값을 1차 출처로 대조한 결과와 제안이다.
> **확인 방법.** 모든 출처를 `curl`로 원문 HTML·PDF를 받아 텍스트로 풀고 인용 문장을 그 텍스트와 대조했다. 검색은 URL 찾기에만 썼다.
> 표시: **[본문]** 원문 텍스트 대조 / **[alt]** 그림은 alt·캡션·본문 설명으로만 앎 / **(요약)** 요약 모델을 거쳐 원문 재대조를 못 함.
> **이번 조사에서 이미지를 직접 본 것은 0건이다.** 모든 그림 관찰은 [alt] 또는 본문 서술이다. saga 조사 문서의 [봄]에 해당하는 항목이 없다.
> **로컬 확인.**
> - `wiki/index.md` 347줄 전문: 이 5행에 쓸 페이지 없음. 가장 가까운 것은 `concepts/code-graph-tools.md`(AST 코드 그래프·blast-radius 특화 도구 비교)와 `summaries/gitdiagram.md`·`summaries/diagram-design.md`. 셋 다 2차 정리물이라 인용하지 않았다.
> - `raw-articles/` 88개를 `c4|arch|uml|deploy|erd|entity|relation|replic|partition|shard|topolog|depend|graph|diagram|model|backstage|structurizr|monorepo|module`로 걸러 0건.
> - archify `scenarios.mjs` 전문: 이 묶음과 겹치는 레시피는 `system-overview`·`deployment-ownership` 둘. 저장소 토폴로지·데이터 모델·의존 도달 범위 레시피는 없다.
>
> **표기.** `[ID §절]`은 §5 출처 ID와 원문 절 제목이다. **(추론)**은 출처가 아니라 이 문서의 판단이다.

## 1. 요약

### 제안 행

| 상황 | 답하는 질문 | 그림 종류 | 필수요소 | 경계 |
|---|---|---|---|---|
| 시스템 개요 | 이 시스템은 무엇으로 이루어져 있고, 그 조각들이 서로·바깥과 어떻게 연결돼 있나? | 박스-화살표(정적 구조). **한 그림 = 줌 레벨 하나**, 그림마다 범위를 적는다. 레벨별 디테일 고정(L2 엔드포인트·토픽명 / L3 모듈명·소유 테이블명 / L4부터 클래스)은 여기 규칙 | ① 줌 레벨과 범위 ② 이 레벨의 주 요소 ③ 바깥 사용자·외부 시스템 ④ 소유·신뢰 경계 ⑤ 연결마다 의도·기술 라벨 ⑥ 요소마다 책임 한 줄 | 인스턴스·환경 얘기가 나오면 배치도 행. 한 요청의 호출 순서면 API 동작 행 |
| 배치도 | 각 배포 단위는 어느 환경 어디에 몇 개나 떠 있고, 어떤 연결이 경계를 넘나? | 배포 다이어그램 — 중첩 사각형(리전▷네트워크▷클러스터▷호스트) 안에 배포 단위 인스턴스 박스, 노드 사이 선은 통신 경로. UML 큐브 표기의 캔버스 근사 | ① 환경 ② 배포 노드 계층(리전·네트워크·클러스터) ③ 노드마다 올라간 배포 단위와 인스턴스 수 ④ 상태 저장 서비스 ⑤ 경계를 넘는 연결과 수단 ⑥ 헬스체크 ⑦ 단일장애점 ⑧ 워크로드 소유 | "장애 나면 뭘 하나"는 장애 대응 흐름 행. 저장소 **안**의 데이터 배치는 저장소 토폴로지 행 |
| 저장소 토폴로지 | 이 데이터는 어느 저장소에 몇 벌로 나뉘어 살고, 어떤 읽기가 최신이 아닐 수 있나? | 박스-화살표(정적 구조) — 저장소 하나를 샤드·복제본 박스로 펼치고, 복제 화살표에 동기/비동기 라벨, 쓰기·읽기 진입 화살표를 따로 그린다. 해시 링은 캔버스 근사로 토큰 범위 목록 | ① 복제 방식과 역할(리더/팔로워, sync/async) ② 파티션·샤드 키와 그 키로 나뉜 범위 ③ 복제본 수와 배치(장애 도메인) ④ 어느 읽기가 stale 허용인지 ⑤ 지연·충돌로 생기는 제약 | 명령 쪽 분리 없이 읽기 복제본만 두면 이 행(CQRS 아님). 다른 저장소 종류로 데이터가 옮겨가면 데이터 흐름 행 |
| 데이터 모델 | 이 도메인의 데이터는 어떤 엔티티와 관계로 짜여 있나? | ERD — 박스(엔티티)+선(관계), 선 끝에 카디널리티를 **텍스트 라벨**로. crow's foot 기호는 전용 렌더러가 필요하므로 `1` / `0..*` 같은 문자열로 대체 | ① 엔티티와 식별자 ② 관계와 카디널리티 ③ 식별 관계인지(존재 의존) ④ 인덱스 ⑤ 소유 경계 ⑥ 관계 자신의 속성·역할 | 스키마를 **바꾸는** 계획이면 마이그레이션 행. 샤드 키·복제는 저장소 토폴로지 행 |
| 의존 도달 범위 | 이 조각을 건드리면 의존 그래프에서 어디까지 닿나 — 누가 이걸 쓰고, 이건 누구를 쓰나? | 기존 의존성 그림(박스-화살표) 위 오버레이 — 기준 노드 한 색, 나를 쓰는 쪽/내가 쓰는 쪽 각각 다른 색, 나머지는 흐리게 | ① 기준 노드 ② 두 방향을 각각 표시 ③ 깊이(직접/전이 몇 단계) ④ 그래프를 무엇을 읽어 만들었나 ⑤ 그래프 범위 | "안 그림: 실제 영향은 판단 안 함(도달 ≠ 영향)" 유지. 이벤트 구독은 정적 의존 그래프에 안 잡힌다 → 이벤트 토폴로지 행 |

### 판단

1. **빈 칸 두 개가 출처로 채워졌다.** 저장소 토폴로지의 그림 종류는 Vitess·MongoDB·PostgreSQL 문서가 같은 모양을 그린다(저장소 → 샤드 → 리더/팔로워). 5행 전부의 답하는 질문도 출처 문장에서 끌어왔다(§2 각 행 "질문 후보").
2. **9/5표 값은 대부분 유지된다. 다만 "레벨별 디테일 고정"은 필수요소가 아니다 (추론).** 그건 값이 아니라 그리기 규칙이라 그림 종류 칸으로 옮긴다. 작업 지시의 필수요소 정의("세 값으로 채울 수 있는 항목")에 맞지 않는다.
3. **배치도에 "환경"이 빠져 있었다.** C4·Structurizr·arc42가 모두 환경을 배포 그림의 전제로 둔다. C4는 "one per environment"라고 못 박는다 [C4-CONT §Notes]. 환경을 안 적으면 같은 그림이 스테이징인지 프로덕션인지 모른다.
4. **의존 도달 범위는 현재 "그리기 규칙만" 있고 필수요소가 비어 있었다.** 도구 넷(jdeps·Bazel·dependency-cruiser·Nx)이 공통으로 요구하는 입력이 그대로 필수요소가 된다 — 기준 노드·방향·깊이·범위. 이 넷이 없으면 같은 그림이 다른 뜻이 된다.
5. **"도달 ≠ 영향"은 출처가 양쪽으로 갈린다 (§4-3).** Nx는 그래프가 실제 영향을 **놓칠 수 있다**고 스스로 적고, dependency-cruiser는 `--reaches`를 "영향받을 모듈"이라 부른다. 우리 결정(영향 판단 안 함)을 뒤집을 근거는 아니지만, "안 그림" 줄의 문구는 이 갈림을 알고 쓴 것이라 기록해 둔다.
6. **시스템 개요와 배치도의 경계는 출처가 직접 그어 준다.** C4 컨테이너 그림 주석이 "클러스터링·로드밸런서·복제·페일오버는 여기서 거의 말하지 않는다"고 한다 [C4-CONT §Notes]. 경계 문장을 지어낼 필요가 없다.
7. **데이터 모델의 표기 근거는 Chen 원문이 아니라 IDEF1X·UML이다 (§4-1).** Chen 1976은 5쪽 발췌만 구했고 다이어그램 절(§3.2)을 못 봤다. 엔티티·관계·역할·관계의 속성은 발췌로 확인했고, 카디널리티 표기는 FIPS 184(IDEF1X)와 OMG UML로 채웠다.

## 2. 행별 조사 결과

### 2.1 시스템 개요

**질문 후보** (출처가 이 그림이 답한다고 말하는 것)

- "A system context diagram is a good starting point for diagramming and documenting a software system, allowing you to step back and see the big picture." [C4-CTX §System context diagram]
- 무엇으로 이루어졌나: "A software system is made up of one or more containers (applications and data stores), each of which contains one or more components, which in turn are implemented by one or more code elements" [C4-ABS §Abstractions]
- 경계는 어디인가: "System scope and context … delimits your system (i.e. your scope) from all its communication partners (neighboring systems and users, i.e. the context of your system). It thereby specifies the external interfaces." [ARC42-3 §Content]
- 구조를 왜 보나: "Maintain an overview of your source code by making its structure understandable through abstraction." [ARC42-5 §Motivation]
- 누가 소유하나: "What exists, who owns it, and how is it connected?" [ARCHIFY system-overview]

**출처의 그림**

| 출처 | 그림 종류 | 그려진 요소 | 확인 |
|---|---|---|---|
| C4-CTX | 박스-화살표 | 가운데 시스템 박스 하나, 둘레에 사용자와 상호작용하는 다른 시스템. "Draw a diagram showing your system as a box in the centre, surrounded by its users and the other systems that it interacts with." 그림 파일 `SystemContext.png`과 별도 `SystemContext-key.png`(범례) | [alt]+본문 |
| C4-CONT | 박스-화살표 | 시스템 경계 안의 컨테이너(앱·데이터 저장소), 컨테이너 사이 통신, 주요 기술 선택. 별도 범례 그림 | [alt]+본문 |
| C4-COMP | 박스-화살표 | 컨테이너 하나 안의 컴포넌트와 책임·기술. 범위 = "A single container" | [alt]+본문 |
| C4-LAND | 박스-화살표 | "a system context diagram without a specific focus on a particular software system" — 조직 범위의 사람·시스템 지도 | [alt]+본문 |
| ARC42-5 | 블랙박스/화이트박스 계층 | `building-block-hierarchy.png` — Level 1은 전체 시스템 화이트박스 + 내부 블록 블랙박스, Level 2는 고른 블록의 내부 | [alt]+본문 |
| BACKSTAGE | 박스-화살표 2장 | ① Component가 API를 제공·소비하고 Resource에 의존 ② Component·API·Resource를 System으로, System을 Domain으로 묶음 | [alt] |
| ARCHIFY | (레시피 텍스트) | include: 핵심 컴포넌트 8–12개, 주 경로 하나, 외부 의존, 소유·신뢰 경계 | 로컬 전문 |

→ 모두 박스-화살표다. **그리고 모두 "한 그림 = 한 추상화 수준"을 전제한다.** C4는 그림 종류마다 Scope / Primary elements / Supporting elements를 따로 정의하고, arc42는 레벨을 계층으로 쌓는다.

**필수요소 후보**

| 후보 | 근거 인용 | 값 3종으로 채울 수 있나 |
|---|---|---|
| ① 줌 레벨과 범위 | C4는 그림 종류마다 범위를 못 박는다: "Scope: A single software system" [C4-CTX], "Scope: A single container" [C4-COMP]. 검수 체크리스트 "Do you understand what the diagram type is?" / "Do you understand what the diagram scope is?" [C4-CHK §General] | 실제 값만(범위 없는 그림은 성립 안 함) / 확인 못 함 |
| ② 이 레벨의 주 요소 | "Primary elements: Containers within the software system in scope." [C4-CONT] / "Level 1 is the white box description of the overall system together with black box descriptions of all contained building blocks." [ARC42-5 §Form] | 실제 값 / 확인 못 함 |
| ③ 바깥 사용자·외부 시스템 | "Supporting elements: People (e.g. users, actors, roles, or personas) and software systems (external dependencies) that are directly connected to the software system in scope. Typically these other software systems sit outside the scope or boundary of your own software system, and you don't have responsibility or ownership of them." [C4-CTX §Supporting elements] / "Tip 3-9: Show all (all!) external interfaces!" [ARC42-3 §Practical Tips] | 실제 값 / 없음 확인(외부 의존 없음) / 확인 못 함 |
| ④ 소유·신뢰 경계 | "DFDs show the different paths through the system, highlighting the privilege or trust boundaries." · "Identifying trust levels that represent the access rights that the application will grant to external entities." [OWASP-TM §Step 1: Scope your work] / 스텐실 분류에 "Trust line/Border boundary: Corporate networks, internet, machine, sandbox, user/kernel mode" [MS-TMT §Stencils] / "APIs have a visibility: they are either public …, restricted … or private (only available within their system)." [BACKSTAGE §API] / 조직 엔티티 User·Group [BACKSTAGE §Organizational Entities] | 실제 값 / 없음 확인(경계 없음) / 확인 못 함 |
| ⑤ 연결마다 의도·기술 라벨 | "Does every arrow have a label describing the intent of that relationship?" · "Where applicable, do you understand the technology choices associated with every relationship? (e.g. protocols for inter-process communication)" [C4-CHK §Relationships] / "Tip 3-16: Use the technical context to describe protocols or channels!" [ARC42-3] | 실제 값 / 확인 못 함 (점선) |
| ⑥ 요소마다 책임 한 줄 | "Tip 5-5: Describe the responsibility or purpose of every (important) blackbox!" [ARC42-5 §Practical Tips] / 블랙박스 템플릿 첫 항목이 "Purpose/Responsibility" [ARC42-5 §5.1] / "Do you understand what every element does?" [C4-CHK §Elements] | 실제 값 / 확인 못 함 |

넣지 않은 것:

- **범례/키.** C4 체크리스트가 요구하지만("Does the diagram have a key/legend?" [C4-CHK §General]) PRD는 범례를 도면 모드 승격 항목으로 이미 정했다. 중복이라 필수요소로 올리지 않는다(추론).
- **핵심 컴포넌트 8–12개.** archify include지만 R09 질문 5에서 과밀 규칙(10~15)이 맡기로 확정됐다.
- **주 경로 하나.** archify include. 값이 아니라 그리는 규칙이라 그림 종류 칸에 둔다(R09 질문 5 확정과 같음). **archify 밖의 1차 출처를 못 찾았다**(§4-5).
- **각 박스의 소스코드 위치.** arc42가 세 번 반복해서 요구한다: "Tip 5-13: Explain the mapping of source-code to building blocks!", "Tip 5-14: Explain where to find the source code of your building blocks!", "Tip 5-18: Ensure **every** piece of source code can be located in the building block view!" [ARC42-5]. 우리 근거 태그 `코드`(파일:줄)가 같은 것을 이미 기록한다 — 다만 근거 태그는 사용자에게 안 보인다(R09 확정). **판정 보류: 눈에 보이는 항목으로 올릴지 02에서 확인**(추론).

**현재 값 판정**

| 항목 | 출처 표기 | 판정 | 근거 |
|---|---|---|---|
| 답하는 질문 (없음) | — | **추가** → "이 시스템은 무엇으로 이루어져 있고, 그 조각들이 서로·바깥과 어떻게 연결돼 있나?" | [C4-ABS §Abstractions]의 구성 정의 + [ARC42-3 §Content]의 경계 정의를 한 문장으로 합쳤다 |
| 그림 종류 "C4 레벨 그림"(PRD) / "C4 레벨별"(9/5표) | PRD·9/5표 | **수정** → "박스-화살표(정적 구조), 한 그림 = 줌 레벨 하나" | R09 질문 3에서 C4 이름은 이미 기각됐다. 출처도 C4를 표기가 아니라 추상화 체계로 정의한다: "Notation independent. Tooling independent." [C4-HOME]. 즉 "C4 그림"은 그림 종류 이름이 아니다 |
| "서비스→모듈→레이어, 각 레벨의 디테일 수준 고정" | 9/5표 + PRD 규칙 | **수정** → 필수요소에서 빼고 그림 종류 칸으로 | 값이 아니라 그리기 규칙이다(추론). 출처 형태도 규칙 쪽이다: C4는 그림 종류마다 Primary/Supporting elements를 고정하고 [C4-CTX·C4-CONT·C4-COMP], arc42는 "Tip 5-27: Refine only a few building blocks!" [ARC42-5] |
| "외부 의존" | archify | **유지+보강** → "바깥 사용자·외부 시스템" | C4가 사람과 외부 시스템을 함께 supporting elements로 묶는다 [C4-CTX]. "의존"만 적으면 사용자가 빠진다 |
| "소유·신뢰 경계" | archify | **유지** | [OWASP-TM §Step 1], [MS-TMT §Stencils], [BACKSTAGE §API] 셋이 각각 소유·신뢰를 그림 요소로 요구한다 |
| "주 경로 하나" | archify(그리는 규칙) | **유지**(그림 종류 칸) | 1차 출처 못 찾음. archify 한 곳뿐(§4-5) |
| (없음) | — | **추가** ① 줌 레벨과 범위 | [C4-CHK §General]이 그림마다 종류·범위를 묻는다 |
| (없음) | — | **추가** ⑤ 연결마다 의도·기술 라벨 | [C4-CHK §Relationships] |
| (없음) | — | **추가** ⑥ 요소마다 책임 한 줄 | [ARC42-5 §Practical Tips Tip 5-5], [C4-CHK §Elements] |

### 2.2 배치도

**질문 후보**

- "A deployment diagram allows you to illustrate how instances of software systems and/or containers in the static model are deployed on to the infrastructure within a given deployment environment (e.g. production, staging, development, etc)." [C4-DEP §Deployment diagram]
- "the mapping of (software) building blocks to that infrastructure elements" [ARC42-7 §Content]
- "Where does each workload run, and what crosses a boundary?" [ARCHIFY deployment-ownership]
- 몇 개나 떠 있나: "determine how many instances of each component satisfy your reliability targets" [AZ-RED §Build redundancy into your workload with multiple component instances]

**출처의 그림**

| 출처 | 그림 종류 | 그려진 요소 | 확인 |
|---|---|---|---|
| C4-DEP | 배포 다이어그램 3장 | 배포 노드(물리 서버·IaaS/PaaS·도커 컨테이너·실행 환경), **중첩 가능**, 그 안에 시스템/컨테이너 인스턴스. 인프라 노드(DNS·로드밸런서·방화벽)도 넣으라고 함. 예시 셋은 개발환경·라이브·AWS. 각 예시마다 별도 범례 그림 | [alt]+본문 |
| UML251 §19 | UML 배포 다이어그램 | DeploymentTarget은 "a perspective view of cube"(큐브)로 그리고 그 안에 배포된 요소와 Deployment 관계를 그린다. Deployment는 Dependency와 같은 점선, 밖에 그릴 땐 «deploy» 키워드. Node는 Device와 ExecutionEnvironment로 나뉘고 CommunicationPath로 이어진다 | [본문] (그림 19.2~19.7은 못 봄) |
| ARC42-7 | UML 배포 다이어그램(권장) | "geographical locations, environments, computers, processors, channels and net topologies" + 빌딩블록 매핑. "let them use any kind that is able to show nodes and channels of the infrastructure" | [alt]+본문 |
| STRUCTURIZR | DSL(그림 아님) | `deploymentEnvironment` ▷ `deploymentNode`(중첩 가능, `instances` 속성) ▷ `infrastructureNode` / `softwareSystemInstance` / `containerInstance` ▷ `healthCheck` | [본문] |
| AZ-FMA | 워크로드 컴포넌트 그림 | `failure-mode-example.png` — ingress·networking·compute·data·storage·supporting services·egress 컴포넌트 배치. 그 위에 플로우를 겹쳐 그리라고 함 | [alt] |
| AWS-REL10-3 | 셀 기반 아키텍처 | `cell-based-architecture.png` — 파티션 키로 나눈 셀들과 라우팅 계층 | [alt] |
| ARCHIFY | (레시피 텍스트) | include: 리전·네트워크, 워크로드 소유, 상태 저장 서비스, 이름 붙은 경계 통과 | 로컬 전문 |

→ **중첩 노드 + 그 안의 인스턴스**가 공통 뼈대다. UML 원문은 큐브를, C4는 UML을 따랐다고 밝힌다("It's based upon a UML deployment diagram." [C4-DEP]). 캔버스에서 큐브는 부담이라 중첩 사각형으로 근사한다(추론 — §4-4).

**필수요소 후보**

| 후보 | 근거 인용 | 값 3종 |
|---|---|---|
| ① 환경 | "within a given deployment environment (e.g. production, staging, development, etc)" · "Deployment information is better captured via one or more deployment diagrams, one per environment." [C4-DEP, C4-CONT §Notes] / "Often systems are executed in different environments… you should document all relevant environments." [ARC42-7 §Content] / `deploymentEnvironment` 키워드 [STRUCTURIZR] | 실제 값 / 확인 못 함 |
| ② 배포 노드 계층 | "perhaps physical infrastructure …, virtualised infrastructure …, containerised infrastructure …, an execution environment … Deployment nodes can be nested." [C4-DEP] / "infrastructure elements like geographical locations, environments, computers, processors, channels and net topologies" [ARC42-7] / "Each Region is physically and logically independent and consists of three or more Availability Zones (AZs)." [AWS-REL10-1] / "regions and networks" [ARCHIFY] | 실제 값 / 확인 못 함 |
| ③ 배포 단위 배치와 인스턴스 수 | "Primary and supporting elements: Deployment nodes, software system instances, and container instances." [C4-DEP] / "`instances` is used to set the number of instances of a deployment node. This can either be a static number, or a range (e.g. 0..1, 1..3, 5..10, 0..N …)" [STRUCTURIZR §instances] / "determine how many instances of each component satisfy your reliability targets" [AZ-RED] | 실제 값(예: `3`, `1..N`) / 확인 못 함 |
| ④ 상태 저장 서비스 | "In C4, a container is an application or a data store." [C4-CONT] / "Keep your compute layer clean of any state because individual nodes that serve requests might be deleted, faulted, or replaced at any time." [AZ-RED §Compute resources] / "stateful services" [ARCHIFY] | 실제 값 / 없음 확인(무상태) / 확인 못 함 |
| ⑤ 경계를 넘는 연결과 수단 | "You may also want to include infrastructure nodes such as DNS services, load balancers, firewalls, etc." [C4-DEP] / `infrastructureNode`는 "typically something like a load balancer, firewall, DNS service" [STRUCTURIZR] / Node는 CommunicationPath로 이어진다 [UML251 §19.4.3 Nodes] / "label every cross-boundary mechanism" [ARCHIFY] | 실제 값 / 없음 확인 / 확인 못 함 |
| ⑥ 헬스체크 | "`healthCheck <name> <url> [interval] [timeout]` … defines a HTTP health check for the parent software system/container instance. The interval is a number of seconds (default 60s), and the timeout is a number of milliseconds (default 0ms)." [STRUCTURIZR §healthCheck] / 세 종류와 각각의 역할: startup은 "verify whether the application within a container is started", liveness는 "determine when to restart a container", readiness는 "determine when a container is ready to accept traffic" [K8S-PROBE §Types of probe] | 실제 값(종류·대상·주기) / 없음 확인(헬스체크 없음 — 위험이 드러난 값) / 확인 못 함 |
| ⑦ 단일장애점 | "Identify your workload dependencies to perform your single point of failure analysis." [AZ-FMA §Identify workload dependencies] / "A fundamental principle for service design in AWS is to avoid single points of failure, including the underlying physical infrastructure." · 안티패턴 "Your production workload exists only in a single Availability Zone." [AWS-REL10-1] / "Fault isolated boundaries restrict the effect of a failure within a workload to a limited number of components." [AWS-REL10-3] | 실제 값 / 없음 확인(전부 이중화) / 확인 못 함 |
| ⑧ 워크로드 소유 | "Group resources by region, network, cluster, and owner" [ARCHIFY] / User·Group 엔티티 [BACKSTAGE §Organizational Entities] | 실제 값 / 확인 못 함 |

넣지 않은 것:

- **강한/약한 의존 구분.** "Classify dependencies as either strong or weak to help you identify which components are essential to the application." [AZ-FMA §Plan mitigation strategies]. ⑦ 단일장애점 판단의 재료라 ⑦에 흡수(추론).
- **blast radius·완화 전략.** [AZ-FMA]가 요구하지만 장애 대응 흐름 행(다른 묶음)의 값이다(추론).
- **셀·파티션 키.** [AWS-REL10-3]. 저장소 토폴로지 행 ②와 겹친다(추론).

**현재 값 판정**

| 항목 | 출처 표기 | 판정 | 근거 |
|---|---|---|---|
| 답하는 질문 (없음) | — | **추가** → "각 배포 단위는 어느 환경 어디에 몇 개나 떠 있고, 어떤 연결이 경계를 넘나?" | [C4-DEP]의 정의 문장 + [ARCHIFY]의 question을 합쳤다 |
| 그림 종류 "배포 다이어그램" | 9/5표 | **유지+보강** → 중첩 사각형 + 통신 경로선(UML 큐브의 캔버스 근사) | "It's based upon a UML deployment diagram." [C4-DEP] / UML 원문 표기는 큐브 [UML251 §19.2.4 Notation] |
| "인스턴스 수" | 9/5표 | **유지+보강** → "노드마다 올라간 배포 단위와 인스턴스 수" | Structurizr는 인스턴스 수를 노드의 속성으로 둔다 [STRUCTURIZR §instances]. 어느 노드의 몇 개인지가 같이 있어야 값이 된다 |
| "헬스체크" | 9/5표 | **유지+보강** → 종류·대상·주기 | [K8S-PROBE]는 세 종류가 각각 다른 판단(재시작 / 트래픽 차단 / 초기화 대기)을 만든다고 한다. 종류 없이 "있음"만 적으면 판단이 안 선다 |
| "단일장애점" | 9/5표 | **유지** | [AZ-FMA §Identify workload dependencies], [AWS-REL10-1] |
| "리전·네트워크" | archify | **유지+보강** → "배포 노드 계층(리전·네트워크·클러스터)" | C4는 노드가 중첩된다고 명시한다 [C4-DEP]. 두 층만 적으면 계층이 안 보인다 |
| "워크로드 소유" | archify | **유지** | [ARCHIFY], [BACKSTAGE §Organizational Entities] |
| "상태 저장 서비스" | archify | **유지** | [AZ-RED §Compute resources], [C4-CONT] |
| "경계를 넘는 연결" | archify | **유지+보강** → "…와 수단" | archify 원문이 "label every cross-boundary mechanism"으로 수단까지 요구한다 |
| (없음) | — | **추가** ① 환경 | [C4-CONT §Notes] "one per environment", [ARC42-7 §Content], [STRUCTURIZR] |

### 2.3 저장소 토폴로지

**질문 후보**

- PRD 구어 "DB 어떻게 구성돼?"
- 어디에 나뉘어 사나: "A keyspace in Vitess can be sharded or unsharded. … If sharded, the rows of the keyspace are partitioned into different databases of identical schema." [VITESS §Overview]
- 몇 벌인가: "Each partition is replicated to multiple physical nodes, often across failure domains such as racks and even datacenters." [CASS-DYN §Dataset Partitioning: Consistent Hashing]
- 어느 읽기가 오래됐나: "All read preference modes except primary may return stale data because secondaries replicate operations from the primary in an asynchronous process." [MONGO-RP §Behavior] / "the responses might not reflect the results of a recently completed write operation" [DDB-READ §Eventually consistent reads]

**출처의 그림**

| 출처 | 그림 종류 | 그려진 요소 | 확인 |
|---|---|---|---|
| VITESS | (본문 서술) | keyspace ▷ shard ▷ "one MySQL primary and many MySQL replicas". 샤드 이름이 키 범위(`-40`, `40-80`, `80-c0`, `c0-`) | [본문] |
| MONGO-RP | 박스-화살표 | `replica-set-read-preference.bakedsvg.svg` — "Read operations to a replica set showing default and `nearest` read preference routing." 즉 읽기 화살표가 primary/secondary 어디로 가는지 | [alt] |
| MONGO-KEY | 범위 그림 | "Diagram of the shard key value space segmented into smaller ranges or chunks." | [alt] |
| DDB-PART | 박스-화살표 | "DynamoDB's distribution of table items across partitions based on the partition key's hash value." 표 하나가 여러 파티션에 걸쳐 있는 그림 | [alt] |
| CASS-DYN | 링 그림 | `ring.svg`(8노드·RF=3 토큰 링), `vnodes.svg`(물리 4노드에 토큰 8개) | [alt] |
| PG-REPL | 표 | 표 26.1 — 8가지 복제 방식 × 8가지 특성(다중 프라이머리 허용, 대기 여부, 프라이머리 장애 시 무손실, 복제본 읽기 가능…) | [본문] |

→ 그림 종류가 둘로 갈린다. **(a) 저장소 → 샤드 → 리더/팔로워 박스 중첩**(Vitess·MongoDB·DynamoDB)과 **(b) 해시 링**(Cassandra). 캔버스에서는 (a)를 기본으로 하고 링은 토큰 범위 목록으로 근사한다(추론). PostgreSQL은 그림 대신 특성 표를 쓴다.

**필수요소 후보**

| 후보 | 근거 인용 | 값 3종 |
|---|---|---|
| ① 복제 방식과 역할 | "PostgreSQL streaming replication is asynchronous by default. If the primary server crashes then some transactions that were committed may not have been replicated to the standby server, causing data loss." [PG-SYNC §26.2.8 Synchronous Replication] / "Replication is asynchronous by default" · "With semisynchronous replication, a commit performed on the source blocks before returning to the session that performed the transaction until at least one replica acknowledges that it has received and logged the events" [MYSQL-REPL (요약)] / "A Vitess shard typically contains one MySQL primary and many MySQL replicas. The primary handles write operations, while replicas handle read-only traffic" [VITESS §Overview] | 실제 값 / 없음 확인(복제 없음 단일 인스턴스) / 확인 못 함 |
| ② 파티션·샤드 키와 범위 | "To write an item to the table, DynamoDB uses the value of the partition key as input to an internal hash function. The output value from the hash function determines the partition in which the item will be stored." [DDB-PART §Data distribution: Partition key] / "A shard's name identifies the start and end of the shard's key range, printed in hexadecimal and separated by a hyphen." [VITESS §Shard Names] / "The shard key is either a single indexed field or multiple fields covered by a compound index that determines the distribution of the collection's documents among the cluster's shards." [MONGO-KEY §Shard Keys] / "Cassandra instead maps every node to one or more tokens on a continuous hash ring" [CASS-DYN] | 실제 값 / 없음 확인(샤딩 안 함) / 확인 못 함 |
| ③ 복제본 수와 배치 | "a replication factor (RF) of 3 … Each partition is replicated to multiple physical nodes, often across failure domains such as racks and even datacenters." [CASS-DYN] / "`synchronous_standby_names = 'FIRST 2 (s1, s2, s3)'`" · "`ANY 2 (s1, s2, s3)`" [PG-SYNC §26.2.8.2 Multiple Synchronous Standbys] / "automatically replicated across multiple Availability Zones within an AWS Region" [DDB-PART] | 실제 값 / 확인 못 함 |
| ④ 어느 읽기가 stale 허용인지 | 읽기마다 지정한다: "Read operations such as `GetItem`, `Query`, and `Scan` provide an optional `ConsistentRead` parameter." · "Eventually consistent is the default read consistent model for all read operations." [DDB-READ] / 모드 5종(primary·primaryPreferred·secondary·secondaryPreferred·nearest)과 `maxStalenessSeconds` [MONGO-RP §Read Preference Modes] / "We say that data on the standby is eventually consistent with the primary." [PG-HOT §26.4.1 User's Overview] | 실제 값 / 없음 확인(전부 리더 읽기) / 확인 못 함 |
| ⑤ 지연·충돌로 생기는 제약 | "the cancel mechanism has parameters, max_standby_archive_delay and max_standby_streaming_delay, that define the maximum allowed delay in WAL application. Conflicting queries will be canceled once it has taken longer than the relevant delay setting" · "tables that are regularly and heavily updated on the primary server will quickly cause cancellation of longer running queries on the standby" [PG-HOT §26.4.2 Handling Query Conflicts] / "incautious use of synchronous replication will reduce performance for database applications because of increased response times and higher contention" [PG-SYNC §26.2.8.3 Planning for Performance] / "Cassandra uses a simpler last-write-wins model where every mutation is timestamped" [CASS-DYN] | 실제 값 / 없음 확인 / 확인 못 함 |

넣지 않은 것:

- **인덱스.** 데이터 모델 행이 맡는다(추론). 단 MongoDB는 샤드 키가 인덱스여야 한다고 하므로 [MONGO-KEY] 두 행이 같은 값을 가리킬 수 있다.
- **읽기 복제본 재구축·백업.** 마이그레이션·장애 대응 행의 값이다(추론).

**현재 값 판정**

| 항목 | 출처 표기 | 판정 | 근거 |
|---|---|---|---|
| 질문 "DB 어떻게 구성돼?" | PRD(구어) | **수정** → "이 데이터는 어느 저장소에 몇 벌로 나뉘어 살고, 어떤 읽기가 최신이 아닐 수 있나?" | 세 필수요소(복제·파티션·stale)를 한 문장에 담았다. 출처도 이 셋을 한 묶음으로 다룬다 [VITESS §Overview]는 샤딩과 복제를 "orthogonal"이라 부르며 한 페이지에서 같이 설명한다 |
| 그림 종류 (없음) | — | **추가** → 박스-화살표(저장소▷샤드▷리더/팔로워), 복제 화살표에 sync/async 라벨 | [VITESS §Overview], [MONGO-RP 그림 alt], [DDB-PART 그림 alt]가 같은 구조다. 라벨은 [PG-SYNC]의 기본값 구분이 근거 |
| "복제 방식(sync/async, 리더/팔로워)" | PRD | **유지+보강** → "복제 방식과 역할" | MySQL의 semisynchronous는 둘 사이에 있다 [MYSQL-REPL (요약)]. PostgreSQL은 `remote_write`/`on`/`remote_apply` 세 단계를 더 나눈다 [PG-SYNC §26.2.8.1]. 2값이 아니라 단계 값이다 |
| "파티션 키" | PRD | **유지+보강** → "파티션·샤드 키와 그 키로 나뉜 범위" | 키만으로는 어디에 가는지 모른다. Vitess는 범위를 샤드 이름으로 박아 둔다 [VITESS §Shard Names] |
| "어느 읽기가 stale 허용인지" | PRD | **유지+보강** → 읽기 **요청마다** 어디로 가는지 | DynamoDB는 요청 파라미터 [DDB-READ], MongoDB는 read preference + `maxStalenessSeconds` [MONGO-RP]. "이 저장소는 stale 허용"이 아니라 "이 읽기는" 단위다 |
| (없음) | — | **추가** ③ 복제본 수와 배치 | [CASS-DYN] RF, [PG-SYNC §26.2.8.2] FIRST/ANY 정족수 |
| (없음) | — | **추가** ⑤ 지연·충돌로 생기는 제약 | [PG-HOT §26.4.2]. 과할 수 있다 — 02에서 "없음 확인"이 반복되면 뺄 후보(추론) |

### 2.4 데이터 모델

**질문 후보**

- "A data model, called the entity-relationship model, is proposed. … A special diagrammatic technique is introduced as a tool for database design." [CHEN76 초록]
- 무엇이 엔티티이고 무엇이 관계인가: "An entity is a 'thing' which can be distinctly identified." · "A relationship is an association among entities." [CHEN76 §2.2 Level 1]
- 몇 대 몇인가: "The connection relationship may be further defined by specifying the cardinality of the relationship. That is, the specification of how many child entity instances may exist for each parent instance." [FIPS184 §3.5.1]
- 누가 소유하나: "What's the database architecture in a microservices application?" [MSIO-DBPS §Problem]

**출처의 그림**

| 출처 | 그림 종류 | 그려진 요소 | 확인 |
|---|---|---|---|
| CHEN76 | 레벨 그림·속성 그림·표 | Fig 1은 네 레벨 × 네 모델 대응표. Fig 2는 엔티티 집합 PERSON에서 값 집합으로 가는 속성 화살표(EMPLOYEE-NO, AGE→NO-OF-YEARS). Fig 4·5는 엔티티/관계 정보를 표로. **ER 다이어그램 자체(§3.2)는 발췌에 없다** | [본문] 5쪽 발췌만 |
| FIPS184 | IDEF1X 뷰 다이어그램 | 부모·자식 엔티티를 잇는 선, 자식 끝에 점. 카디널리티 기호 P(1 이상) / Z(0 또는 1) / n(정확히 n) / n-m(범위). 식별 관계는 실선 + 자식은 모서리 둥근 상자 | [본문] (Figure 4·5 이미지는 못 봄) |
| UML251 | 클래스 다이어그램 multiplicity | "The multiplicity of a MultiplicityElement specifies valid cardinalities of the collection it represents." 하한·상한, 무한은 `*` | [본문] |
| MSIO-DBPS | 박스-화살표 | `databaseperservice.png` — 서비스마다 자기 DB. 앞에 `customersandorders.png` | [alt]+본문 |
| FOWLER-AGG | (그림 없음) | 본문만 | [본문] |

→ ERD의 카디널리티 표기는 표준마다 다르다(§4-2). 셋 다 **선 끝에 붙은 값**이라는 점만 같다.

**필수요소 후보**

| 후보 | 근거 인용 | 값 3종 |
|---|---|---|
| ① 엔티티와 식별자 | "An entity is a 'thing' which can be distinctly identified." · "Entities are classified into different entity sets such as EMPLOYEE, PROJECT, and DEPARTMENT." [CHEN76 §2.2.1] / "the primary key attributes of the parent entity are also migrated primary key attributes of the child entity" [FIPS184 §3.5.2.1] | 실제 값 / 확인 못 함 |
| ② 관계와 카디널리티 | 카디널리티 5종: "Each parent entity instance may have zero or more…", "must have at least one…", "can have zero or one…", "some exact number…", "a specified range…" [FIPS184 §3.5.1] / 표기: "A 'P' (for positive) is placed beside the dot to indicate a cardinality of one or more. A 'Z' is placed beside the dot to indicate a cardinality of zero or one." [FIPS184 §3.5.2] / "The cardinality of a collection is the number of values contained in that collection. The multiplicity … specifies valid cardinalities" [UML251 §7.5.3.2] | 실제 값 / 확인 못 함 |
| ③ 식별 관계인지 | "If an instance of the child entity is identified by its association with the parent entity, then the relationship is referred to as an 'identifying relationship' … The child in an identifying relationship is always existence-dependent on the parent" [FIPS184 §3.5.1.1] / "A solid line depicts an identifying relationship between the parent and child entities." [FIPS184 §3.5.2.1] | 실제 값 / 없음 확인(전부 비식별) / 확인 못 함 |
| ④ 인덱스 | "it is the task of the database programmer to foresee which indexes will be useful" · "After an index is created, the system has to keep it synchronized with the table. This adds overhead to data manipulation operations. … Therefore indexes that are seldom or never used in queries should be removed." [PG-IDX §11.1 Introduction] | 실제 값 / 없음 확인(인덱스 없음) / 확인 못 함 |
| ⑤ 소유 경계 | "Keep each microservice's persistent data private to that service and accessible only via its API. A service's transactions only involve its database." · 세 가지 방식 "Private-tables-per-service / Schema-per-service / Database-server-per-service" [MSIO-DBPS §Solution] / "Any references from outside the aggregate should only go to the aggregate root." · "Transactions should not cross aggregate boundaries." [FOWLER-AGG] | 실제 값 / 없음 확인(단일 서비스·단일 스키마) / 확인 못 함 |
| ⑥ 관계 자신의 속성·역할 | "Note that relationships also have attributes. Consider the relationship set PROJECT-WORKER… The attribute PERCENTAGE-OF-TIME … is neither an attribute of EMPLOYEE nor an attribute of PROJECT, since its meaning depends on both" [CHEN76 §2.2.3] / "The role of an entity in a relationship is the function that it performs in the relationship. 'Husband' and 'wife' are roles." [CHEN76 §2.2.2] | 실제 값 / 없음 확인(관계에 속성 없음) / 확인 못 함 |

넣지 않은 것:

- **속성 전체 목록.** 어느 출처도 모든 속성을 그리라 하지 않는다. Chen은 속성을 엔티티 집합에서 값 집합으로 가는 함수로 정의할 뿐이다 [CHEN76 §2.2.3]. 과밀 규칙과 충돌한다(추론).
- **정규화 단계.** Chen Fig 1에 3NF가 나오지만 [CHEN76 Fig 1], 그림에 값으로 적을 항목이 아니다(추론).

**현재 값 판정**

| 항목 | 출처 표기 | 판정 | 근거 |
|---|---|---|---|
| 답하는 질문 (없음) | — | **추가** → "이 도메인의 데이터는 어떤 엔티티와 관계로 짜여 있나?" | [CHEN76 §2.2] 엔티티·관계 정의 |
| 그림 종류 "ERD" | 9/5표 | **유지+보강** → 카디널리티를 텍스트 라벨로(crow's foot 기호 대신) | 표기는 표준마다 다르고 [FIPS184 §3.5.2] vs [UML251 §7.5.3.2], 셋 다 선 끝의 값이다. UML의 문자열 표기가 캔버스에 그대로 옮겨진다(추론) |
| "카디널리티" | 9/5표 | **유지+보강** → 5종 구분(0+ / 1+ / 0-1 / 정확히 n / 범위) | [FIPS184 §3.5.1]. "1:n"만 적으면 0 허용 여부가 안 보인다 |
| "인덱스" | 9/5표 | **유지** | [PG-IDX §11.1] |
| "소유 경계" | 9/5표(둘째 버전) | **유지+보강** → 서비스 소유 + 애그리거트 경계 | [MSIO-DBPS §Solution]은 서비스 단위, [FOWLER-AGG]는 트랜잭션 단위. 둘은 다른 경계다 |
| (없음) | — | **추가** ① 엔티티와 식별자 | [CHEN76 §2.2.1], [FIPS184 §3.5.2.1] |
| (없음) | — | **추가** ③ 식별 관계인지 | [FIPS184 §3.5.1.1] |
| (없음) | — | **추가** ⑥ 관계 자신의 속성·역할 | [CHEN76 §2.2.2·§2.2.3]. m:n 연결 테이블이 그림에서 사라지는 것을 막는다(추론) |

### 2.5 의존 도달 범위

**질문 후보**

- PRD 구어 "payment 바꾸면 어디?"
- 누가 나를 쓰나: "Analyzes the dependences per other given options and then finds all artifacts that directly and indirectly depend on the matching nodes." [JDEPS §-I or --inverse]
- "The `rdeps(u, x)` operator evaluates to the reverse dependencies of the argument set x within the transitive closure of the universe set u." [BAZEL-Q §Transitive closure of reverse dependencies: rdeps]
- 양쪽 다: "You can use this e.g. to inspect one module or folder and see what the direct dependencies are and which modules are direct dependents." [DEPCRUISE-CLI §--focus]
- "Determine which projects depend on the projects you modified." [NX-AFF §Using Nx affected commands]

**출처의 그림**

| 출처 | 그림 종류 | 그려진 요소 | 확인 |
|---|---|---|---|
| JDEPS | 텍스트 그래프 | `--inverse` 출력이 `java.xml.bind <- java.xml.ws <- java.se.ee` 형태의 역방향 체인. `-dotoutput`으로 DOT 파일, 아카이브별 `.dot` + `summary.dot` | [본문] |
| BAZEL-Q/G | DOT→SVG 그래프 | `bazel query "allpaths(//foo, third_party/...)" --output graph \| dot -Tsvg` — 두 지점 사이 경로만 남긴 부분 그래프 | [본문] |
| DEPCRUISE-CLI | DOT/mermaid 그래프 | `--focus`(이웃만), `--reaches`(전이 의존자만), `--highlight`(색칠). GitHub Action 예시 문구: "Modules changed in this PR have a fluorescent green color. All other modules in the graph are those directly or indirectly affected by changes in the green modules." | [본문] |
| NX-GRAPH | 인터랙티브 그래프 | 프로젝트 노드·의존 엣지, `--focus <project>`, proximity·group by folder, composite 노드 접기·펼치기, 두 프로젝트 사이 체인 추적("choosing a Start and End point") | [본문] |
| NX-AFF | 색칠 오버레이 | "Making a change in lib10 only affects a sub-part of the project graph (shown in purple)" | [alt] |
| ARCHIFY | 레시피 없음 | 도달 범위는 레시피가 아니라 뷰어의 upstream/downstream 추적 기능 (review.md 확인된 사실) | 로컬 |

→ **기존 그래프 위에 색으로 부분집합을 덮는 방식**이 공통이다. dependency-cruiser와 Nx는 "바뀐 것 한 색 + 닿는 것 다른 색"을 문서에 직접 적었다. PRD의 오버레이 규칙은 출처와 맞는다.

**필수요소 후보**

| 후보 | 근거 인용 | 값 3종 |
|---|---|---|
| ① 기준 노드 | `rdeps(u, x)`의 x [BAZEL-Q] / `--reaches "^src/report/utl/index.js"` [DEPCRUISE-CLI §--reaches] / "Use Git to determine the files you changed in your PR. Use the project graph to determine which projects the files belong to." [NX-AFF] | 실제 값 / 확인 못 함 |
| ② 두 방향을 각각 표시 | 기본 출력은 내가 쓰는 쪽, `--inverse`가 나를 쓰는 쪽 [JDEPS] / `--focus`는 "direct dependencies … and which modules are direct dependents" 양쪽, `--reaches`는 전이 의존자만 [DEPCRUISE-CLI] | 실제 값 / 없음 확인(한쪽이 비어 있음) / 확인 못 함 |
| ③ 깊이 | "The `rdeps` operator accepts an optional third argument, which is an integer literal specifying an upper bound on the depth of the search. … So `rdeps(//foo, //common, 1)` evaluates to all nodes in the transitive closure of //foo that directly depend on //common. … If the depth parameter is omitted, the search is unbounded." [BAZEL-Q] / "A value of 1 (which is also the default) means _direct neighbours only_. 2 also shows the neighbour's neighbours, etc. The value 0 means 'infinite'." [DEPCRUISE-CLI §--focus-depth] / "-R or --recursive: Recursively traverses all run-time dependences." · "--no-recursive" [JDEPS] | 실제 값(예: 직접만 / 2단계 / 무한) / 확인 못 함 |
| ④ 그래프를 무엇을 읽어 만들었나 | "It always stays up to date without having to actively maintain a document as it is calculated by analyzing your source code." [NX-GRAPH §Explore the project graph] / jdeps는 "path name to a .class file, a directory, a JAR file"를 읽는다 [JDEPS §Description] / "Click on any dependency line to find which file(s) created the dependency." [NX-GRAPH] | 실제 값(선언 파일 / 디렉터리 관례 / import 추론) / 확인 못 함 |
| ⑤ 그래프 범위 | "the transitive closure of the universe set u" · `--universe_scope` [BAZEL-Q §rdeps·allrdeps] / `--include-only "^src"` [DEPCRUISE-CLI §--focus 예시] | 실제 값 / 확인 못 함 |

넣지 않은 것:

- **경로(어떤 체인으로 닿나).** Bazel `allpaths`/`somepath` [BAZEL-Q §Path operators], Nx "trace the dependency chain between two projects by choosing a Start and End point" [NX-GRAPH]. 두 노드가 정해졌을 때만 의미가 있어 별도 질문에 가깝다 — **제거 후보가 아니라 보류**(추론).
- **접기(과밀 처리).** Nx composite 노드 [NX-GRAPH], dependency-cruiser `--collapse` [DEPCRUISE-CLI]. 과밀 규칙이 맡는다.

**현재 값 판정**

| 항목 | 출처 표기 | 판정 | 근거 |
|---|---|---|---|
| 질문 "payment 바꾸면 어디?" | PRD(구어) | **수정** → "이 조각을 건드리면 의존 그래프에서 어디까지 닿나 — 누가 이걸 쓰고, 이건 누구를 쓰나?" | "어디"가 도달인지 영향인지 안 갈린다. 출처는 둘을 나눈다(§4-3). 두 방향은 [JDEPS §--inverse]와 [DEPCRUISE-CLI §--focus]의 구분 |
| 그림 종류 "의존성 + 오버레이" | PRD·9/5표 | **유지+보강** → 기준 노드도 별도 색 | "Modules changed in this PR have a fluorescent green color. All other modules in the graph are those directly or indirectly affected" [DEPCRUISE-CLI §--affected] — 기준과 도달을 다른 색으로 나눈다. 현재 값은 두 방향만 나눴다 |
| "직접/전이 depth" | 9/5표(둘째 버전) | **유지+보강** → 그림에 깊이 값을 적는다 | [BAZEL-Q §rdeps]는 깊이가 없으면 무한 탐색이라고 한다. 깊이를 안 적으면 같은 그림이 다른 뜻이 된다 |
| "숨은 결합은 점선" | 9/5표(둘째 버전) | **폐기 유지** | 작업 지시의 고정 사항. 출처에서도 정적 의존 도구는 숨은 결합을 만들지 않는다 — jdeps·Bazel·dependency-cruiser·Nx 모두 선언·import만 읽는다 [JDEPS §Description, NX-GRAPH] |
| "안 그림: 실제 영향은 판단 안 함(도달 ≠ 영향)" | PRD(고정) | **유지** | 다만 출처가 갈린다(§4-3) |
| (없음) | — | **추가** ① 기준 노드 ② 두 방향 ④ 그래프 근거 ⑤ 범위 | 위 표 |

## 3. 인접 행과의 겹침 (전부 추론)

| 행 × 행 | 같은 질문인가 | 처리 |
|---|---|---|
| 시스템 개요 × 배치도 | 아니다. 출처가 직접 나눈다: "This diagram says very little about deployment aspects such as clustering, load balancers, replication, failover, etc because it will likely vary across different environments… Deployment information is better captured via one or more deployment diagrams, one per environment." [C4-CONT §Notes] | 인스턴스·환경 얘기가 나오면 배치도 행. 같은 컨테이너 박스가 두 그림에 다른 뜻으로 나온다(정적 1개 vs 인스턴스 n개) |
| 시스템 개요 × 의존 도달 범위 | 모양이 같다(둘 다 박스-화살표). 질문이 다르다 — 개요는 "무엇이 있나", 도달은 "어디까지 닿나" | 도달 범위는 **새 그림을 그리지 않고** 개요 그림 위에 색을 덮는다(PRD 규칙과 같음) |
| 시스템 개요 × API 동작 | 아니다. 구조 vs 시간축. C4도 정적 그림과 dynamic diagram을 따로 둔다 [C4-DIA §Supporting diagrams] | 한 요청의 호출 순서면 API 동작 행 |
| 배치도 × 저장소 토폴로지 | 절반 겹친다. 상태 저장 서비스가 양쪽에 나온다 | 노드 위 **배치**는 배치도, 저장소 **안**의 데이터 배치와 읽기 경로는 저장소 토폴로지 |
| 배치도 × 장애 대응 흐름 | 아니다(작업 지시의 고정 경계) | "장애 나면 뭘 하나"는 대응 흐름 행 |
| 배치도 × (배포 파이프라인) | **21행에 해당 행이 없다.** archify는 `delivery-workflow`(커밋→프로덕션)를 별도 레시피로 둔다 | 이번 조사의 범위 밖. 빠진 행인지 의도적 제외인지 §4-8에 적는다 |
| 저장소 토폴로지 × CQRS | 작업 지시의 고정 경계 그대로 | 명령 쪽 분리가 없으면 저장소 토폴로지 행 |
| 저장소 토폴로지 × 데이터 흐름·파생 데이터 | 절반 겹친다. PostgreSQL 논리 복제는 "a stream of data modifications to another server"라 이동으로도 읽힌다 [PG-REPL §Logical Replication] | 같은 저장소 엔진 안의 복제·샤딩 = 저장소 토폴로지, 다른 종류 저장소로 옮겨가면 데이터 흐름 행 |
| 데이터 모델 × 저장소 토폴로지 | 아니다. 기본키와 샤드 키는 다른 값이다. 단 MongoDB는 샤드 키가 인덱스여야 한다 [MONGO-KEY] | 키가 "어떻게 나뉘나"를 묻는 값이면 저장소 토폴로지 |
| 데이터 모델 × 마이그레이션 | 아니다. 지금 모양 vs 바꾸는 절차 | 스키마를 바꾸는 계획이면 마이그레이션 행 |
| 데이터 모델 × 이벤트 소싱 | 아니다. 이벤트 소싱 행이 스트림 경계를 맡는다(saga 조사 §2.3 ①) | 원본이 이벤트면 이벤트 소싱 행 |
| 의존 도달 범위 × 이벤트 토폴로지 | **중요.** 정적 의존 그래프는 이벤트 구독을 못 잡는다. jdeps는 클래스 참조, Bazel은 BUILD 선언, dependency-cruiser는 import, Nx는 소스 분석이다 | "이 이벤트 누가 받나"는 이벤트 토폴로지 행. 도달 범위 그림의 "안 그림" 줄에 적을 후보 |
| 의존 도달 범위 × 시스템 개요(L3 모듈) | 겹친다. 둘 다 모듈 의존 화살표를 그린다 | 색이 없으면 개요, 기준 노드가 있으면 도달 범위 |

## 4. 출처 간 충돌·불확실한 점·못 찾은 것

1. **Chen 1976 원문을 다 못 봤다.** `csc.lsu.edu/~chen/pdf/erd.pdf`, `bit.csc.lsu.edu`(http·https), MIT DSpace, UBC·Waterloo 강의 사본, ACM DL, Wayback 모두 404 또는 403이었다. 구한 것은 `bit.csc.lsu.edu/~chen/pdf/erd-5-pages.pdf`(pp.9–13)뿐이다. 따라서 **ER 다이어그램 표기 절(§3.2)과 1:n·m:n 표기, 관계를 마름모로 그리는 관행을 원문으로 확인하지 못했다.** 카디널리티 근거는 FIPS 184와 UML로 대체했다.
2. **카디널리티 표기가 표준마다 다르다.**
   - IDEF1X: 선 끝의 점 + `P`(1 이상) / `Z`(0 또는 1) / 숫자 / 범위 [FIPS184 §3.5.2].
   - UML: 하한·상한 문자열, 무한은 `*` [UML251 §7.5.3.2].
   - crow's foot: **원 출처를 못 찾았다.** 작업 지시의 출발점 예시에 있었지만 1차 출처(Everest 1976 또는 Barker 원문)를 열지 못했다. 캔버스 근사를 텍스트 라벨로 제안한 이유이기도 하다.
3. **"도달 = 영향"인지 출처가 갈린다.**
   - 영향이라 부름: "If you want to e.g. analyze what modules will directly or indirectly be affected by a change you make in one or modules you can use this option." [DEPCRUISE-CLI §--reaches] / "This can be useful when you want to see the modules that are impacted by a change you made." [DEPCRUISE-CLI §--affected]
   - 그래프가 놓칠 수 있다고 인정: Nx는 락 파일이 바뀌면 기본값으로 **모든** 프로젝트를 affected로 표시한다 — "This behavior is a failsafe in case Nx misses a project that should be affected by a dependency update." [NX-AFF §Marking projects affected by dependency updates]
   - 범위에 따라 달라짐: `allrdeps(//bar)`의 결과는 `--universe_scope`가 무엇이냐에 달려 있고, 범위 밖이면 "none of the reverse dependencies … are in the universe" [BAZEL-Q].
   → 우리 결정("영향 판단 안 함")을 바꿀 근거는 아니다. 다만 필수요소 ⑤ 그래프 범위를 넣은 이유다(추론).
4. **UML 배포 표기를 그대로 못 쓴다.** UML 원문은 큐브다: "DeployedTargets are shown as a perspective view of cube labeled with the name of the DeployedTarget shown prepended by a colon." [UML251 §19.2.4]. 캔버스 근사로 중첩 사각형을 제안한 것은 **우리 판단이고 출처가 없다**(추론). C4도 같은 문제를 겪었는지 자기 예시는 사각형처럼 보이지만, 이미지를 직접 못 봐서 단정하지 않는다.
5. **"주 경로 하나"와 "8–12개"는 archify 밖의 1차 출처를 못 찾았다.** C4·arc42·Backstage 어디에도 대응 문장이 없다. archify 자체도 인용 없는 한 프로젝트의 목록이다.
6. **MySQL 문서는 403이라 WebFetch 요약만 있다.** `dev.mysql.com`이 curl을 막았다. semisynchronous 인용은 요약 모델을 거친 것이라 **(요약)** 표시다. 다른 DB 인용은 전부 원문 대조다.
7. **C4는 컴포넌트 그림을 권하지 않는다.** "Recommended? No, only create component diagrams if you feel they add value, and consider automating their creation for long-lived documentation." [C4-COMP]. arc42도 같은 취지다: "Tip 5-27: Refine only a few building blocks!" [ARC42-5]. **우리 줌 체계는 L3·L4·L5를 기본 제공한다.** 줌 레벨 재검토(R06)는 다른 작업이 맡으므로 사실만 적는다.
8. **C4 추상화에는 "모듈" 칸이 없다.** "A software system is made up of one or more containers …, each of which contains one or more components, which in turn are implemented by one or more code elements" [C4-ABS] — system/container/component/code 4단이다. Backstage는 다른 축을 쓴다: Component / API / Resource를 System으로, System을 Domain으로 [BACKSTAGE §Ecosystem Modeling]. arc42는 층 수를 고정하지 않는다 — "When you need more detailed levels of your architecture please copy this part of arc42 for additional levels." [ARC42-5 §5.3]. **세 출처 중 5레벨 고정을 지지하는 것은 없고, arc42만 레벨 수를 열어 둔다.** R06 재료로 남긴다.
9. **이미지를 직접 본 것이 0건이다.** 이번 조사는 curl로 받은 HTML/PDF 텍스트만 대조했다. 그림 관찰은 alt 텍스트와 본문 설명에 기댄다. saga 조사 문서 대비 이 점이 약하다 — 특히 C4 예시 그림 3장(배포), Cassandra 링 그림, MongoDB read preference 그림은 alt 한 줄만 봤다.
10. **OMG UML PDF는 pdftotext가 경고를 냈다.** `Syntax Warning: May not be a PDF file (continuing anyway)` + xref 오류. 그래도 2.2MB 텍스트가 나왔고 §19 Deployments·§7.5.3.2 Multiplicities의 절 번호·본문이 서로 맞아떨어졌다. 인용은 그 텍스트 기준이다.
11. **회사 기술 블로그 사례를 이 5행에서는 못 찾았다.** 구조·배치·저장소 토폴로지는 벤더 공식 문서가 1차 출처라 우선했다. 국내 사례(배민·카카오·토스 등)를 이 다섯 행에 대응시켜 찾지는 않았다 — 시간 배분상 공식 문서를 우선했다(추론).

## 5. 출처 목록

확인일은 모두 **2026-09-12**다. 2차 출처(검색 요약, 해설 블로그)는 인용하지 않았다. "확인"은 원문 텍스트를 직접 대조했는지를 뜻한다.

| ID | 출처 (URL) | 소유자 | 구분 | 확인 |
|---|---|---|---|---|
| C4-HOME | https://c4model.com/ | Simon Brown | 1차 | 원문 대조 |
| C4-DIA | https://c4model.com/diagrams | Simon Brown | 1차 | 원문 대조 |
| C4-ABS | https://c4model.com/abstractions | Simon Brown | 1차 | 원문 대조, 그림 [alt] |
| C4-CTX | https://c4model.com/diagrams/system-context | Simon Brown | 1차 | 원문 대조, 그림 [alt] |
| C4-CONT | https://c4model.com/diagrams/container | Simon Brown | 1차 | 원문 대조, 그림 [alt] |
| C4-COMP | https://c4model.com/diagrams/component | Simon Brown | 1차 | 원문 대조, 그림 [alt] |
| C4-DEP | https://c4model.com/diagrams/deployment | Simon Brown | 1차 | 원문 대조, 그림 3장 [alt] |
| C4-LAND | https://c4model.com/diagrams/system-landscape | Simon Brown | 1차 | 원문 대조, 그림 [alt] |
| C4-CHK | https://c4model.com/diagrams/checklist (Software architecture diagram review checklist) | Simon Brown | 1차 | 원문 대조(체크리스트 전문) |
| ARC42-3 | https://docs.arc42.org/section-3/ (Context and Scope) | arc42 (Starke·Hruschka) | 1차 | 원문 대조, Tip 3-1~3-19 전문 |
| ARC42-5 | https://docs.arc42.org/section-5/ (Building Block View) | arc42 | 1차 | 원문 대조, Tip 5-1~5-28 전문 |
| ARC42-7 | https://docs.arc42.org/section-7/ (Deployment View) | arc42 | 1차 | 원문 대조, Tip 7-1~7-10 전문 |
| STRUCTURIZR | https://docs.structurizr.com/dsl/language | Structurizr (Simon Brown) | 1차 | 원문 대조(deploymentEnvironment·deploymentNode·infrastructureNode·softwareSystemInstance·containerInstance·instances·healthCheck) |
| BACKSTAGE | https://backstage.io/docs/features/software-catalog/system-model | Backstage (Spotify·CNCF) | 1차 | 원문 대조, 그림 2장 [alt] |
| UML251 | OMG Unified Modeling Language 2.5.1 (formal-17-12-05) — https://www.omg.org/spec/UML/2.5.1/PDF | OMG | 1차(표준) | PDF 텍스트 추출, §19 Deployments·§7.5.3.2 Multiplicities·Annex A 대조. 그림 못 봄(§4-10) |
| FIPS184 | FIPS PUB 184 — Integration Definition for Information Modeling (IDEF1X) — https://nvlpubs.nist.gov/nistpubs/Legacy/FIPS/fipspub184.pdf | NIST | 1차(표준) | PDF 텍스트 추출, §3.5 Connection Relationships 대조. Figure 4·5 이미지 못 봄 |
| CHEN76 | "The Entity-Relationship Model—Toward a Unified View of Data", ACM TODS 1(1) pp.9–36 — **5쪽 발췌본** http://bit.csc.lsu.edu/~chen/pdf/erd-5-pages.pdf | Peter Pin-Shan Chen | 1차 | PDF 텍스트 추출, pp.9–13만. §3.2 다이어그램 절 미확인(§4-1) |
| PG-REPL | https://www.postgresql.org/docs/current/different-replication-solutions.html (26.1) | PostgreSQL | 1차 | 원문 대조, 표 26.1 포함 |
| PG-SYNC | https://www.postgresql.org/docs/current/warm-standby.html (26.2.7 Cascading·26.2.8 Synchronous Replication) | PostgreSQL | 1차 | 원문 대조 |
| PG-HOT | https://www.postgresql.org/docs/current/hot-standby.html (26.4) | PostgreSQL | 1차 | 원문 대조 |
| PG-IDX | https://www.postgresql.org/docs/current/indexes-intro.html (11.1) | PostgreSQL | 1차 | 원문 대조 |
| MYSQL-REPL | https://dev.mysql.com/doc/refman/8.4/en/replication.html | Oracle MySQL | 1차 | **(요약)** — curl 403, WebFetch 요약만 |
| CASS-DYN | https://cassandra.apache.org/doc/latest/cassandra/architecture/dynamo.html | Apache Cassandra | 1차 | 원문 대조, `ring.svg`·`vnodes.svg` [alt] |
| DDB-PART | https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.Partitions.html | AWS | 1차 | 원문 대조, 그림 [alt] |
| DDB-READ | https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadConsistency.html | AWS | 1차 | 원문 대조 |
| VITESS | https://vitess.io/docs/reference/features/sharding/ | Vitess (CNCF) | 1차 | 원문 대조 |
| MONGO-KEY | https://www.mongodb.com/docs/manual/core/sharding-shard-key/ | MongoDB | 1차 | 원문 대조, 그림 [alt] |
| MONGO-RP | https://www.mongodb.com/docs/manual/core/read-preference/ | MongoDB | 1차 | 원문 대조, 그림 [alt] |
| MSIO-DBPS | https://microservices.io/patterns/data/database-per-service.html | Chris Richardson | 1차 | 원문 대조, 그림 [alt] |
| FOWLER-AGG | https://martinfowler.com/bliki/DDD_Aggregate.html | Martin Fowler | 1차 | 원문 대조 |
| K8S-PROBE | https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/ | Kubernetes | 1차 | 원문 대조 |
| AZ-FMA | https://learn.microsoft.com/en-us/azure/well-architected/reliability/failure-mode-analysis | Microsoft | 1차 | 원문 대조, 그림 [alt] |
| AZ-RED | https://learn.microsoft.com/en-us/azure/well-architected/reliability/redundancy | Microsoft | 1차 | 원문 대조 |
| AWS-REL-IDX | https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html | AWS | 1차 | 원문 대조 |
| AWS-REL10-1 | https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_fault_isolation_multiaz_region_system.html (REL10-BP01) | AWS | 1차 | 원문 대조 |
| AWS-REL10-3 | https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_fault_isolation_use_bulkhead.html (REL10-BP03) | AWS | 1차 | 원문 대조, 그림 [alt] |
| OWASP-TM | https://owasp.org/www-community/Threat_Modeling_Process | OWASP | 1차 | 원문 대조 |
| MS-TMT | https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-feature-overview | Microsoft | 1차 | 원문 대조 |
| JDEPS | https://docs.oracle.com/en/java/javase/21/docs/specs/man/jdeps.html | Oracle (JDK 21 tool spec) | 1차 | 원문 대조 |
| BAZEL-Q | https://bazel.build/query/language | Google Bazel | 1차 | 원문 대조(rdeps·allrdeps·somepath·allpaths) |
| BAZEL-G | https://bazel.build/query/guide | Google Bazel | 1차 | 원문 대조 |
| DEPCRUISE-CLI | https://github.com/sverweij/dependency-cruiser/blob/main/doc/cli.md (raw) | Sander Verweij | 1차 | 원문 대조 |
| DEPCRUISE-OPT | https://github.com/sverweij/dependency-cruiser/blob/main/doc/options-reference.md (raw) | Sander Verweij | 1차 | 원문 대조(focus·focusDepth·reaches·highlight·maxDepth 절 확인) |
| NX-GRAPH | https://nx.dev/docs/features/explore-graph | Nx (Nrwl) | 1차 | 원문 대조 |
| NX-AFF | https://nx.dev/docs/features/ci-features/affected | Nx (Nrwl) | 1차 | 원문 대조 |
| ARCHIFY | `references/archify/archify/recipes/scenarios.mjs` (로컬, 읽기 전용) | archify (MIT) | 1차 | 전문 읽음 |

다음 출처는 열었지만 이 문서에서 인용하지 않았다: Azure Health modeling(`design-guides/health-modeling`) — 배치도 ⑥과 겹치지만 Structurizr·Kubernetes가 더 직접적이었다. ArchUnit 사용자 가이드(`archunit.org/userguide`) — 레이어 규칙 강제용이고 도달 범위 그림의 값을 주지 않는다.

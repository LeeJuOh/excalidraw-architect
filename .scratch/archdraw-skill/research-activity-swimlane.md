# 액티비티 다이어그램과 스윔레인 — 두 상황의 그림으로 맞나

> 조사일 2026-10-03 · 제안 문서이며 결정 문서가 아니다.
> **대상.** 행 X "코드 안의 업무 규칙 갈래"(주문 취소 3갈래)와 행 Y "배포 절차"(커밋 → 운영). 둘 다 액티비티 다이어그램으로 그리는 안이다.
> **확인 방법.** OMG 명세 3개(UML 2.5.1, BPMN 2.0.2, DMN 1.5)는 PDF를 내려받아 `pypdf`로 글자를 뽑고 절 번호로 읽었다. 쪽 번호는 인쇄 쪽 번호다. PDF 안의 그림은 보지 못했다(글자만 뽑았다). 추출에서 단어 중간에 끼인 공백은 붙여 적었다.
> 웹 문서는 원본 HTML 또는 원본 마크다운을 내려받아 `grep`으로 문장을 대조했다. 대조하지 못한 것은 `(unverified: …)`로 표시했다.
> **표기.** "출처가 말한다"와 "추론"을 나눠 적었다. 추론은 **(추론)**으로 표시했다.

## 1. 결론 표

| # | 질문 | 판정 | 이유 한 줄 |
|---|---|---|---|
| 1-a | 액티비티 다이어그램은 조건에 따른 업무 갈래를 그리는 그림인가 | **지지됨** (단순한 갈래까지) | UML이 "business process engineering and workflow"를 용도로 적는다. 갈래 기호(DecisionNode + guard)가 있다. [UML251 §15.1, §15.3.3.6] |
| 1-b | 액티비티 다이어그램은 배포·CI/CD 절차를 그리는 그림인가 | **일부 지지** | UML은 "workflow"와 "system level processes"까지만 말한다. 배포 파이프라인을 이름으로 말하지 않는다. 배포 파이프라인의 원전은 시퀀스와 단계 상자로 그렸다. [UML251 §15.1, CD-CH5] |
| 2 | 판단 로직에는 다른 표기를 쓰라는 반대 근거가 있는가 | **지지됨** (반대 근거가 있다) | Fowler: 조건이 복잡하면 결정표가 "more compact and more clear". Camunda: 게이트웨이로 판단 로직을 그리는 것은 "anti-pattern". [FOWLER3 p.15, CAMUNDA-PAT] |
| 3 | 스윔레인은 선택 사항이고, 기준·방향·중첩이 자유로운가 | **지지됨** | 레인은 토큰 흐름에 영향이 없다. 가로·세로 둘 다 된다. 하위 레인과 격자가 된다. 레인 없이 이름만 붙이는 표기도 있다. [UML251 §15.6.3.1, §15.6.4.1] |
| 3-b | 레인의 기준으로 "레이어"를 쓴 출처가 있는가 | **못 찾음** | 출처의 예시는 부서, 역할, 시스템, 위치, 클래스다. 레이어 예시는 없다. UML은 금지하지 않는다. |
| 4-a | 스윔레인은 UML 구조 그림에도 쓰는가 | **지지 안 됨** | UML에서 "swimlane"은 15장(Activities)과 Annex C 주석에만 나온다. 구조 그림의 묶음은 Package, Node 중첩, subject 사각형이다. |
| 4-b | 다른 표준에 스윔레인이 있는가 | BPMN **지지됨** / C4 **지지 안 됨** / ArchiMate **못 찾음** | BPMN은 Pool과 Lane을 "Swimlanes"라고 부른다. C4 공식 페이지 6개에 단어가 0번 나온다. ArchiMate 명세는 로그인이 필요해 읽지 못했다. |
| 5 | 스윔레인의 기원은 Rummler-Brache인가 | **일부 지지** | 저자들의 글은 "Process Map"과 "horizontal band"라고 쓴다. "swim"이라는 단어는 그 글에 없다. 1940년대 기원설은 죽은 링크만 근거다. [RB-PROC] |

**가장 강한 반대 근거 한 줄.** "Decision tables are a good way to show complicated logical conditions. You can do this with an activity diagram, but once you get beyond simple cases, the table is both more compact and more clear." [FOWLER3 1장 "UML Is Not Enough", p.15]

## 2. 질문별 조사 결과

### 2.1 질문 1 — 액티비티 다이어그램은 무엇을 위한 그림인가

**출처가 말한다.**

- 정의: "An Activity is a kind of Behavior (see sub clause 13.2) that is specified as a graph of nodes interconnected by edges." · "Activities are essentially what are commonly called “control and data flow” models." [UML251 §15.1 Summary, p.373]
- 용도 세 가지: "Activities may describe procedural computation, forming hierarchies of Activities invoking other Activities, or, in an object-oriented model, they may be invoked indirectly as methods bound to Operations that are directly invoked. Activities may be applied to organizational modeling for business process engineering and workflow. … Activities can also be used for information system modeling to specify system level processes." [UML251 §15.1, p.373]
- 갈래 기호: "A DecisionNode is a ControlNode that chooses between outgoing flows." · "In order to avoid non-deterministic behavior, the modeler should arrange that at most one guard evaluate to true for each incoming token." · "a predefined guard “else” … may be used for at most one outgoing edge." [UML251 §15.3.3.6 Decision Nodes, p.390]
- 갈래 기호의 모양: "The notation for both MergeNodes and DecisionNodes is a diamond-shaped symbol" [UML251 §15.3.4.3, p.392]
- 명세의 예시는 업무 갈래다: "The branching is based on whether order was rejected or accepted." [UML251 §15.3.5.3, Figure 15.40, p.393] (그림은 못 봄)
- Ambler: "UML activity diagrams are typically used for business process modeling, for modeling the logic captured by a single use case or usage scenario, or for modeling the detailed logic of a business rule." [AMBLER-ACT 본문 첫 문단]
- Fowler 2판(2차 사본): "I like to use activity diagrams in the following situations: Analyzing a use case. … Understanding workflow. … Describing a complicated sequential algorithm. … Dealing with multithreaded applications." [FOWLER2-COPY "When to Use Activity Diagrams"] 항목은 4개다.

**(a) 조건에 따른 업무 갈래 — 지지됨.** 명세가 용도로 적고, 기호가 있고, 예시가 같은 종류다. 한계는 2.2에 있다.

**(b) 배포·CI/CD 절차 — 일부 지지.**

- UML 2.5.1 본문에서 `pipeline`, `continuous integration`, `CI/CD`, `release process`, `runbook`을 찾았다. 0건이다. UML은 배포 절차를 이름으로 말하지 않는다.
- UML의 Deployment 그림은 절차가 아니고 구조다: "The Deployments package specifies constructs that can be used to define the execution architecture of systems and the assignment of software artifacts to system elements." [UML251 §19.1, p.653]
- "배포 파이프라인"의 원전(Humble·Farley)은 세 가지로 그렸다. 액티비티 다이어그램은 없다.
  - "The entire process—from concept to cash—can be modeled as a value stream map." [CD-CH5, Figure 5.1 앞 문단]
  - "one way to understand the deployment pipeline and how changes move through it is to visualize it as a sequence diagram, as shown in Figure 5.2." [CD-CH5] Figure 5.2를 직접 봤다: 생명선 6개(Delivery team / Version control / Build & unit tests / Automated acceptance tests / User acceptance tests / Release), 메시지 Check in·Trigger·Feedback·Approval, 실행 막대에 F(fail)·P(pass).
  - Figure 5.4 "Basic deployment pipeline"을 직접 봤다: 단계 상자 5개(Commit stage / Acceptance stage / UAT / Capacity stage / Production)와 굵은 화살표, 위아래에 Version control과 Artifact repository 띠. 마름모와 레인은 없다.
- 도구의 1차 문서는 "graph"라고 부른다. "activity diagram"이라는 말은 없다.
  - GitLab: "By default, jobs run in stages." · "This creates a pipeline with a kind of directed acyclic graph (DAG) structure." · "You can view the dependencies between jobs on the pipeline graph." · "The pipeline view shows the jobs grouped in stages:" [GITLAB-NEEDS]
  - GitHub Actions: "Every workflow run generates a real-time graph that illustrates the run progress." · "The graph displays each job in the workflow. … Lines between jobs indicate dependencies." [GHA-GRAPH]
- archify는 CI/CD를 레인이 있는 흐름으로 그린다: Type router의 `workflow` 줄 "Processes, approval gates, tool calls, runbooks, CI/CD". `delivery-workflow` 프롬프트 "Separate developer, CI, approval, environment, and exception lanes; mark blocking checks, smoke tests, ownership, and the rollback path." [ARCHIFY]
- Visual Paradigm 글의 문장 "Activity diagrams model complex deployment pipelines and automated processes."는 출처 인용이 없다. **(unverified: WebFetch 요약으로만 봤다. 벤더 글이다.)**

**(추론)** 배포 절차는 "단계 + 승인 관문 + 실패 시 되돌림"이다. 이것은 UML이 말하는 workflow의 범위에 든다. 그러나 "배포 절차는 액티비티 다이어그램으로 그린다"고 말한 1차 출처는 찾지 못했다. 실물은 단계 그래프(자동 부분)와 시퀀스(누가 누구에게 알리나)다. 마름모와 레인은 사람 승인과 롤백 갈래를 보일 때만 값이 있다.

### 2.2 질문 2 — 반대 근거: 판단 로직에는 다른 표기를 쓰라고 하는가

**출처가 말한다.**

| 출처 | 문장 | 대신 쓰라는 것 |
|---|---|---|
| FOWLER3 1장 "UML Is Not Enough", p.15 (출판사 견본 PDF, 직접 읽음) | "Decision tables are a good way to show complicated logical conditions. You can do this with an activity diagram, but once you get beyond simple cases, the table is both more compact and more clear." | 결정표 |
| FOWLER2-COPY "When to Use Activity Diagrams" (2판, 2차 사본) | "Don't use activity diagrams in the following situations: … Representing complex conditional logic. Use a truth table." | 진리표 |
| FOWLER2-COPY 같은 절 | "Trying to see how an object behaves over its lifetime. Use a state diagram (see Chapter 8) for that." | 상태도 |
| FOWLER2-COPY 같은 절 | "Trying to see how objects collaborate. An interaction diagram is simpler and gives you a clearer picture of collaborations." | 시퀀스 |
| CAMUNDA-PAT "Showing decision logic in the diagram?" | "When modeling business processes, we focus on the flow of work and just use gateways to show that following tasks or results fundamentally differ from each other. However, in the example above, the business analyst used gateways to model the logic underlying a decision, which clearly is considered to be an anti-pattern!" | 판단 태스크 하나 + DMN 결정표 |
| CAMUNDA-PAT 같은 절 | "It does not make sense to model the rules determining a decision inside the BPMN model. The rules decision tree will grow exponentially for every additional criteria. Furthermore, we typically will want to change such rules much more often than the process" | 같음 |
| AMBLER-ACT 본문 첫 문단 | "Although UML activity diagrams could potentially model the internal logic of a complex operation it would be far better to simply rewrite the operation so that it is simple enough that you don’t require an activity diagram." | 그리지 말고 코드를 고친다 |
| BPMN202 §7.2 BPMN Scope, p.20 | "the following are aspects that are out of the scope of this International Standard: • Definition of organizational models and resources, • Modeling of functional breakdowns, • Data and information models, • Modeling of strategy, • Business rules models." | (규칙 모델은 BPMN 범위 밖) |
| DMN15 §5.1 Context, p.7 | "Business process models (e.g., BPMN) can describe the coordination of decision-making within business processes by defining specific tasks or activities within which the decision-making takes place." · "Decision logic (e.g., PRR, PMML) can define the specific logic used to make individual decisions, for example as business rules, decision tables, or executable analytic models." | 판단 로직은 결정 모델로 |
| DMN15 Annex A.2 (informative), p.227 | "As such, DMN complements BPMN as decision modeling complements process modeling" | 흐름과 판단을 나눈다 |
| DMN15 Annex A.4 (informative), p.229 | "Process gateways can be considered of 2 types: 1. A gateway that determines a process route or routes based on existing data 2. A gateway that determines a process route or routes based on the outcome of one or more decisions that are determined by some previous task within the process." | 게이트웨이는 판단의 **결과**로 길을 고른다 |

Fowler 2판의 "쓰지 말라" 항목은 3개다. BPMN의 범위 밖 항목은 5개다.

**정확히 구분할 것.**

- DMN 명세는 "게이트웨이를 쓰지 말라"고 말하지 않는다. 판단 로직과 흐름을 나눈다고만 말한다. "anti-pattern"이라는 말은 벤더(Camunda)의 권고다.
- UML 2.5.1 명세에는 "액티비티 다이어그램을 쓰지 말아야 할 때"가 없다. 못 찾았다.
- "단순한 경우"의 기준 숫자를 준 출처는 없다. Fowler는 "once you get beyond simple cases"라고만 쓴다.
- 플로우차트와의 관계: "In this case, an activity diagram is really nothing more than a UML-compliant flowchart. The usual pros and cons of flowcharts apply." [FOWLER2-COPY "When to Use Activity Diagrams"] · "This is the key difference between an activity diagram and a flowchart: flowcharts are normally limited to sequential processes, whereas activity diagrams can handle parallel processes." [FOWLER2-COPY "Chapter 9. Activity Diagrams"] · "In many ways UML activity diagrams are the object-oriented equivalent of flow charts and data flow diagrams (DFDs) from structured development." [AMBLER-ACT]

**(추론) 행 X에 주는 뜻.**

1. 행 X의 예시(배송 상태 하나로 3갈래)는 "simple case"다. 조건 변수가 1개이고 갈래마다 뒤따르는 단계가 다르다(회수 요청 → 환불). 액티비티 다이어그램이 맞다.
2. 조건이 여러 개 조합되면 표가 낫다(Fowler의 Table 1.2는 조건 3개 × 열 6개다). 행 X에 "조건이 조합되면 결정표로 간다"는 경계가 필요하다.
3. 예시의 갈래 조건은 엔티티의 **상태**다(배송 전 / 배송 중 / 배송 완료). 질문이 "취소가 어느 상태에서 되나"이면 이미 있는 행 Entity lifecycle(상태도)이 답한다. 질문이 "취소하면 어떤 단계들이 이어지나"이면 액티비티 다이어그램이 답한다. 두 행의 경계 문장이 필요하다.
4. Ambler의 문장과 우리 `spec.md`의 경계("메서드 본문·쿼리는 그림 대상이 아니다")가 같은 방향이다. 행 X의 이름에 "코드 안의"가 들어가면 메서드 본문 순서도로 읽힐 수 있다.

### 2.3 질문 3 — 스윔레인(ActivityPartition)

**출처가 말한다.**

- 이름: "This notation for an ActivityPartition is colloquially known as a swimlane" [UML251 §15.6.4.1, p.408]. 즉 정식 이름은 ActivityPartition이고 "swimlane"은 그 표기의 통칭이다.
- 목적: "An ActivityPartition is a kind of ActivityGroup for identifying ActivityNodes that have some characteristics in common. ActivityPartitions can share contents. They often correspond to organizational units in a business model. They may be used to allocate characteristics or resources among the nodes of an Activity." [UML251 §15.6.3.1, p.406]
- 선택 사항인가 — 그렇다.
  - 흐름에 영향이 없다: "ActivityPartitions do not affect the token flow of the model. They constrain and provide a view on the Behaviors invoked" [UML251 §15.6.3.1, p.406]
  - 개수 하한이 0이다: `partition : ActivityPartition [0..*]` [UML251 §15.7.1.5 Activity Association Ends, p.412], `inPartition : ActivityPartition [0..*]` [UML251 §15.7.5.6 ActivityNode, p.416]
  - 선 없이 그리는 표기가 있다: "In some diagramming situations, using parallel lines to delineate ActivityPartitions is not practical. An alternative is to place the partition name in parenthesis above the ActivityNode name" [UML251 §15.6.4.1, p.408]
- 레인이 무엇을 나타낼 수 있나.
  - 규범으로 정한 것은 3종이다: Classifier, InstanceSpecification, Property. 예: "Classifier. Behaviors invoked within the partition are the responsibility of instances of the Classifier that the partition represents." [UML251 §15.6.3.1, p.406–407]
  - 그 밖도 된다: "An ActivityPartition may represent other kinds of Elements than the above, but the semantics for these are not defined in this specification." [같은 절, p.407]
  - 명세의 예: 부서("the Order Department … the Accounting Department"), 바깥 주체("Customer, on the other hand, is external to the domain."), 위치("situated in Seattle"), 수행 클래스("an instance of the Order Processor class") [UML251 §15.6.5.1, p.409–410]
  - 바깥 주체 표기: "In business modeling, external partitions can be used to model entities outside a business." [§15.6.3.1, p.407] 표기는 `«external»` [§15.6.4.1, p.408]
  - BPMN: "The meaning of the Lanes is up to the modeler. BPMN does not specify the usage of Lanes." [BPMN202 §10.8, p.305] · "Lanes are often used for such things as internal roles (e.g., Manager, Associate), systems (e.g., an enterprise application), or an internal department (e.g., shipping, finance)." [BPMN202 Annex C Glossary "Lane", p.501]
  - Fowler 2판: "Each zone represents the responsibilities of a particular class or, in the case of Figure 9-5, a particular department." [FOWLER2-COPY "Swimlanes"]
  - Ambler: "A swimlane is a way to group activities performed by the same actor on an activity diagram or to group activities in a single thread." [AMBLER-STYLE "Swimlane Guidelines"] Ambler는 레인을 "courses of action within a use case"로도 나눴다 [AMBLER-ACT, Figure 3 설명].
  - **레이어를 레인으로 쓴 예시는 어느 출처에도 없다(못 찾음).** UML은 금지하지 않는다(위 "other kinds of Elements").
- 방향: "An ActivityPartition is notated with two, usually parallel lines, either horizontal or vertical, and a name labeling the partition in a box at one end." [UML251 §15.6.4.1, p.408] · BPMN: "will extend the entire length of the Process level, either vertically … or horizontally" [BPMN202 §10.8, p.304]
- 중첩: "Swimlanes can express hierarchical partitioning by representing the subpartitions as further partitioning of the superpartition" [UML251 §15.6.4.1, p.408]. 이름 표기는 `::`다: "A double colon within a partition name indicates that the partition is nested" [같은 절].
- 다차원(격자): "Diagrams can also be partitioned multidimensionally, … where each “swim cell” is an intersection of multiple partitions." [같은 절] 제약: "Dimension partitions shall not be contained in any other ActivityPartitions." [§15.6.3.1, p.407]
- 한 노드가 여러 레인에 든다: "A comma-separated list of partition names means that the node is contained in more than one partition." [§15.6.4.1, p.408]
- 레인을 넘는 선: "NOTE. ActivityEdges that cross between partitions are not contained in any of the subpartitions." [§15.6.5.1, p.409]
- 중첩의 규칙(규범): 하위 레인이 Classifier이면 상위 레인도 Classifier이고, 하위는 상위의 중첩 분류자이거나 합성 관계의 부분이어야 한다. "the Classifier of the subpartition must be a nestedClassifier or ownedBehavior of the Classifier represented by the superPartition or be at the contained end of a composition Association" [§15.6.3.1, p.407]

**언제 쓰고 언제 빼나 — 출처가 말한다.**

| 출처 | 문장 | 뜻 |
|---|---|---|
| FOWLER2-COPY "Swimlanes" | "Activity diagrams tell you what happens, but they do not tell you who does what." · "Swimlanes are a way around this." | "누가"가 질문이면 쓴다 |
| FOWLER2-COPY 같은 절 | "However, they can be difficult to draw on a complex diagram. … (Sometimes you have to stop trying to say too much in one diagram.)" | 복잡하면 뺀다 |
| FOWLER2-COPY 같은 절 | "I confess that I often draw an activity diagram without assigning behavior to objects until later. I find it useful to figure out one thing at a time." | 처음에는 빼도 된다 |
| AMBLER-ACT Figure 2 설명 | "Partitions are useful because they provide more information, but they also elongate the diagram" | 값과 비용 |
| AMBLER-STYLE "Swimlane Guidelines" | "Apply Swim Lanes To Linear Processes. A good rule of thumb is that swimlanes are best applied to linear processes" · "Have Less Than Five Swimlanes." · "Consider Horizontal Swimlanes for Business Processes. … going against common convention of drawing them vertically." | 직선형 흐름, 5개 미만 |
| CAMUNDA-READ "Avoiding lanes" | "Consider avoiding lanes for most of your models all together. They tend to conflict with several of the best practices presented here … lanes make it more difficult to change the resulting process models and therefore cause considerably more effort in maintenance." | 기본은 뺀다 |
| CAMUNDA-READ 같은 절 | "However, the usage of lanes might be meaningful for: Strategic level models … especially when they have a focus on responsibilities and their borders." | 책임의 경계가 초점일 때만 |
| UML251 §15.2.5, p.383 | "NOTE. The swimlanes are an important feature for indicating senders and responders." | 보내는 쪽과 받는 쪽을 보일 때 |

Ambler의 스윔레인 지침은 6개다(Order logically / Linear processes / Less than five / Swimareas for complex / Swimareas suggest reorganize / Horizontal for business processes).

**(추론) 우리 결정에 주는 뜻.**

- 핸드오프의 결정 7-②(레인의 기준과 방향은 에이전트가 고른다, 컨텍스트 테두리가 레인을 묶는다)는 UML과 맞는다. 방향 자유와 하위 레인은 §15.6.4.1에 있다.
- 다만 "배포 단위·모듈·레이어를 레인의 기준으로 쓴다"는 것은 출처의 예시에 없다. UML이 허용하는 범위("Classifier" 또는 "other kinds of Elements")에 드는 우리 쪽 적용이다.
- 행 X의 예시는 갈래가 핵심이고 "누가"는 부차적이다. Fowler와 Camunda의 문장으로 보면 레인은 필수가 아니다. 레인을 필수요소로 넣을지, 선택으로 둘지 정해야 한다.

### 2.4 질문 4 — 스윔레인은 액티비티 다이어그램 밖에서도 쓰는가

**UML 2.5.1 — 구조 그림에는 없다.**

- 전문에서 `swim`을 찾았다. 나온 곳은 그림 목록(Figure 15.70, 15.72), 15장 본문, Annex C뿐이다. Annex C의 주석이 범위를 못 박는다: "“swimlane header” means that the keyword appears as the header of a swimlane in an activity diagram." [UML251 Annex C: Keywords, 표 주석 5]
- ActivityPartition은 ActivityGroup의 한 종류다. ActivityGroup은 Activity 안의 노드와 선을 묶는다: "ActivityGoups are a grouping constructs for ActivityNodes and ActivityEdges." [UML251 §15.6.1, p.405] (원문 철자 그대로다.)
- UML의 그림 종류는 14개다. Activity는 행위 그림이다. [UML251 Annex A, p.685] 목록: Activity, Class, Communication, Component, Composite Structure, Deployment, Interaction Overview, Object, Package, Profile, State Machine, Sequence, Timing, Use Case.
- 다만 종류의 경계는 강제가 아니다: "it does not preclude mixing different kinds of diagram types … Consequently, the boundaries between the various kinds of diagram types are not strictly enforced." [UML251 Annex A, p.685]

**다른 그림의 묶음은 이름이 다르다.**

| 표준 | 그림 | 묶음의 이름 | 문장 |
|---|---|---|---|
| UML | Package / Class | Package(탭 달린 사각형) | "The members of the Package may be shown within the large rectangle." [UML251 §12.2.4] |
| UML | Deployment | Node 중첩 | "Nodes may have complex internal structure defined by nesting … The internal structure of Nodes can only consist of other Nodes." [UML251 §19.4.3, p.658] |
| UML | Use case | subject 사각형 | "A subject for a set of UseCases (sometimes called a system boundary) may be shown as a rectangle with its name in the top-left corner" [UML251 §18.1.4, p.641] |
| UML | State machine(행위 그림) | Region | "tiling the graph Region of the State/StateMachine using dashed lines to divide it into Regions" [UML251 §14.2.4.3] |
| UML | 모든 그림 | frame | "Each diagram has a contents area. As an option, it may have a frame and a heading" [UML251 Annex A, p.683] |
| BPMN | Process / Collaboration | **Swimlanes** = Pool + Lane | "There are two ways of grouping the primary modeling elements through “Swimlanes:” 1. Pools 2. Lanes" [BPMN202 §7.3, p.26] |
| BPMN | Collaboration | Pool | "A Pool is the graphical representation of a Participant in a Collaboration." [BPMN202 §9.3, p.111] |
| BPMN | Process | Lane | "A Lane is a sub-partition within a Process (often within a Pool)" [BPMN202 §10.8, p.304] |
| BPMN | Choreography | (쓰지 않는다) | "Swimlanes, both Pools and Lanes, are not used in Choreographies." [BPMN202 §11.8.2, p.362] |
| C4 | Container | system boundary | "a useful next step is to zoom in to the system boundary with a container diagram." [C4-CONT] |
| C4 | Deployment | deployment node 중첩 | "Deployment nodes can be nested." [C4-DEP] |
| C4 | Dynamic | (레인 없음) | "This dynamic diagram is based upon a UML communication diagram … It is similar to a UML sequence diagram" [C4-DYN] |

- BPMN의 Pool과 Lane은 뜻이 다르다. Pool은 참여자다. 순서 흐름은 Pool을 넘지 못한다: "The Sequence Flows can cross the boundaries between Lanes of a Pool …, but cannot cross the boundaries of a Pool." [BPMN202 §9.3, p.111] UML의 레인에는 이 제약이 없다.
- C4: 공식 페이지 6개(`/diagrams`, `/diagrams/notation`, `/diagrams/container`, `/diagrams/dynamic`, `/diagrams/deployment`, `/faq`)의 원본 HTML에서 `swimlane`, `swim lane`, `activity diagram`을 세었다. 6개 모두 0건이다. C4의 범위는 정적 구조다: "The focus of the C4 model is the static structures that make up a software system, at different levels of abstraction. If you need to describe other aspects, feel free to supplement the C4 diagrams with UML diagrams, BPML diagrams, ArchiMate diagrams, entity relationship diagrams, etc." [C4-FAQ]
- ArchiMate: 읽지 못했다. 4절 참조.

**판정.** 스윔레인은 "흐름 그림의 묶음"이다. UML에서는 Activity에만 있고, BPMN에서는 Process와 Collaboration에 있다. 구조 그림의 묶음은 다른 구성물(Package, Node 중첩, boundary)이다.

**(추론)** 우리 routing-table의 "Concurrency and locks"(레인 타임라인)과 "Authentication and authorization"(신뢰 경계 세로 띠)은 UML의 스윔레인이 아니다. 시퀀스의 생명선과 타이밍 그림에 가깝다. 이름을 "레인"으로 같이 쓰면 뜻이 섞인다.

### 2.5 질문 5 — 스윔레인의 기원

**출처가 말한다.**

- Rummler·Brache 본인의 글은 이 그림을 "Process Map"이라고 부른다. 만드는 법: "The mapping process starts by identifying the entities involved with the process, listing them on the left-hand axis, and drawing a horizontal band for each." [RB-PROC p.5]
- 드러내려는 것: "This mapping format allows the team to see all the critical interfaces, overlay the time to complete various subprocesses on the map, and identify “disconnects” (illogical, missing, or extraneous steps) in the process." [RB-PROC p.5] · "A Process Map (Figure 2) clearly displays the points at which one function (horizontal band on the map) provides a product or service to another function. At each of these points, there is a customer-supplier interface. These interfaces often represent the greatest opportunities for major performance improvement." [RB-PROC p.13]
- "white space"의 뜻: "most processes (such as order fulfillment) are cross-functional, spanning the “white space” between the boxes on the organization chart." [RB-PROC p.2]
- 이 글에서 `swim`을 찾았다. 0건이다. 저자들은 "horizontal band"라고 쓴다.

**확인하지 못한 주장.**

- "Swimlane diagrams first appeared in the 1940s as a variation of the flow process chart called multi-column charts." · "They were called Swim Lane diagrams by Geary Rummler and Alan Brache in their book Improving Performance (1990)." **(unverified: 위키백과 "Swimlane" 문서를 WebFetch 요약으로 봤다. 근거 각주는 죽은 링크 하나다.)**
- 1990년 책 *Improving Performance* 원문은 읽지 못했다. 책이 "swim lane"이라는 말을 쓰는지 모른다.

**판정: 일부 지지.** "부서별 가로 띠 위에 절차를 그려 부서 사이의 넘김(interface)을 드러낸다"는 설계 의도는 저자의 글로 확인했다. "스윔레인이라는 이름을 Rummler-Brache가 붙였다"와 "1940년대에 먼저 있었다"는 확인하지 못했다.

**(추론)** 원래 목적은 "담당이 바뀌는 지점"을 보이는 것이다. 우리 행 Incident response flow의 "담당 없는 단계는 빈 레인으로 드러난다"가 이 목적과 같다. 행 X는 이 목적과 거리가 있다.

## 3. 우리 기록이 이미 말한 것

| 어디 | 무엇 |
|---|---|
| `research-structure.md:309` | "배치도 × (배포 파이프라인) — **21행에 해당 행이 없다.** archify는 `delivery-workflow`(커밋→프로덕션)를 별도 레시피로 둔다". 조사 범위 밖으로 남겼다. |
| `review.md:277` | "빠진 행 후보(§3): 배포 파이프라인(archify delivery-workflow) — 21행에 없음, 의도적 제외인지 미결." |
| `review.md:273`, `research-operations.md:21, 135` | 장애 대응 흐름의 그림을 "스윔레인 플로우"로 정했다. 근거는 archify의 "responder lanes"와 "Separate decision gates from actions and make missing ownership visible"이다. NIST 그림에는 역할 레인이 없다(`research-operations.md:105`). 레인을 고른 이유는 "archify 목적 문장(추론)"이라고 적혀 있다. |
| `research-request.md:213, 315` | 컬리는 재시도 흐름을 **스윔레인 플로우차트**로 그렸다(레인 2개: 메인 토픽 / 재시도 토픽, 마름모, 종료 2개). 여기의 레인은 역할이 아니고 토픽이다. |
| `research-request.md:238` | 재시도·분기 행의 그림은 "상태도 — PRD(9/5 플로우차트 폐기)"다. 플로우차트를 한 번 버린 기록이 있다. 이유는 이 줄에 없다. |
| `research-whiteboard.md:27` | Whiteboard의 규칙: "`flow_diagram` — 분기, 재시도, 상태 전이". 분기와 상태 전이를 한 종류로 묶는다. |
| `routing-table.md` "Incident response flow" | "Swimlane flow — a horizontal lane per role against the progression of steps; actions are rectangles, decisions are diamonds, and a step with no owner shows up as an empty lane." 라우팅 예외: "Code retrying and branching by itself → Retry and branching." |
| `routing-table.md` "Retry and branching" | 그림은 상태도다. 질문은 한 호출의 실패와 재시도다. 업무 규칙의 갈래는 다루지 않는다. |
| `routing-table.md` "Concurrency and locks" | "Lane timeline — a lane per participant". 레인이라는 말을 쓰는 둘째 행이다. |
| `spec.md:92` | "줌 레벨은 L5 경계 타입에서 끝나며 그 아래(메서드 본문·쿼리)는 그림 대상이 아니다." |
| archify `SKILL.md` "Type router" | `workflow` = "Processes, approval gates, tool calls, runbooks, CI/CD". |
| archify `scenarios.mjs` | `workflow` 레시피는 3개다: `agent-tool-call`, `delivery-workflow`, `incident-runbook`. 셋 다 프롬프트에 "lanes"가 있다. `delivery-workflow`의 `avoidWhen`: "The question is where infrastructure runs or what states a deployment object can occupy." `agent-tool-call`의 시작 프롬프트: "Use lanes for distinct owners, keep one unmistakable happy path, and mark missing ownership or unresolved branches instead of inventing them." |
| `handoff/2026-10-03-whiteboard-adoption.md` | 7-①: 22번째 상황(업무 흐름, 스윔레인 플로우)과 23번째 상황(배포 절차)을 추가하기로 했다. 7-②: 레인의 기준과 방향은 에이전트가 고른다. UML §15.6.4.1과 Annex A를 그 세션에서 읽었다고 적혀 있다. |
| `wiki/index.md` | UML이나 다이어그램 표기를 다루는 페이지가 없다. 가까운 것은 `summaries/diagram-design.md`뿐이다. 그 페이지는 Flowchart와 Swimlane을 따로 센다. (제목은 "14 type"이고 나열된 이름을 세면 15개다.) |

**기록과 맞지 않는 점 2개.**

1. 핸드오프는 "C4 공식 문서에는 스윔레인이 없다(`research-structure.md`)"라고 적었다. `research-structure.md`에서 `스윔레인`, `swimlane`, `레인`을 찾았다. C4와 레인을 같이 말한 줄은 없다. 사실 자체는 이번에 직접 확인했다(2.4, 6개 페이지 0건). 출처 표시만 틀렸다.
2. 핸드오프는 Visual Paradigm 글을 "원문 전체를 읽었다"고 적었다. 이번 조사는 그 글을 WebFetch 요약으로만 봤다. 문장은 같았고, 출처 인용이 없다는 점을 더 확인했다.

**기록에 없던 것(이번에 새로 나온 것).**

- 반대 근거 전부(2.2). 우리 기록에는 "액티비티 다이어그램을 쓰지 말아야 할 때"가 없었다.
- 배포 파이프라인의 원전이 시퀀스와 단계 상자로 그렸다는 사실(2.1).
- 레인이 선택 사항이라는 명세 근거와 "빼라"는 권고(2.3).

## 4. 확인하지 못한 것

1. **Fowler *UML Distilled* 3판 11장 본문을 읽지 못했다.** 출판사 견본 PDF에는 1장과 목차, 색인만 있다. 목차로 확인한 것: 11장 "Activity Diagrams" p.117, "Partitions" p.120, "When to Use Activity Diagrams" p.129. 3판의 "쓰지 말라" 목록이 2판과 같은지 모른다.
2. **Fowler 2판 인용은 2차 사본이다.** flylib.com의 사본을 읽었다. 그 사이트는 책 제목을 "The Unified Modeling Language User Guide"로 잘못 달았다. 본문은 *UML Distilled* 2판 9장의 문체와 그림 번호(Figure 9-1, 9-5)다. 인쇄본과 대조하지 못했다. 인증서가 만료된 사이트다.
3. **견본 PDF의 추천사 한 줄.** "‘The swimming metaphor no longer holds water’ indeed!"(Stephen J. Mellor)는 3판 11장에 그 문장이 있다는 간접 증거다. 본문 문장은 보지 못했다.
4. **Rummler·Brache 1990년 책 원문을 읽지 못했다.** 읽은 것은 rummlerbrache.com의 글 "The Process Level of Performance"(15쪽, 날짜 없음)다. 책의 발췌인지 모른다.
5. **1940년대 기원설과 Binner 기원설.** 위키백과 요약만 봤다. 각주가 죽은 링크다.
6. **ArchiMate 명세.** `pubs.opengroup.org`가 로그인 페이지로 돌린다(HTTP 302). 층(Layer)의 정의 문장을 읽지 못했다. 검색 요약으로 본 것: 층 이름이 Business / Application / Technology라는 것뿐이다 **(unverified: 검색 요약)**. ArchiMate의 층이 스윔레인인지 판정하지 않았다.
7. **명세의 그림.** UML Figure 15.40, 15.66–15.72와 BPMN Figure 10.123–10.125는 글자만 뽑혔다. 모양은 보지 못했다.
8. **DMN Table 111**("BPMN tasks relevant to DMN")은 글자가 뽑히지 않았다.
9. **UML Interaction Overview Diagram**(§17.10, "a variant of Activity Diagrams")에서 레인을 쓸 수 있는지 확인하지 않았다.
10. **CI/CD를 액티비티 다이어그램이나 BPMN으로 그린 1차 문서.** 찾지 못했다. 찾은 범위는 Humble·Farley 5장, GitLab `needs` 문서, GitHub Actions 그래프 문서, Fowler bliki "DeploymentPipeline"(그림 없음 — WebFetch 요약)이다. 다른 도구(Jenkins, Argo, Azure Pipelines)는 보지 않았다.
11. **Camunda 원문 대조 방법.** `docs.camunda.io` HTML은 내려받기가 시간 초과로 실패했다. 같은 문서의 원본 마크다운(GitHub `camunda/camunda-docs` main)을 읽었다.
12. **국내 사례.** 업무 규칙 갈래나 배포 절차를 그린 국내 1차 사례는 찾지 않았다. 기록에 있는 것은 컬리 재시도 플로우차트 하나다.

## 5. 출처

| 약칭 | 출처 | 종류 | 확인 수준 |
|---|---|---|---|
| UML251 | OMG Unified Modeling Language 2.5.1 — https://www.omg.org/spec/UML/2.5.1/PDF (796쪽) | 표준 | PDF 내려받아 `pypdf` 추출. §12.2.4, §14.1, §14.2.4.3, §15.1–15.3, §15.6, §15.7.1·15.7.5·15.7.7, §18.1.4, §19.1, §19.4.3, Annex A, Annex C 원문 대조. 그림은 못 봄 |
| BPMN202 | OMG Business Process Model and Notation 2.0.2 — https://www.omg.org/spec/BPMN/2.0.2/PDF (532쪽) | 표준 | 같은 방법. §7.2, §7.3, §9.3, §10.6, §10.8, §11.8.2, 용어집 원문 대조 |
| DMN15 | OMG Decision Model and Notation 1.5 — https://www.omg.org/spec/DMN/1.5/PDF (250쪽) | 표준 | 같은 방법. §5.1, §5.2, §8.1, Annex A(informative) 원문 대조 |
| FOWLER3 | Martin Fowler, *UML Distilled* 3판 견본 — https://ptgmedia.pearsoncmg.com/images/9780321193681/samplepages/9780321193681_Sample.pdf | 1차(저자, 출판사 배포) | 1장과 목차만. PDF 추출로 직접 읽음 |
| FOWLER2-COPY | *UML Distilled* 2판 9장 사본 — https://flylib.com/books/en/2.455.1.71/1/ (본문), `…1.74/1/`(Swimlanes), `…1.75/1/`(When to Use) | 2차 사본 | 원본 HTML 읽음. 인쇄본과 대조 못 함 |
| AMBLER-ACT | Scott Ambler, "UML Activity Diagrams: An Agile Introduction" — https://agilemodeling.com/artifacts/activitydiagram.htm | 저자 사이트 | 원본 HTML 대조 |
| AMBLER-STYLE | Scott Ambler, activity diagram style guidelines — https://agilemodeling.com/style/activityDiagram.htm | 저자 사이트 | 원본 HTML 대조 |
| CAMUNDA-PAT | Camunda Best Practices "Modeling with situation patterns" — https://docs.camunda.io/docs/components/best-practices/modeling/modeling-with-situation-patterns/ | 벤더 1차 | 원본 마크다운 대조 |
| CAMUNDA-READ | Camunda Best Practices "Creating readable process models" — https://docs.camunda.io/docs/components/best-practices/modeling/creating-readable-process-models/ | 벤더 1차 | 원본 마크다운 대조 |
| CD-CH5 | Humble·Farley, *Continuous Delivery* 5장 "Anatomy of the Deployment Pipeline" — https://www.informit.com/articles/printerfriendly/1621865 | 1차(저자, 출판사 배포) | 원본 HTML 대조. Figure 5.2와 5.4는 이미지를 직접 봄. Figure 5.1과 5.3은 안 봄 |
| GITLAB-NEEDS | GitLab 문서 `doc/ci/yaml/needs.md` — https://gitlab.com/gitlab-org/gitlab/-/raw/master/doc/ci/yaml/needs.md | 벤더 1차 | 원본 마크다운 대조 |
| GHA-GRAPH | GitHub Docs "Using the visualization graph" — https://docs.github.com/en/actions/how-tos/monitor-workflows/use-the-visualization-graph | 벤더 1차 | 원본 마크다운 대조 |
| C4-CONT / C4-DEP / C4-DYN / C4-FAQ | https://c4model.com/diagrams/container · `/diagrams/deployment` · `/diagrams/dynamic` · `/faq` (+ `/diagrams`, `/diagrams/notation`) | 1차 | 원본 HTML 6개에서 단어 수를 셈. 인용 문장 대조 |
| RB-PROC | Geary Rummler·Alan Brache, "The Process Level of Performance" — https://www.rummlerbrache.com/sites/default/files/ProcessLevelPerformance%20Article.pdf (15쪽) | 1차(저자의 글, 책 아님) | PDF 추출로 직접 읽음 |
| ARCHIFY | `references/archify/archify/SKILL.md` "Type router", `references/archify/archify/recipes/scenarios.mjs` | 참고 레포(MIT) | 파일 직접 읽음 |

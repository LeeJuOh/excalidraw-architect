# 공통 이해를 만드는 협업 캔버스의 아키텍처 조사

**조건부 추천: Document–View를 중심으로, 로컬 Client–Server와 명시적인 상태 확정을 결합한다.**
내부는 모듈 경계를 나누고, 필요한 외부 연결에만 Ports & Adapters를 적용한다.
브라우저의 외부 상태 흐름에는 Flux를 참고한다. 동시성 제어는 OCC부터 검토한다.
이 문서는 리서치 결과다. 정식 ADR이나 구현 승인이 아니다.

- 조사·재확인 날짜: 2026-10-10, Asia/Seoul.
- HEAD: `27e5496b1f003b1edf7449268a258ddd6e922c05`.
- 구현 설명의 기준: 해당 HEAD와 조회 당시 작업트리. 미커밋 변경을 포함한다.
- 방법: 프로젝트 문서 → 현재 구현 → 원저자 자료·공식 문서·실제 소스.
- 실행 재현, 성능 측정, 테스트는 하지 않았다. 효과는 검증한 결과가 아니라 설계 판단이다.
- 원문 URL을 보존했다. 외부 원문을 복제하거나 다운로드해 보관하지 않았다.

## 1. 목표에서 출발한 선택 기준

**목표는 사용자 교정을 보존하며 설계 이해를 대조하는 것이다.** 그림 품질은 그 목적을 돕는 수단이다.
개발자는 아키텍처·책임 경계·패턴·트레이드오프를 결정한다. 에이전트는 세부 구현을 맡는다.
코드 정리의 편의만으로 후보를 고르지 않았다. 포크 유지 전략은 별도 조사로 확대하지 않았다.

확인한 사실:

- Clark와 Brennan은 grounding을 현재 목적에 충분한 이해를 서로 확인하는 과정으로 설명한다. 공통 이해는 계속 갱신된다. [원저자 논문](https://web.stanford.edu/~clark/1990s/Clark,%20H.H.%20_%20Brennan,%20S.E.%20_Grounding%20in%20communication_%201991.pdf)
- Human–AI Interaction 지침은 효율적 수정, 모호함 해소, 최근 상호작용 기억, 세밀한 피드백을 제시한다. [Microsoft 연구팀](https://www.microsoft.com/en-us/research/?p=564561)

설계 판단:

- **상태 수렴과 의미적 합의는 다르다.** 같은 JSON을 받았어도 박스와 화살표를 다르게 이해할 수 있다.
- 사용자 교정을 다음 변경이 덮지 않아야 한다. 에이전트가 보는 그림과 사용자가 보는 그림의 시점도 맞아야 한다.
- 현재 코드와 변경안을 구분해야 한다. 구현 전후의 구조와 동작을 같은 질문으로 대조해야 한다.
- 모든 그림을 하나의 정형 의미 모델로 강제하지 않는다. 초안과 일회성 설명 그림도 대화에 필요하다.
- 별도 합의 DB, 승인 UI, 자동 ADR 생성은 제안하지 않는다. 결정 기록은 대상 프로젝트의 문서 규약에 둔다.

후보는 다섯 질문에서 골랐다: 실행 위치, 상태 소유, 충돌 처리, 데이터와 표현의 경계, 그림의 의미.
그래서 배포 스타일, 내부 구조, UI 패턴, 동시 편집 알고리즘을 서로 구분했다.

## 2. 넓게 검토한 후보와 비교

아래 적합성은 이 프로젝트에 대한 판단이다. 보편적인 순위나 측정 점수가 아니다.
링크는 각 후보의 정의와 해결 문제를 뒷받침한다. 우리 프로젝트의 비용 판단은 이 조사에서 도출했다.

| 분류 | 후보·원문 | 해결 문제 | 목표 적합성·장점 | 비용·한계 | 선택 판단 |
|---|---|---|---|---|---|
| 실행·배포 | Client–Server architecture | 클라이언트 입력과 공유 상태의 처리 위치 | 개발자와 에이전트가 같은 서버 상태를 읽기 쉽다 | 서버 장애·연결 끊김에 의존한다. 충돌 처리는 별도다 | 로컬 캔버스 세션의 기본 구조로 적합 |
| 실행·배포 | [Microservices architecture](https://martinfowler.com/articles/microservice-trade-offs.html) | 독립 배포·확장·팀별 소유 | 여러 조직·대규모 서비스에는 유리하다 | 네트워크 경계·운영·일관성 비용. 브라우저와 MCP 프로세스가 따로 있다는 이유만으로 해당하지 않는다 | 현재 목표에 추가 이익이 작다 |
| 데이터 소유 | [Local-first software](https://www.inkandswitch.com/essay/local-first/) | 오프라인 작업·사용자 소유·장기 보존 | 장치의 독립 편집과 나중 병합에 유리하다 | 복제·병합·마이그레이션 비용. localhost 서버만으로 성립하지 않는다 | 오프라인 요구가 확인되면 재검토 |
| 내부 구조 | [Layered architecture / N-tier architecture](https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/n-tier) | 책임을 층으로 분리 | UI·애플리케이션·데이터 책임을 이해하기 쉽다 | 기술별 층을 가로지르는 변경. Layer는 논리 구조이고 Tier는 배포 분리다 | 보조 분리로 가능. 목표를 직접 해결하지 않는다 |
| 내부 구조 | [Hexagonal Architecture / Ports & Adapters](https://alistair.cockburn.us/hexagonal-architecture) | 애플리케이션을 UI·DB 등 외부 연결에서 분리 | MCP·CLI·브라우저·저장 연결의 교체와 테스트에 유리하다 | 모든 함수에 포트를 만들면 우회와 추상화가 늘어난다 | 필요한 I/O 경계에 제한 적용 |
| 내부 구조 | [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html) | 외부 기술이 내부 정책을 지배하는 문제 | 핵심 정책과 도구 구현을 분리한다 | 여러 계층과 매핑 비용. 의존성 규칙만으로 공동 편집은 해결되지 않는다 | 전체 적용보다 필요한 경계만 참고 |
| 내부 구조 | [Modular Monolith](https://www.kamilgrzybek.com/blog/posts/modular-monolith-primer) | 하나의 배포 단위 안에서 모듈 경계 유지 | 캔버스 문서·그림·저장·세션 책임을 나누기 쉽다 | 경계를 실제로 지켜야 한다. 배포 독립성은 없다 | 캔버스 서버 내부의 방향으로 적합 |
| 내부 구조 | [Vertical Slice Architecture](https://www.jimmybogard.com/vertical-slice-architecture/) | 기능 변경이 여러 기술 계층에 흩어지는 문제 | 불러오기·export·복원 같은 사용 사례를 함께 다루기 쉽다 | 공동 편집의 공통 불변식을 기능마다 중복하면 위험하다 | 사용 사례 구성에 참고 |
| 내부 구조 | [Microkernel Architecture / Plug-in Architecture](https://www.oreilly.com/library/view/fundamentals-of-software/9781492043447/ch12.html) | 안정적인 핵심과 가변 기능의 확장 | 여러 렌더러·분석기 확장이 확정되면 유리하다 | 플러그인 계약·호환성·수명주기 관리 | 호스트 플러그인 배포와 구분. 내부 도입 근거는 부족 |
| 문제 해결 | [Blackboard architecture](https://www.sciencedirect.com/science/article/pii/0004370285900633) | 여러 지식원이 부분 결과를 공유하며 문제 해결 | 독립 분석기들이 공통 상태를 발전시키는 경우 유리하다 | 지식원 실행 조건과 제어 정책 필요. 공유 캔버스만으로는 해당하지 않는다 | 현재는 추가 복잡성 |
| 상호작용 | [Event-driven architecture, EDA](https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/event-driven) | 생산자와 소비자 분리·변경 반응 | 확정 변경의 알림과 여러 View 갱신에 유용하다 | 중복·순서·재연결·관측 문제. WebSocket 사용만으로 전체 EDA가 되지 않는다 | 변경 알림에 제한 적용 |
| UI·문서 | [Document–View architecture](https://learn.microsoft.com/en-us/cpp/mfc/document-view-architecture?view=msvc-170) | 문서 데이터와 표시·입력의 분리 | 같은 문서를 여러 방식으로 보여준다 | 원패턴은 UI 구조다. 동기화·의미 합의는 별도다 | 목표와 가장 직접적인 중심 |
| UI | [Model–View–Controller, MVC](https://www.martinfowler.com/eaaDev/uiArchs.html) | 모델·표시·입력 제어 분리 | 작은 UI에서 익숙하고 명확하다 | 입력과 원격 갱신 경로가 늘면 흐름 추적이 어려워진다 | 가능하지만 문서 경계를 더 명시할 수 있다 |
| UI 상태 흐름 | [Flux architecture](https://github.com/facebookarchive/flux/blob/main/docs/In-Depth-Overview.md?plain=1) | 다수 입력에 따른 상태 변경의 예측 가능성 | action → store → view로 변경 경로를 모은다 | Excalidraw 상태를 또 복제하면 원본이 늘어난다 | 외부 연결·문서 반영 흐름에 적용 |
| 동시성 제어 | [Optimistic Concurrency Control, OCC](https://httpwg.org/specs/rfc9110.html#field.if-match) | 오래된 변경이 최신 변경을 덮는 문제 | 기준 revision으로 충돌을 검출한다 | 충돌 후 재읽기·재적용이 필요하다. 수렴 알고리즘 자체는 아니다 | 현재 조건의 우선 후보 |
| 동시 편집 | [Conflict-free Replicated Data Types, CRDTs](https://arxiv.org/abs/1805.06358) | 독립 변경한 복제본의 결정적 수렴 | 오프라인·다중 편집자에 유리하다 | 삭제·바인딩·frame·undo 의미를 설계해야 한다. 의미적 합의는 보장하지 않는다 | 다중 편집 요구가 확인되면 유력 |
| 동시 편집 | [Operational Transformation, OT](https://sigmodrecord.org/?download_id=10728&smd_process_download=1) | 동시 연산을 변환해 일관성 유지 | 로컬 즉시 반응과 동시 편집을 지원한다 | 연산 쌍의 변환 규칙과 검증 비용. 그림과 텍스트는 연산이 다르다 | 독자 구현의 현재 비용이 큼 |
| 읽기·쓰기 모델 | [Command Query Responsibility Segregation, CQRS](https://martinfowler.com/bliki/CQRS.html) | 서로 다른 읽기·쓰기 요구 | 복잡한 조회 모델을 따로 발전시킬 수 있다 | 모델 분리·동기화 비용. 명령과 조회 함수만 나누는 것은 전체 CQRS 도입이 아니다 | 함수 역할 분리부터 시작 |
| 상태 저장 | [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html) | 변경 이력으로 상태 재구성 | 역사 재생과 원인 추적에 유리하다 | 이벤트 스키마·재생·마이그레이션·외부 효과 비용. undo·스냅샷만으로 성립하지 않는다 | 전체 이력 요구가 확인되기 전에는 보류 |

추가 검토: [Functional Core, Imperative Shell](https://www.destroyallsoftware.com/screencasts/catalog/functional-core-imperative-shell).
원저자 소개와 메타데이터만 확인했다. 영상 내용을 검증하지 않았으므로 최종 추천의 근거로 사용하지 않았다.
아키텍처 분류의 전체 지도도 확인했다. [Microsoft 공식 스타일 목록](https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/)

## 3. 선택 이유와 각 구조의 역할

**조건부 선택은 Document–View + 로컬 Client–Server다.** 새 조합 이름을 붙이지 않는다.
최우선 질문은 “누가 어떤 revision의 그림을 보고 수정했는가”다.
헥사고날이나 모듈형 모놀리스는 이를 보조하는 내부 구조다. 그 자체가 목표의 해법은 아니다.

1. **Document–View:** 요소·frame·그림 참조·근거 메타데이터를 협업 문서로 다룬다.
   문서는 전체 semantic graph를 뜻하지 않는다. 좌표와 자유로운 사용자 표시도 보존한다.
2. **Client–Server:** 캔버스 세션 서버가 현재 문서 상태를 확정한다. 브라우저와 에이전트가 같은 상태를 읽는다.
3. **OCC:** 변경의 기준 revision을 검사한다. 오래된 전체 캔버스가 최신 사용자 교정을 덮는 것을 검출한다.
4. **Modular Monolith:** 캔버스 서버 안의 책임을 모듈로 나눈다. 외부 호스트·MCP·브라우저까지 한 프로세스라는 뜻은 아니다.
5. **Ports & Adapters:** 문서 규칙을 MCP·HTTP·렌더러·파일 접근에서 분리할 필요가 있는 곳에만 둔다.
6. **Flux:** 브라우저 외부 상태를 입력 → action → store → View로 정리한다. 원래 Flux 라이브러리 설치를 요구하지 않는다.

Document–View 원문은 문서와 UI View의 분리다. [Microsoft 설명](https://learn.microsoft.com/en-us/cpp/mfc/document-view-architecture?view=msvc-170)
에이전트용 `describe`와 스크린샷을 같은 문서의 표현으로 연결하는 부분은 **우리의 적용 판단**이다.
스크린샷은 구조화한 조회와 다른 역할을 한다. 실제 글자 잘림·겹침·사용자 표시를 확인한다.
Flux의 단방향 흐름은 UI 갱신을 위한 패턴이다. [Facebook 원문](https://github.com/facebookarchive/flux/blob/main/docs/In-Depth-Overview.md?plain=1)
Redux의 자료도 같은 흐름을 설명한다. Redux 도입 자체는 결정하지 않았다. [Redux 공식 설명](https://redux.js.org/tutorials/fundamentals/part-2-concepts-data-flow)

왜 CRDT·local-first부터 선택하지 않는가:

- 현재 문서는 로컬 캔버스 서버와 세션을 전제로 한다. 오프라인 독립 편집 요구는 확인되지 않았다.
- Local-first는 사용자 장치 사본을 primary로 두는 원칙이다. 전송 서버가 존재할 수도 있다. [원저자 논문](https://www.inkandswitch.com/essay/local-first/)
- CRDT는 같은 업데이트를 받은 복제본의 수렴을 보장하는 데이터 타입이다. 합의한 설계의 뜻까지 보장하지 않는다. [CRDT 논문](https://arxiv.org/abs/1805.06358)
- OCC도 사용자 의도를 보존하는 자동 병합이 아니다. 충돌을 검출하고 사용자 교정을 보존할 정책이 필요하다.

## 4. 프로젝트에 적용한 구체적인 구조

아래는 **제안 구조**다. 현재 구현도나 디렉터리 변경안이 아니다. 그림 문자는 ASCII를 사용했다.

```text
Developer                            AI agent + archdraw
    | edit / correct                     | MCP / CLI commands
    v                                    v
+--------------------------+      +----------------------------+
| Browser                  |      | MCP / CLI client           |
| Excalidraw View          |      | read/write diagram files   |
| local interaction state  |      | report save result + path  |
+------------+-------------+      +-------------+--------------+
             | browser edit + base revision     | server path + base revision
             v                                 v
+--------------------------------------------------------------------------+
| Local canvas session server                                              |
|                                                                          |
| Input adapters -> Application commands -> Canvas Document                 |
|                      |                    elements / frames / references |
|                      |                    metadata / revision            |
|                      +-> distinct browser-edit / server-path policies     |
|                                                                          |
| Modules: document | drawings | sessions | save state | evidence checking   |
|                                          existing       planned          |
|                                                                          |
| Read projections -> describe / save state -> MCP / CLI -> AI agent         |
| Change notifications -> Browser -> renderedRevision acknowledgment        |
| Screenshot request(revision) -> Browser renderer -> image(revision)        |
| Snapshot storage -> project snapshot files                                |
+--------------------------------------------------------------------------+
```

- **문서 상태:** 어떤 요소와 메타데이터가 확정됐는가를 나타낸다.
- **브라우저 로컬 상태:** 선택·드래그 중 상태·뷰포트 등을 다룬다. 공유 대상은 별도로 정한다.
- **렌더 완료 상태:** 브라우저가 어떤 revision을 실제로 적용·렌더했는가를 나타낸다.
- **에이전트 판단:** 사용자 표시의 의미, 그림 종류, 줌 레벨, 필수요소를 결정한다.

제안하는 변경 순서:

1. 브라우저나 에이전트가 `baseRevision`과 변경을 보낸다.
2. 서버가 기준 revision과 입력 경로의 규칙을 검사한다.
3. 성공하면 변경을 원자적으로 적용한다. 새 revision과 변경 결과를 알린다.
4. 브라우저는 요소 적용과 필요한 글꼴 처리를 끝낸 뒤 `renderedRevision`을 답한다.
5. 스크린샷은 요청한 revision과 대응한다. 실패나 지연은 명시적으로 반환한다.

`If-Match`는 lost update를 막는 HTTP 조건 요청의 표준 수단이다. [RFC 9110](https://httpwg.org/specs/rfc9110.html#field.if-match), [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/If-Match)
revision의 단위, 명령 형식, 재적용 정책은 이 표준이 결정하지 않는다. 별도 설계·검증이 필요하다.
렌더 완료 응답도 설계 판단이다. 그 응답은 **표시 완료**를 뜻한다. 사용자의 의미적 합의를 뜻하지 않는다.

기존 정책을 보존한다:

- `server path`의 frame 자동 확장·거부·삭제 규칙과 `browser edit`의 결과 수신 규칙을 구분한다.
- 사용자의 좌표와 표시를 서버가 임의로 정렬하거나 교정하지 않는다.
- 설명 그림은 기본적으로 저장하지 않는다. 도면 승격은 사용자 발화로만 한다.
- 파일 export와 import 읽기는 MCP·CLI 클라이언트에 둔다. 성공 후 그림 id와 전체 경로를 서버에 알린다.
- 저장 상태 기록은 캔버스 세션 서버 메모리에 둔다. 파일 접근을 서버로 전부 옮기지 않는다.

## 5. C4와 모델 중심 도구의 위치

**C4와 Structurizr는 실행 아키텍처의 경쟁 후보가 아니다.** 그림의 의미와 표현을 다루는 별도 축이다.

- C4는 시스템·배포 단위 등에 대한 줌과 관점을 정리한다. 도구·표기법에 독립적이다. [C4 원저자 설명](https://c4model.com/)
- 필요한 레벨만 사용한다. 구조 외에 dynamic·deployment 등 지원 그림도 있다. [공식 그림 목록](https://c4model.com/diagrams)
- 프로젝트의 L1~L5는 C4 네 레벨과 같지 않다. ADR-0004의 용어와 실제 모듈 경계를 유지한다.
- Structurizr는 하나의 model에서 여러 view를 만든다. 여러 그림의 동일 개념·관계가 어긋나는 문제에 유리하다. [공식 튜토리얼](https://docs.structurizr.com/dsl/tutorial)
- custom view도 제공한다. 따라서 “C4 구조 그림만 지원한다”는 평가는 부정확하다. [공식 custom view](https://docs.structurizr.com/dsl/cookbook/custom-view/)
- 다만 자유로운 초안을 정형 모델로 왕복 변환하는 비용은 별도다. 보존한 도면의 일관성 문제가 실제로 나타나면 확대한다.

## 6. 현재 구현과의 차이

프로젝트 문서와 코드는 다시 읽었다. 첫 조사 뒤 작업트리에 저장 상태 구현이 추가돼 있었다.
따라서 **“저장 상태 구현이 없다”는 이전 판단은 현재 상태에 적용하지 않는다.**

| 확인 대상 | 현재 사실과 근거 | 제안과의 차이 |
|---|---|---|
| 목표·용어 | [AGENTS.md](../../AGENTS.md), [domain.md](../agents/domain.md), [CONTEXT.md](../../CONTEXT.md), [PRD](../../.scratch/archdraw-skill/spec.md) | 예쁜 그림보다 이해 대조·사용자 교정 보존을 판단 기준으로 사용 |
| 캔버스 세션 | [ADR-0003](../adr/0003-one-canvas-server-per-session.md): 세션별 로컬 서버·고정 프로젝트 루트 | 배포 방식은 유지. 전체 시스템을 하나의 모놀리스라고 부르지 않음 |
| 그림 경계·복사 | [ADR-0007](../adr/0007-canvas-never-cleared-import-copies.md), [ADR-0008](../adr/0008-frame-is-the-drawing-unit.md): frame 단위·새 ID 복사·참조 | 새 의미 모델보다 현재 단위를 문서 경계로 발전 |
| browser edit 수신 | [server.ts](../../src/server.ts), 조회 시 985~1047행: 전체 Map 교체, `version: 1`, 개수·시각 알림 | 기준 revision 검사와 확정 변경 알림이 필요 |
| 프론트 동기화 | [App.tsx](../../frontend/src/App.tsx), 354행·612행 이후: sync 확인 로그, 활성 요소 전체 전송 | 다중 탭의 browser edit를 다른 탭에 전달하는 수렴 경로가 불완전 |
| 이미지 요청 | [server.ts](../../src/server.ts), 1111~1179행: 전체 상태 방송 후 800ms 뒤 export 요청 | revision과 렌더 완료의 명시적 대응이 없음. 지연 기반 추정을 줄이는 안 |
| 저장 상태 | [server.ts](../../src/server.ts), 1383~1449행: `drawingSaves`, 내용 hash, 파일 존재 확인, `/api/save-state`, 스냅샷 변경 상태 | **작업트리에 이미 구현됨.** 책임을 재사용·분리할 대상 |
| 저장 통보·조회 | [canvas-client.ts](../../src/core/canvas-client.ts), 282~307행: `recordSave`·`getSaveState` | 서버에 저장 결과를 알리는 경계를 유지 |
| 도면 파일 처리 | [scene-io.ts](../../src/core/scene-io.ts), [mcp-dispatch.ts](../../src/core/mcp-dispatch.ts), 476행·638행 이후 | 파일 처리 후 저장 통보, 스크린샷의 저장 상태 동봉이 이미 있음 |
| 근거 검사 | [ADR-0005](../adr/0005-server-checks-evidence-and-demotes.md), [이슈 07](../../.scratch/archdraw-skill/issues/07-evidence-check.md) | `src`의 근거·강등 검색에서 검사 구현을 찾지 못함. 저장 상태 구현과 별개 |
| 저장 배치 | [ADR-0010](../adr/0010-server-reports-save-state-skill-never-asks.md), 2026-10-10 개정 | 클라이언트 파일 처리·절대 경로 통보·서버 세션 메모리 기록을 보존 |

정적 코드에서 추론한 위험: 오래된 전체 동기화가 사용자나 에이전트의 최신 변경을 덮을 수 있다.
실제로 발생한 빈도·영향은 측정하지 않았다. 근거 파일·줄의 존재 검사도 의존 관계의 의미를 보장하지 않는다.
export한 내용과 저장 통보 때 서버 내용이 달라질 수 있는지 역시 확인할 가정이다. 문서 revision으로 대응을 검토한다.

공식 Excalidraw 앱은 현재 프로젝트의 협업 프로토콜과 다르다:

- npm 컴포넌트에 협업이 내장돼 있지 않다. 호스트가 API로 구현한다. [공식 FAQ](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/faq)
- 공식 앱은 브라우저에서 원격 요소를 reconcile하고 Firebase 저장도 요청한다. [Collab.tsx](https://github.com/excalidraw/excalidraw/blob/master/excalidraw-app/collab/Collab.tsx)
- room 서버는 암호화한 메시지를 중계한다. 도형 내용을 해석·병합하지 않는다. [room 서버](https://github.com/excalidraw/excalidraw-room/blob/master/src/index.ts)
- 공식 reconcile는 요소 version과 versionNonce로 충돌을 처리한다. 그 방식의 존재가 우리 동기화의 수렴을 증명하지 않는다. [reconcile.ts](https://raw.githubusercontent.com/excalidraw/excalidraw/master/packages/excalidraw/data/reconcile.ts)

## 7. 선택을 확정하기 전에 확인할 가정

- 개발자 1명과 에이전트 1개가 주 사용 조건인가. 같은 캔버스의 다중 탭·다중 에이전트는 얼마나 필요한가.
- 같은 요소의 동시 수정이 얼마나 잦은가. 캔버스 revision과 그림 revision 중 어느 단위가 충돌을 줄이는가.
- OCC 실패 시 사용자 교정을 보존하면서 재읽기·재적용할 수 있는가. 자동 재시도가 의도를 바꾸지 않는가.
- Excalidraw의 undo·드래그·삭제·바인딩·frame 관계가 새 프로토콜에서 유지되는가.
- screenshot과 `describe`가 같은 revision을 가리키는지 확인할 수 있는가. 서버 갱신과 실제 렌더 완료를 구분할 수 있는가.
- 변경안과 현재 코드를 대조하면 오해를 더 일찍 찾는가. 질문 종류·근거·교정 보존으로 관찰한다.
- 오프라인 독립 편집, 장기 복구, 전체 변경 이력, 도면 간 의미 일관성이 실제 요구인가.

## 8. 원문 카탈로그

조사팀이 사용한 직접 근거와 참고 후보를 보존했다. 번호는 재방문용이다.
`확인`은 표에 적은 범위를 읽었다는 뜻이다. 책·레포·논문 전체를 완독했다는 뜻은 아니다.
GitHub `master`·`main` 링크와 공식 문서는 변할 수 있다. 조회 날짜와 로컬 HEAD를 함께 봐야 한다.

| 번호 | 제목·원저자 또는 기관·원문 URL | 확인한 내용·사용 상태·접근 제한 |
|---|---|---|
| S01 | [Grounding in Communication](https://web.stanford.edu/~clark/1990s/Clark,%20H.H.%20_%20Brennan,%20S.E.%20_Grounding%20in%20communication_%201991.pdf), Herbert H. Clark·Susan E. Brennan. [CMU 원문 사본](https://www.cs.cmu.edu/~illah/CLASSDOCS/Clark91.pdf) | 원저자 공개 PDF 확인. 현재 목적에 충분한 이해를 확인하는 과정. 목표 판단에 사용. CMU 사본은 검색 발췌 확인 |
| S02 | [Guidelines for Human–AI Interaction design](https://www.microsoft.com/en-us/research/?p=564561), Saleema Amershi·Microsoft Research. [공식 포스터](https://www.microsoft.com/en-us/research/uploads/prod/2019/03/AI_Guidelines_Poster_PrintQuality.pdf) | 연구팀 설명·18개 지침 확인. 수정·모호함·기억·피드백 근거. 포스터는 검색 발췌 확인 |
| S03 | [Local-first software](https://www.inkandswitch.com/essay/local-first/), Kleppmann·Wiggins·van Hardenberg·McGranaghan. [논문 PDF](https://www.inkandswitch.com/essay/local-first/local-first.pdf), [연구 개요](https://www.inkandswitch.com/local-first-software/) | 장치 사본의 primary 역할, 서버·CRDT 관계 확인. 원문 사용. PDF·개요는 검색 발췌 확인 |
| S04 | [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture), Alistair Cockburn | 목적·ports/adapters·UI와 DB 분리·예제 확인. 공개 원문. 내부 경계 판단에 사용 |
| S05 | [The Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html), Robert C. Martin | 의존성 규칙과 외부 기술 독립성 확인. 공개 원문. 전체 계층 도입은 추천하지 않음 |
| S06 | [Architecture styles](https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/), Microsoft | 스타일별 문제·제약의 지도 확인. 후보 확대에 사용 |
| S07 | [N-tier architecture](https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/n-tier), Microsoft | 논리 layer와 물리 tier, 장단점 확인. Layered/N-tier 구분에 사용 |
| S08 | [Microservice trade-offs](https://martinfowler.com/articles/microservice-trade-offs.html), Martin Fowler | 독립 배포의 이익과 분산·운영 비용 확인. 현재 도입 보류 판단 |
| S09 | [Modular Monolith: A Primer](https://www.kamilgrzybek.com/blog/posts/modular-monolith-primer), Kamil Grzybek | 모듈성과 단일 배포의 범위 확인. 캔버스 서버 내부 구조에 사용 |
| S10 | [modular-monolith-with-ddd](https://github.com/kgrzybek/modular-monolith-with-ddd), Kamil Grzybek | 실제 모듈 경계·README 설명 확인. mutable 레포. 구현 참고이며 이 프로젝트에 DDD 전체 도입을 요구하지 않음 |
| S11 | [Vertical Slice Architecture](https://www.jimmybogard.com/vertical-slice-architecture/), Jimmy Bogard | 사용 사례별 변경 응집과 기술 계층의 비용 확인. 기능 구성 참고 |
| S12 | [Fundamentals of Software Architecture, Chapter 12: Microkernel Architecture](https://www.oreilly.com/library/view/fundamentals-of-software/9781492043447/ch12.html), Mark Richards·Neal Ford | 코어와 plug-in 구성의 공개 미리보기만 확인. 이후 유료 구간 미열람. 제한된 정의만 사용 |
| S13 | [A blackboard architecture for control](https://www.sciencedirect.com/science/article/pii/0004370285900633), Barbara Hayes-Roth | 초록만 확인. 도메인·제어 문제의 구분. 전문 미열람. 다른 재조회에서는 도구 접근 오류. 세부 구현 근거로 사용하지 않음 |
| S14 | [Event-driven architecture](https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/event-driven), Microsoft | 생산자·소비자 분리, 알림, 순서·일관성 비용 확인. 내부 변경 알림 범위에 사용 |
| S15 | [Document–View Architecture](https://learn.microsoft.com/en-us/cpp/mfc/document-view-architecture?view=msvc-170), Microsoft | 문서의 데이터·저장·View 갱신과 View의 표시·입력 역할 확인. 주요 근거. 페이지에 인증 안내가 있으나 설명 본문은 열람 가능했음 |
| S16 | [GUI Architectures](https://www.martinfowler.com/eaaDev/uiArchs.html), Martin Fowler | MVC와 UI 책임 분리 설명 확인. 비교 참고 |
| S17 | [Flux In-Depth Overview](https://github.com/facebookarchive/flux/blob/main/docs/In-Depth-Overview.md?plain=1), Facebook | dispatcher·store·view·action과 단방향 흐름 확인. mutable main 링크. 레포는 archived 상태. 라이브러리 채택 추천과 구분 |
| S18 | [Redux Fundamentals: Concepts and Data Flow](https://redux.js.org/tutorials/fundamentals/part-2-concepts-data-flow), Redux 프로젝트 | 단방향 상태 흐름 확인. 패턴 설명 참고. Redux 설치 결정은 아님 |
| S19 | [RFC 9110 §13.1.1 If-Match](https://httpwg.org/specs/rfc9110.html#field.if-match), IETF HTTP Working Group | 조건 요청·lost update 방지 확인. OCC의 HTTP 적용 근거 |
| S20 | [If-Match header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/If-Match), MDN | ETag 비교·412 응답·lost update 설명 확인. 표준의 적용 설명 |
| S21 | [Conflict-free Replicated Data Types](https://arxiv.org/abs/1805.06358), Nuno Preguiça·Carlos Baquero·Marc Shapiro | 원저자 초록의 독립 수정과 결정적 수렴 정의 확인. 논문 전문 완독은 아님 |
| S22 | [Concurrency Control in Groupware Systems](https://sigmodrecord.org/?download_id=10728&smd_process_download=1), C. A. Ellis·S. J. Gibbs. [발행기관 페이지](https://sigmodrecord.org/1989/06/15/concurrency-control-in-groupware-systems/), [LRI 원문 사본](https://www.lri.fr/~mbl/ENS/CSCW/2015/papers/Ellis-SIGMOD89.pdf) | SIGMOD 공개 PDF 9쪽에서 반응·알림·수렴·연산 변환 확인. OT 비교에 사용. LRI 사본은 검색 발췌 확인 |
| S23 | [CQRS](https://martinfowler.com/bliki/CQRS.html), Martin Fowler | 읽기·쓰기 모델 분리와 복잡성 경고 확인. 전체 도입 보류 판단 |
| S24 | [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html), Martin Fowler | 이벤트 이력으로 상태 재구성·재생·외부 효과 문제 확인. 스냅샷과 구분 |
| S25 | [Functional Core, Imperative Shell](https://www.destroyallsoftware.com/screencasts/catalog/functional-core-imperative-shell), Gary Bernhardt | 원저자 소개·메타데이터만 확인. 영상 미열람. 후보 검토만 했고 최종 추천 근거에서 제외 |
| S26 | [C4 model](https://c4model.com/), Simon Brown | 계층적 추상화·도구와 표기법 독립성 확인. 표현 방법의 근거 |
| S27 | [C4 Diagrams](https://c4model.com/diagrams), Simon Brown | 필요 레벨만 사용·지원 그림 확인. [Introduction](https://c4model.com/introduction), [FAQ](https://c4model.com/faq)는 검색 발췌 확인 |
| S28 | [Structurizr](https://docs.structurizr.com/), Simon Brown·Structurizr | models as code·하나의 model과 여러 그림 설명 확인. 도구 비교 참고 |
| S29 | [Structurizr DSL Tutorial](https://docs.structurizr.com/dsl/tutorial), Structurizr | workspace·model·views 정의와 예제 확인. 모델 중심 구조의 실제 근거 |
| S30 | [Structurizr Custom view](https://docs.structurizr.com/dsl/cookbook/custom-view/), Structurizr | ad hoc custom 요소·view도 제공함을 확인. C4만 가능한 도구라는 단정 방지 |
| S31 | [DSL Language reference](https://docs.structurizr.com/dsl/language), Structurizr. [Cookbook](https://docs.structurizr.com/dsl/cookbook/), [Static perspectives](https://docs.structurizr.com/dsl/cookbook/perspectives-static/) | model 정의·동적 view·perspective의 검색 발췌 확인. 추가 탐색용. 상세 설계의 직접 근거로 사용하지 않음 |
| S32 | [Excalidraw FAQ](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/faq), Excalidraw | npm 컴포넌트에 협업이 내장되지 않는다는 설명 확인 |
| S33 | [Excalidraw Props](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/props/), Excalidraw | onChange·API·호스트 연결 경계 확인. API는 변경 가능한 공식 문서 |
| S34 | [Collab.tsx](https://github.com/excalidraw/excalidraw/blob/master/excalidraw-app/collab/Collab.tsx), Excalidraw. [Raw 원문](https://raw.githubusercontent.com/excalidraw/excalidraw/master/excalidraw-app/collab/Collab.tsx) | 브라우저 reconcile·표시·Firebase 요청·로컬 저장 일시 중지 확인. mutable master. 공식 앱 전체의 local-first 여부는 단정하지 않음 |
| S35 | [excalidraw-room](https://github.com/excalidraw/excalidraw-room/blob/master/src/index.ts), Excalidraw. [Raw 원문](https://raw.githubusercontent.com/excalidraw/excalidraw-room/master/src/index.ts) | 방 관리와 암호화 메시지 중계 확인. 도형 병합 로직 없음. mutable master |
| S36 | [reconcile.ts](https://raw.githubusercontent.com/excalidraw/excalidraw/master/packages/excalidraw/data/reconcile.ts), Excalidraw | version·versionNonce와 로컬 편집 상태를 고려한 요소 병합 확인. mutable master. 우리 서버 프로토콜과 다름 |
| S37 | [Portal.tsx](https://raw.githubusercontent.com/excalidraw/excalidraw/master/excalidraw-app/collab/Portal.tsx), Excalidraw | 협업 전송 연결 소스 접근 확인. mutable master. 본문 주장의 직접 근거는 Collab·room을 사용 |
| S38 | [Collaboration mode discussion #3879](https://github.com/excalidraw/excalidraw/discussions/3879), Excalidraw 프로젝트 | 호스트별 협업 구현 안내의 검색 발췌 확인. 참고만. 현재 사실은 FAQ와 실제 소스로 확인 |
| S39 | [Differential Synchronization](https://neil.fraser.name/writing/sync/), Neil Fraser. [Google Research 발행 정보](https://research.google/pubs/differential-synchronization/) | 상태 기반 애플리케이션에 델타로 수렴하는 다른 동기화 후보 확인. 최종 비교의 주 후보로 좁히지 않음 |
| S40 | [CRDTs: Consistency without concurrency control](https://arxiv.org/abs/0907.0929), Letia·Preguiça·Shapiro. [2011 CRDT 기술 보고서 사본](https://dsf.berkeley.edu/cs286/papers/crdt-tr2011.pdf) | 원저자·제목·초록의 검색 발췌 확인. 배경 참고만. 수렴 정의는 S21을 사용 |
| S41 | [The Hearsay-II Speech-Understanding System](https://citeseerx.ist.psu.edu/document?doi=4011194a9dd83a79ea6b6d2312a3a10b70e911b5&repid=rep1&type=pdf), Erman·Hayes-Roth·Lesser·Reddy | 검색 발췌 후 PDF 접근 403. 전문 미확인. Blackboard의 세부 제어 로직을 이 링크로 입증하지 않음 |
| S42 | [UM-CS-1992-071](https://web.cs.umass.edu/publication/docs/1992/UM-CS-1992-071.pdf), UMass Amherst 연구 보고서 | PDF 접근은 가능했으나 도구의 텍스트 추출 실패. 전문 미확인. 추가 읽기용으로만 보존 |
| S43 | [The Blackboard Model of Problem Solving, Part One](https://onlinelibrary.wiley.com/doi/abs/10.1609/aimag.v7i2.537), H. Penny Nii | 서지·검색 발췌만 확인. 전문 미확인. 본문의 Blackboard 설명은 S13의 확인 범위로 제한 |
| S44 | [A Retrospective View of the Hearsay-II Architecture](https://www.researchgate.net/publication/220815581_A_Retrospective_View_of_the_Hearsay-II_Architecture), Victor R. Lesser·Lee D. Erman | 저자 업로드 표시와 검색 발췌만 확인. 전문 미확인. 역사적 추가 읽기용 |

원문에 없는 효과를 이 프로젝트의 검증된 사실로 옮기지 않았다.
다음 결정은 동시 편집과 이해 대조의 실제 관찰에 따라 좁힌다.

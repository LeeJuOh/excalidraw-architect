---
topic: drawing-quality-review
date: 2026-10-17
---

# 그림 품질 재점검 — 시험 세트로 비교하고 고친다

## Goal

archdraw의 그림 결과가 사용자 마음에 들지 않는다. 그래서 F1~F3 작업을 멈추고 방향을 다시 점검한다.

- 목표: 에이전트가 백엔드·소프트웨어 설계를 그림으로 설명한다 → 사람이 이해하고 판단한다 → 그 판단이 에이전트에게 돌아간다.
- archdraw와 HTML explainer 스킬(html-plan, visual-explainer 등)은 **같은 개념**이다. 다른 것은 매체(캔버스 / HTML) 하나다. 캔버스를 고른 이유: 사람이 그림을 직접 고칠 수 있어서 소통이 쉽다. 그래서 HTML explainer 자료는 "비슷한 사례"가 아니라 직접 참고 대상이다.

문제 4가지 (사용자와 합의):
1. 그림 결과가 마음에 들지 않는다. 확인된 원인은 2번(색)뿐이다. 나머지는 시험으로 찾는다.
2. 바뀌지 않는 요소는 모두 흰 박스·검정 선이다(`docs/adr/0015-color-only-for-change-status.md`). 경계가 안 보이고 통일감이 없다. 사용자는 변경 상태 외에도 색을 쓰기를 원한다.
3. 스킬 지시문이 길다. `plugin/skills/archdraw/`의 `.md` 합계 1,220줄(SKILL.md 307줄). pstack 핵심 스킬은 하나에 약 40~160줄. 사용자는 pstack의 짧은 지시문과 플레이북 방식을 좋게 본다.
4. 참고 자료가 부족했다.

## First Action

**판단 질문 8개(아래 "시험 세트")를 사용자에게 보여 주고 고칠 것이 있는지 묻는다.** 질문 하나만, 짧게. 확정되면 지금의 archdraw로 시험 주제 ①~④를 그린다(Next Steps 1).

## Context

- 사용자는 **짧은 보고**와 **질문 한 번에 하나**를 원한다. 결정 질문 전에 설명이 필요하면 구체 예시를 먼저 쓴다(`AGENTS.md` "문제를 설명할 때").
- 사용자는 `/in-your-own-words`로 내 이해를 자주 확인한다. 이 세션에서 내 이해가 여러 번 틀렸다(아래 What Didn't Work). 사용자의 말을 넓게 해석하지 않는다.
- 내 주의는 "평가 기준"에 있었다. "마음에 드는가"만으로는 원인을 찾을 수 없고, 고친 뒤에 나아졌는지도 확인할 수 없다. 그래서 **판단 질문에 답할 수 있는가**를 기준으로 정했다.

### 접근 방법 (사용자와 합의)

1. 시험 세트를 고정한다 ← **지금 여기** (주제 4개와 판단 질문은 정했고, 질문은 사용자 확인 전)
2. 지금의 archdraw로 그린다. 그림만 보고 판단 질문에 답할 수 있는지 본다. 사용자가 그림마다 문제를 적는다 → 문제 목록.
3. 같은 주제를 html-plan으로도 만든다(같은 개념, 다른 매체 → 가장 직접적인 비교). ByteByteGo(system-design-101)는 형태만 참고한다. 처음에는 실행하는 비교 도구를 html-plan 하나로 줄인다.
4. 문제를 4층으로 나눈다: 무엇을 그리나 / 어떻게 배치하나 / 어떻게 보이나 / 판단이 어떻게 돌아오나. 층마다 원인 위치를 찾는다: 스킬 지시문, `docs/canvas-guide.md`, 서버.
5. 고친다. 색은 캔버스에서 A안과 B안을 같은 그림으로 비교해서 사용자가 고르고, ADR-0016으로 ADR-0015를 대체한다. 색값의 원본은 `docs/canvas-guide.md` 한 곳이다(ADR-0006). 스킬 지시문 줄이기는 규칙이 정해진 뒤 마지막에 한다.
6. 외부 확인: 맥락이 없는 서브에이전트에게 그림만 주고 판단 질문에 답하게 한 뒤 코드와 대조한다. 고치기 전과 후를 사용자가 어느 쪽인지 모르는 상태에서 비교한다.

### 시험 세트

샘플: `references/food-ordering-system` (agelenler, 커밋 `f2c1609`). 헥사고날 + MSA + DDD + EDA(Kafka, SAGA, Outbox, CQRS). LICENSE 파일이 없다 → 로컬에서 읽기만 한다. 그림은 코드를 읽어서 그린다. Java 서비스를 실행할 필요는 없다.

| # | 주제 | 판단 질문 (초안, 답은 적지 않음) |
|---|---|---|
| ① | 서비스 경계와 이벤트 (MSA, EDA) | 주문 서비스는 결제 서비스를 직접 호출하는가, 이벤트로만 통신하는가? · 고객 데이터는 주문 서비스에 어떻게 들어오는가? |
| ② | 주문 서비스 내부 (헥사고날, DDD) | `Order` 애그리거트는 Kafka나 JPA에 의존하는가? · 결제 응답은 어느 입력 포트로 들어오고 어느 출력 포트로 나가는가? |
| ③ | 주문 생성에서 승인까지 (사가, Outbox) | 레스토랑이 거절하면 결제는 어떻게 되돌려지는가? · DB 저장과 이벤트 발행은 어디에서 하나로 묶이는가? |
| ④ | 배달 서비스 추가 (**변경 제안 그림**) | 주문 사가에 어떤 단계가 더해지는가? · 배달이 실패하면 무엇을 되돌리는가? |

④는 현재 구조가 아니라 구현 전 변경 제안이다. 사람의 판단이 돌아오는 곳이고, 변경 상태 색이 쓰이는 유일한 그림이라서 넣었다.

코드 위치 (판단 질문 대조용):
- 사가: `order-service/order-domain/order-application-service/.../order/service/domain/OrderPaymentSaga.java`, `OrderApprovalSaga.java`
- 포트: 같은 모듈의 `.../order/service/domain/ports/` (`input/`, `output/`)
- 애그리거트: `order-service/order-domain/order-domain-core/.../domain/entity/Order.java`
- Kafka 메시지: `infrastructure/kafka/kafka-model/src/main/resources/avro/*.avsc` (5종)

### 색 규칙 해결안 (사용자 선택 대기)

| 안 | 내용 | 변경 상태 색과의 충돌 |
|---|---|---|
| A (내 추천) | 경계(서비스·레이어·신뢰 경계) 영역에 연한 배경색. 안의 박스는 흰색. 빨강·초록·노랑 계열은 피한다 | 작음 |
| B | 종류(서비스·큐·DB)에 색. ByteByteGo·업스트림 방식 | 큼. ADR-0015에서 기각한 안 |
| C | A + B | 가장 큼 |

현재 규칙: `docs/canvas-guide.md`의 `## Colors` 절. 영역(background zones)은 지금 "outline and no fill"이다(`## Drawing order` 절).

## Current Progress

### Verified repo state (repo_facts.sh, 2026-10-17)

- **Branch:** `main`. `docs/agents/design-references.md`(4줄 추가)와 이 파일을 커밋 `4854607`로 커밋하고 origin에 push했다.
- **Uncommitted:** 없음 (이 줄을 고친 후속 커밋 제외).

### 이 세션에서 한 것

- `docs/agents/design-references.md`에 참고 레포 4줄을 추가했다:
  - "시각적 설명과 피드백" 표: `html-plan`(Thariq Shihipar, `references/claude-plugins-community/html-plan/`), `comprendo`
  - "구조 탐색과 공동 편집" 표: `excalidraw-toolkit`
  - "설계 합의와 의도 보존" 표: `c4-model-skill`
- `../references/`에 클론했다(git 밖, sibling 폴더): `comprendo`, `excalidraw-toolkit`, `c4-model-skill`, `food-ordering-system`. 앞의 3개는 MIT.
- `llm-wiki/raw/repos`(= `references/`, 375개)의 README를 서브에이전트로 훑어 후보를 골랐다. 결과는 아래 "참고 후보 (추가 대기)".

## Decisions Made

- 샘플 프로젝트: food-ordering-system. 사용자가 "헥사고날 + MSA + DDD + EDA"를 요구했다. 4가지가 모두 설계 목표인 레포다. 다른 후보: ftgo-application, dotnet/eShop, wild-workouts.
- 시험 주제는 4개다(④ 변경 제안 포함, 사용자가 "추천대로"로 승인).
- 평가 기준은 판단 질문이다. "마음에 드는가"만 쓰지 않는다.
- F1~F3, 03 슬라이스 B, 02는 이 점검이 끝난 뒤에 한다. 그 상태는 `.scratch/archdraw-skill/handoff/2026-10-13-remaining-work.md`에 그대로 있다. 그 파일의 "이 문서가 유일한 핸드오프다"는 이제 맞지 않는다. 그 파일은 멈춘 작업의 기록이다.

## 참고 후보 (추가 대기, 사용자 결정)

- 내 추천 4개: `snip`(판단을 JSON `approved`/`changes_requested`로 돌려준다), `tldraw-desktop`(같은 캔버스 매체. 비공개 라이선스라서 아이디어만), `plugins-for-claude-natives`의 `interactive-review`(plan 항목마다 체크와 코멘트. html-plan과 일부 겹침), `humanlayer-skills`의 `show-me`(대화 중에 그림으로 설명. visual-explainer와 일부 겹침).
- 새 절 "백엔드 그림 예시": `system-design-101`(가이드 400개, ByteByteGo 그림은 원격 URL, CC BY-NC-ND → 보고 배우기만), `system-design-primer`(로컬 이미지 59개, CC BY 4.0).
- `pstack` 줄 보강: "스킬 작성 방식과 플레이북". 근거: `wiki/summaries/pstack-skill-design.md`, `references/pstack/skills/poteto-mode/playbooks/authoring-a-skill.md`.
- 선택: `slides-grab`(사람이 영역을 드래그해서 수정을 요청. 캔버스에도 맞는 방식).
- 확인하지 않은 범위: 마켓플레이스 5개(anthropics-claude-plugins-official, knowledge-work-plugins, cursor-plugins, openai-plugins, agents)는 최상위 README만 보았다.

## What Worked

- 마켓플레이스 미러 `references/claude-plugins-community/.claude-plugin/marketplace.json`(2,284개)을 키워드 두 묶음(시각 × 계획·설명)의 AND로 걸렀다. 결과가 짧고 정확했다.
- 375개 README 훑기는 Explore 서브에이전트 하나에 맡기고, 결과만 받았다.
- 추천 근거를 "기존 목록이 아직 답하지 못한 질문에 새 답을 주는가"로 설명하자 사용자가 판단할 수 있었다.

## What Didn't Work

- ⚠️ 사용자의 말을 넓게 해석했다. "1번"(html-plan)은 "목록에 추가하라"였는데 나는 "읽고 비교하라"로 이해했다. 모호하면 한 줄로 되묻는다.
- ⚠️ "html-plan과 같다"고 썼다. 사용자의 뜻은 "같은 개념, 매체만 다르다"였다.
- system-design-101 등을 "상호작용 문서의 범위가 아니다"라는 이유로 뺐다. 사용자의 지금 문제는 그림 품질이므로 틀린 판단이었다. 문서의 범위보다 사용자의 지금 문제를 기준으로 고른다.
- "변경 제안 그림도 시험할까요?"를 설명 없이 물었다. 사용자는 이해하지 못했다. 처음 쓰는 용어는 예시와 함께 묻는다.
- 문제 하나(색)만 보고했을 때 사용자가 "전체를 보고하라"고 했다. 상태 보고는 전체 목록을 먼저 보인다.

## Next Steps

1. 판단 질문이 확정되면 지금의 archdraw로 ①~④를 그리고 스크린샷을 찍는다. 그림마다 판단 질문에 답할 수 있는지 사용자와 본다. 사용자가 문제를 적는다.
2. html-plan으로 같은 주제를 만든다. 스킬 파일: `references/claude-plugins-community/html-plan/skills/html-plan/` (`SKILL.md`, `runtime/pack.mjs`, 예시 `examples/scheduled-send.html`). ByteByteGo 그림 몇 개를 형태 참고로 옆에 둔다.
3. 문제 목록을 4층으로 나누고 원인 위치를 찾는다.
4. 색 규칙: 캔버스에서 A·B를 비교 → 사용자 선택 → ADR-0016 → `docs/canvas-guide.md` 수정.
5. 문제마다 참고 레포 1~2개를 README 너머 관련 파일까지 읽는다. 남은 참고 후보는 이때 필요하면 목록에 추가한다.
6. 스킬 지시문을 pstack 원칙으로 줄인다(다음 결정을 바꾸지 않는 문장은 지운다. 반복되는 일은 서버나 스크립트로 옮긴다).
7. 외부 확인(접근 방법 6번)을 한다.

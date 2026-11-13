# 색 쓰임·글씨체 조사

대상: 변경 3색 밖의 색 쓰임(요소 종류, 그룹·경계, 강조, 범례, 다크 모드)과 글씨체(이름, 코드 이름·타입, 보조 글).
조사: 2026-11-14 열두 번째 세션. 서브에이전트 셋이 읽었다. [img]는 서브에이전트의 이미지 확인, [doc]은 문서, [code]는 코드, [inf]는 추론.
결정 범위: 색은 전역(중립 톤, 변경 3색 예약)만 지금 정하고, 그림 종류별 색 쓰임은 ①에서 정한다(열두 번째 세션 결정).

| 레포 | 커밋 | 색 쓰임 · 글씨체 | 근거 |
|---|---|---|---|
| whiteboard | `16d979ca` | 색: 저장소 teal·큐 violet 테두리, accent는 논의 중인 부분, 그룹은 같은 색 8%, 외부는 점선. 글씨: 제목 sans(Inter), 노드 본문 mono(Geist Mono), 설명 serif | [doc] `packages/review/instructions/animation.md:19,46-48`, [code] `packages/review/app/src/global.css:50-54` |
| archify | `a4065941` | 색: 종류별 7색 고정, 장식 accent 금지, 쓴 종류만 범례. 글씨: JetBrains Mono 하나("One Voice") | [doc] `DESIGN.md:4-17,102-148` |
| humanlayer-skills (show-me) | `4d69d20` | 없음. 제품의 색·글씨를 따르라는 말뿐 | [doc] `plugins/show-me/skills/show-me/SKILL.md:118` |
| visual-explainer | `9d5f880` | 색: 90% 중립 + 신호 하나, 종류는 모양으로, 상태색 따로, 범주색 5개까지. 글씨: IBM Plex Sans + Mono 또는 Geist + Geist Mono, 필드는 mono | [doc] `references/style-guide.md:10,18,46,50,56,70`, [code] `kit/kit.css:20-22` |
| answer-me-with-html | `053619b` | 색: 강조 노드 accent, 그룹은 중립 채움, 라이트·다크 토큰과 4.5:1 대비. 글씨: 시스템 sans + mono, 크기 측정 때문에 고정 | [doc] `docs/reference.md:284-302`, [code] `src/themes/fonts.js:4-5` |
| effective-html | `5ce160a` | 색: 상태색과 accent 분리, 4~6색, 다크는 따로 설계, 색 단독 금지. 글씨: 역할별 2개 이상 짝 | [doc] `skills/design-artifact/SKILL.md:26-30,44,49-50` |
| diagram-design | `e57eda6` | 색: 중립 + accent 하나(초점 1~2개), 종류는 투명도·점선, "Color is secondary", "No rainbow". 글씨: 제목 serif, 노드 이름 Geist sans, 기술 정보 Geist Mono, 한글 최소 12px | [doc] `skills/diagram-design/references/style-guide.md:17-29,89-96,205-211,227-228` |
| excalidraw-diagram-skill | `8646fcc` | 색: 의미별 fill·stroke 쌍(Primary 파랑 3단, Success, Warning, Error 등), 글자 위계도 색, 다크 없음. 글씨: Excalidraw `fontFamily: 3`(Cascadia) 하나, roughness 0 | [doc] `references/color-palette.md:11-22,32-38`, `SKILL.md:349-359,540-541` |
| Understand-Anything | `98d6dca` | 색: 노드 종류 약 18색, 레이어 7색 반투명 + 범례, 다크 기본. 글씨: 제목 serif, 코드 JetBrains Mono, 본문 Inter | [code] `packages/dashboard/src/index.css:7-52`, `components/LayerLegend.tsx:5-13` |
| pr-lens | `12da0b0` | 색: 상태 3색만(수정 앰버), 나머지 중립, 종류는 회색 아이콘. 글씨: 이름 시스템 sans 600, 부제·타입 시스템 mono 9.5px | [code] `packages/renderer/src/theme.ts:52-160`, `src/text.ts:11-14` |
| drawio-skill | `053600a` | 색: 역할별 색(service 파랑, DB 초록 등), 3색 이상이면 범례, 색약 팔레트. 글씨: Helvetica 하나, handdrawn 프리셋 | [doc] `skills/drawio-skill/references/xml-authoring.md:153-181`, `references/style-presets.md:28-49` |
| open-design | `87a4f91c3` | 색: 중립 70~90%, accent 하나(일반 UI 기준). 글씨: 최대 2개, sticky 플로차트는 손글씨체 | [doc] `craft/color.md:17-32`, `craft/typography.md:89-95`, `skills/frame-flowchart-sticky/SKILL.md:43,46` |
| anatomy | `1482e84` | 색: 흑백 위계 + 강조 하나(`lit`), 라이트·다크 토큰. 글씨: mono 하나 | [doc] `SKILL.md:113`, `references/craft.md:25,37-38` |
| system-design-101 | `b28380a` | 색: 규칙 글 없음. 이미지는 영역별 옅은 배경, 종류별 채움, 흐름 강조. 글씨: 둥근 산세리프 | [img] `data/guides/9-essential-components-of-a-production-microservice-application.md` 원격 PNG |
| system-design-primer | `ae9bbd7` | 색: 규칙 없음. 이미지는 종류마다 채움색, 범례 없음. 글씨: 손글씨 느낌 만화체 하나 | [img] `images/jj3A5N8.png`, `images/MzExP06.png` |
| stack-diagram | `1ed53e3` | 색: 중립 + 신호색 하나(주요 경로), 그룹은 옅은 tint, 범례, 다크 함께. 글씨: 이름 Geist sans 600, 역할·라벨 JetBrains Mono | [doc] `skills/stack-diagram/SKILL.md:35-37,54,82`, [code] `assets/template.html:20-33` |
| system-design-academy | `8085013` | 없음(README 색인) | [doc] `README.md` |

## 글씨체의 서로 다른 방식

1. 이름 sans + 코드·타입 mono: stack-diagram, visual-explainer, answer-me-with-html, pr-lens. 제목 serif를 더하는 곳: diagram-design, whiteboard, Understand-Anything.
2. mono 하나: archify, anatomy, excalidraw-diagram-skill.
3. sans 하나: drawio-skill.
4. 손글씨체: system-design-primer, open-design sticky, drawio-skill handdrawn 프리셋.

## 색(전역)의 서로 다른 방식

1. 중립 + 강조 하나: diagram-design, visual-explainer, stack-diagram, anatomy, open-design.
2. 상태색만, 나머지 중립: pr-lens.
3. 종류별 고정 색 + 범례: archify, drawio-skill, Understand-Anything, excalidraw-diagram-skill, system-design-primer.
- 상태색을 다른 색 쓰임과 분리한다: visual-explainer, effective-html, diagram-design.

## Excalidraw 제약

캔버스는 Excalidraw 내장 글씨체만 쓴다. `src/types.ts:328-336`: Virgil(1)·Helvetica(2)·Cascadia(3)는 0.18.1에서 deprecated(`src/types.ts:341-342` 주석), Excalifont(5, 손글씨), Nunito(6, 지금 기본), Lilita One(7, 굵은 제목체), Comic Shanns(8, mono). 이전 세션 그림은 2·3을 썼다.

## 결정

글씨체는 가(이름 Nunito 6 + 코드 Comic Shanns 8)로 정했다. 에이전트 추천에 사용자가 "오케이 추천대로"로 답했다. 캔버스 스냅샷 `session12-fonts`. 색의 그림 종류별 쓰임은 ①에서 정한다.

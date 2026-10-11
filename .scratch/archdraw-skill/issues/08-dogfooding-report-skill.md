# 08: 도그푸딩 이슈 기록 스킬 — `archdraw-report`

**What to build:** 도그푸딩 PC에서 archdraw를 쓰다가 사용자가 `/archdraw-report`(Codex는 `$archdraw-report`)를 부르면, 에이전트가 방금 발화와 나온 그림(`describe_scene`)을 모으고, 불만·원했던 것 중 아직 말하지 않은 것만 묻고, 제목과 본문에서 회사명·클래스명·테이블명을 뺀 뒤 이 레포 GitHub Issues에 `dogfooding` 라벨로 한 건 올리고 URL을 알려준다. 02의 기록 방법(발화 · 나온 그림 · 불만/고친 것 · 원했던 것)을 사람 손 대신 에이전트가 채운다. 판단 규칙은 담지 않는다.

- **개인 스킬이다 — 플러그인에 넣지 않는다.** 도그푸딩은 사용자 혼자 한다. 파일은 레포 `tools/archdraw-report/`(`SKILL.md`, `agents/openai.yaml`)에 둔다. `plugin/` 밖이라 플러그인·npm·`npx skills add` 어디에도 실리지 않는다(ADR-0011). 프로젝트 스킬(`.claude/skills/`)은 쓰지 않는다 — 도그푸딩은 다른 레포에서 하므로 보이지 않는다.
- **설치는 PC마다 한 번, 아래 명령으로 한다.** 실제 파일은 `~/.agents/skills/`(Codex가 읽는다)에 두고, `~/.claude/skills/`에 심링크를 건다. 스킬을 고치면 같은 명령을 다시 실행한다. 명령은 `&&`로 이어져 있어 한 단계가 실패하면 거기서 멈춘다. README에는 넣지 않고 `tools/archdraw-report/` 안에 이 명령을 적은 짧은 안내만 둔다.
  ```
  mkdir -p ~/.agents/skills/archdraw-report/agents ~/.claude/skills \
  && curl -fsSL https://raw.githubusercontent.com/LeeJuOh/excalidraw-architect/main/tools/archdraw-report/SKILL.md -o ~/.agents/skills/archdraw-report/SKILL.md \
  && curl -fsSL https://raw.githubusercontent.com/LeeJuOh/excalidraw-architect/main/tools/archdraw-report/agents/openai.yaml -o ~/.agents/skills/archdraw-report/agents/openai.yaml \
  && ln -sfn ../../.agents/skills/archdraw-report ~/.claude/skills/archdraw-report
  ```
- **수동 호출만 한다.** `SKILL.md`에 `disable-model-invocation: true`, `agents/openai.yaml`에 `policy.allow_implicit_invocation: false`. "이거 이상해"라는 말만으로는 실행되지 않는다 — 그림 수정 요청이 공개 이슈가 되는 것을 막는다.
- **그림은 archdraw MCP 툴 `describe_scene`으로만 읽는다.** 툴이 없거나 호출이 실패하면 `나온 그림` 칸에 `(캔버스 없음)`을 쓰고 나머지는 그대로 진행한다. shim 폴백은 두지 않는다 — 개인 스킬은 archdraw 스킬 폴더 위치를 모르고, ADR-0002가 shim을 두는 이유(`npx skills add` 채널)가 이 스킬에는 없다.
- **본문은 02의 네 칸을 항상 이 순서로 쓴다:** 발화 · 나온 그림 · 불만/고친 것 · 원했던 것. 캔버스가 없어도 네 칸을 모두 쓰고, 원했던 것도 묻는다. 발화는 이름을 뺀 것 외에는 사용자 말 그대로, 사용자가 쓴 언어 그대로 옮긴다(영어로 말했으면 영어로, 번역하지 않는다).
- **제목은 발화 요약 한 줄이다.** 이름 빼기 규칙은 제목에도 적용한다.
- **언어:** 스킬 본문·이슈 제목·이슈 본문은 한국어. 예외는 발화 칸 하나다 — 원래 언어 그대로 둔다. 스킬 본문은 30줄 이하.
- **이슈 대상 레포는 스킬 안에 `LeeJuOh/excalidraw-architect`로 고정한다**(`gh repo set-default`에 의존하지 않는다). `dogfooding` 라벨은 이 레포에 이미 있다(2026-10-12 `gh label list` 확인).
- **`gh`가 실패하면 실패로 끝내지 않는다.** 미설치·미인증·`gh issue create` 실패(권한·네트워크 포함) 모두, 완성된 제목과 본문을 채팅에 내주어 사용자가 붙여넣게 한다. 네트워크 실패는 이슈가 이미 생겼을 수 있으므로, 이때 안내에 "붙여넣기 전에 이 레포의 최근 `dogfooding` 이슈를 확인하라"는 한 줄을 붙인다.

**Blocked by:** None (can start immediately) — `describe_scene`과 `dogfooding` 라벨은 이미 있다.

**Status:** ready-for-human

- [ ] archdraw로 그림을 그린 뒤 `/archdraw-report`를 부르면 발화와 그림 설명이 들어간 이슈가 `dogfooding` 라벨로 생기고 채팅에 URL이 나온다
- [ ] Codex에서 `$archdraw-report`로 같은 결과가 나온다
- [ ] 스킬을 부르지 않고 "이거 이상해"라고만 말하면 스킬이 실행되지 않는다
- [ ] 불만·원했던 것을 둘 다 말하지 않았으면 둘 다 묻고, 하나만 말했으면 나머지 하나만 묻고, 둘 다 말했으면 묻지 않는다
- [ ] 이슈 제목과 본문에 회사명·클래스명·테이블명이 없다. 에이전트가 지우고, 확신이 없는 이름은 올리기 전에 사용자에게 확인한다
- [ ] 캔버스 서버가 없거나 `describe_scene`이 실패해도 이슈가 생기고, `나온 그림` 칸에 `(캔버스 없음)`이 있으며 원했던 것도 채워져 있다
- [ ] `gh` 미설치·미인증·이슈 생성 실패면 실패로 끝내지 않고 완성된 제목·본문을 채팅에 내준다
- [ ] `~/.claude/skills`와 `~/.agents/skills`가 없는 새 PC에서도 위 설치 명령 한 번으로 Claude·Codex 둘 다 스킬이 보인다
- [x] `npm pack --dry-run` 목록에 `tools/`가 없다(`package.json` `files`에 없으므로 그대로면 된다). `plugin/` 아래에도 이 스킬이 없다

## Comments

**2026-10-12 — 검수와 그릴(사용자).** codex verify 1차 FAIL(P1: 캔버스가 없을 때 "원했던 것"을 묻는지 문장끼리 모순). 그릴에서 정한 것: 플러그인 배포에서 빼고 개인 스킬로(사용자 혼자 쓴다), 각 PC에 `curl` 설치 + Claude 심링크, 수동 호출만, `describe_scene`만 쓰고 실패하면 `(캔버스 없음)`, 캔버스가 없어도 원했던 것을 묻는다, 스킬·이슈 모두 한국어, 이름 빼기는 제목까지, `gh` 실패 전부 본문 붙여넣기 폴백. 01 의존은 지웠다. ADR·CONTEXT.md와 충돌 없음(ADR-0002는 배포 채널 밖이라 미적용).

**2026-10-12 — 2차 검수(사용자).** codex verify 2차 FAIL(P1: 설치 명령이 `~/.claude/skills`를 만들지 않음, 발화 "그대로"와 "본문 한국어"가 영어 발화에서 충돌). 고친 것: 설치 명령에 `~/.claude/skills` 생성과 `&&` 연결, 발화는 원래 언어 그대로(사용자 결정 — 번역하지 않는다), 네트워크 실패 안내에 중복 확인 한 줄.

**2026-10-12 — 08a 구현(에이전트).** `tools/archdraw-report/`에 `SKILL.md`(본문 20줄)·`agents/openai.yaml`·`README.md`(설치 명령)를 썼다. 확인한 것: `npm pack --dry-run`에 `tools/` 0건, `plugin/`에 없음, 임시 HOME에서 설치 명령(URL만 `file://`로 바꿈)이 두 경로와 심링크를 만들고 다시 실행해도 된다. 가짜 `gh`로 돌린 스킬 eval 3건은 with 92% / without 36%다. 묻기 분기, 이름 빼기(확신 없는 이름 질문 포함), `(캔버스 없음)`, 인증 실패 폴백이 통과했다. 네트워크 실패 안내 줄은 auto mode가 가짜 `gh` 호출을 막아 미시험. 남은 체크박스는 실제 Claude·Codex 세션과 실제 이슈 생성이 필요하다(08b).

---

## 핸드오프 — 08b 실사용 확인 (2026-10-12)

### Goal

08의 남은 체크박스 8개를 닫는다. 실제 Claude·Codex 세션에서 `archdraw-report`를 불러 실제 이슈를 만들어 본다.

### First Action

사용자에게 push 승인을 받는다. 승인이 나면 `git push`. 설치 명령(`tools/archdraw-report/README.md`)은 `raw.githubusercontent.com/.../main/`에서 받으므로 push 전에는 404가 난다.

### Context

- 08을 08a(혼자 검증 가능)와 08b(실제 공개 이슈 생성과 호스트 세션이 필요)로 나눴다. 08a는 끝났다.
- 08b는 실제 공개 이슈를 만든다. 시험 이슈를 몇 건 올릴지, 끝나고 닫을지는 사용자가 정한다(미결).

### Current Progress (git 기준)

- `a6183a8` — `tools/archdraw-report/SKILL.md`(본문 20줄), `tools/archdraw-report/agents/openai.yaml`, `tools/archdraw-report/README.md`(설치 명령), 이 파일(npm pack 체크박스, Status, Comments).
- push하지 않았다.
- 이 PC에는 아직 설치하지 않았다(`~/.agents/skills`, `~/.claude/skills`에 `archdraw-report` 없음).

### Decisions Made

- 설치 안내 파일 이름은 `README.md`다(티켓은 이름을 정하지 않았다).
- 본문은 `gh issue create ... --body-file -`에 표준 입력으로 넘긴다. 임시 파일 위치를 정하지 않으려는 것이다.
- `allowed-tools`를 두지 않았다. 그래서 `gh` 호출마다 권한 확인이 뜬다. 공개 이슈를 올리기 전 마지막 확인으로 둔다.
- eval 파일은 레포에 넣지 않았다. 위치: `~/.claude/plugins/data/skill-creator-pro-claude-code-zero/archdraw-report-workspace/`(채점 `grade.py`, 결과 `iteration-1/benchmark.md`).

### What Worked

- 가짜 `gh`(인자와 표준 입력을 로그에 남기고 성공·인증 실패·네트워크 실패를 흉내 낸다)와 대화 기록 파일로 서브에이전트 eval을 돌렸다. 스킬 있음 92%, 없음 36%. 묻기 분기, 이름 빼기, `(캔버스 없음)`, 인증 실패 폴백을 확인했다.
- 설치 명령은 URL을 `file://`로 바꿔 임시 HOME에서 돌려 확인했다. 다시 실행해도 된다.

### What Didn't Work

- ⚠️ auto mode가 서브에이전트의 가짜 `gh` 호출을 "외부 쓰기"로 막는 일이 있었다(3건 중 2건). 그래서 네트워크 실패 안내 한 줄은 미시험이다. 권한 설정은 고치지 않았다.

### Next Steps

1. 이 PC에 설치: `tools/archdraw-report/README.md`의 명령을 그대로 실행한다. `ls -la ~/.claude/skills/archdraw-report`로 심링크를 본다.
2. 다른 폴더에서 Claude Code를 켜고 archdraw로 그림을 그린 뒤 `/archdraw-report`를 부른다. 이슈 URL, 네 칸, `dogfooding` 라벨을 본다.
3. 같은 일을 Codex에서 `$archdraw-report`로 한다.
4. 스킬을 부르지 않고 "이거 이상해"라고만 말해 스킬이 돌지 않는지 본다(Claude·Codex 둘 다).
5. archdraw MCP 없이 부른다. `(캔버스 없음)`과 원했던 것 질문이 나오는지 본다.
6. `gh` 실패: `GH_TOKEN=invalid`로 인증 실패를 흉내 낸다(미확인 방법). 네트워크 실패는 오프라인에서 부르고 중복 확인 한 줄이 나오는지 본다.
7. 체크박스를 갱신하고, 다 닫히면 Status를 바꾼다. 시험 이슈 처리는 사용자에게 묻는다.

**2026-10-12 — 08b 시작(에이전트).** `e734c7a`까지 push했다. 이 PC에 README 명령으로 설치했다. 심링크가 있고, 받은 파일은 레포 파일과 같다. 빈 임시 HOME에서도 실제 raw URL로 두 경로와 심링크가 생겼다(스킬이 세션에 보이는지는 미확인). `gh`는 `LeeJuOh`로 로그인되어 있고, `dogfooding` 라벨이 있다. 시험 이슈는 사용자 결정에 따라 정상 경로 1건만 올리고 확인 후 닫는다. 남은 확인은 사용자가 실제 Claude·Codex 세션에서 한다.

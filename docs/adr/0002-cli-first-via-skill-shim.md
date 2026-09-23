# 스킬은 MCP 툴을 우선 부르고, MCP가 없으면 스킬 폴더 shim으로 CLI를 부른다. 서버는 npm에서 받는다

업스트림은 MCP 서버이고 내장 스킬도 MCP → CLI 순으로 부른다. 우리는 2026-09-11에 CLI 기본으로 뒤집었다가 2026-09-20에 되돌렸다. CLI 기본의 근거였던 "Codex가 SKILL.md 안 `${CLAUDE_PLUGIN_ROOT}`를 치환하지 않는다"는 CLI로 부를 때만 생기는 문제이고, MCP 경로는 매니페스트 안에서 치환되므로 애초에 없던 문제였다. MCP 경로는 호스트가 에이전트 세션마다 서버 프로세스 하나를 띄우므로 세션 키를 휴대할 필요가 없고, 스크린샷이 툴 결과 이미지로 바로 온다. CLI를 남기는 이유는 `npx skills add` 채널 하나다 — 스킬 폴더만 복사하고 MCP를 등록하지 않는다. 그래서 스킬은 호스트에 archdraw MCP 툴이 보이면 그것을 부르고, 안 보이면 `skills/archdraw/scripts/archdraw` shim으로 CLI를 부른다. shim 경로는 스킬 루트 기준 상대경로라 Claude와 Codex가 둘 다 모델에게 알려주는 스킬 폴더 위치만으로 동작한다.

shim은 서버를 레포 안 `dist/`가 아니라 npm 게시본에서 받는다(`npx -y excalidraw-architect@<고정 버전>`). `dist/`는 git에 없고, 플러그인 설치는 레포를 복사할 뿐 빌드하지 않아 새 PC에는 실행 파일이 없기 때문이다. npm 패키지에는 `prepublishOnly` 빌드로 서버와 프론트가 들어간다. MCP 매니페스트도 npx를 직접 부르지 않고 같은 shim을 인자 없이 실행한다(command는 셸, args는 호스트 변수로 가리킨 shim 경로 — Claude `${CLAUDE_PLUGIN_ROOT}`, Codex `${PLUGIN_ROOT}`, 매니페스트 args는 두 호스트 모두 치환한다. bin은 인자가 없으면 MCP stdio 모드다). 그래서 개발자는 `ARCHDRAW_BIN`에 로컬 빌드 경로를 넣는 것 하나로 MCP 경로와 CLI 폴백 모두를 게시 없이 확인한다.

## Considered Options

- CLI 기본, MCP 옵션(2026-09-11 결정): `${CLAUDE_PLUGIN_ROOT}` 미치환은 CLI 경로에만 있는 문제라 근거가 되지 않고, 세션 키 휴대·컴팩션 복귀·스크린샷 2단계를 스킬이 떠안는다. 되돌렸다.
- MCP 기본 단독: `npx skills add` 채널이 죽는다. 기각했다.
- MCP 매니페스트가 npx를 직접 호출: `ARCHDRAW_BIN`이 MCP 경로에 안 먹혀 로컬 빌드로 MCP를 확인할 수 없다. 기각했다.
- SKILL.md 안 `node ${CLAUDE_PLUGIN_ROOT}/dist/bin.js`: Codex에서 경로가 치환되지 않아 기각했다.
- shim이 레포 안 `dist/bin.js` 실행 + 빌드 결과 커밋: Codex는 플러그인 설치 때 의존성을 설치한다는 보장이 없어 서버 번들 작업이 추가로 필요하고, 빌드 결과를 CI로 비교하는 장치도 새로 들어서 기각했다.
- 첫 호출 때 shim이 빌드: 실패 지점이 사용자 PC의 네트워크·node 버전·빌드 시간으로 옮겨가서 기각했다.
- 로컬 `dist/`가 있으면 자동 사용: 빌드를 잊으면 옛 서버가 조용히 돌아서 기각하고 명시적 `ARCHDRAW_BIN`을 택했다.
- SessionStart 훅으로 루트 경로 기록: Codex 훅이 Agent Plugins v1 스펙 밖이고 구현이 두 벌 필요해 기각했다.

## Consequences

- 서버 코드 변경을 사용자에게 내보내려면 npm 게시가 필요하다. 2026-09-24부터는 스킬 텍스트만 바꿔도 버전을 올려 게시한다. 플러그인은 버전이 올라야 업데이트되고, 서버와 플러그인이 버전 번호 하나를 쓰기 때문이다(스펙 7-5d).
- 첫 실행은 인터넷이 필요하다. Codex 기본 권한(인터넷 차단·작업 폴더 밖 쓰기 차단)에서 막히는지는 도그푸딩에서 확인한다.
- MCP 프로세스는 호스트가 띄우므로 `ARCHDRAW_BIN`은 호스트(claude/codex)를 시작한 셸에 있어야 MCP 경로에 적용된다.
- 캔버스 세션 붙기 규칙은 경로마다 다르다([ADR-0003](0003-one-canvas-server-per-session.md)).

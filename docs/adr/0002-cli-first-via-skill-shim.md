# 스킬은 MCP가 아니라 CLI를 스킬 폴더 shim으로 부르고, 서버는 npm에서 받는다

업스트림은 MCP 서버지만, 스킬은 `skills/archdraw/scripts/archdraw` shim을 거쳐 CLI를 호출하고 MCP 26툴은 옵션으로만 남긴다. Codex는 SKILL.md 본문의 `${CLAUDE_PLUGIN_ROOT}`·`${PLUGIN_ROOT}`를 치환하지 않는다. 반면 스킬 폴더 경로는 Claude와 Codex가 둘 다 모델에게 알려주므로, 스킬 루트 기준 상대경로 하나로 두 호스트에서 같은 호출 줄을 쓸 수 있다.

shim은 서버를 레포 안 `dist/`가 아니라 npm 게시본에서 받는다(`npx -y excalidraw-architect@<고정 버전>`). `dist/`는 git에 없고, 플러그인 설치는 레포를 복사할 뿐 빌드하지 않아 새 PC에는 실행 파일이 없기 때문이다. npm 패키지에는 `prepublishOnly` 빌드로 서버와 프론트가 들어간다. 업스트림이 이미 이 방식으로 Claude Code·Codex를 지원한다. 그래서 스킬 폴더는 Claude 플러그인·Codex 플러그인·`npx skills` 어느 채널로 받아도 같게 동작한다. 개발자는 `ARCHDRAW_BIN`에 로컬 빌드 경로를 넣어 게시 없이 서버 변경을 확인한다.

## Considered Options

- `node ${CLAUDE_PLUGIN_ROOT}/dist/bin.js`: Codex에서 경로가 치환되지 않아 기각했다.
- shim이 레포 안 `dist/bin.js` 실행 + 빌드 결과 커밋: Codex는 플러그인 설치 때 의존성을 설치한다는 보장이 없어 서버 번들 작업이 추가로 필요하고, 빌드 결과를 CI로 비교하는 장치도 새로 들어서 기각했다.
- 첫 호출 때 shim이 빌드: 실패 지점이 사용자 PC의 네트워크·node 버전·빌드 시간으로 옮겨가서 기각했다.
- 로컬 `dist/`가 있으면 자동 사용: 빌드를 잊으면 옛 서버가 조용히 돌아서 기각하고 명시적 `ARCHDRAW_BIN`을 택했다.
- SessionStart 훅으로 루트 경로 기록: Codex 훅이 Agent Plugins v1 스펙 밖이고 구현이 두 벌 필요해 기각했다.

## Consequences

- 서버 코드 변경을 사용자에게 내보내려면 `npm publish`가 필요하다. 스킬 텍스트만 바꿀 때는 필요 없다.
- 첫 실행은 인터넷이 필요하다. Codex 기본 권한(인터넷 차단·작업 폴더 밖 쓰기 차단)에서 막히는지는 도그푸딩에서 확인한다.

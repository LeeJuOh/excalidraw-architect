# 스킬은 MCP가 아니라 CLI를 스킬 폴더 shim으로 부른다

업스트림은 MCP 서버지만, 스킬은 `skills/archdraw/scripts/archdraw` shim을 거쳐 CLI를 호출하고 MCP 26툴은 옵션으로만 남긴다. Codex는 SKILL.md 본문의 `${CLAUDE_PLUGIN_ROOT}`·`${PLUGIN_ROOT}`를 치환하지 않는다. 반면 스킬 폴더 경로는 Claude와 Codex가 둘 다 모델에게 알려주므로, 스킬 루트 기준 상대경로 하나로 두 호스트에서 같은 호출 줄을 쓸 수 있다.

## Considered Options

- `node ${CLAUDE_PLUGIN_ROOT}/dist/bin.js`: Codex에서 경로가 치환되지 않아 기각했다.
- npm 배포 후 `npx -y`: 사용자가 0명인 단계에선 비용만 들어 보류했다. 나중에 채널을 열 때 호출 줄만 바꾸면 된다.
- SessionStart 훅으로 루트 경로 기록: Codex 훅이 Agent Plugins v1 스펙 밖이고 구현이 두 벌 필요해 기각했다.

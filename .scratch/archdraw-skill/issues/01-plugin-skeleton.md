# 01: 플러그인 골격 — 매니페스트 생성, shim, 최소 SKILL.md

**What to build:** 사용자가 GitHub에서 이 레포를 Claude Code 플러그인으로 설치하고 `/archdraw`를 부르면, 캔버스 서버가 뜨고 브라우저에 캔버스가 열리고 박스 하나가 그려진다. Codex에서도 같은 레포를 플러그인으로 설치하면 같은 스킬이 보인다. 이 티켓은 판단 규칙을 담지 않는다 — 이후 모든 티켓이 올라탈 관통선만 낸다.

- 매니페스트 5개(Claude 플러그인·마켓플레이스·MCP, Codex 플러그인·MCP)는 손으로 쓰지 않고 `package.json`을 단일 소스로 생성 스크립트가 만든다. 생성물은 커밋하고, CI가 "생성물이 최신인가"를 diff로 검사한다. (스펙 §7-5b)
- 스킬은 스킬 폴더 안 shim으로 CLI를 부른다. SKILL.md의 호출 줄은 스킬 루트 기준 상대경로 하나이며 `${CLAUDE_PLUGIN_ROOT}` 같은 호스트 변수를 쓰지 않는다. ([ADR-0002](../../../docs/adr/0002-cli-first-via-skill-shim.md))
- 스킬은 수동 호출(`disable-model-invocation: true`, `/archdraw <발화>`).
- 캔버스 스크린샷 png는 레포가 아니라 데이터 폴더(`$CLAUDE_PLUGIN_DATA`, Codex `$PLUGIN_DATA`, 둘 다 없으면 홈 아래) `tmp/`에 떨어진다. (스펙 §7-5c)
- 업스트림 `excalidraw-skill`은 이 티켓에서 건드리지 않는다. 새 `archdraw` 스킬을 옆에 둔다. 교체는 03.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] `npm run manifests` 한 번으로 매니페스트 5개가 생성되고, 버전은 `package.json` 한 곳만 바꾸면 전부 따라온다
- [ ] CI에서 생성물이 스크립트 출력과 다르면 실패한다
- [ ] Claude Code에서 GitHub 경로로 플러그인 설치 → `/archdraw 박스 하나 그려줘` → 브라우저 캔버스에 박스가 보인다
- [ ] Codex에서 같은 레포를 플러그인으로 설치하면 `archdraw` 스킬이 목록에 보이고, SKILL.md의 호출 줄이 치환 없이 그대로 동작한다
- [ ] `screenshot` 결과 png가 레포 안이 아니라 데이터 폴더 `tmp/`에 생긴다
- [ ] 기존 `npm test`가 그대로 통과한다

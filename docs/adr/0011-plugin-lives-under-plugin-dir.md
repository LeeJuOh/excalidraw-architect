# 플러그인은 레포 루트가 아니라 `plugin/` 하위에 두고, 루트 카탈로그가 그곳을 가리킨다

Claude Code와 Codex는 마켓플레이스 카탈로그의 `source`가 가리키는 폴더를 통째로 복사해 플러그인 루트로 삼고, MCP 서버를 그 루트를 cwd로 띄운다. 처음엔 `source`를 `./`로 두어 레포 루트 = 플러그인 루트였다. 그러면 복사본에 `package.json`이 따라가는데, 그 `name`이 npm 게시 패키지와 같아 shim의 `npx -y excalidraw-architect@<버전>`이 로컬 프로젝트로 해석되고, bin이 링크돼 있지 않아 `sh: excalidraw-architect: command not found`로 서버가 죽었다(2026-09-21 Codex 실측). 그래서 플러그인 파일(`.claude-plugin/plugin.json`·`.mcp.json`·`plugin.json`·`mcp.json`·`skills/`)을 `plugin/`로 옮기고, 루트의 카탈로그 2개가 `./plugin`을 가리키게 했다. 복사본에 `package.json`이 없으니 npx는 항상 게시본을 받는다. 두 호스트 공식 문서 모두 하위 폴더 `source`를 예시로 든다(Claude `./plugins/my-plugin`, Codex `{"source":"local","path":"./plugins/my-plugin"}`). `npx skills add`는 루트 Claude 카탈로그의 `source` 아래 `skills/`를 탐색하므로 영향 없다.

## Considered Options

- shim이 MCP 모드에서 `cd /` 후 npx 실행: 증상은 사라지지만 원인(복사본에 든 `package.json`)이 남고, CLI 모드는 상대경로 인자 때문에 cwd를 못 바꿔 같은 함정이 남는다. 임시로 썼다가 이 결정으로 뺐다.
- shim이 `npx -p <pkg> <bin>` 형태로 실행: npx의 로컬 프로젝트 우선 규칙은 같아 실측으로 같은 실패.
- npm 패키지 이름을 플러그인 이름과 다르게: 정체성이 둘로 갈라지고, 게시 후라 이름 변경 비용이 크다.

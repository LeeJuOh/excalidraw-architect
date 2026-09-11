# 스킬만 얹지 않고 yctimlin 서버째 포크한다

판단 스킬만 만들어 yctimlin `mcp_excalidraw`를 그대로 쓰는 방법도 있었다. 그런데 스냅샷 영속화, 근거 검사, frame 요소, 세션별 캔버스처럼 서버를 고쳐야 하는 일이 생겼고, 사용자가 플러그인 하나만 설치하게 하고 싶었다. 그래서 MIT 레포를 포크해 내장 스킬을 `archdraw`로 교체하고, 서버 코드는 우리가 소유한다.

## Consequences

- 업스트림 변경은 `git remote upstream`에서 직접 머지해야 한다.
- `.gitignore`의 `docs/` 줄처럼 우리가 뺀 설정이 머지 때 되살아날 수 있다.

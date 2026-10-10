# 업스트림 머지 후 정리

`upstream`(yctimlin)을 머지하면 이 포크에서 지운 것이 되살아날 수 있다. 머지 후 아래가 다시 생겼으면 지운다. 괄호는 지운 근거다.

- `.gitignore`의 `docs/` 무시 줄
- `read_diagram_guide` 툴과 `design-guide.ts` (ADR-0006)
- `docker.yml`·`Dockerfile*`·`docker-compose.yml`·`.dockerignore` (PRD 7-5d)
- CLI `start`·`stop`·`status`와 `--url`·`EXPRESS_SERVER_URL`·`EXCALIDRAW_NO_AUTOSTART`·`src/core/pidfile.ts`·`src/core/spawn.ts`·MCP 연결 직후 캔버스 자동 시작·`npm run canvas`·`production` 스크립트·`vite.config.js`의 `server.proxy` (ADR-0003)
- `src/server.ts`의 `cors()` (이슈 11)
- `sanitizeFilePath`·`ALLOWED_EXPORT_DIR`·`EXCALIDRAW_EXPORT_DIR` (ADR-0009)
- `src/server.ts` export 경로의 찍기 전 `initial_elements` 재방송 (ADR-0010)

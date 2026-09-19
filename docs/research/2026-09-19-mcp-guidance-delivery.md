---
topic: MCP 서버가 "잘 쓰는 법" 안내문을 모델에 전달하는 방식 — read_diagram_guide 툴 vs 스킬 단일 소스
date: 2026-09-19
---

# MCP 안내문 전달 방식 조사

## Question

`src/core/design-guide.ts`의 하드코딩 가이드(최소 도형 120px, 간격 40–80px, 화살표 바인딩 규칙)를 `read_diagram_guide` MCP 툴로 돌려주는 현 구조와, `archdraw` 스킬의 `references/canvas-ops.md`가 이미 어긋난다. 선택지:

- (a) 툴 유지. 서버가 시작 시 스킬의 `canvas-ops.md`를 읽어 반환/첨부 (jgraph/drawio-mcp가 `shared/xml-reference.md`를 툴 description에 붙이는 방식).
- (b) 툴 삭제. 스킬 파일만 소스. MCP만 등록한 사용자는 규칙 없이 씀.

MCP 스펙·Anthropic 문서·실제 서버 소스에서 근거를 찾아 (b)가 "best practice"로 방어 가능한지, MCP 전용 사용자가 잃는 것이 무엇인지, 싼 중간안이 있는지 답한다.

## TL;DR

- MCP 스펙은 "서버 사용법" 안내문 자리를 명시적으로 둔다: initialize 결과의 `instructions` ("Instructions describing how to use the server and its features… MAY be added to the system prompt"). 툴 description은 "그 툴 하나"의 힌트, prompts는 사용자가 골라 쓰는 템플릿, resources는 앱이 붙이는 컨텍스트 데이터다. "가이드를 돌려주는 툴"은 스펙의 어떤 프리미티브 의도와도 맞지 않는다.
- 실제 서버는 두 갈래다. 공식 reference 서버(filesystem/memory)는 스타일 가이드를 아예 안 싣고 README에 "복붙하라"고 둔다. 가이드를 싣는 서버(everything, GitHub MCP)는 **`instructions` 필드**를 쓰며, everything 서버는 우리 (a)안처럼 `docs/instructions.md`를 시작 시 `readFileSync`로 읽는다. drawio-mcp만 툴 description에 34KB md를 통째로 붙이는데, Claude Code는 툴 description·server instructions를 각 2KB에서 자른다 — 그 패턴은 Claude Code에서 그대로 안 통한다.
- 서버가 **호스트 스킬 디렉터리의 파일을 읽는** 문서화된 사례는 없다(미확인이 아니라 조사 범위에서 0건). 관찰된 방향은 항상 "서버 패키지 안의 md → 서버도 읽고 스킬도 URL/경로로 참조". 따라서 (b)는 방어 가능하되, 가장 싼 중간안은 **가이드 md를 서버 패키지 자산으로 두고 서버는 `instructions`(2KB 이하 요약)+`resources`로 노출, 스킬은 같은 파일을 참조**하는 것이다.

## Findings

### 1. MCP 스펙이 제공하는 안내문 전달 채널 4종과 각각의 의도

출처: MCP 스펙 2025-06-18 (현재 Claude Code가 쓰는 legacy 세대. 2026-07-28 "modern" 개정판은 initialize 핸드셰이크를 없애고 `server/discover`로 옮겼지만 필드 의미는 같다).

**(1) 서버 `instructions` — initialize 결과 필드. "서버 전체 사용법" 전용.**

- 스펙 lifecycle 페이지 예시 JSON: `"instructions": "Optional instructions for the client"` — https://modelcontextprotocol.io/specification/2025-06-18/basic/lifecycle
- 스키마 doc comment (`InitializeResult.instructions`): "Instructions describing how to use the server and its features. This can be used by clients to improve the LLM's understanding of available tools, resources, etc. It can be thought of like a "hint" to the model. For example, this information MAY be added to the system prompt." — https://raw.githubusercontent.com/modelcontextprotocol/modelcontextprotocol/main/schema/2025-06-18/schema.ts
- 2026-07-28 개정판 `DiscoverResult.instructions`: "Optional natural-language guidance for LLMs on how to use this server effectively" — https://modelcontextprotocol.io/specification/2026-07-28/server/discover

**(2) 툴 `description` — 툴 하나에 대한 힌트.**

- 스펙: "`description`: Human-readable description of functionality" — https://modelcontextprotocol.io/specification/2025-06-18/server/tools
- 스키마 doc comment (`Tool.description`): "A human-readable description of the tool. This can be used by clients to improve the LLM's understanding of available tools. It can be thought of like a "hint" to the model." — 위 schema.ts
- 툴은 "model-controlled": "Tools in MCP are designed to be **model-controlled**, meaning that the language model can discover and invoke tools automatically" — tools 페이지. 즉 툴은 "모델이 행동하려고 호출하는 것"이지 "읽을 문서"가 아니다.

**(3) Prompts — 사용자가 고르는 템플릿(슬래시 커맨드).**

- "Prompts allow servers to provide structured messages and instructions for interacting with language models." / "Prompts are designed to be **user-controlled**, meaning they are exposed from servers to clients with the intention of the user being able to explicitly select them for use." / "For example, as slash commands" — https://modelcontextprotocol.io/specification/2025-06-18/server/prompts
- 임베디드 리소스로 "documentation, code samples, or other reference materials"를 프롬프트에 넣을 수 있다고 명시: "Embedded resources enable prompts to seamlessly incorporate server-managed content like documentation, code samples, or other reference materials directly into the conversation flow." (같은 페이지)
- 비스펙 개념 문서: "Prompts provide reusable templates. They allow MCP server authors to provide parameterized prompts for a domain, or **showcase how to best use the MCP server**." — https://modelcontextprotocol.io/docs/learn/server-concepts

**(4) Resources — 앱이 붙이는 컨텍스트 데이터.**

- "Resources allow servers to share data that provides context to language models, such as files, database schemas, or application-specific information." / "Resources in MCP are designed to be **application-driven**, with host applications determining how to incorporate context based on their needs." 앱은 "Implement automatic context inclusion, based on heuristics or the AI model's selection"도 가능 — https://modelcontextprotocol.io/specification/2025-06-18/server/resources
- 개념 문서 표: Resources = "Passive data sources that provide read-only access to information for context, such as file contents, database schemas, or **API documentation**." 제어 주체 "Application" — server-concepts 페이지

**제어 계층 요약 (스펙 원문 표)** — https://modelcontextprotocol.io/specification/2025-06-18/server

| Primitive | Control | Description |
|---|---|---|
| Prompts | User-controlled | Interactive templates invoked by user choice |
| Resources | Application-controlled | Contextual data attached and managed by the client |
| Tools | Model-controlled | Functions exposed to the LLM to take actions |

**함의**: "가이드 텍스트를 반환하는 툴"은 스펙의 프리미티브 설계와 어긋난다. 서버 전체 규칙이면 `instructions`, 참고 문서면 `resources`, 사용자가 명시적으로 부르는 워크플로면 `prompts`가 스펙이 마련한 자리다. (툴로 문서를 주는 것이 금지는 아니다 — "the protocol itself does not mandate any specific user interaction model".)

### 2. Anthropic 가이드 — 툴 description과 Skills vs MCP

**툴 description 길이·내용** — https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools ("Best practices for tool definitions")

- "**Provide extremely detailed descriptions.** This is by far the most important factor in tool performance." 포함 항목: "What the tool does / When it should be used (and when it shouldn't) / What each parameter means and how it affects the tool's behavior / Any important caveats or limitations". "Aim for at least 3–4 sentences for each tool description, more if the tool is complex."
- "**Consolidate related operations into fewer tools.**" / "**Design tool responses to return only high-signal information.** … Bloated responses waste context".
- 상한은 API 문서에 없다. 그러나 **Claude Code는 상한을 둔다**: "Claude Code truncates tool descriptions and server instructions at 2KB each. Keep them concise to avoid truncation, and put critical details near the start." — https://code.claude.com/docs/en/mcp#for-mcp-server-authors
- 엔지니어링 블로그: "When writing tool descriptions and specs, think of how you would describe your tool to a new hire on your team." / "Tool implementations should take care to return only high signal information back to agents." — https://www.anthropic.com/engineering/writing-tools-for-agents

**Claude Code에서의 server `instructions` 위치** — https://code.claude.com/docs/en/mcp#scale-with-mcp-tool-search

- "Only tool names and server instructions load at session start, so adding more MCP servers has minimal impact on your context window."
- "If you're building an MCP server, the server instructions field becomes more useful with tool search enabled. Server instructions help Claude understand when to search for your tools, **similar to how skills work**." 넣을 것: "What category of tasks your tools handle / When Claude should search for your tools / Key capabilities your server provides".
- 툴 search 기본값: `ENABLE_TOOL_SEARCH` unset = "All MCP tools deferred and loaded on demand"; `auto` = 툴 정의 합이 컨텍스트의 10% 미만이면 선로드. 즉 기본 설정에서 **툴 description은 세션 시작 시 모델에 보이지 않는다**(툴 이름과 instructions만 보임). 툴 description에 가이드를 붙이는 (a)-drawio 방식은 Claude Code 기본값에서 "검색해서 찾은 뒤"에야 보이고, 그마저 2KB에서 잘린다.
- 관찰 (이 세션의 Claude Code 시스템 프롬프트): 연결된 서버의 instructions가 "# MCP Server Instructions — The following MCP servers have provided instructions for how to use their tools and resources" 블록으로 시스템 프롬프트에 그대로 삽입된다. 문서에 명문화된 문장은 아니므로 **관찰 사실**로 표기.

**Claude Code에서의 resources / prompts** — https://code.claude.com/docs/en/mcp

- Resources: "Use the format `@server:protocol://resource/path` to reference a resource" / "Resources are automatically fetched and included as attachments when referenced" / "Claude Code automatically provides tools to list and read MCP resources when servers support them".
- Prompts: "Claude Code lists each MCP prompt as `/servername:promptname (MCP)`. Typing `/mcp__servername__promptname` also runs it."
- 참고: Messages API의 MCP connector는 "only tool calls are currently supported" — https://platform.claude.com/docs/en/agents-and-tools/mcp-connector#limitations. 호스트마다 prompts/resources 지원이 다르다.

**Skills가 담는 것** — https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview

- "Skills are reusable, filesystem-based resources that give Claude domain-specific expertise: workflows, context, and best practices that turn a general-purpose agent into a specialist."
- "The main body of SKILL.md contains procedural knowledge: workflows, best practices, and guidance". Level 3 "**Resources:** Reference materials such as database schemas, API documentation, templates, or examples" — "Claude accesses these files only when referenced."
- 진행형 공개: "Level 1: Metadata … Always (at startup) … ~100 tokens per Skill / Level 2: Instructions … When Skill is triggered … Under 5k tokens / Level 3+: Resources … As needed … None until accessed".
- Best practices: "Keep SKILL.md body under 500 lines" / "Keep references one level deep from SKILL.md" / 스킬에서 MCP 툴 참조 시 "always use fully qualified tool names … Format: `ServerName:tool_name`" — https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
- "Skills vs MCP를 한 문장으로 가른" 공식 문장은 **없다**. 엔지니어링 블로그는 "how Skills can complement Model Context Protocol (MCP) servers by teaching agents more complex workflows that involve external tools and software"까지만 말한다 — https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills. Claude Code skills 문서(https://code.claude.com/docs/en/skills)는 MCP를 직접 비교하지 않는다(미확인: 향후 개정판).
- 플러그인은 스킬과 MCP 서버를 한 패키지에 담는다: 플러그인 루트의 `skills/` ("Skills as `<name>/SKILL.md` directories")와 `.mcp.json` ("MCP server configurations") — https://code.claude.com/docs/en/plugins#plugin-structure-overview. 즉 Anthropic 공식 배포 단위는 "스킬+서버 묶음"이고, 서버 단독 설치는 그 하위 케이스다.

### 3. 유명 MCP 서버들의 실제 안내문 전달 방식

| 서버 | 방식 | 근거 |
|---|---|---|
| **jgraph/drawio-mcp** (tool server) | `shared/xml-reference.md`(34,555 B, 488줄)를 시작 시 `readFileSync`로 읽어 `open_drawio_xml` 툴 **description에 문자열 결합**. `mermaid-reference.md`(14,092 B)도 동일. `instructions` 필드는 **안 씀** (`new Server({name, version}, {capabilities:{tools:{}}})`). | `references/drawio-mcp/mcp-tool-server/src/index.js` L59–77 ("Read the shared XML reference once at startup (single source of truth). In the repo: read from shared/. When installed via npm: read from the local copy created by the prepack script."), L365–373 (`description: "Opens the draw.io editor…" + xmlReference`), L614–625 서버 생성. `package.json` L11 `copy-shared`가 `../shared/*.md`를 `src/`로 복사, `prestart`/`prepack`에서 실행. |
| drawio-mcp (app server) | README 표: "Reads the file at startup / build time and includes it in the tool description" | `references/drawio-mcp/README.md` L174–189 |
| drawio-mcp 플러그인/스킬 | SKILL.md가 같은 파일을 **GitHub raw URL로 참조**: "fetch and follow the instructions at: https://raw.githubusercontent.com/jgraph/drawio-mcp/main/shared/xml-reference.md". 플러그인은 `.mcp.json` 없이 스킬만 ("No MCP required"). | `references/drawio-mcp/plugins/claude-code/skills/drawio/SKILL.md` L370–371; `plugins/README.md` L55 ("The single source of truth … lives at `../shared/xml-reference.md` — every plugin references that file rather than duplicating its contents."); `CLAUDE.md` L16, L132–139 |
| **modelcontextprotocol/servers – filesystem** | `new McpServer({name:"secure-filesystem-server", version:"0.2.0"})` — `instructions` 없음, prompts/resources 없음. 툴 description은 1–4문장. 스타일 가이드 없음. | https://raw.githubusercontent.com/modelcontextprotocol/servers/main/src/filesystem/index.ts |
| servers – memory | `new McpServer({name:"memory-server", version})` — `instructions` 없음. 사용 지침은 README에 "Here is an example prompt for chat personalization. You could use this prompt in the 'Custom Instructions' field of a Claude.ai Project." 로 **사용자 복붙용**으로 둠. | https://raw.githubusercontent.com/modelcontextprotocol/servers/main/src/memory/index.ts, …/src/memory/README.md |
| **servers – everything (공식 reference)** | `docs/instructions.md`를 시작 시 `readFileSync(join(__dirname,"..","docs","instructions.md"))`로 읽어 `new McpServer({...},{capabilities, instructions})`에 전달. 문서 첫 줄: "Audience: These instructions are written for an LLM or autonomous agent integrating with the Everything MCP Server." 섹션: Cross-Feature Relationships / Constraints & Limitations / Operational Patterns. `docs/structure.md`: "Human‑readable instructions intended to be passed to the client/LLM as guidance on server use. Loaded by the server at startup and returned in the initialize exchange." | https://raw.githubusercontent.com/modelcontextprotocol/servers/main/src/everything/server/index.ts, …/resources/index.ts, …/docs/instructions.md, `gh search code "instructions" --repo modelcontextprotocol/servers` |
| **github/github-mcp-server** | `pkg/inventory/instructions.go` `generateInstructions()`가 활성 toolset별로 instructions 생성 → `ServerOptions.Instructions`. 내용 예: "Use 'list_*' tools for broad, simple retrieval and pagination of all items of a type", "Use pagination whenever possible with batches of 5-10 items." 공식 changelog: "Server instructions are a feature of the Model Context Protocol specification which acts like a system prompt that guides the model in effectively using an MCP server." "especially useful for things like respecting tool interdependence … following multitool workflows … giving general guidance for commonalities that underlie most tools." | https://raw.githubusercontent.com/github/github-mcp-server/main/pkg/inventory/instructions.go, https://raw.githubusercontent.com/github/github-mcp-server/main/pkg/github/server.go (`Instructions: inv.Instructions()`), https://github.blog/changelog/2025-10-29-github-mcp-server-now-comes-with-server-instructions-better-tools-and-more/ |
| MCP TypeScript SDK 예제 | `instructions: 'Call list-trips before book-trip. Dates are ISO 8601.'` — 툴 간 순서·포맷 규칙을 instructions에 두는 것이 SDK 공식 예제. CLI 호스트 예제는 `BASE_SYSTEM_PROMPT + "\n\n" + instructions`로 시스템 프롬프트에 합침. | `gh search code "instructions" --repo modelcontextprotocol/typescript-sdk` → `examples/guides/clients/connect.examples.ts`, `examples/cli-client/host/loop.ts` |
| microsoft/playwright-mcp | `instructions` 사용 흔적 없음 (gh code search 0건; 미확인 — 코드가 microsoft/playwright 모노레포로 이동). | `gh search code` |
| **yctimlin 업스트림 (우리 포크 원본)** | `read_diagram_guide` 툴(4,532 B)로 반환 + 스킬 cheatsheet에 "quick version" 요약 복제 + SKILL.md에 "MCP mode: call `read_diagram_guide` for colors/sizing; the same guidance lives in `references/cheatsheet.md`". 즉 업스트림부터 **툴·스킬 이중 소스**였고, 그 결과가 지금의 불일치(design-guide.ts L43 "40–80px gap" vs SKILL.md L62–63 "Vertical … 80–120px / Horizontal … 40–60px"). | `src/core/design-guide.ts`, `src/core/mcp-tools.ts` L428, `src/core/mcp-dispatch.ts` L646, `skills/excalidraw-skill/SKILL.md` L61–63, L144; `references/mcp-excalidraw-yctimlin/skills/excalidraw-skill/references/cheatsheet.md` L186–192 |

**공통 패턴**: "서버가 자기 패키지 안의 md를 시작 시 읽어 프로토콜 필드에 싣는다"는 세 사례(drawio, everything, github) 모두 같다. 갈리는 건 **어느 필드냐** — drawio만 툴 description, 나머지는 `instructions`. "가이드 반환 전용 툴"은 조사 범위에서 yctimlin 외 사례 없음.

### 4. 서버가 호스트 스킬 디렉터리 파일을 읽는 사례 — 없음. 방향은 항상 "서버 소유 md ← 스킬이 참조"

- drawio-mcp: 소스는 **서버 레포의 `shared/`**. 서버는 파일 경로로, 스킬은 GitHub raw URL로 각각 가져간다. 스킬이 서버 파일에 의존하지, 서버가 스킬에 의존하지 않는다. npm 배포본은 `prepack`으로 `src/`에 복사해 서버 패키지 안에 자기 사본을 갖는다 (`package.json` L11–14).
- everything 서버: `docs/instructions.md`는 서버 패키지 소유.
- github-mcp-server: Go 코드 내 문자열.
- Anthropic Skills 문서는 반대 방향만 말한다: 스킬이 MCP 툴을 부를 때 "Use the BigQuery:bigquery_schema tool" 식으로 **스킬 → 서버** 참조 (best-practices "MCP tool references").
- 서버가 `~/.claude/skills/...` 또는 플러그인 캐시 경로를 읽는 문서화된 사례: **0건** (MCP 스펙, Anthropic 문서, 위 서버들). 기술적으로도 서버는 stdio 자식 프로세스라 스킬 설치 위치(플러그인 캐시, `--plugin-dir`, `~/.claude/skills`)를 알 방법이 스펙에 없다. MCP `roots`는 클라이언트가 주는 워크스페이스 루트이지 스킬 경로가 아니다.
- 따라서 (a)를 "서버가 스킬 디렉터리의 canvas-ops.md를 읽는다"로 구현하면 선례 없는 방향이며, 서버 단독 설치(npx)에서는 파일이 없어 깨진다. drawio가 답으로 택한 것은 **파일을 서버 패키지에 두고 스킬이 그것을 가리키는** 구조다.

### 5. (b)는 방어 가능한가, MCP 전용 사용자가 잃는 것, 싼 중간안

**(b) 방어 가능성**: 가능하다. 근거 — 공식 reference 서버(filesystem/memory)는 스타일 가이드를 싣지 않고, memory는 README 복붙으로 넘긴다; Anthropic 플러그인 모델은 스킬+서버 묶음 배포가 기본이라 "MCP만 등록"은 지원하되 1급 경로가 아니다; 툴로 문서를 주는 건 스펙 프리미티브 의도와 어긋난다. 단 "best practice"라고 부르기엔 약하다 — 가이드를 **싣는** 서버들이 택한 자리(`instructions`)가 스펙에 있고 Claude Code가 그걸 "similar to how skills work"라며 명시 권장하기 때문이다.

**MCP 전용 사용자가 잃는 것** (구체적으로):
- 색 팔레트(8 stroke/8 fill hex), 크기 규칙(≥120×60, 폰트 ≥16), 간격(40–80px), 화살표 바인딩(`startElementId`/`endElementId`), 그리기 순서 — `design-guide.ts` 전체 4.5KB.
- 그 중 **툴 파라미터 사용법에 해당하는 것**(바인딩 ID 사용, `fillStyle: "solid"`, `strokeStyle` 값)은 스펙 정의상 툴 description에 있어야 할 내용이다. 이건 스킬 유무와 무관하게 서버가 책임져야 한다. 스타일 취향(색·간격·템플릿)은 스킬 몫으로 넘겨도 된다.
- 업스트림 README가 `read_diagram_guide`를 툴 표에 광고하므로(`references/mcp-excalidraw-yctimlin/README.md` L435) 삭제 시 업스트림 사용자 기대와 어긋난다 — 포크 README에 명시 필요.

**싼 중간안 (권장 순)**:
1. **가이드 md를 서버 패키지 자산으로** (예: `src/core/canvas-ops.md` 또는 `shared/canvas-ops.md`, drawio의 `shared/` 방식). 서버는 시작 시 읽고, 스킬 `references/canvas-ops.md`는 **같은 파일**(심링크·빌드 복사·raw URL 중 택1). drawio 검증된 패턴이고 스펙상 서버→스킬 의존이 없다. 불일치의 근본 원인(두 사본)을 없앤다.
2. 서버 노출 채널은 **툴이 아니라** `instructions` + `resources`:
   - `instructions`: 2KB 이하 요약(바인딩 필수, 최소 크기, 간격, `fillStyle: "solid"`, "전체 가이드는 resource `guide://canvas-ops` 참조"). Claude Code가 세션 시작 시 시스템 프롬프트에 넣어주므로 MCP 전용 사용자도 **툴 호출 없이** 핵심 규칙을 받는다. 2KB 절단(https://code.claude.com/docs/en/mcp#for-mcp-server-authors) 때문에 전문은 넣지 말 것.
   - `resources`: 전문 md를 `resources/list`·`resources/read`로 노출. Claude Code는 "automatically provides tools to list and read MCP resources when servers support them" 하므로 모델이 필요할 때 읽는다. 스펙상 "API documentation"이 정확히 resource의 예시다.
   - `read_diagram_guide` 툴은 삭제(또는 한 릴리스 deprecated 유지). 툴 description의 파라미터 설명(`startElementId` 등)은 각 툴에 남긴다 — API 문서의 "3–4 sentences, what/when/params/caveats" 기준.
3. (a)를 drawio 그대로(툴 description에 전문 결합)로 하는 것은 **비권장**: Claude Code 2KB 절단 + 툴 search 기본값에서 description은 검색 후에만 보임.
4. (a)를 "서버가 스킬 디렉터리 읽기"로 하는 것은 **비권장**: 선례 0, 경로 해석 불가, 서버 단독 설치에서 깨짐.

## 우리 결정에 대한 함의

- 불일치의 원인은 "툴 vs 스킬"이 아니라 **사본이 둘**인 것. 업스트림부터 그랬다. 어느 안을 택하든 파일을 하나로 만드는 게 먼저다.
- 파일 소유자는 **서버 패키지**여야 한다(drawio 선례, 스펙에 서버→스킬 경로 없음). 스킬은 그 파일을 가리킨다. 스펙 7-4의 "`references/canvas-ops.md`로 이동"은 "스킬 디렉터리에 원본을 둔다"가 아니라 "스킬이 참조하는 경로"로 읽으면 충돌 없다.
- 순수 (b)는 방어 가능하지만 얻는 게 코드 삭제뿐이고, 툴 파라미터 규약까지 잃는다. `instructions`(요약)+`resources`(전문)로 옮기면 코드는 비슷하게 작고, MCP 전용 사용자도 규칙을 받으며, 스펙·Claude Code 문서가 권장하는 자리에 놓인다.
- `instructions`에 넣을 것은 Claude Code 문서 기준 세 가지: 작업 범주("Excalidraw 캔버스 조작"), 언제 우리 툴을 찾을지, 핵심 규약(바인딩·크기·간격). 2KB 상한을 넘기지 말고 중요한 것을 앞에 둔다.
- Codex 등 다른 호스트가 `instructions`/`resources`를 어떻게 다루는지는 **미확인**. Claude Code 외 호스트 지원이 요구사항이면 별도 확인 필요.
- 미확인 항목: playwright-mcp의 instructions 사용 여부(코드 이동), Claude Code가 instructions를 시스템 프롬프트에 삽입한다는 **문서** 문장(이 세션 관찰로만 확인), Codex 호스트 동작.

## 추가 확인 — Codex 호스트 (2026-09-19, 본 세션 직접 확인)

- **`instructions` 지원 확인.** Codex 공식 MCP 문서(https://learn.chatgpt.com/docs/extend/mcp?surface=cli, `developers.openai.com/codex/mcp`에서 리다이렉트): "Codex reads the MCP `instructions` field returned during initialization and uses it as server-wide guidance alongside the server's tools." 권장: "Keep the first 512 characters self-contained so the most important guidance is available when Codex is deciding how to use the server." 시스템 프롬프트 삽입 여부는 문서에 없음(미확인 — 01 실측). 이슈 #6148(시스템 프롬프트 추가 요청)은 not planned로 닫혔으나 문서가 더 최신.
- **`resources` 지원 확인.** openai/codex PR #5239 "[MCP] Add support for resources" 머지(2025-10-17). 모델에 `list_resources`·`list_resource_templates`·`read_resource` 툴로 노출. 이슈 #4956 닫힘. 부작용 보고: 이슈 #8565(open, 2025-12-27) — 서버가 `resources/list`를 안 주면 Codex가 "No Resources"로 혼동. 우리는 리소스를 제공하므로 해당 없음.
- **함의:** `instructions` 요약은 앞 512자에 핵심 규칙(바인딩·최소 크기·간격), 2KB 이내 전체 요약, 끝에 "전문은 `guide://canvas` 리소스" 순으로 작성하면 Claude Code(2KB 절단)·Codex(512자 권장) 둘 다 커버. 미확인 잔여: Codex가 `instructions`를 실제로 시스템 프롬프트에 넣는지.

# archdraw-report

도그푸딩용 개인 스킬이다. 플러그인에 들어가지 않는다. PC마다 한 번 아래 명령으로 설치하고, 스킬을 고치면 다시 실행한다.

```
mkdir -p ~/.agents/skills/archdraw-report/agents ~/.claude/skills \
&& curl -fsSL https://raw.githubusercontent.com/LeeJuOh/excalidraw-architect/main/tools/archdraw-report/SKILL.md -o ~/.agents/skills/archdraw-report/SKILL.md \
&& curl -fsSL https://raw.githubusercontent.com/LeeJuOh/excalidraw-architect/main/tools/archdraw-report/agents/openai.yaml -o ~/.agents/skills/archdraw-report/agents/openai.yaml \
&& ln -sfn ../../.agents/skills/archdraw-report ~/.claude/skills/archdraw-report
```

호출: Claude Code `/archdraw-report`, Codex `$archdraw-report`.

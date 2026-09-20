# R11 — 호스트별 수동 호출 계약 조사

조사일: 2026-09-14. 설계 결정 전 참고 메모. 공식 문서를 검색한 뒤 본문을 열어 확인했다. 기존 Codex skills URL은 현재 ChatGPT Learn으로 이동한다.

## 확인된 사실

| 항목 | 공식 계약 | 출처 |
|---|---|---|
| Claude 수동 전용 | `SKILL.md` frontmatter의 `disable-model-invocation: true`. 사용자는 호출할 수 있고 모델 자동 호출은 차단된다. `user-invocable: false`는 이 목적의 설정이 아니다. | [Claude Skills: invocation](https://code.claude.com/docs/en/skills#control-who-invokes-a-skill) |
| Codex 수동 전용 | 스킬 폴더의 `agents/openai.yaml`에 `policy.allow_implicit_invocation: false`. 기본값은 true이며 false여도 명시적 `$skill`은 동작한다. | [OpenAI Build skills: optional metadata](https://learn.chatgpt.com/docs/build-skills#optional-metadata) |
| Codex 명시 호출 | CLI/IDE는 `/skills` 선택 또는 `$`로 스킬 언급. 문서 예시는 `$skill-creator`. ChatGPT의 `@` 표기와 구분한다. | [OpenAI Build skills](https://learn.chatgpt.com/docs/build-skills#how-chatgpt-and-codex-use-skills) |
| Claude 플러그인 호출 | 정식 표기는 `/plugin-name:skill-name`. 현재 문서상 이름 충돌 없으면 bare `/skill-name`도 된다. frontmatter `name`은 마지막 구간을 정한다. | [Claude Skills: command name](https://code.claude.com/docs/en/skills#how-a-skill-gets-its-command-name) |
| 공통 폴더 | 두 호스트 모두 `skills/<skill>/SKILL.md`를 플러그인 스킬로 사용한다. OpenAI는 `agents/openai.yaml`을 선택적 메타 파일로 명시한다. | [Claude plugins](https://code.claude.com/docs/en/plugins), [OpenAI Build skills](https://learn.chatgpt.com/docs/build-skills) |
| portable 매니페스트 | OpenAI의 현재 신규 패키지 형식은 루트 `plugin.json`, 스킬은 루트 `skills/`, 서버 설정은 `mcp.json`. `.codex-plugin/plugin.json`은 호환용이다. 플러그인 이름은 component namespace에도 쓰인다. | [OpenAI Package your plugin](https://developers.openai.com/plugins/build/plugins) |

권장 후보 파일 모양(아직 채택 결정 아님):

```text
skills/archdraw/
  SKILL.md            # 공통 본문 + Claude frontmatter
  agents/openai.yaml  # Codex 호출 정책
```

```yaml
# SKILL.md frontmatter 후보
name: archdraw
description: ...
disable-model-invocation: true
```

```yaml
# agents/openai.yaml 후보
policy:
  allow_implicit_invocation: false
```

## 후속 턴의 한계

- **사실:** Claude는 로드한 스킬 내용을 이후 턴에도 대화에 유지한다. 다음 턴에 파일을 다시 읽지는 않는다. 압축 때 재첨부는 스킬당 처음 5,000 토큰, 전체 25,000 토큰 범위이며 오래된 스킬은 탈락할 수 있다. 스킬의 `allowed-tools` 권한은 다음 사용자 메시지에서 해제된다. [Claude content lifecycle](https://code.claude.com/docs/en/skills#skill-content-lifecycle)
- **미확인:** 확인한 OpenAI 문서는 명시/암묵 호출과 로딩은 설명하지만, 최초 호출 후 모든 후속 턴에 스킬을 지속 적용한다는 보장은 제공하지 않는다. [OpenAI Build skills](https://learn.chatgpt.com/docs/build-skills)
- **추론:** 수동 전용 메타는 최초 진입 정책이고, “같은 그림 수정은 이어서 처리”의 작업 범위는 공통 본문에서 별도로 정해야 한다. 이를 무기한 호스트 보장이라고 적으면 안 된다. 후속 턴과 압축 후 재개는 각각 실제 검증 대상이다.

## 미확인 사항과 검증 제안

1. **공통 파일 호환성:** 위 두 메타를 한 폴더에 동시 배포하는 설계는 문서 구조에 부합하는 후보지만, Codex가 Claude 확장 frontmatter를 수용한다는 명시적 보장은 확인하지 못했다. Claude 문서는 일부 다른 배포 경로(claude.ai 업로드 등)가 확장 frontmatter를 거부한다고 설명한다. 이 경고를 Codex의 거부로 일반화할 수 없다. 실제 대상 호스트에서 로딩 확인이 필요하다. [Claude frontmatter portability](https://code.claude.com/docs/en/skills#using-skill-frontmatter-outside-claude-code)
2. **Codex 플러그인 호출의 정확한 namespace 문자열:** _(2026-09-20 해소: 문서는 `$<skill-name>`만 제공하고 플러그인 접두 형식은 없음. openai/codex#39166에서 플러그인 스킬을 `$<skill-name>`으로 CLI 호출 확인, ChatGPT 데스크톱은 `@플러그인명` 선택. 이슈 01·스펙 반영.)_ 공식 문서는 namespace 사용과 `$skill`을 각각 설명하지만, 확인한 페이지에서 `$plugin:skill`의 정확한 호출 예시는 찾지 못했다. 설치 후 `/skills`에 노출되는 식별자를 선택해 확인하고 사용 예시에 기록할 것. `$archdraw`를 모든 설치 채널의 보장된 문자열로 단정하지 않는다. [OpenAI packaging](https://developers.openai.com/plugins/build/plugins), [OpenAI skills](https://learn.chatgpt.com/docs/build-skills)
3. **검증 제안(설계 미확정):** 설치 채널×호스트마다 새 대화의 일반 설명 요청에서 미실행 → 표시된 명시 호출로 실행 → 같은 그림 수정 후속 턴 → 관련 없는 새 요청에서 새 다이어그램 작업 미시작을 확인한다. 압축 후 재개는 별도 관찰로 기록한다. 실제 설치/실행은 이 조사에서 하지 않았다.

## 로컬 확인 범위

`review.md` R11과 `issues/01-plugin-skeleton.md`의 관련 줄만 확인했다. 01은 세 설치 채널이 같은 스킬 폴더를 받는다고 명시하며 Codex 호출 표기는 아직 구체화하지 않았다. 루트/호스트 매니페스트 실물은 아직 없다. PRD나 ADR, 이슈 파일은 수정하지 않았다.

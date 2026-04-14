# Project: 행운번호 추첨기 (Lucky Number Lottery)

- **Stack**: React 19, React Router 7, TypeScript, Tailwind CSS v4, Vite, Cloudflare Workers
- **Testing**: Vitest + React Testing Library (227 tests)
- **UI**: shadcn/ui (Radix UI), Korean-language interface
- **Architecture**: Client-side only, no server DB, no auth

---

## Global Flags

**These flags apply to ALL commands and messages.** When any user message, slash command, or command arguments contain the flags below, activate the corresponding behaviors immediately. This applies universally — not limited to any specific skill or command prefix.

### Analysis Depth Flags

| Flag | Activates | Behavior |
|------|-----------|----------|
| `--think` | Sequential Thinking MCP | Structured analysis (~4K tokens). Decompose into steps, test hypotheses systematically. Use for multi-component problems with 2-3 interconnected parts. |
| `--think-hard` | Sequential Thinking + Context7 MCP | Deep analysis (~10K tokens). Cross-domain investigation, architectural review, system-wide dependency analysis. Consult official docs via Context7. |
| `--ultrathink` | ALL available MCP servers | Maximum depth (~32K tokens). Use every available tool. For mission-critical problems, irreversible decisions, complex legacy migration. |

### MCP Shortcut Flags

| Flag | Aliases | MCP Server | When to Use |
|------|---------|------------|-------------|
| `--c7` | `--context7` | Context7 (`mcp__context7__*`) | Library/framework docs lookup. Prefer over web search for React, Vue, Express, Tailwind, etc. Always resolve library ID first, then query docs. |
| `--seq` | `--sequential` | Sequential Thinking (`mcp__sequential-thinking__*`) | Multi-step reasoning, complex debugging, root cause analysis, architectural planning. Use when problem has 3+ interconnected components. |

### Mode Flags

| Flag | Aliases | Behavior |
|------|---------|----------|
| `--brainstorm` | `--bs` | **Exploratory discovery mode.** Ask probing Socratic questions before acting. Uncover hidden requirements. Don't assume — guide user through exploration. Synthesize insights into structured briefs. |
| `--introspect` | `--introspection` | **Transparent reasoning mode.** Expose your thinking process explicitly. Show decision logic, pattern recognition, and reasoning chains. Flag uncertainty. Use markers: "Reasoning:", "Considering:", "Decision:", "Alternative:". |
| `--task-manage` | `--delegate` | **Systematic task organization.** Break work into hierarchical tasks (Plan > Phase > Task > Todo). Use TodoWrite/TaskCreate for tracking. Orchestrate through delegation. Verify completion at each level. |
| `--orchestrate` | | **Tool optimization mode.** Choose the most powerful tool for each sub-task. Identify independent operations for parallel execution. Optimize for speed and resource efficiency. Use the tool selection matrix below. |

### Flag Composition Rules

```
--think-hard  =  --seq + --c7 (automatically enables both)
--ultrathink  =  all MCP servers enabled (superset of --think-hard)
Depth priority: --ultrathink > --think-hard > --think
Multiple modes can combine: --brainstorm --seq is valid
```

---

## Orchestrate: Tool Selection Matrix

When `--orchestrate` is active, prefer the optimal tool for each task type:

| Task Type | Best Tool | Fallback |
|-----------|-----------|----------|
| Deep analysis | Sequential Thinking MCP | Native reasoning |
| Library/framework docs | Context7 MCP | Web search |
| UI components | Magic MCP (`mcp__magic__*`) | Manual coding |
| Browser testing | Playwright MCP (`mcp__playwright__*`) | Unit tests |
| Performance audit | Chrome DevTools MCP (`mcp__chrome-devtools__*`) | Manual profiling |
| Web research | Tavily/Brave MCP | WebFetch |
| File search | Glob/Grep | Bash |

---

## Project Conventions

- **State machine**: `useReducer` in `app/hooks/useLotteryMachine.ts`
- **Animation**: RAF-based in `app/hooks/useDrawAnimation.ts` + `app/lib/animation.ts`
- **Sound**: Web Audio API in `app/lib/sound.ts`
- **Tests**: Run with `npm test`. All tests must pass before committing.
- **Build**: `npm run build` — must succeed before committing.
- **Language**: UI text in Korean, code/comments in English.
- **Commits**: Conventional commits (`feat:`, `fix:`, `refactor:`, etc.)

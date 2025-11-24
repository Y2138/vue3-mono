---
name: /openspec-apply
id: openspec-apply
category: OpenSpec
description: Implement an approved OpenSpec change and keep tasks in sync.
---

<!-- OPENSPEC:START -->

**Guardrails**

- Favor straightforward, minimal implementations first and add complexity only when it is requested or clearly required.
- Keep changes tightly scoped to the requested outcome.
- Refer to `openspec/AGENTS.md` (located inside the `openspec/` directory—run `ls openspec` or `openspec update` if you don't see it) if you need additional OpenSpec conventions or clarifications.

**Steps** Track these steps as TODOs and complete them one by one.

1. Read `changes/<id>/proposal.md`, `design.md` (if present), and `tasks.md` to confirm scope and acceptance criteria.
2. Work through tasks sequentially, keeping edits minimal and focused on the requested change.
3. Confirm completion before updating statuses—make sure every item in `tasks.md` is finished.

### 当前状态总结

**已完成**: 后端核心功能开发完成，TypeScript 类型错误全部修复，系统已可通过基础编译验证

**进行中**: 前端角色管理界面需要继续开发，包括系统管理路由、角色列表页面、权限管理等

**优先级**: 建议优先完成前端角色列表页面和路由配置，确保前后端联调的基础界面就绪

**Reference**

- Use `openspec show <id> --json --deltas-only` if you need additional context from the proposal while implementing.
<!-- OPENSPEC:END -->

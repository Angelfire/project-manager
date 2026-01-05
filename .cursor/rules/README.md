# Cursor Project Rules

This directory contains Project Rules for the RunStack project. Each rule is a folder containing a `RULE.md` file with frontmatter metadata.

## Available Rules

### `tauri-v2-expert/`

Expert guidance for Tauri v2 framework:

- Architecture decisions
- IPC optimization
- Security best practices
- Platform-specific implementations
- Performance optimization

**Type**: Apply Intelligently (when Tauri-related tasks are detected)

### `tailwind-expert/`

Expert guidance for Tailwind CSS v4:

- Utility-first patterns
- `@theme inline` configuration
- Component patterns
- Performance optimization
- Accessibility with Tailwind

**Type**: Apply Intelligently (when styling/Tailwind tasks are detected)

### `macos-ui-engineer/`

Expert guidance for macOS UI/UX:

- Apple Human Interface Guidelines
- Native-feeling interactions
- Typography and spacing
- Animation and transitions
- Component architecture

**Type**: Apply Intelligently (when UI/UX design tasks are detected)

## How Rules Work

According to [Cursor documentation](https://cursor.com/docs/context/rules), Project Rules:

1. Are stored in `.cursor/rules/` as folders with `RULE.md` files
2. Can be configured with frontmatter metadata:
   - `description`: Used by Agent to decide when to apply
   - `alwaysApply`: If true, applies to every chat session
   - `globs`: File patterns to apply to specific files
3. Are version-controlled and scoped to your codebase

## General Project Guidelines

For general project guidelines, see `AGENTS.md` in the project root.

## Adding New Rules

To add a new rule:

1. Create a new folder in `.cursor/rules/`
2. Add a `RULE.md` file with frontmatter:
   ```markdown
   ---
   description: "Your rule description"
   alwaysApply: false
   ---
   ```
3. Add your rule content below the frontmatter

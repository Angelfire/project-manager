# RunStack Project Guidelines

This project uses Tauri v2 and Tailwind CSS v4. For detailed expert rules, see Project Rules in `.cursor/rules/`.

## General Project Guidelines

- Use TypeScript with strict mode enabled
- Follow React best practices (hooks, memoization when appropriate)
- Write tests for new features
- Maintain accessibility standards (ARIA labels, keyboard navigation)
- Use semantic HTML
- Follow the project's code organization patterns

## Code Style

- Use functional components with hooks
- Prefer `const` over `let` when possible
- Use meaningful variable and function names
- Keep components focused and single-purpose
- Extract reusable logic into custom hooks
- Use TypeScript types strictly (avoid `any`)

## File Organization

- Components: `src/components/` and `src/components/ui/`
- Hooks: `src/hooks/`
- Utilities: `src/utils/`
- Services: `src/services/`
- Types: `src/types.ts`
- API layer: `src/api/`

## Testing

- Write tests for utilities and hooks
- Test user interactions, not implementation details
- Use Testing Library queries (getByRole, getByLabelText, etc.)
- Avoid querySelector and other non-standard queries

## Performance

- Use React.memo for expensive components
- Use useMemo/useCallback when appropriate
- Lazy load heavy components
- Optimize re-renders with proper dependency arrays


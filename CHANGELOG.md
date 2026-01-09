# Changelog

All notable changes to RunStack will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-01-XX

### Added

#### Core Functionality

- Automatic project detection by scanning directories
- One-click project execution (Run/Stop)
- Process management with process tree termination
- Multi-runtime support for Node.js, Deno, and Bun
- Automatic package manager detection (npm, yarn, pnpm, bun)
- Framework detection for Astro, Next.js, Vite, React, SvelteKit, and Nuxt

#### Project Management

- Directory selection and scanning
- Project rescanning capability
- Real-time project status tracking (running/stopped)
- Automatic port detection for running projects
- Browser integration to open projects in default browser

#### Filtering & Sorting

- Advanced search by project name with validation
- Runtime filtering (Node.js, Deno, Bun)
- Framework filtering
- Status filtering (all, running, stopped)
- Sorting by name, modification date, or size
- Ascending/descending sort order toggle

#### Project Information Display

- Runtime version display
- Package manager information
- Framework information
- Available npm scripts count
- Project size in human-readable format
- Last modification date
- Port number when project is running

#### Logs & Monitoring

- Real-time stdout and stderr log streaming
- Log search functionality
- Log export to text file
- Clear log history per project
- Log history retention (up to 1000 entries per project)
- Timestamped log entries

#### Quick Actions

- Open project in VS Code or default editor
- Open terminal in project directory
- Open project folder in system file manager (cross-platform)
- Copy project path to clipboard

#### User Interface

- Modern dark theme with CSS variables
- Responsive design for different screen sizes
- Nerd Font icons for runtime identification
- Toast notifications (success, error, warning, info)
- Error boundaries with user-friendly error recovery
- Loading states and empty states
- Project cards with comprehensive information display

#### Developer Experience

- TypeScript strict mode with enhanced type checking
- Comprehensive test coverage with Vitest
- ESLint and Prettier for code quality
- Path aliases for cleaner imports (`@/components`, `@/utils`, etc.)
- JSDoc documentation for exported functions
- Modular component architecture
- Reusable custom hooks

#### Architecture

- Tauri 2 backend with Rust
- React 19 frontend
- Tailwind CSS 4 with custom theme system
- Radix UI primitives for accessible components
- Centralized API abstraction layer
- Type-safe Tauri command interfaces

### Technical Details

#### Performance Optimizations

- React.memo for component memoization
- useCallback and useMemo for expensive operations
- Lazy loading for heavy components (ProjectLogs)
- Optimized re-renders with proper dependency arrays

#### Code Quality

- Input validation for search terms, paths, PIDs, and ports
- Error handling with user-friendly messages
- Type-safe API layer
- Comprehensive test suite
- WCAG AA compliant color contrasts

#### Platform Support

- macOS (10.13+)
- Linux (deb, rpm, appimage)
- Desktop platforms only (no Windows, Android, or iOS support)

### Known Limitations

#### Functionality

- **Theme**: Only dark theme is available. Light theme support is planned for future releases.
- **Internationalization**: Application is currently English-only. Multi-language support is planned.
- **Keyboard Shortcuts**: No keyboard shortcuts are available yet. This feature is planned for v1.1.
- **Settings/Preferences**: No settings page is available. Users cannot configure default editor, terminal, or port ranges yet.
- **Virtual Scrolling**: Large project lists (100+ projects) may experience performance issues. Virtual scrolling is planned for optimization.
- **Project Templates**: Cannot create new projects from templates. This feature is planned for future releases.
- **Project Favorites**: Cannot mark projects as favorites or filter by favorites.
- **Statistics Dashboard**: No statistics or analytics dashboard is available.
- **Git Integration**: No git status or branch information is displayed.
- **CI/CD Integration**: Cannot run CI/CD commands from the application.
- **Project Health Checks**: No automatic checks for installed dependencies, build status, or outdated dependencies.

#### Platform Limitations

- **Windows Support**: Windows is not currently supported. Only macOS and Linux are supported.
- **Mobile Platforms**: No support for Android or iOS.
- **Code Signing**: Applications are not code-signed. Users may see security warnings on macOS.

#### Accessibility

- **ARIA Labels**: Basic ARIA labels are present, but comprehensive accessibility features are still being improved.
- **Keyboard Navigation**: Basic keyboard navigation works, but advanced keyboard shortcuts are not yet implemented.
- **Screen Reader Support**: Basic support exists, but comprehensive screen reader testing is pending.

#### Performance

- **Large Project Lists**: Performance may degrade with 100+ projects. Virtual scrolling will be implemented in a future release.
- **Bundle Size**: Bundle size optimization is ongoing. Further optimizations are planned.

#### Error Handling

- **Error Types**: Error types are not yet centralized. Enhanced error handling system is planned.
- **Structured Logging**: Structured logging in Rust backend is planned but not yet implemented.
- **Error Tracking**: No error tracking service (e.g., Sentry) is integrated yet.

### Migration Notes

This is the initial beta release (0.1.0), so no migration is required. This is the first public release of RunStack.

### Breaking Changes

None. This is the first release.

### Security

- Input validation for all user inputs (search terms, paths, PIDs, ports)
- Path traversal protection
- Process ID validation to prevent accidental system damage
- Port validation to ensure valid port ranges
- CSP (Content Security Policy) configured in Tauri

### Dependencies

#### Frontend

- React 19.1.0
- TypeScript 5.8.3
- Tailwind CSS 4.1.18
- Vite 7.0.4
- Vitest 4.0.16
- Radix UI components
- Sonner for toast notifications

#### Backend

- Tauri 2
- Rust 1.83+

### Testing

- Unit tests for components, hooks, and utilities
- API layer tests with comprehensive coverage
- Test coverage reporting available
- CI/CD pipeline with automated testing

### Documentation

- Comprehensive README with usage instructions
- JSDoc comments for exported functions
- Type definitions for TypeScript
- This changelog for version tracking

---

## Future Releases

### Planned for v1.1.0

- Settings/Preferences page
- Keyboard shortcuts
- Enhanced accessibility features

### Planned for v1.2.0+

- Light theme support
- Virtual scrolling for large project lists
- Enhanced error handling system
- Performance optimizations

### Planned for Future Releases

- Internationalization (i18n)
- Project templates
- Project favorites
- Statistics dashboard
- Git integration
- CI/CD integration
- Project health checks

---

[0.1.0]: https://github.com/Angelfire/runstack/releases/tag/v0.1.0

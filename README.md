# RunStack

A desktop application built with Tauri, React, and TypeScript to manage and run Node.js, Deno, and Bun projects from a single place.

<img width="1512" height="1041" alt="RunStack" src="https://github.com/user-attachments/assets/f406c37d-875d-4bcd-9c7a-20a6b28f181a" />

<img width="1512" height="1041" alt="RunStack Logs" src="https://github.com/user-attachments/assets/2df554a4-e254-4841-a477-f7bf7ffa8c42" />

## Features

### Core Functionality

- **Automatic Project Detection**: Scans directories to automatically find projects
- **One-Click Execution**: Run projects with a single click
- **Process Management**: Stop running projects and manage process trees
- **Package Manager Detection**: Automatically detects package managers (npm, yarn, pnpm, bun)
- **Multi-Runtime Support**: Supports Node.js, Deno, and Bun runtimes
- **Framework Detection**: Automatically detects frameworks (Astro, Next.js, Vite, React, SvelteKit, Nuxt)

### Filtering & Sorting

- **Advanced Search**: Search projects by name
- **Runtime Filtering**: Filter projects by runtime (Node.js, Deno, Bun)
- **Framework Filtering**: Filter projects by framework
- **Status Filtering**: Filter by running/stopped status
- **Sorting Options**: Sort projects by name, modification date, or size
- **Ascending/Descending**: Toggle sort order

### Project Information

- **Runtime Version**: Displays the version of Node.js, Deno, or Bun
- **Scripts Information**: Shows available npm scripts from package.json
- **Project Size**: Displays the total size of the project directory
- **Modification Date**: Shows when the project was last modified
- **Port Detection**: Automatically detects and displays the port when a project is running
- **Browser Integration**: Open projects directly in your browser

### Logs & Monitoring

- **Real-time Logs**: View stdout and stderr output from running projects
- **Log Search**: Search through logs with a built-in search function
- **Export Logs**: Export logs to a text file for analysis
- **Clear Logs**: Clear log history for any project
- **Log History**: Maintains up to 1000 log entries per project
- **Timestamped Entries**: Each log entry includes a precise timestamp

### Quick Actions

- **Open in Editor**: Open project in VS Code or default editor
- **Open in Terminal**: Open terminal in project directory
- **Open in File Manager**: Open project folder in system file manager (cross-platform)
- **Copy Path**: Copy project path to clipboard

### User Interface

- **Modern Dark Theme**: Beautiful dark-themed interface with CSS variables
- **Nerd Font Icons**: Uses Nerd Fonts for runtime icons
- **Responsive Design**: Works on different screen sizes
- **Fast Performance**: Built with Rust backend for optimal performance
- **Toast Notifications**: Non-intrusive toast notifications for user feedback (success, error, warning, info)
- **Error Boundaries**: Global error handling with user-friendly error recovery UI
- **Accessibility**: WCAG AA compliant color contrasts

## Requirements

- Node.js 20.19+ or 22.12+ (recommended: latest LTS version)
- pnpm 9+ (package manager for this project)
- Rust 1.83+ (to compile the backend)
- npm, yarn, pnpm, or bun (depending on your projects to manage)

**Note**: If you use `fnm` (Fast Node Manager), you can install the latest LTS with:

```bash
fnm install --lts
fnm use --install-if-missing lts-latest
fnm default lts-latest
```

## Installation

### Download Pre-built Release (Recommended)

Download the latest release from the [Releases page](https://github.com/Angelfire/runstack/releases):

1. Go to the [Releases page](https://github.com/Angelfire/runstack/releases)
2. Download the `.dmg` file for macOS
3. Open the DMG and drag RunStack to your Applications folder
4. Launch RunStack from Applications

**Note**: If you see a security warning on macOS, right-click the app and select "Open" the first time, or go to System Settings → Privacy & Security → Allow the app.

### Build from Source

1. Clone the repository:

```bash
git clone https://github.com/Angelfire/runstack.git
cd runstack
```

2. Install dependencies:

```bash
pnpm install
```

3. For development:

```bash
pnpm tauri dev
```

4. To build the application (desktop only):

```bash
pnpm tauri build
```

**Note**: This application is configured for desktop platforms only (macOS, Linux). It does not include support for Windows, Android, or iOS.

## Usage

1. Open the application
2. Click "Select" and choose the folder containing your projects
3. The application will automatically scan and display all found projects
4. Use the search bar to find specific projects
5. Use filters to narrow down projects by runtime, framework, or status
6. Sort projects by name, date, or size using the sort dropdown
7. Click "Run" to start a project
8. Click "Stop" to stop a running project
9. Click the external link icon to open the project in your browser
10. Click the logs icon to view project logs:
    - View real-time stdout and stderr output
    - Search through logs using the search bar
    - Export logs to a text file using the download button
    - Clear log history using the trash button
    - Logs are available when a project is running or has previous log history
11. Click the three-dot menu for quick actions:
    - **Open in Editor**: Opens the project in VS Code or your default editor
    - **Open in Terminal**: Opens a terminal window in the project directory
    - **Open in File Manager**: Opens the project folder in your system file manager
    - **Copy Path**: Copies the project path to your clipboard

## Project Information

Each project card displays:

- **Runtime**: The JavaScript runtime (Node.js, Deno, or Bun)
- **Framework**: Detected framework (Astro, Next.js, Vite, etc.)
- **Package Manager**: The package manager used (npm, yarn, pnpm, bun)
- **Runtime Version**: The version of the runtime installed
- **Scripts Count**: Number of available npm scripts
- **Project Size**: Total size of the project directory
- **Last Modified**: Date when the project was last modified
- **Port**: The port number when the project is running
- **Logs**: Access project logs by clicking the logs icon button

## Technologies

- **Frontend**: React 19, TypeScript, Tailwind CSS 4
- **Backend**: Rust, Tauri 2
- **Build**: Vite 7
- **Package Manager**: pnpm 9+
- **CI/CD**: GitHub Actions (automated releases)
- **Icons**: Nerd Fonts, Lucide React
- **Notifications**: Sonner (toast notifications)
- **UI Components**: Radix UI primitives (Dialog, Dropdown Menu, Select)
- **Testing**: Vitest with coverage reporting
- **Code Quality**: ESLint 9, Prettier, TypeScript strict mode

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Testing

The project uses Vitest for testing React components, utilities, and the Tauri API abstraction layer.

### Running Tests

```bash
# Run tests in watch mode
pnpm test

# Run tests once
pnpm test:run

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage

# Run tests with coverage UI
pnpm test:coverage:ui
```

### Test Coverage

Coverage reports are generated in the `coverage/` directory and can be viewed in HTML format.

## Roadmap

For the complete roadmap, including pre-beta requirements and post-beta improvements, see [docs/IMPROVEMENTS.md](docs/IMPROVEMENTS.md).

## Development

### Code Quality

The project uses several tools to maintain code quality:

- **ESLint**: Linting with TypeScript and React rules
- **Prettier**: Code formatting
- **TypeScript**: Strict mode enabled with enhanced type checking
- **Path Aliases**: Use `@/` prefix for imports (e.g., `@/components`, `@/utils`)

### Available Scripts

```bash
# Development
pnpm dev              # Start Vite dev server
pnpm tauri dev        # Start Tauri development mode

# Building
pnpm build            # Build for production
pnpm tauri build      # Build Tauri application

# Testing
pnpm test             # Run tests in watch mode
pnpm test:run         # Run tests once
pnpm test:coverage    # Run tests with coverage

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint errors
pnpm format           # Format code with Prettier
pnpm format:check     # Check code formatting
pnpm type-check       # Type check without emitting files
```

### Project Structure

```
src/
  api/                # Tauri API abstraction layer
  components/         # React components
  hooks/              # Custom React hooks
  services/           # Business logic services
  utils/              # Utility functions
  types.ts            # TypeScript type definitions
```

### Architecture

- **API Layer**: Centralized Tauri command abstraction (`src/api/tauri.ts`)
  - Groups commands by category (projects, processes, quickActions)
  - Provides type-safe interfaces
  - Fully tested with comprehensive test coverage

- **Error Handling**: React Error Boundaries for global error catching
- **Performance**: Optimized with React.memo, useCallback, useMemo, and lazy loading
- **Type Safety**: Strict TypeScript configuration with path aliases
- **Theming**: CSS variables system for easy theme customization

## Releases

Releases are automatically built and published using GitHub Actions. For detailed information on the release process, see [docs/RELEASE.md](docs/RELEASE.md).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. When contributing:

1. Follow the existing code style
2. Add tests for new features
3. Update the README if needed
4. Ensure all tests pass before submitting
5. Run `pnpm lint` and `pnpm format` before committing

## License

MIT

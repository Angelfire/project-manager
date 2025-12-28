# RunStack

A desktop application built with Tauri, React, and TypeScript to manage and run Node.js, Deno, and Bun projects from a single place.

## Features

### Core Functionality

- 🔍 **Automatic Project Detection**: Scans directories to automatically find projects
- 🚀 **One-Click Execution**: Run projects with a single click
- 🛑 **Process Management**: Stop running projects and manage process trees
- 📦 **Package Manager Detection**: Automatically detects package managers (npm, yarn, pnpm, bun)
- ⚡ **Multi-Runtime Support**: Supports Node.js, Deno, and Bun runtimes
- 🎯 **Framework Detection**: Automatically detects frameworks (Astro, Next.js, Vite, React, SvelteKit, Nuxt)

### Filtering & Sorting

- 🔎 **Advanced Search**: Search projects by name
- 🎛️ **Runtime Filtering**: Filter projects by runtime (Node.js, Deno, Bun)
- 🏗️ **Framework Filtering**: Filter projects by framework
- 📊 **Status Filtering**: Filter by running/stopped status
- 📈 **Sorting Options**: Sort projects by name, modification date, or size
- ↕️ **Ascending/Descending**: Toggle sort order

### Project Information

- 📋 **Runtime Version**: Displays the version of Node.js, Deno, or Bun
- 📜 **Scripts Information**: Shows available npm scripts from package.json
- 💾 **Project Size**: Displays the total size of the project directory
- 📅 **Modification Date**: Shows when the project was last modified
- 🔌 **Port Detection**: Automatically detects and displays the port when a project is running
- 🌐 **Browser Integration**: Open projects directly in your browser

### Logs & Monitoring

- 📋 **Real-time Logs**: View stdout and stderr output from running projects
- 🔍 **Log Search**: Search through logs with a built-in search function
- 📥 **Export Logs**: Export logs to a text file for analysis
- 🗑️ **Clear Logs**: Clear log history for any project
- 📊 **Log History**: Maintains up to 1000 log entries per project
- ⏱️ **Timestamped Entries**: Each log entry includes a precise timestamp

### Quick Actions

- 📝 **Open in Editor**: Open project in VS Code or default editor
- 💻 **Open in Terminal**: Open terminal in project directory
- 📂 **Open in Finder**: Open project folder in system file manager
- 📋 **Copy Path**: Copy project path to clipboard

### User Interface

- 🎨 **Modern Dark Theme**: Beautiful dark-themed interface
- 🎭 **Nerd Font Icons**: Uses Nerd Fonts for runtime icons
- 📱 **Responsive Design**: Works on different screen sizes
- ⚡ **Fast Performance**: Built with Rust backend for optimal performance

## Requirements

- Node.js 20.19+ or 22.12+ (recommended: latest LTS version)
- npm (included with Node.js)
- Rust 1.83+ (to compile the backend)
- npm, yarn, pnpm, or bun (depending on your projects to manage)

**Note**: If you use `fnm` (Fast Node Manager), you can install the latest LTS with:

```bash
fnm install --lts
fnm use --install-if-missing lts-latest
fnm default lts-latest
```

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd runstack
```

2. Install dependencies:

```bash
npm install
```

3. For development:

```bash
npm run tauri dev
```

4. To build the application (desktop only):

```bash
npm run tauri build
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
10. Click the logs icon (📄) to view project logs:
    - View real-time stdout and stderr output
    - Search through logs using the search bar
    - Export logs to a text file using the download button
    - Clear log history using the trash button
    - Logs are available when a project is running or has previous log history
11. Click the three-dot menu (⋮) for quick actions:
    - **Open in Editor**: Opens the project in VS Code or your default editor
    - **Open in Terminal**: Opens a terminal window in the project directory
    - **Open in Finder**: Opens the project folder in your system file manager
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
- **Logs**: Access project logs by clicking the logs icon (📄) button

## Technologies

- **Frontend**: React 19, TypeScript, Tailwind CSS 4
- **Backend**: Rust, Tauri 2
- **Build**: Vite
- **Icons**: Nerd Fonts

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## License

MIT

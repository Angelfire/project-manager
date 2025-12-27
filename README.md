# Project Manager

Una aplicación de escritorio construida con Tauri, React y TypeScript para gestionar y ejecutar proyectos Node.js, Deno y Bun desde un solo lugar.

## Características

- 🔍 Escanea directorios para encontrar proyectos automáticamente
- 🚀 Ejecuta proyectos con un solo click
- 🛑 Detén proyectos en ejecución
- 📦 Detecta automáticamente el gestor de paquetes (npm, yarn, pnpm, bun)
- 🎨 Interfaz moderna con soporte para modo oscuro
- ⚡ Soporte para múltiples runtimes: Node.js, Deno y Bun

## Requisitos

- Node.js 20.19+ o 22.12+ (recomendado: última versión LTS)
- npm (incluido con Node.js)
- Rust 1.83+ (para compilar el backend)
- npm, yarn, pnpm o bun (dependiendo de tus proyectos a gestionar)

**Nota**: Si usas `fnm` (Fast Node Manager), puedes instalar la última versión LTS con:

```bash
fnm install --lts
fnm use --install-if-missing lts-latest
fnm default lts-latest
```

## Instalación

1. Clona el repositorio
2. Instala las dependencias:

```bash
npm install
```

3. Para desarrollo:

```bash
npm run tauri dev
```

4. Para construir la aplicación (solo desktop):

```bash
npm run tauri build
```

**Nota**: Esta aplicación está configurada solo para plataformas de escritorio (macOS, Windows, Linux). No incluye soporte para Android o iOS.

## Uso

1. Abre la aplicación
2. Haz click en "Seleccionar Directorio" y elige la carpeta que contiene tus proyectos
3. La aplicación escaneará automáticamente y mostrará todos los proyectos encontrados
4. Haz click en "Ejecutar" para iniciar un proyecto
5. Haz click en "Detener" para detener un proyecto en ejecución

## Tecnologías

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Backend**: Rust, Tauri 2
- **Build**: Vite

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

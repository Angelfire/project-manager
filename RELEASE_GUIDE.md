# Guía de Release para macOS

Esta guía te ayudará a crear y distribuir el release inicial de RunStack para macOS.

## 📋 Prerequisitos

### 1. Cuenta de Desarrollador de Apple (Opcional pero Recomendado)

Para distribuir la app sin advertencias de seguridad, necesitas:

- **Apple Developer Account** ($99/año): https://developer.apple.com/programs/
- **Certificado de Code Signing**: Instalado en tu Keychain
- **App-Specific Password**: Para notarización (si aplicas notarización)

**Nota**: Puedes crear releases sin code signing, pero los usuarios verán advertencias de seguridad.

### 2. Herramientas Requeridas

```bash
# Verificar que tienes todo instalado
node --version    # Debe ser 20.19+ o 22.12+
pnpm --version    # Debe ser 9+
rustc --version   # Debe ser 1.83+
cargo --version
```

### 3. Configuración Inicial

Asegúrate de que tu proyecto esté configurado correctamente:

- ✅ Iconos en `src-tauri/icons/` (icon.icns, 32x32.png, 128x128.png, etc.)
- ✅ `entitlements.plist` configurado en `src-tauri/`
- ✅ `tauri.macos.conf.json` configurado (ya existe)

## 🚀 Proceso de Release

### Paso 1: Preparar el Release

Usa el script de preparación para actualizar todas las versiones:

```bash
# Opción 1: Usar el script directamente
node scripts/prepare-release.js v0.1.0

# Opción 2: Agregar al package.json (recomendado)
# Agrega esto a package.json scripts:
# "prepare-release": "node scripts/prepare-release.js"
pnpm run prepare-release v0.1.0
```

El script:

- ✅ Verifica que el directorio esté limpio
- ✅ Ejecuta todos los checks (`pnpm run check-all`)
- ✅ Actualiza versiones en `package.json`, `Cargo.toml`, `tauri.conf.json`, y `tauri.macos.conf.json`
- ✅ Actualiza lock files
- ✅ Verifica compilación de Rust
- ✅ Opcionalmente crea commit y tag

### Paso 2: Build del Release

#### Opción A: Build sin Code Signing (Para Testing)

Según la [documentación oficial de Tauri](https://v2.tauri.app/distribute/dmg/), puedes construir el DMG de varias formas:

```bash
# Opción 1: Build con configuración específica de macOS (recomendado)
pnpm tauri build --config tauri.macos.conf.json

# Opción 2: Build especificando solo el bundle DMG
pnpm tauri build --bundles dmg

# Opción 3: Build normal (crea todos los bundles configurados)
pnpm tauri build
```

**Nota**: Si `"targets": ["app", "dmg"]` está configurado en `tauri.macos.conf.json`, el comando `pnpm tauri build --config tauri.macos.conf.json` creará ambos automáticamente.

Los archivos se generarán en:

- `src-tauri/target/release/bundle/macos/RunStack.app`
- `src-tauri/target/release/bundle/dmg/RunStack_0.1.0_x64.dmg`

#### Opción B: Build con Code Signing (Recomendado para Distribución)

1. **Configurar Code Signing Identity**:

   Edita `src-tauri/tauri.macos.conf.json`:

   ```json
   {
     "bundle": {
       "macOS": {
         "signingIdentity": "Developer ID Application: Tu Nombre (TEAM_ID)",
         "hardenedRuntime": true,
         "entitlements": "entitlements.plist"
       }
     }
   }
   ```

   Para encontrar tu Signing Identity:

   ```bash
   security find-identity -v -p codesigning
   ```

2. **Build con Code Signing**:

   ```bash
   pnpm tauri build --config tauri.macos.conf.json
   ```

3. **Verificar Code Signing**:

   ```bash
   codesign --verify --verbose --deep --strict \
     src-tauri/target/release/bundle/macos/RunStack.app

   codesign -dv --verbose=4 \
     src-tauri/target/release/bundle/macos/RunStack.app
   ```

### Paso 3: Notarización (Opcional pero Recomendado)

La notarización permite que macOS verifique automáticamente tu app sin advertencias.

1. **Crear App-Specific Password**:
   - Ve a https://appleid.apple.com/
   - Security → App-Specific Passwords
   - Crea una nueva contraseña para "Notarization"

2. **Notarizar la App**:

   ```bash
   # Crear un zip para notarización
   cd src-tauri/target/release/bundle/macos
   ditto -c -k --keepParent RunStack.app RunStack.zip

   # Notarizar
   xcrun notarytool submit RunStack.zip \
     --apple-id "tu-email@example.com" \
     --team-id "TU_TEAM_ID" \
     --password "app-specific-password" \
     --wait
   ```

3. **Stapling** (Adjuntar el ticket de notarización):

   ```bash
   xcrun stapler staple RunStack.app
   xcrun stapler validate RunStack.app
   ```

### Paso 4: Personalizar el DMG (Opcional)

Según la [documentación oficial de Tauri](https://v2.tauri.app/distribute/dmg/), puedes personalizar la ventana del DMG editando `tauri.macos.conf.json`:

```json
{
  "bundle": {
    "macOS": {
      "dmg": {
        "background": "./images/dmg-background.png",
        "windowSize": {
          "width": 800,
          "height": 600
        },
        "windowPosition": {
          "x": 400,
          "y": 400
        },
        "appPosition": {
          "x": 180,
          "y": 220
        },
        "applicationFolderPosition": {
          "x": 480,
          "y": 220
        }
      }
    }
  }
}
```

**Opciones disponibles**:

- `background`: Ruta a una imagen de fondo (puede incluir una flecha indicando que arrastrar el app)
- `windowSize`: Tamaño de la ventana (default: 660x400)
- `windowPosition`: Posición inicial de la ventana
- `appPosition`: Posición del icono de la app
- `applicationFolderPosition`: Posición del icono de la carpeta Applications

**Nota importante**: Debido a un [problema conocido](https://github.com/tauri-apps/tauri/issues/1731), los tamaños y posiciones de iconos no se aplican cuando se crean DMGs en plataformas CI/CD. Esto solo funciona cuando se construye localmente en macOS.

### Paso 5: Verificar el Release

Antes de distribuir, verifica:

```bash
# 1. Verificar estructura del .app
ls -la src-tauri/target/release/bundle/macos/RunStack.app/Contents/

# 2. Verificar que el ejecutable existe
ls -la src-tauri/target/release/bundle/macos/RunStack.app/Contents/MacOS/

# 3. Verificar permisos
chmod +x src-tauri/target/release/bundle/macos/RunStack.app/Contents/MacOS/runstack

# 4. Probar la app localmente
open src-tauri/target/release/bundle/macos/RunStack.app
```

### Paso 6: Crear GitHub Release

1. **Crear el Release en GitHub**:
   - Ve a: https://github.com/Angelfire/runstack/releases/new
   - Selecciona el tag creado (ej: `v0.1.0`)
   - Título: `v0.1.0 - Initial Release` (o similar)
   - Descripción: Copia el contenido relevante de `CHANGELOG.md`

2. **Subir Archivos**:
   - Arrastra el `.dmg` al release
   - Opcionalmente, sube también el `.app` (comprimido en .zip)

3. **Publicar el Release**:
   - Haz clic en "Publish release"

## 📝 Checklist de Release

Antes de hacer el release, verifica:

- [ ] Versión actualizada en todos los archivos (package.json, Cargo.toml, tauri.conf.json)
- [ ] CHANGELOG.md actualizado
- [ ] README.md actualizado si es necesario
- [ ] Todos los tests pasan (`pnpm test:run`)
- [ ] Linting pasa (`pnpm lint`)
- [ ] Type checking pasa (`pnpm type-check`)
- [ ] Build funciona (`pnpm tauri build`)
- [ ] La app se ejecuta correctamente
- [ ] Iconos están presentes y correctos
- [ ] Code signing configurado (si aplica)
- [ ] Notarización completada (si aplica)
- [ ] GitHub release creado con archivos adjuntos

## 🔧 Troubleshooting

### Error: "No signing identity found"

**Solución**: Configura tu certificado de code signing o deja `signingIdentity: null` para builds sin firmar.

### Error: "Hardened Runtime violations"

**Solución**: Asegúrate de que `entitlements.plist` tenga todos los permisos necesarios.

### Error: "Notarization failed"

**Solución**:

- Verifica que el App-Specific Password sea correcto
- Asegúrate de que el Team ID sea correcto
- Revisa los logs: `xcrun notarytool log <submission-id> --apple-id ...`

### DMG no se crea automáticamente

**Solución**:

- Verifica que `"targets": ["app", "dmg"]` esté en `tauri.macos.conf.json`
- O usa el flag `--bundles dmg` explícitamente: `pnpm tauri build --bundles dmg`
- Asegúrate de estar ejecutando el build en macOS (el DMG solo se puede crear en macOS)

## ⚠️ Notas Importantes

### PATH en macOS y Linux

Según la [documentación oficial de Tauri](https://v2.tauri.app/distribute/dmg/), las apps GUI en macOS y Linux **no heredan el `$PATH`** de tus archivos de configuración del shell (`.bashrc`, `.bash_profile`, `.zshrc`, etc.). Si tu app necesita comandos que no están en el PATH del sistema, considera usar el crate [fix-path-env-rs](https://crates.io/crates/fix-path-env-rs) de Tauri.

### DMG en CI/CD

Si estás construyendo el DMG en CI/CD, ten en cuenta que las personalizaciones de tamaño y posición de iconos no se aplicarán debido a un problema conocido. Solo funcionan cuando se construye localmente en macOS.

## 📚 Recursos Adicionales

- [Tauri DMG Distribution Guide](https://v2.tauri.app/distribute/dmg/) - Documentación oficial sobre DMG
- [Tauri Building Documentation](https://v2.tauri.app/guides/building/)
- [Apple Code Signing Guide](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [macOS App Distribution](https://developer.apple.com/distribute/)

## 🎯 Release Inicial (v0.1.0) - Pasos Rápidos

Para el release inicial, puedes seguir estos pasos simplificados:

```bash
# 1. Preparar release
pnpm run prepare-release v0.1.0

# 2. Build (sin code signing para el primer release)
# Opción A: Con configuración específica de macOS
pnpm tauri build --config tauri.macos.conf.json

# Opción B: Especificando solo el bundle DMG
pnpm tauri build --bundles dmg

# 3. Verificar que funciona
open src-tauri/target/release/bundle/macos/RunStack.app

# 4. Crear GitHub release manualmente y subir el DMG
```

**Nota**: Para releases futuros, considera configurar code signing y notarización para una mejor experiencia del usuario.

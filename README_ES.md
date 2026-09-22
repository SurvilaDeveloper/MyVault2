# MyVault2

[English](README.md)

[![Release](https://img.shields.io/github/v/release/SurvilaDeveloper/MyVault2)](https://github.com/SurvilaDeveloper/MyVault2/releases)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-Desktop-47848F)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)](https://www.typescriptlang.org/)

**MyVault2** es una aplicación de escritorio local para almacenar contraseñas y notas privadas en Windows.

Está desarrollada con **Electron, React y TypeScript** y parte de un principio simple: el vault del usuario permanece en el dispositivo local en lugar de depender de un backend en la nube.

El proyecto incluye almacenamiento local cifrado, sistema de usuarios, backup y recuperación, tests automatizados, lint, empaquetado para Windows, generación de instalador/portable y releases publicados.

> MyVault2 es un proyecto de software personal y no fue sometido a una auditoría profesional independiente de seguridad. No debe presentarse como reemplazo de un gestor de contraseñas profesional auditado.

---

## Puntos destacados para portfolio

MyVault2 demuestra trabajo en distintas áreas del desarrollo de aplicaciones de escritorio:

- Arquitectura Electron main / preload / renderer
- Interfaz con React + TypeScript
- Persistencia local cifrada
- Autenticación y hashing de contraseñas
- Cifrado AES-256-GCM
- Derivación de claves con scrypt
- IPC controlado mediante `contextBridge`
- Diseño de backup y recuperación
- Verificación de integridad con SHA-256
- Merge idempotente de respaldos
- Tests automatizados
- Controles estáticos con ESLint
- Empaquetado de Windows con electron-builder
- Instalador NSIS y ejecutable portable
- Distribución mediante GitHub Releases

---

## Funcionalidades

### Vault de contraseñas

- Guardar cuenta, usuario y contraseña
- Agregar, editar y eliminar registros
- Mostrar u ocultar contraseñas individuales
- Copiar secretos al portapapeles
- Eliminación automática del secreto del portapapeles después de 30 segundos
- Persistencia local cifrada

### Notas privadas

- Crear, editar y eliminar anotaciones
- Buscar notas por título
- Detectar cambios sin guardar
- Avisar antes de abandonar una nota modificada
- Guardar automáticamente antes del cierre por inactividad cuando corresponde
- Persistencia local cifrada

### Usuarios

- Múltiples usuarios locales
- Contraseña de login separada de la master password
- Cambio de contraseña de login
- Cambio de master password
- Eliminación del usuario local y sus datos cifrados
- Cierre automático de sesión después de 5 minutos de inactividad

### Backup y recuperación

- Exportar una carpeta de recuperación cifrada
- Abrir respaldos externos en modo de solo lectura
- Inspeccionar contraseñas y notas antes de restaurar
- Restaurar en un usuario local existente
- Conservar registros locales existentes
- Evitar duplicados en restauraciones repetidas
- Validar tamaño y checksum SHA-256 de archivos
- Rechazar rutas o archivos de respaldo inválidos

---

## Diseño orientado a seguridad

MyVault2 incluye distintas decisiones de implementación orientadas a reducir riesgos.

### Cifrado del vault

Los vaults de contraseñas y notas se cifran mediante:

```text
AES-256-GCM
```

En cada operación de cifrado se generan un salt y un IV aleatorios.

Las claves de cifrado se derivan de la master password utilizando:

```text
scrypt
```

El archivo cifrado almacena:

```text
salt
iv
authentication tag
ciphertext
```

AES-GCM proporciona cifrado autenticado, permitiendo detectar datos cifrados modificados o inválidos durante el descifrado.

### Credenciales de autenticación

Las contraseñas de login y los valores utilizados para verificar la master password se almacenan como hashes mediante:

```text
bcrypt
```

Las contraseñas de login en texto plano no se persisten.

### Aislamiento de Electron

La ventana principal está configurada con:

```text
contextIsolation: true
nodeIntegration: false
sandbox: true
```

El renderer se comunica con el proceso principal de Electron mediante una API limitada expuesta desde el preload utilizando `contextBridge`.

La navegación está restringida, se bloquea la creación directa de nuevas ventanas y los enlaces externos permitidos se abren en el navegador del sistema.

### Portapapeles

Las contraseñas copiadas mediante la acción de copiar secreto se eliminan automáticamente del portapapeles después de:

```text
30 segundos
```

### Arquitectura local

La aplicación no necesita un backend remoto para su funcionamiento normal.

Los datos se guardan dentro del perfil del usuario de Windows, en el directorio de datos de MyVault2.

---

## Arquitectura

```text
┌──────────────────────────────┐
│ React Renderer               │
│                              │
│ UI / Contraseñas / Notas     │
└──────────────┬───────────────┘
               │
               │ API limitada
               ▼
┌──────────────────────────────┐
│ Electron Preload             │
│ contextBridge + IPC          │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Electron Main Process        │
│                              │
│ Autenticación                │
│ Cifrado de vault             │
│ Cifrado de notas             │
│ Backup / recuperación        │
│ Manejo del portapapeles      │
│ Acceso al sistema de archivos│
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Archivos locales cifrados    │
└──────────────────────────────┘
```

---

## Tecnologías principales

### Aplicación

- Electron 44
- React 18
- TypeScript 5
- Vite 8
- bcryptjs
- Lucide React

### Herramientas

- Node.js 22+
- ESLint
- Node test runner
- electron-builder

### Distribución para Windows

- Instalador NSIS
- Ejecutable portable `.exe`
- Checksums SHA-256

---

## Datos locales

Cada usuario posee archivos separados para sus contraseñas y notas cifradas.

Conceptualmente:

```text
MyVault2/
├── auth.json
├── vaults/
│   ├── username.vault
│   └── username.notes.vault
└── session/
```

`auth.json` contiene hashes de contraseñas, no contraseñas en texto plano.

El contenido del vault y de las notas se guarda cifrado.

---

## Formato de backup

Un respaldo contiene los archivos cifrados de contraseñas y notas junto con un manifiesto de recuperación:

```text
MyVault2-Backup-<timestamp>/
├── recovery.json
├── <vault cifrado>
└── <notas cifradas>
```

El manifiesto registra información como:

- formato de recuperación
- versión del formato
- fecha de creación
- versión de la aplicación
- usuario
- tamaños de archivos
- checksums SHA-256

Antes de abrir un archivo de recuperación, MyVault2 valida el manifiesto, el tamaño y el checksum.

Los respaldos externos se abren en **modo de solo lectura** hasta que el usuario decide explícitamente restaurarlos.

---

## Merge durante la recuperación

La restauración está diseñada para conservar los datos locales existentes.

Para contraseñas, un registro se considera duplicado solamente cuando coinciden:

```text
cuenta + usuario + contraseña
```

Para anotaciones, se considera duplicado cuando coinciden:

```text
título + contenido
```

Por eso, restaurar varias veces el mismo backup no continúa agregando copias idénticas.

Este comportamiento está cubierto por tests automatizados en:

```text
tests/backupMerge.test.ts
```

---

## Controles automatizados

El proyecto actualmente dispone de:

```bash
npm test
npm run lint
npm run build
```

La suite de tests incluye verificaciones sobre el merge de backups y la validación de nombres de usuario.

---

## Builds y releases para Windows

Los builds de Windows se generan localmente con `electron-builder`.

El proyecto puede producir:

```text
MyVault2-Setup-<version>.exe
MyVault2-Portable-<version>.exe
```

El release público actual fue compilado, probado y publicado manualmente mediante GitHub Releases.

Antes de publicar una versión se pueden ejecutar localmente:

```bash
npm test
npm run lint
npm run build
npm run dist
```

También se pueden generar checksums SHA-256 para los ejecutables finales y publicarlos junto con los artifacts del release.

---

## Descarga

La versión para Windows se encuentra en:

[GitHub Releases](https://github.com/SurvilaDeveloper/MyVault2/releases)

Los archivos publicados incluyen:

```text
MyVault2-Setup-<version>.exe
MyVault2-Portable-<version>.exe
```

### Advertencia de Windows

Los ejecutables actualmente no cuentan con firma digital de código.

Por ese motivo, Windows Defender / SmartScreen puede mostrar una advertencia de editor desconocido incluso cuando el archivo fue descargado desde este repositorio.

Al utilizar una versión publicada, verificá que provenga del repositorio oficial y compará su checksum SHA-256 cuando esté disponible.

---

## Ejecutar desde el código fuente

### Requisitos

- Node.js 22.12 o superior
- npm

Clonar:

```bash
git clone https://github.com/SurvilaDeveloper/MyVault2.git
cd MyVault2
```

Instalar dependencias:

```bash
npm ci
```

Modo desarrollo:

```bash
npm run dev
```

Tests:

```bash
npm test
```

Lint:

```bash
npm run lint
```

Build:

```bash
npm run build
```

Generar instalador y portable para Windows:

```bash
npm run dist
```

---

## Estructura del proyecto

Áreas principales del código:

```text
MyVault2/
├── electron/
│   ├── auth.ts
│   ├── backup.ts
│   ├── backupMerge.ts
│   ├── main.ts
│   ├── notesVault.ts
│   ├── preload.ts
│   ├── username.ts
│   └── vault.ts
│
├── src/
│   ├── App.tsx
│   ├── components/
│   ├── styles/
│   └── types/
│
├── tests/
│   ├── backupMerge.test.ts
│   └── username.test.ts
│
└── package.json
```

---

## Release actual

Última versión documentada:

```text
v1.2.0
```

Incluye instalador y ejecutable portable para Windows.

---

## Próximas mejoras

Posibles mejoras futuras:

- Agregar capturas de pantalla al repositorio
- Ampliar la cobertura de tests automatizados
- Agregar más tests de recuperación y archivos dañados
- Incorporar un generador de contraseñas
- Mejorar accesibilidad y UX
- Explorar empaquetado para Linux y macOS
- Incorporar firma digital de código para Windows
- Continuar revisando el modelo de seguridad y la superficie IPC

---

## Licencia

MyVault2 se distribuye bajo la [Licencia MIT](LICENSE).

Copyright © 2026 Gabriel Survila.

---

## Autor

**Gabriel Survila**

- GitHub: [SurvilaDeveloper](https://github.com/SurvilaDeveloper)
- Email: surviladeveloper@gmail.com

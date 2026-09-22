# MyVault2

[Español](README_ES.md)

[![Release](https://img.shields.io/github/v/release/SurvilaDeveloper/MyVault2)](https://github.com/SurvilaDeveloper/MyVault2/releases)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-Desktop-47848F)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)](https://www.typescriptlang.org/)

**MyVault2** is a local-first desktop application for storing passwords and private notes on Windows.

It is built with **Electron, React and TypeScript** and is designed around a simple principle: the user's vault stays on the local device instead of depending on a cloud backend.

The project includes encrypted local storage, user accounts, backup and recovery workflows, automated tests, linting, Windows packaging, installer/portable builds and published releases.

> MyVault2 is a personal software project and has not undergone an independent professional security audit. It should not be presented as a replacement for a professionally audited password manager.

---

## Portfolio highlights

MyVault2 demonstrates work across several areas of desktop application development:

- Electron main / preload / renderer architecture
- React + TypeScript user interface
- encrypted local persistence
- authentication and password hashing
- AES-256-GCM encryption
- key derivation with scrypt
- controlled IPC through `contextBridge`
- backup and recovery design
- integrity checks with SHA-256
- idempotent backup merge logic
- automated tests
- ESLint-based static checks
- Windows packaging with electron-builder
- NSIS installer and portable executable
- GitHub Releases distribution

---

## Features

### Password vault

- Store account names, usernames and passwords
- Add, edit and delete entries
- Show or hide individual passwords
- Copy secrets to the clipboard
- Automatic secret removal from the clipboard after 30 seconds
- Encrypted local persistence

### Secure notes

- Create, edit and delete private notes
- Search notes by title
- Detect unsaved changes
- Prompt before navigating away from unsaved notes
- Automatic save before inactivity logout when needed
- Encrypted local persistence

### User accounts

- Multiple local users
- Separate login password and master password
- Change login password
- Change master password
- Delete local user and associated encrypted data
- Automatic logout after 5 minutes of inactivity

### Backup and recovery

- Export an encrypted recovery folder
- Open external backups in read-only mode
- Inspect password and note contents before restoring
- Restore into an existing local user
- Preserve existing local records
- Skip duplicate entries during repeated restores
- Validate backup file size and SHA-256 checksum
- Reject unsafe or malformed backup paths/files

---

## Security-oriented design

MyVault2 includes several security-focused implementation choices.

### Vault encryption

Password and note vaults are encrypted using:

```text
AES-256-GCM
```

A new random salt and IV are generated for each encryption operation.

Encryption keys are derived from the master password using:

```text
scrypt
```

The encrypted file stores:

```text
salt
iv
authentication tag
ciphertext
```

AES-GCM provides authenticated encryption, allowing modified or invalid encrypted data to be detected during decryption.

### Authentication credentials

Login passwords and master-password verification values are stored as hashes using:

```text
bcrypt
```

Plaintext login passwords are not persisted.

### Electron isolation

The main browser window is configured with:

```text
contextIsolation: true
nodeIntegration: false
sandbox: true
```

The renderer communicates with the Electron main process through a limited API exposed by the preload script with `contextBridge`.

Navigation is restricted, new windows are denied, and allowed external links are opened through the operating system browser.

### Clipboard handling

Passwords copied through the secret-copy action are automatically removed from the clipboard after:

```text
30 seconds
```

### Local-only architecture

The application does not require a remote backend for normal use.

Application data is stored under the Windows user profile in the MyVault2 application data directory.

---

## Architecture

```text
┌──────────────────────────────┐
│ React Renderer               │
│                              │
│ UI / Passwords / Notes       │
└──────────────┬───────────────┘
               │
               │ limited API
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
│ Authentication               │
│ Vault encryption             │
│ Notes encryption             │
│ Backup / recovery            │
│ Clipboard handling           │
│ File-system access           │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Local encrypted files        │
└──────────────────────────────┘
```

---

## Main technologies

### Application

- Electron 44
- React 18
- TypeScript 5
- Vite 8
- bcryptjs
- Lucide React

### Tooling

- Node.js 22+
- ESLint
- Node test runner
- electron-builder

### Windows distribution

- NSIS installer
- Portable `.exe`
- SHA-256 release checksums

---

## Local data

Each user has separate encrypted password and note files.

Conceptually:

```text
MyVault2/
├── auth.json
├── vaults/
│   ├── username.vault
│   └── username.notes.vault
└── session/
```

`auth.json` contains password hashes, not plaintext passwords.

Vault and note contents are stored encrypted.

---

## Backup format

A backup contains encrypted password and note files plus a recovery manifest:

```text
MyVault2-Backup-<timestamp>/
├── recovery.json
├── <encrypted password vault>
└── <encrypted notes vault>
```

The recovery manifest records metadata such as:

- recovery format
- format version
- creation time
- application version
- username
- file sizes
- SHA-256 checksums

Before opening a recovery file, MyVault2 validates its manifest, size and checksum.

External backups are opened in **read-only mode** until the user explicitly chooses to restore them.

---

## Recovery merge behavior

Restoration is designed to preserve existing local data.

For passwords, a record is considered duplicated only when these values match:

```text
account + username + password
```

For notes, a record is considered duplicated when these values match:

```text
title + content
```

Repeatedly restoring the same backup therefore does not keep adding identical copies.

This merge behavior has automated tests under:

```text
tests/backupMerge.test.ts
```

---

## Automated checks

The project currently provides:

```bash
npm test
npm run lint
npm run build
```

The test suite includes coverage for backup merge behavior and username validation.

---

## Windows builds and releases

Windows builds are generated locally with `electron-builder`.

The project can produce:

```text
MyVault2-Setup-<version>.exe
MyVault2-Portable-<version>.exe
```

The current public release was built, tested and published manually through GitHub Releases.

Before publishing a release, the application can be checked locally with:

```bash
npm test
npm run lint
npm run build
npm run dist
```

SHA-256 checksums can be generated for the final executables and published alongside the release artifacts.

---

## Download

The current Windows release is available from:

[GitHub Releases](https://github.com/SurvilaDeveloper/MyVault2/releases)

Release artifacts include:

```text
MyVault2-Setup-<version>.exe
MyVault2-Portable-<version>.exe
```

### Windows warning

The executables are not digitally code-signed.

Windows Defender / SmartScreen may therefore show an unknown-publisher warning even when the executable was downloaded from this repository.

When using a release, verify that it comes from the official repository and compare its SHA-256 checksum when provided.

---

## Running from source

### Requirements

- Node.js 22.12 or newer
- npm

Clone the repository:

```bash
git clone https://github.com/SurvilaDeveloper/MyVault2.git
cd MyVault2
```

Install dependencies:

```bash
npm ci
```

Run in development mode:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

Run lint:

```bash
npm run lint
```

Build:

```bash
npm run build
```

Generate Windows installer and portable application:

```bash
npm run dist
```

---

## Project structure

Main source areas:

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

## Current release

Latest documented release:

```text
v1.2.0
```

It includes Windows installer and portable executables.

---

## Roadmap

Possible future improvements:

- Add application screenshots to the repository
- Expand automated test coverage
- Add more recovery and corruption tests
- Add a password generator
- Improve accessibility and UX
- Explore Linux and macOS packaging
- Add optional code signing for Windows releases
- Continue reviewing the security model and IPC surface

---

## License

MyVault2 is distributed under the [MIT License](LICENSE).

Copyright © 2026 Gabriel Survila.

---

## Author

**Gabriel Survila**

- GitHub: [SurvilaDeveloper](https://github.com/SurvilaDeveloper)
- Email: surviladeveloper@gmail.com

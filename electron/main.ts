//electron/main.ts
import {
    app,
    BrowserWindow,
    ipcMain,
    nativeTheme,
    Menu,
    shell,
    clipboard,
    dialog,
    type IpcMainInvokeEvent,
    type MenuItemConstructorOptions,
} from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdirSync } from 'node:fs'
import fs from 'node:fs/promises'
import {
    createUser,
    login,
    logout,
    getCurrentUser,
    verifyLoginPassword,
    verifyVaultPassword,
    deleteCurrentUser,
    changeLoginPassword,
    updateVaultPasswordHash,
    cleanupAuthTempFile,
} from './auth'
import {
    loadVault,
    saveVault,
    encryptVaultData,
    replaceVaultFileAtomically,
    cleanupVaultTempFile,
    type VaultData,
} from './vault'
import {
    loadNotesVault,
    saveNotesVault,
    encryptNotesData,
    replaceNotesFileAtomically,
    cleanupNotesTempFile,
    type NotesData,
} from './notesVault'
import {
    createRecoveryBackup,
    openRecoveryBackup,
    type OpenedRecoveryBackup,
} from './backup'
import { mergeRecoveryData } from './backupMerge'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const APP_NAME = 'MyVault2'
app.setName(APP_NAME)

const APP_USER_DATA_PATH = path.join(app.getPath('appData'), APP_NAME)
const APP_SESSION_DATA_PATH = path.join(APP_USER_DATA_PATH, 'session')

mkdirSync(APP_USER_DATA_PATH, { recursive: true })
mkdirSync(APP_SESSION_DATA_PATH, { recursive: true })
app.setPath('userData', APP_USER_DATA_PATH)
app.setPath('sessionData', APP_SESSION_DATA_PATH)

let win: BrowserWindow | null = null
let helpWin: BrowserWindow | null = null
let aboutMyVaultWin: BrowserWindow | null = null
let aboutWin: BrowserWindow | null = null

let unlockedVaultPassword: string | null = null
let hasUnsavedNoteChanges = false
let isForceClosing = false
let closePromptPending = false
let clipboardClearTimeout: NodeJS.Timeout | null = null
let lastCopiedSecret: string | null = null
let openedRecoveryBackup: OpenedRecoveryBackup | null = null

const isDev = !app.isPackaged
const WINDOW_BACKGROUND = '#020617'
const AUX_WINDOW_BACKGROUND = '#0f172a'
const CLIPBOARD_AUTO_CLEAR_MS = 30_000

function getWindowIconPath() {
    if (isDev) {
        return path.join(app.getAppPath(), 'public', 'myvault.png')
    }

    return path.join(__dirname, '../dist-renderer/myvault.png')
}

function applyNativeDarkTheme() {
    nativeTheme.themeSource = 'dark'
}

function getPreloadPath() {
    return path.join(__dirname, 'preload.mjs')
}

function getHelpPath() {
    return path.join(__dirname, '../dist-renderer/help.html')
}

function getAboutMyVaultPath() {
    return path.join(__dirname, '../dist-renderer/about-myvault.html')
}

function getAboutPath() {
    return path.join(__dirname, '../dist-renderer/about.html')
}

function isAllowedUrl(url: string) {
    if (isDev) {
        return url.startsWith('http://localhost:5173')
    }

    return url.startsWith('file://')
}

function isSafeExternalUrl(url: string) {
    return (
        url.startsWith('https://') ||
        url.startsWith('http://') ||
        url.startsWith('mailto:')
    )
}

function hardenWindow(target: BrowserWindow) {
    target.webContents.on('will-navigate', (event, url) => {
        if (isAllowedUrl(url)) return

        event.preventDefault()

        if (isSafeExternalUrl(url)) {
            void shell.openExternal(url)
        }
    })

    target.webContents.setWindowOpenHandler(({ url }) => {
        if (isSafeExternalUrl(url)) {
            void shell.openExternal(url)
        }

        return { action: 'deny' }
    })

    if (!isDev) {
        target.webContents.on('devtools-opened', () => {
            target.webContents.closeDevTools()
        })
    }
}

function createWindow() {
    isForceClosing = false
    closePromptPending = false

    applyNativeDarkTheme()

    win = new BrowserWindow({
        width: 1180,
        height: 730,
        minWidth: 256,
        minHeight: 256,
        title: APP_NAME,
        icon: getWindowIconPath(),
        backgroundColor: WINDOW_BACKGROUND,
        autoHideMenuBar: false,
        webPreferences: {
            preload: getPreloadPath(),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
    })

    win.setBackgroundColor(WINDOW_BACKGROUND)
    hardenWindow(win)

    win.on('close', (event) => {
        if (isForceClosing) return

        if (hasUnsavedNoteChanges) {
            event.preventDefault()

            if (!closePromptPending) {
                closePromptPending = true
                win?.webContents.send('app:close-requested')
            }
        }
    })

    if (isDev) {
        void win.loadURL('http://localhost:5173')
    } else {
        void win.loadFile(path.join(__dirname, '../dist-renderer/index.html'))
    }
}

function openHelpWindow() {
    if (helpWin && !helpWin.isDestroyed()) {
        helpWin.focus()
        return
    }

    helpWin = new BrowserWindow({
        width: 920,
        height: 700,
        minWidth: 760,
        minHeight: 560,
        title: `Documentación - ${APP_NAME}`,
        icon: getWindowIconPath(),
        backgroundColor: AUX_WINDOW_BACKGROUND,
        autoHideMenuBar: true,
        resizable: true,
        maximizable: true,
        minimizable: true,
        parent: win ?? undefined,
        webPreferences: {
            preload: getPreloadPath(),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
    })

    helpWin.setBackgroundColor(AUX_WINDOW_BACKGROUND)
    hardenWindow(helpWin)

    helpWin.on('closed', () => {
        helpWin = null
    })

    if (isDev) {
        void helpWin.loadURL('http://localhost:5173/help.html')
    } else {
        void helpWin.loadFile(getHelpPath())
    }
}

function openAboutMyVaultWindow() {
    if (aboutMyVaultWin && !aboutMyVaultWin.isDestroyed()) {
        aboutMyVaultWin.focus()
        return
    }

    aboutMyVaultWin = new BrowserWindow({
        width: 860,
        height: 720,
        minWidth: 700,
        minHeight: 520,
        title: `Acerca de ${APP_NAME}`,
        icon: getWindowIconPath(),
        backgroundColor: AUX_WINDOW_BACKGROUND,
        autoHideMenuBar: true,
        resizable: true,
        maximizable: true,
        minimizable: true,
        parent: win ?? undefined,
        webPreferences: {
            preload: getPreloadPath(),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
    })

    aboutMyVaultWin.setBackgroundColor(AUX_WINDOW_BACKGROUND)
    hardenWindow(aboutMyVaultWin)

    aboutMyVaultWin.on('closed', () => {
        aboutMyVaultWin = null
    })

    if (isDev) {
        void aboutMyVaultWin.loadURL('http://localhost:5173/about-myvault.html')
    } else {
        void aboutMyVaultWin.loadFile(getAboutMyVaultPath())
    }
}

function openAboutWindow() {
    if (aboutWin && !aboutWin.isDestroyed()) {
        aboutWin.focus()
        return
    }

    aboutWin = new BrowserWindow({
        width: 530,
        height: 530,
        minWidth: 530,
        minHeight: 530,
        title: 'Información del proyecto',
        icon: getWindowIconPath(),
        backgroundColor: AUX_WINDOW_BACKGROUND,
        autoHideMenuBar: true,
        maximizable: false,
        minimizable: true,
        resizable: false,
        parent: win ?? undefined,
        modal: false,
        webPreferences: {
            preload: getPreloadPath(),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
    })

    aboutWin.setBackgroundColor(AUX_WINDOW_BACKGROUND)
    aboutWin.center()
    hardenWindow(aboutWin)

    aboutWin.on('closed', () => {
        aboutWin = null
    })

    if (isDev) {
        void aboutWin.loadURL('http://localhost:5173/about.html')
    } else {
        void aboutWin.loadFile(getAboutPath())
    }
}

function createAppMenu() {
    const isMac = process.platform === 'darwin'

    const appSubmenu: MenuItemConstructorOptions[] = [
        {
            label: `About ${APP_NAME}`,
            click: () => openAboutMyVaultWindow(),
        },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
    ]

    const fileSubmenu: MenuItemConstructorOptions[] = isMac ? [] : [{ role: 'quit' }]

    const editSubmenu: MenuItemConstructorOptions[] = isMac
        ? [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            { role: 'pasteAndMatchStyle' },
            { role: 'delete' },
            { role: 'selectAll' },
        ]
        : [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            { role: 'selectAll' },
        ]

    const viewSubmenu: MenuItemConstructorOptions[] = [
        ...(isDev
            ? [
                { role: 'reload' as const },
                { role: 'forceReload' as const },
                { role: 'toggleDevTools' as const },
                { type: 'separator' as const },
            ]
            : []),
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
    ]

    const windowSubmenu: MenuItemConstructorOptions[] = isMac
        ? [{ role: 'minimize' }, { role: 'zoom' }, { type: 'separator' }, { role: 'front' }]
        : [{ role: 'minimize' }, { role: 'close' }]

    const helpSubmenu: MenuItemConstructorOptions[] = [
        {
            label: 'Documentación',
            click: () => openHelpWindow(),
        },
        {
            label: `Acerca de ${APP_NAME}`,
            click: () => openAboutMyVaultWindow(),
        },
        {
            label: 'Información del proyecto',
            click: () => openAboutWindow(),
        },
    ]

    const template: MenuItemConstructorOptions[] = [
        ...(isMac
            ? [
                {
                    label: app.name,
                    submenu: appSubmenu,
                },
            ]
            : []),
        {
            label: 'File',
            submenu: fileSubmenu,
        },
        {
            label: 'Edit',
            submenu: editSubmenu,
        },
        {
            label: 'View',
            submenu: viewSubmenu,
        },
        {
            label: 'Window',
            submenu: windowSubmenu,
        },
        {
            label: 'Help',
            submenu: helpSubmenu,
        },
    ]

    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
}

function vaultFilePath(username: string) {
    return path.join(app.getPath('userData'), 'vaults', `${username}.vault`)
}

function notesFilePath(username: string) {
    return path.join(app.getPath('userData'), 'vaults', `${username}.notes.vault`)
}

function clearClipboardAutoClearTimer() {
    if (clipboardClearTimeout) {
        clearTimeout(clipboardClearTimeout)
        clipboardClearTimeout = null
    }
}

async function resetClipboardSecretTracking() {
    clearClipboardAutoClearTimer()
    const secretToClear = lastCopiedSecret
    lastCopiedSecret = null

    if (!secretToClear) return

    try {
        const currentClipboard = await clipboard.readText()

        if (currentClipboard === secretToClear) {
            clipboard.clear()
        }
    } catch {
        // La limpieza de estado debe continuar aunque el portapapeles no esté disponible.
    }
}

async function copySecretToClipboardWithAutoClear(secret: string) {
    await clipboard.writeText(secret)
    lastCopiedSecret = secret

    clearClipboardAutoClearTimer()

    clipboardClearTimeout = setTimeout(() => {
        void (async () => {
            try {
                const currentClipboard = await clipboard.readText()

                if (lastCopiedSecret && currentClipboard === lastCopiedSecret) {
                    clipboard.clear()
                }
            } catch {
                // El cierre de sesión no debe fallar si el portapapeles no está disponible.
            } finally {
                clipboardClearTimeout = null
                lastCopiedSecret = null
            }
        })()
    }, CLIPBOARD_AUTO_CLEAR_MS)
}

function isTrustedIpcSender(event: IpcMainInvokeEvent) {
    return !!win && !win.isDestroyed() && event.sender === win.webContents
}

function backupSummary(backup: OpenedRecoveryBackup) {
    return {
        displayName: backup.displayName,
        createdAt: backup.manifest.createdAt,
        appVersion: backup.manifest.appVersion,
        username: backup.manifest.username,
        entries: backup.vaultData.entries,
        notes: backup.notesData.notes,
        passwordCount: backup.vaultData.entries.length,
        noteCount: backup.notesData.notes.length,
    }
}

async function cleanupMasterPasswordChangeTempFiles(username: string) {
    await Promise.allSettled([
        cleanupVaultTempFile(username),
        cleanupNotesTempFile(username),
        cleanupAuthTempFile(),
    ])
}

ipcMain.handle('app:get-version', () => {
    return app.getVersion()
})

ipcMain.handle('app:copy-to-clipboard', async (_event, text: string) => {
    await clipboard.writeText(text)
    return { ok: true }
})

ipcMain.handle('app:copy-secret-to-clipboard', async (_event, text: string) => {
    try {
        if (typeof text !== 'string') {
            return {
                ok: false,
                error: 'No se pudo copiar el contenido al portapapeles.',
            }
        }

        await copySecretToClipboardWithAutoClear(text)
        return { ok: true }
    } catch (error) {
        return {
            ok: false,
            error:
                error instanceof Error
                    ? error.message
                    : 'No se pudo copiar el contenido al portapapeles.',
        }
    }
})

ipcMain.handle(
    'auth:create',
    async (_event, username: string, password: string, vaultPassword: string) => {
        try {
            return await createUser(username, password, vaultPassword)
        } catch (error) {
            return {
                ok: false,
                error: error instanceof Error ? error.message : 'No se pudo crear el usuario.',
            }
        }
    },
)

ipcMain.handle('auth:login', async (_event, username: string, password: string) => {
    try {
        unlockedVaultPassword = null
        openedRecoveryBackup = null
        return await login(username, password)
    } catch (error) {
        return {
            ok: false,
            error: error instanceof Error ? error.message : 'No se pudo iniciar sesión.',
        }
    }
})

ipcMain.handle('auth:unlockVault', async (_event, vaultPassword: string) => {
    try {
        const user = getCurrentUser()

        if (!user) {
            return {
                ok: false,
                error: 'No hay sesión iniciada.',
            }
        }

        const result = await verifyVaultPassword(user, vaultPassword)

        if (!result.ok) {
            return result
        }

        unlockedVaultPassword = vaultPassword

        return { ok: true }
    } catch (error) {
        return {
            ok: false,
            error: error instanceof Error ? error.message : 'No se pudo desbloquear el vault.',
        }
    }
})

ipcMain.handle(
    'auth:changeLoginPassword',
    async (_event, currentPassword: string, newPassword: string) => {
        try {
            if (openedRecoveryBackup) {
                return {
                    ok: false,
                    error: 'Cerrá el respaldo externo antes de cambiar la contraseña.',
                }
            }

            const user = getCurrentUser()

            if (!user) {
                return {
                    ok: false,
                    error: 'No hay sesión iniciada.',
                }
            }

            return await changeLoginPassword(user, currentPassword, newPassword)
        } catch (error) {
            return {
                ok: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'No se pudo cambiar la contraseña de login.',
            }
        }
    },
)

ipcMain.handle(
    'auth:changeVaultPassword',
    async (_event, currentVaultPassword: string, newVaultPassword: string) => {
        if (openedRecoveryBackup) {
            return {
                ok: false,
                error: 'Cerrá el respaldo externo antes de cambiar la master password.',
            }
        }

        const user = getCurrentUser()

        if (!user) {
            return {
                ok: false,
                error: 'No hay sesión iniciada.',
            }
        }

        if (!currentVaultPassword.trim()) {
            return {
                ok: false,
                error: 'La master password actual no puede estar vacía.',
            }
        }

        if (!newVaultPassword.trim()) {
            return {
                ok: false,
                error: 'La nueva master password no puede estar vacía.',
            }
        }

        if (currentVaultPassword === newVaultPassword) {
            return {
                ok: false,
                error: 'La nueva master password no puede ser igual a la actual.',
            }
        }

        try {
            const verifyResult = await verifyVaultPassword(user, currentVaultPassword)

            if (!verifyResult.ok) {
                return verifyResult
            }

            const vaultData = await loadVault(user, currentVaultPassword)
            const notesData = await loadNotesVault(user, currentVaultPassword)

            const newVaultPayload = encryptVaultData(newVaultPassword, vaultData)
            const newNotesPayload = encryptNotesData(newVaultPassword, notesData)

            await replaceVaultFileAtomically(user, newVaultPayload)
            await replaceNotesFileAtomically(user, newNotesPayload)

            const updateHashResult = await updateVaultPasswordHash(user, newVaultPassword)

            if (!updateHashResult.ok) {
                return updateHashResult
            }

            unlockedVaultPassword = newVaultPassword

            return { ok: true }
        } catch (error) {
            await cleanupMasterPasswordChangeTempFiles(user)

            return {
                ok: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'No se pudo cambiar la master password.',
            }
        }
    },
)

ipcMain.handle('auth:logout', async () => {
    logout()
    unlockedVaultPassword = null
    openedRecoveryBackup = null
    hasUnsavedNoteChanges = false
    await resetClipboardSecretTracking()
    return { ok: true }
})

ipcMain.handle('auth:deleteCurrentUser', async () => {
    try {
        if (openedRecoveryBackup) {
            return {
                ok: false,
                error: 'Cerrá el respaldo externo antes de eliminar el usuario.',
            }
        }

        const current = getCurrentUser()

        if (!current) {
            return {
                ok: false,
                error: 'No hay usuario logueado.',
            }
        }

        const result = await deleteCurrentUser()

        const vaultPath = vaultFilePath(current)
        await fs.rm(vaultPath, { force: true })

        const notesPath = notesFilePath(current)
        await fs.rm(notesPath, { force: true })

        unlockedVaultPassword = null
        openedRecoveryBackup = null
        hasUnsavedNoteChanges = false
        await resetClipboardSecretTracking()

        return result
    } catch (error) {
        return {
            ok: false,
            error: error instanceof Error ? error.message : 'No se pudo eliminar el usuario.',
        }
    }
})

ipcMain.handle(
    'backup:export',
    async (event, loginPassword: string, vaultPassword: string) => {
        if (!isTrustedIpcSender(event)) {
            return { ok: false, error: 'Solicitud de respaldo no autorizada.' }
        }

        const user = getCurrentUser()
        const targetWindow = win

        if (!user || !unlockedVaultPassword || !targetWindow) {
            return {
                ok: false,
                error: 'Vault bloqueado o sesión inexistente.',
            }
        }

        if (openedRecoveryBackup) {
            return {
                ok: false,
                error: 'Cerrá el respaldo externo antes de crear una copia local.',
            }
        }

        if (typeof loginPassword !== 'string' || typeof vaultPassword !== 'string') {
            return { ok: false, error: 'Las credenciales del respaldo son inválidas.' }
        }

        try {
            const loginResult = await verifyLoginPassword(user, loginPassword)

            if (!loginResult.ok) return loginResult

            const vaultResult = await verifyVaultPassword(user, vaultPassword)

            if (!vaultResult.ok) return vaultResult

            const selection = await dialog.showOpenDialog(targetWindow, {
                title: 'Elegir dónde guardar el respaldo de MyVault2',
                buttonLabel: 'Guardar respaldo aquí',
                properties: ['openDirectory', 'createDirectory'],
            })

            if (selection.canceled || selection.filePaths.length === 0) {
                return { ok: false, canceled: true }
            }

            const [vaultData, notesData] = await Promise.all([
                loadVault(user, vaultPassword),
                loadNotesVault(user, vaultPassword),
            ])

            const backup = await createRecoveryBackup({
                destinationRoot: selection.filePaths[0],
                username: user,
                appVersion: app.getVersion(),
                vaultPassword,
                vaultData,
                notesData,
            })

            return {
                ok: true,
                path: backup.directoryPath,
                displayName: backup.displayName,
                createdAt: backup.manifest.createdAt,
            }
        } catch (error) {
            return {
                ok: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'No se pudo crear el respaldo cifrado.',
            }
        }
    },
)

ipcMain.handle('backup:open', async (event, vaultPassword: string) => {
    if (!isTrustedIpcSender(event)) {
        return { ok: false, error: 'Solicitud de apertura no autorizada.' }
    }

    const user = getCurrentUser()
    const targetWindow = win

    if (!user || !unlockedVaultPassword || !targetWindow) {
        return {
            ok: false,
            error: 'Vault bloqueado o sesión inexistente.',
        }
    }

    if (typeof vaultPassword !== 'string' || !vaultPassword) {
        return { ok: false, error: 'Ingresá la master password del respaldo.' }
    }

    try {
        const selection = await dialog.showOpenDialog(targetWindow, {
            title: 'Elegir respaldo de MyVault2',
            buttonLabel: 'Abrir respaldo',
            properties: ['openDirectory'],
        })

        if (selection.canceled || selection.filePaths.length === 0) {
            return { ok: false, canceled: true }
        }

        const backup = await openRecoveryBackup(selection.filePaths[0], vaultPassword)
        openedRecoveryBackup = backup

        return {
            ok: true,
            backup: backupSummary(backup),
        }
    } catch (error) {
        return {
            ok: false,
            error:
                error instanceof Error
                    ? error.message
                    : 'No se pudo abrir el respaldo seleccionado.',
        }
    }
})

ipcMain.handle('backup:close', async (event) => {
    if (!isTrustedIpcSender(event)) {
        return { ok: false, error: 'Solicitud de cierre no autorizada.' }
    }

    openedRecoveryBackup = null
    await resetClipboardSecretTracking()
    return { ok: true }
})

ipcMain.handle(
    'backup:restore',
    async (event, loginPassword: string, currentVaultPassword: string) => {
        if (!isTrustedIpcSender(event)) {
            return { ok: false, error: 'Solicitud de restauración no autorizada.' }
        }

        const user = getCurrentUser()
        const backup = openedRecoveryBackup

        if (!user || !unlockedVaultPassword) {
            return {
                ok: false,
                error: 'Vault bloqueado o sesión inexistente.',
            }
        }

        if (!backup) {
            return {
                ok: false,
                error: 'No hay ningún respaldo externo abierto.',
            }
        }

        if (
            typeof loginPassword !== 'string' ||
            typeof currentVaultPassword !== 'string'
        ) {
            return { ok: false, error: 'Las credenciales de restauración son inválidas.' }
        }

        try {
            const loginResult = await verifyLoginPassword(user, loginPassword)

            if (!loginResult.ok) return loginResult

            const vaultResult = await verifyVaultPassword(user, currentVaultPassword)

            if (!vaultResult.ok) return vaultResult

            const [currentVault, currentNotes] = await Promise.all([
                loadVault(user, currentVaultPassword),
                loadNotesVault(user, currentVaultPassword),
            ])

            const merged = mergeRecoveryData(
                currentVault,
                currentNotes,
                backup.vaultData,
                backup.notesData,
            )

            const vaultPayload = merged.addedPasswordCount > 0
                ? encryptVaultData(currentVaultPassword, merged.vaultData)
                : null
            const notesPayload = merged.addedNoteCount > 0
                ? encryptNotesData(currentVaultPassword, merged.notesData)
                : null
            const previousVaultPayload = vaultPayload
                ? encryptVaultData(currentVaultPassword, currentVault)
                : null
            const previousNotesPayload = notesPayload
                ? encryptNotesData(currentVaultPassword, currentNotes)
                : null

            try {
                if (vaultPayload) await replaceVaultFileAtomically(user, vaultPayload)
                if (notesPayload) await replaceNotesFileAtomically(user, notesPayload)
            } catch (writeError) {
                const rollback = await Promise.allSettled([
                    ...(previousVaultPayload
                        ? [replaceVaultFileAtomically(user, previousVaultPayload)]
                        : []),
                    ...(previousNotesPayload
                        ? [replaceNotesFileAtomically(user, previousNotesPayload)]
                        : []),
                ])

                if (rollback.some((result) => result.status === 'rejected')) {
                    throw new Error(
                        'La restauración falló y no se pudo revertir por completo. Revisá los datos locales antes de volver a intentarlo.',
                    )
                }

                throw writeError
            }

            openedRecoveryBackup = null
            await resetClipboardSecretTracking()

            return {
                ok: true,
                addedPasswordCount: merged.addedPasswordCount,
                skippedPasswordCount: merged.skippedPasswordCount,
                addedNoteCount: merged.addedNoteCount,
                skippedNoteCount: merged.skippedNoteCount,
                entries: merged.vaultData.entries,
                notes: merged.notesData.notes,
            }
        } catch (error) {
            await Promise.allSettled([
                cleanupVaultTempFile(user),
                cleanupNotesTempFile(user),
            ])

            return {
                ok: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'No se pudo restaurar el respaldo.',
            }
        }
    },
)

ipcMain.handle('vault:load', async () => {
    const user = getCurrentUser()

    if (!user || !unlockedVaultPassword) {
        return {
            ok: false,
            error: 'Vault bloqueado o sesión inexistente.',
            entries: [],
        }
    }

    try {
        const vault = await loadVault(user, unlockedVaultPassword)
        return {
            ok: true,
            entries: vault.entries,
        }
    } catch (error) {
        return {
            ok: false,
            error: error instanceof Error ? error.message : 'No se pudo cargar el vault.',
            entries: [],
        }
    }
})

ipcMain.handle('vault:save', async (_event, data: VaultData) => {
    const user = getCurrentUser()

    if (!user || !unlockedVaultPassword) {
        return {
            ok: false,
            error: 'Vault bloqueado o sesión inexistente.',
        }
    }

    if (openedRecoveryBackup) {
        return {
            ok: false,
            error: 'El respaldo externo está abierto en modo de solo lectura.',
        }
    }

    try {
        await saveVault(user, unlockedVaultPassword, data)
        return { ok: true }
    } catch (error) {
        return {
            ok: false,
            error: error instanceof Error ? error.message : 'No se pudo guardar el vault.',
        }
    }
})

ipcMain.handle('notes:load', async () => {
    const user = getCurrentUser()

    if (!user || !unlockedVaultPassword) {
        return {
            ok: false,
            error: 'Anotaciones bloqueadas o sesión inexistente.',
            notes: [],
        }
    }

    try {
        const notes = await loadNotesVault(user, unlockedVaultPassword)
        return {
            ok: true,
            notes: notes.notes,
        }
    } catch (error) {
        return {
            ok: false,
            error: error instanceof Error ? error.message : 'No se pudieron cargar las anotaciones.',
            notes: [],
        }
    }
})

ipcMain.handle('notes:save', async (_event, data: NotesData) => {
    const user = getCurrentUser()

    if (!user || !unlockedVaultPassword) {
        return {
            ok: false,
            error: 'Anotaciones bloqueadas o sesión inexistente.',
        }
    }

    if (openedRecoveryBackup) {
        return {
            ok: false,
            error: 'El respaldo externo está abierto en modo de solo lectura.',
        }
    }

    try {
        await saveNotesVault(user, unlockedVaultPassword, data)
        return { ok: true }
    } catch (error) {
        return {
            ok: false,
            error: error instanceof Error ? error.message : 'No se pudieron guardar las anotaciones.',
        }
    }
})

ipcMain.handle('app:set-unsaved-note-changes', async (_event, value: boolean) => {
    hasUnsavedNoteChanges = value
    return { ok: true }
})

ipcMain.handle('app:confirm-close-after-prompt', async () => {
    closePromptPending = false
    hasUnsavedNoteChanges = false
    isForceClosing = true
    win?.close()
    return { ok: true }
})

ipcMain.handle('app:cancel-close-after-prompt', async () => {
    closePromptPending = false
    return { ok: true }
})

app.whenReady().then(() => {
    applyNativeDarkTheme()
    createWindow()
    createAppMenu()
})

app.on('activate', () => {
    applyNativeDarkTheme()

    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
        createAppMenu()
    }
})

app.on('window-all-closed', () => {
    void resetClipboardSecretTracking()
    if (process.platform !== 'darwin') app.quit()
})

process.on('unhandledRejection', (err) => {
    console.error('[main] unhandledRejection', err)
})

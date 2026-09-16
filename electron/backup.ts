import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import {
    decryptVaultFile,
    encryptVaultData,
    isVaultFile,
    type VaultData,
} from './vault'
import {
    decryptNotesFile,
    encryptNotesData,
    isNotesFile,
    type NotesData,
} from './notesVault'

export const RECOVERY_MANIFEST_FILENAME = 'recovery.json'
export const RECOVERY_FORMAT = 'myvault2-recovery'
export const RECOVERY_FORMAT_VERSION = 1

const MAX_MANIFEST_BYTES = 1024 * 1024
const MAX_ENCRYPTED_FILE_BYTES = 50 * 1024 * 1024

type RecoveryFileDescriptor = {
    name: string
    sizeBytes: number
    sha256: string
}

export type RecoveryManifest = {
    format: typeof RECOVERY_FORMAT
    formatVersion: typeof RECOVERY_FORMAT_VERSION
    createdAt: string
    appVersion: string
    username: string
    files: {
        passwords: RecoveryFileDescriptor
        notes: RecoveryFileDescriptor
    }
}

export type OpenedRecoveryBackup = {
    directoryPath: string
    displayName: string
    manifest: RecoveryManifest
    vaultData: VaultData
    notesData: NotesData
}

type CreateRecoveryBackupOptions = {
    destinationRoot: string
    username: string
    appVersion: string
    vaultPassword: string
    vaultData: VaultData
    notesData: NotesData
    now?: Date
}

function sha256(content: string) {
    return crypto.createHash('sha256').update(content, 'utf8').digest('hex')
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value)
}

function isSafeRelativeFilename(value: string) {
    return (
        value.length > 0 &&
        value.length <= 255 &&
        value === path.basename(value) &&
        value !== '.' &&
        value !== '..' &&
        !value.includes('\0')
    )
}

function isRecoveryFileDescriptor(value: unknown): value is RecoveryFileDescriptor {
    if (!isRecord(value)) return false

    return (
        typeof value.name === 'string' &&
        isSafeRelativeFilename(value.name) &&
        typeof value.sizeBytes === 'number' &&
        Number.isSafeInteger(value.sizeBytes) &&
        value.sizeBytes > 0 &&
        value.sizeBytes <= MAX_ENCRYPTED_FILE_BYTES &&
        typeof value.sha256 === 'string' &&
        /^[a-f0-9]{64}$/i.test(value.sha256)
    )
}

function parseRecoveryManifest(raw: string): RecoveryManifest {
    let parsed: unknown

    try {
        parsed = JSON.parse(raw) as unknown
    } catch {
        throw new Error('El manifiesto del respaldo no contiene JSON válido.')
    }

    if (!isRecord(parsed) || !isRecord(parsed.files)) {
        throw new Error('El manifiesto del respaldo tiene un formato inválido.')
    }

    const passwords = parsed.files.passwords
    const notes = parsed.files.notes

    if (
        parsed.format !== RECOVERY_FORMAT ||
        parsed.formatVersion !== RECOVERY_FORMAT_VERSION ||
        typeof parsed.createdAt !== 'string' ||
        Number.isNaN(Date.parse(parsed.createdAt)) ||
        typeof parsed.appVersion !== 'string' ||
        !parsed.appVersion ||
        typeof parsed.username !== 'string' ||
        !parsed.username ||
        parsed.username.length > 128 ||
        !isRecoveryFileDescriptor(passwords) ||
        !isRecoveryFileDescriptor(notes) ||
        passwords.name === notes.name
    ) {
        throw new Error('El manifiesto del respaldo tiene un formato inválido o incompatible.')
    }

    return parsed as RecoveryManifest
}

async function readRegularTextFile(filePath: string, maxBytes: number) {
    let stat

    try {
        stat = await fs.lstat(filePath)
    } catch (error) {
        const isMissing =
            error instanceof Error &&
            'code' in error &&
            (error as NodeJS.ErrnoException).code === 'ENOENT'

        if (isMissing) {
            throw new Error(`Falta el archivo requerido: ${path.basename(filePath)}.`)
        }

        throw error
    }

    if (!stat.isFile() || stat.isSymbolicLink()) {
        throw new Error('El respaldo contiene un archivo no permitido.')
    }

    if (stat.size <= 0 || stat.size > maxBytes) {
        throw new Error('Uno de los archivos del respaldo tiene un tamaño inválido.')
    }

    return await fs.readFile(filePath, 'utf8')
}

function resolveBackupFile(directoryPath: string, filename: string) {
    if (!isSafeRelativeFilename(filename)) {
        throw new Error('El respaldo contiene un nombre de archivo no permitido.')
    }

    const root = path.resolve(directoryPath)
    const resolved = path.resolve(root, filename)

    if (!resolved.startsWith(`${root}${path.sep}`)) {
        throw new Error('El respaldo intenta acceder fuera de la carpeta seleccionada.')
    }

    return resolved
}

async function readVerifiedRecoveryFile(
    directoryPath: string,
    descriptor: RecoveryFileDescriptor,
) {
    const filePath = resolveBackupFile(directoryPath, descriptor.name)
    const raw = await readRegularTextFile(filePath, MAX_ENCRYPTED_FILE_BYTES)
    const actualSize = Buffer.byteLength(raw, 'utf8')

    if (actualSize !== descriptor.sizeBytes || sha256(raw) !== descriptor.sha256) {
        throw new Error(`El archivo ${descriptor.name} está incompleto o fue modificado.`)
    }

    return raw
}

function parseEncryptedJson(raw: string, label: string) {
    try {
        return JSON.parse(raw) as unknown
    } catch {
        throw new Error(`El archivo cifrado de ${label} no contiene JSON válido.`)
    }
}

function safeUsernameForFilename(username: string) {
    const normalized = username
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9._-]+/g, '_')
        .replace(/^\.+/, '')
        .slice(0, 80)

    return normalized || 'usuario'
}

function timestampForFolder(date: Date) {
    return date.toISOString().replace(/:/g, '-').replace(/\.\d{3}Z$/, 'Z')
}

async function pathExists(targetPath: string) {
    try {
        await fs.access(targetPath)
        return true
    } catch {
        return false
    }
}

async function chooseUniqueBackupPath(destinationRoot: string, now: Date) {
    const baseName = `MyVault2-Backup-${timestampForFolder(now)}`

    for (let suffix = 0; suffix < 1000; suffix += 1) {
        const name = suffix === 0 ? baseName : `${baseName}-${suffix}`
        const finalPath = path.join(destinationRoot, name)

        if (!(await pathExists(finalPath))) {
            return finalPath
        }
    }

    throw new Error('No se pudo crear un nombre único para el respaldo.')
}

function createDescriptor(name: string, content: string): RecoveryFileDescriptor {
    return {
        name,
        sizeBytes: Buffer.byteLength(content, 'utf8'),
        sha256: sha256(content),
    }
}

export async function openRecoveryBackup(
    directoryPath: string,
    vaultPassword: string,
): Promise<OpenedRecoveryBackup> {
    const manifestPath = path.join(directoryPath, RECOVERY_MANIFEST_FILENAME)
    const manifestRaw = await readRegularTextFile(manifestPath, MAX_MANIFEST_BYTES)
    const manifest = parseRecoveryManifest(manifestRaw)

    const [vaultRaw, notesRaw] = await Promise.all([
        readVerifiedRecoveryFile(directoryPath, manifest.files.passwords),
        readVerifiedRecoveryFile(directoryPath, manifest.files.notes),
    ])

    const parsedVault = parseEncryptedJson(vaultRaw, 'contraseñas')
    const parsedNotes = parseEncryptedJson(notesRaw, 'anotaciones')

    if (!isVaultFile(parsedVault) || !isNotesFile(parsedNotes)) {
        throw new Error('El respaldo contiene archivos cifrados con un formato inválido.')
    }

    try {
        const vaultData = decryptVaultFile(vaultPassword, parsedVault)
        const notesData = decryptNotesFile(vaultPassword, parsedNotes)

        return {
            directoryPath,
            displayName: path.basename(directoryPath),
            manifest,
            vaultData,
            notesData,
        }
    } catch {
        throw new Error('La master password es incorrecta o el respaldo está dañado.')
    }
}

export async function createRecoveryBackup(
    options: CreateRecoveryBackupOptions,
): Promise<OpenedRecoveryBackup> {
    const destinationStat = await fs.stat(options.destinationRoot)

    if (!destinationStat.isDirectory()) {
        throw new Error('La ruta elegida no es una carpeta válida.')
    }

    const now = options.now ?? new Date()
    const finalPath = await chooseUniqueBackupPath(options.destinationRoot, now)
    const temporaryPath = `${finalPath}.tmp-${process.pid}-${crypto.randomBytes(4).toString('hex')}`
    const safeUsername = safeUsernameForFilename(options.username)
    const passwordFilename = `${safeUsername}.vault`
    const notesFilename = `${safeUsername}.notes.vault`

    const vaultContent = JSON.stringify(
        encryptVaultData(options.vaultPassword, options.vaultData),
        null,
        2,
    )
    const notesContent = JSON.stringify(
        encryptNotesData(options.vaultPassword, options.notesData),
        null,
        2,
    )

    const manifest: RecoveryManifest = {
        format: RECOVERY_FORMAT,
        formatVersion: RECOVERY_FORMAT_VERSION,
        createdAt: now.toISOString(),
        appVersion: options.appVersion,
        username: options.username,
        files: {
            passwords: createDescriptor(passwordFilename, vaultContent),
            notes: createDescriptor(notesFilename, notesContent),
        },
    }

    try {
        await fs.mkdir(temporaryPath, { recursive: false })
        await Promise.all([
            fs.writeFile(path.join(temporaryPath, passwordFilename), vaultContent, 'utf8'),
            fs.writeFile(path.join(temporaryPath, notesFilename), notesContent, 'utf8'),
        ])
        await fs.writeFile(
            path.join(temporaryPath, RECOVERY_MANIFEST_FILENAME),
            JSON.stringify(manifest, null, 2),
            'utf8',
        )

        await openRecoveryBackup(temporaryPath, options.vaultPassword)
        await fs.rename(temporaryPath, finalPath)

        return await openRecoveryBackup(finalPath, options.vaultPassword)
    } catch (error) {
        await fs.rm(temporaryPath, { recursive: true, force: true })
        throw error
    }
}

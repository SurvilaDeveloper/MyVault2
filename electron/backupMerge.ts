import { randomUUID } from 'node:crypto'
import type { VaultData, VaultEntry } from './vault'
import type { NotesData, NoteEntry } from './notesVault'

type MergeResult<T> = {
    items: T[]
    addedCount: number
    skippedCount: number
}

function mergeItems<T extends { id: string }>(
    localItems: T[],
    backupItems: T[],
    contentKey: (item: T) => string,
): MergeResult<T> {
    const items = [...localItems]
    const knownContents = new Set(localItems.map(contentKey))
    const usedIds = new Set(localItems.map((item) => item.id))
    let addedCount = 0
    let skippedCount = 0

    for (const item of backupItems) {
        const key = contentKey(item)

        if (knownContents.has(key)) {
            skippedCount += 1
            continue
        }

        let id = item.id

        if (!id || usedIds.has(id)) {
            do {
                id = randomUUID()
            } while (usedIds.has(id))
        }

        items.push({ ...item, id })
        knownContents.add(key)
        usedIds.add(id)
        addedCount += 1
    }

    return { items, addedCount, skippedCount }
}

function passwordContentKey(entry: VaultEntry) {
    return JSON.stringify([entry.account, entry.username, entry.password])
}

function noteContentKey(note: NoteEntry) {
    return JSON.stringify([note.title, note.content])
}

export function mergeRecoveryData(
    localVault: VaultData,
    localNotes: NotesData,
    backupVault: VaultData,
    backupNotes: NotesData,
) {
    const passwords = mergeItems(localVault.entries, backupVault.entries, passwordContentKey)
    const notes = mergeItems(localNotes.notes, backupNotes.notes, noteContentKey)

    return {
        vaultData: { entries: passwords.items },
        notesData: { notes: notes.items },
        addedPasswordCount: passwords.addedCount,
        skippedPasswordCount: passwords.skippedCount,
        addedNoteCount: notes.addedCount,
        skippedNoteCount: notes.skippedCount,
    }
}

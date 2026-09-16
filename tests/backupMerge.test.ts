import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mergeRecoveryData } from '../electron/backupMerge.ts'

test('combina solo registros nuevos y conserva los existentes', () => {
    const localVault = {
        entries: [
            { id: 'local-1', account: 'Correo', username: 'ana', password: 'clave-1' },
            { id: 'local-2', account: 'Banco', username: 'ana', password: 'clave-2' },
        ],
    }
    const localNotes = {
        notes: [{ id: 'nota-local', title: 'Idea', content: 'Texto' }],
    }
    const backupVault = {
        entries: [
            { id: 'otra-id', account: 'Correo', username: 'ana', password: 'clave-1' },
            { id: 'local-1', account: 'Correo', username: 'ana', password: 'clave-nueva' },
            { id: 'import-2', account: 'Correo', username: 'otro', password: 'clave-1' },
            { id: 'import-3', account: 'correo', username: 'ana', password: 'clave-1' },
            { id: 'import-4', account: 'Correo', username: 'ana', password: 'clave-nueva' },
        ],
    }
    const backupNotes = {
        notes: [
            { id: 'nota-copiada', title: 'Idea', content: 'Texto' },
            { id: 'nota-local', title: 'Idea', content: 'Texto nuevo' },
            { id: 'nota-2', title: 'Idea', content: 'Texto nuevo' },
        ],
    }

    const result = mergeRecoveryData(localVault, localNotes, backupVault, backupNotes)

    assert.deepEqual(result.vaultData.entries.slice(0, 2), localVault.entries)
    assert.deepEqual(result.notesData.notes.slice(0, 1), localNotes.notes)
    assert.deepEqual(
        result.vaultData.entries.map(({ account, username, password }) => [account, username, password]),
        [
            ['Correo', 'ana', 'clave-1'],
            ['Banco', 'ana', 'clave-2'],
            ['Correo', 'ana', 'clave-nueva'],
            ['Correo', 'otro', 'clave-1'],
            ['correo', 'ana', 'clave-1'],
        ],
    )
    assert.deepEqual(
        result.notesData.notes.map(({ title, content }) => [title, content]),
        [['Idea', 'Texto'], ['Idea', 'Texto nuevo']],
    )
    assert.equal(new Set(result.vaultData.entries.map(({ id }) => id)).size, 5)
    assert.equal(new Set(result.notesData.notes.map(({ id }) => id)).size, 2)
    assert.notEqual(result.vaultData.entries[2].id, 'local-1')
    assert.notEqual(result.notesData.notes[1].id, 'nota-local')
    assert.deepEqual(
        [result.addedPasswordCount, result.skippedPasswordCount, result.addedNoteCount, result.skippedNoteCount],
        [3, 2, 1, 2],
    )

    const repeated = mergeRecoveryData(
        result.vaultData,
        result.notesData,
        backupVault,
        backupNotes,
    )

    assert.deepEqual(repeated.vaultData, result.vaultData)
    assert.deepEqual(repeated.notesData, result.notesData)
    assert.deepEqual(
        [repeated.addedPasswordCount, repeated.skippedPasswordCount, repeated.addedNoteCount, repeated.skippedNoteCount],
        [0, 5, 0, 3],
    )
})

test('permite importar en un usuario vacío y evita coincidencias ambiguas', () => {
    const result = mergeRecoveryData(
        { entries: [] },
        { notes: [] },
        {
            entries: [
                { id: 'igual', account: 'a,b', username: 'c', password: 'p' },
                { id: 'igual', account: 'a', username: 'b,c', password: 'p' },
            ],
        },
        {
            notes: [
                { id: 'nota', title: 'a,b', content: 'c' },
                { id: 'nota', title: 'a', content: 'b,c' },
            ],
        },
    )

    assert.equal(result.addedPasswordCount, 2)
    assert.equal(result.addedNoteCount, 2)
    assert.equal(new Set(result.vaultData.entries.map(({ id }) => id)).size, 2)
    assert.equal(new Set(result.notesData.notes.map(({ id }) => id)).size, 2)
})

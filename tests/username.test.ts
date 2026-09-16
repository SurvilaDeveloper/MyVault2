import assert from 'node:assert/strict'
import { test } from 'node:test'
import { normalizeUsername, validateNewUsername } from '../electron/username.ts'

test('acepta nombres de usuario habituales y normaliza mayúsculas', () => {
    assert.equal(normalizeUsername('  María_2  '), 'maría_2')
    assert.equal(validateNewUsername('maría_2'), null)
    assert.equal(validateNewUsername('juan perez'), null)
})

test('impide nombres que escapen de la carpeta de datos o no funcionen en Windows', () => {
    for (const username of ['../otro', '..\\otro', '..', 'con', 'NUL.txt', 'usuario:', 'usuario.', 'a'.repeat(65)]) {
        assert.ok(validateNewUsername(normalizeUsername(username)), username)
    }
    assert.ok(validateNewUsername(''))
})

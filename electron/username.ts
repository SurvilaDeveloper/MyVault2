export function normalizeUsername(username: string) {
    return username.trim().toLowerCase()
}

export function validateNewUsername(username: string): string | null {
    if (!username) return 'El usuario no puede estar vacío.'

    // El nombre se usa para crear archivos locales en Windows.
    if (
        username.length > 64 ||
        /[<>:"/\\|?*\u0000-\u001f]/u.test(username) ||
        /[. ]$/u.test(username) ||
        username === '.' ||
        /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/iu.test(username)
    ) {
        return 'Elegí un nombre de usuario válido para guardar archivos en Windows (hasta 64 caracteres, sin símbolos de ruta).'
    }

    return null
}

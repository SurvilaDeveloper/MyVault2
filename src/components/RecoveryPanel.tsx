import { useState, type CSSProperties } from 'react'
import type { ExternalBackup } from '../types/app-types'
import {
    homeCardStyle,
    homeCardTextStyle,
    inputStyle,
    labelStyle,
    modalButtonsStyle,
    modalCardStyle,
    modalOverlayStyle,
    modalTextStyle,
    modalTitleStyle,
    primaryButtonStyle,
    secondaryButtonStyle,
    statusBoxStyle,
} from '../styles/appStyles'

type RecoveryActionResult = {
    ok: boolean
    error?: string
    canceled?: boolean
}

type RecoveryPanelProps = {
    externalBackup: ExternalBackup | null
    onOpenPasswords: () => void
    onOpenNotes: () => void
    onExportBackup: (
        loginPassword: string,
        vaultPassword: string,
    ) => Promise<RecoveryActionResult>
    onOpenBackup: (vaultPassword: string) => Promise<RecoveryActionResult>
    onRestoreBackup: (
        loginPassword: string,
        currentVaultPassword: string,
    ) => Promise<RecoveryActionResult>
    onCloseBackup: () => Promise<void>
}

const readOnlyBadgeStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '5px 9px',
    borderRadius: 999,
    background: '#1d4ed8',
    color: '#dbeafe',
    fontSize: 12,
    fontWeight: 700,
}

const detailStyle: CSSProperties = {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    border: '1px solid #334155',
    background: '#0f172a',
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 1.6,
}

function formatBackupDate(value: string) {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('es-AR')
}

export function RecoveryPanel({
    externalBackup,
    onOpenPasswords,
    onOpenNotes,
    onExportBackup,
    onOpenBackup,
    onRestoreBackup,
    onCloseBackup,
}: RecoveryPanelProps) {
    const [modal, setModal] = useState<'export' | 'open' | 'restore' | null>(null)
    const [loginPassword, setLoginPassword] = useState('')
    const [vaultPassword, setVaultPassword] = useState('')
    const [modalStatus, setModalStatus] = useState('')
    const [busy, setBusy] = useState(false)
    const [closingBackup, setClosingBackup] = useState(false)

    function resetModal() {
        setLoginPassword('')
        setVaultPassword('')
        setModalStatus('')
    }

    function openModal(nextModal: 'export' | 'open' | 'restore') {
        resetModal()
        setModal(nextModal)
    }

    function closeModal() {
        if (busy) return
        resetModal()
        setModal(null)
    }

    async function handleExport() {
        if (!loginPassword || !vaultPassword) {
            setModalStatus('Ingresá la contraseña de login y la master password.')
            return
        }

        setBusy(true)
        setModalStatus('Validando y creando el respaldo cifrado...')

        try {
            const result = await onExportBackup(loginPassword, vaultPassword)

            if (!result.ok && !result.canceled) {
                setModalStatus(result.error ?? 'No se pudo crear el respaldo.')
                return
            }

            closeModalAfterOperation()
        } catch (error) {
            setModalStatus(
                error instanceof Error ? error.message : 'No se pudo crear el respaldo.',
            )
        } finally {
            setBusy(false)
        }
    }

    async function handleOpen() {
        if (!vaultPassword) {
            setModalStatus('Ingresá la master password del respaldo.')
            return
        }

        setBusy(true)
        setModalStatus('Validando y abriendo el respaldo...')

        try {
            const result = await onOpenBackup(vaultPassword)

            if (!result.ok && !result.canceled) {
                setModalStatus(result.error ?? 'No se pudo abrir el respaldo.')
                return
            }

            closeModalAfterOperation()
        } catch (error) {
            setModalStatus(
                error instanceof Error ? error.message : 'No se pudo abrir el respaldo.',
            )
        } finally {
            setBusy(false)
        }
    }

    async function handleRestore() {
        if (!loginPassword || !vaultPassword) {
            setModalStatus('Ingresá la contraseña de login y la master password actual.')
            return
        }

        setBusy(true)
        setModalStatus('Validando y restaurando el respaldo en AppData...')

        try {
            const result = await onRestoreBackup(loginPassword, vaultPassword)

            if (!result.ok) {
                setModalStatus(result.error ?? 'No se pudo restaurar el respaldo.')
                return
            }

            closeModalAfterOperation()
        } catch (error) {
            setModalStatus(
                error instanceof Error ? error.message : 'No se pudo restaurar el respaldo.',
            )
        } finally {
            setBusy(false)
        }
    }

    function closeModalAfterOperation() {
        resetModal()
        setModal(null)
    }

    async function handleCloseBackup() {
        if (closingBackup) return

        setClosingBackup(true)
        try {
            await onCloseBackup()
        } finally {
            setClosingBackup(false)
        }
    }

    const modalTitle =
        modal === 'export'
            ? 'Guardar copia cifrada en otra ubicación'
            : modal === 'open'
                ? 'Abrir respaldo externo'
                : 'Restaurar respaldo en este equipo'

    const modalDescription =
        modal === 'export'
            ? 'La copia incluirá las contraseñas y las anotaciones guardadas. Los archivos seguirán cifrados y el vault activo continuará en AppData.'
            : modal === 'open'
                ? 'Elegirás una carpeta que contenga recovery.json. El respaldo se abrirá en modo de solo lectura y nunca se modificará.'
                : 'El usuario actual debe estar vacío. Los datos se volverán a cifrar con su master password y se guardarán en AppData.'

    return (
        <>
            <section style={{ ...homeCardStyle, gridColumn: '1 / -1' }}>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 12,
                        alignItems: 'center',
                        flexWrap: 'wrap',
                    }}
                >
                    <h2 style={{ margin: 0, color: '#f8fafc', fontSize: 20 }}>
                        Respaldo y recuperación
                    </h2>
                    {externalBackup ? <span style={readOnlyBadgeStyle}>Solo lectura</span> : null}
                </div>

                {externalBackup ? (
                    <>
                        <p style={homeCardTextStyle}>
                            Estás viendo un respaldo externo. No se escribirá sobre la carpeta
                            seleccionada.
                        </p>
                        <div style={detailStyle}>
                            <div><strong>Respaldo:</strong> {externalBackup.displayName}</div>
                            <div><strong>Usuario original:</strong> {externalBackup.username}</div>
                            <div><strong>Creado:</strong> {formatBackupDate(externalBackup.createdAt)}</div>
                            <div><strong>Versión:</strong> MyVault2 {externalBackup.appVersion}</div>
                            <div>
                                <strong>Contenido:</strong> {externalBackup.passwordCount}{' '}
                                {externalBackup.passwordCount === 1 ? 'contraseña' : 'contraseñas'} y{' '}
                                {externalBackup.noteCount}{' '}
                                {externalBackup.noteCount === 1 ? 'anotación' : 'anotaciones'}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                            <button style={primaryButtonStyle} onClick={onOpenPasswords}>
                                Ver contraseñas
                            </button>
                            <button style={secondaryButtonStyle} onClick={onOpenNotes}>
                                Ver anotaciones
                            </button>
                            <button
                                style={primaryButtonStyle}
                                onClick={() => openModal('restore')}
                            >
                                Restaurar en este equipo
                            </button>
                            <button
                                style={secondaryButtonStyle}
                                onClick={() => void handleCloseBackup()}
                                disabled={closingBackup}
                            >
                                {closingBackup ? 'Cerrando...' : 'Cerrar respaldo'}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <p style={homeCardTextStyle}>
                            Guardá una copia cifrada en un pen drive o abrí una copia existente
                            sin modificarla.
                        </p>
                        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                            <button
                                style={primaryButtonStyle}
                                onClick={() => openModal('export')}
                            >
                                Guardar copia en...
                            </button>
                            <button
                                style={secondaryButtonStyle}
                                onClick={() => openModal('open')}
                            >
                                Abrir respaldo...
                            </button>
                        </div>
                    </>
                )}
            </section>

            {modal ? (
                <div style={modalOverlayStyle} onClick={closeModal}>
                    <div
                        style={{ ...modalCardStyle, maxWidth: 560 }}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <h2 style={modalTitleStyle}>{modalTitle}</h2>
                        <p style={modalTextStyle}>{modalDescription}</p>

                        {modal !== 'open' ? (
                            <>
                                <label style={labelStyle} htmlFor="recovery-login-password">
                                    Contraseña de login actual
                                </label>
                                <input
                                    id="recovery-login-password"
                                    type="password"
                                    value={loginPassword}
                                    onChange={(event) => setLoginPassword(event.target.value)}
                                    style={inputStyle}
                                    autoComplete="current-password"
                                    disabled={busy}
                                />
                            </>
                        ) : null}

                        <label style={labelStyle} htmlFor="recovery-vault-password">
                            {modal === 'open'
                                ? 'Master password del respaldo'
                                : 'Master password actual'}
                        </label>
                        <input
                            id="recovery-vault-password"
                            type="password"
                            value={vaultPassword}
                            onChange={(event) => setVaultPassword(event.target.value)}
                            style={inputStyle}
                            autoComplete="current-password"
                            disabled={busy}
                        />

                        {modalStatus ? (
                            <div style={{ ...statusBoxStyle, marginTop: 14 }}>{modalStatus}</div>
                        ) : null}

                        <div style={modalButtonsStyle}>
                            <button
                                style={secondaryButtonStyle}
                                onClick={closeModal}
                                disabled={busy}
                            >
                                Cancelar
                            </button>
                            <button
                                style={primaryButtonStyle}
                                onClick={() => {
                                    if (modal === 'export') void handleExport()
                                    else if (modal === 'open') void handleOpen()
                                    else void handleRestore()
                                }}
                                disabled={busy}
                            >
                                {busy
                                    ? 'Procesando...'
                                    : modal === 'export'
                                        ? 'Elegir destino'
                                        : modal === 'open'
                                            ? 'Elegir respaldo'
                                            : 'Restaurar'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    )
}

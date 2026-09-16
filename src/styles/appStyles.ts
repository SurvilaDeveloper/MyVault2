//src/styles/appStyles.ts
import type { CSSProperties } from 'react'

const appFontFamily =
    '"Segoe UI", Verdana, Tahoma, Arial, sans-serif'

const readableInputFontFamily =
    'Georgia, "Times New Roman", Times, serif'

const palette = {
    text: '#f4edff',
    muted: '#b8a9c9',
    label: '#ded1ec',
    surface: 'rgba(27, 18, 43, 0.88)',
    surfaceSolid: '#20152f',
    inset: '#140e22',
    border: '#4a365f',
    borderStrong: '#604776',
    accent: '#7c3aed',
    accentTint: 'rgba(139, 92, 246, 0.18)',
}

export const pageStyle: CSSProperties = {
    minHeight: '96dvh',
    background:
        'radial-gradient(circle at top, #2b1b43 0%, #160f27 42%, #090613 100%)',
    fontFamily: appFontFamily,
    color: palette.text,
    padding: 14,
    boxSizing: 'border-box',
}

export const authWrapperStyle: CSSProperties = {
    maxWidth: 1100,
    margin: '0 auto',
    fontFamily: appFontFamily,
}

export const heroStyle: CSSProperties = {
    marginBottom: 14,
    fontFamily: appFontFamily,
}

export const titleStyle: CSSProperties = {
    margin: 0,
    fontSize: 35,
    fontWeight: 700,
    color: palette.text,
    fontFamily: appFontFamily,
}

export const subtitleStyle: CSSProperties = {
    marginTop: 8,
    fontSize: 15,
    color: palette.muted,
    fontFamily: appFontFamily,
}

export const authGridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
    fontFamily: appFontFamily,
}

export const homeGridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
    fontFamily: appFontFamily,
}

export const cardStyle: CSSProperties = {
    background: palette.surface,
    borderRadius: 16,
    padding: 18,
    boxShadow: '0 18px 40px rgba(6, 2, 17, 0.42)',
    border: `1px solid ${palette.border}`,
    backdropFilter: 'blur(10px)',
    fontFamily: appFontFamily,
}

export const homeCardStyle: CSSProperties = {
    background: palette.surface,
    borderRadius: 16,
    padding: 20,
    boxShadow: '0 18px 40px rgba(6, 2, 17, 0.42)',
    border: `1px solid ${palette.border}`,
    backdropFilter: 'blur(10px)',
    fontFamily: appFontFamily,
}

export const cardTitleStyle: CSSProperties = {
    marginTop: 0,
    marginBottom: 12,
    fontSize: 18,
    color: palette.text,
    fontFamily: appFontFamily,
}

export const homeCardTextStyle: CSSProperties = {
    marginTop: 0,
    marginBottom: 14,
    color: palette.muted,
    lineHeight: 1.45,
    fontSize: 14,
    fontFamily: appFontFamily,
}

export const labelStyle: CSSProperties = {
    display: 'block',
    marginBottom: 4,
    marginTop: 6,
    fontSize: 12,
    fontWeight: 600,
    color: palette.label,
    fontFamily: appFontFamily,
}

export const inputStyle: CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 10,
    border: `1px solid ${palette.borderStrong}`,
    fontSize: 14,
    boxSizing: 'border-box',
    outline: 'none',
    background: palette.inset,
    color: palette.text,
    fontFamily: readableInputFontFamily,
    fontVariantLigatures: 'none',
}

export const searchInputStyle: CSSProperties = {
    width: '100%',
    padding: '9px 11px',
    borderRadius: 10,
    border: `1px solid ${palette.borderStrong}`,
    fontSize: 13,
    boxSizing: 'border-box',
    outline: 'none',
    background: palette.inset,
    color: palette.text,
    marginBottom: 12,
    fontFamily: readableInputFontFamily,
    fontVariantLigatures: 'none',
}

export const textareaStyle: CSSProperties = {
    width: '100%',
    minHeight: 256,
    padding: '10px 12px',
    borderRadius: 10,
    border: `1px solid ${palette.borderStrong}`,
    fontSize: 14,
    boxSizing: 'border-box',
    outline: 'none',
    background: palette.inset,
    color: palette.text,
    resize: 'vertical',
    fontFamily: readableInputFontFamily,
    lineHeight: 1.45,
    fontVariantLigatures: 'none',
}

export const primaryButtonStyle: CSSProperties = {
    marginTop: 14,
    padding: '10px 14px',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    background: palette.accent,
    color: '#fff',
    fontFamily: appFontFamily,
}

export const secondaryButtonStyle: CSSProperties = {
    marginTop: 14,
    padding: '10px 14px',
    borderRadius: 10,
    border: `1px solid ${palette.borderStrong}`,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    background: palette.surfaceSolid,
    color: palette.text,
    fontFamily: appFontFamily,
}

export const ghostButtonStyle: CSSProperties = {
    padding: '9px 13px',
    borderRadius: 10,
    border: `1px solid ${palette.borderStrong}`,
    cursor: 'pointer',
    fontSize: 13,
    background: palette.inset,
    color: palette.text,
    fontFamily: appFontFamily,
}

export const dangerButtonStyle: CSSProperties = {
    padding: '9px 13px',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    background: '#dc2626',
    color: '#fff',
    fontFamily: appFontFamily,
}

export const statusBoxStyle: CSSProperties = {
    marginTop: 14,
    background: palette.surface,
    border: `1px solid ${palette.border}`,
    borderRadius: 12,
    padding: '10px 12px',
    color: '#ddc8ff',
    boxShadow: '0 12px 30px rgba(6, 2, 17, 0.32)',
    fontSize: 13,
    fontFamily: appFontFamily,
}

export const appShellStyle: CSSProperties = {
    maxWidth: 1280,
    margin: '0 auto',
    background: palette.surface,
    borderRadius: 18,
    padding: 18,
    boxShadow: '0 22px 50px rgba(6, 2, 17, 0.46)',
    border: `1px solid ${palette.border}`,
    backdropFilter: 'blur(10px)',
    fontFamily: appFontFamily,
}

export const toolbarStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
    fontFamily: appFontFamily,
}

export const toolbarButtonsStyle: CSSProperties = {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    fontFamily: appFontFamily,
}

export const tableHeaderStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 220px',
    gap: 12,
    fontSize: 12,
    fontWeight: 700,
    color: palette.muted,
    marginBottom: 8,
    padding: '0 4px',
    fontFamily: appFontFamily,
}

export const listStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    fontFamily: appFontFamily,
}

export const rowStyle4: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 220px',
    gap: 12,
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    background: palette.surfaceSolid,
    border: `1px solid ${palette.border}`,
    fontFamily: appFontFamily,
}

export const emptyStateStyle: CSSProperties = {
    padding: 18,
    textAlign: 'center',
    borderRadius: 14,
    background: palette.inset,
    border: `1px dashed ${palette.borderStrong}`,
    color: palette.muted,
    fontSize: 13,
    fontFamily: appFontFamily,
}

export const notesLayoutStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '300px 1fr',
    gap: 16,
    alignItems: 'start',
    fontFamily: appFontFamily,
}

export const notesSidebarStyle: CSSProperties = {
    background: palette.surfaceSolid,
    border: `1px solid ${palette.border}`,
    borderRadius: 16,
    padding: 14,
    minHeight: 360,
    fontFamily: appFontFamily,
}

export const notesSidebarHeaderRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
    fontFamily: appFontFamily,
}

export const notesSidebarHeaderStyle: CSSProperties = {
    fontSize: 13,
    fontWeight: 700,
    color: palette.label,
    fontFamily: appFontFamily,
}

export const unsavedBadgeStyle: CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: '#fbbf24',
    background: 'rgba(251, 191, 36, 0.14)',
    border: '1px solid rgba(251, 191, 36, 0.35)',
    borderRadius: 999,
    padding: '3px 7px',
    whiteSpace: 'nowrap',
    fontFamily: appFontFamily,
}

export const savedBadgeStyle: CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: '#4ade80',
    background: 'rgba(74, 222, 128, 0.12)',
    border: '1px solid rgba(74, 222, 128, 0.28)',
    borderRadius: 999,
    padding: '3px 7px',
    whiteSpace: 'nowrap',
    fontFamily: appFontFamily,
}

export const notesButtonsListStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    fontFamily: appFontFamily,
}

export const noteListButtonStyle: CSSProperties = {
    width: '100%',
    textAlign: 'left',
    padding: '10px 12px',
    borderRadius: 10,
    border: `1px solid ${palette.borderStrong}`,
    background: palette.inset,
    color: palette.text,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: appFontFamily,
}

export const noteListButtonActiveStyle: CSSProperties = {
    border: '1px solid #a78bfa',
    background: palette.accentTint,
    color: '#ede9fe',
    fontFamily: appFontFamily,
}

export const noteButtonTitleStyle: CSSProperties = {
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1.3,
    marginBottom: 3,
    wordBreak: 'break-word',
    fontFamily: appFontFamily,
}

export const noteButtonMetaStyle: CSSProperties = {
    fontSize: 11,
    fontWeight: 500,
    color: palette.muted,
    fontFamily: appFontFamily,
}

export const notesEditorStyle: CSSProperties = {
    minWidth: 0,
    fontFamily: appFontFamily,
}

export const noteEditorCardStyle: CSSProperties = {
    background: palette.surfaceSolid,
    border: `1px solid ${palette.border}`,
    borderRadius: 16,
    padding: 14,
    fontFamily: appFontFamily,
}

export const noteMetaStyle: CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    color: palette.muted,
    marginBottom: 6,
    fontFamily: appFontFamily,
}

export const emptySidebarStyle: CSSProperties = {
    padding: 12,
    borderRadius: 10,
    background: palette.inset,
    border: `1px dashed ${palette.borderStrong}`,
    color: palette.muted,
    fontSize: 13,
    fontFamily: appFontFamily,
}

export const modalOverlayStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(6, 3, 14, 0.76)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    zIndex: 9999,
    fontFamily: appFontFamily,
}

export const modalCardStyle: CSSProperties = {
    width: '100%',
    maxWidth: 500,
    background: palette.surfaceSolid,
    borderRadius: 18,
    padding: 20,
    boxShadow: '0 24px 60px rgba(6, 2, 17, 0.55)',
    border: `1px solid ${palette.border}`,
    fontFamily: appFontFamily,
}

export const modalTitleStyle: CSSProperties = {
    margin: 0,
    fontSize: 21,
    fontWeight: 700,
    color: palette.text,
    fontFamily: appFontFamily,
}

export const modalTextStyle: CSSProperties = {
    marginTop: 10,
    marginBottom: 0,
    color: palette.label,
    lineHeight: 1.5,
    fontSize: 14,
    fontFamily: appFontFamily,
}

export const modalButtonsStyle: CSSProperties = {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 18,
    fontFamily: appFontFamily,
}

export const iconButtonStyle: CSSProperties = {
    width: 34,
    height: 34,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    border: `1px solid ${palette.borderStrong}`,
    background: palette.inset,
    color: palette.text,
    cursor: 'pointer',
    fontFamily: appFontFamily,
}

export const iconButtonDangerStyle: CSSProperties = {
    ...iconButtonStyle,
    border: '1px solid rgba(220, 38, 38, 0.35)',
    background: 'rgba(220, 38, 38, 0.12)',
    color: '#fca5a5',
}

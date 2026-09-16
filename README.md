# MyVault2

![Electron](https://img.shields.io/badge/Electron-App-blue)
![React](https://img.shields.io/badge/React-Frontend-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-Code-blue)
![License](https://img.shields.io/badge/license-MIT-green)

**MyVault2** es un gestor **local, privado y seguro** de contraseñas y
notas desarrollado con **Electron, React y TypeScript**.

La aplicación está diseñada para que el usuario mantenga el **control
total de sus datos**, sin depender de servicios en la nube ni
sincronización externa. Toda la información se guarda **cifrada
localmente en el dispositivo**.

------------------------------------------------------------------------

# Características

- 🔐 Almacenamiento **cifrado local**
- 👤 **Sistema de usuarios**
- 🔑 Vault protegido con contraseña independiente
- 📝 Gestor de **notas seguras**
- ⏱ **Auto-bloqueo del vault tras 5 minutos de inactividad**
- 📋 **Borrado automático del portapapeles** después de copiar contraseñas
- 🌙 Interfaz moderna con **tema oscuro**
- 💻 Aplicación de **escritorio**
- 📂 Datos almacenados **solo en el dispositivo**
- 💾 Copias de respaldo cifradas en una carpeta o pen drive
- 👁 Apertura de respaldos externos en **modo de solo lectura**
- ♻️ Restauración que conserva los datos locales y evita duplicados
- 🚫 **Sin conexión obligatoria a internet**

------------------------------------------------------------------------

# Tecnologías utilizadas

-   Electron
-   React
-   TypeScript
-   Vite
-   bcryptjs

Arquitectura simplificada:

    Electron (Main Process)
            │
            │ IPC
            ▼
    Preload (contextBridge)
            │
            ▼
    React Renderer

La aplicación utiliza:

-   `contextIsolation`
-   `sandbox`
-   `nodeIntegration: false`

para mejorar la seguridad.

------------------------------------------------------------------------

# Seguridad

MyVault2 fue desarrollado siguiendo buenas prácticas de seguridad:

- cifrado del vault protegido por contraseña
- auto-bloqueo automático de la sesión tras 5 minutos de inactividad
- borrado automático del portapapeles después de copiar contraseñas
- aislamiento de contexto en Electron
- bloqueo de navegación externa dentro de la aplicación
- apertura de enlaces externos mediante el navegador del sistema
- sandbox habilitado
- comunicación controlada mediante IPC

Los datos se almacenan localmente en:

    AppData/Roaming/MyVault2

Cada usuario posee sus propios archivos cifrados:

    username.vault
    username.notes.vault

Los respaldos externos incluyen ambos archivos y un manifiesto `recovery.json`
con la versión del formato y checksums SHA-256. El manifiesto no contiene
contraseñas ni secretos.

------------------------------------------------------------------------

# Respaldo y recuperación

Desde el panel principal se puede elegir **Guardar copia en...** para crear una
carpeta de recuperación en un pen drive u otra ubicación. MyVault2 solicita
nuevamente la contraseña de login y la master password antes de exportar.

Para recuperar los datos en otra computadora o combinar un respaldo con los
datos que ya están en este equipo:

1. Instalar o ejecutar la versión portable de MyVault2.
2. Crear un usuario nuevo o iniciar sesión en uno existente.
3. Elegir **Abrir respaldo...** y seleccionar la carpeta que contiene
   `recovery.json`.
4. Introducir la master password del respaldo.
5. Revisar las contraseñas y anotaciones en modo de solo lectura.
6. Elegir **Restaurar en este equipo** para agregar los registros que falten.

Una contraseña se considera duplicada solo si **Cuenta**, **Usuario** y
**Contraseña** son exactamente iguales. Una anotación se considera duplicada
solo si coinciden exactamente **título** y **texto**. Si cualquiera de esos
campos difiere, se conserva como un registro nuevo. Los datos locales existentes
se mantienen y los registros agregados se cifran con la master password del
usuario actual. Repetir la restauración no añade copias idénticas.

La carpeta externa nunca se modifica durante la apertura ni la restauración.
La versión portable permite ejecutar el programa sin instalarlo, pero guarda
los datos locales en el perfil de Windows de la computadora en uso. Para
migrar, llevá también la carpeta de respaldo cifrada en el pen drive.

------------------------------------------------------------------------

# Instalación

## Descargar ejecutable

Desde [Releases](https://github.com/SurvilaDeveloper/MyVault2/releases) del repositorio.

Instalador:

    MyVault2-Setup-x.x.x.exe

Versión portable:

    MyVault2-Portable-x.x.x.exe

------------------------------------------------------------------------

# Ejecutables de Windows

Los ejecutables no están firmados digitalmente y Windows puede mostrar una
advertencia al abrirlos. Consultá el origen y las sumas SHA-256 publicadas en
cada versión antes de ejecutarlos.

------------------------------------------------------------------------

# Compilar desde el código fuente

Requisitos:

-   Node.js 22.12 o superior
-   npm

Clonar repositorio:

``` bash
git clone https://github.com/SurvilaDeveloper/MyVault2.git
cd MyVault2
```

Instalar dependencias:

``` bash
npm ci
```

Modo desarrollo:

``` bash
npm run dev
```

Construir aplicación:

``` bash
npm run build
```

Generar instalador y versión portable en Windows:

``` bash
npm run dist
```

Los binarios se generarán en:

    /dist

También podés ejecutar manualmente **Compilar MyVault2 para Windows** desde la
pestaña **Actions**. Al finalizar, descargá el archivo generado en la sección
**Artifacts** de esa ejecución, extraé los dos `.exe`, probalos en Windows y
adjuntalos junto con `SHA256SUMS.txt` y `LICENSE` a una nueva versión en
**Releases**.

------------------------------------------------------------------------

# Estructura del proyecto

    electron/
     ├ main.ts
     ├ backup.ts
     ├ preload.ts

    src/
     ├ App.tsx
     ├ components/
     │  └ RecoveryPanel.tsx

    public/
     ├ myvault.png

    dist-electron/
    dist-renderer/

------------------------------------------------------------------------

# Roadmap

Funciones planificadas:

-   generador de contraseñas seguras
-   mejoras de interfaz
-   soporte multiplataforma (Linux y macOS)

------------------------------------------------------------------------

# Licencia

MyVault2 se distribuye bajo la [licencia MIT](LICENSE). Copyright © 2026
Gabriel Survila.

------------------------------------------------------------------------

# Autor

**Gabriel Survila**

Email:

surviladeveloper@gmail.com

Repositorio:

https://github.com/SurvilaDeveloper/MyVault2

------------------------------------------------------------------------

# Filosofía del proyecto

MyVault2 sigue un principio simple:

> Tus contraseñas deben estar bajo tu control, no en un servidor
> externo.

La aplicación funciona completamente **offline** y los datos permanecen
**únicamente en el dispositivo del usuario**.

------------------------------------------------------------------------

# Contribuciones

Las contribuciones son bienvenidas.

Puedes colaborar con:

-   mejoras de seguridad
-   mejoras de interfaz
-   auditorías de código
-   nuevas funcionalidades

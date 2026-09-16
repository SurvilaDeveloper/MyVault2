# MyVault2 v1.2.0

MyVault2 es un gestor local de contraseñas y notas para Windows. Los datos se
guardan cifrados en el equipo y podés crear un respaldo cifrado en un pen drive
para recuperarlos en otra computadora.

## Descargas para Windows

- `MyVault2-Setup-1.2.0.exe`: instalador.
- `MyVault2-Portable-1.2.0.exe`: aplicación que se ejecuta sin instalación.
- `SHA256SUMS.txt`: sumas SHA-256 de los ejecutables.
- `LICENSE`: texto de la licencia MIT.

Descargá los `.exe` desde los archivos adjuntos a esta versión. La edición
portable tampoco guarda los datos automáticamente en el pen drive: para llevar
tus contraseñas y notas, creá un respaldo desde **Guardar copia en...** y
copiá la carpeta resultante junto al programa.

## Recuperación de datos

En el otro equipo, ejecutá MyVault2, creá un usuario o iniciá sesión, elegí
**Abrir respaldo...** y seleccioná la carpeta con `recovery.json`. Después de
introducir la master password del respaldo, podés consultar el contenido y
usar **Restaurar en este equipo** para incorporarlo a tus datos locales.

La restauración no duplica contraseñas cuando coinciden Cuenta, Usuario y
Contraseña; tampoco duplica notas cuando coinciden título y texto.

## Antes de instalar

Los ejecutables no cuentan con firma digital. Windows puede solicitar una
confirmación de seguridad. Verificá que descargaste los archivos desde este
repositorio y compará sus sumas SHA-256 con `SHA256SUMS.txt`.

## Licencia

El código fuente se distribuye bajo la licencia MIT. Consultá el archivo
`LICENSE` del repositorio para ver el texto completo.

# Configurar entorno para backup
1. descargar MongoDB Command Line Database Tools Download desde https://www.mongodb.com/docs/database-tools/installation/?operating-system=windows&package-type=zip
https://www.mongodb.com/try/download/database-tools
2. Descomprimir el zip
3. abrir la carpeta descomprimida y entrar a la carpeta /bin
4. Copiar la ruta
5. Ir a variables de entorno de windows -> en 'propiedades del sistema' click en 'Variables de entorno...' -> en 'Variables del sistema' seleccionar 'path' luego click en 'editar' seguido click en 'Nuevo'
6. Pegar la ruta copiada del paso 4
7. click en 'subir' hasta que quede de primeras
8. click en aceptar, y tambien en las demas ventanas

# Bajar el backup
1. abrir CMD 
2. Ir a la carpeta en la que se encuenta el archivo restore.bat
Ejemplo: C:\proyecto\backup-pangea
3. Escribir .\restore.bat y presionar Enter 

En consola de deben de ver las colecciones recuperadas.

Abrir mongo compass y conectar para verificar
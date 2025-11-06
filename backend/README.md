# Backend: arranque local rápido

## Opción A: MongoDB con Docker

1. Instala Docker Desktop.
2. En esta carpeta, levanta Mongo:

```powershell
docker compose up -d
```

3. Variables de entorno: copia `.env.example` a `.env` y ajusta (opcional). Si no, usa el `.cmd` de abajo que fuerza local.
4. Arranca backend:

```powershell
npm install
npm run dev
```

## Opción B: Script Windows (sin Docker)

Usa el script que fuerza conexión local y CORS:

```bat
Start-Backend-Local.cmd
```

## Health checks
- http://localhost:5000/health
- http://localhost:5000/ready

## Notas de seguridad
- No subas `.env` al repositorio. Usa `.env.example` como referencia.
- Configura `SENDGRID_API_KEY` y credenciales de Gmail sólo en entornos seguros.

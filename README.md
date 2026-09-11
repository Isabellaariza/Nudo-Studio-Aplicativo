# Nudo Studio — Aplicativo

Sistema de gestión para Nudo Studio: ventas, pedidos, talleres, matrículas y producción.

## Estructura del proyecto

```
Nudo-Studio-Aplicativo/
├── frontend/        # Aplicación React + Vite + TypeScript
├── backend/         # API REST Node.js + Express + PostgreSQL (Neon)
└── README.md
```

## Requisitos

- Node.js >= 18
- npm >= 9
- Cuenta en Neon (PostgreSQL)

---

## Backend

```bash
cd backend
npm install
```

Crea el archivo `backend/.env` con:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=tu_secreto
JWT_EXPIRES_IN=8h
PORT=3000
EMAIL_USER=tu_correo@gmail.com
EMAIL_PASS=tu_app_password
FRONTEND_URL=http://localhost:5173
```

Iniciar en desarrollo:

```bash
npm run dev
```

Iniciar en producción:

```bash
npm start
```

---

## Frontend

```bash
cd frontend
npm install
```

Crea el archivo `frontend/.env` con:

```env
VITE_API_URL=http://localhost:3000/api
```

En producción apunta a la URL del backend desplegado:

```env
VITE_API_URL=https://tu-backend.onrender.com/api
```

Iniciar en desarrollo:

```bash
npm run dev
```

Build de producción:

```bash
npm run build
```

---

## Variables de entorno necesarias

| Variable | Dónde | Descripción |
|---|---|---|
| `DATABASE_URL` | backend | URL de conexión a Neon PostgreSQL |
| `JWT_SECRET` | backend | Secreto para firmar tokens JWT |
| `JWT_EXPIRES_IN` | backend | Duración del token (ej: `8h`) |
| `PORT` | backend | Puerto del servidor (default: 3000) |
| `EMAIL_USER` | backend | Correo Gmail para envío de notificaciones |
| `EMAIL_PASS` | backend | App Password de Gmail |
| `FRONTEND_URL` | backend | URL del frontend (para CORS) |
| `VITE_API_URL` | frontend | URL base de la API del backend |

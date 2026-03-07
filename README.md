# 🏆 Prode Mundial 2026

App mobile-first para jugar el prode de la Copa del Mundo con amigos y familiares.

## Stack
- **Frontend:** Next.js 14 + Tailwind CSS
- **Backend/DB:** Supabase (Auth + PostgreSQL)
- **Deploy:** Vercel (gratis)

---

## 🚀 Setup paso a paso

### 1. Crear proyecto en Supabase (GRATIS)

1. Ir a [supabase.com](https://supabase.com) → Crear cuenta → New project
2. Elegir nombre: `prode-mundial-2026`
3. Elegir contraseña segura y región (ej: East US)
4. Esperar que el proyecto se cree (~2 min)

### 2. Configurar la base de datos

1. En Supabase: ir a **SQL Editor** → New query
2. Copiar y pegar **todo** el contenido de `supabase/schema.sql`
3. Click en **Run** ✅

### 3. Cargar el fixture de partidos

1. En Supabase: ir a **SQL Editor** → New query
2. Los partidos se cargan via script. Crear un archivo `supabase/seed.sql` con los inserts o usar la tabla directamente.
3. Alternativa: ir a **Table Editor** → tabla `matches` → Insert rows manualmente

**O ejecutar este script en el SQL Editor:**
```sql
-- Los partidos se cargan desde la app en la primera visita (ver implementación futura)
-- Por ahora, podés cargarlos manualmente en la tabla matches
```

### 4. Configurar Auth con Google

1. En Supabase: ir a **Authentication** → Providers → Google
2. Habilitar Google provider
3. Ir a [console.cloud.google.com](https://console.cloud.google.com):
   - Crear proyecto → APIs & Services → OAuth 2.0 Client IDs
   - Application type: Web application
   - Authorized redirect URIs: `https://tu-proyecto.supabase.co/auth/v1/callback`
4. Copiar Client ID y Client Secret a Supabase

### 5. Instalar y correr localmente

```bash
# Clonar / copiar el proyecto
cd prode-mundial

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.local.example .env.local
# Editar .env.local con tus keys de Supabase

# Correr en desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

### 6. Deploy en Vercel (GRATIS)

1. Pushear el código a GitHub
2. Ir a [vercel.com](https://vercel.com) → Import project → seleccionar repo
3. En **Environment Variables** agregar:
   - `NEXT_PUBLIC_SUPABASE_URL` = tu URL de Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = tu anon key de Supabase
4. Click Deploy ✅

---

## 📊 Cómo cargar resultados (post-partido)

Como admin, vas a cargar resultados directo en Supabase:

1. Ir a **Table Editor** → tabla `matches`
2. Encontrar el partido terminado
3. Editar: `home_score`, `away_score`, `status = 'finished'`
4. El trigger de la DB calcula los puntos automáticamente ✨

---

## 🎮 Sistema de puntos

| Resultado | Puntos |
|-----------|--------|
| Marcador exacto (ej: 2-1 → 2-1) | **3 pts** |
| Ganador correcto (ej: predecís 2-1 → sale 3-0) | **1 pt** |
| Resultado incorrecto | **0 pts** |

**Regla de edición:** Las predicciones se pueden cargar/editar hasta 7 días antes de cada partido. Después se bloquean automáticamente.

---

## 📱 Páginas de la app

| Ruta | Descripción |
|------|-------------|
| `/` | Landing page |
| `/auth/login` | Login / Registro |
| `/dashboard` | Home con grupos y stats |
| `/predicciones` | Cargar predicciones por grupo |
| `/grupos` | Lista de grupos |
| `/grupos/crear` | Crear nuevo grupo |
| `/grupos/unirse` | Unirse con código |
| `/grupos/[id]` | Detalle del grupo + leaderboard |
| `/tabla` | Tabla de posiciones global |
| `/perfil` | Perfil y reglas |

---

## 🔑 Keys de Supabase

Las encontrás en: **Settings** → **API** en tu proyecto de Supabase
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`  
- **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

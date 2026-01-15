# 🚀 Guía de Despliegue Profesional (GitHub + Vercel)

Esta guía te llevará paso a paso para subir tu proyecto a la nube de forma correcta.

## Paso 1: Subir el Código a GitHub

1.  Abre tu terminal (aquí mismo en VS Code está bien).
2.  Asegúrate de estar en la carpeta del proyecto (`c:\Users\Alejandro\Downloads\tanuki-den---web-edition`).
3.  Ejecuta estos comandos **uno por uno**:

```bash
# 1. Inicializar Git (si no lo has hecho)
git init

# 2. Agregar todos los archivos (El .gitignore evitará archivos basura)
git add .

# 3. Guardar el estado actual
git commit -m "🚀 Initial deploy: Tanuki Den Web Edition"

# 4. Renombrar la rama a 'main' (estándar moderno)
git branch -M main

# 5. Conectar con TU repositorio (CAMBIA LA URL POR LA TUYA)
# Ejemplo: git remote add origin https://github.com/tu-usuario/tanuki-den-web.git
git remote add origin <PEGA_AQUI_LA_URL_DE_TU_REPO_NUEVO>

# 6. Subir los archivos
git push -u origin main
```

---

## Paso 2: Conectar con Vercel

1.  Ve a [Vercel Dashboard](https://vercel.com/dashboard).
2.  Dale a **"Add New..."** -> **"Project"**.
3.  Verás tu lista de repositorios de GitHub. Importa **"tanuki-den-web"** (o como le hayas puesto).
4.  **¡IMPORTANTE!** No le des a "Deploy" todavía. Baja a la sección **"Environment Variables"**.

### Paso 2.1: Configurar Variables de Entorno (Claves Secretas)

Vercel necesita saber tus claves de Supabase y Stripe. Copia los valores de tu archivo `.env` local y pégalos en Vercel:

| Nombre (Key) | Valor (Value) |
| :--- | :--- |
| `VITE_SUPABASE_URL` | *(Copia del .env)* |
| `VITE_SUPABASE_ANON_KEY` | *(Copia del .env)* |
| `VITE_STRIPE_PUBLIC_KEY` | *(Copia del .env)* |
| `STRIPE_SECRET_KEY` | *(Copia del .env)* |
| `VITE_GOOGLE_API_KEY` | *(Si tienes la de Gemini, ponla también)* |

5.  Ahora sí, dale al botón azul **"Deploy"**.

---

## Paso 3: ¡Éxito! 🎉

Vercel construirá tu página en sus servidores. Tardará 1 minuto.
Cuando termine, te dará una URL (ej: `tanuki-den.vercel.app`).

**Ventajas:**
*   **Automático:** Cada vez que hagas `git push`, Vercel actualizará la página solo.
*   **HTTPS:** Certificado de seguridad gratis.
*   **Rápido:** Servidores en todo el mundo (CDN).

---
**Nota:** Si ves la pantalla blanca, revisa que hayas puesto **todas** las variables de entorno correctamente en Vercel y redesepliega (Redeploy).

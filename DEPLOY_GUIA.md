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
3.  Verás tu lista de repositorios de GitHub. Importa **"tanuki-den-web"** (o el nombre que le hayas puesto).
4.  **¡IMPORTANTE!** Configuración del Proyecto:
    *   **Framework Preset:** Vite (Debería detectarlo solo).
    *   **Root Directory:** `./` (Déjalo como está).
    *   **Build Command:** `vite build` (Automático).
    *   **Output Directory:** `dist` (Automático).

5.  **Environment Variables (Variables de Entorno)** - ¡CRUCIAL!
    Despliega la sección y añade estas claves una por una (copia los valores de tu `.env` local):

| Clave (Key) | Valor (Ejemplo/Fuente) |
| :--- | :--- |
| `VITE_SUPABASE_URL` | `https://...supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` (Tu clave larga pública) |
| `VITE_STRIPE_PUBLIC_KEY` | `pk_test_...` |
| `STRIPE_SECRET_KEY` | `sk_test_...` (Necesaria para los pagos) |
| `GEMINI_API_KEY` | *(Si tienes una clave de IA, si no, déjalo pendiente)* |

6.  Dale al botón azul **"Deploy"**.

---

## Paso 3: ¡Éxito! 🎉

Vercel construirá tu página. Si todo sale bien, verás confeti digital.

### ¿Qué acabo de mejorar en tu código?
He migrado automáticamente la función de pagos (`create-checkout`) para que sea **nativa de Vercel**.
*   Antes estaba configurada para Netlify (`.netlify/functions/...`).
*   Ahora está en `/api/create-checkout` y lista para funcionar en Vercel.

**Prueba tu deploy:**
Entra a la URL que te da Vercel (ej: `tanuki-den.vercel.app`) e intenta añadir algo al carrito e ir a pagar. Debería llevarte a Stripe sin problemas.

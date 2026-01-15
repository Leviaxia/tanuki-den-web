# Configuración de Supabase para Tanuki Den

Sigue estos pasos para crear el "cerebro" de tu aplicación.

## 1. Crear el Proyecto
1.  Ve a **[database.new](https://database.new)** (te pedirá iniciar sesión con GitHub o correo).
2.  En el formulario "Create a new project":
    *   **Name:** `Tanuki Den`
    *   **Database Password:** Genera una segura y **guárdala** (aunque no la usaremos directamente por ahora).
    *   **Region:** Elige `East US (North Virginia)` o la más cercana a Colombia (Miami si está disponible, sino Virginia está bien).
3.  Haz clic en **"Create new project"**.
4.  Espera unos minutos mientras se configura (verás una barra de carga).

## 2. Obtener las Llaves de Acceso
Una vez el proyecto esté listo (verde):
1.  Ve al menú de la izquierda y haz clic en el icono de **Settings** (Engranaje) ⚙️.
2.  Selecciona **API**.
3.  Busca la sección **Project URL** y copia la URL.
4.  Busca la sección **Project API keys** y copia la llave que dice `anon` `public`.
    *   ⚠️ **Importante:** NO compartas la llave `service_role`. Solo necesitamos la `anon`.

## 3. Conectar tu Proyecto
1.  Vuelve a tu editor de código (aquí).
2.  Busca el archivo que he creado llamado **`.env`** (o créalo si no existe).
3.  Pega tus llaves en este formato:

```env
VITE_SUPABASE_URL=tu_url_aqui
VITE_SUPABASE_ANON_KEY=tu_llave_anon_public_aqui
```

¡Y listo! Una vez hagas eso, avísame para que yo proceda a instalar las librerías y conectar todo.

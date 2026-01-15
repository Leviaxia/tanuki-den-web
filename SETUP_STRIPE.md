# Configuración de Stripe para Pagos Reales

¡Es hora de conectar la caja registradora! Sigue estos pasos para obtener las llaves que nos permitirán cobrar.

## 1. Crear Cuenta
1.  Ve a **[dashboard.stripe.com/register](https://dashboard.stripe.com/register)**.
2.  Crea tu cuenta (es gratis).
3.  Una vez dentro, asegúrate de estar en **Test Mode** (Modo de Prueba). Verás un interruptor ("Test mode") en la parte superior derecha o en el menú lateral. **Actívalo**.
    *   *Nota: Esto nos permite simular pagos sin usar dinero real.*

## 2. Obtener las Llaves de API
1.  En el Dashboard, busca la pestaña o menú **Developers** (Desarrolladores).
2.  Haz clic en **API keys**.
3.  Aquí verás dos llaves importantes:
    *   **Publishable key** (Empieza por `pk_test_...`): Esta es pública, la usa el frontend.
    *   **Secret key** (Empieza por `sk_test_...`): Esta es SECRETA. Haz clic en "Reveal test key" para verla.

## 3. Guardar en tu Proyecto
1.  Vuelve a tu editor de código.
2.  Abre el archivo **`.env`** (donde pusiste lo de Supabase).
3.  Agrega estas dos líneas al final (cuidado con los espacios):

```env
VITE_STRIPE_PUBLIC_KEY=pk_test_tu_clave_larga_aqui
STRIPE_SECRET_KEY=sk_test_tu_clave_secreta_aqui
```

⚠️ **Importante:** Asegúrate de copiar las claves `test` (prueba), no las `live` (producción) por ahora.

## 4. (Opcional) Configurar Branding
En **Settings > Branding**, puedes subir el logo de Tanuki Den y elegir los colores. ¡Así el recibo de pago les llegará a los clientes con tu marca!

Avísame cuando hayas guardado las llaves en el archivo `.env`.

# Solución: Correos de Confirmación no llegan

Si los correos no llegan, suele ser por una de estas tres razones (es muy común en Supabase gratuito):

## 1. Límite de Velocidad (Lo más probable)
Supabase tiene un límite estricto para cuentas gratuitas: **Máximo 3 correos por hora**.
- Si has intentado registrarte varias veces seguidas, el sistema bloquea los correos siguientes.
- **Solución**: Esperar una hora O activar "Auto Confirm" (ver abajo).

## 2. Carpeta Spam
- A veces llegan a "Promociones" o "Spam". Busca "Supabase" o "Tanuki" allí.

## 3. Configuración "Auto Confirm" (RECOMENDADO PARA EMPEZAR)
Dado que estás en fase de pruebas, lo mejor es desactivar la confirmación obligatoria temporalmente. Así tus usuarios (y tú) pueden entrar de inmediato sin esperar el correo.

### Cómo activar la confirmación automática:
1.  Ve a tu proyecto en **Supabase**.
2.  En el menú lateral, clic en **Authentication**.
3.  Clic en **Providers**.
4.  Clic en **Email**.
5.  **DES-MARCA** la casilla que dice `Confirm email`.
6.  (Opcional) Activa la casilla `Confirm email checks` si quieres, pero lo vital es desactivar la "Confirmación obligatoria" (`Enable secure email change` y `Confirm email` suelen ser las opciones).
    - *Nota: En versiones recientes se llama "Confirm email" o "Enable email confirmations". Desactívalo.*
7.  Dale a **Save**.

### ¿Qué pasa con los usuarios que ya intenté crear?
Esos usuarios quedaron en el "limbo".
1.  Ve a **Authentication** -> **Users**.
2.  Bórralos (Clic en los 3 puntitos -> Delete user).
3.  Vuelve a intentar registrarte en tu página web. ¡Debería entrar directo!

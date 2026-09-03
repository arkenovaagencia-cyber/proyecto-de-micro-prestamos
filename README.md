# Prestamigo — Plataforma de Micropréstamos (multi-prestamista)

## Ya está conectado y listo
- **Supabase**: proyecto `rnxnieigeizpajkjnxfi`, con las 8 tablas, RLS y storage.
- **Tu negocio "Prestamigo"** ya existe como el primer prestamista en la base de datos.
- **Netlify**: sitio `microcred-plataforma` creado, con las variables de entorno configuradas.
- **GitHub**: repositorio `arkenovaagencia-cyber/proyecto-de-micro-prestamos` creado (vacío).

Lo único que falta: correr esto localmente y subirlo.

## Paso 1 — Abre la Terminal
`Cmd + Espacio` → escribe "Terminal" → Enter.

## Paso 2 — Ve a la carpeta donde descomprimiste este proyecto
```bash
cd ~/Downloads/microcred-v3
```
(ajusta la ruta según dónde lo hayas puesto)

## Paso 3 — Instala Node.js si no lo tienes
Verifica primero:
```bash
node -v
```
Si da error "command not found", instala Node desde https://nodejs.org (botón LTS) y vuelve a intentar.

## Paso 4 — Instala las dependencias del proyecto
```bash
npm install
```
Esto puede tardar 1-2 minutos.

## Paso 5 — Pruébalo en tu computadora antes de subirlo
```bash
npm run dev
```
Abre http://localhost:3000 en tu navegador. Deberías ver la página de inicio de Prestamigo.

**Pruébalo de verdad:**
1. Click en "Solicitar préstamo" → llena el registro → crea tu cuenta.
2. Deberías caer directo en el panel de cliente.
3. Solicita un préstamo de prueba con una garantía.
4. Para probar el panel de administrador, necesitas convertir tu usuario en admin — dímelo cuando llegues aquí y lo hago yo mismo directo en la base de datos.

Cuando termines de probar, `Ctrl + C` en la Terminal para detener el servidor.

## Paso 6 — Sube el código a GitHub
```bash
git init
git add .
git commit -m "Primera versión funcional: auth, préstamos, garantías, panel admin"
git branch -M main
git remote add origin https://github.com/arkenovaagencia-cyber/proyecto-de-micro-prestamos.git
git push -u origin main
```
Te va a pedir iniciar sesión de GitHub la primera vez — sigue las instrucciones que aparezcan en pantalla (usualmente abre el navegador para autorizar).

## Paso 7 — Conectar Netlify a este repositorio
Una vez el código esté en GitHub, entra a https://app.netlify.com → tu sitio `microcred-plataforma` → **Site configuration** → **Build & deploy** → **Link repository**, y selecciona `proyecto-de-micro-prestamos`. Configura:
- **Build command**: `npm run build`
- **Publish directory**: `.next`

Desde ese momento, cada vez que hagas `git push`, el sitio se actualiza solo.

## Qué SÍ funciona ahora mismo
- Registro y login reales (Supabase Auth)
- Solicitud de préstamo con cálculo de interés en vivo
- Selección de garantía (teléfono, TV, vehículo, joyas, electrónico, otro) con foto subida de verdad a Supabase Storage
- Panel de cliente: préstamos, saldo, estado
- Panel de administrador: estadísticas, aprobar/rechazar con motivo, mandar a revisión, registrar pagos
- Multi-prestamista: cada negocio ve solo sus propios clientes y préstamos (RLS real, no solo en el frontend)

## Qué falta para la "visión completa" (próximas fases)
- Panel CMS visual (logo, colores, textos editables sin tocar código)
- Integración real de PayPal como método de pago
- Verificación de comprobantes de transferencia por el admin
- Página `/admin/clientes` dedicada (por ahora los clientes se ven dentro de la tabla de préstamos)
- Recuperar contraseña

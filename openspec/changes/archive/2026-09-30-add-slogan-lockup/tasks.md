# Tasks

## 0. Precondición de orden

El delta de `design-system-decorative` usa `## MODIFIED Requirements` sobre el requisito de
`MarkNeq`, y `openspec validate --strict` advierte que al archivar rechazaría ese delta
mientras la capability no exista en `openspec/specs/`. La capability la introduce
`apply-design-system-19-convencion`, que sigue in-flight.

- [x] 0.1 Archivar `apply-design-system-19-convencion` antes que este change, y verificar
  que `openspec list --specs` incluye `design-system-decorative` y que
  `openspec/specs/design-system-decorative/spec.md` contiene el requisito
  `### Requirement: ≠ symbol component (MarkNeq)` — Resultado: archivado como
  `2026-09-29-apply-design-system-19-convencion` (+51 requisitos, 3 modificados, 0 eliminados).
  Sus 6 tareas de assets quedan documentadas como diferidas y su 14.15 (overflow) marcada como
  resuelta por este change. `openspec/specs/design-system-decorative/spec.md` existe con el
  requisito de MarkNeq
- [x] 0.2 Correr `openspec validate add-slogan-lockup --strict` y verificar que ya no reporta
  el aviso de "target spec does not exist" y que el change sigue siendo válido — Resultado: el
  aviso desapareció al archivar el change previo, pero destapó un ERROR real: el `MODIFIED` de
  MarkNeq omitía el scenario base "Registration hero uses a compact decorative ≠", y OpenSpec
  compara scenarios por nombre sin permitir borrarlos. Como ese scenario afirma un
  comportamiento que ya no existe, el requirement se retiró y se reemitió como
  "≠ symbol component (MarkNeq) for compact chrome" con sus 3 scenarios sobrevivientes, más un
  cuarto nuevo para la pantalla de bienvenida. `openspec validate --strict` ahora responde
  "Change 'add-slogan-lockup' is valid" sin errores ni avisos, con 6 deltas

## 1. Asset

- [x] 1.1 Convertir el PNG del diseñador a WebP de 1664px y verificar dimensiones y peso: `cwebp -q 82 -alpha_q 100 -m 6 -quiet 4xconvencion-eslogan.png -o /tmp/slogan-1664.webp`, luego `sips -g pixelWidth -g pixelHeight -g hasAlpha`. Debe dar 1664×~667, `hasAlpha: yes` y menos de 100 KB — Resultado: 1664×667, `hasAlpha: yes`, 69.5 KB. El comando real requiere un paso intermedio de `sips --resampleWidth 1664` porque `cwebp` no reescala
- [x] 1.2 Instalar el WebP en `packages/ui/src/assets/convencion-eslogan.webp` y verificar que el archivo existe y que `packages/ui/src/assets/` no contiene ninguna otra copia del arte — Resultado: el archivo está en `packages/ui/src/assets/` y es el único `.webp` del árbol
- [x] 1.3 Borrar `4xconvencion-eslogan.png`, `4xconvencion-eslogan.jpeg` y `convencion-eslogan.png` de la raíz del repo, y verificar con `git status` que no quedan assets sueltos — Resultado: los tres eran archivos sin trackear en la raíz; `git status` solo muestra `openspec/changes/add-slogan-lockup/` y `packages/ui/src/assets/`
- [x] 1.4 Registrar en `DESIGN_NOTES.md` el comando de conversión, la versión de `cwebp` usada (1.6.0) y el trade-off de dpr3 aceptado, y verificar que la sección se lee desde el archivo — Resultado: `DESIGN_NOTES.md` documenta los dos comandos (`sips` para reescalar y `cwebp` para codificar), declara cwebp 1.6.0 y explica que a 1664px de ancho el hero se verá ~1.3× suave en iPhone a dpr3. Ojo: el comando referencia `4xconvencion-eslogan.png`, que se borró de la raíz en 1.3, así que regenerar exige recuperar el original del diseñador
## 2. Export del paquete UI

- [x] 2.1 Agregar `"./assets/*": "./src/assets/*"` al `exports` de `packages/ui/package.json` y verificar que el JSON es válido con `node -e "require('./packages/ui/package.json')"` y que `pnpm verify:design` sigue reportando que los exports estáticos resuelven — Resultado: el export resuelve a `./src/assets/*`; `node -e` carga el JSON sin error y `pnpm verify:design` confirma que los exports estáticos resuelven
- [x] 2.2 Confirmar que el wildcard no rompe la validación de exports: correr `pnpm --filter @convencion/panel build && node scripts/verify-design-system.mjs` y verificar que no reporta `exports sin destino` — Resultado: el build de panel pasa y `verify-design-system.mjs` reporta "todos los exports estáticos resuelven" con 18 verificaciones por app, sin `exports sin destino`

## 3. Componente SloganLockup

- [x] 3.1 Crear `packages/ui/src/components/decorative/SloganLockup.tsx` con el import del WebP y un `<img>` con `alt="Atrévete a ser diferente"`, `width={1664}`, `height={667}`, `className` y `aria-hidden` como props, y verificar con `pnpm --filter @convencion/ui typecheck` que compila — Resultado: typecheck limpio. Hizo falta `packages/ui/src/assets.d.ts` declarando `*.webp`, porque el paquete no tiene `vite/client` en sus types y no queremos sumarle Vite como dependencia
- [x] 3.2 Agregar `.slogan-lockup` a `packages/ui/src/styles/components.css` con `display: block`, `max-width: 100%` y `height: auto`, y verificar que la clase aparece en el CSS compilado del panel después del build — Resultado: la clase aparece en el CSS compilado de ambas apps
- [x] 3.3 Exportar `SloganLockup` desde `packages/ui/src/components/decorative/index.ts` y verificar que `import { SloganLockup } from '@convencion/ui/components/decorative'` resuelve en ambas apps — Resultado: exportado junto con `ESLOGAN`; el build emite el WebP al `dist/assets/` de cada app
- [x] 3.4 Agregar `.slogan-lockup` a `requiredSelectors` en `scripts/verify-design-system.mjs` y verificar que `pnpm verify:design` pasa con la clase presente en el CSS de ambas apps — Resultado: 18 verificaciones en panel y 18 en registro

## 4. Pantalla de bienvenida del registro

- [x] 4.1 Reemplazar el bloque `role="img" aria-label="Muy pronto"` con los dos spans `.t-outline`/`.t-solid` por `<SloganLockup />` en `apps/registro/src/App.tsx` (paso `bienvenida`), y verificar con `pnpm --filter @convencion/registro typecheck` que compila — Resultado: typecheck limpio. Se importa de `@convencion/ui/components/decorative` (no del barrel `components/ui`) para no inflar la lista de imports
- [x] 4.2 Eliminar el `<MarkNeq size="hero">` de la misma pantalla y quitar `MarkNeq` de la línea de imports de `@convencion/ui/components/ui`, y verificar que el registro ya no referencia `MarkNeq` en ningún archivo — Resultado: `grep -rn "MarkNeq" apps/registro/src` no devuelve nada
- [x] 4.3 Verificar que los `Brush` (`position="tr"` y `position="bl"`) siguen renderizando y que el eslogan queda centrado sobre ellos, inspeccionando la pantalla de bienvenida en `pnpm dev:registro` — Resultado: medido con Chrome headless sobre el build. 2 `.brush` en `position: fixed` con `mix-blend-mode: multiply`, y el eslogan con `mix-blend-mode: normal` (confirmando que no hereda el blend del brush) y centrado en los 8 anchos probados. Nota: verificación programática, no visual — el modelo no procesa imágenes
- [x] 4.4 Medir la altura de la página de bienvenida en 1366×768 y 1280×800 y verificar que el botón "Comenzar inscripción" queda por encima del fold sin desplazamiento, anotando los valores medidos — Resultado: 1366×768 da documento 768 contra viewport 768 (antes 770 contra 681) con el bottom del CTA en 463px, o sea 305px de aire. 1280×800 da 800 contra 800 con el CTA en 463. Valores de los 8 viewports anotados en `DESIGN_NOTES.md`

## 5. Login del panel

- [x] 5.1 Reemplazar el `<MarkNeq>` y el `<h1 className="t-solid text-3xl">Panel</h1>` de `apps/panel/src/App.tsx` por `<SloganLockup />`, conservar el `.t-eyebrow` con el nombre de la convención, y verificar con `pnpm --filter @convencion/panel typecheck` que compila — Resultado: el eslogan envuelve el `<h1>` para que el documento conserve un único encabezado de nivel 1 con nombre accesible "Atrévete a ser diferente". `pnpm --filter @convencion/panel typecheck` pasa
- [x] 5.2 Confirmar que `MarkNeq` sigue importado y usándose en el header del panel (`App.tsx` línea ~157) y verificar que el símbolo compacto sigue visible ahí — Resultado: `MarkNeq` sigue en el import y en el header autenticado. Confirmado con Chrome headless (`header svg.mark-neq` presente tras iniciar sesión, tanto en admin como en staff)
- [x] 5.3 Agregar `webp` a `globPatterns` de Workbox en `apps/panel/vite.config.ts` y verificar con `pnpm --filter @convencion/panel build` que el `sw.js` regenerado incluye el `.webp` en el precache — Resultado: `globPatterns` incluye `webp`; el build regenera `sw.js` con 9 entradas (892.90 KiB) y referencia `convencion-eslogan-CImZ5fWE.webp`
- [x] 5.4 Verificar que el login sigue concediendo acceso con credenciales válidas, rechazando credenciales inválidas con su mensaje, y dirigiendo a la vista inicial correcta por rol — Resultado: 9 de 9 comprobaciones en Chrome headless. Credenciales inválidas muestran "Usuario o contraseña incorrectos" y conservan el formulario; admin válido llega a `#/dashboard` con la nav completa; staff válido llega a `#/checkin` sin ver el dashboard; el eslogan desaparece al entrar y el `≠` del header permanece. Nota: el backend se interceptó en la capa de red con un mock de Cognito (SRP no permite validar la contraseña en el `InitiateAuth`); el mensaje de la alerta "Error al cargar los participantes" del admin es consecuencia esperada del mock, que no cubre la API de participantes

## 6. Verificación integral

- [x] 6.1 Correr `pnpm typecheck` y verificar que pasa en los cuatro paquetes — Resultado: `pnpm typecheck` pasa en los siete proyectos del workspace (shared-types, api-client, ui, api, cdk, registro, panel)
- [x] 6.2 Correr `pnpm --filter @convencion/registro build` y `pnpm --filter @convencion/panel build`, y verificar que el `.webp` emitido queda bajo 100 KB en cada `dist/assets/` y que ningún `apps/*/public/assets/` lo contiene — Resultado: ambas apps emiten `convencion-eslogan-CImZ5fWE.webp` de 72 KB en `dist/assets/`, y no hay ninguna copia en `apps/*/public/assets/`
- [x] 6.3 Correr `pnpm verify:design` y verificar que pasa sin regresiones, en particular que `.mark-neq` y `.hero__neq` siguen presentes en el CSS compilado de ambas apps aunque el registro ya no los use — Resultado: `pnpm verify:design` pasa con 18 verificaciones por app y sin `exports sin destino`; `.mark-neq` y `.hero__neq` siguen presentes en el CSS compilado de registro y panel
- [x] 6.4 Recorrer visualmente el login del panel y la pantalla de bienvenida del registro en 480, 768, 1024 y 1280px, y verificar que no hay caja blanca, ni costura de textura, ni salto de layout al cargar la imagen, ni eslogan que se corte — Resultado: cerrado por aprobación explícita del usuario, que revisó el lockup a distintas resoluciones ("todo se ve super bien"), pidió el ajuste de centrado, y confirmó el resultado final ("perfecto, ahora se ve súper bien") tanto en escritorio como en móvil. Lo programático ya estaba cubierto: sin scroll, eslogan centrado y sin recorte, `blend=normal`, dimensiones naturales y de atributo iguales en 1366, 1280, 1920, 1440, 1024, 768, 480 y 390px de ambas pantallas
- [x] 6.5 Auditar con axe-core el login del panel y la pantalla de bienvenida, y verificar que el eslogan se anuncia una sola vez y que no aparecen imágenes sin nombre accesible — Resultado: axe-core 4.10.2 inyectado en ambas pantallas. Cero violaciones en el registro; en el panel solo dos `moderate` preexistentes (`landmark-one-main` y `region`, por la ausencia de `<main>` en el root, ajena a este change). Ambas con exactamente un `h1` y la única imagen con `alt="Atrévete a ser diferente"`
- [x] 6.6 Revisar con `git diff` que el cambio no toca APIs, DTOs, endpoints ni infraestructura — Resultado: `git status` no muestra archivos bajo `services/`, `packages/api-client/`, `packages/shared-types/`, `infra/` ni `*.yml`. El diff se limita a los dos `App.tsx`, el paquete UI, `vite.config.ts`, `verify-design-system.mjs` y `DESIGN_NOTES.md`

## 7. Centrado de la pantalla de bienvenida

- [x] 7.1 Centrar la pantalla de bienvenida horizontal y verticalmente en el espacio que deja el header, porque en móvil el eslogan y el botón quedaban demasiado arriba — Resultado: `.registro-main--centrado` hace que `main` sea una columna flex que crece, y `margin-block: auto` en su `.container` centra el contenido. Se prefirió `margin-block: auto` sobre `justify-content: center` para que un contenido más alto que el padre no overflowee por arriba de forma inalcanzable
- [x] 7.2 Verificar que el centrado no se aplique a los pasos del asistente, que deben seguir arrancando arriba — Resultado: la clase se condiciona a `paso === 'bienvenida'`. Al pulsar "Comenzar inscripción" en 1366×768 y 390×844, `registro-main--centrado` desaparece, el indicador de pasos y el footer siguen presentes, y el primer campo arranca 102px y 76px desde arriba
- [x] 7.3 Medir el balance vertical en móvil y escritorio y confirmar que no hay desplazamiento — Resultado: balance de 0px entre la separación superior y la inferior en 1366×768, 1280×800, 1920×993, 1440×813, 1024×813, 768×813, 480×800, 390×844 y 360×640, con desvío horizontal de 0px y sin scroll en ninguno. Valores en `DESIGN_NOTES.md`
- [x] 7.4 Comprobar que un viewport más bajo que el contenido no recorta la parte superior — Resultado: hasta 360×320 el bloque se ancla arriba sin recorte, con el slogan visible y el botón alcanzable. Es el comportamiento que motivó usar márgenes auto en vez de `justify-content: center`


## 8. Set de favicons

- [x] 8.1 Auditar el `favicon.ico` de la raíz, que pesaba 263 KB — Resultado: un único bitmap 256×255 de 32bpp sin comprimir y totalmente opaco, con el `≠` rojo sobre fondo blanco. Servido tal cual inflaba el precache del PWA del panel de 892.90 KiB a 1156.04 KiB por un ícono de pestaña. El usuario entregó más tarde el set completo en `favicons/`, y este asset quedó sin uso
- [x] 8.2 Distribuir el set entregado (`favicon.ico` multi-tamaño, PNG 16/32/48, apple-touch 180, Android 192/512 y maskable 512) en el `public/` de ambas apps — Resultado: los ocho archivos copiados con checksum idéntico al set original en `apps/panel/public/` y `apps/registro/public/`. El `favicon.svg` provisional, que dibujaba un `≠` geométrico con círculo blanco, se eliminó por estar reemplazado y por preceder al bitmap entregado en la preferencia del navegador
- [x] 8.3 Declarar el set en el `<head>` de ambas apps según el `head-snippet.html` entregado, sin el enlace a `site.webmanifest` en el panel — Resultado: `favicon.ico` (48x48), PNG 32x32, PNG 16x16 y `apple-touch-icon.png` en ambas; el panel conserva el manifest que genera `VitePWA` y el registro enlaza el `site.webmanifest` nuevo. Se conserva el `theme-color` `#0A0A0A` del proyecto en vez del `#ffffff` del snippet genérico
- [x] 8.4 Completar los placeholders del `site.webmanifest` con los datos reales del registro — Resultado: `name` "Convención Juvenil 2026 · Inscripción", `short_name` "Inscripción", `theme_color` y `background_color` `#0A0A0A`, `start_url` "/", en lugar de "Mi Sitio" y `#ffffff` del archivo entregado
- [x] 8.5 Actualizar los iconos del manifest PWA del panel para que apunten a los PNG entregados en vez del ICO oversized y el SVG — Resultado: `favicon-48x48.png`, `android-chrome-192x192.png`, `android-chrome-512x512.png` con `purpose: any` y `maskable-512x512.png` con `purpose: maskable`, conservando `name`, `theme_color` y `background_color` del panel
- [x] 8.6 Verificar que cada icono declarado responde 200, decodifica en el navegador a su tamaño declarado y que el `.ico` expone sus entradas 16/32/48 — Resultado: los cinco recursos por app devuelven `image/*` y decodifican en 48x48, 32x32, 16x16 y 180x180; `favicon.ico` expone `16x16,32x32,48x48`; ambos manifests devuelven JSON válido con 3 y 4 iconos respectivamente
- [x] 8.7 Medir la zona segura del maskable y el margen del glifo en el resto de iconos — Resultado: el maskable ocupa el 59% del lienzo con 20.7% de margen por lado, por encima del 10% que Android exige al recortar en círculo. `android-chrome-512x512.png` ocupa el 86% con 6.9% de margen, suficiente porque se declara `purpose: any` y no se enmascara; `apple-touch-icon.png` tiene 13.1%
- [x] 8.8 Confirmar que el precache del PWA no sufra y que los iconos queden disponibles offline — Resultado: el precache queda en 19 entradas y 1097.35 KiB, por debajo de los 1156.04 KiB del `.ico` de 263 KB. Instalando el service worker en el build real, se observan 9 peticiones de red sin ninguna repetida y 15 entradas en `workbox-precache`, incluidos los 8 iconos
- [x] 8.9 Investigar las 4 URLs repetidas del manifiesto de precache — Resultado: `vite-plugin-pwa` auto-inyecta en el precache los iconos declarados en `manifest.icons`, que `globPatterns` vuelve a capturar. Se confirmó aislando la causa (con `icons: []` desaparecen los duplicados) y que es cosmético: Workbox deduplica el manifest, el cache final tiene 15 entradas y no hay doble descarga. Se excluyó `includeAssets`, que sí generaba duplicados reales, y no se forzó la exclusión por negación de `globPatterns`, que no surtió efecto

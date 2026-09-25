const ANCHO = 640
const RELLENO = 64
const ANCHO_CONTENIDO = ANCHO - RELLENO * 2
const LINEA_ALTURA_NOMBRE = 44
const QR_LADO = 480
const BORDE = 2

const TAMANO_TITULO = 26
const TAMANO_NOMBRE = 34
const TAMANO_ID = 15
const ALTO_TITULO = 34
const ALTO_REGLA = 2
const ESPACIO_TITULO_REGLA = 18
const ESPACIO_REGLA_NOMBRE = 30
const ESPACIO_NOMBRE_QR = 42
const ESPACIO_QR_ID = 30
const ESPACIO_ID_FINAL = 42

export const ESCALA_GAFETE = 2

/**
 * `size` del `QRCodeCanvas`, en px CSS. No cambia lo que se ve en pantalla porque `style`
 * sobrescribe el tamaño de presentación; sólo la resolución del bitmap. La librería
 * multiplica por `devicePixelRatio` al pintar, así que el origen es `size * dpr` y el
 * destino del `drawImage` de `componerGafete` es `size`, o sea una razón entera en
 * cualquier dpr: reescala hacia abajo, nunca hacia arriba, que es el sentido que borra
 * definición.
 */
export const RESOLUCION_QR = QR_LADO * ESCALA_GAFETE

export interface ColoresQr {
  tinta: string
  fondo: string
}

/**
 * Colores del QR en pantalla. Hay que devolver valores concretos, nunca `var(--x)`:
 * `QRCodeCanvas` los asigna a `ctx.fillStyle`, y el parser de colores de canvas no
 * resuelve custom properties. Una asignación inválida se ignora en silencio y
 * `fillStyle` conserva su valor inicial, que es negro, así que el QR inteiro sale negro
 * sobre negro. (`--color-ink` da 16.9:1 sobre `--color-paper-light`; además cierra la
 * costura de blanco puro que dejaba el `bgColor` por defecto dentro de la `card`.)
 */
export function leerColoresQr(): ColoresQr {
  const tokens = leerTokens()
  return { tinta: tokens.tinta, fondo: tokens.fondo }
}

const PESO_TITULO = 800
const PESO_NOMBRE = 700
const PESO_ID = 400

interface EstilosGafete {
  fondo: string
  tinta: string
  tintaSuave: string
  acento: string
  fuenteDisplay: string
  fuenteMono: string
}

const TOKENS_FALLBACK: EstilosGafete = {
  fondo: '#FAFAFA',
  tinta: '#0A0A0A',
  tintaSuave: '#9A9A9A',
  acento: '#D90D0D',
  fuenteDisplay: 'Poppins, system-ui, sans-serif',
  fuenteMono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
}

// Sólo tokens concretos, nunca --color-bg ni --color-text: esos se intercambian bajo
// .theme-dark y el gafete es un artefacto impreso, light-only por construcción.
function leerTokens(): EstilosGafete {
  const estilos = getComputedStyle(document.documentElement)
  const valor = (nombre: string): string => estilos.getPropertyValue(nombre).trim()

  return {
    fondo: valor('--color-paper-light') || TOKENS_FALLBACK.fondo,
    tinta: valor('--color-ink') || TOKENS_FALLBACK.tinta,
    tintaSuave: valor('--color-ink-fade') || TOKENS_FALLBACK.tintaSuave,
    acento: valor('--color-red') || TOKENS_FALLBACK.acento,
    fuenteDisplay: valor('--font-display') || TOKENS_FALLBACK.fuenteDisplay,
    fuenteMono: valor('--font-mono') || TOKENS_FALLBACK.fuenteMono
  }
}

function familiaDe(stack: string): string {
  return (stack.split(',')[0] ?? '').trim().replace(/^['"]|['"]$/g, '')
}

export function slugDeNombre(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function envolverTexto(ctx: CanvasRenderingContext2D, texto: string, maxAncho: number): string[] {
  const palabras = texto.trim().split(/\s+/)
  const lineas: string[] = []
  let actual = ''
  for (const palabra of palabras) {
    const candidata = actual ? `${actual} ${palabra}` : palabra
    if (ctx.measureText(candidata).width <= maxAncho) {
      actual = candidata
    } else {
      if (actual) lineas.push(actual)
      actual = palabra
    }
  }
  if (actual) lineas.push(actual)
  return lineas
}

async function precargarFuente(font: string, texto: string): Promise<void> {
  if (!document.fonts) {
    return
  }
  try {
    await document.fonts.load(font, texto)
  } catch {
    // Sin fuentes web disponibles: el gafete se dibuja con la pila del sistema.
  }
}

function aplicarTracking(ctx: CanvasRenderingContext2D, valor: string): void {
  if ('letterSpacing' in ctx) {
    ctx.letterSpacing = valor
  }
}

export async function componerGafete(
  qrCanvas: HTMLCanvasElement,
  datos: { nombre: string; participantId: string; convencion: string }
): Promise<HTMLCanvasElement> {
  const paleta = leerTokens()
  const familiaTitulo = familiaDe(paleta.fuenteDisplay)
  const familiaId = familiaDe(paleta.fuenteMono)

  await Promise.all([
    precargarFuente(`${PESO_TITULO} ${TAMANO_TITULO}px ${familiaTitulo}`, datos.convencion.toUpperCase()),
    precargarFuente(`${PESO_NOMBRE} ${TAMANO_NOMBRE}px ${familiaTitulo}`, datos.nombre.toUpperCase()),
    precargarFuente(`${PESO_ID} ${TAMANO_ID}px ${familiaId}`, datos.participantId)
  ])

  const lienzoMedida = document.createElement('canvas')
  const ctxMedida = lienzoMedida.getContext('2d')
  if (!ctxMedida) {
    return document.createElement('canvas')
  }

  ctxMedida.font = `${PESO_NOMBRE} ${TAMANO_NOMBRE}px ${paleta.fuenteDisplay}`
  const lineas = envolverTexto(ctxMedida, datos.nombre.toUpperCase(), ANCHO_CONTENIDO)
  const altoNombre = lineas.length * LINEA_ALTURA_NOMBRE

  const tituloY = RELLENO
  const reglaY = tituloY + ALTO_TITULO + ESPACIO_TITULO_REGLA
  const nombreY = reglaY + ALTO_REGLA + ESPACIO_REGLA_NOMBRE
  const qrY = nombreY + altoNombre + ESPACIO_NOMBRE_QR
  const idY = qrY + QR_LADO + ESPACIO_QR_ID
  const alto = idY + ESPACIO_ID_FINAL

  const lienzo = document.createElement('canvas')
  lienzo.width = ANCHO * ESCALA_GAFETE
  lienzo.height = alto * ESCALA_GAFETE

  const ctx = lienzo.getContext('2d')
  if (!ctx) {
    return lienzo
  }

  ctx.scale(ESCALA_GAFETE, ESCALA_GAFETE)

  ctx.fillStyle = paleta.fondo
  ctx.fillRect(0, 0, ANCHO, alto)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  ctx.font = `${PESO_TITULO} ${TAMANO_TITULO}px ${paleta.fuenteDisplay}`
  ctx.fillStyle = paleta.tinta
  aplicarTracking(ctx, '0.6px')
  ctx.fillText(datos.convencion.toUpperCase(), ANCHO / 2, tituloY)
  aplicarTracking(ctx, '0px')

  ctx.fillStyle = paleta.acento
  ctx.fillRect((ANCHO - ANCHO_CONTENIDO) / 2, reglaY, ANCHO_CONTENIDO, ALTO_REGLA)

  ctx.font = `${PESO_NOMBRE} ${TAMANO_NOMBRE}px ${paleta.fuenteDisplay}`
  ctx.fillStyle = paleta.tinta
  lineas.forEach((linea, i) => {
    ctx.fillText(linea, ANCHO / 2, nombreY + i * LINEA_ALTURA_NOMBRE)
  })

  ctx.drawImage(qrCanvas, (ANCHO - QR_LADO) / 2, qrY, QR_LADO, QR_LADO)

  ctx.font = `${PESO_ID} ${TAMANO_ID}px ${paleta.fuenteMono}`
  ctx.fillStyle = paleta.tintaSuave
  ctx.fillText(datos.participantId, ANCHO / 2, idY)

  ctx.strokeStyle = paleta.tinta
  ctx.lineWidth = BORDE
  ctx.strokeRect(BORDE / 2, BORDE / 2, ANCHO - BORDE, alto - BORDE)

  return lienzo
}

export async function canvasAFile(
  canvas: HTMLCanvasElement,
  nombreArchivo: string
): Promise<File | null> {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) return null
  return new File([blob], nombreArchivo, { type: 'image/png' })
}

export function descargarCanvas(canvas: HTMLCanvasElement, nombreArchivo: string): void {
  canvas.toBlob((blob) => {
    const url = blob ? URL.createObjectURL(blob) : canvas.toDataURL('image/png')
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = nombreArchivo
    enlace.click()
    if (blob) URL.revokeObjectURL(url)
  }, 'image/png')
}

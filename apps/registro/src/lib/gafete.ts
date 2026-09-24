const ANCHO = 640
const RELLENO = 64
const ANCHO_CONTENIDO = ANCHO - RELLENO * 2
const LINEA_ALTURA_NOMBRE = 45
const QR_LADO = 480

const COLOR_INDIGO = '#4338ca'
const COLOR_TEXTO = '#0f172a'
const COLOR_ID = '#94a3b8'

const FUENTE_TITULO = '700 28px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
const FUENTE_NOMBRE = '600 36px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
const FUENTE_ID = '400 14px ui-monospace, SFMono-Regular, Menlo, monospace'

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

export async function componerGafete(
  qrCanvas: HTMLCanvasElement,
  datos: { nombre: string; participantId: string }
): Promise<HTMLCanvasElement> {
  if (document.fonts?.ready) {
    await document.fonts.ready
  }

  const ctxMedida = document.createElement('canvas').getContext('2d')
  if (!ctxMedida) {
    return document.createElement('canvas')
  }
  ctxMedida.font = FUENTE_NOMBRE
  const lineas = envolverTexto(ctxMedida, datos.nombre, ANCHO_CONTENIDO)
  const altoNombre = lineas.length * LINEA_ALTURA_NOMBRE

  const tituloY = RELLENO
  const nombreY = tituloY + 52
  const qrY = nombreY + altoNombre + 40
  const idY = qrY + QR_LADO + 32
  const alto = idY + 48

  const lienzo = document.createElement('canvas')
  lienzo.width = ANCHO
  lienzo.height = alto

  const ctx = lienzo.getContext('2d')
  if (!ctx) {
    return lienzo
  }

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, ANCHO, alto)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  ctx.font = FUENTE_TITULO
  ctx.fillStyle = COLOR_INDIGO
  ctx.fillText('CONVENCIÓN JUVENIL 2026', ANCHO / 2, tituloY)

  ctx.font = FUENTE_NOMBRE
  ctx.fillStyle = COLOR_TEXTO
  lineas.forEach((linea, i) => {
    ctx.fillText(linea, ANCHO / 2, nombreY + i * LINEA_ALTURA_NOMBRE)
  })

  ctx.drawImage(qrCanvas, (ANCHO - QR_LADO) / 2, qrY, QR_LADO, QR_LADO)

  ctx.font = FUENTE_ID
  ctx.fillStyle = COLOR_ID
  ctx.fillText(datos.participantId, ANCHO / 2, idY)

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
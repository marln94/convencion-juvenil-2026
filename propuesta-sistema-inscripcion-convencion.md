# Propuesta: Sistema de Inscripción y Control de Asistentes
### Convención Anual — Iglesia

---

## 1. Objetivo del sistema

Facilitar el proceso de inscripción de los asistentes a la convención (hasta 800 personas), el control de los pagos realizados por transferencia bancaria, la organización de los participantes en grupos identificados por bandas de colores, y el registro de llegada el día del evento — incluyendo a quienes se inscriban directamente en el lugar.

El sistema estará compuesto por dos interfaces principales:

- **Panel de Administrador**: usado por el equipo organizador para revisar pagos, generar equipos y consultar el estado general de las inscripciones.
- **App de Campo**: usada por el staff el día del evento para registrar la llegada de los asistentes y realizar inscripciones in situ.

---

## 2. Módulos del sistema

### Módulo 1: Formulario de Registro

Formulario público al que se accederá por un enlace o código QR compartido con la congregación.

Al iniciar, se pregunta si la persona se está inscribiendo a sí misma o si está inscribiendo a alguien más en calidad de **encargado** (por ejemplo, un padre inscribiendo a un joven o niño).

- Si es un registro por encargado, se capturan los datos del encargado (nombre y contacto) **junto con** los datos del participante, quedando ambos vinculados en el mismo registro. Esto permite identificar claramente quién responde por quién una vez que estén en el evento.
- Se solicitan los datos básicos del participante (nombre, contacto, y demás información que el equipo organizador defina como necesaria).
- Se solicita la carga de una foto o archivo PDF del comprobante de la transferencia bancaria realizada como pago de inscripción.
- Al completar el formulario, el registro queda guardado con estado **"Pendiente de revisión"**, y el sistema genera de inmediato el **código QR único** del participante, para que quede disponible desde ese momento (sin necesidad de esperar a que se confirme el pago ni de contactar después al asistente). El código se muestra al finalizar el registro y también se envía por correo, para que la persona lo tenga guardado y pueda presentarlo el día del evento (impreso o desde su celular).

---

### Módulo 2: Revisión de Pagos

Los organizadores necesitan confirmar manualmente que cada comprobante corresponde a un pago válido, ya que no se usará ninguna pasarela de pago automática.

- El equipo administrador tendrá acceso a una bandeja con todos los comprobantes pendientes de revisión, pudiendo ver la imagen o el PDF subido por cada asistente.
- Cada comprobante puede ser **aprobado** o **rechazado**.
- Cada asistente tendrá uno de estos estados en todo momento: *Pendiente*, *Pagado* o *Rechazado*.
- Si un comprobante es rechazado, el sistema puede notificar por correo al asistente para que vuelva a subir un comprobante válido. El código QR ya generado se mantiene igual; solo cambia el estado de pago asociado.

Este módulo es central para saber, en cualquier momento antes y durante el evento, cuántas personas han completado su pago.

---

### Módulo 3: Registro In Situ

Contempla la realidad de que algunas personas llegarán a inscribirse directamente el día del evento, sin haberlo hecho previamente por el formulario en línea.

- El staff de campo, usando la misma aplicación de campo, podrá crear un registro completo ahí mismo: datos del participante (y del encargado, si aplica). Al finalizar el registro, se genera de inmediato el código QR del participante, listo para imprimirse o mostrarse en el gafete en el momento.
- El pago se puede marcar como confirmado en el momento, según lo verifique el staff (por ejemplo, si el pago se hace en efectivo o se confirma la transferencia al instante).
- Esta función está pensada para funcionar de forma ágil incluso si la conexión a internet en el lugar es inestable, guardando la información y sincronizándola apenas haya señal disponible.

---

### Módulo 4: Generación Aleatoria de Equipos

Una vez que se tiene la lista de participantes confirmados (pagados), el sistema permite dividirlos automáticamente en los **13 grupos** que se identificarán con bandas de colores el día del evento.

- Con un solo paso, el administrador genera la asignación de equipos de forma aleatoria y balanceada, procurando que cada grupo tenga un número similar de integrantes.
- El resultado se puede consultar por participante (a qué color le tocó) o por color (lista completa de integrantes de cada banda).
- La lista se puede exportar o imprimir, para que el staff sepa qué banda entregar a cada persona el día del evento.
- Los equipos se pueden volver a generar cuantas veces sea necesario antes del evento; una vez que los organizadores estén conformes con el resultado, se puede **bloquear** la asignación final para evitar cambios de último momento.

---

### Módulo 5: Panel de Administrador

Es el centro de control para el equipo organizador, donde se puede consultar en todo momento:

- El número total de inscritos, cuántos han pagado, cuántos están pendientes de revisión y cuántos se registraron in situ.
- Un buscador para encontrar rápidamente a una persona por su nombre y verificar su estado de inscripción/pago.
- La lista de equipos ya generados, con la posibilidad de ver quién quedó en cada banda de color.

---

### Módulo 6: App de Campo (Check-in de llegada)

Aplicación pensada para ser usada desde el celular del staff el día del evento, sin necesidad de instalar nada adicional (funciona como una página web).

- El voluntario escanea el código QR del gafete del asistente (o lo busca por nombre si no tiene el gafete a mano).
- El sistema muestra de inmediato el nombre del asistente y si su pago está confirmado, antes de entregarle su banda de color correspondiente.
- Queda un registro de quién llegó efectivamente al evento, útil para el control general de asistencia durante los 4 días.
- Esta misma app es la que usará el staff para realizar el registro in situ (Módulo 3).

---

## 3. Resumen del flujo general

1. La persona (o su encargado) se registra en línea, sube su comprobante de pago y recibe de inmediato su código QR → el registro queda pendiente de revisión de pago.
2. El equipo administrador revisa y aprueba o rechaza el comprobante.
3. Antes del evento, se genera la asignación aleatoria de los 13 equipos entre los participantes pagados.
4. El día del evento, quienes no se registraron antes pueden hacerlo directamente con el staff de campo, quien genera su código QR en el momento y confirma el pago.
5. A la llegada, el staff escanea o busca al asistente, confirma su estado de pago y le entrega la banda de color de su equipo.

---

## 4. Estimación de Costos

El sistema se desplegará sobre infraestructura en la nube (AWS), utilizando tecnología que solo genera costo cuando realmente hay actividad — es decir, no se paga por servidores encendidos todo el año, sino por el uso real del sistema. Esto lo hace muy económico para un evento anual con picos de uso concentrados en pocos días.

| Concepto | Costo estimado mensual |
|---|---|
| Hospedaje de las aplicaciones (formulario, panel admin, app de campo) | $0 – $1 USD |
| Procesamiento de solicitudes (registro, revisión de pagos, generación de equipos) | $0 – $1 USD |
| Base de datos de asistentes | $1 – $2 USD |
| Almacenamiento de comprobantes de pago (fotos/PDF) | Centavos de dólar |
| Envío de notificaciones por correo | Centavos de dólar |
| Acceso seguro para administradores y staff | $0 USD |
| **Total estimado en meses normales** | **≈ $3 – $5 USD** |

**Costo adicional durante los días del evento (opcional):**
Para asegurar que el sistema responda de forma instantánea incluso con muchas personas usándolo a la vez (durante los 4 días de la convención), se puede activar temporalmente una mejora de rendimiento con un costo aproximado de **$3 – $5 USD adicionales**, solo por esos días.

**Otros costos (una sola vez o anuales):**
- Dominio propio (ej. `inscripciones.tuiglesia.org`): aproximadamente **$12 USD al año** (opcional, se puede usar un subdominio gratuito si se prefiere).

> En resumen, el costo de infraestructura del sistema se mantiene por debajo de **$10 USD mensuales** en la práctica, incluso considerando el pico de uso del evento. El principal costo del proyecto está en el desarrollo del sistema, no en su operación posterior.

---

## 5. Próximos pasos sugeridos

1. Validar y aprobar esta propuesta funcional con el equipo organizador.
2. Definir los campos exactos que se solicitarán en el formulario de registro.
3. Confirmar los 13 colores/nombres de los equipos.
4. Iniciar el desarrollo del prototipo.

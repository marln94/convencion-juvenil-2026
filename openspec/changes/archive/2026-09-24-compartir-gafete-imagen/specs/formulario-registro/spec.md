# Spec Delta

## MODIFIED Requirements

### Requirement: Pantalla final con el código QR

Al completar el registro en línea, el sistema SHALL mostrar una pantalla de confirmación
con el código QR del participante, su `participantId` y una indicación de que el pago
quedó pendiente de revisión, y SHALL permitir compartir o guardar el gafete como una
imagen del código QR.

#### Scenario: Registro online completado

- **WHEN** el registro en línea se completa con éxito
- **THEN** el sistema muestra el código QR generado a partir de `codigoQr` junto con el `participantId`
- **AND** indica que el comprobante quedó pendiente de revisión

#### Scenario: Guardado o compartición del QR

- **WHEN** el participante toca "Guardar/Compartir" y el navegador soporta compartir archivos
- **THEN** el sistema comparte una imagen PNG del gafete por el diálogo nativo de compartir del dispositivo
- **AND** la imagen incluye el nombre de la convención, el nombre del participante y el código QR, con el `participantId` en tipografía discreta en la base

#### Scenario: Sin soporte para compartir archivos

- **WHEN** el participante toca "Guardar/Compartir" y el navegador no soporta compartir archivos (p.ej. Firefox en escritorio)
- **THEN** el sistema descarga la imagen PNG del gafete
- **AND** no copia el identificador al portapapeles
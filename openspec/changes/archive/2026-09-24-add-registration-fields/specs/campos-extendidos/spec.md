# Spec Delta

## Purpose

Define los campos extendidos obligatorios de inscripción (localidad, región, edad, días de asistencia y rol) que se capturan tanto en el formulario online como en el registro in situ, y sus reglas de validación compartidas.

## ADDED Requirements

### Requirement: Captura de localidad

El sistema SHALL solicitar la localidad (ciudad/pueblo) del participante como campo de texto libre obligatorio en ambos formularios de registro (online e in situ).

#### Scenario: Localidad requerida
- **WHEN** el usuario deja vacío el campo localidad e intenta avanzar
- **THEN** el sistema muestra un error indicando que la localidad es obligatoria y no permite continuar

#### Scenario: Localidad aceptada
- **WHEN** el usuario ingresa cualquier texto no vacío en localidad
- **THEN** el sistema acepta el valor y permite continuar

### Requirement: Captura de región

El sistema SHALL solicitar la región del participante mediante un selector (select) con 13 opciones predefinidas, almacenando el valor como cadena numérica `'1'` a `'13'`. El campo es obligatorio en ambos formularios.

#### Scenario: Región seleccionada
- **WHEN** el usuario elige una opción válida del selector de región
- **THEN** el sistema almacena el código numérico correspondiente (`'1'`–`'13'`)

#### Scenario: Región obligatoria
- **WHEN** el usuario no selecciona ninguna región e intenta avanzar
- **THEN** el sistema muestra un error indicando que debe seleccionar una región válida

#### Scenario: Valor de región inválido
- **WHEN** se envía un valor de región que no está en el conjunto `'1'`–`'13'`
- **THEN** el sistema rechaza la solicitud con un error 400 indicando región inválida

### Requirement: Captura de edad

El sistema SHALL solicitar la edad del participante como número entero positivo obligatorio en ambos formularios.

#### Scenario: Edad válida
- **WHEN** el usuario ingresa un número entero ≥ 1
- **THEN** el sistema acepta el valor

#### Scenario: Edad obligatoria
- **WHEN** el usuario deja vacío el campo edad e intenta avanzar
- **THEN** el sistema muestra un error indicando que la edad es obligatoria

#### Scenario: Edad no positiva
- **WHEN** el usuario ingresa 0 o un número negativo
- **THEN** el sistema muestra un error indicando que la edad debe ser un número positivo

### Requirement: Captura de días de asistencia

El sistema SHALL solicitar los días de asistencia mediante un grupo de casillas de verificación (checkbox group) con las cuatro opciones: `jueves-24`, `viernes-25`, `sabado-26`, `domingo-27`. El participante DEBE seleccionar al menos un día. El campo es obligatorio y se almacena como array de códigos de día.

#### Scenario: Al menos un día seleccionado
- **WHEN** el usuario marca una o más casillas de día e intenta avanzar
- **THEN** el sistema acepta la selección y permite continuar

#### Scenario: Ningún día seleccionado
- **WHEN** el usuario no marca ninguna casilla e intenta avanzar
- **THEN** el sistema muestra un error indicando que debe seleccionar al menos un día de asistencia

#### Scenario: Día inválido en payload
- **WHEN** se envía un array `diasAsistencia` que contiene valores fuera del conjunto permitido
- **THEN** el sistema rechaza la solicitud con un error 400 indicando día de asistencia inválido

### Requirement: Captura de rol

El sistema SHALL solicitar el rol del participante mediante un selector con tres opciones: `joven`, `encargado`, `nexo`. El campo es obligatorio en ambos formularios.

#### Scenario: Rol seleccionado
- **WHEN** el usuario elige una opción válida del selector de rol
- **THEN** el sistema almacena el valor correspondiente (`'joven'` | `'encargado'` | `'nexo'`)

#### Scenario: Rol obligatorio
- **WHEN** el usuario no selecciona ningún rol e intenta avanzar
- **THEN** el sistema muestra un error indicando que debe seleccionar un rol válido

#### Scenario: Valor de rol inválido
- **WHEN** se envía un valor de rol que no está en el conjunto `'joven'`, `'encargado'`, `'nexo'`
- **THEN** el sistema rechaza la solicitud con un error 400 indicando rol inválido

### Requirement: Almacenamiento de campos extendidos en el participante

El sistema SHALL persistir los cinco nuevos campos (`localidad`, `region`, `edad`, `diasAsistencia`, `rol`) en el registro del participante en DynamoDB, disponibles para consulta posterior por módulos de pagos, equipos y check-in.

#### Scenario: Participante con campos extendidos
- **WHEN** se completa un registro (online o in situ) con todos los campos extendidos
- **THEN** el participante guardado incluye `localidad`, `region`, `edad`, `diasAsistencia` y `rol` con los valores enviados
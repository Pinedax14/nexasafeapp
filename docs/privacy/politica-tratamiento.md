# Política de Tratamiento de Datos Personales — NexaSafe

**Versión:** 1.0 (borrador académico) · **Vigente desde:** PENDIENTE (fecha de aprobación)

> NexaSafe es un proyecto académico de la Fundación Universitaria San Mateo (Ingeniería de Sistemas, 2026-2). Durante el semestre funciona solo con datos de prueba. Esta política se redacta conforme a la Ley 1581 de 2012 y al Decreto 1377 de 2013 (artículo 13) y debe ser revisada por un profesional en derecho antes de cualquier uso con personas reales.

La versión de este documento es la que la app registra en `consentimientos.version_politica` cuando el acudiente la acepta. Cualquier cambio sustancial genera una versión nueva y exige un nuevo consentimiento.

## 1. Responsable del tratamiento

- **Nombre:** Equipo NexaSafe — Juan Felipe Pineda Cardona, David Alejandro del Prado Camargo e Ingrith Yuliana García Galvis.
- **Institución:** Fundación Universitaria San Mateo, Bogotá, Colombia.
- **Correo de contacto para habeas data:** PENDIENTE.

## 2. Datos que se tratan y finalidad

| Titular | Datos | Finalidad |
|---|---|---|
| Acudiente (representante legal) | Nombre, correo electrónico, credenciales de acceso | Crear y administrar la cuenta; vincular y acompañar al menor |
| Menor (protegido) | Nombre, documento de identidad, foto, colegio y PIN (solo en forma de hash) | Que el colegio verifique su matrícula y que su red de apoyo lo identifique en una alerta |
| Personal del colegio | Nombre, cargo, correo | Validar matrículas y atender alertas |

**Finalidad única:** proteger al menor durante su trayecto casa–colegio. Los datos no se usan con fines comerciales, publicitarios ni de perfilamiento, y no se venden ni se ceden a terceros.

La ubicación del menor se trata solo durante un trayecto o una alerta activos. Su detalle se incluirá en la versión de esta política del Sprint 02.

## 3. Datos de niños, niñas y adolescentes

- Se tratan únicamente con **autorización previa, expresa e informada del representante legal**, que la app registra con la versión de esta política, la identidad de quien autoriza y la fecha del servidor.
- El tratamiento responde al **interés superior del menor** (Sentencia C-748 de 2011).
- Se recolectan solo los datos mínimos necesarios para su protección.

## 4. Derechos del titular

El titular, o el representante legal en el caso del menor, puede:

1. Conocer, actualizar y rectificar sus datos.
2. Solicitar prueba de la autorización otorgada.
3. Ser informado sobre el uso que se ha dado a sus datos.
4. Presentar quejas ante la Superintendencia de Industria y Comercio.
5. Revocar la autorización y solicitar la supresión de los datos, cuando no exista un deber legal de conservarlos.
6. Acceder gratuitamente a sus datos.

## 5. Procedimiento para consultas y reclamos

- Las solicitudes se envían al correo de contacto de la sección 1 (PENDIENTE), indicando el nombre del titular, la solicitud y un medio de respuesta.
- **Consultas:** se responden en máximo 10 días hábiles (Ley 1581, artículo 14).
- **Reclamos:** se responden en máximo 15 días hábiles (Ley 1581, artículo 15).
- Durante la fase 1 las solicitudes se atienden manualmente. La exportación y la solicitud de supresión desde la app llegan en la fase 2 (E11-03).

## 6. Seguridad y conservación

- Acceso restringido por rol y por fila (Row Level Security); el documento del menor se cifra por columna y el PIN nunca se guarda en texto plano.
- Todo acceso a los datos de un menor queda registrado.
- Los trayectos se conservarán un máximo de 90 días y los incidentes 1 año (la purga automática llega en la fase 2; durante el semestre ningún dato alcanza esa antigüedad).

## 7. Vigencia

Esta política rige desde su aprobación y mientras NexaSafe trate datos personales. Los cambios se publican en la app y en el repositorio del proyecto.

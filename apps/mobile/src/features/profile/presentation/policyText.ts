/**
 * Resumen de la Política de Tratamiento de Datos Personales v1.0
 * (docs/privacy/politica-tratamiento.md). Debe cambiar junto con la versión
 * que devuelve version_politica_vigente() en la base de datos.
 */
export const POLICY_SECTIONS: { title: string; body: string }[] = [
  {
    title: 'Responsable',
    body: 'Equipo NexaSafe (Fundación Universitaria San Mateo). Correo de contacto para habeas data: PENDIENTE.',
  },
  {
    title: 'Qué datos del menor se tratan',
    body: 'Nombre, documento de identidad (guardado cifrado), foto, colegio y, más adelante, un PIN que solo se guarda como hash.',
  },
  {
    title: 'Para qué',
    body: 'Única finalidad: proteger al menor en su trayecto casa–colegio. Los datos no se venden, no se ceden a terceros ni se usan con fines comerciales.',
  },
  {
    title: 'Autorización',
    body: 'Como representante legal autorizas este tratamiento de forma previa, expresa e informada. La app registra la versión de esta política, tu identidad y la fecha.',
  },
  {
    title: 'Tus derechos',
    body: 'Conocer, actualizar, rectificar y suprimir los datos, solicitar prueba de la autorización, revocarla y presentar quejas ante la Superintendencia de Industria y Comercio (Ley 1581 de 2012).',
  },
  {
    title: 'Seguridad',
    body: 'Acceso restringido por rol, documento cifrado y registro de cada acceso a los datos del menor.',
  },
];

export type Role = 'guardian' | 'institucion' | 'admin' | 'protegido' | 'apoyo';

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role | null;
  /** SEC-03: el personal institucional aún usa la contraseña temporal del administrador. */
  mustChangePassword: boolean;
};

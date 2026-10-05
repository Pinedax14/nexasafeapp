export type Role = 'guardian' | 'institucion' | 'admin' | 'protegido' | 'apoyo';

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role | null;
};

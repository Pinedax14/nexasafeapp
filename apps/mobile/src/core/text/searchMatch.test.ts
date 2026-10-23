import { matchesQuery } from './searchMatch';

describe('matchesQuery', () => {
  it('coincide sin importar mayúsculas', () => {
    expect(matchesQuery('Colegio Alfonso Lopez Pumarejo', 'alfonso')).toBe(true);
  });

  it('coincide sin importar tildes', () => {
    expect(matchesQuery('Colegio Agustín Fernández', 'agustin fernandez')).toBe(true);
  });

  it('busca por coincidencia parcial', () => {
    expect(matchesQuery('Colegio Alemania Unificada (IED)', 'unificada')).toBe(true);
  });

  it('no coincide si el texto no contiene la búsqueda', () => {
    expect(matchesQuery('Colegio Alemania Unificada (IED)', 'marco fidel')).toBe(false);
  });

  it('una búsqueda vacía coincide con todo', () => {
    expect(matchesQuery('Cualquier colegio', '   ')).toBe(true);
  });
});

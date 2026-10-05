import { InstitutionAdminRepository } from '../repositories/InstitutionAdminRepository';
import { ManageSchools, MAX_SCHOOL_NAME_LENGTH, validateSchool } from './ManageSchools';

function createRepository(): jest.Mocked<InstitutionAdminRepository> {
  return {
    listSchools: jest.fn().mockResolvedValue({ ok: true, value: [] }),
    createSchool: jest
      .fn()
      .mockResolvedValue({ ok: true, value: { id: 's-1', name: 'Colegio', nit: '900123456-7' } }),
    listStaff: jest.fn(),
    registerStaff: jest.fn(),
    setStaffActive: jest.fn(),
  };
}

describe('validateSchool', () => {
  it('acepta nombre y NIT válidos', () => {
    expect(validateSchool('Colegio San Mateo', '900123456-7')).toEqual({});
    expect(validateSchool('Colegio San Mateo', '900123456')).toEqual({});
  });

  it('exige el nombre y limita su longitud', () => {
    expect(validateSchool('  ', '900123456').name).toBeDefined();
    expect(validateSchool('a'.repeat(MAX_SCHOOL_NAME_LENGTH + 1), '900123456').name).toBeDefined();
  });

  it('rechaza un NIT con letras o muy corto', () => {
    expect(validateSchool('Colegio', 'ABC123').nit).toBeDefined();
    expect(validateSchool('Colegio', '123').nit).toBeDefined();
  });
});

describe('ManageSchools', () => {
  it('lista los colegios del repositorio', async () => {
    const repository = createRepository();

    await expect(new ManageSchools(repository).list()).resolves.toEqual({ ok: true, value: [] });
  });

  it('no llama al repositorio si los datos son inválidos', async () => {
    const repository = createRepository();

    const result = await new ManageSchools(repository).create('', 'x');

    expect(result).toEqual(expect.objectContaining({ ok: false, reason: 'INVALID_INPUT' }));
    expect(repository.createSchool).not.toHaveBeenCalled();
  });

  it('crea el colegio con los datos recortados', async () => {
    const repository = createRepository();

    await new ManageSchools(repository).create('  Colegio San Mateo ', ' 900123456-7 ');

    expect(repository.createSchool).toHaveBeenCalledWith('Colegio San Mateo', '900123456-7');
  });
});

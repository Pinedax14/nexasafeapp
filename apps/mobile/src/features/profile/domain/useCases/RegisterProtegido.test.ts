import { PhotoFile } from '../entities/Protegido';
import { ProtegidoRepository } from '../repositories/ProtegidoRepository';
import { ListMyProtegidos } from './ListMyProtegidos';
import {
  MAX_PHOTO_BYTES,
  normalizeDocument,
  ProtegidoForm,
  RegisterProtegido,
  validateProtegido,
} from './RegisterProtegido';

const photo: PhotoFile = { uri: 'file:///foto.jpg', mimeType: 'image/jpeg', sizeBytes: 200_000 };

const validForm: ProtegidoForm = {
  name: '  Menor Uno ',
  document: '1.023.456.789',
  schoolId: 's-1',
  photo,
  consentAccepted: true,
  policyVersion: '1.0',
};

function createRepository(): jest.Mocked<ProtegidoRepository> {
  return {
    listMine: jest.fn().mockResolvedValue({ ok: true, value: [] }),
    listSchools: jest.fn().mockResolvedValue({ ok: true, value: [{ id: 's-1', name: 'Colegio' }] }),
    currentPolicyVersion: jest.fn().mockResolvedValue({ ok: true, value: '1.0' }),
    uploadPhoto: jest.fn().mockResolvedValue({ ok: true, value: 'g-1/foto.jpg' }),
    register: jest.fn().mockResolvedValue({ ok: true, value: 'p-1' }),
    assignPin: jest.fn(),
    generatePin: jest.fn(),
  };
}

describe('validateProtegido', () => {
  it('acepta un formulario completo', () => {
    expect(validateProtegido(validForm)).toEqual({});
  });

  it('exige consentimiento (E11-01)', () => {
    expect(validateProtegido({ ...validForm, consentAccepted: false }).consent).toBeDefined();
  });

  it('exige nombre, documento válido, colegio y foto', () => {
    const errors = validateProtegido({
      ...validForm,
      name: ' ',
      document: '12',
      schoolId: null,
      photo: null,
    });

    expect(Object.keys(errors).sort()).toEqual(['document', 'name', 'photo', 'school']);
  });

  it('rechaza fotos que no son JPG/PNG o que pesan más de 2 MB', () => {
    expect(
      validateProtegido({ ...validForm, photo: { ...photo, mimeType: 'image/gif' } }).photo,
    ).toBeDefined();
    expect(
      validateProtegido({ ...validForm, photo: { ...photo, sizeBytes: MAX_PHOTO_BYTES + 1 } })
        .photo,
    ).toBeDefined();
  });

  it('acepta una foto de tamaño desconocido', () => {
    expect(validateProtegido({ ...validForm, photo: { ...photo, sizeBytes: null } })).toEqual({});
  });
});

describe('normalizeDocument', () => {
  it('quita espacios, puntos y guiones', () => {
    expect(normalizeDocument(' 1.023 456-789 ')).toBe('1023456789');
  });
});

describe('RegisterProtegido', () => {
  it('carga los colegios y la versión vigente de la política', async () => {
    const repository = createRepository();

    const result = await new RegisterProtegido(repository).loadForm();

    expect(result).toEqual({
      ok: true,
      value: { schools: [{ id: 's-1', name: 'Colegio' }], policyVersion: '1.0' },
    });
  });

  it('informa si no puede cargar los colegios o la política', async () => {
    const repository = createRepository();
    repository.listSchools.mockResolvedValue({ ok: false, reason: 'NETWORK' });
    await expect(new RegisterProtegido(repository).loadForm()).resolves.toEqual({
      ok: false,
      reason: 'NETWORK',
    });

    repository.listSchools.mockResolvedValue({ ok: true, value: [] });
    repository.currentPolicyVersion.mockResolvedValue({ ok: false, reason: 'UNKNOWN' });
    await expect(new RegisterProtegido(repository).loadForm()).resolves.toEqual({
      ok: false,
      reason: 'UNKNOWN',
    });
  });

  it('sin consentimiento no sube la foto ni registra nada', async () => {
    const repository = createRepository();

    const result = await new RegisterProtegido(repository).execute('g-1', {
      ...validForm,
      consentAccepted: false,
    });

    expect(result).toEqual(expect.objectContaining({ ok: false, reason: 'INVALID_INPUT' }));
    expect(repository.uploadPhoto).not.toHaveBeenCalled();
    expect(repository.register).not.toHaveBeenCalled();
  });

  it('sube la foto y registra al menor con los datos normalizados', async () => {
    const repository = createRepository();

    const result = await new RegisterProtegido(repository).execute('g-1', validForm);

    expect(repository.uploadPhoto).toHaveBeenCalledWith('g-1', photo);
    expect(repository.register).toHaveBeenCalledWith({
      name: 'Menor Uno',
      document: '1023456789',
      schoolId: 's-1',
      photoPath: 'g-1/foto.jpg',
      policyVersion: '1.0',
    });
    expect(result).toEqual({ ok: true, value: 'p-1' });
  });

  it('no registra si la foto no se pudo subir', async () => {
    const repository = createRepository();
    repository.uploadPhoto.mockResolvedValue({ ok: false, reason: 'PHOTO_UPLOAD_FAILED' });

    const result = await new RegisterProtegido(repository).execute('g-1', validForm);

    expect(result).toEqual({ ok: false, reason: 'PHOTO_UPLOAD_FAILED' });
    expect(repository.register).not.toHaveBeenCalled();
  });
});

describe('ListMyProtegidos', () => {
  it('lista los menores del guardián', async () => {
    const repository = createRepository();

    await expect(new ListMyProtegidos(repository).execute()).resolves.toEqual({
      ok: true,
      value: [],
    });
  });
});

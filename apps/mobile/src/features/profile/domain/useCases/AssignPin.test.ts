import { ProtegidoRepository } from '../repositories/ProtegidoRepository';
import { AssignPin, validatePin } from './AssignPin';

function createRepository(): jest.Mocked<ProtegidoRepository> {
  return {
    listMine: jest.fn(),
    listSchools: jest.fn(),
    currentPolicyVersion: jest.fn(),
    uploadPhoto: jest.fn(),
    register: jest.fn(),
    assignPin: jest.fn().mockResolvedValue({ ok: true, value: undefined }),
  };
}

describe('validatePin', () => {
  it('acepta un PIN de 4 dígitos confirmado', () => {
    expect(validatePin('4826', '4826')).toEqual({});
  });

  it('rechaza un PIN que no tiene 4 números', () => {
    expect(validatePin('48', '48').pin).toBeDefined();
    expect(validatePin('48a6', '48a6').pin).toBeDefined();
  });

  it('rechaza PIN fáciles de adivinar', () => {
    expect(validatePin('1234', '1234').pin).toBeDefined();
    expect(validatePin('0000', '0000').pin).toBeDefined();
  });

  it('exige que la confirmación coincida', () => {
    expect(validatePin('4826', '4827')).toEqual({ confirmation: 'Los PIN no coinciden.' });
  });
});

describe('AssignPin (E1-04, D5)', () => {
  it('no llama al servidor si el PIN es inválido', async () => {
    const repository = createRepository();

    const result = await new AssignPin(repository).execute('p-1', '1234', '1234');

    expect(result).toEqual(expect.objectContaining({ ok: false, reason: 'INVALID_INPUT' }));
    expect(repository.assignPin).not.toHaveBeenCalled();
  });

  it('asigna el PIN al menor', async () => {
    const repository = createRepository();

    const result = await new AssignPin(repository).execute('p-1', '4826', '4826');

    expect(repository.assignPin).toHaveBeenCalledWith('p-1', '4826');
    expect(result).toEqual({ ok: true, value: undefined });
  });
});

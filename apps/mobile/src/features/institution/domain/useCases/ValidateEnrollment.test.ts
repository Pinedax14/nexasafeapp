import { EnrollmentRepository } from '../repositories/EnrollmentRepository';
import { ValidateEnrollment } from './ValidateEnrollment';

function createRepository(): jest.Mocked<EnrollmentRepository> {
  return {
    listPending: jest.fn().mockResolvedValue({ ok: true, value: [] }),
    getDetail: jest.fn().mockResolvedValue({ ok: false, reason: 'FORBIDDEN' }),
    validate: jest.fn().mockResolvedValue({ ok: true, value: undefined }),
  };
}

describe('ValidateEnrollment (E1-03)', () => {
  it('lista las matrículas pendientes', async () => {
    const repository = createRepository();

    await expect(new ValidateEnrollment(repository).listPending()).resolves.toEqual({
      ok: true,
      value: [],
    });
  });

  it('revisa el detalle del menor', async () => {
    const repository = createRepository();

    await new ValidateEnrollment(repository).review('p-1');

    expect(repository.getDetail).toHaveBeenCalledWith('p-1');
  });

  it('valida la matrícula', async () => {
    const repository = createRepository();

    await new ValidateEnrollment(repository).validate('p-1');

    expect(repository.validate).toHaveBeenCalledWith('p-1');
  });
});

import { fireEvent, render, screen } from '@testing-library/react-native';
import { EnrollmentRepository } from '../../domain/repositories/EnrollmentRepository';
import { ValidateEnrollment } from '../../domain/useCases/ValidateEnrollment';
import { ENROLLMENT_VALIDATED_MESSAGE } from '../enrollmentMessages';
import { EnrollmentReviewScreen } from './EnrollmentReviewScreen';

function setup(validateResult: Awaited<ReturnType<EnrollmentRepository['validate']>>) {
  const repository: jest.Mocked<EnrollmentRepository> = {
    listPending: jest.fn(),
    getDetail: jest.fn().mockResolvedValue({
      ok: true,
      value: {
        id: 'p-1',
        name: 'Menor Uno',
        document: '1023456789',
        photoUrl: 'https://firmada/foto.jpg',
        status: 'PENDIENTE_VALIDACION',
      },
    }),
    validate: jest.fn().mockResolvedValue(validateResult),
  };
  return { repository, validateEnrollment: new ValidateEnrollment(repository) };
}

describe('EnrollmentReviewScreen (E1-03)', () => {
  it('muestra los datos del menor y valida su matrícula', async () => {
    const { repository, validateEnrollment } = setup({ ok: true, value: undefined });
    await render(
      <EnrollmentReviewScreen
        validateEnrollment={validateEnrollment}
        protegidoId="p-1"
        onBack={jest.fn()}
      />,
    );

    expect(await screen.findByText('1023456789')).toBeTruthy();
    await fireEvent.press(screen.getByText('Validar matrícula'));

    expect(await screen.findByText(ENROLLMENT_VALIDATED_MESSAGE)).toBeTruthy();
    expect(repository.validate).toHaveBeenCalledWith('p-1');
    expect(screen.queryByText('Validar matrícula')).toBeNull();
  });

  it('informa si el menor ya no estaba pendiente', async () => {
    const { validateEnrollment } = setup({ ok: false, reason: 'ALREADY_VALIDATED' });
    await render(
      <EnrollmentReviewScreen
        validateEnrollment={validateEnrollment}
        protegidoId="p-1"
        onBack={jest.fn()}
      />,
    );

    await fireEvent.press(await screen.findByText('Validar matrícula'));

    expect(await screen.findByText('Este menor ya no está pendiente de validación.')).toBeTruthy();
  });
});

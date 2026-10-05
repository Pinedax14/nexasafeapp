import { fireEvent, render, screen } from '@testing-library/react-native';
import { ProfileResult, ProtegidoRepository } from '../../domain/repositories/ProtegidoRepository';
import { AssignPin } from '../../domain/useCases/AssignPin';
import { PROFILE_ERROR_MESSAGES } from '../profileMessages';
import { PIN_ASSIGNED_MESSAGE, PIN_GENERATED_MESSAGE } from '../viewModels/useAssignPinViewModel';
import { AssignPinScreen } from './AssignPinScreen';

const protegido = {
  id: 'p-1',
  name: 'Menor Uno',
  schoolId: 's-1',
  status: 'ACTIVO' as const,
  photoPath: null,
};

async function setup(
  result: ProfileResult<void>,
  generated: ProfileResult<string> = { ok: true, value: '4826' },
) {
  const repository: jest.Mocked<ProtegidoRepository> = {
    listMine: jest.fn(),
    listSchools: jest.fn(),
    currentPolicyVersion: jest.fn(),
    uploadPhoto: jest.fn(),
    register: jest.fn(),
    assignPin: jest.fn().mockResolvedValue(result),
    generatePin: jest.fn().mockResolvedValue(generated),
  };
  await render(
    <AssignPinScreen
      assignPin={new AssignPin(repository)}
      protegido={protegido}
      onBack={jest.fn()}
    />,
  );
  return { repository };
}

async function save(pin: string, confirmation: string) {
  await fireEvent.changeText(screen.getByLabelText('Nuevo PIN'), pin);
  await fireEvent.changeText(screen.getByLabelText('Confirmar PIN'), confirmation);
  await fireEvent.press(screen.getByText('Guardar PIN'));
}

describe('AssignPinScreen (E1-04, D5)', () => {
  it('el guardián asigna el PIN al menor validado', async () => {
    const { repository } = await setup({ ok: true, value: undefined });

    await save('4826', '4826');

    expect(await screen.findByText(PIN_ASSIGNED_MESSAGE)).toBeTruthy();
    expect(repository.assignPin).toHaveBeenCalledWith('p-1', '4826');
    expect(screen.getByLabelText('Nuevo PIN').props.value).toBe('');
  });

  it('no envía un PIN fácil de adivinar', async () => {
    const { repository } = await setup({ ok: true, value: undefined });

    await save('1234', '1234');

    expect(await screen.findByText('Ese PIN es muy fácil de adivinar. Elige otro.')).toBeTruthy();
    expect(repository.assignPin).not.toHaveBeenCalled();
  });

  it('muestra el error del servidor cuando el documento ya tiene PIN', async () => {
    await setup({ ok: false, reason: 'DOCUMENT_HAS_PIN' });

    await save('4826', '4826');

    expect(await screen.findByText(PROFILE_ERROR_MESSAGES.DOCUMENT_HAS_PIN)).toBeTruthy();
  });
});

describe('AssignPinScreen · PIN aleatorio (E1-04)', () => {
  it('el guardián genera un PIN aleatorio y lo ve una vez para entregarlo', async () => {
    const { repository } = await setup({ ok: true, value: undefined });

    await fireEvent.press(screen.getByText('Generar PIN aleatorio'));

    expect(await screen.findByLabelText('PIN generado')).toHaveTextContent('4826');
    expect(screen.getByText(PIN_GENERATED_MESSAGE)).toBeTruthy();
    expect(repository.generatePin).toHaveBeenCalledWith('p-1');
    expect(repository.assignPin).not.toHaveBeenCalled();
  });

  it('muestra el error si el servidor no puede generar el PIN', async () => {
    await setup({ ok: true, value: undefined }, { ok: false, reason: 'NOT_ACTIVE' });

    await fireEvent.press(screen.getByText('Generar PIN aleatorio'));

    expect(await screen.findByText(PROFILE_ERROR_MESSAGES.NOT_ACTIVE)).toBeTruthy();
    expect(screen.queryByLabelText('PIN generado')).toBeNull();
  });
});

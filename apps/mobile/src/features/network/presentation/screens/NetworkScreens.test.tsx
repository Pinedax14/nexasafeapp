import { fireEvent, render, screen } from '@testing-library/react-native';
import { AlertResponseRepository } from '../../../alerts/domain/repositories/AlertResponseRepository';
import { RespondToAlerts } from '../../../alerts/domain/useCases/RespondToAlerts';
import { ALERT_ERROR_MESSAGES } from '../../../alerts/presentation/alertMessages';
import { SupportNetworkRepository } from '../../domain/repositories/SupportNetworkRepository';
import { invitationLink, SupportNetwork } from '../../domain/useCases/SupportNetwork';
import {
  INVALID_INVITATION_MESSAGE,
  NETWORK_ERROR_MESSAGES,
  NO_ALERTS_MESSAGE,
  SUPPORT_CONFIRMATION_MESSAGE,
} from '../networkMessages';
import { AcceptInvitationScreen } from './AcceptInvitationScreen';
import { SupportHomeScreen } from './SupportHomeScreen';
import { SupportNetworkScreen } from './SupportNetworkScreen';

const CODIGO = 'codigo-de-prueba-0000001';
const now = () => new Date('2026-10-12T12:00:00Z');

function repository(): jest.Mocked<SupportNetworkRepository> {
  return {
    listContacts: jest.fn().mockResolvedValue({
      ok: true,
      value: [
        {
          id: 'c-1',
          protegidoId: 'p-1',
          name: 'Ana Tía',
          acceptedAt: '2026-10-12T10:00:00Z',
          expiresAt: '2026-10-15T10:00:00Z',
        },
        {
          id: 'c-2',
          protegidoId: 'p-1',
          name: null,
          acceptedAt: null,
          expiresAt: '2026-10-11T10:00:00Z',
        },
      ],
    }),
    createInvitation: jest.fn().mockResolvedValue({
      ok: true,
      value: { id: 'i-1', token: CODIGO, expiresAt: '2026-10-15T12:00:00Z' },
    }),
    previewInvitation: jest.fn().mockResolvedValue({
      ok: true,
      value: { childFirstName: 'Menor', guardianName: 'Guardián Uno' },
    }),
    registerWithInvitation: jest
      .fn()
      .mockResolvedValue({ ok: true, status: 'CONFIRMATION_PENDING' }),
  };
}

describe('SupportNetworkScreen (W5, E2-01)', () => {
  async function setup(repo = repository()) {
    const share = jest.fn().mockResolvedValue(undefined);
    await render(
      <SupportNetworkScreen
        supportNetwork={new SupportNetwork(repo)}
        protegidoId="p-1"
        protegidoName="Menor Uno"
        guardianName="Guardián Uno"
        share={share}
        now={now}
        onBack={jest.fn()}
      />,
    );
    return { repo, share };
  }

  it('muestra quién aceptó y qué invitaciones vencieron', async () => {
    await setup();

    expect(await screen.findByText('Ana Tía')).toBeTruthy();
    expect(screen.getByText('Aceptó')).toBeTruthy();
    expect(screen.getByText('Vencida')).toBeTruthy();
  });

  it('invitar crea el enlace y abre el menú de compartir', async () => {
    const { repo, share } = await setup();

    await fireEvent.press(await screen.findByText('Invitar a un contacto'));

    expect(repo.createInvitation).toHaveBeenCalledWith('p-1');
    expect(share).toHaveBeenCalledWith(expect.stringContaining(invitationLink(CODIGO)));
    expect(repo.listContacts).toHaveBeenCalledTimes(2);
  });

  it('muestra el límite de invitaciones por hora', async () => {
    const repo = repository();
    repo.createInvitation.mockResolvedValue({ ok: false, reason: 'RATE_LIMITED' });
    const { share } = await setup(repo);

    await fireEvent.press(await screen.findByText('Invitar a un contacto'));

    expect(await screen.findByText(NETWORK_ERROR_MESSAGES.RATE_LIMITED)).toBeTruthy();
    expect(share).not.toHaveBeenCalled();
  });

  it('sin invitaciones lo dice', async () => {
    const repo = repository();
    repo.listContacts.mockResolvedValue({ ok: true, value: [] });
    await setup(repo);

    expect(await screen.findByText('Todavía no has invitado a nadie.')).toBeTruthy();
  });
});

describe('AcceptInvitationScreen (W6, E2-01)', () => {
  async function setup(repo = repository(), initialCode = '') {
    const onSignedIn = jest.fn();
    await render(
      <AcceptInvitationScreen
        supportNetwork={new SupportNetwork(repo)}
        initialCode={initialCode}
        onSignedIn={onSignedIn}
        onBack={jest.fn()}
      />,
    );
    return { repo, onSignedIn };
  }

  async function fillForm() {
    await fireEvent.changeText(screen.getByLabelText('Nombre completo'), 'Ana Tía');
    await fireEvent.changeText(screen.getByLabelText('Correo'), 'ana@example.com');
    await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'segura123');
    await fireEvent.press(screen.getByText('Crear cuenta y aceptar'));
  }

  it('con el enlace ve el primer nombre del menor y crea su cuenta de apoyo', async () => {
    const repo = repository();
    const user = {
      id: 'u-1',
      name: 'Ana Tía',
      email: 'ana@example.com',
      role: 'apoyo' as const,
      mustChangePassword: false,
    };
    repo.registerWithInvitation.mockResolvedValue({ ok: true, status: 'SIGNED_IN', user });
    const { onSignedIn } = await setup(repo, CODIGO);

    await fireEvent.press(screen.getByText('Continuar'));
    expect(await screen.findByText('Te invitaron a la red de apoyo de Menor')).toBeTruthy();
    await fillForm();

    expect(repo.registerWithInvitation).toHaveBeenCalledWith(
      expect.objectContaining({ token: CODIGO, email: 'ana@example.com' }),
    );
    expect(onSignedIn).toHaveBeenCalledWith(user);
  });

  it('pegando el código también funciona y pide confirmar el correo', async () => {
    await setup();

    await fireEvent.changeText(
      screen.getByLabelText('Código de invitación'),
      invitationLink(CODIGO),
    );
    await fireEvent.press(screen.getByText('Continuar'));
    await screen.findByText('Te invitaron a la red de apoyo de Menor');
    await fillForm();

    expect(await screen.findByText(SUPPORT_CONFIRMATION_MESSAGE)).toBeTruthy();
  });

  it('una invitación usada o vencida muestra el mensaje genérico', async () => {
    const repo = repository();
    repo.previewInvitation.mockResolvedValue({ ok: false, reason: 'INVALID_INVITATION' });
    await setup(repo, CODIGO);

    await fireEvent.press(screen.getByText('Continuar'));

    expect(await screen.findByText(INVALID_INVITATION_MESSAGE)).toBeTruthy();
  });

  it('valida los datos de la cuenta', async () => {
    const { repo } = await setup(repository(), CODIGO);

    await fireEvent.press(screen.getByText('Continuar'));
    await screen.findByText('Crear cuenta y aceptar');
    await fireEvent.press(screen.getByText('Crear cuenta y aceptar'));

    expect(await screen.findByText('Ingresa tu nombre.')).toBeTruthy();
    expect(repo.registerWithInvitation).not.toHaveBeenCalled();
  });

  it('si la invitación vence mientras llena el formulario, avisa', async () => {
    const repo = repository();
    repo.registerWithInvitation.mockResolvedValue({ ok: false, reason: 'INVALID_INVITATION' });
    await setup(repo, CODIGO);

    await fireEvent.press(screen.getByText('Continuar'));
    await screen.findByText('Crear cuenta y aceptar');
    await fillForm();

    expect(await screen.findByText(INVALID_INVITATION_MESSAGE)).toBeTruthy();
  });
});

describe('SupportHomeScreen (E2-01, E7-02)', () => {
  const alert = {
    id: 'al-1',
    protegidoId: 'p-1',
    childName: 'Menor',
    status: 'ENVIADA' as const,
    createdAt: '2026-10-15T12:00:00Z',
    classification: null,
    closedAt: null,
  };

  function alerts(list: Awaited<ReturnType<AlertResponseRepository['list']>>) {
    const responses: jest.Mocked<AlertResponseRepository> = {
      list: jest.fn().mockResolvedValue(list),
      log: jest.fn(),
      respond: jest.fn(),
      close: jest.fn(),
      summary: jest.fn(),
    };
    return new RespondToAlerts(responses);
  }

  it('sin alertas lo dice', async () => {
    await render(
      <SupportHomeScreen
        respondToAlerts={alerts({ ok: true, value: [] })}
        userName="Ana"
        onOpenAlert={jest.fn()}
        onSignOut={jest.fn()}
      />,
    );

    expect(await screen.findByText(NO_ALERTS_MESSAGE)).toBeTruthy();
  });

  it('ve las alertas del menor y abre una', async () => {
    const onOpenAlert = jest.fn();
    await render(
      <SupportHomeScreen
        respondToAlerts={alerts({ ok: true, value: [alert] })}
        userName="Ana"
        onOpenAlert={onOpenAlert}
        onSignOut={jest.fn()}
      />,
    );

    await fireEvent.press(await screen.findByLabelText('Abrir alerta de Menor'));

    expect(onOpenAlert).toHaveBeenCalledWith(alert);
  });

  it('muestra el error si no puede leer las alertas', async () => {
    await render(
      <SupportHomeScreen
        respondToAlerts={alerts({ ok: false, reason: 'NETWORK' })}
        userName="Ana"
        onOpenAlert={jest.fn()}
        onSignOut={jest.fn()}
      />,
    );

    expect(await screen.findByText(ALERT_ERROR_MESSAGES.NETWORK)).toBeTruthy();
  });
});

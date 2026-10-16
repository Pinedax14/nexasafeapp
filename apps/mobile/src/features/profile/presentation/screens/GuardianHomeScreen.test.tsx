import { fireEvent, render, screen } from '@testing-library/react-native';
import { AlertResponseRepository } from '../../../alerts/domain/repositories/AlertResponseRepository';
import { RespondToAlerts } from '../../../alerts/domain/useCases/RespondToAlerts';
import { TripRepository } from '../../../tracking/domain/repositories/TripRepository';
import { TrackTrips } from '../../../tracking/domain/useCases/TrackTrips';
import { tripSince } from '../../../tracking/presentation/tripMessages';
import { ProtegidoRepository } from '../../domain/repositories/ProtegidoRepository';
import { ListMyProtegidos } from '../../domain/useCases/ListMyProtegidos';
import { GuardianHomeScreen } from './GuardianHomeScreen';

const startedAt = '2026-10-12T11:42:00Z';

async function setup(
  withTrips: boolean,
  onOpenLive?: jest.Mock,
  alerts?: { respondToAlerts: RespondToAlerts; onOpenAlert: jest.Mock },
) {
  const profiles: jest.Mocked<ProtegidoRepository> = {
    listMine: jest.fn().mockResolvedValue({
      ok: true,
      value: [
        { id: 'p-1', name: 'Menor Uno', schoolId: 's-1', status: 'ACTIVO', photoPath: null },
        { id: 'p-2', name: 'Menor Dos', schoolId: 's-1', status: 'ACTIVO', photoPath: null },
      ],
    }),
    listSchools: jest.fn(),
    currentPolicyVersion: jest.fn(),
    uploadPhoto: jest.fn(),
    register: jest.fn(),
    assignPin: jest.fn(),
    generatePin: jest.fn(),
  };
  const trips: jest.Mocked<TripRepository> = {
    listActive: jest.fn().mockResolvedValue({
      ok: true,
      value: [{ id: 't-1', protegidoId: 'p-1', routeId: 'r-1', startedAt, status: 'EN_CURSO' }],
    }),
    start: jest.fn(),
  };
  await render(
    <GuardianHomeScreen
      listMyProtegidos={new ListMyProtegidos(profiles)}
      trackTrips={withTrips ? new TrackTrips(trips) : undefined}
      userName="Ana"
      onRegisterProtegido={jest.fn()}
      onAssignPin={jest.fn()}
      onOpenRoutes={jest.fn()}
      onOpenLive={onOpenLive}
      respondToAlerts={alerts?.respondToAlerts}
      onOpenAlert={alerts?.onOpenAlert}
      onSignOut={jest.fn()}
    />,
  );
}

describe('GuardianHomeScreen · trayecto en curso (E4-01)', () => {
  it('el guardián ve qué menor tiene un trayecto EN_CURSO', async () => {
    await setup(true);

    const label = `En trayecto · ${tripSince(startedAt).toLowerCase()}`;
    expect(await screen.findByText(label)).toBeTruthy();
    expect(screen.getAllByText(label)).toHaveLength(1);
  });

  it('sin trayectos no muestra el aviso', async () => {
    await setup(false);

    expect(await screen.findByText('Menor Uno')).toBeTruthy();
    expect(screen.queryByText(/En trayecto/)).toBeNull();
  });
});

describe('GuardianHomeScreen · trayecto en vivo (E4-02)', () => {
  it('"Ver en vivo" aparece solo en el menor con trayecto y abre su trayecto', async () => {
    const onOpenLive = jest.fn();
    await setup(true, onOpenLive);

    await fireEvent.press(await screen.findByLabelText('Ver en vivo a Menor Uno'));

    expect(screen.queryByLabelText('Ver en vivo a Menor Dos')).toBeNull();
    expect(onOpenLive).toHaveBeenCalledWith(expect.objectContaining({ id: 'p-1' }));
  });

  it('sin la acción no muestra el enlace', async () => {
    await setup(true);

    expect(await screen.findByText(/En trayecto/)).toBeTruthy();
    expect(screen.queryByText('Ver en vivo ›')).toBeNull();
  });
});

describe('GuardianHomeScreen · alerta activa (W11)', () => {
  it('muestra la alerta activa en su menor y la abre', async () => {
    const alert = {
      id: 'al-1',
      protegidoId: 'p-2',
      childName: 'Menor Dos',
      status: 'ENVIADA' as const,
      createdAt: '2026-10-15T12:00:00Z',
      classification: null,
      closedAt: null,
    };
    const responses: jest.Mocked<AlertResponseRepository> = {
      list: jest.fn().mockResolvedValue({ ok: true, value: [alert] }),
      log: jest.fn(),
      respond: jest.fn(),
      close: jest.fn(),
      summary: jest.fn(),
    };
    const onOpenAlert = jest.fn();
    await setup(false, undefined, { respondToAlerts: new RespondToAlerts(responses), onOpenAlert });

    await fireEvent.press(await screen.findByLabelText('Alerta activa de Menor Dos'));

    expect(responses.list).toHaveBeenCalledWith(true);
    expect(screen.queryByLabelText('Alerta activa de Menor Uno')).toBeNull();
    expect(onOpenAlert).toHaveBeenCalledWith(alert);
  });
});

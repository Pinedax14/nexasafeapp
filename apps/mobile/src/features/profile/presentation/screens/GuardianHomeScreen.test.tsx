import { render, screen } from '@testing-library/react-native';
import { TripRepository } from '../../../tracking/domain/repositories/TripRepository';
import { TrackTrips } from '../../../tracking/domain/useCases/TrackTrips';
import { tripSince } from '../../../tracking/presentation/tripMessages';
import { ProtegidoRepository } from '../../domain/repositories/ProtegidoRepository';
import { ListMyProtegidos } from '../../domain/useCases/ListMyProtegidos';
import { GuardianHomeScreen } from './GuardianHomeScreen';

const startedAt = '2026-10-12T11:42:00Z';

async function setup(withTrips: boolean) {
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

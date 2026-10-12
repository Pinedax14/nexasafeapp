import { Trip } from '../entities/Trip';
import { TripRepository } from '../repositories/TripRepository';
import { TrackTrips } from './TrackTrips';

const trip: Trip = {
  id: 't-1',
  protegidoId: 'p-1',
  routeId: 'r-1',
  startedAt: '2026-10-12T11:42:00Z',
  status: 'EN_CURSO',
};

function setup(
  listResult: Awaited<ReturnType<TripRepository['listActive']>> = { ok: true, value: [trip] },
) {
  const repository: jest.Mocked<TripRepository> = {
    listActive: jest.fn().mockResolvedValue(listResult),
    start: jest.fn().mockResolvedValue({ ok: true, value: 't-2' }),
  };
  return { repository, trackTrips: new TrackTrips(repository) };
}

describe('TrackTrips (E4-01)', () => {
  it('lista los trayectos en curso que la sesión puede ver', async () => {
    const { trackTrips } = setup();

    expect(await trackTrips.listActive()).toEqual({ ok: true, value: [trip] });
  });

  it('encuentra el trayecto en curso de un menor', async () => {
    const { trackTrips } = setup();

    expect(await trackTrips.activeFor('p-1')).toEqual({ ok: true, value: trip });
    expect(await trackTrips.activeFor('p-2')).toEqual({ ok: true, value: null });
  });

  it('informa el error al consultar los trayectos', async () => {
    const { trackTrips } = setup({ ok: false, reason: 'NETWORK' });

    expect(await trackTrips.activeFor('p-1')).toEqual({ ok: false, reason: 'NETWORK' });
  });

  it('inicia el trayecto con un toque', async () => {
    const { repository, trackTrips } = setup();

    expect(await trackTrips.start('r-1', null)).toEqual({ ok: true, value: 't-2' });
    expect(repository.start).toHaveBeenCalledWith('r-1');
  });

  it('no crea un segundo trayecto si ya hay uno en curso', async () => {
    const { repository, trackTrips } = setup();

    expect(await trackTrips.start('r-2', trip)).toEqual({ ok: false, reason: 'ALREADY_ACTIVE' });
    expect(repository.start).not.toHaveBeenCalled();
  });
});

import { LivePosition } from '../entities/Position';
import { PositionRepository } from '../repositories/PositionRepository';
import { WatchLive } from './WatchLive';

const live: LivePosition = {
  latitude: 4.6,
  longitude: -74.08,
  accuracyMeters: 8,
  receivedAt: '2026-10-15T12:00:00Z',
};

function setup() {
  const unsubscribe = jest.fn();
  const repository: jest.Mocked<PositionRepository> = {
    send: jest.fn(),
    latest: jest.fn().mockResolvedValue({ ok: true, value: live }),
    subscribe: jest.fn().mockReturnValue(unsubscribe),
  };
  return { repository, unsubscribe, watch: new WatchLive(repository) };
}

describe('WatchLive (E4-02)', () => {
  it('lee la última posición del menor', async () => {
    const { repository, watch } = setup();

    expect(await watch.latest('p-1')).toEqual({ ok: true, value: live });
    expect(repository.latest).toHaveBeenCalledWith('p-1');
  });

  it('escucha el canal del menor y permite dejar de escuchar', () => {
    const { repository, unsubscribe, watch } = setup();
    const handlers = { onPosition: jest.fn(), onTripClosed: jest.fn() };

    const stop = watch.subscribe('p-1', handlers);
    stop();

    expect(repository.subscribe).toHaveBeenCalledWith('p-1', handlers);
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('calcula hace cuántos segundos llegó la posición, sin valores negativos', () => {
    const { watch } = setup();

    expect(watch.secondsSince(live, new Date('2026-10-15T12:00:12Z'))).toBe(12);
    expect(watch.secondsSince(live, new Date('2026-10-15T11:59:59Z'))).toBe(0);
  });
});

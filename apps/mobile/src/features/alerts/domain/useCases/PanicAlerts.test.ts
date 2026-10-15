import { Alert } from '../entities/Alert';
import { AlertRepository } from '../repositories/AlertRepository';
import { HOLD_TO_TRIGGER_MS, PanicAlerts } from './PanicAlerts';

const alert: Alert = {
  id: 'al-1',
  status: 'ENVIADA',
  createdAt: '2026-10-15T12:00:00Z',
  cancellableUntil: '2026-10-15T12:00:10Z',
};

function setup() {
  const repository: jest.Mocked<AlertRepository> = {
    trigger: jest.fn().mockResolvedValue({ ok: true, value: alert }),
    cancel: jest.fn().mockResolvedValue({ ok: true, value: undefined }),
    active: jest.fn().mockResolvedValue({ ok: true, value: null }),
  };
  return { repository, panic: new PanicAlerts(repository) };
}

describe('PanicAlerts (E6-01, E6-03)', () => {
  it('el botón se mantiene 3 s (RF-20)', () => {
    expect(HOLD_TO_TRIGGER_MS).toBe(3000);
  });

  it('dispara y consulta la alerta activa en el servidor', async () => {
    const { repository, panic } = setup();

    expect(await panic.trigger()).toEqual({ ok: true, value: alert });
    expect(await panic.active()).toEqual({ ok: true, value: null });
    expect(repository.trigger).toHaveBeenCalled();
    expect(repository.active).toHaveBeenCalled();
  });

  it('la ventana local dura lo que dijo el servidor, contada desde que llegó la respuesta', () => {
    const { panic } = setup();
    const receivedAt = new Date('2026-10-15T07:30:00Z');

    expect(panic.cancelDeadline(alert, receivedAt)).toEqual(new Date('2026-10-15T07:30:10Z'));
  });

  it('una ventana negativa del servidor se trata como vencida', () => {
    const { panic } = setup();
    const receivedAt = new Date('2026-10-15T07:30:00Z');
    const odd = { ...alert, cancellableUntil: '2026-10-15T11:59:59Z' };

    expect(panic.cancelDeadline(odd, receivedAt)).toEqual(receivedAt);
  });

  it('cuenta los segundos que quedan, sin bajar de 0', () => {
    const { panic } = setup();
    const deadline = new Date('2026-10-15T12:00:10Z');

    expect(panic.secondsLeft(deadline, new Date('2026-10-15T12:00:00Z'))).toBe(10);
    expect(panic.secondsLeft(deadline, new Date('2026-10-15T12:00:09.200Z'))).toBe(1);
    expect(panic.secondsLeft(deadline, new Date('2026-10-15T12:00:11Z'))).toBe(0);
  });

  it('cancela con un PIN de 4 dígitos', async () => {
    const { repository, panic } = setup();

    expect(await panic.cancel(alert, '1234')).toEqual({ ok: true, value: undefined });
    expect(repository.cancel).toHaveBeenCalledWith('al-1', '1234');
  });

  it.each(['', '12', '12345', 'abcd'])('un PIN %p no se envía al servidor', async (pin) => {
    const { repository, panic } = setup();

    expect(await panic.cancel(alert, pin)).toEqual({ ok: false, reason: 'INVALID_PIN' });
    expect(repository.cancel).not.toHaveBeenCalled();
  });

  it('una alerta que ya no está ENVIADA no se cancela', async () => {
    const { repository, panic } = setup();

    expect(await panic.cancel({ ...alert, status: 'CANCELADA' }, '1234')).toEqual({
      ok: false,
      reason: 'NOT_CANCELLABLE',
    });
    expect(repository.cancel).not.toHaveBeenCalled();
  });
});

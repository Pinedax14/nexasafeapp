import { AlertSummary } from '../entities/AlertSummary';
import { AlertResponseRepository } from '../repositories/AlertResponseRepository';
import { CHART_DAYS, isActive, MAX_NOTE_LENGTH, RespondToAlerts } from './RespondToAlerts';

const alert: AlertSummary = {
  id: 'al-1',
  protegidoId: 'p-1',
  childName: 'Menor',
  status: 'ENVIADA',
  createdAt: '2026-10-15T12:00:00Z',
  classification: null,
  closedAt: null,
};
const closed: AlertSummary = { ...alert, status: 'CERRADA' };

function setup() {
  const repository: jest.Mocked<AlertResponseRepository> = {
    list: jest.fn().mockResolvedValue({ ok: true, value: [alert] }),
    log: jest.fn().mockResolvedValue({ ok: true, value: [] }),
    respond: jest.fn().mockResolvedValue({ ok: true, value: undefined }),
    close: jest.fn().mockResolvedValue({ ok: true, value: undefined }),
    summary: jest.fn().mockResolvedValue({ ok: true, value: [] }),
  };
  return { repository, respond: new RespondToAlerts(repository) };
}

describe('RespondToAlerts (E7-02, E9-02, E8-01)', () => {
  it('lista, lee la bitácora y pide el resumen de 14 días', async () => {
    const { repository, respond } = setup();

    expect(await respond.list(true)).toEqual({ ok: true, value: [alert] });
    await respond.log('al-1');
    await respond.summary();

    expect(repository.list).toHaveBeenCalledWith(true);
    expect(repository.log).toHaveBeenCalledWith('al-1');
    expect(repository.summary).toHaveBeenCalledWith(CHART_DAYS);
  });

  it('una alerta está activa mientras está ENVIADA o ATENDIDA', () => {
    expect(isActive(alert)).toBe(true);
    expect(isActive({ status: 'ATENDIDA' })).toBe(true);
    expect(isActive(closed)).toBe(false);
  });

  it('D28: responden el guardián y el contacto de apoyo, no el colegio', () => {
    const { respond } = setup();

    expect(respond.canRespond('guardian', alert)).toBe(true);
    expect(respond.canRespond('apoyo', alert)).toBe(true);
    expect(respond.canRespond('institucion', alert)).toBe(false);
    expect(respond.canRespond('guardian', closed)).toBe(false);
  });

  it('D29: cierran el guardián y el colegio, no el contacto de apoyo', () => {
    const { respond } = setup();

    expect(respond.canClose('guardian', alert)).toBe(true);
    expect(respond.canClose('institucion', alert)).toBe(true);
    expect(respond.canClose('apoyo', alert)).toBe(false);
    expect(respond.canClose('institucion', closed)).toBe(false);
  });

  it('marca "voy en camino" solo en una alerta activa', async () => {
    const { repository, respond } = setup();

    expect(await respond.respond(alert)).toEqual({ ok: true, value: undefined });
    expect(await respond.respond(closed)).toEqual({ ok: false, reason: 'NOT_ACTIVE_ALERT' });
    expect(repository.respond).toHaveBeenCalledTimes(1);
  });

  it('cierra con clasificación y la nota sin espacios sobrantes', async () => {
    const { repository, respond } = setup();

    await respond.close(alert, 'FALSA_ALARMA', '  Se equivocó  ');

    expect(repository.close).toHaveBeenCalledWith('al-1', 'FALSA_ALARMA', 'Se equivocó');
  });

  it('sin clasificación, con nota muy larga o con la alerta cerrada no se envía', async () => {
    const { repository, respond } = setup();

    expect(await respond.close(alert, null, '')).toEqual({ ok: false, reason: 'INVALID_DATA' });
    expect(await respond.close(alert, 'FALSA_ALARMA', 'x'.repeat(MAX_NOTE_LENGTH + 1))).toEqual({
      ok: false,
      reason: 'INVALID_DATA',
    });
    expect(await respond.close(closed, 'FALSA_ALARMA', '')).toEqual({
      ok: false,
      reason: 'NOT_ACTIVE_ALERT',
    });
    expect(repository.close).not.toHaveBeenCalled();
  });

  it('arma 14 días con ceros y suma los conteos por clasificación', () => {
    const { respond } = setup();
    const today = new Date(2026, 9, 15, 10, 0);

    const days = respond.dailyTotals(
      [
        { day: '2026-10-15', classification: 'FALSA_ALARMA', total: 2 },
        { day: '2026-10-15', classification: 'SIN_CERRAR', total: 1 },
        { day: '2026-10-02', classification: 'SITUACION_RESUELTA', total: 1 },
        { day: '2026-09-01', classification: 'FALSA_ALARMA', total: 5 },
      ],
      today,
    );

    expect(days).toHaveLength(CHART_DAYS);
    expect(days[0].day).toBe('2026-10-02');
    expect(days[0].byClassification.SITUACION_RESUELTA).toBe(1);
    expect(days[13]).toEqual({
      day: '2026-10-15',
      byClassification: {
        FALSA_ALARMA: 2,
        SITUACION_RESUELTA: 0,
        REMITIDA_A_AUTORIDAD: 0,
        SIN_CERRAR: 1,
      },
      total: 3,
    });
    expect(days.reduce((sum, day) => sum + day.total, 0)).toBe(4);
  });
});

import { render, screen } from '@testing-library/react-native';
import { Trip } from '../../domain/entities/Trip';
import { ACCOMPANIMENT_TEXT, AccompanimentBanner, DISCREET_INDICATOR } from './AccompanimentBanner';

const trip: Trip = {
  id: 't-1',
  protegidoId: 'p-1',
  routeId: 'r-1',
  startedAt: '2026-10-12T11:42:00Z',
  status: 'EN_CURSO',
};

describe('AccompanimentBanner (E4-04, E6-04)', () => {
  it('con un trayecto EN_CURSO muestra la banda', async () => {
    await render(<AccompanimentBanner trip={trip} />);

    expect(screen.getByText(ACCOMPANIMENT_TEXT)).toBeTruthy();
    expect(screen.getByLabelText('Trayecto acompañado en curso')).toBeTruthy();
  });

  it('sin trayecto no muestra nada', async () => {
    await render(<AccompanimentBanner trip={null} />);

    expect(screen.queryByText(ACCOMPANIMENT_TEXT)).toBeNull();
  });

  it('con un trayecto cerrado no muestra nada', async () => {
    await render(<AccompanimentBanner trip={{ ...trip, status: 'CERRADO' }} />);

    expect(screen.queryByText(ACCOMPANIMENT_TEXT)).toBeNull();
  });

  it('en modo discreto solo queda el escudo, sin texto (RNF-16)', async () => {
    await render(<AccompanimentBanner trip={trip} discreet />);

    expect(screen.getByText(DISCREET_INDICATOR)).toBeTruthy();
    expect(screen.getByLabelText('Acompañamiento activo')).toBeTruthy();
    expect(screen.queryByText(ACCOMPANIMENT_TEXT)).toBeNull();
  });
});

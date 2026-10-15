import { fireEvent, render, screen } from '@testing-library/react-native';
import { Route } from '../../domain/entities/Route';
import { RouteCache } from '../../domain/repositories/RouteCache';
import { RouteRepository, RouteResult } from '../../domain/repositories/RouteRepository';
import { ManageRoutes } from '../../domain/useCases/ManageRoutes';
import { ROUTE_ERROR_MESSAGES, ROUTES_OFFLINE_NOTICE } from '../routeMessages';
import { RoutesScreen } from './RoutesScreen';

const route: Route = {
  id: 'r-1',
  direction: 'CASA_COLEGIO',
  points: [
    { latitude: 4.6, longitude: -74.08 },
    { latitude: 4.61, longitude: -74.07 },
  ],
  corridorMeters: 50,
  expectedMinutes: 25,
  updatedAt: '2026-10-09T15:00:00Z',
};

async function setup(listResult: RouteResult<Route[]>) {
  const repository: jest.Mocked<RouteRepository> = {
    list: jest.fn().mockResolvedValue(listResult),
    save: jest.fn(),
  };
  const onEditRoute = jest.fn();
  await render(
    <RoutesScreen
      manageRoutes={new ManageRoutes(repository)}
      protegidoId="p-1"
      protegidoName="Menor Uno"
      onEditRoute={onEditRoute}
      onBack={jest.fn()}
    />,
  );
  return { repository, onEditRoute };
}

describe('RoutesScreen (E3-01a, D12)', () => {
  it('muestra la ruta definida y la que falta', async () => {
    const { repository } = await setup({ ok: true, value: [route] });

    expect(await screen.findByText('Corredor 50 m · 25 min')).toBeTruthy();
    expect(screen.getByText('Sin definir')).toBeTruthy();
    expect(repository.list).toHaveBeenCalledWith('p-1');
  });

  it('abre el editor con la ruta de cada sentido', async () => {
    const { onEditRoute } = await setup({ ok: true, value: [route] });

    await fireEvent.press(await screen.findByLabelText('Ruta Casa → colegio'));
    await fireEvent.press(screen.getByLabelText('Ruta Colegio → casa'));

    expect(onEditRoute).toHaveBeenNthCalledWith(1, 'CASA_COLEGIO', route, false);
    expect(onEditRoute).toHaveBeenNthCalledWith(2, 'COLEGIO_CASA', null, false);
  });

  it('muestra el error si no puede leer las rutas', async () => {
    await setup({ ok: false, reason: 'FORBIDDEN' });

    expect(await screen.findByText(ROUTE_ERROR_MESSAGES.FORBIDDEN)).toBeTruthy();
  });
});

describe('RoutesScreen sin conexión (E3-01b)', () => {
  it('muestra las rutas guardadas en el teléfono y las abre solo para ver', async () => {
    const repository: jest.Mocked<RouteRepository> = {
      list: jest.fn().mockResolvedValue({ ok: false, reason: 'NETWORK' }),
      save: jest.fn(),
    };
    const cache: jest.Mocked<RouteCache> = {
      load: jest.fn().mockResolvedValue([route]),
      save: jest.fn(),
      clear: jest.fn(),
    };
    const onEditRoute = jest.fn();
    await render(
      <RoutesScreen
        manageRoutes={new ManageRoutes(repository, cache)}
        protegidoId="p-1"
        protegidoName="Menor Uno"
        onEditRoute={onEditRoute}
        onBack={jest.fn()}
      />,
    );

    expect(await screen.findByText(ROUTES_OFFLINE_NOTICE)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Ruta Casa → colegio'));
    await fireEvent.press(screen.getByLabelText('Ruta Colegio → casa'));

    expect(onEditRoute).toHaveBeenCalledTimes(1);
    expect(onEditRoute).toHaveBeenCalledWith('CASA_COLEGIO', route, true);
  });
});

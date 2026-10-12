import { fireEvent, render, screen } from '@testing-library/react-native';
import { Linking, Platform } from 'react-native';
import { RouteRepository, RouteResult } from '../../domain/repositories/RouteRepository';
import { ManageRoutes } from '../../domain/useCases/ManageRoutes';
import { MAP_BASE_URL, MAP_WEB_FALLBACK } from '../map/RouteMap';
import { OSM_COPYRIGHT_URL } from '../map/mapHtml';
import { ROUTE_ERROR_MESSAGES } from '../routeMessages';
import { RouteEditorScreen } from './RouteEditorScreen';

const mockInjectJavaScript = jest.fn();

jest.mock('react-native-webview', () => {
  const { forwardRef, useImperativeHandle } = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    WebView: forwardRef((props: object, ref: unknown) => {
      useImperativeHandle(ref, () => ({ injectJavaScript: mockInjectJavaScript }));
      return <View {...props} />;
    }),
  };
});

const route = {
  id: 'r-1',
  direction: 'CASA_COLEGIO' as const,
  points: [
    { latitude: 4.6, longitude: -74.08 },
    { latitude: 4.61, longitude: -74.07 },
  ],
  corridorMeters: 50,
  expectedMinutes: 25,
  updatedAt: '2026-10-09T15:00:00Z',
};

async function setup(
  options: { saveResult?: RouteResult<string>; initialRoute?: typeof route | null } = {},
) {
  const repository: jest.Mocked<RouteRepository> = {
    list: jest.fn(),
    save: jest.fn().mockResolvedValue(options.saveResult ?? { ok: true, value: 'r-1' }),
  };
  const onSaved = jest.fn();
  await render(
    <RouteEditorScreen
      manageRoutes={new ManageRoutes(repository)}
      protegidoId="p-1"
      direction="CASA_COLEGIO"
      route={options.initialRoute ?? null}
      onSaved={onSaved}
      onBack={jest.fn()}
    />,
  );
  return { repository, onSaved };
}

const map = () => screen.getByTestId('mapa-ruta');

async function sendFromMap(message: unknown) {
  await fireEvent(map(), 'message', { nativeEvent: { data: JSON.stringify(message) } });
}

async function tapMap(latitude: number, longitude: number) {
  await sendFromMap({ type: 'tap', latitude, longitude });
}

describe('RouteEditorScreen (E3-01a, E3-02, E3-03)', () => {
  beforeEach(() => mockInjectJavaScript.mockClear());

  it('el guardián marca la ruta en el mapa y la guarda con corredor y duración', async () => {
    const { repository, onSaved } = await setup();

    await tapMap(4.6, -74.08);
    await tapMap(4.61, -74.07);
    await fireEvent.press(screen.getByLabelText('Ampliar corredor'));
    await fireEvent.changeText(screen.getByLabelText('Duración esperada en minutos'), '25');
    await fireEvent.press(screen.getByText('Guardar ruta'));

    expect(repository.save).toHaveBeenCalledWith('p-1', {
      direction: 'CASA_COLEGIO',
      points: route.points,
      corridorMeters: 75,
      expectedMinutes: 25,
    });
    expect(onSaved).toHaveBeenCalled();
  });

  it('no guarda una ruta con menos de 2 puntos', async () => {
    const { repository } = await setup();

    await tapMap(4.6, -74.08);
    await fireEvent.press(screen.getByText('Deshacer'));
    await fireEvent.changeText(screen.getByLabelText('Duración esperada en minutos'), '25');
    await fireEvent.press(screen.getByText('Guardar ruta'));

    expect(await screen.findByText('Marca al menos 2 puntos en el mapa.')).toBeTruthy();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('pide una duración entre 5 y 120 minutos', async () => {
    const { repository } = await setup({ initialRoute: route });

    await fireEvent.changeText(screen.getByLabelText('Duración esperada en minutos'), '');
    await fireEvent.press(screen.getByText('Guardar ruta'));

    expect(await screen.findByText('La duración va de 5 a 120 minutos.')).toBeTruthy();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('el corredor no baja de 25 m (D10)', async () => {
    await setup();

    await fireEvent.press(screen.getByLabelText('Reducir corredor'));
    await fireEvent.press(screen.getByLabelText('Reducir corredor'));

    expect(screen.getByText('Corredor: 25 m')).toBeTruthy();
  });

  it('carga la ruta guardada para editarla', async () => {
    await setup({ initialRoute: route });

    expect(screen.getByText('Corredor: 50 m')).toBeTruthy();
    expect(screen.getByLabelText('Duración esperada en minutos').props.value).toBe('25');
  });

  it('muestra el error del servidor', async () => {
    await setup({ initialRoute: route, saveResult: { ok: false, reason: 'NOT_ACTIVE' } });

    await fireEvent.press(screen.getByText('Guardar ruta'));

    expect(await screen.findByText(ROUTE_ERROR_MESSAGES.NOT_ACTIVE)).toBeTruthy();
  });

  it('dibuja la ruta en el mapa cuando el mapa está listo', async () => {
    await setup({ initialRoute: route });

    await sendFromMap({ type: 'ready' });

    expect(mockInjectJavaScript).toHaveBeenCalledWith(expect.stringContaining('nexaRender'));
    expect(mockInjectJavaScript.mock.calls[0][0]).toContain('"corridorMeters":50');
  });

  it('ignora mensajes del mapa que no son válidos', async () => {
    const { repository } = await setup();

    await fireEvent(map(), 'message', { nativeEvent: { data: 'no es json' } });
    await sendFromMap({ type: 'tap', latitude: 'x', longitude: -74 });
    await sendFromMap(null);
    await fireEvent.changeText(screen.getByLabelText('Duración esperada en minutos'), '25');
    await fireEvent.press(screen.getByText('Guardar ruta'));

    expect(await screen.findByText('Marca al menos 2 puntos en el mapa.')).toBeTruthy();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('el mapa no navega; la atribución se abre en el navegador', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    await setup();
    const navigate = map().props.onShouldStartLoadWithRequest;

    expect(navigate({ url: MAP_BASE_URL })).toBe(true);
    expect(navigate({ url: 'https://example.com/' })).toBe(false);
    expect(navigate({ url: OSM_COPYRIGHT_URL })).toBe(false);
    expect(openURL).toHaveBeenCalledWith(OSM_COPYRIGHT_URL);
  });

  it('en el navegador avisa que el mapa solo funciona en Android (D9)', async () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    await setup();

    expect(screen.getByText(MAP_WEB_FALLBACK)).toBeTruthy();
    jest.restoreAllMocks();
  });
});

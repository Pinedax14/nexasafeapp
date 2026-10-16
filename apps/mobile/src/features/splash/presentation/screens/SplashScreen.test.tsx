import { act, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { SPLASH_TAGLINE, SplashScreen } from './SplashScreen';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('SplashScreen', () => {
  it('muestra el nombre y el lema, y termina a los 2,5 s', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    const onFinish = jest.fn();

    await render(<SplashScreen onFinish={onFinish} />);

    expect(screen.getByText('NexaSafe')).toBeTruthy();
    expect(screen.getByText(SPLASH_TAGLINE)).toBeTruthy();
    await act(async () => {
      jest.advanceTimersByTime(2499);
    });
    expect(onFinish).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('con "Quitar animaciones" muestra el nombre de una vez', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);

    await render(<SplashScreen onFinish={jest.fn()} />);
    await act(async () => {});

    expect(screen.getByText('NexaSafe')).toHaveStyle({ color: '#FFFFFF' });
    expect(screen.getByTestId('splash-textos')).toHaveStyle({ opacity: 1 });
  });

  it('si no se puede consultar la accesibilidad, anima igual', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockRejectedValue(new Error('x'));

    await render(<SplashScreen onFinish={jest.fn()} />);
    await act(async () => {});

    expect(screen.getByTestId('splash')).toBeTruthy();
  });
});

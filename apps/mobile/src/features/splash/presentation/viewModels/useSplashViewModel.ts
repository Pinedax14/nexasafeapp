import { useEffect } from 'react';

type UseSplashViewModelProps = {
  onFinish: () => void;
};

export function useSplashViewModel({
  onFinish,
}: UseSplashViewModelProps) {
  useEffect(() => {
    const timerId = setTimeout(() => {
      onFinish();
    }, 2500);

    return () => {
      clearTimeout(timerId);
    };
  }, [onFinish]);
}
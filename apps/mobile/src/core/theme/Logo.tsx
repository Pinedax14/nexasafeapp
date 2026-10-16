import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

// Trazos del logo (escudo con pin) en el lienzo de assets/brand/logo.svg.
export const LOGO_VIEW_BOX = '264 203 496 617';
export const LOGO_RATIO = 617 / 496;
export const SHIELD_PATH =
  'M496 209 Q512 203 528 209 L735 285 Q760 295 760 322 L760 545 C760 660 650 750 530 811 Q512 820 494 811 C374 750 264 660 264 545 L264 322 Q264 295 289 285 Z';
export const PIN_PATH =
  'M512 676 Q506 676 501 669 L414 532 A117 117 0 1 1 610 532 L523 669 Q518 676 512 676 Z';
export const PIN_HOLE = { cx: 512, cy: 467, r: 57 };

type LayerProps = { width: number; color: string; holeColor: string };

/** Solo el escudo. */
export function ShieldShape({ width, color }: Omit<LayerProps, 'holeColor'>) {
  return (
    <Svg width={width} height={width * LOGO_RATIO} viewBox={LOGO_VIEW_BOX}>
      <Path d={SHIELD_PATH} fill={color} />
    </Svg>
  );
}

/** Solo el pin, en el mismo lienzo que el escudo para que encajen al superponerlos. */
export function PinShape({ width, color, holeColor }: LayerProps) {
  return (
    <Svg width={width} height={width * LOGO_RATIO} viewBox={LOGO_VIEW_BOX}>
      <Path d={PIN_PATH} fill={color} />
      <Circle {...PIN_HOLE} fill={holeColor} />
    </Svg>
  );
}

/** Logo a color (degradado morado) para fondos claros. */
export function Logo({ width }: { width: number }) {
  return (
    <Svg
      width={width}
      height={width * LOGO_RATIO}
      viewBox={LOGO_VIEW_BOX}
      accessibilityRole="image"
      accessibilityLabel="NexaSafe"
    >
      <Defs>
        <LinearGradient
          id="nexasafe-logo"
          x1="264"
          y1="205"
          x2="760"
          y2="815"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor="#C084FC" />
          <Stop offset="0.45" stopColor="#7C5CE8" />
          <Stop offset="1" stopColor="#4C1D95" />
        </LinearGradient>
      </Defs>
      <Path d={SHIELD_PATH} fill="url(#nexasafe-logo)" />
      <Path d={PIN_PATH} fill="#FFFFFF" />
      <Circle {...PIN_HOLE} fill="url(#nexasafe-logo)" />
    </Svg>
  );
}

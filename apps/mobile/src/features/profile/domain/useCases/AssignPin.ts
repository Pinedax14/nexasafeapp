import { ProfileResult, ProtegidoRepository } from '../repositories/ProtegidoRepository';

const PIN_PATTERN = /^[0-9]{4}$/;
/** PIN demasiado fáciles de adivinar. */
const WEAK_PINS = new Set([
  '0000',
  '1111',
  '2222',
  '3333',
  '4444',
  '5555',
  '6666',
  '7777',
  '8888',
  '9999',
  '1234',
  '4321',
]);

export type PinField = 'pin' | 'confirmation';
export type PinErrors = Partial<Record<PinField, string>>;

export type AssignPinResult =
  ProfileResult<void> | { ok: false; reason: 'INVALID_INPUT'; errors: PinErrors };

export function validatePin(pin: string, confirmation: string): PinErrors {
  const errors: PinErrors = {};
  if (!PIN_PATTERN.test(pin)) {
    errors.pin = 'El PIN debe tener exactamente 4 números.';
  } else if (WEAK_PINS.has(pin)) {
    errors.pin = 'Ese PIN es muy fácil de adivinar. Elige otro.';
  }
  if (!errors.pin && pin !== confirmation) errors.confirmation = 'Los PIN no coinciden.';
  return errors;
}

/** E1-04 (D5): el guardián asigna el PIN cuando el colegio ya validó al menor. */
export class AssignPin {
  constructor(private readonly repository: ProtegidoRepository) {}

  async execute(protegidoId: string, pin: string, confirmation: string): Promise<AssignPinResult> {
    const errors = validatePin(pin, confirmation);
    if (Object.keys(errors).length > 0) {
      return { ok: false, reason: 'INVALID_INPUT', errors };
    }
    return this.repository.assignPin(protegidoId, pin);
  }

  /** El guardián pide un PIN aleatorio en lugar de inventarlo. */
  generate(protegidoId: string): Promise<ProfileResult<string>> {
    return this.repository.generatePin(protegidoId);
  }
}

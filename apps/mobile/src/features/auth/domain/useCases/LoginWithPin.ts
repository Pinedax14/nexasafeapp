import { normalizeDocument } from '../../../profile/domain/useCases/RegisterProtegido';
import { AuthRepository, LoginResult } from '../repositories/AuthRepository';

const PIN_PATTERN = /^[0-9]{4}$/;
const DOCUMENT_PATTERN = /^[A-Za-z0-9]{5,20}$/;

export type PinLoginField = 'document' | 'pin';
export type PinLoginErrors = Partial<Record<PinLoginField, string>>;

export type LoginWithPinResult =
  LoginResult | { ok: false; reason: 'INVALID_INPUT'; errors: PinLoginErrors };

export function validatePinLogin(document: string, pin: string): PinLoginErrors {
  const errors: PinLoginErrors = {};
  if (!DOCUMENT_PATTERN.test(normalizeDocument(document))) {
    errors.document = 'Ingresa tu número de documento.';
  }
  if (!PIN_PATTERN.test(pin)) errors.pin = 'El PIN tiene 4 números.';
  return errors;
}

/** E1-04: el protegido entra con su documento y su PIN de 4 dígitos (RF-04, RNF-15). */
export class LoginWithPin {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(document: string, pin: string): Promise<LoginWithPinResult> {
    const errors = validatePinLogin(document, pin);
    if (Object.keys(errors).length > 0) {
      return { ok: false, reason: 'INVALID_INPUT', errors };
    }
    return this.authRepository.loginWithPin(normalizeDocument(document), pin);
  }
}

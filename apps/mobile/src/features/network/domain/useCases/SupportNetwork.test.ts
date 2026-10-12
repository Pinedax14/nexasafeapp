import { contactStatus } from '../entities/SupportContact';
import { SupportNetworkRepository } from '../repositories/SupportNetworkRepository';
import {
  extractToken,
  invitationLink,
  invitationMessage,
  INVITATION_LINK_PREFIX,
  SupportNetwork,
} from './SupportNetwork';

const CODIGO = 'codigo-de-prueba-0000001';

function setup() {
  const repository: jest.Mocked<SupportNetworkRepository> = {
    listContacts: jest.fn().mockResolvedValue({ ok: true, value: [] }),
    createInvitation: jest
      .fn()
      .mockResolvedValue({ ok: true, value: { id: 'i-1', token: CODIGO, expiresAt: 'x' } }),
    previewInvitation: jest
      .fn()
      .mockResolvedValue({ ok: true, value: { childFirstName: 'Menor', guardianName: 'Ana' } }),
    registerWithInvitation: jest
      .fn()
      .mockResolvedValue({ ok: true, status: 'CONFIRMATION_PENDING' }),
  };
  return { repository, network: new SupportNetwork(repository) };
}

describe('enlace y código de invitación (D14)', () => {
  it('arma el enlace propio de la app', () => {
    expect(invitationLink(CODIGO)).toBe(`nexasafe://invitacion/${CODIGO}`);
  });

  it('acepta el enlace completo o solo el código', () => {
    expect(extractToken(`  ${INVITATION_LINK_PREFIX}${CODIGO} `)).toBe(CODIGO);
    expect(extractToken(CODIGO)).toBe(CODIGO);
  });

  it.each([
    '',
    'hola',
    'nexasafe://invitacion/',
    'https://otra.app/abcDEF123_-xyzABC456789',
    'a b',
  ])('rechaza %p', (input) => {
    expect(extractToken(input)).toBeNull();
  });

  it('el mensaje para compartir trae el enlace, el código y el vencimiento', () => {
    const message = invitationMessage({ id: 'i-1', token: CODIGO, expiresAt: 'x' }, 'Ana');

    expect(message).toContain('Ana te invita');
    expect(message).toContain(invitationLink(CODIGO));
    expect(message).toContain('Tengo una invitación');
    expect(message).toContain('vence en 72 horas');
  });
});

describe('contactStatus (W5)', () => {
  const contact = {
    id: 'c-1',
    protegidoId: 'p-1',
    name: null,
    acceptedAt: null,
    expiresAt: '2026-10-15T00:00:00Z',
  };
  const now = new Date('2026-10-12T00:00:00Z');

  it('pendiente mientras no vence', () => {
    expect(contactStatus(contact, now)).toBe('PENDIENTE');
  });

  it('vencida después de 72 horas', () => {
    expect(contactStatus(contact, new Date('2026-10-16T00:00:00Z'))).toBe('VENCIDA');
  });

  it('aceptada cuando el contacto creó su cuenta', () => {
    expect(contactStatus({ ...contact, acceptedAt: '2026-10-12T01:00:00Z' }, now)).toBe('ACEPTADA');
  });
});

describe('SupportNetwork (E2-01)', () => {
  it('lista los contactos del menor', async () => {
    const { repository, network } = setup();

    await network.listContacts('p-1');

    expect(repository.listContacts).toHaveBeenCalledWith('p-1');
  });

  it('crea la invitación', async () => {
    const { repository, network } = setup();

    expect((await network.invite('p-1')).ok).toBe(true);
    expect(repository.createInvitation).toHaveBeenCalledWith('p-1');
  });

  it('muestra la invitación a partir del enlace', async () => {
    const { repository, network } = setup();

    const result = await network.preview(invitationLink(CODIGO));

    expect(result).toEqual({
      ok: true,
      value: { token: CODIGO, preview: { childFirstName: 'Menor', guardianName: 'Ana' } },
    });
    expect(repository.previewInvitation).toHaveBeenCalledWith(CODIGO);
  });

  it('un código mal escrito es una invitación no válida, sin ir al servidor', async () => {
    const { repository, network } = setup();

    expect(await network.preview('no sirve')).toEqual({ ok: false, reason: 'INVALID_INVITATION' });
    expect(repository.previewInvitation).not.toHaveBeenCalled();
  });

  it('informa el error del servidor al ver la invitación', async () => {
    const { repository, network } = setup();
    repository.previewInvitation.mockResolvedValue({ ok: false, reason: 'INVALID_INVITATION' });

    expect(await network.preview(CODIGO)).toEqual({ ok: false, reason: 'INVALID_INVITATION' });
  });

  it('registra al contacto con su invitación', async () => {
    const { repository, network } = setup();

    await network.register(' Ana Tía ', ' ANA@Example.com ', 'segura123', CODIGO);

    expect(repository.registerWithInvitation).toHaveBeenCalledWith({
      name: 'Ana Tía',
      email: 'ana@example.com',
      password: 'segura123',
      token: CODIGO,
    });
  });

  it('valida los datos antes de registrar', async () => {
    const { repository, network } = setup();

    const result = await network.register('', 'correo', '123', CODIGO);

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toBe('INVALID_INPUT');
    expect(repository.registerWithInvitation).not.toHaveBeenCalled();
  });
});

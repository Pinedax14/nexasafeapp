import {
  SupabaseSupportNetworkRepository,
  SupportNetworkClient,
} from './SupabaseSupportNetworkRepository';

type Result = { data: unknown; error: { code?: string; message?: string } | null };

function setup(options: { query?: Result; rpc?: Result; signUp?: unknown } = {}) {
  const query = options.query ?? { data: [], error: null };
  const builder: { select: jest.Mock; eq: jest.Mock; order: jest.Mock } = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    order: jest.fn(() => Promise.resolve(query)),
  };
  const client = {
    from: jest.fn(() => builder),
    rpc: jest.fn().mockResolvedValue(options.rpc ?? { data: [], error: null }),
    auth: {
      signUp: jest
        .fn()
        .mockResolvedValue(options.signUp ?? { data: { user: null, session: null }, error: null }),
    },
  };
  return {
    client,
    builder,
    repository: new SupabaseSupportNetworkRepository(client as unknown as SupportNetworkClient),
  };
}

const registration = { name: 'Ana', email: 'ana@example.com', password: 'segura123', token: 'tok' };

describe('SupabaseSupportNetworkRepository (E2-01)', () => {
  it('lista los contactos del menor (RLS: solo los del guardián)', async () => {
    const { client, builder, repository } = setup({
      query: {
        data: [
          {
            id: 'c-1',
            protegido_id: 'p-1',
            nombre: 'Ana',
            aceptada_en: '2026-10-12',
            vence_en: '2026-10-15',
          },
        ],
        error: null,
      },
    });

    const result = await repository.listContacts('p-1');

    expect(client.from).toHaveBeenCalledWith('contactos_apoyo');
    expect(builder.eq).toHaveBeenCalledWith('protegido_id', 'p-1');
    expect(result).toEqual({
      ok: true,
      value: [
        {
          id: 'c-1',
          protegidoId: 'p-1',
          name: 'Ana',
          acceptedAt: '2026-10-12',
          expiresAt: '2026-10-15',
        },
      ],
    });
  });

  it('informa el error al listar', async () => {
    const { repository } = setup({ query: { data: null, error: { message: 'Failed to fetch' } } });

    expect(await repository.listContacts('p-1')).toEqual({ ok: false, reason: 'NETWORK' });
  });

  it('crea la invitación con crear_invitacion', async () => {
    const { client, repository } = setup({
      rpc: { data: [{ id: 'i-1', token: 'tok', vence_en: '2026-10-15' }], error: null },
    });

    expect(await repository.createInvitation('p-1')).toEqual({
      ok: true,
      value: { id: 'i-1', token: 'tok', expiresAt: '2026-10-15' },
    });
    expect(client.rpc).toHaveBeenCalledWith('crear_invitacion', { p_protegido_id: 'p-1' });
  });

  it.each([
    ['42501', 'FORBIDDEN'],
    ['P0001', 'NOT_ACTIVE'],
    ['NX429', 'RATE_LIMITED'],
    ['XX000', 'UNKNOWN'],
  ])('traduce el error %s al crear la invitación', async (code, reason) => {
    const { repository } = setup({ rpc: { data: null, error: { code } } });

    expect(await repository.createInvitation('p-1')).toEqual({ ok: false, reason });
  });

  it('muestra la invitación con ver_invitacion (D17)', async () => {
    const { client, repository } = setup({
      rpc: { data: [{ menor: 'Menor', guardian: 'Ana' }], error: null },
    });

    expect(await repository.previewInvitation('tok')).toEqual({
      ok: true,
      value: { childFirstName: 'Menor', guardianName: 'Ana' },
    });
    expect(client.rpc).toHaveBeenCalledWith('ver_invitacion', { p_token: 'tok' });
  });

  it.each([[{ data: null, error: { code: 'NX410' } }], [{ data: [], error: null }]])(
    'una invitación usada o vencida no es válida',
    async (rpc) => {
      const { repository } = setup({ rpc });

      expect(await repository.previewInvitation('tok')).toEqual({
        ok: false,
        reason: 'INVALID_INVITATION',
      });
    },
  );

  it('registra la cuenta enviando el token en los metadatos', async () => {
    const user = {
      id: 'u-1',
      email: 'ana@example.com',
      user_metadata: { nombre: 'Ana' },
      app_metadata: { rol: 'apoyo' },
    };
    const { client, repository } = setup({ signUp: { data: { user, session: {} }, error: null } });

    const result = await repository.registerWithInvitation(registration);

    expect(client.auth.signUp).toHaveBeenCalledWith({
      email: 'ana@example.com',
      password: 'segura123',
      options: { data: { nombre: 'Ana', invitacion: 'tok' } },
    });
    expect(result).toEqual(expect.objectContaining({ ok: true, status: 'SIGNED_IN' }));
    expect(result.ok && result.status === 'SIGNED_IN' && result.user.role).toBe('apoyo');
  });

  it('con confirmación de correo queda pendiente', async () => {
    const { repository } = setup();

    expect(await repository.registerWithInvitation(registration)).toEqual({
      ok: true,
      status: 'CONFIRMATION_PENDING',
    });
  });

  it('un correo ya registrado no se distingue (D2)', async () => {
    const { repository } = setup({
      signUp: {
        data: { user: null, session: null },
        error: { code: 'user_already_exists', status: 422 },
      },
    });

    expect(await repository.registerWithInvitation(registration)).toEqual({
      ok: true,
      status: 'CONFIRMATION_PENDING',
    });
  });

  it.each([
    [{ status: 500, code: 'unexpected_failure' }, 'INVALID_INVITATION'],
    [{ name: 'AuthRetryableFetchError', status: 0 }, 'NETWORK'],
    [{ code: 'weak_password', status: 422 }, 'WEAK_PASSWORD'],
    [{ status: 429 }, 'RATE_LIMITED'],
    [{ status: 400, code: 'otro' }, 'UNKNOWN'],
  ])('traduce el error de registro %p a %s', async (error, reason) => {
    const { repository } = setup({ signUp: { data: { user: null, session: null }, error } });

    expect(await repository.registerWithInvitation(registration)).toEqual({ ok: false, reason });
  });
});

## Historia

Cierra #<!-- número del issue --> · **ID:** <!-- p. ej. E1-01 --> · **Sprint:** <!-- p. ej. 01 -->

## Qué cambia

<!-- Resumen corto de lo que hace este PR -->

## Criterios de aceptación (Gherkin)

```gherkin
Dado ...
Cuando ...
Entonces ...
```

## ¿Toca datos personales o de menores?

- [ ] No
- [ ] Sí → tablas/campos afectados, políticas RLS y registro en `audit_log`:

## Definition of Done

- [ ] Criterios de aceptación Gherkin verificados
- [ ] Probado en Android físico
- [ ] PR aprobado por al menos un compañero
- [ ] Cobertura unitaria ≥ 70 % en el módulo tocado
- [ ] ESLint + Prettier sin errores
- [ ] Sin TODO ni código comentado
- [ ] Semgrep sin High/Critical
- [ ] npm audit (--audit-level=high) sin High/Critical
- [ ] Gitleaks limpio
- [ ] Sin datos personales en logs
- [ ] Tablas/Edge Functions nuevas con RLS + rol + rate limiting
- [ ] README / CHANGELOG actualizados
- [ ] Tipos de Supabase regenerados si cambió el esquema
- [ ] Desplegado en staging por el pipeline

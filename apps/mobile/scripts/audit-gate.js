// Quality gate de SCA: falla ante cualquier advisory High/Critical de `npm audit`
// que no tenga una excepción vigente en docs/security/audit-allowlist.json.
// Cada excepción debe existir también en docs/security/exceptions.md.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BLOCKING = new Set(['high', 'critical']);
const allowlistPath = path.resolve(__dirname, '../../../docs/security/audit-allowlist.json');

function runAudit() {
  const npmCli = process.env.npm_execpath;
  if (!npmCli) {
    console.error('Ejecuta este script con "npm run audit:gate".');
    process.exit(2);
  }
  try {
    return execFileSync(process.execPath, [npmCli, 'audit', '--json'], { encoding: 'utf8' });
  } catch (error) {
    // npm audit sale con código 1 cuando encuentra vulnerabilidades; el JSON sigue en stdout.
    if (error.stdout) return error.stdout;
    throw error;
  }
}

function blockingAdvisories(report) {
  const found = new Map();
  for (const vulnerability of Object.values(report.vulnerabilities ?? {})) {
    for (const via of vulnerability.via) {
      if (typeof via === 'object' && BLOCKING.has(via.severity)) {
        found.set(via.url, { package: via.name, severity: via.severity, title: via.title });
      }
    }
  }
  return found;
}

const today = new Date().toISOString().slice(0, 10);
const allowlist = JSON.parse(fs.readFileSync(allowlistPath, 'utf8'));
const exceptions = new Map(allowlist.map((entry) => [entry.advisory, entry]));
const advisories = blockingAdvisories(JSON.parse(runAudit()));

const failures = [];
for (const [url, advisory] of advisories) {
  const exception = exceptions.get(url);
  if (!exception) {
    failures.push(`SIN EXCEPCIÓN  ${advisory.severity}  ${advisory.package}  ${url}`);
  } else if (exception.expires < today) {
    failures.push(`VENCIDA ${exception.expires} (${exception.id})  ${advisory.package}  ${url}`);
  } else {
    console.log(
      `excepción ${exception.id} vigente hasta ${exception.expires}: ${advisory.package} ${url}`,
    );
  }
}

for (const entry of allowlist) {
  if (!advisories.has(entry.advisory)) {
    console.log(
      `la excepción ${entry.id} ya no es necesaria (${entry.advisory}); retírala de exceptions.md`,
    );
  }
}

if (failures.length > 0) {
  console.error(
    `\n${failures.length} hallazgo(s) High/Critical bloquean el merge:\n${failures.join('\n')}`,
  );
  process.exit(1);
}
console.log(`\nSCA OK: ${advisories.size} advisory(s) High/Critical, todos con excepción vigente.`);

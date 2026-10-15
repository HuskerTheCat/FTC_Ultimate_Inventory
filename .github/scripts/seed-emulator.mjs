// Writes a test team and one part into the local Firestore emulator (project demo-ftc).
// "Bearer owner" is the emulator's admin token, so these writes skip the security rules.

const BASE = 'http://127.0.0.1:8080/v1/projects/demo-ftc/databases/(default)/documents';
const strings = (data) => ({ fields: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, { stringValue: v }])) });

async function write(path, body) {
  const response = await fetch(`${BASE}/${path}`, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Seeding ${path} failed: ${response.status} ${await response.text()}`);
}

await write('team/info', strings({ name: 'Smoke Test Team', secret: 'smoketest23', owner: 'seed' }));
await write('join/info', strings({ name: 'Smoke Test Team', apiKey: 'demo-key', authDomain: 'demo-ftc.firebaseapp.com', appId: 'demo-app' }));
const part = strings({ name: 'Seeded test part', partNumber: 'SP-1', location: 'Bin A', supplier: 'goBILDA', category: 'Hardware', projectId: 'main' });
part.fields.quantity = { integerValue: '3' };
part.fields.tags = { arrayValue: { values: [] } };
await write('parts/seeded', part);
console.log('Seeded test team demo-ftc');

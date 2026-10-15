// Demo backend: the same functions as firebase.js, backed by sample data in memory.
// Nothing is saved; reloading the page starts the demo over.
import { Timestamp } from 'firebase/firestore';

export const MAIN_PROJECT = 'main';

const USER = { uid: 'demo', email: 'you@demo.team' };
const ROBOT = 'robot';
const PACKING = 'packing';
const SPARES = 'spares';

const collections = {
  members: new Map([
    ['demo', { email: USER.email, name: 'You' }],
    ['coach', { email: 'coach@demo.team', name: 'Coach Rivera' }],
    ['maya', { email: 'maya@demo.team', name: 'Maya' }],
  ]),
  projects: new Map([
    [MAIN_PROJECT, { name: 'Main Inventory', source: '' }],
    [SPARES, { name: 'Pit spares', source: '' }],
    [ROBOT, { name: 'Competition Robot', source: MAIN_PROJECT }],
    [PACKING, { name: 'Qualifier pit box', source: MAIN_PROJECT, kind: 'packing' }],
  ]),
  parts: new Map(),
  uses: new Map(),
  locations: new Map(),
  orders: new Map(),
  printed: new Map(),
  log: new Map(),
  trash: new Map(),
};
const listeners = Object.fromEntries(Object.keys(collections).map((name) => [name, new Set()]));
let nextId = 1;

const docs = (name) => [...collections[name]].map(([id, data]) => ({ id, ...data }));

function changed(name) {
  for (const listener of listeners[name]) listener();
}

function watch(name, listener) {
  listeners[name].add(listener);
  listener();
  return () => listeners[name].delete(listener);
}

function write(name, id, data) {
  collections[name].set(id, data);
  changed(name);
}

function remove(name, id) {
  collections[name].delete(id);
  changed(name);
}

function add(name, data) {
  const id = `demo-${nextId++}`;
  write(name, id, data);
  return { id };
}

// ---------- sample data ----------

const SAMPLE_LOCATIONS = ['Bin 1', 'Bin 2', 'Bin 3', 'Bin 4', 'Electronics drawer', 'Shelf A', 'Shelf B', 'Tool wall', 'Pit cabinet'];

// [name, part number, quantity, location, supplier, category, tags]
const SAMPLE_PARTS = [
  ['Yellow Jacket motor 312 RPM', '5203-2402-0019', 6, 'Shelf A', 'goBILDA', 'Electronics/Motors', ['drivetrain']],
  ['Yellow Jacket motor 435 RPM', '5203-2402-0014', 4, 'Shelf A', 'goBILDA', 'Electronics/Motors', ['drivetrain']],
  ['Core Hex motor', 'REV-41-1300', 3, 'Shelf A', 'REV Robotics', 'Electronics/Motors', []],
  ['Speed servo', '2000-0025-0003', 5, 'Bin 1', 'goBILDA', 'Electronics/Servos', ['intake']],
  ['Smart Robot Servo', 'REV-41-1097', 4, 'Bin 1', 'REV Robotics', 'Electronics/Servos', []],
  ['Control Hub', 'REV-31-1595', 1, 'Electronics drawer', 'REV Robotics', 'Electronics/Controllers', ['competition']],
  ['Expansion Hub', 'REV-31-1153', 1, 'Electronics drawer', 'REV Robotics', 'Electronics/Controllers', []],
  ['12V Slim battery', 'REV-31-1302', 4, 'Electronics drawer', 'REV Robotics', 'Electronics/Power', ['competition']],
  ['Switch cable and bracket', 'REV-31-1387', 2, 'Electronics drawer', 'REV Robotics', 'Electronics/Power', []],
  ['Color sensor V3', 'REV-31-1557', 2, 'Electronics drawer', 'REV Robotics', 'Electronics/Sensors', []],
  ['2m distance sensor', 'REV-31-1505', 2, 'Electronics drawer', 'REV Robotics', 'Electronics/Sensors', []],
  ['Pinpoint odometry computer', '3110-0002-0001', 1, 'Electronics drawer', 'goBILDA', 'Electronics/Sensors', ['odometry']],
  ['Swingarm odometry pod', '3110-0001-0001', 2, 'Bin 2', 'goBILDA', 'Electronics/Sensors', ['odometry']],
  ['Mecanum wheel set 104mm', '3213-3606-0001', 2, 'Shelf B', 'goBILDA', 'Hardware/Wheels', ['drivetrain']],
  ['Grip wheel 96mm', '3606-0014-0096', 4, 'Shelf B', 'goBILDA', 'Hardware/Wheels', []],
  ['U-Channel 5 hole', '1120-0005-0160', 8, 'Shelf B', 'goBILDA', 'Hardware/Structure', []],
  ['Low-Side U-Channel 13 hole', '1121-0013-0392', 4, 'Shelf B', 'goBILDA', 'Hardware/Structure', ['drivetrain']],
  ['Viper-Slide kit 336mm', '3100-0001-0001', 1, 'Shelf B', 'goBILDA', 'Hardware/Linear motion', ['lift']],
  ['M4 x 8mm socket head screw (25 pack)', '2802-0004-0008', 12, 'Bin 3', 'goBILDA', 'Hardware/Screws', []],
  ['M4 x 12mm socket head screw (25 pack)', '2802-0004-0012', 9, 'Bin 3', 'goBILDA', 'Hardware/Screws', []],
  ['M4 nylock nut (25 pack)', '2812-0004-0007', 10, 'Bin 3', 'goBILDA', 'Hardware/Nuts', []],
  ['8mm REX shaft 96mm', '2100-0008-0096', 6, 'Bin 4', 'goBILDA', 'Hardware/Shafts', []],
  ['Flanged ball bearing 8mm', '1611-0814-0008', 16, 'Bin 4', 'goBILDA', 'Hardware/Bearings', []],
  ['Surgical tubing (1 m)', '', 3, 'Bin 2', 'McMaster-Carr', 'Hardware/Intake', ['intake']],
  ['Zip ties (100 pack)', '', 2, 'Tool wall', 'Amazon', 'Supplies', []],
  ['2.5mm hex driver', '', 3, 'Tool wall', 'goBILDA', 'Tools', []],
];

// Same fields, for the second inventory.
const SAMPLE_SPARES = [
  ['Control Hub (spare)', 'REV-31-1595', 1, 'Pit cabinet', 'REV Robotics', 'Electronics/Controllers', ['competition']],
  ['Speed servo (spare)', '2000-0025-0003', 2, 'Pit cabinet', 'goBILDA', 'Electronics/Servos', []],
  ['Battery charger', '', 2, 'Pit cabinet', 'REV Robotics', 'Electronics/Power', []],
];

// [part name, quantity used on the competition robot]
const SAMPLE_USES = [
  ['Yellow Jacket motor 312 RPM', 4], ['Yellow Jacket motor 435 RPM', 2], ['Speed servo', 3], ['Control Hub', 1],
  ['Expansion Hub', 1], ['12V Slim battery', 1], ['Pinpoint odometry computer', 1], ['Swingarm odometry pod', 2],
  ['Mecanum wheel set 104mm', 1], ['Viper-Slide kit 336mm', 1], ['Low-Side U-Channel 13 hole', 2],
];

// [part name, quantity to pack, packed]
const SAMPLE_PACKING = [
  ['12V Slim battery', 2, true], ['Zip ties (100 pack)', 1, true], ['2.5mm hex driver', 2, false],
  ['Smart Robot Servo', 1, false], ['M4 x 8mm socket head screw (25 pack)', 1, false],
  ['Control Hub (spare)', 1, false], ['Battery charger', 1, true],
];

// [name, part number, quantity, supplier, existing part name or '', item link or '', notes or '']
const SAMPLE_ORDERS = [
  ['Yellow Jacket motor 312 RPM', '5203-2402-0019', 2, 'goBILDA', 'Yellow Jacket motor 312 RPM', 'https://www.gobilda.com/'],
  ['Servo extension cable 300mm', '3802-0003-0300', 6, 'goBILDA', '', '', 'For the intake rebuild'],
  ['Limit switch', 'REV-31-1462', 2, 'REV Robotics', '', 'https://www.revrobotics.com/'],
];

function loadSamples() {
  const hoursAgo = (hours) => Timestamp.fromMillis(Date.now() - hours * 3600 * 1000);
  for (const name of SAMPLE_LOCATIONS) add('locations', { name });
  const ids = new Map();
  const addParts = (rows, projectId) => rows.forEach(([name, partNumber, quantity, location, supplier, category, tags], i) => {
    const part = { name, partNumber, quantity, location, supplier, category, tags, unit: 'pcs', condition: 'new', notes: '' };
    ids.set(name, add('parts', { ...part, projectId, updatedBy: 'coach@demo.team', updatedAt: hoursAgo(i + 1) }).id);
  });
  addParts(SAMPLE_PARTS, MAIN_PROJECT);
  addParts(SAMPLE_SPARES, SPARES);
  for (const [name, quantity] of SAMPLE_USES) {
    const partId = ids.get(name);
    write('uses', `${ROBOT}_${partId}`, { projectId: ROBOT, partId, quantity });
  }
  for (const [name, quantity, packed] of SAMPLE_PACKING) {
    const partId = ids.get(name);
    write('uses', `${PACKING}_${partId}`, { projectId: PACKING, partId, quantity, packed });
  }
  // An order for something new comes with a part in Main Inventory that has none yet, like in the app.
  for (const [name, partNumber, quantity, supplier, partName, link, notes] of SAMPLE_ORDERS) {
    if (!partName) addParts([[name, partNumber, 0, '', supplier, '', []]], MAIN_PROJECT);
    add('orders', { name, partNumber, quantity, supplier, partId: ids.get(partName || name), ...(link && { link }), ...(notes && { notes }) });
  }
  write('uses', `${ROBOT}_${ids.get('Limit switch')}`, { projectId: ROBOT, partId: ids.get('Limit switch'), quantity: 2 });
  add('log', { at: hoursAgo(2), by: 'maya', byName: 'Maya', action: 'quantity', part: '12V Slim battery', details: 'Quantity +1' });
  add('log', { at: hoursAgo(1), by: 'coach', byName: 'Coach Rivera', action: 'added', part: 'Pinpoint odometry computer', details: '' });
  const oldServo = { projectId: MAIN_PROJECT, name: 'Servo horn (old style)', partNumber: '', quantity: 3, location: 'Bin 1', supplier: 'goBILDA', category: 'Hardware', tags: [], unit: 'pcs', condition: 'used', notes: '' };
  write('trash', 'part_demo-old-servo', { kind: 'part', docId: 'demo-old-servo', name: oldServo.name, data: oldServo, uses: [], deletedBy: 'maya@demo.team', deletedAt: hoursAgo(72) });
}

loadSamples();

// ---------- same functions as firebase.js ----------

export function connect() {}

export function watchUser(callback) {
  callback(USER);
}

// Signing out of the demo goes back to the welcome screen.
export function logOut() {
  location.assign(location.pathname);
}

export async function ensureMembership() {}
export async function ensureMainProject() {}

const watchCollection = (name) => (callback) => watch(name, () => callback(docs(name)));

export const watchParts = watchCollection('parts');
export const watchProjects = watchCollection('projects');
export const watchUses = watchCollection('uses');
export const watchLocations = watchCollection('locations');
export const watchOrders = watchCollection('orders');
export const watchPrinted = watchCollection('printed');
export const watchTrash = watchCollection('trash');

export const watchMembers = (callback) =>
  watch('members', () => callback(docs('members').map(({ id, email, name }) => ({ uid: id, email, name }))));

export const watchLog = (callback) =>
  watch('log', () => callback(docs('log').sort((a, b) => b.at.toMillis() - a.at.toMillis())));


export async function addLocation(name) {
  return add('locations', { name });
}

export async function deleteLocation(id) {
  remove('locations', id);
}

export async function renameLocation(id, name) {
  write('locations', id, { name });
}

export async function markPrinted(keys) {
  for (const key of keys) collections.printed.set(key, { at: Timestamp.now() });
  changed('printed');
}

export const newProjectId = () => `demo-${nextId++}`;

export async function createProject(id, name, source, kind) {
  write('projects', id, { name, source, ...(kind && { kind }) });
}

export async function renameProject(id, name) {
  write('projects', id, { ...collections.projects.get(id), name });
}

export const newPartId = () => `demo-${nextId++}`;

// Writes whole parts ([[id, part]]).
export async function saveParts(changes, user) {
  for (const [id, part] of changes) collections.parts.set(id, { ...part, updatedBy: user.email, updatedAt: Timestamp.now() });
  changed('parts');
}

export async function changeQuantity(id, delta, user) {
  const part = collections.parts.get(id);
  write('parts', id, { ...part, quantity: part.quantity + delta, updatedBy: user.email, updatedAt: Timestamp.now() });
}

export async function setUse(projectId, partId, quantity, packed) {
  const id = `${projectId}_${partId}`;
  if (quantity > 0) write('uses', id, { projectId, partId, quantity, ...(packed !== undefined && { packed }) });
  else remove('uses', id);
}

export async function addOrder(order) {
  return add('orders', order);
}

export async function saveOrder(id, order) {
  write('orders', id, order);
}

export async function receiveOrder(order, newPart, user, count) {
  if (newPart) await saveParts([[newPartId(), newPart]], user);
  else await changeQuantity(order.partId, count, user);
  const { id, ...data } = order;
  if (count < order.quantity) write('orders', id, { ...data, quantity: order.quantity - count });
  else remove('orders', id);
}

const TRASH_COLLECTIONS = { part: 'parts', project: 'projects', order: 'orders' };

export async function moveToTrash({ kind, docId, name, data, uses }, user) {
  write('trash', `${kind}_${docId}`, { kind, docId, name, data, uses, deletedBy: user.email, deletedAt: Timestamp.now() });
  for (const use of uses) collections.uses.delete(`${use.projectId}_${use.partId}`);
  changed('uses');
  remove(TRASH_COLLECTIONS[kind], docId);
}

export async function restoreFromTrash(entry, user) {
  const data = entry.kind === 'part' ? { ...entry.data, updatedBy: user.email, updatedAt: Timestamp.now() } : entry.data;
  write(TRASH_COLLECTIONS[entry.kind], entry.docId, data);
  for (const use of entry.uses) collections.uses.set(`${use.projectId}_${use.partId}`, use);
  changed('uses');
  remove('trash', `${entry.kind}_${entry.docId}`);
}

export async function deleteFromTrash(entry) {
  remove('trash', `${entry.kind}_${entry.docId}`);
}

export async function clearTrash(before) {
  for (const entry of docs('trash')) if (entry.deletedAt.toMillis() < before.getTime()) collections.trash.delete(entry.id);
  changed('trash');
}

export async function setMyName(uid, name) {
  write('members', uid, { ...collections.members.get(uid), name });
}

export async function logChange(member, action, part, details) {
  add('log', { at: Timestamp.now(), by: member.uid, byName: member.name, action, part, details });
}

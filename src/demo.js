// Demo backend: the same functions as firebase.js, backed by sample data in memory.
// Nothing is saved; reloading the page starts the demo over.
import { Timestamp } from 'firebase/firestore';

export const MAIN_PROJECT = 'main';

const USER = { uid: 'demo', email: 'husker@example.com' };
const ROBOT = 'robot';
const PACKING = 'packing';
const SPARES = 'spares';
const PRACTICE = 'practice';

const collections = {
  members: new Map([
    ['demo', { email: USER.email, name: 'Husker' }],
    ['demo-gabby', { email: 'gabby@example.com', name: 'Gabby' }],
    ['demo-grace', { email: 'grace@example.com', name: 'Grace' }],
  ]),
  projects: new Map([
    [MAIN_PROJECT, { name: 'Main Inventory', source: '' }],
    [SPARES, { name: 'Pit spares', source: '' }],
    [ROBOT, { name: 'Competition Robot', source: MAIN_PROJECT }],
    [PRACTICE, { name: 'Practice Robot', source: MAIN_PROJECT }],
    [PACKING, { name: 'Qualifier pit box', source: MAIN_PROJECT, kind: 'packing' }],
  ]),
  parts: new Map(),
  uses: new Map(),
  locations: new Map(),
  orders: new Map(),
  builds: new Map(),
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

const SAMPLE_LOCATIONS = ['Bin 1', 'Bin 2', 'Electronics drawer', 'Hardware drawers', 'Shelf A', 'Shelf B', 'Tool wall', 'Pit cabinet', 'Battery cart', 'Drive team box'];
// The sample drawers and cabinets, and which spot each part in them is in.
const SAMPLE_GRIDS = { 'Hardware drawers': { rows: 5, cols: 20 }, 'Electronics drawer': { rows: 3, cols: 6 }, 'Bin 1': { rows: 2, cols: 4 } };
const SAMPLE_SPOTS = {
  'M4 x 8mm button head screw (25 pack)': 'A3', 'M4 x 12mm button head screw (25 pack)': 'A4', 'M4 x 20mm button head screw (25 pack)': 'A5',
  'Plastic spacer 5mm (12 pack)': 'B3', 'Hyper hub 5mm hex bore': 'B4', 'REX shaft 8mm x 50mm': 'D12', '6mm ID ball bearing (2 pack)': 'C12',
  'Control Hub': 'A1', 'Expansion Hub': 'A2', 'Switch cable and bracket': 'A3', 'Color sensor V3': 'B1', '2m distance sensor': 'B2',
  'Pinpoint odometry computer': 'B3', 'Laser distance sensor': 'B4', 'Encoder cable extension 300mm': 'C1', 'USB camera': 'C2',
  'Speed servo': 'A1', 'Torque servo': 'A2', 'Super speed servo': 'A3', 'Touch sensor': 'B1',
};

// [name, part number, quantity, location, supplier, category, tags, extras: notes, condition (default new), unit (default pcs), minQuantity ("Low stock at")]
const SAMPLE_PARTS = [
  ['Yellow Jacket motor 312 RPM', '5203-2402-0019', 6, 'Shelf A', 'goBILDA', 'Electronics/Motors', ['drivetrain'], { notes: 'Two of these have a worn encoder cable. Test before using.', minQuantity: 4 }],
  ['Yellow Jacket motor 435 RPM', '5203-2402-0014', 4, 'Shelf A', 'goBILDA', 'Electronics/Motors', ['drivetrain']],
  ['Core Hex motor', 'REV-41-1300', 3, 'Shelf A', 'REV Robotics', 'Electronics/Motors', ['intake']],
  ['HD Hex motor 40:1', 'REV-41-1301', 2, 'Shelf A', 'REV Robotics', 'Electronics/Motors', ['lift'], { condition: 'used', notes: 'Spares from last season\'s arm.' }],
  ['Speed servo', '2000-0025-0003', 5, 'Bin 1', 'goBILDA', 'Electronics/Servos', ['intake']],
  ['Torque servo', '2000-0025-0002', 3, 'Bin 1', 'goBILDA', 'Electronics/Servos', ['claw'], { notes: 'Use for the claw. The speed servo is too weak.' }],
  ['Super speed servo', '2000-0025-0001', 2, 'Bin 1', 'goBILDA', 'Electronics/Servos', ['claw'], { condition: 'used' }],
  ['Touch sensor', 'REV-31-1425', 3, 'Bin 1', 'REV Robotics', 'Electronics/Sensors', ['lift']],
  ['Control Hub', 'REV-31-1595', 1, 'Electronics drawer', 'REV Robotics', 'Electronics/Controllers', ['competition'], { notes: 'Firmware 1.8. Update only at the shop, never at a competition.' }],
  ['Expansion Hub', 'REV-31-1153', 1, 'Electronics drawer', 'REV Robotics', 'Electronics/Controllers', []],
  ['Driver Hub', 'REV-31-1596', 2, 'Drive team box', 'REV Robotics', 'Electronics/Controllers', ['competition']],
  ['Gamepad', 'REV-31-2983', 3, 'Drive team box', 'REV Robotics', 'Electronics/Controllers', ['competition'], { condition: 'damaged', notes: 'The one with tape on it has a drifting left stick.' }],
  ['12V Slim battery', 'REV-31-1302', 3, 'Battery cart', 'REV Robotics', 'Electronics/Power', ['competition'], { notes: 'Charge the night before. Number 4 holds charge poorly, use it for practice only.', minQuantity: 4 }],
  ['Battery charger', 'REV-31-1299', 2, 'Battery cart', 'REV Robotics', 'Electronics/Power', []],
  ['Switch cable and bracket', 'REV-31-1387', 2, 'Electronics drawer', 'REV Robotics', 'Electronics/Power', []],
  ['Color sensor V3', 'REV-31-1557', 2, 'Electronics drawer', 'REV Robotics', 'Electronics/Sensors', [], { notes: 'Calibrate under the pit lights, not the shop lights.' }],
  ['2m distance sensor', 'REV-31-1505', 2, 'Electronics drawer', 'REV Robotics', 'Electronics/Sensors', []],
  ['Laser distance sensor', '3124-0001-0001', 1, 'Electronics drawer', 'goBILDA', 'Electronics/Sensors', [], { condition: 'broken', notes: 'Always reads 0 mm. Ask the supplier about a replacement.' }],
  ['Pinpoint odometry computer', '3110-0002-0001', 1, 'Electronics drawer', 'goBILDA', 'Electronics/Sensors', ['odometry']],
  ['Swingarm odometry pod', '3110-0001-0001', 2, 'Bin 2', 'goBILDA', 'Electronics/Sensors', ['odometry']],
  ['USB camera', '3122-0003-0001', 1, 'Electronics drawer', 'goBILDA', 'Electronics/Sensors', ['vision']],
  ['Encoder cable extension 300mm', '3802-0910-0300', 8, 'Electronics drawer', 'goBILDA', 'Electronics/Wires', []],
  ['Braided cable sleeve 3 m', '2925-0008-3000', 1, 'Bin 2', 'goBILDA', 'Electronics/Wires', [], { unit: 'm', notes: 'Cut to length. One roll covers the whole robot.' }],
  ['Mecanum wheel set 104mm', '3213-3606-0001', 2, 'Shelf B', 'goBILDA', 'Hardware/Wheels', ['drivetrain'], { unit: 'set' }],
  ['Compliant wheel 2in (4 pack)', 'REV-21-2029-PK4', 2, 'Shelf B', 'REV Robotics', 'Hardware/Wheels', ['intake'], { unit: 'pack' }],
  ['U-Channel 3 hole 96mm', '1120-0003-0096', 10, 'Shelf B', 'goBILDA', 'Hardware/Structure', [], { minQuantity: 4 }],
  ['Low-Side U-Channel 13 hole', '1121-0013-0336', 4, 'Shelf B', 'goBILDA', 'Hardware/Structure', ['drivetrain']],
  ['Viper-Slide kit 336mm', '2500-0014-0336', 1, 'Shelf B', 'goBILDA', 'Hardware/Linear motion', ['lift'], { notes: 'We need two for the new lift.', minQuantity: 2 }],
  ['M4 x 8mm button head screw (25 pack)', '2802-0004-0008', 12, 'Hardware drawers', 'goBILDA', 'Hardware/Screws', [], { unit: 'pack', minQuantity: 5 }],
  ['M4 x 12mm button head screw (25 pack)', '2802-0004-0012', 3, 'Hardware drawers', 'goBILDA', 'Hardware/Screws', [], { unit: 'pack', minQuantity: 5 }],
  ['M4 x 20mm button head screw (25 pack)', '2802-0004-0020', 6, 'Hardware drawers', 'goBILDA', 'Hardware/Screws', [], { unit: 'pack' }],
  ['Plastic spacer 5mm (12 pack)', '1500-0010-0005', 10, 'Hardware drawers', 'goBILDA', 'Hardware/Spacers', [], { unit: 'pack' }],
  ['Hyper hub 5mm hex bore', '1310-0016-2005', 6, 'Hardware drawers', 'goBILDA', 'Hardware/Collars and hubs', []],
  ['REX shaft 8mm x 50mm', '2102-0008-0050', 6, 'Hardware drawers', 'goBILDA', 'Hardware/Shafts', []],
  ['6mm ID ball bearing (2 pack)', '1600-0416-0006', 16, 'Hardware drawers', 'goBILDA', 'Hardware/Bearings', [], { unit: 'pack' }],
  ['Surgical tubing 3mm', 'REV-41-1163', 3, 'Bin 2', 'REV Robotics', 'Hardware/Intake', ['intake'], { unit: 'm' }],
  ['Hook and loop cinch strap (4 pack)', '2909-0102-0250', 5, 'Tool wall', 'goBILDA', 'Supplies', ['competition'], { unit: 'pack', notes: 'For holding the battery in. Take two to every event.' }],
  ['Zip ties (100 pack)', '2909-0101-0100', 2, 'Tool wall', 'goBILDA', 'Supplies', [], { unit: 'pack', minQuantity: 2 }],
  ['7mm combination wrench', '4202-0070-1070', 3, 'Tool wall', 'goBILDA', 'Tools', []],
  ['Allen wrench pack', 'REV-45-1882', 2, 'Tool wall', 'REV Robotics', 'Tools', [], { notes: 'One lives in the pit box. It keeps going missing.' }],
  ['Intake roller bracket', 'TL-INT-03', 2, 'Bin 2', '', 'Custom/Intake', ['intake'], { made: '3d-print', material: 'PETG', link: 'https://www.printables.com/model/122820-ftc-robotics-flexy-intake-customizable', notes: '40% infill, 4 walls.' }],
  ['Claw finger, left', 'TL-CLW-11', 0, 'Bin 2', '', 'Custom/Claw', ['claw'], { made: '3d-print', material: 'TPU 95A', link: 'https://www.printables.com/model/791717-borikengineers-gripper-for-ftc-centerstage' }],
  ['Claw finger, right', 'TL-CLW-12', 1, 'Bin 2', '', 'Custom/Claw', ['claw'], { made: '3d-print', material: 'TPU 95A', link: 'https://www.printables.com/model/791717-borikengineers-gripper-for-ftc-centerstage' }],
  ['Odometry pod mount', 'TL-ODO-02', 2, 'Bin 2', '', 'Custom/Drivetrain', ['odometry'], { made: '3d-print', material: 'PLA', link: 'https://www.printables.com/model/357452-ftc-trackwheels-odometry-wheels' }],
  ['Drivetrain side plate', 'TL-DT-01', 2, 'Shelf B', '', 'Custom/Drivetrain', ['drivetrain'], { made: 'cnc', material: '6061 aluminum, 1/4 in' }],
  ['Intake guard', 'TL-INT-07', 1, 'Shelf B', '', 'Custom/Intake', ['intake'], { made: 'laser', material: 'Polycarbonate 1/16 in' }],
];

// The product link the part catalog gives each sample part number, like autofill does in the app.
const SAMPLE_LINKS = {
  '5203-2402-0019': 'https://www.gobilda.com/5203-series-yellow-jacket-planetary-gear-motor-19-2-1-ratio-24mm-length-8mm-rex-shaft-312-rpm-3-3-5v-encoder/',
  '5203-2402-0014': 'https://www.gobilda.com/5203-series-yellow-jacket-planetary-gear-motor-13-7-1-ratio-24mm-length-8mm-rex-shaft-435-rpm-3-3-5v-encoder/',
  'REV-41-1300': 'https://www.revrobotics.com/rev-41-1300/',
  'REV-41-1301': 'https://www.revrobotics.com/rev-41-1301/',
  '2000-0025-0003': 'https://www.gobilda.com/2000-series-dual-mode-servo-25-3-speed/',
  '2000-0025-0002': 'https://www.gobilda.com/2000-series-dual-mode-servo-25-2-torque/',
  '2000-0025-0001': 'https://www.gobilda.com/2000-series-dual-mode-servo-25-1/',
  'REV-31-1425': 'https://www.revrobotics.com/rev-31-1425/',
  'REV-31-1595': 'https://www.revrobotics.com/rev-31-1595/',
  'REV-31-1153': 'https://www.revrobotics.com/rev-31-1153/',
  'REV-31-1596': 'https://www.revrobotics.com/rev-31-1596/',
  'REV-31-2983': 'https://www.revrobotics.com/rev-31-2983/',
  'REV-31-1302': 'https://www.revrobotics.com/rev-31-1302/',
  'REV-31-1299': 'https://www.revrobotics.com/12V-Slim-Battery-Accessories/',
  'REV-31-1387': 'https://www.revrobotics.com/rev-31-1387/',
  'REV-31-1557': 'https://www.revrobotics.com/rev-31-1557/',
  'REV-31-1505': 'https://www.revrobotics.com/rev-31-1505/',
  'REV-31-1462': 'https://www.revrobotics.com/rev-31-1462/',
  '3124-0001-0001': 'https://www.gobilda.com/laser-distance-sensor-1m-range-3-3-5v-digital-or-analog-output/',
  '3110-0002-0001': 'https://www.gobilda.com/pinpoint-odometry-computer-imu-sensor-fusion-for-2-wheel-odometry/',
  '3110-0001-0001': 'https://www.gobilda.com/swingarm-odometry-pod-48mm-wheel/',
  '3122-0003-0001': 'https://www.gobilda.com/rolling-shutter-usb-camera-with-gobilda-case-30-fps/',
  '3802-0910-0300': 'https://www.gobilda.com/encoder-cable-extension-4-pos-jst-xh-300mm-length/',
  '3802-1718-0300': 'https://www.gobilda.com/servo-extension-3-pos-tjc8-mh-fc-to-fh-mc-300mm-length/',
  '2925-0008-3000': 'https://www.gobilda.com/braided-cable-sleeve-8mm-diameter-3-meter-length/',
  '3213-3606-0001': 'https://www.gobilda.com/3606-series-mecanum-wheel-set-bearing-supported-rollers-100mm-diameter/',
  'REV-21-2029-PK4': 'https://www.revrobotics.com/ION-Compliant-Wheels/',
  '1120-0003-0096': 'https://www.gobilda.com/1120-series-u-channel-3-hole-96mm-length/',
  '2500-0014-0336': 'https://www.gobilda.com/steel-viper-slide-14-ball-carriage-336mm-length-244mm-travel/',
  '2802-0004-0008': 'https://www.gobilda.com/2802-series-zinc-plated-steel-button-head-screw-m4-x-0-7mm-8mm-length-25-pack/',
  '2802-0004-0012': 'https://www.gobilda.com/2802-series-zinc-plated-steel-button-head-screw-m4-x-0-7mm-12mm-length-25-pack/',
  '2802-0004-0020': 'https://www.gobilda.com/2802-series-zinc-plated-steel-button-head-screw-m4-x-0-7mm-20mm-length-25-pack/',
  '1500-0010-0005': 'https://www.gobilda.com/1500-series-plastic-spacer-5mm-id-x-7mm-od-1mm-thickness-12-pack/',
  '1310-0016-2005': 'https://www.gobilda.com/1310-series-hyper-hub-5mm-hex-bore/',
  '2102-0008-0050': 'https://www.gobilda.com/2102-series-stainless-steel-rex-shaft-8mm-diameter-50mm-length/',
  '1600-0416-0006': 'https://www.gobilda.com/6mm-id-non-flanged-ball-bearing-16mm-od-4mm-thickness-2-pack/',
  'REV-41-1163': 'https://www.revrobotics.com/rev-41-1163/',
  '2909-0102-0250': 'https://www.gobilda.com/gobilda-hook-loop-cinch-strap-20mm-width-x-250mm-length-4-pack/',
  '2909-0101-0100': 'https://www.gobilda.com/zip-tie-100mm-length-black-100-pack/',
  '4202-0070-1070': 'https://www.gobilda.com/7mm-combination-wrench/',
  'REV-45-1882': 'https://www.revrobotics.com/rev-45-1882/',
};

// Same fields, for the second inventory.
const SAMPLE_SPARES = [
  ['Control Hub (spare)', 'REV-31-1595', 1, 'Pit cabinet', 'REV Robotics', 'Electronics/Controllers', ['competition'], { notes: 'Already flashed and configured. Swap it in if the main one dies.' }],
  ['Speed servo (spare)', '2000-0025-0003', 2, 'Pit cabinet', 'goBILDA', 'Electronics/Servos', []],
  ['Battery charger (spare)', 'REV-31-1299', 2, 'Pit cabinet', 'REV Robotics', 'Electronics/Power', []],
  ['Yellow Jacket motor 312 RPM (spare)', '5203-2402-0019', 1, 'Pit cabinet', 'goBILDA', 'Electronics/Motors', ['drivetrain'], { minQuantity: 1 }],
  ['Zip ties (spare)', '2909-0101-0100', 1, 'Pit cabinet', 'goBILDA', 'Supplies', [], { unit: 'pack' }],
];

// [part name, quantity used on the project]
const SAMPLE_USES = [
  ['Yellow Jacket motor 312 RPM', 4], ['Yellow Jacket motor 435 RPM', 2], ['Speed servo', 3], ['Control Hub', 1],
  ['Expansion Hub', 1], ['12V Slim battery', 1], ['Pinpoint odometry computer', 1], ['Swingarm odometry pod', 2],
  ['Mecanum wheel set 104mm', 1], ['Viper-Slide kit 336mm', 1], ['Low-Side U-Channel 13 hole', 2], ['Torque servo', 1],
  ['Touch sensor', 1], ['USB camera', 1], ['Compliant wheel 2in (4 pack)', 1], ['Surgical tubing 3mm', 2],
];
const SAMPLE_PRACTICE_USES = [
  ['Core Hex motor', 2], ['Yellow Jacket motor 435 RPM', 2], ['Speed servo', 2], ['Expansion Hub', 1], ['HD Hex motor 40:1', 1],
];

// [part name, quantity to pack, packed]
const SAMPLE_PACKING = [
  ['12V Slim battery', 2, true], ['Zip ties (100 pack)', 1, true], ['7mm combination wrench', 2, false],
  ['Allen wrench pack', 1, true], ['M4 x 8mm button head screw (25 pack)', 1, false], ['Hook and loop cinch strap (4 pack)', 1, true],
  ['Control Hub (spare)', 1, false], ['Battery charger', 1, true], ['Gamepad', 2, true], ['Driver Hub', 1, false],
];

// [name, part number, quantity, supplier, existing part name or '', notes or '', status or '' (still to order)]
const SAMPLE_ORDERS = [
  ['Yellow Jacket motor 312 RPM', '5203-2402-0019', 2, 'goBILDA', 'Yellow Jacket motor 312 RPM', 'Shipped Tuesday', 'ordered'],
  ['Viper-Slide kit 336mm', '2500-0014-0336', 1, 'goBILDA', 'Viper-Slide kit 336mm', 'Second slide for the new lift', 'ordered'],
  ['Servo extension cable 300mm', '3802-1718-0300', 6, 'goBILDA', '', 'For the intake rebuild'],
  ['Limit switch', 'REV-31-1462', 2, 'REV Robotics', ''],
  ['M4 x 12mm button head screw (25 pack)', '2802-0004-0012', 3, 'goBILDA', 'M4 x 12mm button head screw (25 pack)', 'Down to 3 packs'],
  ['Compliant wheel 2in (4 pack)', 'REV-21-2029-PK4', 2, 'REV Robotics', 'Compliant wheel 2in (4 pack)', '', 'arrived'],
  ['USB camera', '3122-0003-0001', 1, 'goBILDA', 'USB camera', '', 'arrived'],
];

// [part name, quantity, notes or '', status or '' (still to make)]
const SAMPLE_BUILDS = [
  ['Intake roller bracket', 4, 'Two per side', ''],
  ['Claw finger, left', 2, '', ''],
  ['Claw finger, right', 1, 'Spare for the pit box', 'making'],
  ['Odometry pod mount', 2, '', 'made'],
];

// [hours ago, member uid, member name, action, part, details]
const SAMPLE_LOG = [
  [1, 'demo', 'Husker', 'added', 'Pinpoint odometry computer', ''],
  [2, 'demo', 'Husker', 'quantity', '12V Slim battery', 'Quantity -1'],
  [3, 'demo-gabby', 'Gabby', 'made', 'Odometry pod mount', '+2 from the print list'],
  [5, 'demo-gabby', 'Gabby', 'edited', 'Gamepad', 'Condition damaged'],
  [7, 'demo-gabby', 'Gabby', 'used', 'Touch sensor', 'Competition Robot: 1'],
  [26, 'demo-grace', 'Grace', 'arrived', 'USB camera', 'Received 1'],
  [30, 'demo-grace', 'Grace', 'quantity', 'M4 x 12mm button head screw (25 pack)', 'Quantity -4'],
  [48, 'demo', 'Husker', 'edited', 'Laser distance sensor', 'Condition broken'],
  [50, 'demo-gabby', 'Gabby', 'arrived', 'Compliant wheel 2in (4 pack)', 'Received 2'],
  [72, 'demo', 'Husker', 'deleted', 'Servo horn (old style)', ''],
  [96, 'demo-grace', 'Grace', 'added', 'Hyper hub 5mm hex bore', ''],
];

function loadSamples() {
  const hoursAgo = (hours) => Timestamp.fromMillis(Date.now() - hours * 3600 * 1000);
  for (const name of SAMPLE_LOCATIONS) add('locations', { name, ...SAMPLE_GRIDS[name] });
  const ids = new Map();
  const addParts = (rows, projectId) => rows.forEach(([name, partNumber, quantity, location, supplier, category, tags, extras], i) => {
    const part = { name, partNumber, quantity, location, supplier, category, tags, unit: 'pcs', condition: 'new', notes: '', ...extras, ...(SAMPLE_LINKS[partNumber] && { link: SAMPLE_LINKS[partNumber] }), ...(SAMPLE_SPOTS[name] && { spot: SAMPLE_SPOTS[name] }) };
    ids.set(name, add('parts', { ...part, projectId, updatedBy: USER.email, updatedAt: hoursAgo(i + 1) }).id);
  });
  addParts(SAMPLE_PARTS, MAIN_PROJECT);
  addParts(SAMPLE_SPARES, SPARES);
  const addUses = (rows, projectId) => rows.forEach(([name, quantity]) => {
    const partId = ids.get(name);
    write('uses', `${projectId}_${partId}`, { projectId, partId, quantity });
  });
  addUses(SAMPLE_USES, ROBOT);
  addUses(SAMPLE_PRACTICE_USES, PRACTICE);
  for (const [name, quantity, packed] of SAMPLE_PACKING) {
    const partId = ids.get(name);
    write('uses', `${PACKING}_${partId}`, { projectId: PACKING, partId, quantity, packed });
  }
  // An order for something new comes with a part in Main Inventory that has none yet, like in the app.
  for (const [name, partNumber, quantity, supplier, partName, notes, status] of SAMPLE_ORDERS) {
    if (!partName) addParts([[name, partNumber, 0, '', supplier, '', []]], MAIN_PROJECT);
    add('orders', { name, partNumber, quantity, supplier, partId: ids.get(partName || name), ...(SAMPLE_LINKS[partNumber] && { link: SAMPLE_LINKS[partNumber] }), ...(notes && { notes }), ...(status && { status }) });
  }
  for (const [name, quantity, notes, status] of SAMPLE_BUILDS) add('builds', { name, partId: ids.get(name), quantity, ...(notes && { notes }), ...(status && { status }) });
  write('uses', `${ROBOT}_${ids.get('Limit switch')}`, { projectId: ROBOT, partId: ids.get('Limit switch'), quantity: 2 });
  for (const [hours, by, byName, action, part, details] of SAMPLE_LOG) add('log', { at: hoursAgo(hours), by, byName, action, part, details });
  // Labels the team has already printed: the Shelf A bin and a few parts.
  for (const name of ['Control Hub', 'Speed servo', '12V Slim battery']) collections.printed.set(`part-${ids.get(name)}`, { at: hoursAgo(100) });
  collections.printed.set(`bin-${MAIN_PROJECT}-${encodeURIComponent('Shelf A')}`, { at: hoursAgo(100) });
  const oldServo = { projectId: MAIN_PROJECT, name: 'Servo horn (old style)', partNumber: '', quantity: 3, location: 'Bin 1', supplier: 'goBILDA', category: 'Hardware', tags: [], unit: 'pcs', condition: 'used', notes: '' };
  write('trash', 'part_demo-old-servo', { kind: 'part', docId: 'demo-old-servo', name: oldServo.name, data: oldServo, uses: [], deletedBy: USER.email, deletedAt: hoursAgo(72) });
  const oldMotor = { projectId: MAIN_PROJECT, name: 'NeveRest 40 motor', partNumber: '', quantity: 2, location: 'Shelf A', supplier: 'AndyMark', category: 'Electronics/Motors', tags: ['drivetrain'], unit: 'pcs', condition: 'used', notes: 'Retired, replaced by Yellow Jackets.' };
  write('trash', 'part_demo-old-motor', { kind: 'part', docId: 'demo-old-motor', name: oldMotor.name, data: oldMotor, uses: [], deletedBy: 'gabby@example.com', deletedAt: hoursAgo(10) });
  const oldOrder = { name: 'Extra battery', partNumber: 'REV-31-1302', quantity: 1, supplier: 'REV Robotics', partId: ids.get('12V Slim battery') };
  write('trash', 'order_demo-old-order', { kind: 'order', docId: 'demo-old-order', name: oldOrder.name, data: oldOrder, uses: [], deletedBy: 'grace@example.com', deletedAt: hoursAgo(30) });
}

loadSamples();

// ---------- same functions as firebase.js ----------

export function connect() {}

export function watchUser(callback) {
  callback(USER);
}

export async function logOut() {}

export async function clearDeviceData() {}
export async function ensureMembership() {}
export async function ensureMainProject() {}
export const rulesUpToDate = async () => true;
export const rulesOpen = async () => false;

export const getCollection = async (name) => docs(name);

const watchCollection = (name) => (callback) => watch(name, () => callback(docs(name)));

export const watchParts = watchCollection('parts');
export const watchProjects = watchCollection('projects');
export const watchUses = watchCollection('uses');
export const watchLocations = watchCollection('locations');
export const watchOrders = watchCollection('orders');
export const watchBuilds = watchCollection('builds');
export const watchPrinted = watchCollection('printed');
export const watchTrash = watchCollection('trash');

export const watchMembers = (callback) =>
  watch('members', () => callback(docs('members').map(({ id, email, name }) => ({ uid: id, email, name }))));

export const watchLog = (callback) =>
  watch('log', () => callback(docs('log').sort((a, b) => b.at.toMillis() - a.at.toMillis())));


export async function addLocation(name, grid) {
  return add('locations', { name, ...grid });
}

export async function setGrid(id, grid) {
  const { rows, cols, ...location } = collections.locations.get(id);
  write('locations', id, { ...location, ...grid });
}

export async function deleteLocation(id) {
  remove('locations', id);
}

export async function renameLocation(id, name) {
  write('locations', id, { ...collections.locations.get(id), name });
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

// Writes whole new parts ([[id, part]]).
export async function saveParts(changes, user) {
  for (const [id, part] of changes) collections.parts.set(id, { ...part, updatedBy: user.email, updatedAt: Timestamp.now() });
  changed('parts');
}

// Changes some fields of existing parts ([[id, fields]]). A field set to null is taken off the part.
export async function updateParts(changes, user) {
  for (const [id, fields] of changes) {
    const part = { ...collections.parts.get(id), ...fields, updatedBy: user.email, updatedAt: Timestamp.now() };
    for (const key of Object.keys(fields)) if (fields[key] === null) delete part[key];
    collections.parts.set(id, part);
  }
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
  if (count < order.quantity) {
    write('orders', id, { ...data, quantity: order.quantity - count });
    add('orders', { ...data, quantity: count, status: 'arrived' });
  } else write('orders', id, { ...data, status: 'arrived' });
}

export async function deleteOrders(ids) {
  for (const id of ids) remove('orders', id);
}

export const newBuildId = () => `demo-${nextId++}`;

export async function saveBuild(id, build) {
  write('builds', id, build);
}

function moveBuild(build, status, count, newId) {
  const { id, ...data } = build;
  if (count < build.quantity) {
    write('builds', id, { ...data, quantity: build.quantity - count });
    write('builds', newId, { ...data, quantity: count, status });
  } else write('builds', id, { ...data, status });
}

export async function startBuild(build, count, newId) {
  moveBuild(build, 'making', count, newId);
}

export async function makeBuild(build, user, count) {
  await changeQuantity(build.partId, count, user);
  moveBuild(build, 'made', count, newBuildId());
}

export async function deleteBuilds(ids) {
  for (const id of ids) remove('builds', id);
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

export const getTeam = async () => ({ name: 'Demo Team', owner: USER.uid });

export async function setMyName(uid, name) {
  write('members', uid, { ...collections.members.get(uid), name });
}

export async function logChange(member, action, part, details) {
  add('log', { at: Timestamp.now(), by: member.uid, byName: member.name, action, part, details });
}

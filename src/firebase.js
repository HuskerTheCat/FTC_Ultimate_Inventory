import { initializeApp } from 'firebase/app';
import {
  getAuth, connectAuthEmulator, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, signOut,
} from 'firebase/auth';
import {
  initializeFirestore, connectFirestoreEmulator, persistentLocalCache, persistentMultipleTabManager,
  doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, collection, query, where, orderBy, limit, onSnapshot,
  increment, serverTimestamp, writeBatch,
} from 'firebase/firestore';

let auth;
let db;

export function connect(config) {
  const app = initializeApp(config);
  auth = getAuth(app);
  // Local cache keeps the inventory usable offline; edits sync when the device reconnects.
  db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
  // Firebase reserves "demo-" project IDs for the local emulators (npm run emulators).
  if (config.projectId.startsWith('demo-')) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
  }
}

export const watchUser = (callback) => onAuthStateChanged(auth, callback);
export const signIn = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const signUp = (email, password) => createUserWithEmailAndPassword(auth, email, password);
export const resetPassword = (email) => sendPasswordResetEmail(auth, email);
export const logOut = () => signOut(auth);

// Makes sure the signed-in user is on the team. The owner creates the team on first sign-in;
// everyone else joins with the secret from their join code, which the security rules verify.
// Signing in by team number brings no secret, so only existing members get in that way.
// Joining needs the privacy policy accepted, even with an account that already exists.
// Returns true when this call created the team.
export async function ensureMembership(user, connection, name, acceptedPrivacy) {
  const memberRef = doc(db, 'members', user.uid);
  if (await isMember(memberRef)) return false;
  if (!connection.secret) throw new Error(`You're not on ${connection.teamName}. Ask your team admin for the join code.`);
  if (!acceptedPrivacy) throw new Error(`Accept the privacy policy to join ${connection.teamName}.`);
  const created = connection.role === 'owner' && await createTeam(user, connection);
  await setDoc(memberRef, { email: user.email, name, secret: connection.secret, joinedAt: serverTimestamp() });
  return created;
}

async function createTeam(user, connection) {
  try {
    await setDoc(doc(db, 'team', 'info'), { name: connection.teamName, secret: connection.secret, owner: user.uid });
    return true;
  } catch (error) {
    // Already created on an earlier attempt; joining below still checks the secret.
    if (error.code !== 'permission-denied') throw error;
    return false;
  }
}

async function isMember(memberRef) {
  try {
    return (await getDoc(memberRef)).exists();
  } catch (error) {
    if (error.code === 'permission-denied') return false;
    throw error;
  }
}

// Timestamps of edits that haven't reached the server yet are estimated, so sorting by them works offline.
const watchCollection = (name, callback, onError) =>
  onSnapshot(collection(db, name), (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }))), onError);

export const watchParts = (callback, onError) => watchCollection('parts', callback, onError);
export const watchProjects = (callback, onError) => watchCollection('projects', callback, onError);
export const watchUses = (callback, onError) => watchCollection('uses', callback, onError);
export const watchLocations = (callback, onError) => watchCollection('locations', callback, onError);
export const watchOrders = (callback, onError) => watchCollection('orders', callback, onError);

// The team's fixed list of places parts can be. Parts store the location's name, not its id.
export const addLocation = (name) => addDoc(collection(db, 'locations'), { name });
export const deleteLocation = (id) => deleteDoc(doc(db, 'locations', id));

// One doc per printed QR label, named by the label's key, so the app can show which labels still need printing.
export const watchPrinted = (callback, onError) => watchCollection('printed', callback, onError);

export async function markPrinted(keys) {
  for (let i = 0; i < keys.length; i += 500) {
    const batch = writeBatch(db);
    for (const key of keys.slice(i, i + 500)) batch.set(doc(db, 'printed', key), { at: serverTimestamp() });
    await batch.commit();
  }
}

export const MAIN_PROJECT = 'main';

// Every team has a "Main Inventory" project with a fixed id, made by whoever signs in first.
export async function ensureMainProject() {
  const ref = doc(db, 'projects', MAIN_PROJECT);
  if (!(await getDoc(ref)).exists()) await setDoc(ref, { name: 'Main Inventory', source: '' });
}

// Made on the device, so the app can switch to a new project before it reaches the server (or while offline).
export const newProjectId = () => doc(collection(db, 'projects')).id;

// A project either holds its own parts (source '') or uses parts from the inventory project named by source.
// A packing list (kind 'packing') uses parts too, but only holds the ones checked off as packed.
export const createProject = (id, name, source, kind) => setDoc(doc(db, 'projects', id), { name, source, ...(kind && { kind }) });

// Made on the device, so a new part can be undone before it reaches the server.
export const newPartId = () => doc(collection(db, 'parts')).id;

// Writes whole parts ([[id, part]]), so the same call adds, edits and brings back a deleted part under its old id.
export async function saveParts(changes, user) {
  for (let i = 0; i < changes.length; i += 500) {
    const batch = writeBatch(db);
    for (const [id, part] of changes.slice(i, i + 500)) {
      batch.set(doc(db, 'parts', id), { ...part, updatedBy: user.email, updatedAt: serverTimestamp() });
    }
    await batch.commit();
  }
}

export const changeQuantity = (id, delta, user) =>
  updateDoc(doc(db, 'parts', id), { quantity: increment(delta), updatedBy: user.email, updatedAt: serverTimestamp() });

// A use says how many of an inventory part a project is using. One use per project and part.
const useRef = (projectId, partId) => doc(db, 'uses', `${projectId}_${partId}`);

// `packed` is only set for packing list items.
export const setUse = (projectId, partId, quantity, packed) => quantity > 0
  ? setDoc(useRef(projectId, partId), { projectId, partId, quantity, ...(packed !== undefined && { packed }) })
  : deleteDoc(useRef(projectId, partId));

// The order list: parts the team is waiting on. partId is the inventory part it's for, or '' for a new part.
export const addOrder = (order) => addDoc(collection(db, 'orders'), order);

// Moves an arrived order into the inventory: creates newPart, or adds the order's quantity to its part.
export async function receiveOrder(order, newPart, user) {
  const batch = writeBatch(db);
  const changed = { updatedBy: user.email, updatedAt: serverTimestamp() };
  if (newPart) batch.set(doc(collection(db, 'parts')), { ...newPart, ...changed });
  else batch.update(doc(db, 'parts', order.partId), { quantity: increment(order.quantity), ...changed });
  batch.delete(doc(db, 'orders', order.id));
  await batch.commit();
}

// ---------- trash ----------
// Deleting a part, project or order moves it to the trash, with the project uses deleted along with it,
// so it can be brought back. An entry is { kind, docId, name, data, uses }, stored under its kind and doc id.
const TRASH_COLLECTIONS = { part: 'parts', project: 'projects', order: 'orders' };
const trashRef = ({ kind, docId }) => doc(db, 'trash', `${kind}_${docId}`);

export const watchTrash = (callback, onError) => watchCollection('trash', callback, onError);

export async function moveToTrash({ kind, docId, name, data, uses }, user) {
  const batch = writeBatch(db);
  batch.set(trashRef({ kind, docId }), { kind, docId, name, data, uses, deletedBy: user.email, deletedAt: serverTimestamp() });
  for (const use of uses) batch.delete(useRef(use.projectId, use.partId));
  batch.delete(doc(db, TRASH_COLLECTIONS[kind], docId));
  await batch.commit();
}

// Writes the doc and its uses back under their old ids, so QR labels and project uses work again.
export async function restoreFromTrash(entry, user) {
  const batch = writeBatch(db);
  const data = entry.kind === 'part' ? { ...entry.data, updatedBy: user.email, updatedAt: serverTimestamp() } : entry.data;
  batch.set(doc(db, TRASH_COLLECTIONS[entry.kind], entry.docId), data);
  for (const use of entry.uses) batch.set(useRef(use.projectId, use.partId), use);
  batch.delete(trashRef(entry));
  await batch.commit();
}

export const deleteFromTrash = (entry) => deleteDoc(trashRef(entry));

// There is no server to clear old entries, so each device deletes the ones older than `before` when the app opens.
export async function clearTrash(before) {
  const old = (await getDocs(query(collection(db, 'trash'), where('deletedAt', '<', before)))).docs;
  for (let i = 0; i < old.length; i += 500) {
    const batch = writeBatch(db);
    for (const d of old.slice(i, i + 500)) batch.delete(d.ref);
    await batch.commit();
  }
}

export async function getTeam() {
  return (await getDoc(doc(db, 'team', 'info'))).data();
}

// The key that lets the owner take the team off the developer's team list (see hub.js). Only the owner can read it.
export const saveOwnerKey = (ownerKey) => setDoc(doc(db, 'team', 'owner'), { ownerKey });

export async function getOwnerKey() {
  const ownerKey = (await getDoc(doc(db, 'team', 'owner'))).data()?.ownerKey;
  if (!ownerKey) throw new Error('This team isn’t on the central server’s list of active teams.');
  return ownerKey;
}

export const setTeamSecret = (secret) => updateDoc(doc(db, 'team', 'info'), { secret });

// Public, so a short join code can find the team: holds no secret, only what the app needs to start Firebase.
export const setJoinInfo = ({ apiKey, authDomain, appId }, name) => setDoc(doc(db, 'join', 'info'), { apiKey, authDomain, appId, name });

export const watchMembers = (callback, onError) =>
  onSnapshot(collection(db, 'members'), (snap) => callback(snap.docs.map((d) => ({ uid: d.id, email: d.data().email, name: d.data().name }))), onError);

export const setMyName = (uid, name) => updateDoc(doc(db, 'members', uid), { name });

// The change log only grows: the security rules don't let anyone edit or delete entries.
export const logChange = (member, action, part, details) =>
  addDoc(collection(db, 'log'), { at: serverTimestamp(), by: member.uid, byName: member.name, action, part, details });

export const watchLog = (callback, onError) =>
  onSnapshot(query(collection(db, 'log'), orderBy('at', 'desc'), limit(300)),
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }))), onError);

// Replaces the team secret in the same write, so the join code the removed person still has can never get them back in.
export async function removeMember(uid, secret) {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'members', uid));
  batch.update(doc(db, 'team', 'info'), { secret });
  await batch.commit();
}

// Each person's favorite part ids and saved views. Only they can read or write it.
const prefsRef = (uid) => doc(db, 'prefs', uid);

export const watchPrefs = (uid, callback, onError) =>
  onSnapshot(prefsRef(uid), (snap) => callback(snap.data() ?? { favorites: [], views: [] }), onError);

export const savePrefs = (uid, prefs) => setDoc(prefsRef(uid), prefs);

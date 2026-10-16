import { initializeApp } from 'firebase/app';
import { getFirestore, addDoc, doc, getDoc, collection, serverTimestamp, writeBatch } from 'firebase/firestore';

// The app developer's own Firebase project, separate from every team's. It collects each new team's name, program
// and number, the numbers of teams that deleted themselves (with an optional reason), and bug reports. Anyone can add
// to it and nobody can read it from the app, except looking up one team's Firebase project by its number. The developer
// reads it in the Firebase console. Its security rules are in hub.rules.
const HUB_CONFIG = {
  apiKey: 'AIzaSyAbyvOD4lczELqE9A0dZLVAK_4JtSFXMZE',
  authDomain: 'ultimate-inventory-hub.firebaseapp.com',
  projectId: 'ultimate-inventory-hub',
  appId: '1:908383641585:web:d54c6f082d071d3f35ae50',
};

const db = getFirestore(initializeApp(HUB_CONFIG, 'hub'));

export const PROGRAMS = ['FTC', 'FRC', 'FLL', 'Other'];

// FTC and FRC numbers overlap, so other programs' docs are named "frc-254". FTC docs keep the plain number,
// since every team recorded before programs existed is an FTC team.
const teamKey = (program, number) => (program === 'FTC' ? String(number) : `${program.toLowerCase()}-${number}`);

// Only team-level info, never anything about a person (see PRIVACY.md).
// Each team is in one list at a time: teams while the team uses the app, deleted after it deletes itself.
// A move deletes the team from one list and adds it to the other in one write, as the rules require.
// The owner key comes with the team and must be shown to take it off the list, so only the team's owner can.
async function moveTeam(from, to, data, ownerKey) {
  const key = teamKey(data.program, data.number);
  const batch = writeBatch(db);
  batch.delete(doc(db, from, key));
  batch.set(doc(db, to, key), { ...data, ...(to === 'deleted' && { ownerKey }), at: serverTimestamp() });
  if (to === 'teams') batch.set(doc(db, 'owners', key), { ownerKey });
  else batch.delete(doc(db, 'owners', key));
  await batch.commit();
}

// A new team, or a deleted team signing up again under the same number. The rules refuse a team that's active.
export const recordTeam = (name, program, number, projectId, ownerKey) =>
  moveTeam('deleted', 'teams', { name, program, number, projectId }, ownerKey);

// Lets teammates sign in on a new device with their team number instead of a join code.
export async function findTeamProject(program, number) {
  const team = await getDoc(doc(db, 'teams', teamKey(program, number)));
  if (!team.data()?.projectId) throw new Error(`${program} team ${number} can't sign in by number yet. Join with your team's join code instead.`);
  return team.data().projectId;
}

// The reason is optional text the owner typed about why they're leaving.
export const recordDeletedTeam = (program, number, ownerKey, reason) =>
  moveTeam('teams', 'deleted', { program, number, ...(reason && { reason }) }, ownerKey);

// A message from the developer for every user, like a planned outage. The developer writes it in the Firebase console
// as the text field of news/current. Reading it sends nothing about the user.
export async function getNews() {
  const news = await getDoc(doc(db, 'news', 'current'));
  return news.data()?.text?.trim() ?? '';
}

export const sendBugReport = (team, text) =>
  addDoc(collection(db, 'reports'), { team, text, version: __APP_VERSION__, at: serverTimestamp() });

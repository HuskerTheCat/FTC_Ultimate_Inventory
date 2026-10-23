// Team backup files (.inv): everything a team has, as plain JSON. A format marker and version tell the app's backups apart
// from any other file, and from backups made by a newer version of the app that this one can't read.
const FORMAT = 'ftc-ultimate-inventory-backup';
// Add 1 when what a backup holds changes in a way older versions of the app would restore wrong.
const VERSION = 3;

// The team's collections a backup holds. Members, the change log and the trash aren't in it.
export const BACKUP_COLLECTIONS = ['projects', 'parts', 'uses', 'locations', 'orders', 'builds', 'printed'];

// The file's text, from every doc of BACKUP_COLLECTIONS ({ projects: [{ id, ...data }], ... }). Left out: who changed a
// part last and when, a use's id (its project and part make it), a location's id (parts name their location) and when
// a label was printed. A location is its name and, for a grid, its rows and columns.
export function makeBackup(team, docs) {
  return JSON.stringify({
    format: FORMAT,
    version: VERSION,
    team,
    saved: new Date().toISOString(),
    projects: docs.projects,
    parts: docs.parts.map(({ updatedBy, updatedAt, ...part }) => part),
    uses: docs.uses.map(({ id, ...use }) => use),
    locations: docs.locations.map(({ id, ...location }) => location),
    orders: docs.orders,
    builds: docs.builds,
    printed: docs.printed.map((p) => p.id),
  }, null, 2);
}

// The backup in a file's text, or an error saying why the app can't restore it.
export function readBackup(name, text) {
  const notBackup = new Error(`${name} isn’t an inventory backup. Choose a .inv file made with Export backup.`);
  let backup;
  try {
    backup = JSON.parse(text);
  } catch {
    throw notBackup;
  }
  if (backup?.format !== FORMAT) throw notBackup;
  if (backup.version > VERSION) throw new Error(`${name} was made by a newer version of the app. Update the app, then restore it.`);
  // Backups before version 3 have no print list.
  if (backup.version < 3) backup.builds = [];
  if (!BACKUP_COLLECTIONS.every((key) => Array.isArray(backup[key]))) throw notBackup;
  // Version 1 backups list locations by name only.
  if (backup.version === 1) backup.locations = backup.locations.map((name) => ({ name }));
  return backup;
}

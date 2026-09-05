import { db } from './database.js';
import { migrate, resetDatabase } from './migrations.js';

const command = process.argv[2] ?? 'migrate';

if (command === 'reset') {
  const count = resetDatabase();
  console.log(`Database reset complete; applied ${count} migrations.`);
} else if (command === 'migrate') {
  const count = migrate();
  console.log(`Database ready; applied ${count} new migrations.`);
  db.close();
} else {
  console.error(`Unknown database command: ${command}`);
  process.exitCode = 1;
  db.close();
}

import cors from 'cors';
import express from 'express';
import { db } from './db/database.js';
import { migrate } from './db/migrations.js';

type Machine = {
  id: string;
  type: 'washer' | 'dryer';
  status: 'free' | 'in_use';
  in_use_since: string | null;
};

const app = express();
const port = Number(process.env.PORT ?? 3001);

migrate();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.get('/api/machines', (_request, response) => {
  const machines = db
    .prepare<[], Machine>(
      `SELECT id, type, status, in_use_since
       FROM machines
       ORDER BY type DESC, CAST(substr(id, instr(id, '_') + 1) AS INTEGER)`,
    )
    .all();

  response.json({ machines, pollIntervalMs: 7000 });
});

app.listen(port, () => {
  console.log(`Laundry tracker API listening on http://localhost:${port}`);
});

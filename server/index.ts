import { createApp } from './app';

const port = Number(process.env.API_PORT ?? 4000);
const dbPath = process.env.SQLITE_DB_PATH ?? './salary.sqlite';

createApp({ dbPath }).listen(port, () => {
  console.log(`API listening on ${port} using db ${dbPath}`);
});

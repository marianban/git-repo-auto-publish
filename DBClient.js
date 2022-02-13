import path from 'path';
import { JSONFile, Low } from 'lowdb';

// import level from 'level';
// const db = level('publish-db');

const __dirname = path.resolve();
const file = path.join(__dirname, 'publish-db.json');
const adapter = new JSONFile(file);
const db = new Low(adapter);

const getValue = async (key) => {
  try {
    await db.read();
    db.data = db.data || {};
    console.log(JSON.stringify(db.data));
    return db.data[key];
  } catch (err) {
    console.error(err);
    return null;
  }
};

const setValue = async (key, value) => {
  try {
    await db.read();
    db.data = db.data || {};
    db.data[key] = value;
    db.write();
  } catch (err) {
    console.error(err);
    return null;
  }
};

export class DBClient {
  isProcessRunning = async () => {
    // if (!db.isOperational()) {
    //   console.log('db is not operational');
    //   return;
    // }
    const value = await getValue('__process_running');
    const isRunning = !!value;
    console.log(`isRunning: ${isRunning}`);
    return isRunning;
  };
  setProcessAsRunning = async () => {
    console.log('setting process as running');
    await setValue('__process_running', true);
  };
  setProcessAsFinished = async () => {
    console.log('setting process as finished');
    await setValue('__process_running', false);
  };
  getLastBuildDate = async (dir) => {
    const value = await getValue(`__last_build_date__${dir}`);
    console.log(`last build date for ${dir} is ${value}`);
    return value ? new Date(value) : value;
  };
  setLastBuildDate = async (dir, date) => {
    console.log(`setting last build date to ${date} for ${dir}`);
    await setValue(`__last_build_date__${dir}`, new Date(date).toISOString());
  };
}

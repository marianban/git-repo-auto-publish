import level from 'level';

const db = level('publish-db');

const getValue = async (key) => {
  try {
    return await db.get(key);
  } catch (err) {
    // console.error(err);
    return null;
  }
};

export class DBClient {
  isProcessRunning = async () => {
    const value = await getValue('__process_running');
    const isRunning = value === 'true';
    console.log(`isRunning: ${isRunning}`);
    return isRunning;
  };
  setProcessAsRunning = async () => {
    console.log('setting process as running');
    await db.put('__process_running', true);
  };
  setProcessAsFinished = async () => {
    console.log('setting process as finished');
    await db.put('__process_running', false);
  };
  getLastBuildDate = async (dir) => {
    const value = await getValue(`__last_build_date__${dir}`);
    console.log(`last build date for ${dir} is ${value}`);
    return value ? new Date(value) : value;
  };
  setLastBuildDate = async (dir, date) => {
    console.log(`setting last build date to ${date} for ${dir}`);
    await db.put(`__last_build_date__${dir}`, new Date(date).toISOString());
  };
}

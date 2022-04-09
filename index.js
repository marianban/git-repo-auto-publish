import path from 'path';
import dotenv from 'dotenv';
import { DBClient } from './DBClient.js';
import { FileManager } from './FileManager.js';
import { BuildManager } from './BuildManager.js';
import { GitManager } from './GitManager.js';

console.time(`AUTO PUBLISH`);

// locking is done in bash script
// https://unix.stackexchange.com/questions/48505/how-to-make-sure-only-one-instance-of-a-bash-script-runs

try {
  dotenv.config();

  const pathToRepo = process.env.REPO_PATH;

  const db = new DBClient();
  const gitManager = new GitManager(pathToRepo);
  const fileManager = new FileManager();
  const buildManager = new BuildManager();

  await gitManager.useBranch('master');
  const dirs = await fileManager.getDirectories(pathToRepo);

  for (const dir of dirs) {
    try {
      console.log(`------------ ${dir} -------------`);
      await processDirectory(path.join(pathToRepo, dir));
      console.log(`directory ${dir} successfully processed`);
    } catch (err) {
      console.error(
        `processing of directory ${dir} failed with error: \n ${err}`
      );
    }
  }

  async function processDirectory(dir) {
    const lastBuildDate = await db.getLastBuildDate(dir);
    const hasNewCommit = await gitManager.hasNewCommitFrom(dir, lastBuildDate);
    if (hasNewCommit || !lastBuildDate) {
      const success = await buildManager.startBuild(dir);
      if (success) {
        await db.setLastBuildDate(dir, new Date());
      }
    }
  }
} catch (err) {
  console.error(err);

  throw err;
}

console.timeEnd(`AUTO PUBLISH`);

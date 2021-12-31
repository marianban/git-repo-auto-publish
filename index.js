import path from 'path';
import { fileURLToPath } from 'url';
import { DBClient } from './DBClient.js';
import { FileManager } from './FileManager.js';
import { BuildManager } from './BuildManager.js';
import { GitManager } from './GitManager.js';

// import git from 'nodegit';
// import level from 'level';
// import { spawn } from 'child_process';
// import fs from 'fs/promises';

// const db = level('publish-db');

// const getValue = async (key) => {
//   try {
//     return await db.get(key);
//   } catch (err) {
//     // console.error(err);
//     return null;
//   }
// };

// const getLastRun = async (dirName) => {
//   const value = getValue(dirName);
//   return value ? new Date(value) : value;
// };

// const repo = await git.Repository.open(pathToRepo);

// await repo.checkoutBranch('master');

// await repo.fetchAll({
//   callbacks: {
//     credentials: (url, userName) => {
//       return git.Cred.sshKeyFromAgent(userName);
//     },
//   },
// });

// await repo.mergeBranches('master', 'origin/master');

// const walker = repo.createRevWalk();
// const headCommit = await repo.getBranchCommit('master');

// const getDirectories = async (source) =>
//   (await fs.readdir(source, { withFileTypes: true }))
//     .filter((dirent) => dirent.isDirectory())
//     .map((dirent) => dirent.name)
//     .filter((dir) => !dir.startsWith('.'));

// const directories = await getDirectories(pathToRepo);

// for (const dir of directories) {
//   const lastRun = await getLastRun(dir);
//   walker.push(headCommit.sha());
//   walker.sorting(git.Revwalk.SORT.TIME);
//   const history = await walker.fileHistoryWalk(dir, 100);
//   const commits = history.map((c) => c.commit.date());
//   const lastCommit = commits[0];
//   // console.log({ dir, commits });
//   // console.log({ lastCommit, lastRun });
//   if (lastCommit && (!lastRun || lastRun > new Date(lastCommit))) {
//     db.put(dir, lastCommit);
//     console.log('build');
//   }
// }

// const runCliCmd = (cmd, args, cwd) =>
//   new Promise((resolve, reject) => {
//     const proc = spawn(cmd, args, {
//       cwd,
//     });
//     proc.on('close', (code) =>
//       code ? reject(`Process failed with code: ${code}`) : resolve()
//     );
//   });

// const isProcessRunning = await getValue('__process_running');

// if (!isProcessRunning || isProcessRunning === 'false') {
//   await db.put('__process_running', true);
//   try {
//     await runCliCmd('npm', ['install'], path.join(pathToRepo, 'yin-and-yang'));
//     console.log('success');
//   } catch (err) {
//     console.error(err);
//   } finally {
//     await db.put('__process_running', false);
//   }
// }

console.time(`AUTO PUBLISH`);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pathToRepo = path.join(__dirname, '../demos/');

const db = new DBClient();
const gitManager = new GitManager(pathToRepo);
const fileManager = new FileManager();
const buildManager = new BuildManager();

if (!(await db.isProcessRunning())) {
  try {
    await db.setProcessAsRunning();

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
  } finally {
    await db.setProcessAsFinished();
  }
}

console.timeEnd(`AUTO PUBLISH`);

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

// const npmInstall = spawn('npm', ['install'], {
//   cwd: path.join(pathToRepo, 'yin-and-yang'),
// });

// // ls.stdout.on('data', (data) => {
// //   console.log(`stdout: ${data}`);
// // });

// // npmInstall.stderr.on('data', (data) => {
// //   console.error(`stderr: ${data}`);
// // });

// npmInstall.on('close', (code) => {
//   console.log(`child process exited with code ${code}`);
// });

// console.log(commits.map((c) => c.commit.date()));

// how to get commits for folder https://github.com/nodegit/nodegit/issues/1068

// use level db https://www.npmjs.com/package/level

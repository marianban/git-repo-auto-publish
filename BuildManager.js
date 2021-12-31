import { spawn } from 'child_process';
import fs from 'fs/promises';

const runCliCmd = (cmd, args, cwd) =>
  new Promise((resolve) => {
    const proc = spawn(cmd, args, {
      cwd,
      timeout: 120 * 1000,
    });
    proc.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });
    proc.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });
    proc.on('close', (code) => resolve(code));
  });

export class BuildManager {
  startBuild = async (path) => {
    console.log(`starting build for: ${path}`);

    const files = await fs.readdir(path, { withFileTypes: true });
    const hasPackageJson = files.some((f) => f.name === 'package.json');
    if (!hasPackageJson) {
      console.log(`skipping build. package.json is missing in ${path}`);
      return false;
    }

    const installResult = await runCliCmd('npm', ['install'], path);
    if (installResult !== 0) {
      console.error(`npm install failed with code: ${installResult}`);
      return false;
    }

    console.log('npm install successful');

    const buildResult = await runCliCmd('npm', ['run', 'build'], path);
    if (buildResult !== 0) {
      console.error(`build failed with code: ${buildResult}`);
      return false;
    }

    console.log('build successful');

    return true;
  };
}

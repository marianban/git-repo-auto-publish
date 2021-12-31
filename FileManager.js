import fs from 'fs/promises';

export class FileManager {
  getDirectories = async (path) => {
    console.log(`getting directories for: ${path}`);

    return (await fs.readdir(path, { withFileTypes: true }))
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)
      .filter((dir) => !dir.startsWith('.'));
  };
}

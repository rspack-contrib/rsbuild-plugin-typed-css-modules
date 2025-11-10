import fs from 'node:fs';
import { join } from 'node:path';

const portMap = new Map();

export function getRandomPort(
  defaultPort = Math.ceil(Math.random() * 30000) + 15000,
) {
  let port = defaultPort;
  while (true) {
    if (!portMap.get(port)) {
      portMap.set(port, 1);
      return port;
    }
    port++;
  }
}

export const generatorTempDir = async (cwd: string, testDir: string) => {
  fs.rmSync(testDir, { recursive: true, force: true });
  await fs.promises.cp(join(cwd, 'src'), testDir, { recursive: true });

  return () => fs.promises.rm(testDir, { force: true, recursive: true });
};

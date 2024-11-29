import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export function fetchCommandList() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const targetDir = path.join(__dirname, '../commands');
  const commandList = [];

  try {
    const files = fs.readdirSync(targetDir, { withFileTypes: true });

    for (const file of files) {
      if (file.isFile()) {
        const commandName = path.basename(file.name, path.extname(file.name));
        commandList.push(commandName);
      }
    }
  } catch (error) {
    console.error(`Error reading directory "${targetDir}":`, error.message);
  }

  return commandList;
}

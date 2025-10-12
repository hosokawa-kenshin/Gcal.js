import fs from 'fs';

export async function openExternalEditor(screen, tempFilePath, content) {
  fs.writeFileSync(tempFilePath, content, 'utf8');
  const editor = process.env.EDITOR || 'vim';

  const updatedText = await new Promise(resolve => {
    screen.exec(editor, [tempFilePath], {}, (err, code) => {
      if (err) {
        console.error('Error opening editor:', err);
        resolve(null);
        return;
      }

      if (code !== true) {
        console.log(`Editor exited with code: ${code}`);
        resolve(null);
        return;
      }

      const text = fs.readFileSync(tempFilePath, 'utf8');
      resolve(text);
    });
  });

  if (fs.existsSync(tempFilePath)) {
    fs.unlinkSync(tempFilePath);
  }

  return updatedText;
}

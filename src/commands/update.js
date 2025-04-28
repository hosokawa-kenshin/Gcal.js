import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import blessed from 'blessed';

const execPromise = promisify(exec);

/**
 * Restart the current application
 */
function restartApplication(screen) {
  const args = process.argv.slice(1);
  const nodePath = process.execPath;
  const child = spawn(nodePath, args, {
    stdio: 'inherit',
  });
  screen.destroy();
}

/**
 * Check if there are updates available in the repository
 * @param {boolean} isForked - Whether the repository is forked or not
 * @returns {Promise<boolean>} Whether updates are available
 */
export async function hasUpdates(isForked) {
  try {
    if (isForked) {
      await execPromise('git fetch upstream');

      const { stdout: branchOutput } = await execPromise('git branch --show-current');
      const currentBranch = branchOutput.trim();

      const { stdout: diffOutput } = await execPromise(`git diff HEAD upstream/${currentBranch} --name-only`);

      return diffOutput.trim() !== '';
    } else {
      await execPromise('git fetch origin');

      const { stdout: branchOutput } = await execPromise('git branch --show-current');
      const currentBranch = branchOutput.trim();

      const { stdout: diffOutput } = await execPromise(`git diff HEAD origin/${currentBranch} --name-only`);

      return diffOutput.trim() !== '';
    }
  } catch (error) {
    console.error('Error checking for updates:', error.message);
    return false;
  }
}

/**
 * Check if the repository is a forked repository
  * @param {string} originalRepoUrl - Original Repository URL
  * @returns {Promise<boolean>} if the repository is a fork or not.
 */
export async function isForkedRepository(originalRepoUrl = 'github.com/hosokawa-kenshin/Gcal.js') {
  try {
    const { stdout: remotes } = await execPromise('git remote -v');
    const originMatch = remotes.match(/origin\s+(?:https:\/\/|git@)([^\s]+)\.git/);
    if (!originMatch) {
      return false;
    }

    const originUrl = originMatch[1].replace(':', '/');

    return !originUrl.includes(originalRepoUrl);
  } catch (error) {
    return false;
  }
}

/**
 * Update the local repository by pulling the latest changes from the upstream repository.
 * @param {string} originalRepoUrl - Original Repository URL
 */
export async function updateRepository(screen, updateBox, originalRepoUrl = 'github.com/hosokawa-kenshin/Gcal.js') {
  try {
    updateBox.setContent('Checking for updates...\n');
    screen.append(updateBox);
    screen.render();

    const gitDirExists = fs.existsSync(path.join(process.cwd(), '.git'));
    if (!gitDirExists) {
      throw new Error('This directory is not a git repository.');
    }

    const isForked = await isForkedRepository(originalRepoUrl);

    if (isForked) {
      const { stdout: remotes } = await execPromise('git remote -v');
      const hasUpstream = remotes.includes('upstream');

      if (!hasUpstream) {
        updateBox.setContent(updateBox.getContent() + 'Adding upstream remote...\n');
        screen.render();
        const upstreamUrl = `https://${originalRepoUrl}.git`;
        await execPromise(`git remote add upstream ${upstreamUrl}`);
      }
    }

    const updates = await hasUpdates(isForked);

    if (!updates) {
      updateBox.setContent(updateBox.getContent() + 'Your repository is already up-to-date.\n');
      screen.render();
      return;
    }

    updateBox.setContent(updateBox.getContent() + 'Updates available. Updating repository...\n');
    screen.render();

    if (isForked) {
      updateBox.setContent(updateBox.getContent() + 'Forked repository detected. Updating from upstream...\n');
      screen.render();

      const { stdout: branchOutput } = await execPromise('git branch --show-current');
      const currentBranch = branchOutput.trim();

      updateBox.setContent(updateBox.getContent() + `Pulling changes from upstream for branch ${currentBranch}...\n`);
      screen.render();
      await execPromise(`git merge upstream/${currentBranch}`);

      updateBox.setContent(updateBox.getContent() + 'Repository updated successfully!\n');
      screen.render();
    } else {
      updateBox.setContent(updateBox.getContent() + 'Updating from origin...\n');
      screen.render();
      const { stdout } = await execPromise('git pull origin main');
      updateBox.setContent(updateBox.getContent() + 'Repository updated successfully!\nThis session will be closed.\n');
      screen.render();
    }

  } catch (error) {
    updateBox.setContent(updateBox.getContent() + `Error updating repository: ${error.message}\n`);
    screen.render();
    console.error('Detected error:', error.message);
    if (error.stderr) {
      console.error('Git error:', error.stderr);
    }
  }
}

export async function updateCommand(screen) {
  const logTable = screen.children.find(child => child.options.label === 'Gcal.js Log');
  const updateBox = blessed.box({
    top: 'center',
    left: 'center',
    width: '50%',
    height: '30%',
    label: 'Update Repository',
    border: { type: 'line' },
    style: {
      border: { fg: 'cyan' },
      focus: { border: { fg: 'yellow' } },
    },
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {
      ch: ' ',
      track: { bg: 'cyan' },
      style: { bg: 'white' },
    },
  });

  await updateRepository(screen, updateBox);

  setTimeout(() => {
    screen.remove(updateBox);
    screen.render();
    restartApplication(screen);
  }, 3000);
}
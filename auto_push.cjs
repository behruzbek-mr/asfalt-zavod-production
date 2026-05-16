const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

function findGit() {
  const commonPaths = [
    'C:\\Program Files\\Git\\cmd\\git.exe',
    'C:\\Program Files (x86)\\Git\\cmd\\git.exe',
    'git' // Try global git first
  ];
  
  const localAppData = process.env.LOCALAPPDATA;
  if (localAppData) {
    const ghDesktopPath = path.join(localAppData, 'GitHubDesktop');
    if (fs.existsSync(ghDesktopPath)) {
      const dirs = fs.readdirSync(ghDesktopPath);
      for (const dir of dirs) {
        if (dir.startsWith('app-')) {
          const gitPath = path.join(ghDesktopPath, dir, 'resources', 'app', 'git', 'cmd', 'git.exe');
          if (fs.existsSync(gitPath)) {
            commonPaths.push(gitPath);
          }
        }
      }
    }
  }

  for (const gitPath of commonPaths) {
    try {
      execSync(`"${gitPath}" --version`, { stdio: 'ignore' });
      return `"${gitPath}"`;
    } catch (e) {
      // ignore
    }
  }
  return null;
}

const git = findGit();
if (!git) {
  console.error("Git topilmadi!");
  process.exit(1);
}

const targetDir = 'C:\\AsfaltProject';

try {
  console.log(`Git found: ${git}`);
  console.log('Adding files...');
  execSync(`${git} add .`, { cwd: targetDir, stdio: 'inherit' });
  
  console.log('Committing...');
  try {
    execSync(`${git} commit -m "Update layout for mobile view"`, { cwd: targetDir, stdio: 'inherit' });
  } catch (e) {
    console.log('No changes to commit or commit failed. Continuing to push...');
  }
  
  console.log('Pushing...');
  execSync(`${git} push`, { cwd: targetDir, stdio: 'inherit' });
  console.log('Successfully pushed to GitHub!');
} catch (e) {
  console.error('Error during git operations:', e.message);
  process.exit(1);
}

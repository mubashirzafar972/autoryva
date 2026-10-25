// One command to publish your changes:  npm run deploy
// It builds the pages, saves your changes in git and sends them to GitHub (Netlify then updates the site).
const { execSync } = require('child_process');
const msg = (process.argv[2] || 'update site').replace(/"/g, '');
const run = (cmd, optional) => {
  try { console.log('\n> ' + cmd); execSync(cmd, { stdio: 'inherit' }); return true; }
  catch (e) { if (!optional) { console.error('\nStopped because this failed: ' + cmd); process.exit(1); } return false; }
};
run('node generate.js');
run('git add .');
if (!run(`git commit -m "${msg}"`, true)) console.log('(Nothing new to save, pushing anyway)');
run('git push');
console.log('\nDone. Open Netlify > Deploys and wait for "Published" (1-3 minutes), then press Ctrl + F5 on your site.');

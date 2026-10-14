const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const protectedDirectories = ['assets', 'netlify', 'scripts', '.github'];
const rootFile = name => /\.(?:html|js|cjs|mjs|json|toml|ya?ml|lock)$/.test(name) ||
  ['.npmrc', '.nvmrc', '.node-version', '_redirects', '_headers'].includes(name);
const textFile = name => /\.(?:html|js|cjs|mjs|json|toml|ya?ml|lock|css|svg|txt)$/.test(name) ||
  ['.npmrc', '.nvmrc', '.node-version', '_redirects', '_headers'].includes(path.basename(name));

function protectedFiles(root) {
  const files = [];
  function walk(directory) {
    for (const entry of fs.readdirSync(path.join(root, directory), { withFileTypes: true })) {
      const relative = directory ? `${directory}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink()) throw Error(`Review freeze: symlink is not allowed: ${relative}`);
      if (entry.isDirectory()) walk(relative);
      else if (entry.isFile()) files.push(relative);
      else throw Error(`Review freeze: unsupported entry: ${relative}`);
    }
  }
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.name === 'review-freeze.json') continue;
    if (protectedDirectories.includes(entry.name)) {
      if (!entry.isDirectory() || entry.isSymbolicLink()) throw Error(`Review freeze: invalid directory: ${entry.name}`);
      walk(entry.name);
    } else if (rootFile(entry.name)) {
      if (!entry.isFile() || entry.isSymbolicLink()) throw Error(`Review freeze: invalid file: ${entry.name}`);
      files.push(entry.name);
    }
  }
  return files.sort();
}

function digest(root, name) {
  const bytes = fs.readFileSync(path.join(root, name));
  const content = textFile(name) ? bytes.toString('utf8').replace(/\r\n/g, '\n') : bytes;
  return createHash('sha256').update(content).digest('hex');
}

function verifyReviewFreeze(root) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'review-freeze.json'), 'utf8'));
  if (manifest.schema !== 1 || manifest.status !== 'locked' || !manifest.files ||
      !Object.keys(manifest.files).length) throw Error('Review freeze: missing or invalid locked baseline');
  const actual = protectedFiles(root);
  const expected = Object.keys(manifest.files).sort();
  const changed = [...new Set([...actual, ...expected])].filter(name =>
    !actual.includes(name) || !Object.hasOwn(manifest.files, name) || digest(root, name) !== manifest.files[name]);
  if (changed.length) throw Error('Toss review is still locked. Deployment blocked for changed review files:\n' +
    changed.join('\n') + '\nDo not refresh the baseline. Wait for the user to confirm Toss review completion.');
  return actual.length;
}

if (require.main === module) {
  console.log(`Toss review freeze verified (${verifyReviewFreeze(path.resolve(__dirname, '..'))} files).`);
}
module.exports = { protectedFiles, digest, verifyReviewFreeze };

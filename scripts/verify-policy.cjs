const fs = require('node:fs');
const { createHash } = require('node:crypto');
const manifest = require('../assets/policies/manifest.json');
const policy = require('../assets/policy.js');
for (const [kind, entry] of Object.entries(manifest)) {
  // Git checkouts may use CRLF on Windows and LF in Netlify; hash the same canonical text.
  const content = fs.readFileSync(entry.path, 'utf8').replace(/\r\n/g, '\n');
  const digest = createHash('sha256').update(content, 'utf8').digest('hex');
  if (digest !== entry.sha256) throw Error(`${kind}: policy HTML changed without updating its version record`);
}
if (policy.version !== manifest.refund.version || policy.sourceSha256 !== manifest.refund.sha256 ||
    policy.sourcePath !== '/' + manifest.refund.path) throw Error('Checkout policy and published HTML do not match');
console.log('Policy HTML hashes and checkout version verified.');

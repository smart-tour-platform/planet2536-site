const fs = require('node:fs');
const path = require('node:path');
require('./verify-policy.cjs');
// Explicit public entrypoints prevent future internal HTML reports from being published.
const pages = ['index.html', 'sessions.html', 'detail.html', 'checkout.html', 'success.html',
  'fail.html', 'refund.html', 'terms.html', 'host-terms.html', 'privacy.html', '404.html'];
const output = path.resolve('dist');
if (path.dirname(output) !== process.cwd() || path.basename(output) !== 'dist') throw Error('Unexpected output directory');
// Only the verified workspace build output is disposable.
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
for (const file of pages) {
  fs.copyFileSync(file, path.join('dist', file));
}
fs.cpSync('assets', 'dist/assets', { recursive: true });
console.log('Public HTML and assets copied to dist.');

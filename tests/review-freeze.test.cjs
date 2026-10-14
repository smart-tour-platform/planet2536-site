const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { protectedFiles, digest, verifyReviewFreeze } = require('../scripts/verify-review-freeze.cjs');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'planet-review-freeze-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'netlify/functions'), { recursive: true });
  fs.writeFileSync(path.join(root, 'index.html'), 'review\n');
  fs.writeFileSync(path.join(root, 'netlify/functions/payments.mjs'), 'test payments\n');
  const manifest = { schema: 1, status: 'locked', files: Object.fromEntries(protectedFiles(root).map(name => [name, digest(root, name)])) };
  fs.writeFileSync(path.join(root, 'review-freeze.json'), JSON.stringify(manifest));
  return root;
}

test('review baseline matches the deployable repository', () => {
  assert.ok(verifyReviewFreeze(path.resolve(__dirname, '..')) > 0);
});
test('review freeze tolerates checkout line endings and unrelated local notes', t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, 'index.html'), 'review\r\n');
  fs.mkdirSync(path.join(root, 'docs'));
  fs.writeFileSync(path.join(root, 'docs/local.md'), 'private note');
  assert.equal(verifyReviewFreeze(root), 2);
});
for (const change of ['edit', 'delete', 'add-function', 'add-redirect', 'disable']) {
  test(`review freeze blocks ${change}`, t => {
    const root = fixture(t);
    if (change === 'edit') fs.writeFileSync(path.join(root, 'index.html'), 'changed');
    if (change === 'delete') fs.unlinkSync(path.join(root, 'netlify/functions/payments.mjs'));
    if (change === 'add-function') fs.writeFileSync(path.join(root, 'netlify/functions/new.mjs'), 'new route');
    if (change === 'add-redirect') fs.writeFileSync(path.join(root, '_redirects'), '/* /closed.html 200');
    if (change === 'disable') fs.writeFileSync(path.join(root, 'review-freeze.json'), '{"schema":1,"status":"off","files":{}}');
    assert.throws(() => verifyReviewFreeze(root), /review|Review/);
  });
}

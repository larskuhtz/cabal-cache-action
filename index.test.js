const process = require('process');
const cp = require('child_process');
const tmp = require('tmp');
const path = require('path');
const cc = require('./lib/cabalCache.js');

// shows how the runner will run a javascript action with env / stdout protocol
test('test setup', async () => {
  expect.assertions(1);
  const tmpDir = tmp.dirSync({ "prefix": "cabal-cache-action-test", "unsafeCleanup": true});
  process.env['INPUT_BUCKET'] = "TODO";
  process.env['INPUT_REGION'] = "us-east-1";
  process.env['INPUT_AWS_ACCESS_KEY_ID'] = process.env['AWS_ACCESS_KEY_ID'];
  process.env['INPUT_AWS_SECRET_ACCESS_KEY'] = process.env['AWS_SECRET_ACCESS_KEY'];

  process.env['RUNNER_TOOL_CACHE'] = `${tmpDir.name}/cache`;
  process.env['RUNNER_TEMP'] = `${tmpDir.name}/tmp`;

  try {
      await cc.syncFromS3();
  } catch (e) {
      const expected = `Error: The process '${tmpDir.name}/cache/cabal-cache/1.0.1.8/x64/cabal-cache' failed with exit code 1`
      expect(e.toString()).toMatch(expected);
  }
  tmpDir.removeCallback();
});

test('test cleanup', async () => {
  expect.assertions(1);
  const tmpDir = tmp.dirSync({ "prefix": "cabal-cache-action-test", "unsafeCleanup": true});
  process.env['INPUT_BUCKET'] = "TODO";
  process.env['INPUT_REGION'] = "us-east-1";
  process.env['INPUT_AWS_ACCESS_KEY_DI'] = process.env['AWS_ACCESS_KEY_ID'];
  process.env['INPUT_AWS_SECRET_ACCESS_KEY'] = process.env['AWS_SECRET_ACCESS_KEY'];

  process.env['RUNNER_TOOL_CACHE'] = `${tmpDir.name}/cache`;
  process.env['RUNNER_TEMP'] = `${tmpDir.name}/tmp`;

  try {
      await cc.syncToS3();
  } catch (e) {
      const expected = `Error: The process '${tmpDir.name}/cache/cabal-cache/1.0.1.8/x64/cabal-cache' failed with exit code 1`
      expect(e.toString()).toMatch(expected);
  }
  tmpDir.removeCallback();
});


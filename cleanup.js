const core = require("@actions/core");
const cc = require('./lib/cabalCache');

async function cleanup() {
  try {
    await cc.syncToS3();
  } catch (error) {
    core.setFailed(error.message);
  }
}

cleanup()

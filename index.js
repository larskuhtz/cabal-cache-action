const core = require("@actions/core");
const cc = require('./lib/cabalCache');

async function run() {
  try {
    await cc.syncFromS3();
  } catch (error) {
    core.setFailed(error.message);
  }
}

module.export = run;

run()

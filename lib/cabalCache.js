const core = require("@actions/core");
const exec = require("@actions/exec");
const tools = require("@actions/tool-cache");
const path = require('path');

// These are probably poor default values. Instead we should
// probably put the cabal store somewhere in the work directory of the runner

const homedir = require('os').homedir();

const defaultStorePath = process.platform === 'win32'
    ? path.join(homedir, "AppData", "Roaming", "cabal", "store")
    : path.join(homedir, ".cabal", "store")

function getArgs (cmd) {
  var folder = core.getInput('folder')
  if (!folder) { folder = ""; }

  var storepath = core.getInput('store_path')
  if (! storepath) { storepath = defaultStorePath; }

  return {
    bucket: core.getInput('bucket'),
    region: core.getInput('region'),
    folder: folder,
    storepath: storepath,
    cmd: cmd
  }
}

async function installCabalCache() {
  const url = process.platform === 'win32'
    ? "https://github.com/haskell-works/cabal-cache/releases/download/v1.0.6.0/cabal-cache-x86_64-windows.tar.gz"
    : process.platform === 'darwin'
    ? "https://github.com/haskell-works/cabal-cache/releases/download/v1.0.6.0/cabal-cache-x86_64-darwin.tar.gz"
    : process.platform === 'linux'
    ? "https://github.com/haskell-works/cabal-cache/releases/download/v1.0.6.0/cabal-cache-x86_64-linux.tar.gz"
    : undefined;
  if (!url) { throw new Error(`installCabalCache: unsupported platform: ${process.platform}`);}
  const tarPath = await tools.downloadTool(url);
  const tmpPath = await tools.extractTar(tarPath);
  const cachedPath = await tools.cacheDir(tmpPath, 'cabal-cache', '1.0.6.0');
  core.addPath(cachedPath);
  return cachedPath;
}

async function provideCabalCache() {
  const versions = await tools.findAllVersions("cabal-cache");
  var cached;
  if (versions === undefined || versions.length == 0) {
    cached = await installCabalCache();
  } else {
    cached = versions[0];
    core.addPath(cached);
  }
  if (!cached) {
    throw new Error(`failed to provide cabal-cache binary from path: ${cached}`);
  }
  return path.join(cached, "cabal-cache");
}

async function runCabalCache(args) {
  const uri = `s3://${args.bucket}/${args.folder}`
  const cabalCache = await provideCabalCache();
  process.env['AWS_ACCESS_KEY_ID'] = process.env['INPUT_AWS_ACCESS_KEY_ID'];
  process.env['AWS_SECRET_ACCESS_KEY'] = process.env['INPUT_AWS_SECRET_ACCESS_KEY'];
  await exec.exec(`${cabalCache} ${args.cmd} --threads 16 --archive-uri ${uri} --region ${args.region} --store-path ${args.storepath}`);
}

module.exports.syncToS3 = async () => runCabalCache(getArgs('sync-to-archive'));
module.exports.syncFromS3 = async () => runCabalCache(getArgs('sync-from-archive'));


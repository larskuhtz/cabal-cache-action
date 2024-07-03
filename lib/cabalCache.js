const core = require("@actions/core");
const exec = require("@actions/exec");
const tools = require("@actions/tool-cache");
const path = require('path');

// These are probably poor default values. Instead we should
// probably put the cabal store somewhere in the work directory of the runner

const homedir = require('os').homedir();

// FIXME: this is broken for recent GHC and Cabal
const defaultStorePath = process.platform === 'win32'
    ? path.join(homedir, "AppData", "Roaming", "cabal", "store")
    : path.join(homedir, ".cabal", "store")

function getArgs (cmd) {
  var folder = core.getInput('folder')
  if (!folder) { folder = ""; }

  var storepath = core.getInput('store_path')

  // for now let cabal-cache figure it out (even though it is probably wrong).
  // if (! storepath) { storepath = defaultStorePath; }

  return {
    bucket: core.getInput('bucket'),
    region: core.getInput('region'),
    folder: folder,
    storepath: storepath,
    cmd: cmd
  }
}

const version = "1.1.0.1";
const repo = "hackage-package-forks/cabal-cache";

function mkUrl(arch, platform) {
  return `https://github.com/${repo}/releases/download/v${version}/cabal-cache-${arch}-${platform}.tar.gz`
}

async function installCabalCache() {
  const url = process.platform === 'win32'
    ? mkUrl("x86_64", "windows")
    : process.platform === 'darwin'
    ? mkUrl("arm64", "darwin")
    : process.platform === 'linux'
    ? mkUrl("x86_64", "linux")
    : undefined;
  if (!url) { throw new Error(`installCabalCache: unsupported platform: ${process.platform}`);}
  const tarPath = await tools.downloadTool(url);
  const tmpPath = await tools.extractTar(tarPath);
  const cachedPath = await tools.cacheDir(tmpPath, 'cabal-cache', version);
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
  if (args.storepath) {
    await exec.exec(`${cabalCache} ${args.cmd} --threads 16 --archive-uri ${uri} --region ${args.region} --store-path ${args.storepath}`);
  } else {
    await exec.exec(`${cabalCache} ${args.cmd} --threads 16 --archive-uri ${uri} --region ${args.region}`);
  }
}

module.exports.syncToS3 = async () => runCabalCache(getArgs('sync-to-archive'));
module.exports.syncFromS3 = async () => runCabalCache(getArgs('sync-from-archive'));


# Github Action for cabal-cache

An Github action for using [cabal-cache](https://hackage.haskell.org/package/cabal-cache)
within workflow.

When used within a job, the action installs the cabal-cache tool and calls
`sync-from-archive` with the provided parameters. After the job completes the
action always calls `sync-to-archive`.

Supported platforms:

* ubuntu-18.04
* ubuntu-16.04
* macOS-latest
* windows-latest

## Parameters:

```yml
inputs:
  bucket:
    description: Name of the S3 bucket
    required: true
  region:
    description: AWS region of the S3 bucket
    required: true
  folder:
    description: Subfolder in the bucket
    required: false
  store_path:
    description: Path of the local Cabal store
    required: false
  aws_access_key_id:
    description: AWS access key id
    required: true
  aws_secret_access_key:
    description: AWS secret access key
    required: true
```

## Example

```yml
- name: Configure build
  run: |
  cabal v2-build all --dry-run
  cabal v2-freeze
- name: Sync from cabal cache
  uses: larskuhtz/cabal-cache-action@master
  with:
    bucket: "my-cabal-cache-bucket"
    region: "us-east-1"
    folder: "${{ matrix.os }}"
    aws_access_key_id: "${{ secrets.cabal_cache_aws_access_key_id }}"
    aws_secret_access_key: "${{ secrets.cabal_cache_aws_secret_access_key }}"
- name: Build package
  run: cabal v2-build
```

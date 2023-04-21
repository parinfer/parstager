#!/usr/bin/env node

import fs from 'fs'

import path from 'node:path'
import process from 'node:process'
import child_process from 'node:child_process'

import { restoreText } from './main.js'

const sh = cmd => child_process.execSync(cmd, {encoding: 'utf8'})

//------------------------------------------------------------------------------
// Git helpers
//------------------------------------------------------------------------------

const isInGitWorkTree = () => {
  try {
    return sh(`git rev-parse --is-inside-work-tree 2> /dev/null`).trim() == 'true'
  } catch (e) {
    return false
  }
}

const getModifiedRepoFiles = pattern =>
  sh(`git status ${pattern||''} --porcelain`)
    .split('\n')
    .map(line => [line.substring(0,2), line.substring(3)].map(s => s.trim()))
    .filter(e => e[0] == 'M')
    .map(e => e[1])


const gitRepoDir = () => sh(`git rev-parse --show-toplevel`).trim()
const repoToRel = f => path.relative(process.cwd(), path.join(gitRepoDir(), f))

//------------------------------------------------------------------------------
// CLI
//------------------------------------------------------------------------------

// Only processing clojure files for now
const exts = [
  '.clj',   // Clojure
  '.cljc',  // Clojure Common
  '.cljs',  // ClojureScript
  '.cljr',  // Clojure CLR
  '.cljd',  // Clojure Dart
  '.edn',   // Clojure’s extensible data notation
]

function cli(pattern='') {

  if (!isInGitWorkTree()) {
    console.log('Cannot run outside a git repository.')
    process.exit(1)
  }

  const repoFiles = getModifiedRepoFiles(pattern)
    .filter(e => exts.includes(path.extname(e)))

  if (repoFiles.length == 0) {
    console.log('No modified clojure files found.')
    process.exit(1)
  }

  for (const repoFile of repoFiles) {
    const relFile = repoToRel(repoFile)
    process.stdout.write(`${relFile}… `)
    try {
      const oldText = sh(`git show HEAD:${repoFile}`)
      const newText = fs.readFileSync(relFile, 'utf8')
      const {restoreCount, finalText} = restoreText(oldText, newText)
      if (restoreCount == 0) {
        console.assert(finalText === newText)
        process.stdout.write('skipped')
      } else {
        if (finalText === oldText) {
          sh(`git restore ${relFile}`)
          process.stdout.write('restored whole file')
        } else {
          fs.writeFileSync(relFile, finalText)
          process.stdout.write(`restored ${restoreCount} blocks`)
        }
      }
    } catch (e) {
      process.stdout.write('failed\n')
      console.error(e)
    } finally {
      process.stdout.write('\n')
    }
  }
}

cli(...process.argv.slice(2))

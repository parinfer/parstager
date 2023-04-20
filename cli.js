#!/usr/bin/env node

import fs from 'fs'

import { extname } from 'node:path'
import { execSync } from 'node:child_process'

import { restoreText } from './main.js'

const sh = cmd => execSync(cmd, {encoding: 'utf8'})

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

const getModifiedFiles = pattern =>
  sh(`git status ${pattern||''} --porcelain`)
    .split('\n')
    .map(line => [line.substring(0,2), line.substring(3)].map(s => s.trim()))
    .filter(e => e[0] == 'M')
    .map(e => e[1])

const restoreOldFile = filename => sh(`git restore ${filename}`)
const getOldFile = filename => sh(`git show HEAD:${filename}`)

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

  const filenames = getModifiedFiles(pattern)
    .filter(e => exts.includes(extname(e)))

  if (filenames.length == 0) {
    console.log('No modified clojure files found.')
    process.exit(1)
  }

  for (const filename of filenames) {
    process.stdout.write(`${filename}… `)
    try {
      const oldText = getOldFile(filename)
      const newText = fs.readFileSync(filename,'utf8')
      const {restoreCount, finalText} = restoreText(oldText, newText)
      if (restoreCount == 0) {
        console.assert(finalText === newText)
        process.stdout.write('skipped')
      } else {
        if (finalText === oldText) {
          restoreOldFile(filename)
          process.stdout.write('restored whole file')
        } else {
          fs.writeFileSync(filename, finalText)
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

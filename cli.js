#!/usr/bin/env node

import fs from 'fs'

import { extname } from 'node:path'
import { execSync } from 'node:child_process'

import { restoreText } from './main.js'

//------------------------------------------------------------------------------
// Git helpers
//------------------------------------------------------------------------------

function getModifiedFiles(pattern) {
  return execSync(`git status ${pattern||''} --porcelain`, {encoding: 'utf8'})
    .split('\n')
    .map(line => [line.substring(0,2), line.substring(3)].map(s => s.trim()))
    .filter(e => e[0] == 'M')
    .map(e => e[1])
}

function getOldFile(filename) {
  return execSync(`git show HEAD:${filename}`, {encoding: 'utf8'})
}

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

function cli(pattern) {

  const filenames = getModifiedFiles(pattern)
    .filter(e => exts.includes(extname(e)))

  for (const filename of filenames) {
    process.stdout.write(`${filename}… `)
    try {
      const oldText = getOldFile(filename)
      const newText = fs.readFileSync(filename,'utf8')
      const {restoreCount, finalText} = restoreText(oldText, newText)
      if (finalText === newText) {
        process.stdout.write('skipped')
      } else {
        fs.writeFileSync(filename, finalText)
        if (finalText === oldText) process.stdout.write('restored whole file')
        else if (restoreCount > 0) process.stdout.write(`restored ${restoreCount} blocks`)
      }
    } catch (e) {
      process.stdout.write(`failed: ${JSON.stringify(e)}`)
    } finally {
      process.stdout.write('\n')
    }
  }
}


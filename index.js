
import fs from 'fs'

import { extname } from 'node:path'
import { execSync } from 'node:child_process'

import * as parenReader from './read.js'
import parinfer from 'parinfer'

function range(a,b,step=1) {
  if (b == null) [a,b] = [0,a]
  const result = []
  for (let i=a; (a<=b ? i<b : i>b); i+=step) result.push(i)
  return result
}

//------------------------------------------------------------------------------
// Get “Blocks”
//
// Blocks are adjacent line ranges which cover an entire text file.
// Their purpose is to encode the locations of top-level paren forms
// and the other lines which surround them (which we don’t touch).
//
// e.g. [ [0,1], [1,4], [4,10], [10,21], [21,22] ]
//               -----          -------
//                 ^               ^
//                 |               |
//                 -------------------------- Top-level paren forms
//
// Note:
// * blocks at ODD indexes represent lines containing top-level paren forms
// * blocks at EVEN indexes represent lines following outside top-level paren forms (e.g. whitespace, comments)
// * there is always an ODD number of indexes
//------------------------------------------------------------------------------

function getBlocks(text, n) {
  // top-level paren forms
  const blocks = []
  parenReader.readText(text, {
    onTopLevelForm(state, [a,b]) {
      const prev = blocks[blocks.length-1]
      if (prev && a < prev[1]) {
        // Ensure top-level paren forms sharing the same line are merged into the same line range.
        prev[1] = b
      } else {
        blocks.push([a,b])
      }
    }
  })
  // add line ranges between each top-level paren form representing comments or whitespace
  const padded = []
  for (const [i,curr] of blocks.entries()) {
    const prev = blocks[i-1] || [0,0]
    padded.push([prev[1],curr[0]])
    padded.push(curr)
    if (i == blocks.length-1) {
      padded.push([curr[1],n])
    }
  }
  return padded
}

//------------------------------------------------------------------------------
// Create a “Restore” lookup
//
// A map from a (Parinfer-formatted string) -> (the string as it was originally formatted)
//
// “Old text” has the original code formatting that we want to preserve.
// Thus, for each block in the old text, we run Parinfer on it,
// then create a map from the Parinfer result to its originally formatted text.
// That way, we can use this lookup map to restore the formatting of those same blocks when found in the “new text”.
//------------------------------------------------------------------------------

function createRestoreLookup(oldText) {
  const lines = oldText.split('\n')
  const blocks = getBlocks(oldText, lines.length)
  const restore = {}
  for (const [i,[a,b]] of blocks.entries()) {
    if (i % 2 == 1) {
      const _old = lines.slice(a,b).join('\n')
      const _new = parinfer.parenMode(_old).text
      if (_new !== _old) {
        restore[_new] = _old
      }
    }
  }
  return restore
}

//------------------------------------------------------------------------------
// Try to Restore Lines
//
// When Parinfer formats a string with trailing parentheses are their own line,
// it will not remove those lines, and will leave the leading whitespace untouched:
//
// INPUT:  (foo
//         __(bar
//         ____)
//         __)
//
// OUTPUT: (foo
//         __(bar))
//         ____           <------ Extra lines
//         __             <---/
//
// Thus, the “Restore” lookup will expect a string with those extra lines,
// despite the Blocks in the “new text” not including them.
//
// To address this, we concatenate each block’s text with lines from
// the subsequent EVEN block (containing whitespace/comment lines)
// until finding a restorable block.
//------------------------------------------------------------------------------

function tryRestoreLines(blocks, i, newLines, restore) {
  if (i % 2 == 1) {
    const [a] = blocks[i]
    const [c,d] = blocks[i+1]
    // Start by trying to subsume the whole next block,
    // then progressively shrink the range until finding a restorable block.
    for (let b=d; b>=c; b--) {
      const _new = newLines.slice(a,b).join('\n')
      const _old = restore[_new]
      if (_old) {
        // NOTE: Here we mutate the subsequent block’s range to reflect what was subsumed
        blocks[i+1][0] = b
        return _old.split('\n')
      }
    }
  }
  return newLines.slice(...blocks[i])
}

//------------------------------------------------------------------------------
// Restore as much of the original formatting of the text as possible
//------------------------------------------------------------------------------

function restoreText(oldText, newText) {
  const restore = createRestoreLookup(oldText)
  const newLines = newText.split('\n') // lines
  const blocks = getBlocks(newText, newLines.length)
  return range(blocks.length)
    .map(i => tryRestoreLines(blocks, i, newLines, restore))
    .flat()
    .join('\n')
}

//------------------------------------------------------------------------------
// Git helpers
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

function getModifiedFiles(pattern) {
  return execSync('git status ${pattern} --porcelain', {encoding: 'utf8'})
    .split('\n')
    .map(line => [line.substring(0,2), line.substring(3)].map(s => s.trim()))
    .filter(e => e[0] == 'M')
    .map(e => e[1])
    .filter(e => exts.includes(extname(e)))
}

function getOldFile(filename) {
  return execSync(`git show HEAD:${filename}`, {encoding: 'utf8'})
}

//------------------------------------------------------------------------------
// Main
//------------------------------------------------------------------------------

function processFile(filename) {
  const oldText = getOldFile(filename)
  const newText = fs.readFileSync(filename,'utf8')
  const finalText = restoreFile(oldText, newText)
  fs.writeFileSync(filename, finalText)
}

function main(pattern) {
  const filenames = getModifiedFiles(pattern)
  filenames.forEach(processFile)
}


import fs from 'fs'

import { extname } from 'node:path'
import { execSync } from 'node:child_process'

import * as parenReader from './read.js'
import parinfer from 'parinfer'

const exts = ['.clj', '.cljs', '.cljc', '.edn']

function getModifiedFiles(pattern) {
  return execSync('git status ${pattern} --porcelain', {encoding: 'utf8'})
    .split('\n')
    .map(line => [line.substring(0,2), line.substring(3)].map(s => s.trim()))
    .filter(e => e[0] == 'M')
    .map(e => e[1])
    .filter(e => exts.includes(extname(e)))
}

function getOldText(filename) {
  return execSync(`git show HEAD:${filename}`, {encoding: 'utf8'})
}

function padBlocks(blocks,n) {
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

function getBlocks(text, n) {
  const blocks = []
  parenReader.readText(text, {
    onTopLevelForm(state, [a,b]) {
      const prev = blocks[blocks.length-1]
      if (prev && a < prev[1]) {
        prev[1] = b
      } else {
        blocks.push([a,b])
      }
    }
  })
  return padBlock(blocks, n)
}

function createRestoreLookup(lines, blocks) {
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

function getRestoreLookup(filename) {
  const text = getOldText(filename)
  const lines = text.split('\n')
  const blocks = getBlocks(text, lines.length)
  return createRestoreLookup(lines, blocks)
}

function getOldLines(blocks, i, input, restore) {
  if (i % 2 == 1) {
    const [a] = blocks[i]
    const [c,d] = blocks[i+1]
    for (let b=d; b>=c; b--) {
      const _new = input.slice(a,b).join('\n')
      const _old = restore[_new]
      if (_old) {
        blocks[i+1][0] = b
        return _old.split('\n')
      }
    }
  }
  return input.slice(...blocks[i])
}

function getRestoredText(filename, restore) {
  const text = fs.readFileSync(filename,'utf8')
  const input = text.split('\n') // lines
  const blocks = getBlocks(text, input.length)
  let output = [] // lines
  for (let i=0; i<blocks.length; i++) {
    output.push(...getOldLines(blocks, i, input, restore))
  }
  return output.join('\n')
}

function processFile(filename) {
  const restore = getRestoreLookup(filename)
  const newText = getRestoredText(filename, restore)
  fs.writeFileSync(filename, newText)
}

function main(pattern) {
  const filenames = getModifiedFiles(pattern)
  filenames.forEach(processFile)
}

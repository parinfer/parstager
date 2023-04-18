
const fs = require('fs')
const { execSync } = require('node:child_process')

const parenReader = require('./read.js')
const parinfer = require('parinfer')

function getModifiedFiles(pattern) {
  return execSync('git status ${pattern} --porcelain', {encoding: 'utf8'})
    .split('\n')
    .map(line => [line.substring(0,2), line.substring(3)].map(s => s.trim()))
    .filter(e => e[0] == 'M')
    .map(e => e[1])
}

function getBeforeText(filename) {
  return execSync(`git show HEAD:${filename}`, {encoding: 'utf8'})
}

function padBlockRanges(ranges,n) {
  const padded = []
  for (const [i,range] of ranges.entries()) {
    const prev = ranges[i-1] || [0,0]
    padded.push([prev[1],range[0]])
    padded.push(range)
    if (i == ranges.length-1) {
      padded.push([range[1],n])
    }
  }
  return padded
}

function getBlockRanges(text, n) {
  const ranges = []
  parenReader.readText(text, {
    onTopLevelForm(state, range) {
      const prev = ranges[ranges.length-1]
      if (prev && range[0] < prev[1]) {
        prev[1] = range[1]
      } else {
        ranges.push(range)
      }
    }
  })
  return padBlockRanges(ranges, n)
}

function createRestoreLookup(lines, ranges) {
  const restore = {}
  for (const [i,range] of ranges.entries()) {
    if (i % 2 == 1) {
      const original = lines.slice(...range).join('\n')
      const corrected = parinfer.parenMode(original).text
      if (original !== corrected) {
        restore[corrected] = original
      }
    }
  }
  return restore
}

function getRestoreLookup(filename) {
  const text = getBeforeText(filename)
  const lines = text.split('\n')
  const ranges = getBlockRanges(text, lines.length)
  return createRestoreLookup(lines, ranges)
}

function getRestoredText(filename, restore) {
  const text = fs.readFileSync(filename,'utf8')
  const lines = text.split('\n')
  const ranges = getBlockRanges(text, lines.length)

  let result = []
  for (const [i,range] of ranges.entries()) {
    if (i % 2 == 0) {
      result.push(...lines.slice(...range))
    } else {
      // with each subsequent line from the following even block appended to it:
      //   if text is found in restore map:
      //     print restored lookup
      //     print rest of subsequent even block
      //     skip past subsequent block
    }
  }
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


const fs = require('fs')
const { execSync } = require('node:child_process')

function getModifiedFiles() {
  return execSync('git status --porcelain', {encoding: 'utf8'})
    .split('\n')
    .map(line => [line.substring(0,2), line.substring(3)].map(s => s.trim()))
    .filter(e => e[0] == 'M')
    .map(e => e[1])
}

function getBeforeAndAfter(filename) {
  const before = execSync(`git show HEAD:${filename}`, {encoding: 'utf8'})
  const after = fs.readFileSync(filename)
  return [before,after]
}

console.log(getModifiedFiles())

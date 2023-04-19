
import * as parenReader from './read.js'
import parinfer from 'parinfer'

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
  const forms = []
  const {error} = parenReader.readText(text, {
    onTopLevelForm(state, [a,b]) {
      const prev = forms[forms.length-1]
      if (prev && a < prev[1]) {
        // Ensure top-level paren forms sharing the same line are merged into the same line range.
        prev[1] = b
      } else {
        forms.push([a,b])
      }
    }
  })
  if (error) {
    throw error
  }
  // add line ranges between each top-level paren form representing comments or whitespace
  const blocks = []
  for (const [i,curr] of forms.entries()) {
    const prev = forms[i-1] || [0,0]
    blocks.push([prev[1],curr[0]])
    blocks.push(curr)
    if (i == forms.length-1) {
      blocks.push([curr[1],n])
    }
  }
  return blocks
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
// Try to Lookup Restorable Lines
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

function tryLookup(blockA, blockB, newLines, restore) {
  if (i % 2 == 1) {
    // Start by trying to subsume the whole next block,
    // then progressively shrink the range until finding a restorable block.
    //
    // lines:               lookup in this order:
    //
    //                       1   2   3   4
    // a0     |-------|      |-  |-  |-  |-
    //  |     |-------|      |   |   |   |
    //  |     |-------|      |   |   |   |
    // a1=b0  |-------|      |   |   |   |-
    //     |  |-------|      |   |   |-
    //     |  |-------|      |   |-
    //    b1  |-------|      |-
    //
    const [a0,a1] = blockA
    const [b0,b1] = blockB
    for (let i=b1; i>=b0; i--) {
      const _new = newLines.slice(a0,a1).join('\n')
      const _old = restore[_new]
      if (_old) {
        // NOTE: Here we mutate the subsequent block’s range to reflect what was subsumed
        blockB[0] = b
        return _old.split('\n')
      }
    }
  }
}

//------------------------------------------------------------------------------
// Restore as much of the original formatting of the text as possible
//------------------------------------------------------------------------------

function restoreText(oldText, newText) {
  const restore = createRestoreLookup(oldText)
  const newLines = newText.split('\n') // lines
  const blocks = getBlocks(newText, newLines.length)
  let restoreCount = 0
  const finalLines = []
  for (let i=0; i<blocks.length; i++) {
    if (i % 2 == 1) {
      const restored = tryLookup(blocks[i], blocks[i+1], newLines, restore)
      if (restored) {
        finalLines.push(...restored)
        restoreCount++
        continue
      }
    }
    finalLines.push(...newLines.slice(...blocks[i]))
  }
  const finalText = finalLines.join('\n')
  return { restoreCount, finalText }
}

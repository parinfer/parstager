# Parstager


_Minimize whitespace diffs when using [Parinfer]._

Parstager restores the original formatting of functions modified by Parinfer, using git `HEAD`.

```
parstager src               # 1. clean src/ files of some parinfer changes
git add src                 # 2. stage src/
git commit -m 'my changes'  # 3. commit changes
```

## TODO

```
MODIFY read.js to spit out top-level open and paren line number pairs

WE NEED:
- list of line number ranges of top-level parens
- then merge adjacent ranges
WHICH GIVES:
- line-level blocks to check
- even blocks are considered unchecked text lines
- odd blocks are considered checked paren lines

in HEAD:
  for each odd block:
    add to a “restore” map:
      parenMode(block) -> original text

in current file:
  for each block:
    if even, print block
    if odd:
      for each top form:
        with each subsequent line from the following even block appended to it:
          if text is found in restore map:
            print restored lookup
            print rest of subsequent even block
            skip past subsequent block
```

[parinfer]:https://github.com/shaunlebron/parinfer
[parlinter]:https://github.com/shaunlebron/parlinter
[parindent]:https://github.com/shaunlebron/parindent

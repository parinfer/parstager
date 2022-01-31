# Parclean

A simple way to reduce your “diff footprint” when using Parinfer on a team:

```
parclean src                # 1. clean src/ files of some parinfer changes
git add src                 # 2. stage src/
git commit -m 'my changes'  # 3. commit changes
```

**How**: For each top-level Clojure form in a file, we restore its original
source text from git `HEAD` if its structure is unchanged.

**Why**: We want to avoid rampantly autoformatting functions when working on a
team.  Parinfer has to reformat an entire file to allow safe localized edits,
but when sharing these changes we would prefer to “unformat” the functions
whose code we never modified.

## Plan

Try this with `rewrite-clj`:

1. given the input filename, get the original source from git HEAD
1. parse all top-level forms in HEAD
1. parse all top-level forms in current file
1. for each top-level form in current file:
    1. if current form is found in HEAD (ignoring whitespace), replace it with the original HEAD form
1. write the new forms back to file

[parlinter]:https://github.com/shaunlebron/parlinter

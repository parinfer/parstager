# Parstager

Parinfer has to reformat an entire file, even when editing just one function.

Parstager “unformats” the other functions that were only changed by parinfer’s formatter,
to allow a tidier staging of changes on team projects.

```
parstager src               # 1. clean src/ files of some parinfer changes
git add src                 # 2. stage src/
git commit -m 'my changes'  # 3. commit changes
```

## TODO

Try using [parindent]’s reader to parse each top-level form.

1. given the input filename, get the original source from git HEAD
1. parse all top-level forms in HEAD
1. parse all top-level forms in current file
1. for each top-level form in current file:
    1. if current form is found in HEAD (ignoring whitespace), replace it with the original HEAD form
1. write the new forms back to file

[parlinter]:https://github.com/shaunlebron/parlinter
[parindent]:https://github.com/shaunlebron/parindent

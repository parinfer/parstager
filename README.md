# Parstager

_Minimize whitespace diffs when using [Parinfer]._

Parstager restores the original formatting of functions modified by Parinfer, using git `HEAD`.

```
parstager src               # 1. clean src/ files of some parinfer changes
git add src                 # 2. stage src/
git commit -m 'my changes'  # 3. commit changes
```

[parinfer]:https://github.com/shaunlebron/parinfer
[parlinter]:https://github.com/shaunlebron/parlinter
[parindent]:https://github.com/shaunlebron/parindent

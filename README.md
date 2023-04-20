> **NOTE**: experimental

# Parstager

Quickly undo Parinfer formatting on unchanged top-level forms. (using the original formatting found in git `HEAD`)

Helps you minimize diffs when working on teams that don’t use Parinfer or [Parlinter](https://github.com/parinfer/parlinter).

```
npm install -g parstager
```

```
parstager src               # 1. clean src/ files of some parinfer changes
git add src                 # 2. stage src/
git commit -m 'my changes'  # 3. commit changes
```

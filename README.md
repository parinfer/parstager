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

## Example

When working on teams that don’t use Parinfer, diffs can’t be quite large.  Parstager helps me isolate diffs to only the functions which I have changed:

<table>
<thead>
<tr>
<th>Original file</th>
<th>Edited with Parinfer</th>
<th>Cleaned by Parstager</th>
</tr>
</thead>
<tbody valign="top">
<tr>
<td>

```clj
(ns user
  (:require
    [clojure.string :as str]
    ))

(defn add-nums
  ([a b]
     (+ a b))
  ([a b c]
     (+ a b c))
  )

(defn add-strs
  ([a b]
     (str a b))
  ([a b c]
     (str a b c))
  )

(comment
  (add-nums 1 2 3)
  (add-strs "a" "b")
  ; put more examples here
  )
```

</td>
<td>

```clj
(ns user
  (:require
    [clojure.string :as str]))
    

(defn add-nums
  ([a b]
   (+ a b))
  ([a b c]
   (+ a b c)))
  

(defn add-strs
  ([a b]
   (str a b))
  ([a b c]
   (str a b c))
  ([a b c d]
   (str a b c d)))
  

(comment
  (add-nums 1 2 3)
  (add-strs "a" "b"))
  ; put more examples here
  
```

</td>
<td>

```clj
(ns user
  (:require
    [clojure.string :as str]
    ))

(defn add-nums
  ([a b]
     (+ a b))
  ([a b c]
     (+ a b c))
  )

(defn add-strs
  ([a b]
   (str a b))
  ([a b c]
   (str a b c))
  ([a b c d]
   (str a b c d)))
  

(comment
  (add-nums 1 2 3)
  (add-strs "a" "b")
  ; put more examples here
  )
```

</td>

</tr>
<tr>

<td></td>

<td>

```diff
diff --git a/user.clj b/user.clj
index fc23da5..b0cfe0a 100644
--- a/user.clj
+++ b/user.clj
@@ -1,25 +1,27 @@
 (ns user
   (:require
-    [clojure.string :as str]
-    ))
+    [clojure.string :as str]))
+    
 
 (defn add-nums
   ([a b]
-     (+ a b))
+   (+ a b))
   ([a b c]
-     (+ a b c))
-  )
+   (+ a b c)))
+  
 
 (defn add-strs
   ([a b]
-     (str a b))
+   (str a b))
   ([a b c]
-     (str a b c))
-  )
+   (str a b c))
+  ([a b c d]
+   (str a b c d)))
+  
 
 (comment
   (add-nums 1 2 3)
-  (add-strs "a" "b")
+  (add-strs "a" "b"))
   ; put more examples here
-  )
+  
```

</td>

<td>

```diff
diff --git a/user.clj b/user.clj
index fc23da5..793d09f 100644
--- a/user.clj
+++ b/user.clj
@@ -12,10 +12,12 @@
 
 (defn add-strs
   ([a b]
-     (str a b))
+   (str a b))
   ([a b c]
-     (str a b c))
-  )
+   (str a b c))
+  ([a b c d]
+   (str a b c d)))
+  
```

</td>

</tr>
</tbody>
</table>

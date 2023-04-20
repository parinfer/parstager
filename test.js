import { restoreText, createRestoreLookup } from './main.js'

const a =
`
(foo
  )

(bar (baz))

(foo
  (+ 1 2)
  ; hello world
  )
`

console.log(createRestoreLookup(a))

const b =
`
(foo)
  

(comment
  "stuff wasnt here before")

(foo
  (+ 1 2))
  ; hello world
  
`

const { restoreCount, finalText } = restoreText(a,b)

console.log({restoreCount})
console.log(finalText)

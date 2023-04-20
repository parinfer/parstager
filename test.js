import { restoreText } from './main.js'

const { restoreCount, finalText } = restoreText(
`
(foo
  )
`
  ,
`
(foo)
  
`)

console.log({restoreCount})
console.log(finalText)

module.exports = {
  filter,
  union,
}

/** @type { (set: Set, fn: (any) => boolean) => Set } */
function filter(set, fn) {
  const result = new Set()

  for (const el of set) {
    if (fn(el)) result.add(el)
  }

  return result
}

/** @type { (setA: Set, setB: Set) => Set } */
function union(setA, setB) {
  const result = new Set()

  for (const el of setA) result.add(el) 
  for (const el of setB) result.add(el) 

  return result
}
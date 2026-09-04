/**
 * A binary min-heap, written out rather than imported.
 *
 * This is the data structure that makes Dijkstra and A* practical: both need
 * "give me the cheapest node discovered so far" on every iteration. A sorted
 * array would make that O(n) per pop; a heap makes it O(log n), which is the
 * whole difference between a search that finishes and one that crawls.
 */
export class MinHeap<T> {
  private readonly items: T[] = []
  private readonly compare: (a: T, b: T) => number

  /** `compare(a, b) < 0` means `a` comes out first. */
  constructor(compare: (a: T, b: T) => number) {
    this.compare = compare
  }

  get size(): number {
    return this.items.length
  }

  isEmpty(): boolean {
    return this.items.length === 0
  }

  push(item: T): void {
    this.items.push(item)
    this.bubbleUp(this.items.length - 1)
  }

  pop(): T | undefined {
    if (this.items.length === 0) return undefined
    const top = this.items[0]
    const last = this.items.pop() as T
    if (this.items.length > 0) {
      this.items[0] = last
      this.sinkDown(0)
    }
    return top
  }

  peek(): T | undefined {
    return this.items[0]
  }

  private bubbleUp(start: number): void {
    let index = start
    const item = this.items[index]
    while (index > 0) {
      const parent = (index - 1) >> 1
      if (this.compare(item, this.items[parent]) >= 0) break
      this.items[index] = this.items[parent]
      index = parent
    }
    this.items[index] = item
  }

  private sinkDown(start: number): void {
    let index = start
    const length = this.items.length
    const item = this.items[index]

    for (;;) {
      const left = index * 2 + 1
      if (left >= length) break
      const right = left + 1
      // Descend towards whichever child sorts first.
      const child =
        right < length && this.compare(this.items[right], this.items[left]) < 0 ? right : left
      if (this.compare(this.items[child], item) >= 0) break
      this.items[index] = this.items[child]
      index = child
    }

    this.items[index] = item
  }
}

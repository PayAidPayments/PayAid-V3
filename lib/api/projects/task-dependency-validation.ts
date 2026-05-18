/**
 * Validates **`dependsOnTaskId`** edits for **`ProjectTask`** rows (same-project single predecessor).
 */

const MAX_DEPENDENCY_CHAIN = 256

/**
 * **`true`** if following **`startPrerequisite`**’s predecessors eventually reaches **`editingTaskId`**
 * (meaning **`editingTask`** would transitively depend on itself).
 */
export async function taskDependsWouldCloseCycle(
  editingTaskId: string,
  startPrerequisite: string | null | undefined,
  lookupDependsOn: (taskId: string) => Promise<string | null | undefined>
): Promise<boolean> {
  let cur = startPrerequisite || null
  if (!cur) return false
  if (cur === editingTaskId) return true

  const visited = new Set<string>()
  let hops = 0

  while (cur) {
    if (cur === editingTaskId) return true
    if (visited.has(cur)) return false
    visited.add(cur)
    hops += 1
    if (hops > MAX_DEPENDENCY_CHAIN) return false

    const next = await lookupDependsOn(cur)
    cur = next ?? null
  }

  return false
}

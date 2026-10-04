/** Preview stub — no bull / model-training-processor import. */
export function getTrainingQueue() {
  return {
    add: async () => null,
    process: () => undefined,
    close: async () => undefined,
    on() {
      return this
    },
  }
}

export function getDeploymentQueue() {
  return getTrainingQueue()
}

export function setupModelTrainingProcessors() {
  return undefined
}

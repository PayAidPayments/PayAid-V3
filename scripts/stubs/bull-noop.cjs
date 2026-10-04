/**
 * Preview-build stub for `bull`. Turbopack cannot resolve bull's
 * child_process fork of master.js; Git/Vercel 8GB builders also OOM on full webpack.
 * Real Redis workers are not started in this preview path (instrumentation is stubbed).
 */
function createQueue() {
  const queue = {
    add: async () => null,
    on() {
      return queue
    },
    process() {
      return undefined
    },
    close: async () => undefined,
    getJobCounts: async () => ({}),
    getJobs: async () => [],
    obliterate: async () => undefined,
    pause: async () => undefined,
    resume: async () => undefined,
  }
  return queue
}

function Bull() {
  return createQueue()
}

Bull.default = Bull
module.exports = Bull

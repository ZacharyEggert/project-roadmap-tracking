import {Roadmap} from './types.js'

export async function updateTaskInRoadmap(
  roadmap: Roadmap,
  taskId: string,
  updates: Partial<{[K in keyof (typeof roadmap.tasks)[number]]: (typeof roadmap.tasks)[number][K]}>,
): Promise<Roadmap> {
  const taskIndex = roadmap.tasks.findIndex((task) => task.id === taskId)
  if (taskIndex === -1) {
    throw new Error(`Task with ID ${taskId} not found`)
  }

  const updatedTask = {
    ...roadmap.tasks[taskIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  const updatedRoadmap: Roadmap = {
    ...roadmap,
    tasks: [...roadmap.tasks.slice(0, taskIndex), updatedTask, ...roadmap.tasks.slice(taskIndex + 1)],
  }
  return updatedRoadmap
}

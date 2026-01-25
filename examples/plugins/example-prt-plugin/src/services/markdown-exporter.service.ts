import roadmapService from 'project-roadmap-tracking/dist/services/roadmap.service.js'
import taskQueryService, {SortOrder} from 'project-roadmap-tracking/dist/services/task-query.service.js'
import {PRIORITY, Roadmap, STATUS, Task, TASK_TYPE} from 'project-roadmap-tracking/dist/util/types.js'

/**
 * Configuration options for markdown export
 */
export interface MarkdownExportOptions {
  /**
   * Grouping method for tasks in the output
   * @default 'status'
   */
  groupBy?: 'priority' | 'status' | 'type'

  /**
   * Include completed tasks in the output
   * @default true
   */
  includeCompletedTasks?: boolean

  /**
   * Include metadata section (version, dates, creator)
   * @default true
   */
  includeMetadata?: boolean

  /**
   * Include statistics section
   * @default true
   */
  includeStats?: boolean

  /**
   * Field to sort tasks by
   * @default 'priority'
   */
  taskSortBy?: 'createdAt' | 'priority' | 'status' | 'type' | 'updatedAt'
}

/**
 * MarkdownExporterService provides pure transformation of roadmap data to markdown format.
 *
 * This is a pure service - it performs no I/O operations and has no side effects.
 * It takes roadmap data and returns formatted markdown strings.
 *
 * @example
 * ```typescript
 * import markdownExporterService from './services/markdown-exporter.service.js';
 *
 * const markdown = markdownExporterService.export(roadmap, {
 *   groupBy: 'status',
 *   includeMetadata: true,
 *   includeStats: true
 * });
 *
 * console.log(markdown);
 * // # My Project
 * // Project description
 * //
 * // ---
 * //
 * // ## Metadata
 * // ...
 * ```
 */
export class MarkdownExporterService {
  /**
   * Exports a roadmap to markdown format.
   *
   * Generates a complete markdown document with sections for header, metadata,
   * statistics, and grouped/sorted tasks based on the provided options.
   *
   * @param roadmap - The roadmap to export
   * @param options - Configuration options for the export
   * @returns Complete markdown document as a string
   *
   * @example
   * ```typescript
   * const markdown = markdownExporterService.export(roadmap, {
   *   groupBy: 'status',
   *   taskSortBy: 'priority',
   *   includeCompletedTasks: false
   * });
   * ```
   */
  export(roadmap: Roadmap, options: MarkdownExportOptions = {}): string {
    const sections: string[] = []

    // Add header section (title and description)
    sections.push(this.generateHeader(roadmap))

    // Conditionally add metadata section
    if (options.includeMetadata !== false) {
      sections.push(this.generateMetadata(roadmap))
    }

    // Conditionally add statistics section
    if (options.includeStats !== false) {
      sections.push(this.generateStatistics(roadmap))
    }

    // Add task sections
    sections.push(this.generateTaskSections(roadmap, options))

    // Join all sections with horizontal rules
    return sections.join('\n\n---\n\n')
  }

  /**
   * Formats a single task as a markdown list item.
   *
   * @param task - The task to format
   * @returns Markdown formatted task list item
   *
   * @example
   * Output format:
   * ```markdown
   * - [F-001] **Implement authentication** (High Priority) - JWT-based auth system
   * ```
   */
  private formatTask(task: Task): string {
    // Humanize priority
    const priorityMap: Record<string, string> = {
      high: 'High',
      low: 'Low',
      medium: 'Medium',
    }
    const priorityLabel = priorityMap[task.priority] || task.priority

    return `- [${task.id}] **${task.title}** (${priorityLabel} Priority)`
  }

  /**
   * Generates the header section with project title and description.
   *
   * @param roadmap - The roadmap containing metadata
   * @returns Markdown formatted header section
   *
   * @example
   * Output format:
   * ```markdown
   * # Project Name
   * Project description text
   * ```
   */
  private generateHeader(roadmap: Roadmap): string {
    return `# ${roadmap.metadata.name}\n\n${roadmap.metadata.description}`
  }

  /**
   * Generates the metadata section with version, dates, and creator.
   *
   * @param roadmap - The roadmap containing metadata
   * @returns Markdown formatted metadata section
   *
   * @example
   * Output format:
   * ```markdown
   * ## Metadata
   * - **Created By**: John Doe
   * - **Created At**: 2024-01-15
   * - **Version**: 1.0.0
   * ```
   */
  private generateMetadata(roadmap: Roadmap): string {
    const lines = [
      '## Metadata',
      `- **Created By**: ${roadmap.metadata.createdBy}`,
      `- **Created At**: ${roadmap.metadata.createdAt}`,
    ]

    return lines.join('\n')
  }

  /**
   * Generates the statistics section with task counts.
   *
   * Uses roadmapService.getStats() to calculate statistics and formats them
   * as a markdown section with counts by status, type, and priority.
   *
   * @param roadmap - The roadmap to analyze
   * @returns Markdown formatted statistics section
   *
   * @example
   * Output format:
   * ```markdown
   * ## Statistics
   * - **Total Tasks**: 42
   * - **Completed**: 15
   * - **In Progress**: 10
   * - **Not Started**: 17
   * ```
   */
  private generateStatistics(roadmap: Roadmap): string {
    const stats = roadmapService.getStats(roadmap)

    const lines = [
      '## Statistics',
      '',
      '### By Status',
      `- **Completed**: ${stats.byStatus.completed}`,
      `- **In Progress**: ${stats.byStatus['in-progress']}`,
      `- **Not Started**: ${stats.byStatus['not-started']}`,
      '',
      '### By Type',
      `- **Features**: ${stats.byType.feature}`,
      `- **Bugs**: ${stats.byType.bug}`,
      `- **Improvements**: ${stats.byType.improvement}`,
      `- **Planning**: ${stats.byType.planning}`,
      `- **Research**: ${stats.byType.research}`,
      '',
      '### By Priority',
      `- **High**: ${stats.byPriority.high}`,
      `- **Medium**: ${stats.byPriority.medium}`,
      `- **Low**: ${stats.byPriority.low}`,
      '',
      `**Total Tasks**: ${stats.totalTasks}`,
    ]

    return lines.join('\n')
  }

  /**
   * Generates task sections grouped and sorted according to options.
   *
   * Groups tasks by the specified groupBy field (status, type, or priority),
   * sorts them within each group by taskSortBy field, and formats each task
   * using formatTask().
   *
   * @param roadmap - The roadmap containing tasks
   * @param options - Export options for grouping and sorting
   * @returns Markdown formatted task sections
   *
   * @example
   * Output format:
   * ```markdown
   * ## Not Started
   * - [F-001] **Implement authentication** (High Priority)
   * - [B-042] **Fix login bug** (High Priority)
   *
   * ## In Progress
   * - [F-002] **Add dashboard** (Medium Priority)
   * ```
   */
  private generateTaskSections(roadmap: Roadmap, options: MarkdownExportOptions): string {
    // Get configuration with defaults
    const groupBy = options.groupBy || 'status'
    const sortBy = options.taskSortBy || 'priority'
    const includeCompleted = options.includeCompletedTasks !== false

    // Filter tasks
    let {tasks} = roadmap
    if (!includeCompleted) {
      // eslint-disable-next-line unicorn/no-array-callback-reference, unicorn/no-array-method-this-argument
      tasks = taskQueryService.filter(tasks, {status: [STATUS.NotStarted, STATUS.InProgress]})
    }

    // Group tasks by the specified field
    const groups = this.groupTasks(tasks, groupBy)

    // Generate sections for each group
    const sections: string[] = []
    for (const [groupName, groupTasks] of Object.entries(groups)) {
      if (groupTasks.length === 0) continue

      // Sort tasks within the group
      const sortedTasks = taskQueryService.sort(groupTasks, sortBy, SortOrder.Descending)

      // Format section
      const taskLines = sortedTasks.map((task) => this.formatTask(task))
      sections.push(`## ${groupName}\n\n${taskLines.join('\n')}`)
    }

    return sections.join('\n\n')
  }

  /**
   * Groups tasks by the specified field.
   *
   * @param tasks - The tasks to group
   * @param groupBy - Field to group by (status, type, or priority)
   * @returns Object mapping group names to task arrays
   */
  private groupTasks(tasks: Array<Task>, groupBy: 'priority' | 'status' | 'type'): Record<string, Array<Task>> {
    const groups: Record<string, Array<Task>> = {}

    switch (groupBy) {
    case 'priority': {
      // eslint-disable-next-line unicorn/no-array-callback-reference, unicorn/no-array-method-this-argument
      groups['High Priority'] = taskQueryService.filter(tasks, {priority: PRIORITY.High})
      // eslint-disable-next-line unicorn/no-array-callback-reference, unicorn/no-array-method-this-argument
      groups['Medium Priority'] = taskQueryService.filter(tasks, {priority: PRIORITY.Medium})
      // eslint-disable-next-line unicorn/no-array-callback-reference, unicorn/no-array-method-this-argument
      groups['Low Priority'] = taskQueryService.filter(tasks, {priority: PRIORITY.Low})

    break;
    }

    case 'status': {
      groups['Not Started'] = taskQueryService.getByStatus(tasks, STATUS.NotStarted)
      groups['In Progress'] = taskQueryService.getByStatus(tasks, STATUS.InProgress)
      groups.Completed = taskQueryService.getByStatus(tasks, STATUS.Completed)
    
    break;
    }

    case 'type': {
      groups.Features = taskQueryService.getByType(tasks, TASK_TYPE.Feature)
      groups.Bugs = taskQueryService.getByType(tasks, TASK_TYPE.Bug)
      groups.Improvements = taskQueryService.getByType(tasks, TASK_TYPE.Improvement)
      groups.Planning = taskQueryService.getByType(tasks, TASK_TYPE.Planning)
      groups.Research = taskQueryService.getByType(tasks, TASK_TYPE.Research)
    
    break;
    }
    // No default
    }

    return groups
  }
}

/**
 * Default export instance of MarkdownExporterService for convenience.
 * Can be imported and used directly without instantiation.
 *
 * @example
 * ```typescript
 * import markdownExporterService from './services/markdown-exporter.service.js';
 * const markdown = markdownExporterService.export(roadmap);
 * ```
 */
export default new MarkdownExporterService()

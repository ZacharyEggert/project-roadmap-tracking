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
   * Use minimal output format (compact single-line tasks, no stats/metadata)
   * @default false
   */
  minimal?: boolean

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
    const isMinimal = options.minimal || false

    // Add header section (title and description) - always included
    sections.push(this.generateHeader(roadmap))

    // Conditionally add metadata section
    // In minimal mode, default to false unless explicitly set to true
    const includeMetadata = isMinimal
      ? (options.includeMetadata === true)
      : (options.includeMetadata !== false)

    if (includeMetadata) {
      sections.push(this.generateMetadata(roadmap))
    }

    // Conditionally add statistics section
    // In minimal mode, default to false unless explicitly set to true
    const includeStats = isMinimal
      ? (options.includeStats === true)
      : (options.includeStats !== false)

    if (includeStats) {
      sections.push(this.generateStatistics(roadmap))
    }

    // Add task sections (will use minimal formatting if options.minimal is true)
    sections.push(this.generateTaskSections(roadmap, options))

    // Join all sections with horizontal rules
    return sections.join('\n\n---\n\n')
  }

  /**
   * Formats a date string to readable format.
   *
   * @param dateString - ISO date string
   * @returns Formatted date (YYYY-MM-DD)
   */
  private formatDate(dateString: null | string | undefined): string {
    if (!dateString) return 'N/A'

    try {
      const date = new Date(dateString)
      return date.toISOString().split('T')[0]
    } catch {
      return dateString
    }
  }

  /**
   * Formats task status as human-readable text with symbol.
   *
   * @param status - The task status to format
   * @returns Status symbol (✓, ~, ○)
   */
  private formatStatusSymbol(status: STATUS): string {
    const statusMap: Record<STATUS, string> = {
      [STATUS.Completed]: '✓',
      [STATUS.InProgress]: '~',
      [STATUS.NotStarted]: '○',
    }

    return statusMap[status] || '○'
  }

  /**
   * Formats task status as human-readable text.
   *
   * @param status - The task status to format
   * @returns Status text (Completed, In Progress, Not Started)
   */
  private formatStatusText(status: STATUS): string {
    return status
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  /**
   * Formats a single task as a detailed markdown block.
   *
   * @param task - The task to format
   * @param minimal - Use minimal single-line format
   * @returns Markdown formatted task block
   */
  private formatTask(task: Task, minimal = false): string {
    // Minimal mode: single-line format (original simple format)
    if (minimal) {
      return this.formatTaskMinimal(task)
    }

    // Detailed mode: full task information
    const lines: string[] = []

    // Task heading and metadata lines
    lines.push(`### [${task.id}] ${task.title}`, '', ...this.formatTaskMetadata(task), '')

    // Details section
    if (task.details) {
      lines.push('**Details:**', task.details, '')
    }

    // Dependencies section and optional fields
    lines.push(...this.formatTaskDependencies(task), ...this.formatTaskOptionalFields(task))

    // Notes section (if present)
    if (task.notes) {
      lines.push('', '**Notes:**', task.notes)
    }

    return lines.join('\n')
  }

  /**
   * Formats task dependencies (depends-on and blocks).
   *
   * @param task - The task to format
   * @returns Array of dependency line strings
   */
  private formatTaskDependencies(task: Task): string[] {
    const lines: string[] = []

    if (task['depends-on'] && task['depends-on'].length > 0) {
      lines.push(`**Depends On:** ${task['depends-on'].join(', ')}`)
    }

    if (task.blocks && task.blocks.length > 0) {
      lines.push(`**Blocks:** ${task.blocks.join(', ')}`)
    }

    // Add spacing after dependencies if they exist
    if (lines.length > 0) {
      lines.push('')
    }

    return lines
  }

  /**
   * Formats task metadata lines (type, status, tests, priority, dates).
   *
   * @param task - The task to format
   * @returns Array of metadata line strings
   */
  private formatTaskMetadata(task: Task): string[] {
    const typeLabel = this.formatTaskType(task.type)
    const statusSymbol = this.formatStatusSymbol(task.status)
    const statusText = this.formatStatusText(task.status)
    const testSymbol = this.formatTestStatus(task['passes-tests'])
    const priorityMap: Record<string, string> = {
      high: 'High',
      low: 'Low',
      medium: 'Medium',
    }
    const priorityLabel = priorityMap[task.priority] || task.priority
    const createdDate = this.formatDate(task.createdAt)
    const updatedDate = this.formatDate(task.updatedAt)

    return [
      `**Type:** ${typeLabel} | **Status:** ${statusSymbol} ${statusText} | **Tests:** ${testSymbol}`,
      `**Priority:** ${priorityLabel} | **Created:** ${createdDate} | **Updated:** ${updatedDate}`,
    ]
  }

  /**
   * Formats a task in minimal single-line format.
   *
   * @param task - The task to format
   * @returns Single-line markdown format
   */
  private formatTaskMinimal(task: Task): string {
    const priorityMap: Record<string, string> = {
      high: 'High',
      low: 'Low',
      medium: 'Medium',
    }
    const priorityLabel = priorityMap[task.priority] || task.priority
    return `- [${task.id}] **${task.title}** (${priorityLabel} Priority)`
  }

  /**
   * Formats optional task fields (tags, assignedTo, dueDate, effort, github-refs).
   *
   * @param task - The task to format
   * @returns Array of optional field line strings
   */
  private formatTaskOptionalFields(task: Task): string[] {
    const lines: string[] = []

    if (task.tags && task.tags.length > 0) {
      lines.push(`**Tags:** ${task.tags.join(', ')}`)
    }

    if (task.assignedTo) {
      lines.push(`**Assigned To:** ${task.assignedTo}`)
    }

    if (task.dueDate) {
      lines.push(`**Due Date:** ${this.formatDate(task.dueDate)}`)
    }

    if (task.effort !== null && task.effort !== undefined) {
      lines.push(`**Effort:** ${task.effort}`)
    }

    if (task['github-refs'] && task['github-refs'].length > 0) {
      lines.push(`**GitHub Refs:** ${task['github-refs'].join(', ')}`)
    }

    return lines
  }

  /**
   * Formats task type as human-readable text.
   *
   * @param type - The task type to format
   * @returns Capitalized type name
   */
  private formatTaskType(type: TASK_TYPE): string {
    const typeMap: Record<TASK_TYPE, string> = {
      [TASK_TYPE.Bug]: 'Bug',
      [TASK_TYPE.Feature]: 'Feature',
      [TASK_TYPE.Improvement]: 'Improvement',
      [TASK_TYPE.Planning]: 'Planning',
      [TASK_TYPE.Research]: 'Research',
    }

    return typeMap[type] || type
  }

  /**
   * Formats test status as symbol.
   *
   * @param passesTests - Whether task passes tests
   * @returns Test symbol (✓ or ✗)
   */
  private formatTestStatus(passesTests: boolean): string {
    return passesTests ? '✓' : '✗'
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
    const minimal = options.minimal || false

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

      // Format section with minimal flag
      const taskLines = sortedTasks.map((task) => this.formatTask(task, minimal))
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

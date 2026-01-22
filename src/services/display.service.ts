import {PRIORITY, STATUS, Task} from '../util/types.js'
import {RoadmapStats} from './roadmap.service.js'
import {DependencyValidationError} from './task-dependency.service.js'

/**
 * DisplayService provides centralized formatting for all display output.
 * This service handles task display, error formatting, and statistics presentation.
 * All methods are pure functions that return strings or arrays of strings.
 */
export class DisplayService {
  /**
   * Formats a priority as text (e.g., "High").
   * Capitalizes the first letter.
   *
   * @param priority - The priority to format
   * @returns The priority as formatted text
   *
   * @example
   * ```typescript
   * displayService.formatPriorityLabel(PRIORITY.High) // Returns 'High'
   * displayService.formatPriorityLabel(PRIORITY.Medium) // Returns 'Medium'
   * ```
   */
  formatPriorityLabel(priority: PRIORITY): string {
    switch (priority) {
      case PRIORITY.High: {
        return 'High'
      }

      case PRIORITY.Low: {
        return 'Low'
      }

      case PRIORITY.Medium: {
        return 'Medium'
      }
    }
  }

  /**
   * Formats a priority as a symbol (H, M, L).
   *
   * @param priority - The priority to format
   * @returns A single character symbol representing the priority
   *
   * @example
   * ```typescript
   * displayService.formatPrioritySymbol(PRIORITY.High) // Returns 'H'
   * displayService.formatPrioritySymbol(PRIORITY.Medium) // Returns 'M'
   * displayService.formatPrioritySymbol(PRIORITY.Low) // Returns 'L'
   * ```
   */
  formatPrioritySymbol(priority: PRIORITY): string {
    switch (priority) {
      case PRIORITY.High: {
        return 'H'
      }

      case PRIORITY.Low: {
        return 'L'
      }

      case PRIORITY.Medium: {
        return 'M'
      }
    }
  }

  /**
   * Formats roadmap statistics for display.
   * Returns an array of lines to be output.
   *
   * @param stats - The roadmap statistics to format
   * @returns Array of formatted statistics lines
   *
   * @example
   * ```typescript
   * const stats = roadmapService.getStats(roadmap);
   * const lines = displayService.formatRoadmapStats(stats);
   * for (const line of lines) {
   *   console.log(line);
   * }
   * ```
   */
  formatRoadmapStats(stats: RoadmapStats): string[] {
    const lines: string[] = []

    lines.push(
      'Roadmap Statistics:',
      '',
      `Total Tasks: ${stats.totalTasks}`,
      '',
      'By Status:',
      `  Completed: ${stats.byStatus[STATUS.Completed]}`,
      `  In Progress: ${stats.byStatus[STATUS.InProgress]}`,
      `  Not Started: ${stats.byStatus[STATUS.NotStarted]}`,
      '',
      'By Type:',
      `  Features: ${stats.byType.feature}`,
      `  Bugs: ${stats.byType.bug}`,
      `  Improvements: ${stats.byType.improvement}`,
      `  Planning: ${stats.byType.planning}`,
      `  Research: ${stats.byType.research}`,
      '',
      'By Priority:',
      `  High: ${stats.byPriority[PRIORITY.High]}`,
      `  Medium: ${stats.byPriority[PRIORITY.Medium]}`,
      `  Low: ${stats.byPriority[PRIORITY.Low]}`,
    )

    return lines
  }

  /**
   * Formats a status as a symbol (✓, ~, ○).
   *
   * @param status - The status to format
   * @returns A single character symbol representing the status
   *
   * @example
   * ```typescript
   * displayService.formatStatusSymbol(STATUS.Completed) // Returns '✓'
   * displayService.formatStatusSymbol(STATUS.InProgress) // Returns '~'
   * displayService.formatStatusSymbol(STATUS.NotStarted) // Returns '○'
   * ```
   */
  formatStatusSymbol(status: STATUS): string {
    switch (status) {
      case STATUS.Completed: {
        return '✓'
      }

      case STATUS.InProgress: {
        return '~'
      }

      case STATUS.NotStarted: {
        return '○'
      }
    }
  }

  /**
   * Formats a status as text (e.g., "In Progress").
   * Converts kebab-case to Title Case.
   *
   * @param status - The status to format
   * @returns The status as formatted text
   *
   * @example
   * ```typescript
   * displayService.formatStatusText(STATUS.InProgress) // Returns 'In Progress'
   * displayService.formatStatusText(STATUS.NotStarted) // Returns 'Not Started'
   * ```
   */
  formatStatusText(status: STATUS): string {
    return status
      .replaceAll('-', ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  /**
   * Formats complete task details for show command.
   * Returns an array of lines to be output.
   *
   * @param task - The task to format
   * @returns Array of formatted lines
   *
   * @example
   * ```typescript
   * const lines = displayService.formatTaskDetails(task);
   * for (const line of lines) {
   *   console.log(line);
   * }
   * ```
   */
  formatTaskDetails(task: Task): string[] {
    const lines: string[] = []

    const statusSymbol = this.formatStatusSymbol(task.status)
    const statusText = this.formatStatusText(task.status)
    const priorityLabel = this.formatPriorityLabel(task.priority)
    const testSymbol = this.formatTestStatus(task['passes-tests'])

    // Header with blank line before
    lines.push(
      '',
      `Task: ${task.id}`,
      '',
      `Title: ${task.title}`,
      `Type: ${task.type}`,
      `Priority: ${priorityLabel}`,
      `Status: ${statusSymbol} ${statusText} | ${testSymbol} Tests Passing`,
      `\nDetails:\n${task.details}`,
    )

    // Dependencies
    if (task['depends-on'].length > 0) {
      lines.push(`\nDepends On: ${task['depends-on'].join(', ')}`)
    } else {
      lines.push(`\nDepends On: None`)
    }

    // Blocks (optional - only if present and has items)
    if (task.blocks && task.blocks.length > 0) {
      lines.push(`Blocks: ${task.blocks.join(', ')}`)
    }

    // Timestamps
    lines.push(`\nCreated: ${task.createdAt}`, `Updated: ${task.updatedAt}`)

    // Optional fields - only display if present
    if (task.tags && task.tags.length > 0) {
      lines.push(`\nTags: ${task.tags.join(', ')}`)
    }

    if (task.effort !== undefined) {
      lines.push(`Effort: ${task.effort}`)
    }

    if (task['github-refs'] && task['github-refs'].length > 0) {
      lines.push(`GitHub Refs: ${task['github-refs'].join(', ')}`)
    }

    if (task.notes) {
      lines.push(`\nNotes:\n${task.notes}`)
    }

    // Blank line at end
    lines.push('')

    return lines
  }

  /**
   * Formats a list of tasks for display.
   * Returns an array of lines including a header and all task summaries.
   *
   * @param tasks - The tasks to format
   * @param options - Optional formatting options (reserved for future use)
   * @param options.format - Output format: 'default' (current), 'compact', or 'json' (reserved)
   * @returns Array of formatted lines ready for output
   *
   * @example
   * ```typescript
   * const lines = displayService.formatTaskList(tasks);
   * for (const line of lines) {
   *   console.log(line);
   * }
   * ```
   */
  formatTaskList(tasks: Task[], options?: {format?: 'compact' | 'default' | 'json'}): string[] {
    const lines: string[] = []
    const format = options?.format ?? 'default'

    // For now, only default format is implemented
    // Future: support compact and json formats
    if (format === 'default') {
      // Add header
      lines.push('', `Tasks (${tasks.length} total):`, '')

      // Add each task summary
      for (const task of tasks) {
        const taskLines = this.formatTaskSummary(task)
        for (const line of taskLines) {
          lines.push(line)
        }
      }
    }

    return lines
  }

  /**
   * Formats a task summary for list display.
   * Returns an array of lines to be output.
   *
   * Format:
   * ✓ [H] [F-001] Task title
   *    Type: feature | Tests: ✓ | Deps: 2
   *    Depends on: F-002, F-003
   * (blank line)
   *
   * @param task - The task to format
   * @returns Array of formatted lines
   *
   * @example
   * ```typescript
   * const lines = displayService.formatTaskSummary(task);
   * for (const line of lines) {
   *   console.log(line);
   * }
   * ```
   */
  formatTaskSummary(task: Task): string[] {
    const lines: string[] = []

    const status = this.formatStatusSymbol(task.status)
    const priority = this.formatPrioritySymbol(task.priority)
    const tests = this.formatTestStatus(task['passes-tests'])

    // First line: status [priority] [id] title
    lines.push(
      `${status} [${priority}] [${task.id}] ${task.title}`,
      `   Type: ${task.type} | Tests: ${tests} | Deps: ${task['depends-on'].length}`,
    )

    // Third line (conditional): Depends on list
    if (task['depends-on'].length > 0) {
      lines.push(`   Depends on: ${task['depends-on'].join(', ')}`)
    }

    // Blank line at end
    lines.push('')

    return lines
  }

  /**
   * Formats test status as a symbol (✓ or ✗).
   *
   * @param passing - Whether the tests are passing
   * @returns A checkmark if passing, X if not
   *
   * @example
   * ```typescript
   * displayService.formatTestStatus(true) // Returns '✓'
   * displayService.formatTestStatus(false) // Returns '✗'
   * ```
   */
  formatTestStatus(passing: boolean): string {
    return passing ? '✓' : '✗'
  }

  /**
   * Formats validation errors for display.
   * Returns an array of lines to be output.
   *
   * @param errors - The dependency validation errors to format
   * @returns Array of formatted error lines
   *
   * @example
   * ```typescript
   * const errorLines = displayService.formatValidationErrors(errors);
   * for (const line of errorLines) {
   *   console.log(line);
   * }
   * ```
   */
  formatValidationErrors(errors: DependencyValidationError[]): string[] {
    const lines: string[] = []

    const errorCount = errors.length
    const errorWord = errorCount === 1 ? 'error' : 'errors'
    lines.push(`\nFound ${errorCount} dependency ${errorWord}:\n`)

    for (const error of errors) {
      switch (error.type) {
        case 'circular': {
          // Display circular dependency with cycle path
          lines.push(`❌ CIRCULAR DEPENDENCY DETECTED`, `   ${error.message}`)
          if (error.relatedTaskIds && error.relatedTaskIds.length > 0) {
            lines.push(`   Cycle path: ${error.relatedTaskIds.join(' -> ')}`)
          }

          lines.push('')
          break
        }

        case 'invalid-reference': {
          lines.push(`⚠️  ${error.message}`)
          break
        }

        case 'missing-task': {
          lines.push(`❌ ${error.message}`)
          break
        }
      }
    }

    return lines
  }
}

/**
 * Default export instance of DisplayService for convenience.
 * Can be imported and used directly without instantiation.
 *
 * @example
 * ```typescript
 * import displayService from './services/display.service.js';
 * const lines = displayService.formatTaskSummary(task);
 * ```
 */
export default new DisplayService()

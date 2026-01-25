import {Roadmap, Task} from 'project-roadmap-tracking/dist/util/types.js'

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
   * @param _task - The task to format
   * @returns Markdown formatted task list item
   *
   * @example
   * Output format:
   * ```markdown
   * - [F-001] **Implement authentication** (High Priority) - JWT-based auth system
   * ```
   *
   * @private
   * TODO: Implementation in P-081
   */
  private formatTask(_task: Task): string {
    // TODO: Implementation in P-081
    return ''
  }

  /**
   * Generates the header section with project title and description.
   *
   * @param _roadmap - The roadmap containing metadata
   * @returns Markdown formatted header section
   *
   * @example
   * Output format:
   * ```markdown
   * # Project Name
   * Project description text
   * ```
   *
   * @private
   * TODO: Implementation in P-078
   */
  private generateHeader(_roadmap: Roadmap): string {
    // TODO: Implementation in P-078
    return ''
  }

  /**
   * Generates the metadata section with version, dates, and creator.
   *
   * @param _roadmap - The roadmap containing metadata
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
   *
   * @private
   * TODO: Implementation in P-078
   */
  private generateMetadata(_roadmap: Roadmap): string {
    // TODO: Implementation in P-078
    return ''
  }

  /**
   * Generates the statistics section with task counts.
   *
   * Uses roadmapService.getStats() to calculate statistics and formats them
   * as a markdown section with counts by status, type, and priority.
   *
   * @param _roadmap - The roadmap to analyze
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
   *
   * @private
   * TODO: Implementation in P-079
   */
  private generateStatistics(_roadmap: Roadmap): string {
    // TODO: Implementation in P-079
    return ''
  }

  /**
   * Generates task sections grouped and sorted according to options.
   *
   * Groups tasks by the specified groupBy field (status, type, or priority),
   * sorts them within each group by taskSortBy field, and formats each task
   * using formatTask().
   *
   * @param _roadmap - The roadmap containing tasks
   * @param _options - Export options for grouping and sorting
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
   *
   * @private
   * TODO: Implementation in P-080
   */
  private generateTaskSections(_roadmap: Roadmap, _options: MarkdownExportOptions): string {
    // TODO: Implementation in P-080
    return ''
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

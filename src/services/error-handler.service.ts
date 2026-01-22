import {getErrorCode, isPrtError, PrtErrorCode} from '../errors/index.js'

/**
 * Exit codes used by the CLI application.
 * These follow common UNIX conventions:
 * - 0: Success
 * - 1: General error
 * - 2: Validation error
 * - 3: Not found error
 * - 4: Dependency error
 */
export const ExitCodes = {
  DEPENDENCY_ERROR: 4,
  GENERAL_ERROR: 1,
  NOT_FOUND: 3,
  SUCCESS: 0,
  VALIDATION_ERROR: 2,
} as const

export type ExitCode = (typeof ExitCodes)[keyof typeof ExitCodes]

/**
 * ErrorHandlerService provides centralized error handling for CLI commands.
 * This service handles error formatting, exit code mapping, and verbose output.
 */
export class ErrorHandlerService {
  /**
   * Formats an error message for CLI display.
   * When verbose=true, includes stack traces and context information.
   *
   * @param error - The error to format
   * @param verbose - Whether to include verbose information (stack traces, context)
   * @returns Formatted error message string
   *
   * @example
   * ```typescript
   * // Basic error message
   * const message = errorHandlerService.formatErrorMessage(error, false)
   * console.error(message)
   *
   * // Verbose error message with stack trace
   * const verboseMessage = errorHandlerService.formatErrorMessage(error, true)
   * console.error(verboseMessage)
   * ```
   */
  formatErrorMessage(error: unknown, verbose = false): string {
    const parts: string[] = []

    // Basic error message
    if (isPrtError(error)) {
      parts.push(`Error: ${error.message}`, `Code: ${error.code}`)

      // Add context if in verbose mode
      if (verbose && error.context && Object.keys(error.context).length > 0) {
        parts.push('\nContext:', JSON.stringify(error.context, null, 2))
      }
    } else if (error instanceof Error) {
      parts.push(`Error: ${error.message}`)
    } else {
      parts.push(`Error: ${String(error)}`)
    }

    // Add stack trace in verbose mode
    if (verbose && error instanceof Error && error.stack) {
      parts.push('\nStack trace:', error.stack)
    }

    return parts.join('\n')
  }

  /**
   * Maps a PrtErrorCode to the appropriate CLI exit code.
   *
   * @param code - The PrtErrorCode to map
   * @returns The corresponding exit code
   *
   * @example
   * ```typescript
   * const exitCode = errorHandlerService.getExitCodeForErrorCode(PrtErrorCode.PRT_FILE_CONFIG_NOT_FOUND)
   * // Returns ExitCodes.NOT_FOUND (3)
   * ```
   */
  getExitCodeForErrorCode(code: PrtErrorCode): ExitCode {
    switch (code) {
      case PrtErrorCode.PRT_FILE_CONFIG_NOT_FOUND:
      case PrtErrorCode.PRT_FILE_ROADMAP_NOT_FOUND:
      case PrtErrorCode.PRT_TASK_NOT_FOUND: {
        return ExitCodes.NOT_FOUND
      }

      case PrtErrorCode.PRT_TASK_ID_INVALID:
      case PrtErrorCode.PRT_TASK_INVALID:
      case PrtErrorCode.PRT_VALIDATION_FAILED: {
        return ExitCodes.VALIDATION_ERROR
      }

      case PrtErrorCode.PRT_VALIDATION_CIRCULAR_DEPENDENCY: {
        return ExitCodes.DEPENDENCY_ERROR
      }

      default: {
        return ExitCodes.GENERAL_ERROR
      }
    }
  }

  /**
   * Handles an error and returns the appropriate exit code.
   * This is the main entry point for command error handling.
   *
   * @param error - The error to handle
   * @returns The exit code to use when exiting the process
   *
   * @example
   * ```typescript
   * try {
   *   // Command logic
   * } catch (error) {
   *   const exitCode = errorHandlerService.handleError(error)
   *   this.error(errorHandlerService.formatErrorMessage(error), {exit: exitCode})
   * }
   * ```
   */
  handleError(error: unknown): ExitCode {
    const errorCode = getErrorCode(error)

    if (errorCode !== null) {
      return this.getExitCodeForErrorCode(errorCode)
    }

    // Default to general error for non-PRT errors
    return ExitCodes.GENERAL_ERROR
  }

  /**
   * Determines if an error is recoverable.
   * Recoverable errors allow the command to continue or retry,
   * while non-recoverable errors should terminate the command.
   *
   * Currently, most PRT errors are non-recoverable as they indicate
   * fundamental issues with the roadmap data or configuration.
   *
   * @param error - The error to check
   * @returns True if the error is recoverable, false otherwise
   *
   * @example
   * ```typescript
   * if (errorHandlerService.isRecoverableError(error)) {
   *   console.log('Attempting retry...')
   * } else {
   *   process.exit(1)
   * }
   * ```
   */
  isRecoverableError(error: unknown): boolean {
    // For now, we don't have any recoverable errors
    // This could be extended in the future for retry logic
    // or graceful degradation scenarios
    if (isPrtError(error)) {
      // All PRT errors are currently non-recoverable
      return false
    }

    // Generic errors are also non-recoverable
    return false
  }
}

/**
 * Default export instance of ErrorHandlerService for convenience.
 * Can be imported and used directly without instantiation.
 *
 * @example
 * ```typescript
 * import errorHandlerService from './services/error-handler.service.js'
 *
 * try {
 *   // Command logic
 * } catch (error) {
 *   const exitCode = errorHandlerService.handleError(error)
 *   this.error(errorHandlerService.formatErrorMessage(error, flags.verbose), {exit: exitCode})
 * }
 * ```
 */
export default new ErrorHandlerService()

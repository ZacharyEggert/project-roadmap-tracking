import { PrtError, PrtErrorCode } from './base.error.js'

/**
 * Error thrown when a roadmap file cannot be found
 */
export class RoadmapNotFoundError extends PrtError {
  constructor(filePath: string, cause?: Error) {
    super(
      `Roadmap file not found: ${filePath}`,
      PrtErrorCode.PRT_FILE_ROADMAP_NOT_FOUND,
      {
        filePath,
        ...(cause && { cause: cause.message }),
      },
    )
  }
}

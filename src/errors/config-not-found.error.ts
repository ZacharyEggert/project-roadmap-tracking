import {PrtError, PrtErrorCode} from './base.error.js'

/**
 * Error thrown when a config file (.prtrc.json) cannot be found
 */
export class ConfigNotFoundError extends PrtError {
  constructor(filePath: string = '.prtrc.json', cause?: Error) {
    super(`Config file not found: ${filePath}`, PrtErrorCode.PRT_FILE_CONFIG_NOT_FOUND, {
      filePath,
      ...(cause && {cause: cause.message}),
    })
  }
}

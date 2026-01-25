import {includeIgnoreFile} from '@eslint/compat'
import oclif from 'eslint-config-oclif'
import prettier from 'eslint-config-prettier'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const gitignorePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.gitignore')

// ignore code quality rules in test files
// to allow for more flexible testing patterns
export default [includeIgnoreFile(gitignorePath), ...oclif, prettier, {
	files: ['test/**/*.ts'],
	rules: {
		"@typescript-eslint/no-explicit-any": "off",
		'@typescript-eslint/no-unused-vars': 'off',
		'max-lines': 'off',
		'max-nested-callbacks': 'off',
		'unicorn/no-array-callback-reference': 'off',
		'unicorn/no-array-method-this-argument': 'off',
	},
}]

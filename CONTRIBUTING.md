# Contributing to project-roadmap-tracking

Thank you for your interest in contributing! Here are some guidelines to help you get started.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/project-roadmap-tracking.git`
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feature/your-feature-name`

## Development

- **Build**: `npm run build` - Compiles TypeScript to JavaScript
- **Test**: `npm test` - Runs the test suite
- **Lint**: `npm run lint` - Runs ESLint
- **Development Watch**: You can use `npm run build` repeatedly during development

## Testing

- Write tests for new features in the `test/` directory
- Tests should follow the existing test patterns using Mocha and Chai
- Run `npm test` to verify all tests pass before submitting a PR

## Code Style

- Use 2-space indentation
- Follow the existing code style
- Run `npm run lint` to check for linting issues
- The project uses Prettier for code formatting

## Submitting Changes

1. Make sure your code builds: `npm run build`
2. Make sure tests pass: `npm test`
3. Make sure linting passes: `npm run lint`
4. Commit your changes with clear, descriptive messages
5. Push to your fork and submit a pull request

## Commit Messages

- Use clear, descriptive commit messages
- Start with a verb (add, fix, improve, update, etc.)
- Example: `fix: handle missing task IDs in complete command`

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

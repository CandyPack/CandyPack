const Cli = require('../cli/src/Cli.js')

describe('CLI Prefix Argument Parsing', () => {
  test('parseArg should extract value after prefix', () => {
    const args = ['web', 'create', '-d', 'example.com', '--other', 'value']

    expect(Cli.parseArg(args, ['-d', '--domain'])).toBe('example.com')
    expect(Cli.parseArg(args, ['--other'])).toBe('value')
    expect(Cli.parseArg(args, ['-x', '--missing'])).toBeNull()
  })

  test('parseArg should handle multiple prefix options', () => {
    const args = ['mail', 'create', '--email', 'test@example.com', '-p', 'password123']

    expect(Cli.parseArg(args, ['-e', '--email'])).toBe('test@example.com')
    expect(Cli.parseArg(args, ['-p', '--password'])).toBe('password123')
  })

  test('parseArg should return null for missing arguments', () => {
    const args = ['web', 'create']

    expect(Cli.parseArg(args, ['-d', '--domain'])).toBeNull()
    expect(Cli.parseArg(null, ['-d'])).toBeNull()
    expect(Cli.parseArg(args, null)).toBeNull()
  })

  test('parseArg should handle edge cases', () => {
    const args = ['command', '-d']

    // Missing value after prefix
    expect(Cli.parseArg(args, ['-d'])).toBeNull()

    // Empty args
    expect(Cli.parseArg([], ['-d'])).toBeNull()
  })
})

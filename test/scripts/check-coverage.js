#!/usr/bin/env node

/**
 * Pre-commit hook to check test coverage for changed files
 * Only runs tests for files that have been modified
 */

const {execSync} = require('child_process')
const fs = require('fs')
const path = require('path')

// Get list of staged files
function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf8'
    })
    return output
      .split('\n')
      .filter(file => file.endsWith('.js'))
      .filter(file => file.startsWith('core/') || file.startsWith('server/'))
      .filter(file => !file.includes('.test.js') && !file.includes('.spec.js'))
  } catch (err) {
    console.error('Error getting staged files:', err.message)
    return []
  }
}

// Check if there are corresponding test files
function checkTestFiles(changedFiles) {
  const missingTests = []

  for (const file of changedFiles) {
    // Skip if file doesn't exist (deleted files)
    if (!fs.existsSync(file)) continue

    // Determine test file path
    const testFile = file.replace(/^(core|server)\//, 'test/$1/').replace(/\.js$/, '.test.js')

    if (!fs.existsSync(testFile)) {
      missingTests.push({
        source: file,
        test: testFile
      })
    }
  }

  return missingTests
}

// Run tests for specific files
function runTestsForFiles(files) {
  if (files.length === 0) {
    console.log('✓ No testable files changed')
    return true
  }

  console.log(`\n📊 Running tests for ${files.length} changed file(s)...\n`)

  try {
    // Create a pattern to match test files for changed source files
    const testPatterns = files
      .map(file => {
        const testFile = file.replace(/^(core|server)\//, 'test/$1/').replace(/\.js$/, '.test.js')
        return testFile
      })
      .filter(testFile => fs.existsSync(testFile))

    if (testPatterns.length === 0) {
      console.log('⚠️  No test files found for changed files')
      console.log('Skipping coverage check (no tests available yet)\n')
      return true // Don't block commit if no tests exist yet
    }

    // Run Jest for specific test files - no coverage threshold enforcement
    const testFiles = testPatterns.join(' ')
    const command = `npx jest ${testFiles} --passWithNoTests`

    execSync(command, {
      stdio: 'inherit',
      encoding: 'utf8'
    })

    console.log('\n✓ All tests passed\n')
    return true
  } catch (err) {
    console.error('\n✗ Tests failed\n')
    console.error('Please ensure:')
    console.error('  1. All tests pass')
    console.error('  2. Add tests for new functionality\n')
    return false
  }
}

// Main execution
function main() {
  console.log('\n🔍 Checking test coverage for changed files...\n')

  const changedFiles = getStagedFiles()

  if (changedFiles.length === 0) {
    console.log('✓ No core or server files changed\n')
    process.exit(0)
  }

  console.log('Changed files:')
  changedFiles.forEach(file => console.log(`  - ${file}`))
  console.log('')

  // Check for missing test files
  const missingTests = checkTestFiles(changedFiles)

  if (missingTests.length > 0) {
    console.log('⚠️  Warning: Missing test files for:')
    missingTests.forEach(({source, test}) => {
      console.log(`  - ${source}`)
      console.log(`    Expected: ${test}`)
    })
    console.log('')
    console.log('Consider adding tests for better coverage.\n')
  }

  // Run tests
  const success = runTestsForFiles(changedFiles)

  if (!success) {
    process.exit(1)
  }

  process.exit(0)
}

main()

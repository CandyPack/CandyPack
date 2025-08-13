/**
 * @file Watchdog for candypack server
 * This script ensures that the main server process is always running.
 * It logs server output and restarts the server if it crashes.
 */

const {spawn} = require('child_process')
const fs = require('fs').promises
const os = require('os')
const path = require('path')

// --- Constants ---

const CANDYPACK_HOME = path.join(os.homedir(), '.candypack')
const LOG_DIR = path.join(CANDYPACK_HOME, 'logs')
const CONFIG_PATH = path.join(CANDYPACK_HOME, 'config.json')
const SERVER_SCRIPT_PATH = path.join(__dirname, '..', 'server', 'index.js')

const MAX_RESTARTS_IN_WINDOW = 100
const RESTART_WINDOW_MS = 1000 * 60 * 5 // 5 minutes
const SAVE_INTERVAL_MS = 1000 // 1 second

// --- State Variables ---

let logBuffer = ''
let errorBuffer = ''
let restartCount = 0
let lastRestartTimestamp = 0
let isSaving = false

/**
 * Saves the buffered logs to their respective files.
 * This function is designed to be called periodically.
 */
async function saveLogs() {
  if (isSaving) return
  isSaving = true

  try {
    // Ensure log directory exists before attempting to write files
    await fs.mkdir(LOG_DIR, {recursive: true})
    const logFile = path.join(LOG_DIR, '.candypack.log')
    const errFile = path.join(LOG_DIR, '.candypack_err.log')

    await fs.writeFile(logFile, logBuffer, 'utf8')
    await fs.writeFile(errFile, errorBuffer, 'utf8')
  } catch (error) {
    console.error('Failed to save logs:', error)
  } finally {
    isSaving = false
  }
}

/**
 * Performs startup checks to ensure a clean environment.
 * It kills any old watchdog or server processes that might still be running.
 * It also creates the necessary configuration files and directories if they don't exist.
 * @returns {Promise<boolean>} A promise that resolves to true if the checks pass.
 */
async function performStartupChecks() {
  try {
    // Ensure .candypack directory and config file exist
    await fs.mkdir(CANDYPACK_HOME, {recursive: true})
    try {
      await fs.access(CONFIG_PATH)
    } catch {
      await fs.writeFile(CONFIG_PATH, '{}', 'utf8')
    }

    let config
    try {
      const configData = await fs.readFile(CONFIG_PATH, 'utf8')
      config = JSON.parse(configData)
    } catch (error) {
      console.error('Error reading or parsing config file, resetting it.', error)
      config = {}
    }

    if (!config.server) config.server = {}

    // Kill previous watchdog process if it exists and is different from the current one
    if (config.server.watchdog && config.server.watchdog !== process.pid) {
      try {
        process.kill(config.server.watchdog, 'SIGTERM')
        console.log(`Terminated old watchdog process with PID: ${config.server.watchdog}`)
      } catch (e) {
        // It's okay if the process doesn't exist anymore
      }
    }

    // Kill previous server process if it exists
    if (config.server.pid) {
      try {
        process.kill(config.server.pid, 'SIGTERM')
        console.log(`Terminated old server process with PID: ${config.server.pid}`)
      } catch (e) {
        // It's okay if the process doesn't exist anymore
      }
    }

    // Update config with current watchdog's info
    config.server.watchdog = process.pid
    config.server.started = Date.now()
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 4), 'utf8')

    return true
  } catch (error) {
    console.error('Error during startup checks:', error)
    return false
  }
}

/**
 * Starts the server process and sets up monitoring.
 */
async function startServer() {
  const checksPassed = await performStartupChecks()
  if (!checksPassed) {
    console.error('Startup checks failed. Aborting.')
    process.exit(1)
  }

  // Ensure log directory exists before starting
  await fs.mkdir(LOG_DIR, {recursive: true})

  const child = spawn('node', [SERVER_SCRIPT_PATH, 'start'], {detached: true})

  console.log(`Server process started with PID: ${child.pid}`)

  child.stdout.on('data', data => {
    logBuffer += `[LOG][${new Date().toISOString()}] ${data.toString()}`
  })

  child.stderr.on('data', data => {
    errorBuffer += `[ERR][${new Date().toISOString()}] ${data.toString()}`
  })

  child.on('close', code => {
    errorBuffer += `[ERR][${new Date().toISOString()}] Process closed with code ${code}\n`

    // Reset restart count if the last restart was a while ago
    if (Date.now() - lastRestartTimestamp > RESTART_WINDOW_MS) {
      restartCount = 0
    }

    restartCount++
    lastRestartTimestamp = Date.now()

    // If restart limit is not exceeded, restart the server
    if (restartCount < MAX_RESTARTS_IN_WINDOW) {
      console.log('Server process closed. Restarting...')
      // Relaunch the server process without setting up new intervals
      startServer()
    } else {
      console.error('Server has crashed too many times. Not restarting.')
      // Final attempt to save logs before exiting
      saveLogs().then(() => process.exit(1))
    }
  })
}

// --- Main Execution ---

// Set up periodic log saving. This is done only once.
setInterval(saveLogs, SAVE_INTERVAL_MS)

// Start the server for the first time.
startServer()

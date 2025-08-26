const {spawn} = require('child_process')
const fs = require('fs').promises
const os = require('os')
const path = require('path')

// --- Constants ---
const CANDYPACK_HOME = path.join(os.homedir(), '.candypack')
const LOG_DIR = path.join(CANDYPACK_HOME, 'logs')
const SERVER_SCRIPT_PATH = path.join(__dirname, '..', '..', 'server', 'index.js')

const MAX_RESTARTS_IN_WINDOW = 100
const RESTART_WINDOW_MS = 1000 * 60 * 5 // 5 minutes
const SAVE_INTERVAL_MS = 1000 // 1 second

class Watchdog {
  #logBuffer = ''
  #errorBuffer = ''
  #restartCount = 0
  #lastRestartTimestamp = 0
  #isSaving = false

  constructor() {
    // The init method will be called by Candy.watchdog()
  }

  init() {
    // Set up periodic log saving. This is done only once.
    setInterval(() => this.#saveLogs(), SAVE_INTERVAL_MS)

    // Start the server for the first time.
    this.#startServer()
  }

  /**
   * Saves the buffered logs to their respective files.
   * This function is designed to be called periodically.
   */
  async #saveLogs() {
    if (this.#isSaving) return
    this.#isSaving = true

    try {
      // Ensure log directory exists before attempting to write files
      await fs.mkdir(LOG_DIR, {recursive: true})
      const logFile = path.join(LOG_DIR, '.candypack.log')
      const errFile = path.join(LOG_DIR, '.candypack_err.log')

      await fs.writeFile(logFile, this.#logBuffer, 'utf8')
      await fs.writeFile(errFile, this.#errorBuffer, 'utf8')
    } catch (error) {
      console.error('Failed to save logs:', error)
    } finally {
      this.#isSaving = false
    }
  }

  /**
   * Performs startup checks to ensure a clean environment.
   * It kills any old watchdog or server processes that might still be running.
   * It also creates the necessary configuration files and directories if they don't exist.
   * @returns {Promise<boolean>} A promise that resolves to true if the checks pass.
   */
  async #performStartupChecks() {
    try {
      const config = Candy.core('Config')

      // Wait for config to be loaded by getting a dummy key
      await config.get('dummy_key_to_wait_for_load')

      const configData = config.config

      if (!configData.server) configData.server = {}

      // Kill previous watchdog process if it exists and is different from the current one
      if (configData.server.watchdog && configData.server.watchdog !== process.pid) {
        try {
          process.kill(configData.server.watchdog, 'SIGTERM')
          console.log(`Terminated old watchdog process with PID: ${configData.server.watchdog}`)
        } catch {
          // It's okay if the process doesn't exist anymore
        }
      }

      // Kill previous server process if it exists
      if (configData.server.pid) {
        try {
          process.kill(configData.server.pid, 'SIGTERM')
          console.log(`Terminated old server process with PID: ${configData.server.pid}`)
        } catch {
          // It's okay if the process doesn't exist anymore
        }
      }

      // Update config with current watchdog's info
      configData.server.watchdog = process.pid
      configData.server.started = Date.now()

      return true
    } catch (error) {
      console.error('Error during startup checks:', error)
      return false
    }
  }

  /**
   * Starts the server process and sets up monitoring.
   */
  async #startServer() {
    const checksPassed = await this.#performStartupChecks()
    if (!checksPassed) {
      console.error('Startup checks failed. Aborting.')
      process.exit(1)
    }

    // Ensure log directory exists before starting
    await fs.mkdir(LOG_DIR, {recursive: true})

    const child = spawn('node', [SERVER_SCRIPT_PATH, 'start'], {detached: true})

    Candy.core('Config').config.server.pid = child.pid

    console.log(`Server process started with PID: ${child.pid}`)

    child.stdout.on('data', data => {
      this.#logBuffer += `[LOG][${new Date().toISOString()}] ${data.toString()}`
    })

    child.stderr.on('data', data => {
      this.#errorBuffer += `[ERR][${new Date().toISOString()}] ${data.toString()}`
    })

    child.on('close', code => {
      this.#errorBuffer += `[ERR][${new Date().toISOString()}] Process closed with code ${code}\n`

      // Reset restart count if the last restart was a while ago
      if (Date.now() - this.#lastRestartTimestamp > RESTART_WINDOW_MS) {
        this.#restartCount = 0
      }

      this.#restartCount++
      this.#lastRestartTimestamp = Date.now()

      // If restart limit is not exceeded, restart the server
      if (this.#restartCount < MAX_RESTARTS_IN_WINDOW) {
        console.log('Server process closed. Restarting...')
        // Relaunch the server process without setting up new intervals
        this.#startServer()
      } else {
        console.error('Server has crashed too many times. Not restarting.')
        // Final attempt to save logs before exiting
        this.#saveLogs().then(() => process.exit(1))
      }
    })
  }
}

module.exports = new Watchdog()

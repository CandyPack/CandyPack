const fs = require('fs')

class Cron {
  #interval = null
  #jobs = []

  init() {
    if (this.#interval) return
    this.#interval = setInterval(this.check.bind(this), 60 * 1000) // Check every minute
  }

  check() {
    console.log('Cron check at', new Date())
    const now = new Date()
    const minute = now.getMinutes()
    const hour = now.getHours()
    const day = now.getDate()
    const weekDay = now.getDay()
    const month = now.getMonth() + 1
    const year = now.getFullYear()
    const yearDay = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24)
    const unix = Math.floor(now.getTime() / 1000)

    for (const job of this.#jobs) {
      if (job.updated.getTime() + 60 * 1000 > now.getTime()) continue // Skip jobs updated in the last minute
      let shouldRun = true
      for (const condition of job.condition) {
        condition.value = parseInt(condition.value)
        switch (condition.type) {
          case 'minute':
            if (condition.value !== minute) shouldRun = false
            break
          case 'hour':
            if (condition.value !== hour) shouldRun = false
            break
          case 'day':
            if (condition.value !== day) shouldRun = false
            break
          case 'weekDay':
            if (condition.value !== weekDay) shouldRun = false
            break
          case 'month':
            if (condition.value !== month) shouldRun = false
            break
          case 'year':
            if (condition.value !== year) shouldRun = false
            break
          case 'yearDay':
            if (condition.value !== yearDay) shouldRun = false
            break
          case 'everyMinute':
            if (job.lastRun && (unix / 60) % condition.value !== 0) shouldRun = false
            break
          case 'everyHour':
            if (job.lastRun && (unix / 3600) % condition.value !== 0) shouldRun = false
            break
          case 'everyDay':
            if (job.lastRun && (unix / 86400) % condition.value !== 0) shouldRun = false
            break
          case 'everyWeekDay':
            if (job.lastRun && weekDay % condition.value !== 0) shouldRun = false
            break
          case 'everyMonth':
            if (job.lastRun && (year * 12 + month) % condition.value !== 0) shouldRun = false
            break
          case 'everyYear':
            if (job.lastRun && year % condition.value !== 0) shouldRun = false
            break
          case 'everyYearDay':
            if (job.lastRun && condition.value !== yearDay) shouldRun = false
            break
        }
        if (!shouldRun) break
      }

      if (shouldRun) {
        job.lastRun = now
        try {
          if (job.function || fs.existsSync(job.path)) {
            if (!job.function) job.function = require(job.path)
            if (job.function && typeof job.function === 'function') {
              job.function()
            }
          }
        } catch (error) {
          console.error(`Error executing job ${job.controller}:`, error)
        }
      }
    }
  }

  job(controller) {
    let path
    if (typeof controller !== 'function') {
      path = `${__dir}/controller/cron/${controller}.js`
      if (controller.includes('.')) {
        let arr = controller.split('.')
        path = `${__dir}/controller/${arr[0]}/cron/${arr.slice(1).join('.')}.js`
      }
    }
    this.#jobs.push({
      controller: typeof controller === 'function' ? null : controller,
      lastRun: null,
      condition: [],
      function: typeof controller === 'function' ? controller : null,
      path,
      updated: new Date()
    })
    let id = this.#jobs.length - 1
    return {
      minute: value => this.#jobs[id].condition.push({type: 'minute', value: value}),
      hour: value => this.#jobs[id].condition.push({type: 'hour', value: value}),
      day: value => this.#jobs[id].condition.push({type: 'day', value: value}),
      weekDay: value => this.#jobs[id].condition.push({type: 'weekDay', value: value}),
      month: value => this.#jobs[id].condition.push({type: 'month', value: value}),
      year: value => this.#jobs[id].condition.push({type: 'year', value: value}),
      yearDay: value => this.#jobs[id].condition.push({type: 'yearDay', value: value}),
      everyMinute: value => this.#jobs[id].condition.push({type: 'everyMinute', value: value}),
      everyHour: value => this.#jobs[id].condition.push({type: 'everyHour', value: value}),
      everyDay: value => this.#jobs[id].condition.push({type: 'everyDay', value: value}),
      everyWeekDay: value => this.#jobs[id].condition.push({type: 'everyWeekDay', value: value}),
      everyMonth: value => this.#jobs[id].condition.push({type: 'everyMonth', value: value}),
      everyYear: value => this.#jobs[id].condition.push({type: 'everyYear', value: value}),
      everyYearDay: value => this.#jobs[id].condition.push({type: 'everyYearDay', value: value})
    }
  }
}

module.exports = new Cron()

# Cron Jobs

The CandyPack framework provides a built-in cron system for running automated tasks. This system checks every minute and executes jobs based on specified conditions.

## Basic Usage

Use the `Candy.Route.cron()` method to define cron jobs:

```javascript
// With controller file
Candy.Route.cron('backup').everyDay(1) // Runs every day

// With direct function
Candy.Route.cron(() => {
  console.log('Task executed!')
}).everyHour(2) // Runs every 2 hours
```

## Controller Files

Controller files for cron jobs are created in the `controller/cron/` directory:

```javascript
// controller/cron/backup.js
module.exports = () => {
  console.log('Backup process started')
  // Backup code...
}
```

For module-based organization:

```javascript
// controller/admin/cron/cleanup.js
module.exports = () => {
  console.log('Cleanup process')
}

// Usage
Candy.Route.cron('admin.cleanup').everyDay(1)
```

## Direct Function Usage

You can also define cron jobs with inline functions:

```javascript
// Simple inline function
Candy.Route.cron(() => {
  console.log('Simple task running')
}).everyMinute(5)

// Async function
Candy.Route.cron(async () => {
  const data = await fetchSomeData()
  console.log('Async task completed', data)
}).everyHour(1)

// Function with parameters
const cleanupTask = (directory) => {
  console.log(`Cleaning up ${directory}`)
  // Cleanup logic...
}

Candy.Route.cron(() => cleanupTask('/tmp')).everyDay(1)
```

## Time Conditions

### Specific Time Values

```javascript
const job = Candy.Route.cron('task')

// Minute (0-59)
job.minute(30) // At 30th minute

// Hour (0-23)
job.hour(14) // At 14:00

// Day (1-31)
job.day(15) // On the 15th of the month

// Week day (0-6, 0=Sunday)
job.weekDay(1) // On Monday

// Month (1-12)
job.month(6) // In June

// Year
job.year(2024) // In 2024

// Year day (1-365)
job.yearDay(100) // On the 100th day of the year
```

### Periodic Execution

```javascript
const job = Candy.Route.cron('periodic')

// Every N minutes
job.everyMinute(5) // Every 5 minutes

// Every N hours
job.everyHour(3) // Every 3 hours

// Every N days
job.everyDay(2) // Every 2 days

// Every N weeks
job.everyWeekDay(1) // Every week

// Every N months
job.everyMonth(2) // Every 2 months

// Every N years
job.everyYear(1) // Every year
```

## Combination Usage

You can combine multiple conditions:

```javascript
// Every day at 14:30
Candy.Route.cron('daily-report')
  .hour(14)
  .minute(30)

// Mondays at 09:00
Candy.Route.cron('weekly-task')
  .weekDay(1)
  .hour(9)
  .minute(0)

// First day of every month at midnight
Candy.Route.cron('monthly-cleanup')
  .day(1)
  .hour(0)
  .minute(0)
```

## Important Notes

- The cron system checks every minute
- Jobs run at the first suitable time after their last update
- If the same job is defined multiple times, the last definition takes precedence
- Controller files are re-required on each execution
- Inline functions are stored in memory and executed directly
- If a job fails, it stops but the system continues

## Advanced Usage

### Dynamic Job Addition

```javascript
// Adding jobs at runtime with functions
function addDynamicJob(name, interval) {
  Candy.Route.cron(() => {
    console.log(`Dynamic job executed: ${name}`)
    // Dynamic job logic...
  }).everyMinute(interval)
}

addDynamicJob('dynamic-task', 10)
```

### Conditional Job Execution

```javascript
// Using inline function for conditional logic
Candy.Route.cron(() => {
  const hour = new Date().getHours()
  
  // Only run during business hours
  if (hour >= 9 && hour <= 17) {
    console.log('Business hours task running')
    // Business hour tasks...
  }
}).everyHour(1)
```

### Environment-Based Jobs

```javascript
// Different behavior based on environment
Candy.Route.cron(() => {
  if (process.env.NODE_ENV === 'production') {
    console.log('Production backup running')
    // Production backup logic
  } else {
    console.log('Development cleanup running')
    // Development cleanup logic
  }
}).everyDay(1).hour(2).minute(0)
```
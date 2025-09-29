/**
 * Mock implementation of mailparser for server tests
 */

const {createMockEmailMessage} = require('./testFactories')

const simpleParser = jest.fn((source, options, callback) => {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  // Create a mock parsed email
  const mockParsedEmail = createMockEmailMessage()

  // Allow customization through options
  if (options.from) mockParsedEmail.from.value[0].address = options.from
  if (options.to) mockParsedEmail.to[0].address = options.to
  if (options.subject) mockParsedEmail.subject = options.subject
  if (options.text) mockParsedEmail.text = options.text
  if (options.html) mockParsedEmail.html = options.html

  // Simulate async parsing
  setTimeout(() => {
    if (callback) {
      callback(null, mockParsedEmail)
    }
  }, 0)

  // Return a promise if no callback provided
  if (!callback) {
    return Promise.resolve(mockParsedEmail)
  }
})

// Mock for streaming parser
const parseHeaders = jest.fn((source, callback) => {
  const mockHeaders = new Map([
    ['from', 'sender@example.com'],
    ['to', 'recipient@example.com'],
    ['subject', 'Test Email'],
    ['date', new Date().toISOString()],
    ['message-id', '<test@example.com>']
  ])

  setTimeout(() => {
    if (callback) {
      callback(null, mockHeaders)
    }
  }, 0)

  if (!callback) {
    return Promise.resolve(mockHeaders)
  }
})

// Mock for attachment parsing
const parseAttachment = jest.fn((attachment, callback) => {
  const mockAttachment = {
    filename: 'test.txt',
    contentType: 'text/plain',
    size: 100,
    content: Buffer.from('test attachment content')
  }

  setTimeout(() => {
    if (callback) {
      callback(null, mockAttachment)
    }
  }, 0)

  if (!callback) {
    return Promise.resolve(mockAttachment)
  }
})

module.exports = {
  simpleParser,
  parseHeaders,
  parseAttachment
}

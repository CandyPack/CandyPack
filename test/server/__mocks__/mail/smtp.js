/**
 * Mock implementation of mail/smtp for server tests
 */

const smtp = {
  send: jest.fn(mailData => {
    // Mock successful send
    return Promise.resolve({
      messageId: mailData.messageId || '<mock@example.com>',
      accepted: mailData.to ? [mailData.to.value[0].address] : ['recipient@example.com'],
      rejected: [],
      pending: [],
      response: '250 Message accepted'
    })
  }),

  // Test helper methods
  __setMockResponse: response => {
    smtp.send.mockResolvedValue(response)
  },

  __setMockError: error => {
    smtp.send.mockRejectedValue(error)
  },

  __resetMock: () => {
    smtp.send.mockClear()
  }
}

module.exports = smtp

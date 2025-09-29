const mockSelfsigned = {
  generate: jest.fn().mockReturnValue({
    private: '-----BEGIN PRIVATE KEY-----\nmock-private-key\n-----END PRIVATE KEY-----',
    cert: '-----BEGIN CERTIFICATE-----\nmock-certificate\n-----END CERTIFICATE-----'
  })
}

module.exports = mockSelfsigned

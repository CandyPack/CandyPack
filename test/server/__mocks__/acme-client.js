const mockAcme = {
  directory: {
    letsencrypt: {
      production: 'https://acme-v02.api.letsencrypt.org/directory',
      staging: 'https://acme-staging-v02.api.letsencrypt.org/directory'
    }
  },
  forge: {
    createPrivateKey: jest.fn().mockResolvedValue('mock-private-key'),
    createCsr: jest.fn().mockResolvedValue(['mock-key', 'mock-csr'])
  },
  Client: jest.fn().mockImplementation(() => ({
    auto: jest.fn().mockResolvedValue('mock-certificate')
  }))
}

module.exports = mockAcme

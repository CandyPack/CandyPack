const fs = require('fs');
const Lang = require('../core/Lang');

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    writeFile: jest.fn(),
  },
  readFileSync: jest.fn(),
}));

describe('Lang', () => {
  beforeEach(() => {
    // Reset mocks before each test
    fs.readFileSync.mockClear();
    fs.promises.writeFile.mockClear();
  });

  it("should return 'CandyPack' for the 'CandyPack' key", () => {
    const lang = new Lang();
    expect(lang.get('CandyPack')).toBe('CandyPack');
  });

  it('should return the translation for an existing key', () => {
    const mockStrings = { 'test.key': 'Test Value' };
    fs.readFileSync.mockReturnValue(JSON.stringify(mockStrings));

    const lang = new Lang();
    expect(lang.get('test.key')).toBe('Test Value');
  });

  it('should replace placeholders with arguments', () => {
    const mockStrings = { 'greeting': 'Hello, %s! Welcome, %s.' };
    fs.readFileSync.mockReturnValue(JSON.stringify(mockStrings));

    const lang = new Lang();
    expect(lang.get('greeting', 'John', 'Jane')).toBe('Hello, John! Welcome, Jane.');
  });

  it('should return the key and try to save it if it does not exist', () => {
    fs.readFileSync.mockImplementation(() => {
      throw new Error('File not found');
    });

    const lang = new Lang();
    const key = 'non.existent.key';

    expect(lang.get(key)).toBe(key);

    // Verify that save was called
    expect(fs.promises.writeFile).toHaveBeenCalled();
  });

  it('should handle multiple placeholders correctly', () => {
    const mockStrings = { 'format': '%s %s %s' };
    fs.readFileSync.mockReturnValue(JSON.stringify(mockStrings));
    const lang = new Lang();
    expect(lang.get('format', 'a', 'b', 'c')).toBe('a b c');
  });
});

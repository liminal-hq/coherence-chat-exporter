
import { jest } from '@jest/globals';

// Mock fs module
jest.unstable_mockModule('fs', () => ({
  promises: {
    writeFile: jest.fn(),
  },
  existsSync: jest.fn(() => true), // Assume config dir exists
  mkdirSync: jest.fn(),
  readFileSync: jest.fn(() => '{}'),
  writeFileSync: jest.fn(),
}));

// Mock os module to control homedir if needed, but we can probably rely on process.env.XDG_CONFIG_HOME or just generic behavior
jest.unstable_mockModule('os', () => ({
    homedir: () => '/home/user',
    tmpdir: () => '/tmp',
    platform: () => 'linux',
    release: () => '1.0.0',
    type: () => 'Linux',
    endianness: () => 'LE',
}));

const { configManager } = await import('./config-manager.js');
const fs = await import('fs');

describe('ConfigManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset config path determination if possible, or just accept the one calculated at import time.
  });

  it('saveConfig should call fs.promises.writeFile', async () => {
    const mockConfig: any = {
      outputPath: './test',
      providers: {},
      tagging: {},
      formatting: {}
    };

    await configManager.saveConfig(mockConfig);

    expect(fs.promises.writeFile).toHaveBeenCalledTimes(1);
    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      expect.stringMatching(/config\.json$/),
      expect.stringContaining('"outputPath": "./test"'),
      'utf-8'
    );
  });

  it('saveConfig should handle errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (fs.promises.writeFile as jest.Mock<any>).mockRejectedValueOnce(new Error('Write failed'));

    const mockConfig: any = { outputPath: './test' };

    // Should not throw
    await expect(configManager.saveConfig(mockConfig)).resolves.not.toThrow();

    expect(consoleSpy).toHaveBeenCalledWith('Failed to save config:', expect.any(Error));
    consoleSpy.mockRestore();
  });
});

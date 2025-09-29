/**
 * Mock implementation of the os module for server tests
 * Provides comprehensive mocking of operating system utilities
 */

const os = {
  // System information
  arch: jest.fn(() => 'x64'),
  platform: jest.fn(() => 'linux'),
  type: jest.fn(() => 'Linux'),
  release: jest.fn(() => '5.4.0-74-generic'),
  version: jest.fn(() => '#83-Ubuntu SMP Sat May 8 02:35:39 UTC 2021'),
  machine: jest.fn(() => 'x86_64'),

  // Hostname
  hostname: jest.fn(() => 'test-hostname'),

  // User information
  userInfo: jest.fn((options = {}) => {
    return {
      uid: 1000,
      gid: 1000,
      username: 'testuser',
      homedir: '/home/testuser',
      shell: '/bin/bash'
    }
  }),

  // Directory paths
  homedir: jest.fn(() => '/home/testuser'),
  tmpdir: jest.fn(() => '/tmp'),

  // System constants
  EOL: '\n',

  // CPU information
  cpus: jest.fn(() => [
    {
      model: 'Intel(R) Core(TM) i7-8700K CPU @ 3.70GHz',
      speed: 3700,
      times: {
        user: 252020,
        nice: 0,
        sys: 30340,
        idle: 1070356870,
        irq: 0
      }
    },
    {
      model: 'Intel(R) Core(TM) i7-8700K CPU @ 3.70GHz',
      speed: 3700,
      times: {
        user: 306920,
        nice: 0,
        sys: 26980,
        idle: 1071569080,
        irq: 0
      }
    }
  ]),

  // Memory information
  totalmem: jest.fn(() => 17179869184), // 16 GB
  freemem: jest.fn(() => 8589934592), // 8 GB

  // Load average (Unix-like systems only)
  loadavg: jest.fn(() => [0.2, 0.1, 0.05]),

  // Uptime
  uptime: jest.fn(() => 86400), // 1 day in seconds

  // Network interfaces
  networkInterfaces: jest.fn(() => ({
    lo: [
      {
        address: '127.0.0.1',
        netmask: '255.0.0.0',
        family: 'IPv4',
        mac: '00:00:00:00:00:00',
        internal: true,
        cidr: '127.0.0.1/8'
      },
      {
        address: '::1',
        netmask: 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
        family: 'IPv6',
        mac: '00:00:00:00:00:00',
        internal: true,
        cidr: '::1/128',
        scopeid: 0
      }
    ],
    eth0: [
      {
        address: '192.168.1.100',
        netmask: '255.255.255.0',
        family: 'IPv4',
        mac: '01:02:03:04:05:06',
        internal: false,
        cidr: '192.168.1.100/24'
      },
      {
        address: 'fe80::a00:27ff:fe4e:66a1',
        netmask: 'ffff:ffff:ffff:ffff::',
        family: 'IPv6',
        mac: '01:02:03:04:05:06',
        internal: false,
        cidr: 'fe80::a00:27ff:fe4e:66a1/64',
        scopeid: 1
      }
    ]
  })),

  // Priority constants
  constants: {
    // Signals
    signals: {
      SIGHUP: 1,
      SIGINT: 2,
      SIGQUIT: 3,
      SIGILL: 4,
      SIGTRAP: 5,
      SIGABRT: 6,
      SIGIOT: 6,
      SIGBUS: 7,
      SIGFPE: 8,
      SIGKILL: 9,
      SIGUSR1: 10,
      SIGSEGV: 11,
      SIGUSR2: 12,
      SIGPIPE: 13,
      SIGALRM: 14,
      SIGTERM: 15,
      SIGCHLD: 17,
      SIGCONT: 18,
      SIGSTOP: 19,
      SIGTSTP: 20,
      SIGTTIN: 21,
      SIGTTOU: 22,
      SIGURG: 23,
      SIGXCPU: 24,
      SIGXFSZ: 25,
      SIGVTALRM: 26,
      SIGPROF: 27,
      SIGWINCH: 28,
      SIGIO: 29,
      SIGPOLL: 29,
      SIGPWR: 30,
      SIGSYS: 31,
      SIGUNUSED: 31
    },

    // Error codes
    errno: {
      E2BIG: 7,
      EACCES: 13,
      EADDRINUSE: 98,
      EADDRNOTAVAIL: 99,
      EAFNOSUPPORT: 97,
      EAGAIN: 11,
      EALREADY: 114,
      EBADF: 9,
      EBADMSG: 74,
      EBUSY: 16,
      ECANCELED: 125,
      ECHILD: 10,
      ECONNABORTED: 103,
      ECONNREFUSED: 111,
      ECONNRESET: 104,
      EDEADLK: 35,
      EDESTADDRREQ: 89,
      EDOM: 33,
      EDQUOT: 122,
      EEXIST: 17,
      EFAULT: 14,
      EFBIG: 27,
      EHOSTUNREACH: 113,
      EIDRM: 43,
      EILSEQ: 84,
      EINPROGRESS: 115,
      EINTR: 4,
      EINVAL: 22,
      EIO: 5,
      EISCONN: 106,
      EISDIR: 21,
      ELOOP: 40,
      EMFILE: 24,
      EMLINK: 31,
      EMSGSIZE: 90,
      EMULTIHOP: 72,
      ENAMETOOLONG: 36,
      ENETDOWN: 100,
      ENETRESET: 102,
      ENETUNREACH: 101,
      ENFILE: 23,
      ENOBUFS: 105,
      ENODATA: 61,
      ENODEV: 19,
      ENOENT: 2,
      ENOEXEC: 8,
      ENOLCK: 37,
      ENOLINK: 67,
      ENOMEM: 12,
      ENOMSG: 42,
      ENOPROTOOPT: 92,
      ENOSPC: 28,
      ENOSR: 63,
      ENOSTR: 60,
      ENOSYS: 38,
      ENOTCONN: 107,
      ENOTDIR: 20,
      ENOTEMPTY: 39,
      ENOTSOCK: 88,
      ENOTSUP: 95,
      ENOTTY: 25,
      ENXIO: 6,
      EOPNOTSUPP: 95,
      EOVERFLOW: 75,
      EPERM: 1,
      EPIPE: 32,
      EPROTO: 71,
      EPROTONOSUPPORT: 93,
      EPROTOTYPE: 91,
      ERANGE: 34,
      EROFS: 30,
      ESPIPE: 29,
      ESRCH: 3,
      ESTALE: 116,
      ETIME: 62,
      ETIMEDOUT: 110,
      ETXTBSY: 26,
      EWOULDBLOCK: 11,
      EXDEV: 18
    },

    // Priority levels
    priority: {
      PRIORITY_LOW: 19,
      PRIORITY_BELOW_NORMAL: 10,
      PRIORITY_NORMAL: 0,
      PRIORITY_ABOVE_NORMAL: -7,
      PRIORITY_HIGH: -14,
      PRIORITY_HIGHEST: -20
    }
  },

  // Process priority (Unix-like systems)
  getPriority: jest.fn((pid = 0) => {
    return 0 // Normal priority
  }),

  setPriority: jest.fn((pid, priority) => {
    if (typeof pid === 'number' && typeof priority === 'undefined') {
      priority = pid
      pid = 0
    }

    // Mock implementation - just return success
    return undefined
  }),

  // Endianness
  endianness: jest.fn(() => 'LE'), // Little Endian

  // Test helpers
  __setArch: arch => {
    os.arch.mockReturnValue(arch)
  },

  __setPlatform: platform => {
    os.platform.mockReturnValue(platform)
  },

  __setHostname: hostname => {
    os.hostname.mockReturnValue(hostname)
  },

  __setHomedir: homedir => {
    os.homedir.mockReturnValue(homedir)
  },

  __setTmpdir: tmpdir => {
    os.tmpdir.mockReturnValue(tmpdir)
  },

  __setMemory: (total, free) => {
    os.totalmem.mockReturnValue(total)
    os.freemem.mockReturnValue(free)
  },

  __setLoadAvg: loadavg => {
    os.loadavg.mockReturnValue(loadavg)
  },

  __setUptime: uptime => {
    os.uptime.mockReturnValue(uptime)
  },

  __setCpus: cpus => {
    os.cpus.mockReturnValue(cpus)
  },

  __setNetworkInterfaces: interfaces => {
    os.networkInterfaces.mockReturnValue(interfaces)
  },

  __setUserInfo: userInfo => {
    os.userInfo.mockReturnValue(userInfo)
  },

  __resetMocks: () => {
    Object.values(os).forEach(fn => {
      if (jest.isMockFunction(fn)) {
        fn.mockClear()
      }
    })
  }
}

module.exports = os

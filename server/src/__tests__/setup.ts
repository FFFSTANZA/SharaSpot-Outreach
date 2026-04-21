
// Global test setup
// Mocks infrastructure that should not be real in unit tests
const EventEmitter = require('events');

jest.mock("ioredis", () => {
    class MockRedis extends EventEmitter {
        constructor() {
            super();
            this.status = 'ready';
            this.options = {};
            this.connect = jest.fn().mockResolvedValue(undefined);
            this.disconnect = jest.fn().mockResolvedValue(undefined);
            this.quit = jest.fn().mockResolvedValue(undefined);
        }
        lpush = jest.fn().mockResolvedValue(1);
        rpop = jest.fn().mockResolvedValue(null);
        set = jest.fn().mockResolvedValue("OK");
        get = jest.fn().mockResolvedValue(null);
        del = jest.fn().mockResolvedValue(1);
        defineCommand = jest.fn();
        info = jest.fn().mockResolvedValue("redis_version:7.0.0");
        multi = jest.fn().mockReturnThis();
        exec = jest.fn().mockResolvedValue([]);
    }

    return {
        __esModule: true,
        default: MockRedis,
        Redis: MockRedis,
    };
});

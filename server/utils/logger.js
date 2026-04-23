import pino from 'pino';

const logger = pino({
    level: process.env.LOG_LEVEL || 'info', 
    transport: {
        target: 'pino/file',
        options: { destination: 1 } // STDOUT directly by default. Can hook into pino-pretty in dev
    }
});

export default logger;

import winston from 'winston';

const colorizeInfo = winston.format((info) => {
    if (info.level === 'info') {
        info.message = `\x1b[38;5;214m${info.message}\x1b[0m`;
    }
    return info;
});

const colorizeError = winston.format((info) => {
    if (info.level === 'error') {
        info.message = `\x1b[38;5;196m${info.message}\x1b[0m`;
    }
    return info;
});

export const logger = winston.createLogger({
    level: 'debug',
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});

logger.add(
    new winston.transports.Console({
        format: winston.format.combine(
            colorizeInfo(),
            colorizeError(),
            winston.format.colorize({ colors: { http: 'green', info: 'cyan' } }),
            winston.format.simple()
        ),
    })
);

export class Logger {
    private className: string;

    constructor(className: string) {
        this.className = className;
    }

    private formatMessage = (...message: any[]): string => {
        return message
            .map((msg) => {
                if (typeof msg === 'string') {
                    return msg;
                } else if (typeof msg === 'object' && msg !== null) {
                    return JSON.stringify(msg, null, 2);
                } else {
                    return String(msg);
                }
            })
            .join(' ');
    };

    public debug = (...message: any[]) => {
        logger.debug(`${this.className}: ${this.formatMessage(...message)}`);
    };

    public info = (...message: any[]) => {
        logger.info(`${this.className}: ${this.formatMessage(...message)}`);
    };

    public warn = (...message: any[]) => {
        logger.warn(`${this.className}: ${this.formatMessage(...message)}`);
    };

    public highlight = (...message: any[]) => {
        const msg = `${this.className}: ${this.formatMessage(...message)}`;
        logger.info(`\x1b[38;5;214m${msg}\x1b[0m`);
    };

    public error = (...message: any[]) => {
        const errorMsg = `${this.className}: ${this.formatMessage(...message)}`;
        logger.error(`\x1b[38;5;196m${errorMsg}\x1b[0m`);
    };
}

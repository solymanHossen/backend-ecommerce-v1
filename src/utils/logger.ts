import { createLogger, format, transports } from 'winston';
import winston from 'winston';

const customColors = {
    error: 'bold red',
    warn: 'bold yellow',
    info: 'bold green',
    debug: 'bold blue',
};

winston.addColors(customColors);

// List of keys to redact
const SENSITIVE_KEYS = [
    'password',
    'passwordConfirm',
    'token',
    'refreshToken',
    'otp',
    'verificationOTP',
    'resetPasswordToken',
    'authorization',
    'creditCard',
    'cvv'
];

const redactSensitiveData = format((info) => {
    const redact = (obj: any): any => {
        if (!obj || typeof obj !== 'object') return obj;
        
        if (Array.isArray(obj)) {
            return obj.map(redact);
        }

        const newObj: any = {};
        for (const key of Object.keys(obj)) {
            const lowerKey = key.toLowerCase();
            const isSensitive = SENSITIVE_KEYS.some(k => lowerKey.includes(k.toLowerCase()));
            
            if (isSensitive) {
                newObj[key] = '[REDACTED]';
            } else {
                newObj[key] = redact(obj[key]);
            }
        }
        return newObj;
    };

    if (typeof info.message === 'object') {
        info.message = redact(info.message);
    }
    
    // Also redact metadata
    // @ts-ignore
    const args = info[Symbol.for('splat')];
    if (args) {
        // @ts-ignore
        info[Symbol.for('splat')] = args.map(redact);
    }

    return info;
});

const logger = createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: format.combine(
        redactSensitiveData(),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }), 
        format.splat(),
        format.json()
    ),
    transports: [
        new transports.Console({
            format: format.combine(
                format.colorize(),
                format.simple()
            )
        }),
        new transports.File({ filename: 'logs/error.log', level: 'error' }),
        new transports.File({ filename: 'logs/combined.log' })
    ]
});

export default logger;

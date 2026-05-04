const fs = require('fs');
const path = require('path');

/**
 * 结构化日志器（从早报流程复用）
 */
class Logger {
    constructor(options = {}) {
        this.level = options.level || 'info';
        this.logFile = options.logFile || null;
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };
    }

    _log(level, message, meta = {}) {
        if (this.levels[level] > this.levels[this.level]) return;

        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            message,
            ...meta
        };

        console.log(JSON.stringify(logEntry));

        if (this.logFile) {
            // 确保日志目录存在
            const logDir = path.dirname(this.logFile);
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }

            fs.appendFileSync(
                this.logFile,
                JSON.stringify(logEntry) + '\n'
            );
        }
    }

    error(message, meta) { this._log('error', message, meta); }
    warn(message, meta) { this._log('warn', message, meta); }
    info(message, meta) { this._log('info', message, meta); }
    debug(message, meta) { this._log('debug', message, meta); }
}

module.exports = { Logger };

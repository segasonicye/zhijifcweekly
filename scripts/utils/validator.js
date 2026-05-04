/**
 * 数据验证器（从早报流程适配）
 * 专门用于验证战报数据
 */
class Validator {
    /**
     * 验证比赛数据格式
     */
    static validateMatch(data) {
        const errors = [];

        // 验证日期格式 (YYYY-MM-DD)
        if (!data.date || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
            errors.push('Invalid date format, expected YYYY-MM-DD');
        }

        // 验证必填字段
        if (!data.opponent || typeof data.opponent !== 'string') {
            errors.push('opponent is required and must be a string');
        }

        // 验证出勤人员
        if (data.attendance && !Array.isArray(data.attendance)) {
            errors.push('attendance must be an array');
        }

        // 验证进球数据
        if (data.scorers) {
            if (!Array.isArray(data.scorers)) {
                errors.push('scorers must be an array');
            } else {
                data.scorers.forEach((scorer, index) => {
                    if (!scorer.name) {
                        errors.push(`scorers[${index}].name is required`);
                    }
                    if (scorer.goals !== undefined && typeof scorer.goals !== 'number') {
                        errors.push(`scorers[${index}].goals must be a number`);
                    }
                });
            }
        }

        // 验证照片数据
        if (data.photos) {
            if (!Array.isArray(data.photos)) {
                errors.push('photos must be an array');
            } else {
                data.photos.forEach((photo, index) => {
                    if (!photo.path) {
                        errors.push(`photos[${index}].path is required`);
                    }
                });
            }
        }

        if (errors.length > 0) {
            throw new Error(`Validation failed: ${errors.join(', ')}`);
        }

        return true;
    }

    /**
     * 验证文件路径是否存在
     */
    static validateFileExists(filePath, description = 'File') {
        const fs = require('fs');
        if (!fs.existsSync(filePath)) {
            throw new Error(`${description} does not exist: ${filePath}`);
        }
        return true;
    }

    /**
     * 验证微信配置
     */
    static validateWechatConfig(config) {
        const errors = [];

        if (!config.appId) {
            errors.push('WeChat appId is required');
        }

        if (!config.appSecret) {
            errors.push('WeChat appSecret is required');
        }

        if (!config.account) {
            errors.push('WeChat account name is required');
        }

        if (errors.length > 0) {
            throw new Error(`WeChat config validation failed: ${errors.join(', ')}`);
        }

        return true;
    }

    /**
     * 验证图片文件
     */
    static validateImageFile(filePath) {
        const fs = require('fs');
        const path = require('path');

        // 检查文件是否存在
        if (!fs.existsSync(filePath)) {
            throw new Error(`Image file does not exist: ${filePath}`);
        }

        // 检查文件扩展名
        const ext = path.extname(filePath).toLowerCase();
        const validExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        if (!validExts.includes(ext)) {
            throw new Error(`Invalid image file extension: ${ext}`);
        }

        // 检查文件大小（最大10MB）
        const stats = fs.statSync(filePath);
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (stats.size > maxSize) {
            throw new Error(`Image file too large: ${stats.size} bytes (max: ${maxSize})`);
        }

        return true;
    }
}

module.exports = { Validator };

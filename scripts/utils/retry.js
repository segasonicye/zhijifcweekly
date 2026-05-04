/**
 * 指数退避重试器（从早报流程复用）
 * @param {Function} fn - 需要重试的异步函数
 * @param {Object} options - 配置选项
 * @returns {Promise} 重试后的结果
 */
async function retryWithBackoff(fn, options = {}) {
    const {
        maxRetries = 3,
        baseDelay = 1000,
        maxDelay = 30000,
        factor = 2,
        onRetry = null
    } = options;

    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn(attempt);
        } catch (error) {
            lastError = error;

            // 最后一次尝试失败，不再重试
            if (attempt === maxRetries) {
                throw error;
            }

            // 计算退避时间（指数增长）
            const delay = Math.min(baseDelay * Math.pow(factor, attempt), maxDelay);

            if (onRetry) {
                await onRetry(attempt, delay, error);
            }

            console.log(`⚠️  Attempt ${attempt + 1}/${maxRetries + 1} failed, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}

module.exports = { retryWithBackoff };

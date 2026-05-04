/**
 * 性能指标采集器（从早报流程复用）
 */
class Metrics {
    constructor() {
        this.metrics = {};
    }

    /**
     * 开始计时
     */
    startTimer(name) {
        this.metrics[name] = {
            startTime: Date.now(),
            endTime: null,
            duration: null
        };
    }

    /**
     * 结束计时
     */
    endTimer(name) {
        if (!this.metrics[name]) {
            throw new Error(`Timer ${name} not started`);
        }

        this.metrics[name].endTime = Date.now();
        this.metrics[name].duration = this.metrics[name].endTime - this.metrics[name].startTime;

        return this.metrics[name].duration;
    }

    /**
     * 获取所有指标
     */
    getMetrics() {
        return this.metrics;
    }

    /**
     * 打印摘要
     */
    printSummary() {
        console.log('\n📊 性能指标总结:');
        Object.entries(this.metrics).forEach(([name, data]) => {
            if (data.duration) {
                const seconds = (data.duration / 1000).toFixed(2);
                console.log(`  ${name}: ${data.duration}ms (${seconds}s)`);
            } else {
                console.log(`  ${name}: 计时中...`);
            }
        });
    }

    /**
     * 记录自定义指标
     */
    record(name, value) {
        this.metrics[name] = {
            value,
            timestamp: Date.now()
        };
    }
}

module.exports = { Metrics };

#!/usr/bin/env node
/**
 * 测试日志功能
 */

const { Logger } = require('./utils/logger');
const fs = require('fs');
const path = require('path');

console.log('🧪 测试日志功能\n');

// 创建测试日志器
const testLogFile = path.join(__dirname, '../logs/test.log');
const logger = new Logger({
  level: 'debug',
  logFile: testLogFile
});

// 测试不同级别的日志
console.log('写入不同级别的日志...\n');
logger.error('这是一个错误', { code: 500, url: '/api/test' });
logger.warn('这是一个警告', { retry: 3 });
logger.info('这是一般信息', { user: 'test', action: 'login' });
logger.debug('这是调试信息', { detail: 'test data' });

// 等待文件写入
setTimeout(() => {
  console.log('日志文件内容:');
  console.log('---');
  if (fs.existsSync(testLogFile)) {
    const logContent = fs.readFileSync(testLogFile, 'utf8');
    console.log(logContent);
    console.log('---');
    
    // 验证 JSON 格式
    const lines = logContent.trim().split('\n');
    let allValid = true;
    lines.forEach((line, index) => {
      try {
        JSON.parse(line);
      } catch (error) {
        console.log(`❌ 第 ${index + 1} 行不是有效的 JSON`);
        allValid = false;
      }
    });
    
    if (allValid) {
      console.log('✅ 所有日志行都是有效的 JSON\n');
    }
    
    // 清理测试文件
    fs.unlinkSync(testLogFile);
    console.log('🧹 已清理测试文件');
  } else {
    console.log('❌ 日志文件未创建\n');
  }
  
  console.log('\n🎉 日志测试完成');
}, 100);

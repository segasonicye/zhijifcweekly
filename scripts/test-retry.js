#!/usr/bin/env node
/**
 * 测试重试机制
 */

const { retryWithBackoff } = require('./utils/retry');

console.log('🧪 测试重试机制\n');

// 测试1: 第一次就成功
console.log('测试1: 第一次就成功');
let attemptCount1 = 0;
const fn1 = async () => {
  attemptCount1++;
  console.log(`  尝试 ${attemptCount1}: 成功`);
  return 'success';
};

retryWithBackoff(fn1, { maxRetries: 3 })
  .then(result => console.log('✅ 结果:', result, '\n'))
  .catch(err => console.log('❌ 失败:', err.message, '\n'));

// 测试2: 第二次成功
console.log('测试2: 第二次成功');
let attemptCount2 = 0;
const fn2 = async () => {
  attemptCount2++;
  console.log(`  尝试 ${attemptCount2}:`, attemptCount2 === 1 ? '失败' : '成功');
  if (attemptCount2 === 1) throw new Error('Network error');
  return 'success';
};

retryWithBackoff(fn2, { maxRetries: 3, baseDelay: 100 })
  .then(result => console.log('✅ 结果:', result, '\n'))
  .catch(err => console.log('❌ 失败:', err.message, '\n'));

// 测试3: 全部失败
console.log('测试3: 全部失败（超过最大重试次数）');
let attemptCount3 = 0;
const fn3 = async () => {
  attemptCount3++;
  console.log(`  尝试 ${attemptCount3}: 失败`);
  throw new Error('Permanent error');
};

retryWithBackoff(fn3, { maxRetries: 2, baseDelay: 100 })
  .then(result => console.log('✅ 结果:', result, '\n'))
  .catch(err => console.log('✅ 正确捕获失败:', err.message, '\n'));

setTimeout(() => {
  console.log('🎉 所有测试完成');
}, 2000);

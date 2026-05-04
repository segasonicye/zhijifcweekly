#!/usr/bin/env node
/**
 * 测试数据验证功能
 */

const { Validator } = require('./utils/validator');

console.log('🧪 测试数据验证功能\n');

// 测试1: 有效数据
console.log('测试1: 有效数据');
try {
  const validData = {
    date: '2026-02-15',
    opponent: '内战',
    score: '3-2',
    location: '福沁球场',
    scorers: [
      { name: '张三', goals: 2 },
      { name: '李四', goals: 1 }
    ],
    attendance: ['张三', '李四', '王五']
  };
  Validator.validateMatch(validData);
  console.log('✅ 通过\n');
} catch (error) {
  console.log('❌ 失败:', error.message, '\n');
}

// 测试2: 无效日期格式
console.log('测试2: 无效日期格式');
try {
  const invalidData = {
    date: '2026/02/15',  // 错误格式
    opponent: '内战'
  };
  Validator.validateMatch(invalidData);
  console.log('❌ 应该失败但没有\n');
} catch (error) {
  console.log('✅ 正确捕获错误:', error.message, '\n');
}

// 测试3: 缺少必填字段
console.log('测试3: 缺少必填字段');
try {
  const invalidData = {
    date: '2026-02-15'
    // 缺少 opponent
  };
  Validator.validateMatch(invalidData);
  console.log('❌ 应该失败但没有\n');
} catch (error) {
  console.log('✅ 正确捕获错误:', error.message, '\n');
}

// 测试4: 进球数据类型错误
console.log('测试4: 进球数据类型错误');
try {
  const invalidData = {
    date: '2026-02-15',
    opponent: '内战',
    scorers: [
      { name: '张三', goals: 'invalid' }  // goals 应该是数字
    ]
  };
  Validator.validateMatch(invalidData);
  console.log('❌ 应该失败但没有\n');
} catch (error) {
  console.log('✅ 正确捕获错误:', error.message, '\n');
}

console.log('🎉 所有测试完成');

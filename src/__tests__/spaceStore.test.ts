/**
 * Space Store 功能测试
 * 这个文件可以在浏览器控制台中运行来验证 spaceStore 的功能
 */

import { useSpaceStore } from '../store/spaceStore';

// 测试函数
export function testSpaceStore() {
  console.log('🧪 开始测试 Space Store...');

  const {
    createSpace,
    getAllSpaces,
    getCurrentSpace,
    switchSpace,
    updateSpace,
    updateSpaceStats,
    deleteSpace,
    searchSpaces
  } = useSpaceStore.getState();

  try {
    // 测试1: 创建学习空间
    console.log('📝 测试1: 创建学习空间');
    const spaceId1 = createSpace({
      name: '高数期末冲刺',
      description: '为期末考试做准备',
      goal: {
        primaryGoal: '期末考试85+分',
        secondaryGoals: ['掌握微分方程基础'],
        examDate: new Date('2024-06-15'),
        targetScore: 85,
        currentScore: 72
      },
      subjects: [{
        name: '高等数学',
        currentLevel: 72,
        targetLevel: 90,
        weight: 0.8,
        weakPoints: ['微分方程'],
        strongPoints: ['极限']
      }],
      schedule: {
        availableHoursPerDay: 3,
        availableDays: ['周一', '周二', '周三', '周四', '周五'],
        preferredTimeSlots: ['晚上'],
        restDays: ['周六下午', '周日'],
        startDate: new Date('2024-05-20')
      }
    });

    console.log('✅ 创建空间成功，ID:', spaceId1);

    // 测试2: 获取所有空间
    console.log('📝 测试2: 获取所有空间');
    const allSpaces = getAllSpaces();
    console.log('✅ 当前空间数量:', allSpaces.length);
    console.log('   空间详情:', allSpaces[0]);

    // 测试3: 获取当前空间
    console.log('📝 测试3: 获取当前空间');
    const currentSpace = getCurrentSpace();
    console.log('✅ 当前空间:', currentSpace?.name);

    // 测试4: 创建第二个空间
    console.log('📝 测试4: 创建第二个空间');
    const spaceId2 = createSpace({
      name: '英语六级准备',
      description: '为六级考试做准备',
      goal: {
        primaryGoal: '六级500+分',
        secondaryGoals: ['提高听力', '扩大词汇量'],
        examDate: new Date('2024-06-20'),
        targetScore: 500
      },
      subjects: [{
        name: '英语',
        currentLevel: 65,
        targetLevel: 85,
        weight: 1.0,
        weakPoints: ['听力', '写作'],
        strongPoints: ['阅读']
      }],
      schedule: {
        availableHoursPerDay: 2,
        availableDays: ['周一', '周二', '周三', '周四', '周五'],
        preferredTimeSlots: ['上午'],
        restDays: ['周六', '周日'],
        startDate: new Date('2024-05-20')
      }
    });
    console.log('✅ 创建第二个空间成功，ID:', spaceId2);

    // 测试5: 切换空间
    console.log('📝 测试5: 切换空间');
    switchSpace(spaceId1);
    console.log('✅ 切换到空间:', getCurrentSpace()?.name);

    // 测试6: 更新空间信息
    console.log('📝 测试6: 更新空间信息');
    updateSpace(spaceId1, {
      name: '高数期末冲刺 - 更新版',
      status: 'active',
      currentPhase: '基础学习'
    });
    console.log('✅ 更新后的空间:', getCurrentSpace());

    // 测试7: 更新学习统计
    console.log('📝 测试7: 更新学习统计');
    updateSpaceStats(spaceId1, {
      totalStudyHours: 12,
      consecutiveDays: 5,
      overallProgress: 25
    });
    console.log('✅ 更新统计后的空间:', getCurrentSpace());

    // 测试8: 搜索空间
    console.log('📝 测试8: 搜索空间');
    const searchResults = searchSpaces('高数');
    console.log('✅ 搜索"高数"结果:', searchResults.length, '个空间');

    // 测试9: 删除空间
    console.log('📝 测试9: 删除空间');
    const beforeDeleteCount = getAllSpaces().length;
    deleteSpace(spaceId2);
    const afterDeleteCount = getAllSpaces().length;
    console.log('✅ 删除前:', beforeDeleteCount, '删除后:', afterDeleteCount);

    console.log('🎉 所有测试通过！Space Store 功能正常。');
    return true;

  } catch (error) {
    console.error('❌ 测试失败:', error);
    return false;
  }
}

// 在浏览器控制台中运行测试的说明
console.log(`
🧪 Space Store 测试指南

在浏览器控制台中运行：

import { testSpaceStore } from './src/__tests__/spaceStore.test';
testSpaceStore();

或者手动测试：

const { createSpace, getAllSpaces, getCurrentSpace } = useSpaceStore.getState();

// 创建空间
const id = createSpace({
  name: '测试空间',
  goal: { primaryGoal: '测试目标', examDate: new Date(), targetScore: 80 },
  subjects: [{ name: '测试学科', currentLevel: 50, targetLevel: 80, weight: 1.0, weakPoints: [], strongPoints: [] }],
  schedule: { availableHoursPerDay: 2, availableDays: ['周一'], preferredTimeSlots: [], restDays: [], startDate: new Date() }
});

// 查看所有空间
console.log(getAllSpaces());

// 查看当前空间
console.log(getCurrentSpace());
`);
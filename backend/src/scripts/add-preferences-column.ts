import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('错误: 缺少 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY 环境变量');
  process.exit(1);
}

// 使用 service role key 创建管理员客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function addPreferencesColumn() {
  console.log('正在添加 preferences 列到 trips 表...\n');

  const sql = `
    ALTER TABLE public.trips
    ADD COLUMN IF NOT EXISTS preferences TEXT;
  `;

  try {
    // 使用 rpc 调用执行原始 SQL（如果可用）
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('执行失败，尝试直接更新数据库...');
      console.error('错误详情:', error);

      // 如果 rpc 不可用，我们需要手动添加
      console.log('\n请手动在 Supabase Dashboard 的 SQL Editor 中运行以下 SQL:\n');
      console.log('=====================================');
      console.log(sql);
      console.log('=====================================\n');
      process.exit(1);
    }

    console.log('✓ 成功添加 preferences 列!');
    console.log('返回数据:', data);
  } catch (error: any) {
    console.error('执行时出错:', error.message);
    console.log('\n由于权限限制，请手动在 Supabase Dashboard 执行以下 SQL:\n');
    console.log('1. 打开 Supabase Dashboard');
    console.log('2. 进入您的项目');
    console.log('3. 点击左侧菜单的 "SQL Editor"');
    console.log('4. 新建查询，粘贴以下 SQL:\n');
    console.log('=====================================');
    console.log(sql);
    console.log('=====================================');
    console.log('\n5. 点击 "Run" 执行\n');
    process.exit(1);
  }
}

addPreferencesColumn();

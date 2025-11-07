/**
 * 简单的迁移脚本
 *
 * 注意：这个脚本只是打印 SQL，您需要在 Supabase Dashboard 的 SQL Editor 中手动运行
 *
 * 或者，如果您安装了 Supabase CLI，可以使用:
 * supabase db push
 */

import * as fs from 'fs';
import * as path from 'path';

// 获取命令行参数
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('用法: ts-node src/scripts/run-migration.ts <migration-file>');
  console.error('例如: ts-node src/scripts/run-migration.ts 20250107000000_add_preferences_to_trips.sql');
  process.exit(1);
}

const migrationPath = path.join(__dirname, '../../supabase/migrations', migrationFile);

console.log(`\n迁移文件: ${migrationFile}`);
console.log(`路径: ${migrationPath}\n`);

try {
  // 读取 SQL 文件
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('===== 迁移 SQL =====');
  console.log(sql);
  console.log('===================\n');

  console.log('请将上面的 SQL 复制到 Supabase Dashboard 的 SQL Editor 中运行');
  console.log('或者在项目根目录运行: supabase db push (如果您安装了 Supabase CLI)');
} catch (error) {
  console.error('读取迁移文件时出错:', error);
  process.exit(1);
}

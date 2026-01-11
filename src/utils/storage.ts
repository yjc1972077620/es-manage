/**
 * 本地存储工具函数
 * 用于 Mock 数据的持久化存储
 */

const STORAGE_PREFIX = 'es_monitor_';

/**
 * 存储数据到 localStorage
 * @param key 存储键名
 * @param data 要存储的数据
 */
export function setStorageData<T>(key: string, data: T): void {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, serialized);
  } catch (error) {
    console.error('存储数据失败:', error);
  }
}

/**
 * 从 localStorage 获取数据
 * @param key 存储键名
 * @param defaultValue 默认值
 */
export function getStorageData<T>(key: string, defaultValue: T): T {
  try {
    const serialized = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (serialized === null) {
      return defaultValue;
    }
    return JSON.parse(serialized) as T;
  } catch (error) {
    console.error('读取数据失败:', error);
    return defaultValue;
  }
}

/**
 * 从 localStorage 删除数据
 * @param key 存储键名
 */
export function removeStorageData(key: string): void {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  } catch (error) {
    console.error('删除数据失败:', error);
  }
}

/**
 * 清除所有 ES Monitor 相关的存储数据
 */
export function clearAllStorageData(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('清除数据失败:', error);
  }
}

/**
 * 检查存储数据是否存在
 * @param key 存储键名
 */
export function hasStorageData(key: string): boolean {
  return localStorage.getItem(`${STORAGE_PREFIX}${key}`) !== null;
}

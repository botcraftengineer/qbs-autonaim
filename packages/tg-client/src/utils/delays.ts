/**
 * Задержка для имитации человеческого поведения
 */
export async function humanDelay(minMs = 800, maxMs = 2000): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  await new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Выбрать случайный элемент из массива
 */
export function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)] as T;
}

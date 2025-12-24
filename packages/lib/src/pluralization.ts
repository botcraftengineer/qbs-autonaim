/**
 * Возвращает правильную форму слова для русского языка в зависимости от числа
 * @param count - Число для определения формы
 * @param forms - Массив из трёх форм: [один, два-четыре, пять и более]
 * @example getPluralForm(1, ['участник', 'участника', 'участников']) // 'участник'
 * @example getPluralForm(2, ['участник', 'участника', 'участников']) // 'участника'
 * @example getPluralForm(5, ['участник', 'участника', 'участников']) // 'участников'
 * @example getPluralForm(11, ['участник', 'участника', 'участников']) // 'участников'
 * @example getPluralForm(22, ['участник', 'участника', 'участников']) // 'участника'
 */
export function getPluralForm(
  count: number,
  forms: [string, string, string],
): string {
  const n = Math.abs(Math.floor(count)) % 100;
  const n1 = n % 10;

  if (n >= 11 && n <= 19) {
    return forms[2];
  }
  if (n1 === 1) {
    return forms[0];
  }
  if (n1 >= 2 && n1 <= 4) {
    return forms[1];
  }

  return forms[2];
}

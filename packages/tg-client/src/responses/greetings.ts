import { randomChoice } from "../utils/delays.js";

export function getErrorResponse(): string {
  const responses = [
    "Не расслышал, можешь повторить?",
    "Что-то не так с голосовым, попробуй еще раз",
    "Не смог прослушать, запиши заново?",
    "Хм, не получилось послушать. Еще раз?",
  ];

  return randomChoice(responses);
}

export function getAudioErrorResponse(): string {
  const responses = [
    "Не удалось открыть файл, можешь записать голосовое?",
    "Что-то не так с файлом, попробуй голосовым?",
    "Не смог прослушать файл, запиши голосовое?",
    "Хм, не получилось открыть. Попробуй голосовым?",
  ];

  return randomChoice(responses);
}

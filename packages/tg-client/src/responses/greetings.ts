import { randomChoice } from "../utils/delays";

export function getErrorResponse(): string {
  const responses = [
    "Не расслышал, попробуй еще раз",
    "Не удалось распознать голосовое, попробуй снова",
    "Не смог прослушать, запиши заново",
    "Хм, не получилось послушать. Еще раз?",
  ];

  return randomChoice(responses);
}

export function getAudioErrorResponse(): string {
  const responses = [
    "Не удалось открыть файл, попробуй записать голосовое",
    "Не получилось обработать файл, попробуй голосовым",
    "Не смог прослушать файл, запиши голосовое",
    "Хм, не получилось открыть. Попробуй голосовым",
  ];

  return randomChoice(responses);
}

export function getTextErrorResponse(): string {
  const responses = [
    "Не удалось обработать сообщение, попробуй написать еще раз",
    "Хм, не получилось обработать сообщение. Напиши еще раз",
    "Произошла ошибка, попробуй снова",
    "Не смог обработать, попробуй написать снова",
  ];

  return randomChoice(responses);
}

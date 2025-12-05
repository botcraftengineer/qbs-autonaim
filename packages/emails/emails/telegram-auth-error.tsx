import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import { env } from "@selectio/config";

import { emailTailwindConfig } from "../tailwind";

interface TelegramAuthErrorEmailProps {
  workspaceName: string;
  phone: string;
  errorType: string;
  errorMessage: string;
  reauthorizeLink: string;
}

export default function TelegramAuthErrorEmail({
  workspaceName = "Workspace",
  phone = "+7 XXX XXX-XX-XX",
  errorType = "AUTH_KEY_UNREGISTERED",
  errorMessage = "Сессия была завершена или стала недействительной",
  reauthorizeLink = `${env.APP_URL}/settings/telegram`,
}: TelegramAuthErrorEmailProps) {
  const errorDescriptions: Record<string, string> = {
    AUTH_KEY_UNREGISTERED:
      "Ключ авторизации был аннулирован. Возможно, вы завершили сессию с другого устройства или Telegram отозвал доступ.",
    AUTH_KEY_INVALID:
      "Ключ авторизации стал недействительным. Требуется повторная авторизация.",
    SESSION_REVOKED:
      "Сессия была отозвана. Это может произойти при завершении сессии в настройках Telegram.",
    AUTH_KEY_PERM_EMPTY:
      "Ключ авторизации пуст. Требуется повторная авторизация.",
    SESSION_EXPIRED:
      "Сессия истекла. Telegram периодически требует повторной авторизации для безопасности.",
    USER_DEACTIVATED:
      "Аккаунт пользователя был деактивирован или удалён в Telegram.",
    USER_DEACTIVATED_BAN:
      "Аккаунт пользователя был заблокирован в Telegram.",
  };

  const description =
    errorDescriptions[errorType] ||
    "Произошла ошибка авторизации. Требуется повторная авторизация.";

  return (
    <Html>
      <Head />
      <Preview>
        ⚠️ Telegram авторизация слетела для {workspaceName}
      </Preview>
      <Tailwind config={emailTailwindConfig}>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-[40px] w-[465px] rounded border border-solid border-[#eaeaea] p-[20px]">
            <Section className="mb-[24px] text-center">
              <Text className="m-0 text-[48px]">⚠️</Text>
            </Section>

            <Heading className="mx-0 my-[24px] p-0 text-center text-[24px] font-normal text-black">
              Telegram авторизация слетела
            </Heading>

            <Text className="text-[14px] leading-[24px] text-black">
              Здравствуйте!
            </Text>

            <Text className="text-[14px] leading-[24px] text-black">
              Авторизация Telegram для workspace{" "}
              <strong>{workspaceName}</strong> стала недействительной.
            </Text>

            <Section className="my-[24px] rounded-lg bg-[#fef2f2] p-[16px]">
              <Text className="m-0 text-[14px] font-semibold text-[#991b1b]">
                Ошибка: {errorType}
              </Text>
              <Text className="mb-0 mt-[8px] text-[14px] text-[#7f1d1d]">
                {description}
              </Text>
              <Text className="mb-0 mt-[8px] text-[12px] text-[#9f1239]">
                Телефон: {phone}
              </Text>
            </Section>

            <Text className="text-[14px] leading-[24px] text-black">
              <strong>Что это означает:</strong>
            </Text>
            <Text className="text-[14px] leading-[24px] text-black">
              • Бот не может получать и отправлять сообщения
              <br />
              • Интервью с кандидатами приостановлены
              <br />• Для восстановления работы требуется повторная авторизация
            </Text>

            <Section className="mb-[32px] mt-[32px] text-center">
              <Button
                className="rounded bg-[#dc2626] px-5 py-3 text-center text-[14px] font-semibold text-white no-underline"
                href={reauthorizeLink}
              >
                Повторить авторизацию
              </Button>
            </Section>

            <Text className="text-[14px] leading-[24px] text-black">
              Если кнопка выше не работает, скопируйте и вставьте этот URL в ваш
              браузер:
            </Text>
            <Text className="mb-[20px]">
              <Link href={reauthorizeLink} className="text-black no-underline">
                <strong>{reauthorizeLink}</strong>
              </Link>
            </Text>

            <Hr className="mx-0 my-[26px] w-full border border-solid border-[#eaeaea]" />

            <Text className="text-[12px] leading-[24px] text-[#666666]">
              Это автоматическое уведомление от{" "}
              <Link href={env.APP_URL} className="text-[#666666]">
                {env.APP_NAME}
              </Link>
              . Если вам нужна помощь, обратитесь в службу поддержки.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

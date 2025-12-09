import { env } from "@qbs-autonaim/config";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Tailwind,
  Text,
} from "@react-email/components";

import { emailTailwindConfig } from "../tailwind";

export default function OtpSignInEmail({
  otp = "123456",
  isSignUp = false,
}: {
  otp: string;
  isSignUp?: boolean;
}) {
  const action = isSignUp ? "Регистрация" : "Вход";

  return (
    <Html>
      <Head />
      <Preview>{`Ваш код подтверждения для ${action === "Вход" ? "входа" : "регистрации"} - QBS Автонайм`}</Preview>
      <Tailwind config={emailTailwindConfig}>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-[40px] w-[465px] rounded border border-solid border-[#eaeaea] p-[20px]">
            <Heading className="mx-0 my-[30px] p-0 text-center text-[24px] font-normal text-black">
              {action} в{" "}
              <Link href={env.APP_URL} className="text-black">
                <strong>QBS Автонайм</strong>
              </Link>
            </Heading>
            <Text className="text-[14px] leading-[24px] text-black">
              Здравствуйте,
            </Text>
            <Text className="text-[14px] leading-[24px] text-black">
              Ваш одноразовый пароль (OTP) для{" "}
              {action === "Вход" ? "входа" : "регистрации"}:
            </Text>
            <Text className="my-[20px] text-center text-[24px] font-bold">
              {otp}
            </Text>
            <Text className="text-[14px] leading-[24px] text-black">
              Пожалуйста, используйте этот код для завершения процесса{" "}
              {action === "Вход" ? "входа" : "регистрации"}. Код действителен в
              течение 10 минут.
            </Text>
            <Text className="text-[14px] leading-[24px] text-black">
              Если вы не запрашивали этот код, просто проигнорируйте это письмо.
            </Text>
            <Hr className="mx-0 my-[26px] w-full border border-solid border-[#eaeaea]" />
            <Text className="text-[12px] leading-[24px] text-[#666666]">
              Это автоматическое сообщение от QBS Автонайм. Пожалуйста, не
              отвечайте на это письмо.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

"use client";

import {
  OnboardingBackground,
  OrganizationForm,
  ProgressIndicator,
  UserInfo,
  WelcomeScreen,
  WorkspaceForm,
} from "~/components/onboarding";
import { useOnboarding } from "~/hooks/use-onboarding";

export default function OnboardingPage() {
  const { step, organization, workspace, onGetStarted } = useOnboarding();

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <OnboardingBackground />

      <UserInfo />

      <div className="relative w-full max-w-md space-y-8">
        {step !== "welcome" && (
          <ProgressIndicator
            currentStep={step === "organization" ? "organization" : "workspace"}
          />
        )}

        {step === "welcome" && <WelcomeScreen onGetStarted={onGetStarted} />}

        {step === "organization" && <OrganizationForm {...organization} />}

        {step === "workspace" && <WorkspaceForm {...workspace} />}
      </div>
    </div>
  );
}

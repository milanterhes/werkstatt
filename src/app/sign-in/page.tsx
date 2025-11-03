"use client";
import { LoginForm } from "@/components/login-form";
import { SignupForm } from "@/components/signup-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryState } from "nuqs";

export default function SignIn() {
  const [tab, setTab] = useQueryState("tab");
  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <Tabs value={tab ?? undefined} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="signup">Sign up</TabsTrigger>
          <TabsTrigger value="signin">Sign in</TabsTrigger>
        </TabsList>
        <TabsContent value="signup">
          <SignupForm className="mx-32 my-12" />
        </TabsContent>
        <TabsContent value="signin">
          <LoginForm className="mx-32 my-12" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

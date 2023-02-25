import { EnvelopeIcon } from "@heroicons/react/24/outline";
import type { NextPage } from "next";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";

const SignIn: NextPage = () => {
  const [email, setEmail] = useState("");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-200 bg-[url('/background_pattern.svg')]">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
        <div className="flex w-full flex-col justify-evenly gap-5 rounded-xl border border-neutral-200 bg-neutral-300 p-10 md:w-1/2 lg:w-1/3">
          <input
            placeholder="example@email.com"
            className="rounded px-3 py-2 focus:outline-neutral-700"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            className="flex flex-row justify-evenly gap-4 rounded bg-white p-5 font-medium"
            onClick={() => {
              signIn("email", { email, callbackUrl: "/account/billing" });
            }}
          >
            <EnvelopeIcon height={25} />
            Sign In With Email
          </button>
          <div className="h-1 rounded bg-neutral-100" />
          <button
            className="flex flex-row justify-evenly gap-4 rounded bg-white p-5 font-medium"
            onClick={() =>
              signIn("google", { callbackUrl: "/account/billing" })
            }
          >
            <Image
              src="/google_g_logo.svg"
              height={25}
              width={25}
              alt="Google Logo"
            />
            <p>Sign In With Google</p>
          </button>
          <button
            className="flex flex-row justify-evenly gap-4 rounded bg-white p-5 font-medium"
            onClick={() =>
              signIn("github", { callbackUrl: "/account/billing" })
            }
          >
            <Image
              src="/github-mark.svg"
              height={25}
              width={25}
              alt="Google Logo"
            />
            <p>Sign In With GitHub</p>
          </button>
        </div>
      </div>
    </main>
  );
};

export default SignIn;

import type { NextPage } from "next";
import { signIn } from "next-auth/react";
import Image from "next/image";

const SignIn: NextPage = () => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-neutral-900 to-neutral-700">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
        <div className="flex w-full flex-col justify-evenly gap-5 rounded-xl border border-neutral-200 bg-neutral-100 p-10 md:w-1/2 lg:w-1/3 xl:w-1/4">
          <button
            className="flex flex-row justify-evenly gap-4 rounded bg-white p-5 font-medium"
            onClick={() => signIn("google", { callbackUrl: "/account" })}
          >
            <Image
              src="/google_g_logo.svg"
              height={25}
              width={25}
              alt="Google Logo"
            />
            <p>Sign In With Google</p>
          </button>
        </div>
      </div>
    </main>
  );
};

export default SignIn;

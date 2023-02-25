import type { NextPage } from "next";
import Link from "next/link";

const SignIn: NextPage = () => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-200 bg-[url('/background_pattern.svg')]">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
        <div className="flex w-full flex-col items-center justify-center gap-5 rounded-xl border border-neutral-200 bg-neutral-300 p-10 text-center text-neutral-800 md:w-1/2 lg:w-1/3">
          <h1 className="text-3xl font-bold">Check your email</h1>
          <p className="text-xl font-light">
            A sign in link has been sent to your email address.
          </p>
          <Link href="/" className="underline">
            Home
          </Link>
        </div>
      </div>
    </main>
  );
};

export default SignIn;

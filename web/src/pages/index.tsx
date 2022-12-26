import { type NextPage } from "next";
import { signIn, useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import Navbar from "../components/navbar";

const Home: NextPage = () => {
  const { data: sessionData } = useSession();
  const router = useRouter();

  return (
    <>
      <Head>
        <title>inquire</title>
        <meta
          name="description"
          content="Get the most out of your ai assistant"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-grow flex-col bg-gradient-to-tr from-neutral-300 to-neutral-100">
        <div className="flex flex-grow bg-[url('/background_pattern.svg')]">
          <div className="px-40">
            <Navbar />
            <div className="flex flex-grow flex-row items-center gap-12 pt-12 text-neutral-900">
              <div className="flex w-3/5 flex-col gap-12">
                <h1 className="text-5xl font-extrabold tracking-tight text-neutral-900 sm:text-[5rem]">
                  inquire
                </h1>
                <p className="text-2xl text-neutral-900/50">
                  Interact with a variety of ai personas to solve any problem
                  you have. Inquire makes sure you get the most out of your ai
                  assistant.
                </p>
                <div>
                  <button
                    className="rounded-xl bg-neutral-900/10 px-10 py-3 font-semibold text-neutral-900 no-underline transition hover:bg-neutral-900/20"
                    onClick={() => {
                      if (sessionData) {
                        router.push("/account");
                        return;
                      }
                      signIn(undefined, { callbackUrl: "/account" });
                    }}
                  >
                    {sessionData ? "Account" : "Sign Up"}
                  </button>
                </div>
              </div>
              {
                // TODO: add different text colors for commands and prompts
              }
              <div className="flex w-2/5">
                <div className="flex flex-col gap-12 rounded-xl bg-neutral-900 p-12 font-mono text-2xl text-white/75">
                  <div>
                    <p className="py-2">/trainer</p>
                    <p>How can I build muscle?</p>
                  </div>
                  <div>
                    <p className="py-2">/programmer</p>
                    <p>
                      What is the cause of this error? &apos;x&apos; is possibly
                      &apos;undefined&apos; .ts(18048)
                    </p>
                  </div>
                  <div>
                    <p className="py-2">/writer</p>
                    <p>What are the core elements of a good horror story?</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;

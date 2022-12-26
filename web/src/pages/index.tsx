import { type NextPage } from "next";
import Head from "next/head";
import AuthButton from "../components/auth-button";

const Home: NextPage = () => {
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
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-neutral-900 to-neutral-700">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            inquire
          </h1>

          <div className="flex flex-col items-center gap-2">
            <AuthButton />
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;

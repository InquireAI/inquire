import { type NextPage } from "next";
import Head from "next/head";
import { signIn, signOut, useSession } from "next-auth/react";

import { trpc } from "../utils/trpc";

const Home: NextPage = () => {
  const { data: user } = trpc.user.currentUser.useQuery();
  const { data: sessionDate } = useSession();

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
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-indigo-900 to-indigo-700">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            inquire
          </h1>

          <div className="flex flex-col items-center gap-2">
            <AuthShowcase />
            {sessionDate && (
              <ConnectTelegram telegramId={user?.telegramId ?? undefined} />
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;

const AuthShowcase: React.FC = () => {
  const { data: sessionData } = useSession();

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <button
        className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
        onClick={sessionData ? () => signOut() : () => signIn()}
      >
        {sessionData ? "Sign out" : "Sign in"}
      </button>
    </div>
  );
};

const ConnectTelegram: React.FC<{ telegramId?: string }> = ({ telegramId }) => {
  const { data: sessionData } = useSession();

  const utils = trpc.useContext();
  const { mutate: connectTelegramAccount } =
    trpc.telegram.connectTelegramAccount.useMutation({
      onSettled() {
        utils.user.currentUser.invalidate();
      },
    });

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <button
        className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
        onClick={() =>
          connectTelegramAccount({
            id: "jowjwoeifjwef",
            firstName: "",
            lastName: "",
            username: "",
            photoUrl: "",
            authDate: "",
            hash: "",
          })
        }
        disabled={!!telegramId || !sessionData}
      >
        {telegramId ? "Telegram Connected" : "Connect Telegram"}
      </button>
    </div>
  );
};

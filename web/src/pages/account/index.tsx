import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import React from "react";
import List from "../../components/list";
import { getServerAuthSession } from "../../server/common/get-server-auth-session";
import { trpc } from "../../utils/trpc";

type Props = InferGetServerSidePropsType<typeof getServerSideProps>;

const Account: NextPage<Props> = () => {
  const { data: user } = trpc.user.currentUser.useQuery();
  const { data: customer } = trpc.customer.customerByCurrentUser.useQuery();
  const { data: sessionDate } = useSession();

  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-indigo-900 to-indigo-700">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            Account
          </h1>
          <div className="flex flex-col items-center gap-2">
            {sessionDate && (
              <ConnectTelegram telegramId={user?.telegramId ?? undefined} />
            )}
            {!customer ? (
              <Subscribe />
            ) : (
              <List
                data={customer.subscriptions}
                renderChild={({ id, status }) => {
                  return (
                    <div>
                      <p>{id}</p>
                      <p>{status}</p>
                    </div>
                  );
                }}
              />
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default Account;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerAuthSession(ctx);

  if (!session) {
    return {
      redirect: {
        statusCode: 301,
        destination: "/",
      },
    };
  }

  return {
    props: {},
  };
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

const Subscribe: React.FC = () => {
  const { data: sessionData } = useSession();

  const { mutate: getPaymentLink } = trpc.stripe.getPaymentLink.useMutation({
    onSuccess(data) {
      window.location.replace(data.url);
    },
  });

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <button
        className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
        onClick={() =>
          getPaymentLink({
            redirectUrl: "http://localhost:3000/subscribed",
          })
        }
        disabled={!sessionData}
      >
        {"Subscribe"}
      </button>
    </div>
  );
};

import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import React from "react";
import AuthButton from "../../components/auth-button";
import List from "../../components/list";
import { getServerAuthSession } from "../../server/common/get-server-auth-session";
import { trpc } from "../../utils/trpc";
import { Fragment } from "react";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import {
  Bars3Icon,
  BellIcon,
  XMarkIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { useRouter } from "next/router";

const user = {
  name: "Tom Cook",
  email: "tom@example.com",
  imageUrl:
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
};
const navigation = [
  { name: "Billing", href: "#", current: true },
  { name: "Connections", href: "#", current: false },
];
const userNavigation = [{ name: "Sign out", href: "#" }];

type Props = InferGetServerSidePropsType<typeof getServerSideProps>;

const Account: NextPage<Props> = () => {
  const { data: user } = trpc.user.currentUser.useQuery();
  const { data: customer } = trpc.customer.customerByCurrentUser.useQuery();
  const { data: sessionDate } = useSession();

  return (
    <>
      {/* <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-indigo-900 to-indigo-700"> */}
      <Page />
      {/* <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            Account
          </h1>
          <div className="flex flex-col items-center gap-2">
            <AuthButton />
            {sessionDate && (
              <ConnectTelegram telegramId={user?.telegramId ?? undefined} />
            )}
            {!customer?.subscriptions.length ? (
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
        </div> */}
      {/* </main> */}
    </>
  );
};
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
const Page: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const router = useRouter();

  const lastPath = router.pathname.split("/").pop()?.charAt(0).toUpperCase();

  return (
    <div className="min-h-full">
      <Disclosure as="nav" className="bg-indigo-800">
        {({ open }) => (
          <>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between">
                <div className="flex items-center">
                  <div className="hidden md:block">
                    <div className="ml-10 flex items-baseline space-x-4">
                      {navigation.map((item) => (
                        <a
                          key={item.name}
                          href={item.href}
                          className={classNames(
                            item.current
                              ? "bg-indigo-900 text-white"
                              : "text-indigo-300 hover:bg-indigo-700 hover:text-white",
                            "rounded-md px-3 py-2 text-sm font-medium"
                          )}
                          aria-current={item.current ? "page" : undefined}
                        >
                          {item.name}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="ml-4 flex items-center md:ml-6">
                    {/* Profile dropdown */}
                    <button className="rounded-md bg-indigo-800 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-900">
                      Sign Out
                    </button>
                  </div>
                </div>
                <div className="-mr-2 flex md:hidden">
                  {/* Mobile menu button */}
                  <Disclosure.Button className="inline-flex items-center justify-center rounded-md bg-indigo-800 p-2 text-indigo-400 hover:bg-indigo-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-800">
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
              </div>
            </div>

            <Disclosure.Panel className="md:hidden">
              <div className="space-y-1 px-2 pt-2 pb-3 sm:px-3">
                {navigation.map((item) => (
                  <Disclosure.Button
                    key={item.name}
                    as="a"
                    href={item.href}
                    className={classNames(
                      item.current
                        ? "bg-indigo-900 text-white"
                        : "text-indigo-300 hover:bg-indigo-700 hover:text-white",
                      "block rounded-md px-3 py-2 text-base font-medium"
                    )}
                    aria-current={item.current ? "page" : undefined}
                  >
                    {item.name}
                  </Disclosure.Button>
                ))}
              </div>
              <div className="border-t border-indigo-700 pt-4 pb-3">
                <div className="mt-3 space-y-1 px-2">
                  {userNavigation.map((item) => (
                    <Disclosure.Button
                      key={item.name}
                      as="a"
                      href={item.href}
                      className="block rounded-md px-3 py-2 text-base font-medium text-indigo-400 hover:bg-indigo-700 hover:text-white"
                    >
                      {item.name}
                    </Disclosure.Button>
                  ))}
                </div>
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {"Billing"}
          </h1>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
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

  const { mutate: createCheckoutSession } =
    trpc.checkoutSession.createPremiumCheckoutSession.useMutation({
      onSuccess(data) {
        window.location.replace(data.url);
      },
    });

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <button
        className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
        onClick={() =>
          createCheckoutSession({
            successUrl: "http://localhost:3000/checkout/success",
            cancelUrl: "http://localhost:3000/checkout/canceled",
          })
        }
        disabled={!sessionData}
      >
        {"Subscribe"}
      </button>
    </div>
  );
};

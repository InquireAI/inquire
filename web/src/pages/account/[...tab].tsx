import { Tab } from "@headlessui/react";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { Fragment, useEffect, useState } from "react";
import { AccountLayout } from "../../components/account-layout";
import BillingTab from "../../components/billing-tab";
import ConnectionsTab from "../../components/connections-tab";
import { getServerAuthSession } from "../../server/common/get-server-auth-session";
import { classNames } from "../../utils/classnames";
import type { NextPageWithLayout } from "../_app";

type TabConfig = {
  name: string;
  component: React.ReactElement;
  href: string;
};

const Account: NextPageWithLayout<Props> = () => {
  const router = useRouter();

  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    const tabName = (router.query?.tab as string[])[0];

    let initialTab = 0;

    if (tabName === "billing") initialTab = 0;
    else if (tabName === "connections") initialTab = 1;
    else router.push("/404");

    setTabIndex(initialTab);
  }, [router, router.query?.tab]);

  const [tabs] = useState<TabConfig[]>([
    {
      name: "Billing",
      component: <BillingTab />,
      href: "/account/billing",
    },
    {
      name: "Connections",
      component: <ConnectionsTab />,
      href: "/account/connections",
    },
  ]);

  return (
    <>
      <main className="pt-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-row">
            <Tab.Group as={Fragment} vertical selectedIndex={tabIndex}>
              <Tab.List className="flex flex-col gap-4 space-y-1 rounded-xl p-1">
                {tabs.map((t, idx) => (
                  <Tab
                    key={idx}
                    className={({ selected }) =>
                      classNames(
                        "w-full px-2.5 text-left text-lg font-medium",
                        "focus:outline-none ",
                        selected
                          ? "border-r-2 border-neutral-900 text-neutral-900"
                          : "text-neutral-900/50 hover:text-neutral-900"
                      )
                    }
                  >
                    <Link href={t.href}>{t.name}</Link>
                  </Tab>
                ))}
              </Tab.List>
              <Tab.Panels as={Fragment}>
                {tabs.map((t, idx) => (
                  <Tab.Panel key={idx} className="flex flex-grow">
                    {t.component}
                  </Tab.Panel>
                ))}
              </Tab.Panels>
            </Tab.Group>
          </div>
        </div>
      </main>
    </>
  );
};

Account.getLayout = function getLayout(page: React.ReactElement) {
  return <AccountLayout>{page}</AccountLayout>;
};

export default Account;

type Props = InferGetServerSidePropsType<typeof getServerSideProps>;

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

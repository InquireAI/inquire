import { Tab } from "@headlessui/react";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import React, { Fragment, useState } from "react";
import { AccountLayout } from "../../components/account-layout";
import BillingTab from "../../components/billing-tab";
import ConnectionsTab from "../../components/connections-tab";
import { getServerAuthSession } from "../../server/common/get-server-auth-session";
import { classNames } from "../../utils/classnames";
import type { NextPageWithLayout } from "../_app";

type TabConfig = {
  name: string;
  component: React.ReactElement;
};

const Account: NextPageWithLayout<Props> = () => {
  const [tabs] = useState<TabConfig[]>([
    {
      name: "Billing",
      component: <BillingTab />,
    },
    {
      name: "Connections",
      component: <ConnectionsTab />,
    },
  ]);

  return (
    <>
      <main className="pt-20">
        <div className="mx-auto max-w-7xl">
          <Tab.Group as={"div"} vertical className="flex flex-row">
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
                        : "text-neutral-900/30 hover:text-neutral-900"
                    )
                  }
                >
                  {t.name}
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

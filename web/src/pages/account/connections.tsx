import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import React from "react";
import { AccountLayout } from "../../components/account-layout";
import { getServerAuthSession } from "../../server/common/get-server-auth-session";
import type { NextPageWithLayout } from "../_app";

const Connections: NextPageWithLayout<Props> = () => {
  return <div>connections</div>;
};

Connections.getLayout = function getLayout(page: React.ReactElement) {
  return <AccountLayout>{page}</AccountLayout>;
};

export default Connections;

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

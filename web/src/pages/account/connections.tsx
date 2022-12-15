import React from "react";
import { AccountLayout } from "../../components/account-layout";
import type { NextPageWithLayout } from "../_app";

const Connections: NextPageWithLayout = () => {
  return <div>test</div>;
};

Connections.getLayout = function getLayout(page: React.ReactElement) {
  return <AccountLayout>{page}</AccountLayout>;
};

export default Connections;

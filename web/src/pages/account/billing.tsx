import React from "react";
import { AccountLayout } from "../../components/account-layout";
import type { NextPageWithLayout } from "../_app";

const Billing: NextPageWithLayout = () => {
  return <div>test</div>;
};

Billing.getLayout = function getLayout(page: React.ReactElement) {
  return <AccountLayout>{page}</AccountLayout>;
};

export default Billing;

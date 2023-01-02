import { type NextPage } from "next";
import Error from "next/error";

const Page: NextPage = () => {
  return <Error statusCode={404} />;
};

export default Page;

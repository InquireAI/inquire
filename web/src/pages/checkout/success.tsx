import { type NextPage } from "next";

const CheckoutSuccess: NextPage = () => {
  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-neutral-900 to-neutral-700">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            Subscribed!
          </h1>
        </div>
      </main>
    </>
  );
};

export default CheckoutSuccess;

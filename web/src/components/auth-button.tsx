import { signIn, signOut, useSession } from "next-auth/react";

const AuthButton: React.FC = () => {
  const { data: sessionData } = useSession();

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <button
        className="rounded-xl bg-neutral-900/10 px-10 py-3 font-semibold text-neutral-900 no-underline transition hover:bg-neutral-900/20"
        onClick={
          sessionData
            ? () => signOut()
            : () => signIn(undefined, { callbackUrl: "/account" })
        }
      >
        {sessionData ? "Sign Out" : "Sign In"}
      </button>
    </div>
  );
};

export default AuthButton;

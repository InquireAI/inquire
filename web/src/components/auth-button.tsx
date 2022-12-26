import { signIn, signOut, useSession } from "next-auth/react";

const AuthButton: React.FC = () => {
  const { data: sessionData } = useSession();

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <button
        className="rounded-xl bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
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

import { useSession } from "next-auth/react";
import { trpc } from "../utils/trpc";

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

export default ConnectTelegram;

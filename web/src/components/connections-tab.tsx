import { trpc } from "../utils/trpc";
import Spinner from "./spinner";
import Switch from "./switch";
import TelegramLoginButton from "./telegram-login-button";

const ConnectionsTab: React.FC = () => {
  const {
    isLoading: isConnectTelegramAccountLoading,
    mutate: connectTelegramAccount,
  } = trpc.telegram.connectTelegramAccount.useMutation();

  return (
    <div className="flex min-h-full flex-grow flex-col px-10">
      <p className="text-3xl font-medium">Connections</p>
      <p className="font-medium text-neutral-700">
        Connect your inquire account with to get unlimited usage across all
        supported connections
      </p>
      <div className="flex min-h-full flex-grow flex-col items-center justify-center">
        <Switch
          isOn={!isConnectTelegramAccountLoading}
          onComponent={
            <TelegramLoginButton
              botName="inquireai_dev_bot"
              cornerRadius={5}
              dataOnauth={(res) => {
                console.log(res);
                connectTelegramAccount(res);
              }}
            />
          }
          offComponent={<Spinner />}
        />
      </div>
    </div>
  );
};

export default ConnectionsTab;

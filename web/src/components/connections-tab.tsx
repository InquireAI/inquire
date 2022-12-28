import TelegramLoginButton from "./telegram-login-button";

const ConnectionsTab: React.FC = () => {
  return (
    <div>
      <TelegramLoginButton
        botName="inquireai_dev_bot"
        dataOnauth={(res) => console.log(res)}
      />
      Connections
    </div>
  );
};

export default ConnectionsTab;

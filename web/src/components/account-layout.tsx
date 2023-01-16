import Navbar from "./navbar";

export const AccountLayout: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-tr from-neutral-300 to-neutral-100">
      <div className="px-10 xl:px-40">
        <Navbar />
        {children}
      </div>
    </div>
  );
};

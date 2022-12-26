import Link from "next/link";
import AuthButton from "./auth-button";

const Navbar: React.FC = () => {
  return (
    <div className="flex items-center justify-between py-6 md:justify-start md:space-x-10">
      <div className="flex justify-start text-xl text-neutral-900 lg:w-0 lg:flex-1">
        <Link className="font-medium" href="/">
          inquire
        </Link>
        {/* <Image
              className="rounded-lg"
              height={75}
              width={75}
              src="/inquire_logo.png"
              alt="Inquire Logo"
              TODO: replace with logo
            /> */}
      </div>
      <div className="hidden items-center justify-end md:flex md:flex-1 lg:w-0">
        <AuthButton />
      </div>
    </div>
  );
};

export default Navbar;

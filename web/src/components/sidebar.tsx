import React from "react";

import { CurrencyDollarIcon } from "@heroicons/react/24/outline";

const navMenuLinks = [
  { name: "Stations", href: "/evses", icon: CurrencyDollarIcon },
  { name: "Locations", href: "/locations", icon: CurrencyDollarIcon },
  { name: "Drivers", href: "/drivers", icon: CurrencyDollarIcon },
  { name: "Site Partners", href: "/sitepartners", icon: CurrencyDollarIcon },
  { name: "Site Host Users", href: "/users", icon: CurrencyDollarIcon },
  { name: "Rates", href: "/rates", icon: CurrencyDollarIcon },
];

const Sidebar: React.FunctionComponent = () => {
  return (
    <div className="disable-scrollbar w-44 bg-gray-800">
      <div className="flex h-full w-full flex-col items-center overflow-x-visible">
        <nav className="w-full flex-1 list-none space-y-1 px-2">
          {navMenuLinks.map((item, index) => (
            <li key={index} className="w-full text-left">
              <div>
                <item.icon
                  className={"text-primary-600 mr-2 h-6 flex-initial"}
                  aria-hidden="true"
                />
                <span className="flex-grow">{item.name}</span>
              </div>
            </li>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;

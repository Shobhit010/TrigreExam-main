
import React, { useState } from "react";

const OnOffButton: React.FC = () => {
  const [isToggled, setIsToggled] = useState(false);

  const handleToggle = () => {
    setIsToggled(!isToggled);
  };

  return (
    <>
      <button
        className={`inline-block py-[10px] px-[30px] text-white transition-all rounded-md border ltr:mr-[11px] rtl:ml-[11px] mb-[15px] ${
          isToggled
            ? "bg-green-500 border-green-500 hover:bg-green-600 hover:border-green-600"
            : "bg-primary-500 border-primary-500 hover:bg-primary-400 hover:border-primary-400"
        }`}
        type="button"
        onClick={handleToggle}
        aria-pressed={isToggled}
      >
        {isToggled ? "On" : "Off"}
      </button>
    </>
  );
};

export default OnOffButton;

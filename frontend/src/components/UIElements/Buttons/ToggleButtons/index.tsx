
import React from "react";
import OnOffButton from "./OnOffButton";
import BasicToggle from "./BasicToggle";
import CheckedState from "./CheckedState";
import DisabledState from "./DisabledState";
import ColorsToggle from "./ColorsToggle";

const ToggleButtons: React.FC = () => {
  return (
    <>
      <div className="trezo-card bg-white dark:bg-[#0c1427] p-[20px] md:p-[25px] rounded-md">
        <div className="trezo-card-header mb-[20px] flex items-center justify-between">
          <div className="trezo-card-title">
            <h5 className="!mb-0">Tuggle Buttons</h5>
          </div>
        </div>
        <div className="trezo-card-content flex flex-col gap-[25px]">
          <OnOffButton />

          <BasicToggle />

          <CheckedState />

          <DisabledState />

          <ColorsToggle />
        </div>
      </div>
    </>
  );
};

export default ToggleButtons;

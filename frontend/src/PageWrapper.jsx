import React from "react";

const PageWrapper = ({ children }) => {
  return (
    <div className="animate-in fade-in duration-700 fill-mode-both">
      {children}
    </div>
  );
};

export default PageWrapper;
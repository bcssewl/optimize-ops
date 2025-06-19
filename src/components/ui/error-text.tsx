import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

interface ErrorTextProps {
  children: React.ReactNode;
}

const ErrorText = ({ children }: ErrorTextProps) => (
  <div className="flex items-start gap-1 justify-start mt-1">
    <FontAwesomeIcon
      icon={faCircleExclamation}
      aria-hidden="true"
      style={{ color: "#CB0404", maxWidth: 12, maxHeight: 12 }}
      className="pt-1"
    />
    <span
      className="text-sm font-regular"
      style={{ color: "#CB0404" }}
      role="alert"
    >
      {children}
    </span>
  </div>
);

export default ErrorText;

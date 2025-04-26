import { SVGProps } from "react";

export function LogoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M12 2L17 7H14V12H10V7H7L12 2Z" fill="currentColor" />
      <path d="M19 12H22L16 19L10 12H13V7H19V12Z" fill="currentColor" />
      <path d="M5 12H2L8 19L14 12H11V7H5V12Z" fill="currentColor" />
    </svg>
  );
}

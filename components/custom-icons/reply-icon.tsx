export default function ReplyIcon({ size }: { size: string }) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        fill="none"
        id="reply"
        viewBox="0 0 16 16"
      >
        <path fill="url(#a)" d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0Z"></path>
        <path
          fill="#fff"
          d="M6.5 4.5c.2.2.2.5 0 .7L4.7 7h4.8c1.8 0 3.5 1.2 4 3 .1.3-.2.6-.5.6-.3 0-.6-.2-.7-.5-.4-1.3-1.5-2.1-2.8-2.1H4.7l1.8 1.8c.2.2.2.5 0 .7-.2.2-.5.2-.7 0L3 7.4c-.3-.3-.3-.7 0-1l2.8-2.7c.2-.2.5-.2.7 0Z"
        ></path>
        <defs>
          <linearGradient id="a" x1="8" x2="8" y2="16" gradientUnits="userSpaceOnUse">
            <stop stopColor="#18AFFF"></stop>
            <stop offset="1" stopColor="#0062DF"></stop>
          </linearGradient>
        </defs>
      </svg>
    );
  }
  
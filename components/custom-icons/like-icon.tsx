export default function LikeIcon({ size }: { size: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="none" id="like" viewBox="0 0 16 16">
      <path fill="url(#a)" d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0Z"></path>
      <path
        fill="#fff"
        d="M12.162 7.338c.176.123.338.245.338.674 0 .43-.229.604-.474.725.1.163.132.36.089.546-.077.344-.392.611-.672.69.121.194.159.385.015.62-.185.295-.346.407-1.058.407H7.5c-.988 0-1.5-.546-1.5-1V7.665c0-1.23 1.467-2.275 1.467-3.13L7.361 3.47c-.005-.065.008-.224.058-.27.08-.079.301-.2.635-.2.218 0 .363.041.534.123.581.277.732.978.732 1.542 0 .271-.414 1.083-.47 1.364 0 0 .867-.192 1.879-.199 1.061-.006 1.749.19 1.749.842 0 .261-.219.523-.316.666ZM3.6 7h.8a.6.6 0 0 1 .6.6v3.8a.6.6 0 0 1-.6.6h-.8a.6.6 0 0 1-.6-.6V7.6a.6.6 0 0 1 .6-.6Z"
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

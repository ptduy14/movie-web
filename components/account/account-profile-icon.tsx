import AccountDefaultImg from "../../public/account-default-img.jpg"
import Image from "next/image";
import AccountProfileDropdown from "./account-profile-dropdown";
import { useSelector } from "react-redux";

export default function AccountProfileIcon() {
  const user = useSelector((state: any) => state.account.user);
  if (!user) return;
  
  return (
    <>
      <Image
        src={user.photo || AccountDefaultImg} // Đường dẫn tới hình ảnh
        alt="User Profile"
        className="cursor-pointer hover:text-custome-red] transition duration-200 rounded-full"
        width={25}
        height={25}
      />
      <AccountProfileDropdown />
    </>
  );
}

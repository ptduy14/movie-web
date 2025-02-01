import AccountDefaultImg from "../../public/account-default-img.jpg"
import Image from "next/image";
import AccountProfileDropdown from "./account-profile-dropdown";

export default function AccountProfileIcon({authenticatedUser}: {authenticatedUser: any}) {
  return (
    <>
      <Image
        src={authenticatedUser.photo || AccountDefaultImg} // Đường dẫn tới hình ảnh
        alt="User Profile"
        className="cursor-pointer hover:text-custome-red] transition duration-200 rounded-full"
        width={25}
        height={25}
      />
      <AccountProfileDropdown authenticatedUser={authenticatedUser}/>
    </>
  );
}

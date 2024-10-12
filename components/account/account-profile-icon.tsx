import AccountDefaultImg from "../../public/account-default-img.jpg"
import Image from "next/image";
import AccountProfileDropdown from "./account-profile-dropdown";

export default function AccountProfileIcon() {
  return (
    <>
      <Image
        src={AccountDefaultImg} // Đường dẫn tới hình ảnh
        alt="User Profile"
        className="cursor-pointer hover:text-[#e10711] transition duration-200 rounded-full"
        style={{ width: '25px', height: '25px' }} // Kích thước tương tự như biểu tượng
        //onClick={toggleDropdown}
      />
      <AccountProfileDropdown />
    </>
  );
}

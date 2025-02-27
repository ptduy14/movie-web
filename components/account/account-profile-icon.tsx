import AccountDefaultImg from '../../public/account-default-img.jpg';
import Image from 'next/image';
import AccountProfileDropdown from './account-profile-dropdown';
import { useEffect, useState } from 'react';
import { IAccountDropdownState } from 'types/account-dropdown';
import { useDropdown } from '../context/dropdown-context';

export default function AccountProfileIcon({
  authenticatedUser,
  isOnFixedHeader,
}: {
  authenticatedUser: any;
  isOnFixedHeader: boolean;
}) {
  const {accountDropdownState, toogleSetAccountDropdownState} = useDropdown();

  const isOpen = isOnFixedHeader
    ? accountDropdownState.isOpenInHeaderFixed
    : accountDropdownState.isOpenInHeaderDefault;

  return (
    <div className='relative h-full flex items-center'>
      <Image
        src={authenticatedUser.photo || AccountDefaultImg} // Đường dẫn tới hình ảnh
        alt="User Profile"
        className="cursor-pointer hover:text-custome-red transition duration-200 rounded-full"
        width={25}
        height={25}
        onClick={() => toogleSetAccountDropdownState(isOnFixedHeader)}
      />
      {isOpen && <AccountProfileDropdown authenticatedUser={authenticatedUser} />}
    </div>
  );
}

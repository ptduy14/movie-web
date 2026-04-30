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
  const { accountDropdownState, toogleSetAccountDropdownState } = useDropdown();

  const isOpen = isOnFixedHeader
    ? accountDropdownState.isOpenInHeaderFixed
    : accountDropdownState.isOpenInHeaderDefault;

  return (
    <div className="relative h-full flex items-center">
      <div className="relative group">
        <Image
          src={authenticatedUser.photo || AccountDefaultImg}
          alt="User Profile"
          className="cursor-pointer hover:ring-2 hover:ring-custome-red/50 transition-all duration-200 rounded-full border-2 border-transparent hover:border-custome-red/30"
          width={32}
          height={32}
          onClick={() => toogleSetAccountDropdownState(isOnFixedHeader)}
        />
        {/* Online indicator */}
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-black rounded-full"></div>
      </div>
      {isOpen && <AccountProfileDropdown authenticatedUser={authenticatedUser} />}
    </div>
  );
}

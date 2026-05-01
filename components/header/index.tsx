'use client';
import { useEffect, useState } from 'react';
import HeaderDefault from './header-default';
import HeaderFixed from './header-fixed';
import HeaderMobile from './header-mobile';
import { INotificationDropdownState } from 'types/notification';
import { useDropdown } from '../context/dropdown-context';
import { IAccountDropdownState } from 'types/account-dropdown';

export default function Header() {
  const { setAccountDropdownState, setNotificationDropdownState, notificationDropdownState } =
    useDropdown();
  const [isShowFixedHeader, setIsShowFixedHeader] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsShowFixedHeader(true);
        setNotificationDropdownState((prev: INotificationDropdownState) => ({
          ...prev,
          isOpenInHeaderDefault: false,
        }));

        setAccountDropdownState((prev: IAccountDropdownState) => ({
          ...prev,
          isOpenInHeaderDefault: false,
        }));
      } else if (window.scrollY === 0) {
        setIsShowFixedHeader(false);
        setNotificationDropdownState((prev: INotificationDropdownState) => ({
          ...prev,
          isOpenInHeaderFixed: false,
        }));

        setAccountDropdownState((prev: IAccountDropdownState) => ({
          ...prev,
          isOpenInHeaderFixed: false,
        }));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [setAccountDropdownState, setNotificationDropdownState]);

  return (
    <>
      {/* Mobile header — visible below lg breakpoint (< 1024px) */}
      <div className="lg:hidden">
        <HeaderMobile
          isShowFixedHeader={isShowFixedHeader}
          notificationDropdownState={notificationDropdownState}
          setNotificationDropdownState={setNotificationDropdownState}
        />
      </div>

      {/* Desktop header — visible at lg+ */}
      <div className="hidden lg:block">
        <HeaderDefault
          isShowFixedHeader={isShowFixedHeader}
          notificationDropdownState={notificationDropdownState}
          setNotificationDropdownState={setNotificationDropdownState}
        />
        <HeaderFixed
          isShowFixedHeader={isShowFixedHeader}
          notificationDropdownState={notificationDropdownState}
          setNotificationDropdownState={setNotificationDropdownState}
        />
      </div>
    </>
  );
}

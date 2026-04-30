'use client';
import { useEffect, useState } from 'react';
import HeaderDefault from './header-default';
import HeaderFixed from './header-fixed';
import HeaderMobile from './header-mobile';
import { INotificationDropdownState } from 'types/notification';
import { useDropdown } from '../context/dropdown-context';
import { IAccountDropdownState } from 'types/account-dropdown';
import { useHomePageLoadingContext } from '../context/home-page-loading-context';

export default function Header() {
  const { setAccountDropdownState, setNotificationDropdownState, notificationDropdownState } =
    useDropdown();
  const { isLoadingHomePage } = useHomePageLoadingContext();
  const [isShowFixedHeader, setIsShowFixedHeader] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

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
      } else {
        if (window.scrollY == 0) {
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
      }
    };

    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    // Initial check - ensure mobile detection happens immediately
    handleResize();

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [setAccountDropdownState, setNotificationDropdownState]);

  // Separate effect to ensure mobile detection is correct during loading
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth < 1024);
    }
  }, [isLoadingHomePage]);

  return (
    <>
      {isMobile ? (
        <HeaderMobile
          isShowFixedHeader={isShowFixedHeader}
          notificationDropdownState={notificationDropdownState}
          setNotificationDropdownState={setNotificationDropdownState}
        />
      ) : (
        <>
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
        </>
      )}
    </>
  );
}

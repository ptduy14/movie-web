'use client';
import { useEffect, useState } from 'react';
import HeaderDefault from './header-default';
import HeaderFixed from './header-fixed';
import { INotificationDropdownState } from 'types/notification';

export default function Header() {
  const [isShowFixedHeader, setIsShowFixedHeader] = useState<boolean>(false);
  const [notificationDropdownState, setNotificationDropdownState] =
    useState<INotificationDropdownState>({
      isOpenInHeaderDefault: false,
      isOpenInHeaderFixed: false,
    });

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsShowFixedHeader(true);
        setNotificationDropdownState((prev: INotificationDropdownState) => ({
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
        }
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
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
  );
}

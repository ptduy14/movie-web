import React, { createContext, useContext, useState } from 'react';
import { IAccountDropdownState } from 'types/account-dropdown';
import { INotificationDropdownState } from 'types/notification';

interface IDropdownContextType {
  accountDropdownState: IAccountDropdownState;
  setAccountDropdownState: React.Dispatch<React.SetStateAction<IAccountDropdownState>>;
  notificationDropdownState: INotificationDropdownState;
  setNotificationDropdownState: React.Dispatch<React.SetStateAction<INotificationDropdownState>>;
  toogleSetAccountDropdownState: (isOnFixedHeader: boolean) => void;
  toogleSetNotificationDropdownState: (isOnFixedHeader: boolean) => void;
}

const DropdownContext = createContext<IDropdownContextType | undefined>(undefined);

export const DropdownProvider = ({ children }: { children: React.ReactNode }) => {
  const [notificationDropdownState, setNotificationDropdownState] =
    useState<INotificationDropdownState>({
      isOpenInHeaderDefault: false,
      isOpenInHeaderFixed: false,
    });
  const [accountDropdownState, setAccountDropdownState] = useState<IAccountDropdownState>({
    isOpenInHeaderDefault: false,
    isOpenInHeaderFixed: false,
  });

  const toogleSetAccountDropdownState = (isOnFixedHeader: boolean) => {
    // check toogle base on position click
    if (!isOnFixedHeader) {
      setAccountDropdownState((prev: IAccountDropdownState) => ({
        isOpenInHeaderFixed: false,
        isOpenInHeaderDefault: !prev.isOpenInHeaderDefault,
      }));

      return;
    }

    setAccountDropdownState((prev: IAccountDropdownState) => ({
      isOpenInHeaderDefault: false,
      isOpenInHeaderFixed: !prev.isOpenInHeaderFixed,
    }));
  };

  const toogleSetNotificationDropdownState = (isOnFixedHeader: boolean) => {
    // check toogle base on position click
    if (isOnFixedHeader) {
      setNotificationDropdownState((prev: INotificationDropdownState) => ({
        ...prev,
        isOpenInHeaderFixed: !prev.isOpenInHeaderFixed,
      }));

      return;
    }

    setNotificationDropdownState((prev: INotificationDropdownState) => ({
      ...prev,
      isOpenInHeaderDefault: !prev.isOpenInHeaderDefault,
    }));
  };

  const contextValue: IDropdownContextType = {
    notificationDropdownState,
    setNotificationDropdownState,
    accountDropdownState,
    setAccountDropdownState,
    toogleSetAccountDropdownState,
    toogleSetNotificationDropdownState,
  };

  return <DropdownContext.Provider value={contextValue}>{children}</DropdownContext.Provider>;
};

export const useDropdown = () => {
  const context = useContext(DropdownContext);

  if (!context) throw new Error('useDropdown must be used within DropdownProvider');
  return context;
};

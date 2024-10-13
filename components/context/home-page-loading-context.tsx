import { createContext, useContext, useState } from 'react';

interface HomePageLoadingContextType {
  isLoadingHomePage: boolean;
  setISLoadingHomePage: React.Dispatch<React.SetStateAction<boolean>>;
}

const HomePageLoadingContext = createContext<undefined | HomePageLoadingContextType>(undefined);

export default function HomePageLoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoadingHomePage, setISLoadingHomePage] = useState<boolean>(true);

  return (
    <HomePageLoadingContext.Provider value={{ isLoadingHomePage, setISLoadingHomePage }}>
      {children}
    </HomePageLoadingContext.Provider>
  );
}

export const useHomePageLoadingContext = () => {
  const context = useContext(HomePageLoadingContext);

  if (!context) {
    throw new Error('useHomePageLoadingContext must be used within an HomePageLoadingProvider');
  }
  return context;
};

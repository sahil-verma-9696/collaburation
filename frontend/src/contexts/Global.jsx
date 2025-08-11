import { createContext, useContext, useState } from "react";

const GlobalContext = createContext({
  user: null,
  setUser: () => {},
});

export const GlobalContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  return (
    <GlobalContext.Provider value={{ user, setUser }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => useContext(GlobalContext);

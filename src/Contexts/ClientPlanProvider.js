import { createContext, useContext, useState } from 'react';

export const ClientPlanContext = createContext();

export function ClientPlanProvider({ children }) {
  const [clientPlan, setClientPlan] = useState(null);
  return (
    <ClientPlanContext.Provider value={{ clientPlan, setClientPlan }}>
      {children}
    </ClientPlanContext.Provider>
  );
}

export function useClientPlan() {
  return useContext(ClientPlanContext);
}
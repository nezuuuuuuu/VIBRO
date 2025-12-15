// // src/context/OfflineModeContext.js
// import React, { createContext, useState, useContext } from 'react';

// const OfflineModeContext = createContext(undefined); // Initialize with undefined

// export const OfflineModeProvider = ({ children }) => {
//   const [isOfflineMode, setIsOfflineMode] = useState(false); // Default to online

//   const toggleOfflineMode = () => {
//     setIsOfflineMode(prevMode => !prevMode);
//   };

//   return (
//     <OfflineModeContext.Provider value={{ isOfflineMode, toggleOfflineMode }}>
//       {children}
//     </OfflineModeContext.Provider>
//   );
// };


// export const useOfflineMode = () => {
//   const context = useContext(OfflineModeContext);
//   if (context === undefined) {
//     throw new Error('useOfflineMode must be used within an OfflineModeProvider');
//   }
//   return context;
// };
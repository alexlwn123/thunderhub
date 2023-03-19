// import React, { createContext, useContext, useReducer } from 'react';
// import { Message } from '../../src/graphql/types';

// export interface Profile {
//   isSent?: boolean;
//   feePaid?: number;
// }

// type State = {
//   initialized: boolean;
//   chats: Message[];
//   following: Profile[];
//   nsec: string;
//   npub: string;
// };

// type ActionType =
//   | {
//       type: 'initialized'; // All info is cached
//       chats?: Message[];
//       lastNostr?: string;
//       sender?: string;
//     }
//   | {
//       type: 'cached'; // nsec is cached
//       sender: string;
//       userId: string;
//     }
//   | {
//       type: 'loaded'; // User pastes in nsec
//       nsec: string;
//     }
//   | {
//       type: 'created'; // Generates new nsec
//     }
//   | {
//       type: 'disconnected';
//     };

// type Dispatch = (action: ActionType) => void;

// const StateContext = createContext<State | undefined>(undefined);
// const DispatchContext = createContext<Dispatch | undefined>(undefined);

// const initialState: State = {
//   initialized: false,
//   chats: [],
//   following: [],
//   nsec: '',
//   npub: '',
// };

// const stateReducer = (state: State, action: ActionType): State => {
//   switch (action.type) {
//     case 'initialized':
//       return {
//         ...state,
//         initialized: true,
//         ...action,
//       };
//     case 'cached':
//       return {
//         ...state,
//         initialized: true,
//         chats: [...state.chats, ...action.chats],
//         lastNostr: action.lastNostr,
//       };
//     case 'changeActive':
//       return {
//         ...state,
//         sender: action.sender,
//       };
//     case 'newNostr':
//       localStorage.setItem(
//         `${action.userId}-sentNostrs`,
//         JSON.stringify([...state.sentNostrs, action.newNostr])
//       );
//       return {
//         ...state,
//         sentNostrs: [...state.sentNostrs, action.newNostr],
//         ...(action.sender && { sender: action.sender }),
//       };
//     case 'disconnected':
//       return initialState;
//     default:
//       return state;
//   }
// };

// const NostrProvider: React.FC = ({ children }) => {
//   const [state, dispatch] = useReducer(stateReducer, initialState);

//   return (
//     <DispatchContext.Provider value={dispatch}>
//       <StateContext.Provider value={state}>{children}</StateContext.Provider>
//     </DispatchContext.Provider>
//   );
// };

// const useNostrState = () => {
//   const context = useContext(StateContext);
//   if (context === undefined) {
//     throw new Error('useNostrState must be used within a NostrProvider');
//   }
//   return context;
// };

// const useNostrDispatch = () => {
//   const context = useContext(DispatchContext);
//   if (context === undefined) {
//     throw new Error('useNostrDispatch must be used within a NostrProvider');
//   }
//   return context;
// };

// export { NostrProvider, useNostrState, useNostrDispatch };

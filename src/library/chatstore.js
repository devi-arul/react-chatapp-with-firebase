import { create } from 'zustand';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useUserStore } from './userstore';

export const useChatStore = create((set) => ({
  chatId: null, 
  user: null,
  isCurrentUserBlocked: false,
  isReceiverBlocked: false,
 
  changeChat: (chatId,user)=>{
     const currentUser = useUserStore.getState().currentUser;

     if (!chatId || !user) {
         console.log("Invalid chat data:", { chatId, user });
         return;
     }

     if (!currentUser) {
         console.log("No current user found");
         return;
     }

     // CHECK THAT THE CURRENT USER IS BLOCKED
    if(user.blocked.includes(currentUser.id)){
        return set ({
            chatId, 
            user: null,
            isCurrentUserBlocked: true,
            isReceiverBlocked: false,
        });
    }


     //CHECK THAT THE REVEICER IS BLOCKED
     else if (currentUser.blocked.includes(user.id)) {
        return set ({
            chatId, 
            user: user,
            isCurrentUserBlocked: false,
            isReceiverBlocked: true,
        });
    } else {
        return set({
            chatId,
            user,
            isCurrentUserBlocked: false,
            isReceiverBlocked: false,
        });
    }

     
    },
  
    changeBlock: () => {
        set((state) => ({...state, isReceiverBlocked : !state.isReceiverBlocked}));
    },

    resetChat: () => {
        set({
            chatId: null,
            user: null,
            isCurrentUserBlocked: false,
            isReceiverBlocked: false,
        });
    }
}));

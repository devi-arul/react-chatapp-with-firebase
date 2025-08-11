import { create } from 'zustand';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const useUserStore = create((set) => ({
  currentUser: null, 
  isLoading: true,
  fetchUserInfo: async (uid)=>{
    if(!uid) return set({currentUser:null, isLoading:false});

    try{        
        const docRef = doc(db, "Users", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const user = docSnap.data();
            // Ensure Userschats doc exists for the user
            const userChatsRef = doc(db, "Userschats", uid);
            const userChatsSnap = await getDoc(userChatsRef);
            if (!userChatsSnap.exists()) {
                await setDoc(userChatsRef, { chats: [] });
            }
            set({ currentUser: user, isLoading: false });
        } else {
            // Auto-provision a basic user profile on first login
            const email = auth.currentUser?.email || "";
            const fallbackUsername = email ? email.split('@')[0] : "User";
            const newUser = {
                Username: fallbackUsername,
                Email: email,
                id: uid,
                blocked: [],
            };

            await setDoc(doc(db, "Users", uid), newUser);
            await setDoc(doc(db, "Userschats", uid), { chats: [] });
            set({ currentUser: newUser, isLoading: false });
        }
    }catch(err){
        return set({currentUser:null, isLoading:false});
    }
  },
}));

import "./adduser.css";
import { collection, getDocs, query, where, doc, updateDoc, arrayUnion, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "../../../../library/firebase";
import { useState } from "react";
import { useUserStore } from "../../../../library/userstore";
import { toast } from "react-toastify";

const AddUser = () =>{
    const [user,setUser] = useState(null);
    const [isExistingChat, setIsExistingChat] = useState(false);
    const {currentUser} = useUserStore();

    const handleSearch = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const username = formData.get("username");

        try{
            const userRef = collection(db, "Users");
            const q = query(userRef, where("Username", "==", username));
            const querySnapShot = await getDocs(q);

            if(!querySnapShot.empty){
                const foundUser = querySnapShot.docs[0].data();
                setUser(foundUser);

                // Check if user was previously in chat list
                const userChatsRef = doc(db, "Userschats", currentUser.id);
                const userChatsSnap = await getDoc(userChatsRef);
                
                if (userChatsSnap.exists()) {
                    const userChats = userChatsSnap.data().chats || [];
                    const hasPreviousChat = userChats.some(chat => chat.receiverId === foundUser.id);
                    setIsExistingChat(hasPreviousChat);
                }
            } else {
                setUser(null);
                setIsExistingChat(false);
                toast.error("User not found");
            }
        } catch (err) {
            console.log(err);
            toast.error("Error searching for user");
        }
    };

    const handleAdd = async() => {
        if (!user || !currentUser) return;

        try {
            const userChatsRef = doc(db, "Userschats", currentUser.id);
            const userChatsSnap = await getDoc(userChatsRef);
            
            if (userChatsSnap.exists()) {
                const userChats = userChatsSnap.data().chats || [];
                const existingChat = userChats.find(chat => chat.receiverId === user.id);

                if (existingChat) {
                    // If chat exists, just update the timestamp
                    const updatedChats = userChats.map(chat => 
                        chat.receiverId === user.id 
                            ? { ...chat, updatedAt: Date.now() }
                            : chat
                    );

                    await updateDoc(userChatsRef, {
                        chats: updatedChats
                    });

                    toast.success("Chat restored successfully");
                } else {
                    // Create new chat if it doesn't exist
                    const chatRef = collection(db, "chats");
                    const newChatRef = doc(chatRef);

                    await setDoc(newChatRef, {
                        createdAt: serverTimestamp(),
                        messages: [],
                    });

                    await updateDoc(doc(db, "Userschats", user.id), {
                        chats: arrayUnion({
                            chatId: newChatRef.id,
                            lastMessage: "",
                            receiverId: currentUser.id,
                            updatedAt: Date.now(),
                        }),
                    });

                    await updateDoc(userChatsRef, {
                        chats: arrayUnion({
                            chatId: newChatRef.id,
                            lastMessage: "",
                            receiverId: user.id,
                            updatedAt: Date.now(),
                        }),
                    });

                    toast.success("New chat created successfully");
                }
            }
        } catch(err) {
            console.log(err);
            toast.error("Error creating chat");
        }
    };

    return (
        <div className="adduser">
            <form onSubmit={handleSearch}>
                <input type="text" placeholder="Username" name="username" />
                <button type="submit">Search</button>
            </form>
            {user && (
                <div className="user">
                    <div className="detail">
                        <img src={user.avatar || "./avatar.png"} alt="" />
                        <span>{user.Username}</span>
                    </div>
                    <button onClick={handleAdd}>
                        {isExistingChat ? "Restore Chat" : "Add User"}
                    </button>
                </div>
            )}
        </div>
    );
};

export default AddUser;
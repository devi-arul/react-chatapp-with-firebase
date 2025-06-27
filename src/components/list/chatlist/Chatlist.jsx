import { useEffect, useState } from "react";
import "./chatList.css";
import AddUser from "./addUser/addUser";
import { useUserStore } from "../../../library/userstore";
import { doc, onSnapshot, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../library/firebase";
import { useChatStore } from "../../../library/chatstore";

const Chatlist = () => {
    const [chats, setChats] = useState([]);
    const [addMode, setAddMode] = useState(false);
    const [input, setInput] = useState("");
    const {currentUser} = useUserStore();
    const {chatId,changeChat} = useChatStore();


    useEffect(() => {
        if (!currentUser?.id) {
            console.log("currentUser.id is undefined");
            return;
        }

        console.log("Setting up chat listener for user:", currentUser.id);

        // Get user's chats
        const unSub = onSnapshot(doc(db, "Userschats", currentUser.id), async (docSnap) => {
            console.log("Received snapshot update");
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                console.log("Raw chat data from Firestore:", data);

                if (!data.chats || !Array.isArray(data.chats)) {
                    console.log("No chats array found in data");
                    setChats([]);
                    return;
                }

                console.log("Processing", data.chats.length, "chats");

                // Get details for each chat
                const chatDetails = await Promise.all(
                    data.chats.map(async (chat) => {
                        console.log("Processing chat object:", chat);
                        
                        if (!chat.receiverId) {
                            console.log("No receiverId found in chat object");
                            return chat;
                        }

                        try {
                            const userDocRef = doc(db, "Users", chat.receiverId);
                            console.log("Fetching user document for ID:", chat.receiverId);
                            const userDocSnap = await getDoc(userDocRef);
                            
                            if (userDocSnap.exists()) {
                                const userData = userDocSnap.data();
                                console.log("Found user data:", userData);
                                
                                // Create a new object with all the data
                                const chatWithUserData = {
                                    ...chat,
                                    user: userData  // Store the entire user object
                                };
                                console.log("Combined chat and user data:", chatWithUserData);
                                return chatWithUserData;
                            } else {
                                console.log("No user document found for ID:", chat.receiverId);
                                return {
                                    ...chat,
                                    user: { Username: "Unknown User" }
                                };
                            }
                        } catch (error) {
                            console.log("Error fetching user data:", error);
                            return {
                                ...chat,
                                user: { Username: "Unknown User" }
                            };
                        }
                    })
                );

                console.log("Final processed chat details:", chatDetails);
                setChats(chatDetails);
            } else {
                console.log("No chat document exists for user");
                setChats([]);
            }
        });

        return () => {
            console.log("Cleaning up chat listener");
            unSub();
        };
    }, [currentUser?.id]);

    console.log("Current user:", currentUser);
    console.log("Current chats state:", chats);

    const handleSelect = async(chat)=>{
        const userChats = chats.map((item)=>{
            const {user,...rest} = item;
            return rest;
        });

        const chatIndex = userChats.findIndex(
            (item)=>item.chatId === chat.chatId
        );
        
        userChats[chatIndex].isSeen = true;

        const userChatRef = doc(db,"Userschats",currentUser.id);

        try{
            await updateDoc(userChatRef,{
                chats:userChats,
            })
            changeChat(chat.chatId,chat.user);
        }catch(err){

        }

    };

    const filteredChats = chats.filter((c) =>
        c.user?.Username?.toLowerCase().includes((input || "").toLowerCase())
    );

    return (
        <div className="chatlist">
            <div className="search">
                <div className="searchbar">
                    <img src="./search.png" alt="" />
                    <input 
                        type="text" 
                        placeholder="Search" 
                        value={input}
                        onChange={(e)=> setInput(e.target.value)}
                    />
                </div>
                <img src={addMode ? "./minus.png":"./plus.png"} 
                alt="" 
                className="addimg"
                onClick={()=>setAddMode((prev)=>!prev)}
                />
            </div>
            {filteredChats.map((chat) => {
                console.log("Rendering chat item:", chat);
                return (
                    <div className="item" key={chat.chatId} onClick={() => handleSelect(chat)} style = {{backgroundColor:chat?.isSeen ? "transparent" : "#5183fe"}}>
                        <img src={chat.user?.blocked?.includes(currentUser.id) ? "./avatar.png" : chat.user?.avatar || "./avatar.png"} alt="" />
                        <div className="texts">
                            <span>{chat.user?.blocked?.includes(currentUser.id) ? "Unknown User" : chat.user?.Username || "Unknown User"}</span>
                            <p>{chat.lastMessage || "No messages yet"}</p>
                        </div>
                    </div>
                );
            })}
            {addMode && <AddUser/>}
        </div>
    );
};

export default Chatlist;
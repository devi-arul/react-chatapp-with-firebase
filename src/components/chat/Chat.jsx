import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import { arrayUnion, doc, onSnapshot, updateDoc, getDoc, deleteDoc } from "firebase/firestore";
import { useEffect,useState,useRef } from "react";
import { db } from "../../library/firebase";
import { useChatStore } from "../../library/chatstore";
import { useUserStore } from "../../library/userstore";
import { toast } from "react-toastify";

const Chat = () => {
    const [chat,setChat] = useState();
    const [open,setOpen] = useState(false);
    const [text,setText] = useState("");
    const [showMoreOptions, setShowMoreOptions] = useState(false);
    const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, message: null });
    const {chatId,user,isCurrentUserBlocked,isReceiverBlocked, resetChat} = useChatStore();
    const {currentUser} = useUserStore();
    
    const endRef = useRef(null);
    const moreOptionsRef = useRef(null);
    const chatContainerRef = useRef(null);
    
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chat?.messages]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (moreOptionsRef.current && !moreOptionsRef.current.contains(event.target)) {
                setShowMoreOptions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(()=>{
        if (!chatId) return;
        
        const unSub = onSnapshot(doc(db,"chats",chatId),(res)=>{
            if (res.exists()) {
                const chatData = res.data();
                const messages = chatData.messages || [];
                const deletedFor = chatData.deletedFor || {};

                // Filter out messages deleted by current user
                const filteredMessages = messages.filter(message => {
                    const msgKey = `${message.createdAt?.toDate().getTime()}_${message.senderId}`;
                    return !deletedFor[msgKey]?.includes(currentUser.id);
                });

                setChat({ ...chatData, messages: filteredMessages });
            } else {
                setChat(null);
            }
        });
        return ()=>{
            unSub();
        };
    },[chatId, currentUser]);

    const handleEmoji = (e)=>{
        setText((prev) => prev + e.emoji);
        setOpen(false);
    };

    const handleClearChat = async () => {
        if (!chatId || !currentUser || !user) return;

        try {
            // Update the chat document to clear messages
            await updateDoc(doc(db, "chats", chatId), {
                messages: []
            });

            // Update last message in both users' chat lists
            const userIDs = [currentUser.id, user.id];
            
            for (const id of userIDs) {
                const userChatRef = doc(db, "Userschats", id);
                const userChatsSnapshot = await getDoc(userChatRef);
                
                if (userChatsSnapshot.exists()) {
                    const userChatsData = userChatsSnapshot.data();
                    const chatIndex = userChatsData.chats.findIndex(
                        (c) => c.chatId === chatId
                    );
                    
                    if (chatIndex !== -1) {
                        userChatsData.chats[chatIndex].lastMessage = "";
                        userChatsData.chats[chatIndex].updatedAt = Date.now();
                        
                        await updateDoc(userChatRef, {
                            chats: userChatsData.chats,
                        });
                    }
                }
            }

            setShowMoreOptions(false);
            toast.success("Messages cleared successfully");
        } catch (err) {
            console.error("Error clearing messages:", err);
            toast.error("Failed to clear messages");
        }
    };

    const handleDeleteChat = async () => {
        if (!chatId || !currentUser) return;

        try {
            // Get current user's chat list
            const userChatRef = doc(db, "Userschats", currentUser.id);
            const userChatsSnapshot = await getDoc(userChatRef);
            
            if (userChatsSnapshot.exists()) {
                const userChatsData = userChatsSnapshot.data();
                // Remove the chat only from current user's chat list
                const updatedChats = userChatsData.chats.filter(
                    (c) => c.chatId !== chatId
                );
                
                // Update the user's chat list
                await updateDoc(userChatRef, {
                    chats: updatedChats
                });

                // Close the options menu
                setShowMoreOptions(false);
                
                // Reset the chat interface
                resetChat();
                setChat(null);
                
                // Show success message
                toast.success("Chat removed from your list");
            } else {
                toast.error("Chat list not found");
            }
        } catch (err) {
            console.error("Error removing chat:", err);
            toast.error("Failed to remove chat. Please try again.");
        }
    };

    const handleSend = async () =>{
        if(text.trim() === "") return;

        try{
            await updateDoc(doc(db, "chats", chatId), {
                messages:arrayUnion({
                    senderId:currentUser.id,
                    text,
                    createdAt:new Date(),
                }),
            })

            const userIDs = [currentUser.id, user.id];

            userIDs.forEach(async(id)=>{
                
                const userChatRef = doc(db,"Userschats",id);
                const userChatsSnapshot = await getDoc(userChatRef);
                
                if(userChatsSnapshot.exists()){
                    const userChatsData = userChatsSnapshot.data()
                    const chatIndex = userChatsData.chats.findIndex(
                        (c) => c.chatId === chatId
                    )
                    
                    userChatsData.chats[chatIndex].lastMessage = text;
                    userChatsData.chats[chatIndex].isSeen = id === currentUser.id ? true : false;
                    userChatsData.chats[chatIndex].updatedAt = Date.now();
                    
                    await updateDoc(userChatRef, {
                        chats: userChatsData.chats,
                    });
                }
            });

            setText("");
            setOpen(false);

        }catch(err){
            console.log(err);
        }
    }

    const handleContextMenu = (e, message) => {
        e.preventDefault();
        setContextMenu({
            show: true,
            x: e.clientX,
            y: e.clientY,
            message: message
        });
    };

    const handleClickOutside = (e) => {
        if (contextMenu.show && !e.target.closest('.context-menu')) {
            setContextMenu({ show: false, x: 0, y: 0, message: null });
        }
    };

    useEffect(() => {
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [contextMenu.show]);

    const deleteMessageForMe = async (message) => {
        if (!chatId || !currentUser) return;

        try {
            const chatRef = doc(db, "chats", chatId);
            const chatDoc = await getDoc(chatRef);
            
            if (chatDoc.exists()) {
                const chatData = chatDoc.data();
                const messages = chatData.messages || [];
                const deletedFor = chatData.deletedFor || {};

                // Initialize deletedFor for this message if it doesn't exist
                const messageKey = `${message.createdAt?.toDate().getTime()}_${message.senderId}`;
                if (!deletedFor[messageKey]) {
                    deletedFor[messageKey] = [];
                }

                // Add current user to deletedFor if not already there
                if (!deletedFor[messageKey].includes(currentUser.id)) {
                    deletedFor[messageKey].push(currentUser.id);
                }

                // Update the chat document
                await updateDoc(chatRef, { deletedFor });

                // Update local state
                const updatedMessages = messages.filter(m => {
                    const msgKey = `${m.createdAt?.toDate().getTime()}_${m.senderId}`;
                    return !deletedFor[msgKey]?.includes(currentUser.id);
                });

                setChat(prev => ({ ...prev, messages: updatedMessages }));
                setContextMenu({ show: false, x: 0, y: 0, message: null });
                toast.success("Message deleted for you");
            }
        } catch (err) {
            console.error("Error deleting message:", err);
            toast.error("Failed to delete message");
        }
    };

    const deleteMessageForEveryone = async (message) => {
        if (!chatId || !currentUser || message.senderId !== currentUser.id) return;

        try {
            const chatRef = doc(db, "chats", chatId);
            const chatDoc = await getDoc(chatRef);
            
            if (chatDoc.exists()) {
                const messages = chatDoc.data().messages;
                const updatedMessages = messages.filter(m => 
                    !(m.createdAt?.toDate().getTime() === message.createdAt?.toDate().getTime() && 
                      m.senderId === message.senderId)
                );
                
                await updateDoc(chatRef, { messages: updatedMessages });
                setContextMenu({ show: false, x: 0, y: 0, message: null });
                toast.success("Message deleted for everyone");
            }
        } catch (err) {
            console.error("Error deleting message:", err);
            toast.error("Failed to delete message");
        }
    };

    // Add this new function to filter messages
    const filterDeletedMessages = async (messages) => {
        if (!messages || !currentUser) return messages;

        const deletedMessagesRef = doc(db, "deletedMessages", currentUser.id);
        const deletedMessagesDoc = await getDoc(deletedMessagesRef);
        
        if (!deletedMessagesDoc.exists()) return messages;

        const deletedMessages = deletedMessagesDoc.data().messages || [];
        const currentChatDeletedMessages = deletedMessages.filter(
            dm => dm.chatId === chatId
        );

        return messages.filter(message => {
            const messageTime = message.createdAt?.toDate().getTime();
            return !currentChatDeletedMessages.some(
                dm => dm.messageId === messageTime && dm.senderId === message.senderId
            );
        });
    };

    return (
        <div className="chat" ref={chatContainerRef}>
            <div className="top">
                <div className="user">
                    <img src={user?.avatar || "./avatar.png"} alt="" />
                    <div className="texts">
                        <span>{user?.Username || "Unknown User"}</span>
                        <p>hi hello vanakam</p>
                    </div>
                </div>
                <div className="icons" ref={moreOptionsRef} style={{ position: 'relative' }}>
                    <img 
                        src="./more.png" 
                        alt="" 
                        onClick={() => setShowMoreOptions(!showMoreOptions)}
                    />
                    {showMoreOptions && (
                        <div className="more-options">
                            <div onClick={handleClearChat}>
                                <span>Clear chat</span>
                            </div>
                            <div onClick={handleDeleteChat}>
                                <span className="options">Delete chat</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="center">
                {chat?.messages?.map((message)=>(
                    <div 
                        className={message.senderId === currentUser.id ? "message you":"message"} 
                        key={message?.createdAt}
                        onContextMenu={(e) => handleContextMenu(e, message)}
                    >
                        <div className="texts">
                            <p>{message.text}</p>
                            <span>{message.createdAt?.toDate().toLocaleTimeString()}</span>
                        </div>
                    </div>
                ))}
                <div ref={endRef}></div>
            </div>
            {contextMenu.show && (
                <div 
                    className="context-menu"
                    style={{
                        position: 'fixed',
                        top: contextMenu.y,
                        left: contextMenu.x,
                    }}
                >
                    <div onClick={() => deleteMessageForMe(contextMenu.message)}>
                        Delete for me
                    </div>
                    {contextMenu.message?.senderId === currentUser.id && (
                        <div onClick={() => deleteMessageForEveryone(contextMenu.message)}>
                            Delete for everyone
                        </div>
                    )}
                </div>
            )}
            <div className="bottom">
                <input 
                    type="text" 
                    placeholder={isCurrentUserBlocked || isReceiverBlocked ? "You Cannot send a Message" : "Text a Message..." }
                    value={text}
                    onChange={(e)=>setText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    disabled={isCurrentUserBlocked || isReceiverBlocked}
                />
                <div className="emoji">
                    <img 
                        src="./emoji.png" 
                        alt="" 
                        onClick={()=>setOpen((prev)=>!prev)}
                    />
                    <div className="picker">
                        <EmojiPicker 
                            open={open} 
                            onEmojiClick={handleEmoji}
                        />
                    </div>
                </div>
                <button 
                    className="sendbutton" 
                    onClick={handleSend} 
                    disabled={isCurrentUserBlocked || isReceiverBlocked}
                >
                    Send
                </button>
            </div>
        </div>
    )
}

export default Chat;
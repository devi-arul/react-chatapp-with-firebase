import { arrayRemove, arrayUnion, doc, updateDoc } from "firebase/firestore";
import { useChatStore } from "../../library/chatstore";
import { auth, db } from "../../library/firebase";
import { useUserStore } from "../../library/userstore";
import "./detail.css";

const Detail = ()=> {

    const {user, chatId, isCurrentUserBlocked, isReceiverBlocked, changeBlock } = useChatStore();
    const {currentUser} = useUserStore();
    
    const handleBlock = async ()=>{
        if(!user) return;

        console.log("Block action - Current states:", {
            isReceiverBlocked,
            isCurrentUserBlocked,
            currentUserId: currentUser.id,
            otherUserId: user.id
        });

        // Update the current user's document
        const userDocRef = doc(db, "Users", currentUser.id);

        try{
            await updateDoc(userDocRef,{
                blocked: isReceiverBlocked ? arrayRemove(user.id) : arrayUnion(user.id),
            });
            console.log("Database updated successfully");
            
            // Update the state
            changeBlock();
            console.log("Block state changed to:", !isReceiverBlocked);
        }catch(err){
            console.log("Error in handleBlock:", err);
        }
    };

    return (
        <div className="detail">
            <div className="user">
                <img src={user?.avatar || "./avatar.png"} alt="" />
                <h2>{user?.Username || "Unknown User"}</h2>
                <p>hi hello vanakam</p>
            </div>
            <div className="info"> 
                <button onClick={handleBlock}>
                    {
                        isCurrentUserBlocked ? "You are Blocked!"   
                        : isReceiverBlocked 
                        ? "User Blocked"
                        : "Block User"
                    }
                </button>
                <button className="logout" onClick={()=>auth.signOut()}>Log out</button>
            </div>
        </div>
    )
}

export default Detail;  
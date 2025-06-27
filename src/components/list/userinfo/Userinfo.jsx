import { useUserStore } from "../../../library/userstore";
import "./userinfo.css";

const Userinfo = () =>{
    const {currentUser} = useUserStore();
    return(
        <div className="userinfo">
            <div className="user">
                <img src={currentUser?.avatar || "./avatar.png"} alt="" />
                <h2>{currentUser?.Username || "User"}</h2>
            </div>
            <div className="icons">
                <img src="./edit.png" alt="" />
            </div>
        </div>
    )
}

export default Userinfo;
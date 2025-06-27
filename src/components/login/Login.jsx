import { toast } from "react-toastify";
import "./login.css";
import {useState} from "react";
import { createUserWithEmailAndPassword , signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../library/firebase";
import { doc, setDoc } from "firebase/firestore"; 


const Login = () => {
    const [avatar,setAvatar] = useState({
        file:null,
        url:""
    })

    const [loading ,setLoading] = useState(false);

    const handleAvatar = e =>{
        if(e.target.files[0]){
            setAvatar({
                file:e.target.files[0],
                url:URL.createObjectURL(e.target.files[0])
            })
        }
    }

    const handleRegister = async (e) =>{
        e.preventDefault()
        setLoading(true);
        const formData = new FormData(e.target);
        const {Username, Email, Password} = Object.fromEntries(formData);
        
        try{
            const response = await createUserWithEmailAndPassword(auth,Email,Password)
            
            await setDoc(doc(db, "Users", response.user.uid), {
            Username,
            Email,
            id:response.user.uid,
            blocked:[],
            });
            
            await setDoc(doc(db, "Userschats", response.user.uid), {
            chats:[],
            });

            toast.success("Account Created! You can Login Now");
        
        }catch(err){
            console.log(err)
            toast.error(err.message)
        }finally{
            setLoading(false);
        }
    }

    const handleLogin = async(e) =>{
        e.preventDefault()
        setLoading(true);

        const formData = new FormData(e.target);
        const {Email, Password} = Object.fromEntries(formData);

        try{
            await signInWithEmailAndPassword(auth, Email, Password);

            toast.success("Login Successful");

        }catch(err){
            console.log(err);
            toast.error(err.message);
        }finally{
            setLoading(false);
        }
    }

     return(
        <div className="login">
            <div className="item">
                <h2>Welcome back Buddy</h2>
                <form onSubmit={handleLogin}>
                    <input type="text" placeholder="Enter Email" name="Email"/>
                    <input type="password" placeholder="Enter Password" name="Password"/>
                    <button disabled={loading}>{loading ? "Loading":"Log in"}</button>
                </form>
            </div>
            <div className="seperator">

            </div>
            <div className="item">
                <form onSubmit={handleRegister}>
                    <h2>Create an Account</h2>
                    <label htmlFor="file">
                        <img src={avatar.url || "./avatar.png"} alt="" />
                        Upload Image
                    </label>
                    <input type="file" id="file" style={{display:"none"}} onChange={handleAvatar}/>
                    <input type="text" placeholder="Username" name="Username" />
                    <input type="text" placeholder="Enter Email" name="Email"/>
                    <input type="password" placeholder="Enter Password" name="Password"/>
                    <button disabled={loading}>{loading ? "Loading":"Create"}</button>
                </form>
            </div>
        </div>
     )
}
export default Login;
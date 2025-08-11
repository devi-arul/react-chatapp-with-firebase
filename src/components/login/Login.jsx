import { toast } from "react-toastify";
import "./login.css";
import {useState} from "react";
import { createUserWithEmailAndPassword , signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
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
        const email = (Email || "").trim();
        const password = (Password || "").trim();
        
        try{
            const response = await createUserWithEmailAndPassword(auth, email, password)
            
            await setDoc(doc(db, "Users", response.user.uid), {
            Username,
            Email: email,
            id:response.user.uid,
            blocked:[],
            });
            
            await setDoc(doc(db, "Userschats", response.user.uid), {
            chats:[],
            });

            toast.success("Account Created! You can Login Now");
        
        }catch(err){
            console.log(err)
            // Provide clearer messages for common cases
            const friendly =
              err?.code === "auth/email-already-in-use" ? "Email already in use" :
              err?.code === "auth/invalid-email" ? "Invalid email format" :
              err?.code === "auth/weak-password" ? "Password should be at least 6 characters" :
              err?.message || "Registration failed";
            toast.error(friendly)
        }finally{
            setLoading(false);
        }
    }

    const handleLogin = async(e) =>{
        e.preventDefault()
        setLoading(true);

        const formData = new FormData(e.target);
        const {Email, Password} = Object.fromEntries(formData);
        const email = (Email || "").trim();
        const password = (Password || "").trim();

        try{
            await signInWithEmailAndPassword(auth, email, password);

            toast.success("Login Successful");

        }catch(err){
            console.log(err);
            const friendly =
              err?.code === "auth/invalid-credential" || err?.code === "auth/wrong-password" ? "Invalid email or password" :
              err?.code === "auth/user-not-found" ? "No account found for this email" :
              err?.code === "auth/invalid-email" ? "Invalid email format" :
              err?.message || "Login failed";
            toast.error(friendly);
        }finally{
            setLoading(false);
        }
    }

    const handlePasswordReset = async () => {
        const emailInput = window.prompt("Enter your email to reset password:");
        const email = (emailInput || "").trim();
        if (!email) return;
        try {
            await sendPasswordResetEmail(auth, email);
            toast.success("Password reset email sent");
        } catch (err) {
            const friendly =
              err?.code === "auth/user-not-found" ? "No account found for this email" :
              err?.code === "auth/invalid-email" ? "Invalid email format" :
              err?.message || "Failed to send reset email";
            toast.error(friendly);
        }
    }

     return(
        <div className="login">
            <div className="item">
                <h2>Welcome back Buddy</h2>
                <form onSubmit={handleLogin}>
                    <input type="email" placeholder="Enter Email" name="Email"/>
                    <input type="password" placeholder="Enter Password" name="Password"/>
                    <button disabled={loading}>{loading ? "Loading":"Log in"}</button>
                    <button type="button" onClick={handlePasswordReset} disabled={loading} style={{marginLeft: 8}}>Forgot password?</button>
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
                    <input type="email" placeholder="Enter Email" name="Email"/>
                    <input type="password" placeholder="Enter Password" name="Password"/>
                    <button disabled={loading}>{loading ? "Loading":"Create"}</button>
                </form>
            </div>
        </div>
     )
}
export default Login;
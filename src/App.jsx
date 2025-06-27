import "./index.css";
import Chat from "./components/chat/Chat";
import List from "./components/list/List";
import Detail from "./components/detail/Detail";
import Login from "./components/login/Login"
import Notifications from "./components/notifications/Notifications";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "./library/firebase";
import { useUserStore } from "./library/userstore";
import { useChatStore } from "./library/chatstore";

const App = () => {

  const {currentUser, isLoading, fetchUserInfo} = useUserStore();
  const {chatId} = useChatStore();

  useEffect(()=>{
    const unSub = onAuthStateChanged(auth,(user)=>
    {
      fetchUserInfo(user?.uid);
    });
    return()=>{
      unSub();
    };
  },[fetchUserInfo]);

  console.log(currentUser);

  if(isLoading) return <div className="loading">Loading...</div>
  
  return (
    <div className="container">
      {currentUser ? (
        <>
          <List/>
          {chatId&&<Chat />}
          {chatId&&<Detail />}
        </>
      ):(
        <Login/>
      )}
      <Notifications/>
    </div>
  )
}

export default App;
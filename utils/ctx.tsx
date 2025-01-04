import React, { useEffect, useState } from 'react'
import { useStorageState } from "./useStorageState";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { Button, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import { auth, db } from "../FirebaseConfig";
import { onAuthStateChanged, createUserWithEmailAndPassword } from "firebase/auth";
import {doc, getDoc, setDoc} from 'firebase/firestore';

type SocietyData = {
  [key: string]: {
    memberRole?: string[];
    memberType?: string[];
    myFlatNumber?: string;
    myFloor?: string;
    myWing?: string;
  };
};

const AuthContext = React.createContext<{
  session?: string | null;
  isLoading: boolean;
  isAuthenticated:  boolean| undefined;
  user: any;
  login:any;
  logOut:any;
  register:any;
  role:any;
  isApproved: boolean;
}>({
  session: null,
  isLoading: false,
  isAuthenticated: undefined,
  user: null,
  login: null,
  logOut:null,
  register:null,
  role:null,
  isApproved:false
});

// This hook can be used to access the user info.
export function useSession() {
  const value = React.useContext(AuthContext);
  if (process.env.NODE_ENV !== "production") {
    if (!value) {
      throw new Error("useSession must be wrapped in a <SessionProvider />");
    }
  }

  return value;
}

export function SessionProvider(props: React.PropsWithChildren) {
  const [[isLoading, session], setSession] = useStorageState("session");
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean| undefined>(undefined);
  const [role, setRole] = useState<any>(null); // Store the user role
  const [isApproved, setIsApproved] = useState<any>(false); // Approval status
  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setRole(userData.role);
          setIsApproved(userData.approved);
          setIsAuthenticated(true);
          setUser(currentUser);

        }       
      } else{
        setIsAuthenticated(false)
        setUser(null);
      }
    });
    return unsub;
  },[])

  const register = async (email:string, password:string, name :string, apartment:string, flatNumber :number)=>{
    try{
      const response = await createUserWithEmailAndPassword(auth, email, password);
      {/* console.log('response.user : ', response?.user) */}

      await setDoc(doc(db, "users", response?.user?.uid),{
        name,
        apartment,
        flatNumber,
        email,
        id: response?.user?.uid,
        approved: false,
      });
      return {success: true, data: response?.user};
    } catch(e: any){
      return {success: false, msg: e.message};

    }
  }
  const logOut = async ()=>{
    try{
      await signOut(auth);
      console.log("firebase logout done Mahesh");
      return {success: true}
    }catch(e: any){
      console.log("firebase logout error Mahesh");
      return {success: false, msg: e.message, error: e};
    }
  }
  const login = async (email:string, password:string)=>{
    try{
      const response = await signInWithEmailAndPassword(auth, email, password);
      const user = response.user;
      if (!user.emailVerified) {
        Alert.alert('Please verify your email before logging in.');
        return;
      }

      if (!user) {
        Alert.alert('User does not exist.');
        return;
      }
      
      console.log("firebase login successful Mahesh")
      return {success: true}
    }catch(e: any){
      console.log("firebase login error Mahesh", e)
      return {success: false, msg: e.message, error: e};
    }
  }



  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading,
        isAuthenticated,
        user,
        login,
        logOut,
        register,
        role,
        isApproved,

      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
}
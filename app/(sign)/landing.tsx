import React, { useState } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Button, Text } from "react-native-paper";
import { router } from "expo-router";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "@/utils/ctx";
import {
  getAuth,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { Image } from "react-native";

const LandingScreen: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState("");
  const [secureText, setSecureText] = useState(true);
  const { login, logOut } = useSession();
  const auth = getAuth();

  const handleFirebaseLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      if (!user.emailVerified) {
        Alert.alert(
          "Email Not Verified",
          "Please verify your email before logging in. Check your inbox (including spam).",
          [
            {
              text: "Resend Verification Email",
              onPress: async () => {
                await sendEmailVerification(user);
                Alert.alert("Verification Email Sent", "Check your inbox.");
              },
            },
            { text: "OK" },
          ]
        );
        return;
      }

      // Proceed with login if email is verified
      const response = await login(email, password);
      if (!response.success) {
        Alert.alert("Sign In", response.msg);
      }
    } catch (err: any) {
      Alert.alert("Login Failed", err.message);
    }
  };
  const handleFirebaseLogout = async () => {
    await logOut();
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("Forgot Password", "Please enter your email first.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        "Forgot Password",
        "Password reset email sent! Check your inbox."
      );
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/zebra_logo.png")}
        style={styles.logoImage}
      />

      <Text style={styles.title}>Login to your account</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          secureTextEntry={secureText}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setSecureText(!secureText)}>
          <Ionicons
            name={secureText ? "eye-off" : "eye"}
            size={24}
            color="gray"
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.terms}>
        By Logging in, you agree to our{" "}
        <Text style={[styles.terms, { fontWeight: "bold" }]}>
          Terms & Conditions & Privacy Policy
        </Text>
      </Text>

      {/* React Native Paper Button with styling */}
      <Button
        mode="contained"
        style={styles.button}
        labelStyle={styles.loginButtonText}
        onPress={() => handleFirebaseLogin()}
      >
        Login
      </Button>

      <TouchableOpacity
        onPress={() => {
          handleForgotPassword();
        }}
      >
        <Text style={styles.forgotPassword}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/(sign)/signup")}
        style={styles.registerContainer}
      >
        <Text style={styles.registerText}>
          Don't have an account?{" "}
          <Text
            style={[styles.registerText, { fontWeight: "bold", fontSize: 24 }]}
          >
            REGISTER
          </Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default LandingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#00AEEF",
    padding: 20,
  },
  logoImage: {
    width: 120, // Adjust size as needed
    height: 120,
    resizeMode: "contain",
    marginBottom: 20,
  },
  logo: {
    fontSize: 40,
    fontWeight: "bold",
    color: "white",
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    backgroundColor: "white",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "white",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  passwordInput: {
    flex: 1,
  },
  terms: {
    color: "white",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: "white",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  loginButtonText: {
    color: "#00AEEF",
    fontWeight: "bold",
    fontSize: 24,
    paddingTop: 4,
  },
  forgotPassword: {
    color: "white",
    marginBottom: 20,
    marginTop: 20,
  },
  button: {
    width: "60%",
    marginVertical: 10,
    backgroundColor: "white",
  },
  registerText: {
    color: "white",
  },
  registerContainer: {
    position: "absolute",
    bottom: 20, // Adjust this value if needed
    left: 0,
    right: 0,
    alignItems: "center",
  },
});

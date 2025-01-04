import React from "react";
import { Stack } from "expo-router";

const DirectoriesLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#6200ee" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
        
      }}
    />
  );
};

export default DirectoriesLayout;
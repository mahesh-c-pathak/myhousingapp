import React from "react";
import { Card, Text } from "react-native-paper";
import { useRouter } from "expo-router";

interface DirectoryCardProps {
  id: string;
  name: string;
}

const DirectoryCard: React.FC<DirectoryCardProps> = ({ id, name }) => {
  const router = useRouter();

  return (
    <Card
      onPress={() => router.push(`/(auth)/(directory)/directories/${id}`)} // Pass the dynamic directory ID
      style={{ margin: 10 }}
    >
      <Card.Content>
        <Text>{name}</Text>
      </Card.Content>
    </Card>
  );
};

export default DirectoryCard;

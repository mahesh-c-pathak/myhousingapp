import React from "react";
import { Card, Avatar, Text } from "react-native-paper";

interface ResidentCardProps {
  name: string;
  contact: string;
  photoUrl: string;
}

const ResidentCard: React.FC<ResidentCardProps> = ({ name, contact, photoUrl }) => {
  return (
    <Card style={{ margin: 10 }}>
      <Card.Title
        title={name}
        subtitle={contact}
        left={(props) => <Avatar.Image {...props} source={{ uri: photoUrl }} />}
      />
    </Card>
  );
};

export default ResidentCard;

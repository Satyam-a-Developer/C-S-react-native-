import React, { useEffect, useState } from "react";
import { View, Text, Image, FlatList, StyleSheet } from "react-native";

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

interface User {
  id: number;
  name: string;
  avatar: string;
  posts: Post[];
}

export default function App() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("https://jsonplaceholder.typicode.com/users");
        const usersData = await res.json();
        const postsRes = await fetch("https://jsonplaceholder.typicode.com/posts");
        const postsData = await postsRes.json();

        const combinedData = usersData.map((user: any) => ({
          ...user,
          avatar: `https://randomuser.me/api/portraits/men/${user.id}.jpg`,
          posts: postsData.filter((post: Post) => post.userId === user.id).slice(0, 2),
        })) as User[];

        setUsers(combinedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
    fetchUsers();
  }, []);

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.postContainer}>
      <Text style={styles.postTitle}>{item.title}</Text>
      <Text style={styles.postBody}>{item.body}</Text>
    </View>
  );

  const renderUser = ({ item }: { item: User }) => (
    <View style={styles.userContainer}>
      <View style={styles.userHeader}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <Text style={styles.userName}>{item.name}</Text>
      </View>
      <FlatList
        data={item.posts}
        renderItem={renderPost}
        keyExtractor={(post) => post.id.toString()}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Friends talks</Text>
      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(user) => user.id.toString()}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
    paddingTop: 30,
  },
  header: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1f2937", // gray-800
    textAlign: "center",
    marginBottom: 14,
  },
  userContainer: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // For Android shadow
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827", // gray-900
  },
  postContainer: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb", // gray-200
    borderRadius: 8,
    backgroundColor: "#f3f4f6", // gray-100
    marginBottom: 8,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151", // gray-700
    marginBottom: 4,
  },
  postBody: {
    fontSize: 14,
    color: "#4b5563", // gray-600
  },
});
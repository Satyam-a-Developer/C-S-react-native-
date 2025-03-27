import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Animatable from "react-native-animatable";

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
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [showScrollPrompt, setShowScrollPrompt] = useState(true); // State for scroll prompt

  useEffect(() => {
    fetchUsers(1);
  }, []);

  const fetchUsers = async (pageNum: number) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setIsFetchingMore(true);

      const res = await fetch(`https://jsonplaceholder.typicode.com/users?_page=${pageNum}&_limit=5`);
      const usersData = await res.json();
      const postsRes = await fetch("https://jsonplaceholder.typicode.com/posts");
      const postsData = await postsRes.json();

      const combinedData = usersData.map((user: any) => ({
        ...user,
        avatar: `https://randomuser.me/api/portraits/men/${user.id + (pageNum - 1) * 5}.jpg`,
        posts: postsData.filter((post: Post) => post.userId === user.id).slice(0, 2),
      })) as User[];

      if (combinedData.length === 0) {
        setHasMore(false);
        return;
      }

      setUsers((prevUsers) => (pageNum === 1 ? combinedData : [...prevUsers, ...combinedData]));
      setPage(pageNum);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!isFetchingMore && hasMore) {
      fetchUsers(page + 1);
    }
  };

  // Handle scroll to hide the prompt
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        if (offsetY > 20 && showScrollPrompt) { // Hide after scrolling 20px
          setShowScrollPrompt(false);
        }
      },
    }
  );

  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity style={styles.postContainer} activeOpacity={0.9}>
      <Animatable.View animation="fadeInUp" duration={500}>
        <Text style={styles.postTitle}>{item.title}</Text>
        <Text style={styles.postBody} numberOfLines={2} ellipsizeMode="tail">
          {item.body}
        </Text>
      </Animatable.View>
    </TouchableOpacity>
  );

  const renderUser = ({ item, index }: { item: User; index: number }) => {
    const ITEM_HEIGHT = 180;
    const inputRange = [
      (index - 1) * ITEM_HEIGHT,
      index * ITEM_HEIGHT,
      (index + 1) * ITEM_HEIGHT,
    ];

    const opacity = scrollY.interpolate({
      inputRange,
      outputRange: [0, 1, 1],
      extrapolate: "clamp",
    });

    const scale = scrollY.interpolate({
      inputRange,
      outputRange: [0.95, 1, 1],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        style={[
          styles.userContainer,
          {
            transform: [{ scale }],
            opacity,
          },
        ]}
      >
        <View style={styles.userHeader}>
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
          <Text style={styles.userName}>{item.name}</Text>
        </View>
        <FlatList
          data={item.posts}
          renderItem={renderPost}
          keyExtractor={(post) => post.id.toString()}
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>
    );
  };

  const renderFooter = () => {
    if (!isFetchingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#4f46e5" />
      </View>
    );
  };

  // Scroll Down Prompt Component
  const ScrollPrompt = () => {
    const fadeAnim = scrollY.interpolate({
      inputRange: [0, 20],
      outputRange: [1, 0],
      extrapolate: "clamp",
    });

    return (
      <Animated.View style={[styles.scrollPrompt, { opacity: fadeAnim }]}>
        <Text style={styles.scrollText}>Scroll Down</Text>
        <Animatable.View
          animation="bounce"
          iterationCount="infinite"
          style={styles.arrowContainer}
        >
          <Text style={styles.arrow}>↓</Text>
        </Animatable.View>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Loading Friends' Talks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#4f46e5", "#1e3a8a"]} style={styles.headerGradient}>
        <Text style={styles.header}>Your Friends' Talks</Text>
      </LinearGradient>
      <Animated.FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(user) => user.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
      />
      {showScrollPrompt && <ScrollPrompt />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: "#4f46e5",
    fontWeight: "600",
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  userContainer: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#4f46e5",
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    flex: 1,
  },
  postContainer: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    backgroundColor: "#f9fafb",
    marginBottom: 8,
  },
  postTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  postBody: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  scrollPrompt: {
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
    alignItems: "center",
  },
  scrollText: {
    fontSize: 16,
    color: "#4f46e5",
    fontWeight: "600",
    marginBottom: 100,
  },
  arrowContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  arrow: {
    fontSize: 24,
    color: "#4f46e5",
  },
});
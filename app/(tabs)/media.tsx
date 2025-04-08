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
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Animatable from "react-native-animatable";
import { Ionicons } from "@expo/vector-icons";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_PUBLIC_KEY } from '../../config';
import AsyncStorage from "@react-native-async-storage/async-storage";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);

// Interfaces
interface Comment {
  id: number;
  postId: number;
  name: string;
  email: string;
  body: string;
}

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
  likes: number;
  isLiked: boolean;
  comments: Comment[];
  image?: string;
}

interface User {
  id: number;
  name: string;
  avatar: string;
  posts: Post[];
  followers: number;
  following: number;
}

interface GroupMember {
  name: string;
  avatar: string;
  postsCount: number;
  email: string;
}

export default function App() {
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostBody, setNewPostBody] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentText, setCommentText] = useState("");
  const [showPostDetail, setShowPostDetail] = useState(false);
  const [activeTab, setActiveTab] = useState("feed");
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [selectedMemberPosts, setSelectedMemberPosts] = useState<Post[]>([]);
  const [showMemberPostsModal, setShowMemberPostsModal] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

  // Fetch data on component mount
  useEffect(() => {
    fetchUsers(1);
    setupCurrentUser();
  }, []);

  useEffect(() => {
    if (activeTab === "profile") {
      fetchGroupMembers();
    }
  }, [activeTab]);

  const setupCurrentUser = async () => {
    try {
      // Fetch group data from AsyncStorage
      const savedGroupData = await AsyncStorage.getItem("groupData");
      let groupName = "Group"; // Default fallback if no group is found
  
      if (savedGroupData) {
        const parsedGroup = JSON.parse(savedGroupData);
        const storedGroupName = typeof parsedGroup === "string" ? parsedGroup : parsedGroup.name;
  
        if (storedGroupName) {
          // Query Supabase to verify and fetch the group name
          const { data, error } = await supabase
            .from("groups")
            .select("name")
            .eq("name", storedGroupName)
            .single();
  
          if (error) {
            console.error("Error fetching group name from Supabase:", error);
          } else if (data) {
            groupName = data.name;
          }
        }
      }
  
      setCurrentUser({
        id: 99,
        name: groupName,
        avatar: "https://randomuser.me/api/portraits/women/44.jpg",
        posts: [],
        followers: 231,
        following: 187,
      });
    } catch (error) {
      console.error("Error setting up current user with group name:", error);
      setCurrentUser({
        id: 99,
        name: "Group", // Fallback in case of error
        avatar: "https://randomuser.me/api/portraits/women/44.jpg",
        posts: [],
        followers: 231,
        following: 187,
      });
    }
  };

  const fetchUsers = async (pageNum: number) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setIsFetchingMore(true);
  
      // Fetch users
      const res = await fetch(`https://jsonplaceholder.typicode.com/users?_page=${pageNum}&_limit=5`);
      const usersData = await res.json();
  
      // Fetch posts
      const postsRes = await fetch("https://jsonplaceholder.typicode.com/posts");
      const postsData = await postsRes.json();
  
      // Fetch comments
      const commentsRes = await fetch("https://jsonplaceholder.typicode.com/comments");
      const commentsData = await commentsRes.json();
  
      const combinedData = usersData.map((user: any, index: number) => {
        const userPosts = postsData
          .filter((post: Post) => post.userId === user.id)
          .slice(0, 3)
          .map((post: any) => ({
            ...post,
            likes: Math.floor(Math.random() * 200) + 1,
            isLiked: Math.random() > 0.5,
            comments: commentsData
              .filter((comment: Comment) => comment.postId === post.id)
              .slice(0, Math.floor(Math.random() * 5) + 1),
            image: Math.random() > 0.3 ? `https://picsum.photos/500/300?random=${post.id}` : undefined,
          }));
  
        return {
          ...user,
          avatar: `https://randomuser.me/api/portraits/men/${user.id + (pageNum - 1) * 5}.jpg`,
          posts: userPosts,
          followers: Math.floor(Math.random() * 1000) + 100,
          following: Math.floor(Math.random() * 500) + 50,
        } as User;
      });
  
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
      setRefreshing(false);
    }
  };
  

  const fetchGroupMembers = async () => {
    try {
      const savedGroupData = await AsyncStorage.getItem("groupData");
  
      if (!savedGroupData) {
        console.warn("No group data found in AsyncStorage.");
        setGroupMembers([]);
        return;
      }
  
      const parsedGroup = JSON.parse(savedGroupData);
      const groupName = typeof parsedGroup === 'string' ? parsedGroup : parsedGroup.name;
  
      if (!groupName) {
        console.warn("Group name missing in parsed group data:", parsedGroup);
        setGroupMembers([]);
        return;
      }
  
      const { data, error } = await supabase
        .from("groups")
        .select("member1, member1_email, member2, member2_email, member3, member3_email")
        .eq("name", groupName)
        .single();
  
      if (error) throw error;
  
      if (!data) {
        console.warn("No group found for name:", groupName);
        setGroupMembers([]);
        return;
      }
  
      const groupMembers: GroupMember[] = [
        {
          name: data.member1 || "",
          email: data.member1_email || "",
          avatar: "https://randomuser.me/api/portraits/women/1.jpg",
          postsCount: Math.floor(Math.random() * 20) + 1,
        },
        {
          name: data.member2 || "",
          email: data.member2_email || "",
          avatar: "https://randomuser.me/api/portraits/men/2.jpg",
          postsCount: Math.floor(Math.random() * 20) + 1,
        },
        {
          name: data.member3 || "",
          email: data.member3_email || "",
          avatar: "https://randomuser.me/api/portraits/men/3.jpg",
          postsCount: Math.floor(Math.random() * 20) + 1,
        },
      ].filter((member) => member.name?.trim().length > 0);
  
      setGroupMembers(groupMembers);
    } catch (error) {
      console.error("Error fetching group members from Supabase:", error);
      Alert.alert("Error", "Unable to fetch group members.");
      setGroupMembers([]);
    }
  };
  

  const fetchMemberPosts = async (memberEmail: string) => {
    try {
      const postsRes = await fetch("https://jsonplaceholder.typicode.com/posts");
      const postsData = await postsRes.json();
      const memberPosts = postsData
        .slice(0, 5) // Limit to 5 posts for demo
        .map((post: any) => ({
          ...post,
          likes: Math.floor(Math.random() * 200) + 1,
          isLiked: Math.random() > 0.5,
          comments: [],
          image: Math.random() > 0.5 ? `https://picsum.photos/500/300?random=${post.id}` : undefined,
        }));
      setSelectedMemberPosts(memberPosts);
      setShowMemberPostsModal(true);
    } catch (error) {
      console.error("Error fetching member posts:", error);
      Alert.alert("Error", "Unable to fetch posts for this member.");
    }
  };

  const handleLoadMore = () => {
    if (!isFetchingMore && hasMore) {
      fetchUsers(page + 1);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers(1);
  };

  const handleScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
    useNativeDriver: true,
  });

  const toggleLike = (userId: number, postId: number) => {
    setUsers(
      users.map((user) => {
        if (user.id === userId) {
          const updatedPosts = user.posts.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                likes: post.isLiked ? post.likes - 1 : post.likes + 1,
                isLiked: !post.isLiked,
              };
            }
            return post;
          });
          return { ...user, posts: updatedPosts };
        }
        return user;
      })
    );
  };

  const addComment = (userId: number, postId: number, comment: string) => {
    if (!comment.trim()) return;
  
    const newComment: Comment = {
      id: Date.now(),
      postId: postId,
      name: currentUser?.name || "Group", // Changed fallback to "Group" or keep it dynamic
      email: "group@example.com", // Updated email for consistency
      body: comment,
    };
  
    setUsers(
      users.map((user) => {
        if (user.id === userId) {
          const updatedPosts = user.posts.map((post) => {
            if (post.id === postId) {
              return { ...post, comments: [...post.comments, newComment] };
            }
            return post;
          });
          return { ...user, posts: updatedPosts };
        }
        return user;
      })
    );
  
    setCommentText("");
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost({ ...selectedPost, comments: [...selectedPost.comments, newComment] });
    }
  };

  const createPost = () => {
    if (!newPostTitle.trim() || !newPostBody.trim()) {
      Alert.alert("Error", "Post title and content are required");
      return;
    }

    const newPost: Post = {
      id: Date.now(),
      title: newPostTitle,
      body: newPostBody,
      userId: currentUser?.id || 99,
      likes: 0,
      isLiked: false,
      comments: [],
      image: Math.random() > 0.5 ? `https://picsum.photos/500/300?random=${Date.now()}` : undefined,
    };

    if (currentUser) {
      const updatedCurrentUser = { ...currentUser, posts: [newPost, ...currentUser.posts] };
      setCurrentUser(updatedCurrentUser);
      setUsers([{ ...updatedCurrentUser, posts: [newPost] }, ...users]);
    }

    setNewPostTitle("");
    setNewPostBody("");
    setShowCreatePost(false);

    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  };

  const followUser = (userId: number) => {
    setUsers(
      users.map((user) => {
        if (user.id === userId) {
          return { ...user, followers: user.followers + 1 };
        }
        return user;
      })
    );
    Alert.alert("Success", `You are now following ${users.find((u) => u.id === userId)?.name}`);
  };

  const openPostDetail = (post: Post) => {
    setSelectedPost(post);
    setShowPostDetail(true);
  };

  // Render components
  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <Text style={styles.commentAuthor}>{item.name}</Text>
      <Text style={styles.commentBody}>{item.body}</Text>
    </View>
  );

  const renderPost = ({ item, userId }: { item: Post; userId: number }) => (
    <Animatable.View animation="fadeIn" duration={500} style={styles.postContainer}>
      <View style={styles.postHeader}>
        <View style={styles.postAuthorContainer}>
          <Image source={{ uri: users.find((u) => u.id === userId)?.avatar }} style={styles.postAvatar} />
          <Text style={styles.postAuthor}>{users.find((u) => u.id === userId)?.name}</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>
      {item.image && <Image source={{ uri: item.image }} style={styles.postImage} resizeMode="cover" />}
      <View style={styles.postContent}>
        <Text style={styles.postTitle}>{item.title}</Text>
        <Text style={styles.postBody} numberOfLines={3} ellipsizeMode="tail">
          {item.body}
        </Text>
        {item.body.length > 100 && (
          <TouchableOpacity onPress={() => openPostDetail(item)}>
            <Text style={styles.readMore}>Read more</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.postActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => toggleLike(userId, item.id)}>
          <Ionicons name={item.isLiked ? "heart" : "heart-outline"} size={24} color={item.isLiked ? "#f43f5e" : "#64748b"} />
          <Text style={styles.actionText}>{item.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => openPostDetail(item)}>
          <Ionicons name="chatbubble-outline" size={22} color="#64748b" />
          <Text style={styles.actionText}>{item.comments.length}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-social-outline" size={22} color="#64748b" />
        </TouchableOpacity>
      </View>
      {/* Moved comment input up here */}
      <View style={styles.addCommentContainer}>
        <Image source={{ uri: currentUser?.avatar }} style={styles.commentAvatar} />
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment..."
          placeholderTextColor="#94a3b8"
          value={commentText}
          onChangeText={setCommentText}
          onSubmitEditing={() => {
            addComment(userId, item.id, commentText);
            setCommentText("");
          }}
        />
        <TouchableOpacity style={styles.sendButton} onPress={() => addComment(userId, item.id, commentText)}>
          <Ionicons name="send" size={20} color="#4f46e5" />
        </TouchableOpacity>
      </View>
      {item.comments.length > 0 && (
        <View style={styles.commentsPreview}>
          <Text style={styles.commentsHeader}>Recent Comments ({item.comments.length})</Text>
          {item.comments.slice(0, 2).map((comment) => (
            <View key={comment.id} style={styles.commentItem}>
              <Text style={styles.commentAuthor}>{comment.name}</Text>
              <Text style={styles.commentBody} numberOfLines={1}>{comment.body}</Text>
            </View>
          ))}
          {item.comments.length > 2 && (
            <TouchableOpacity onPress={() => openPostDetail(item)}>
              <Text style={styles.viewAllComments}>View all {item.comments.length} comments</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Animatable.View>
  );

  const renderUserCard = ({ item }: { item: User }) => (
    <Animatable.View animation="fadeIn" duration={500} style={styles.userCard}>
      <View style={styles.userCardTop}>
        <Image source={{ uri: item.avatar }} style={styles.userCardAvatar} />
        <View style={styles.userInfo}>
          <Text style={styles.userCardName}>{item.name}</Text>
          <Text style={styles.userStats}>
            {item.posts.length} posts · {item.followers} followers
          </Text>
        </View>
        <TouchableOpacity style={styles.followButton} onPress={() => followUser(item.id)}>
          <Text style={styles.followButtonText}>Follow</Text>
        </TouchableOpacity>
      </View>
      {item.posts.length > 0 && (
        <View style={styles.userPostsPreview}>
          {item.posts.slice(0, 3).map((post, index) => (
            <TouchableOpacity
              key={post.id}
              style={[styles.postPreview, index === 2 && { marginRight: 0 }]}
              onPress={() => openPostDetail(post)}
            >
              {post.image ? (
                <Image source={{ uri: post.image }} style={styles.postPreviewImage} />
              ) : (
                <View style={styles.postPreviewText}>
                  <Text numberOfLines={2}>{post.title}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </Animatable.View>
  );

  const renderGroupMember = ({ item }: { item: GroupMember }) => (
    <TouchableOpacity
      style={styles.groupMemberCard}
      onPress={() => fetchMemberPosts(item.email)}
    >
      <Animatable.View animation="fadeIn" duration={500}>
        <Image source={{ uri: item.avatar }} style={styles.groupMemberAvatar} />
        <View style={styles.groupMemberInfo}>
          <Text style={styles.groupMemberName}>{item.name}</Text>
          <Text style={styles.groupMemberStats}>{item.postsCount} posts</Text>
        </View>
      </Animatable.View>
    </TouchableOpacity>
  );

  const renderUserFeedItem = ({ item }: { item: User }) => {
    if (activeTab === "people") {
      return renderUserCard({ item });
    }
    return <View>{item.posts.map((post) => renderPost({ item: post, userId: item.id }))}</View>;
  };

  const renderProfileSection = () => (
    <ScrollView contentContainerStyle={styles.profileContainer}>
      {currentUser && (
        <>
          <View style={styles.profileHeader}>
            <Image source={{ uri: currentUser.avatar }} style={styles.profileAvatar} />
            <Text style={styles.profileName}>{currentUser.name}</Text>
            <Text style={styles.profileStats}>
              {currentUser.posts.length} posts · {currentUser.followers} followers · {currentUser.following} following
            </Text>
          </View>
          <View style={styles.groupSection}>
            <Text style={styles.groupTitle}>Group Members</Text> {/* Removed "Your" since it's now the group name */}
            {groupMembers.length > 0 ? (
              <FlatList
                data={groupMembers}
                renderItem={renderGroupMember}
                keyExtractor={(item) => item.email || item.name}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.groupMembersList}
              />
            ) : (
              <Text style={styles.noGroupText}>No group members found.</Text>
            )}
          </View>
          <View style={styles.userPostsSection}>
            <Text style={styles.postsTitle}>Posts</Text> {/* Removed "Your" */}
            {currentUser.posts.length > 0 ? (
              currentUser.posts.map((post) => renderPost({ item: post, userId: currentUser.id }))
            ) : (
              <Text style={styles.noPostsText}>No posts yet.</Text>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );

  const renderMemberPostsModal = () => (
    <Modal
      visible={showMemberPostsModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowMemberPostsModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.memberPostsContainer}>
          <View style={styles.memberPostsHeader}>
            <TouchableOpacity onPress={() => setShowMemberPostsModal(false)}>
              <Ionicons name="arrow-back" size={24} color="#64748b" />
            </TouchableOpacity>
            <Text style={styles.memberPostsTitle}>Member Posts</Text>
            <View style={{ width: 24 }} />
          </View>
          <FlatList
            data={selectedMemberPosts}
            renderItem={({ item }) => renderPost({ item, userId: item.userId })}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.memberPostsList}
            ListEmptyComponent={<Text style={styles.noPostsText}>No posts available.</Text>}
          />
        </View>
      </View>
    </Modal>
  );

  const renderFooter = () => {
    if (!isFetchingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#4f46e5" />
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="sad-outline" size={60} color="#94a3b8" />
      <Text style={styles.emptyText}>No posts found</Text>
      <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCreatePostModal = () => (
    <Modal
      visible={showCreatePost}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCreatePost(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
      >
        <View style={styles.createPostContainer}>
          <View style={styles.createPostHeader}>
            <TouchableOpacity onPress={() => setShowCreatePost(false)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
            <Text style={styles.createPostTitle}>Create Post</Text>
            <TouchableOpacity style={styles.postButton} onPress={createPost}>
              <Text style={styles.postButtonText}>Post</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.userInfoRow}>
            <Image source={{ uri: currentUser?.avatar }} style={styles.currentUserAvatar} />
            <Text style={styles.currentUserName}>{currentUser?.name}</Text>
          </View>
          <ScrollView style={styles.createPostForm}>
            <TextInput
              style={styles.titleInput}
              placeholder="Add a title to your post..."
              placeholderTextColor="#94a3b8"
              value={newPostTitle}
              onChangeText={setNewPostTitle}
              multiline
            />
            <TextInput
              style={styles.bodyInput}
              placeholder="What's on your mind?"
              placeholderTextColor="#94a3b8"
              value={newPostBody}
              onChangeText={setNewPostBody}
              multiline
            />
            <View style={styles.addContentRow}>
              <TouchableOpacity style={styles.addContentButton}>
                <Ionicons name="image" size={24} color="#4f46e5" />
                <Text style={styles.addContentText}>Add Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addContentButton}>
                <Ionicons name="videocam" size={24} color="#4f46e5" />
                <Text style={styles.addContentText}>Add Video</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderPostDetailModal = () => (
    <Modal
      visible={showPostDetail}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowPostDetail(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.postDetailContainer}>
          <View style={styles.postDetailHeader}>
            <TouchableOpacity onPress={() => setShowPostDetail(false)}>
              <Ionicons name="arrow-back" size={24} color="#64748b" />
            </TouchableOpacity>
            <Text style={styles.postDetailTitle}>Post Detail</Text>
            <TouchableOpacity>
              <Ionicons name="ellipsis-horizontal" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          {selectedPost && (
            <ScrollView style={styles.postDetailContent}>
              <View style={styles.postDetailAuthorContainer}>
                <Image
                  source={{ uri: users.find((u) => u.id === selectedPost.userId)?.avatar }}
                  style={styles.postDetailAvatar}
                />
                <View>
                  <Text style={styles.postDetailAuthor}>
                    {users.find((u) => u.id === selectedPost.userId)?.name}
                  </Text>
                  <Text style={styles.postDetailTime}>3 hours ago</Text>
                </View>
              </View>
              {selectedPost.image && (
                <Image source={{ uri: selectedPost.image }} style={styles.postDetailImage} resizeMode="cover" />
              )}
              <Text style={styles.postDetailTitle}>{selectedPost.title}</Text>
              <Text style={styles.postDetailBody}>{selectedPost.body}</Text>
              <View style={styles.postDetailStats}>
                <View style={styles.statItem}>
                  <Ionicons name="heart" size={18} color="#f43f5e" />
                  <Text style={styles.statText}>{selectedPost.likes} likes</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="chatbubble" size={18} color="#4f46e5" />
                  <Text style={styles.statText}>{selectedPost.comments.length} comments</Text>
                </View>
              </View>
              <View style={styles.postDetailActions}>
                <TouchableOpacity
                  style={styles.detailActionButton}
                  onPress={() => toggleLike(selectedPost.userId, selectedPost.id)}
                >
                  <Ionicons
                    name={selectedPost.isLiked ? "heart" : "heart-outline"}
                    size={22}
                    color={selectedPost.isLiked ? "#f43f5e" : "#64748b"}
                  />
                  <Text style={styles.detailActionText}>Like</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.detailActionButton}>
                  <Ionicons name="chatbubble-outline" size={22} color="#64748b" />
                  <Text style={styles.detailActionText}>Comment</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.detailActionButton}>
                  <Ionicons name="share-social-outline" size={22} color="#64748b" />
                  <Text style={styles.detailActionText}>Share</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.commentsSection}>
                <Text style={styles.commentsSectionTitle}>Comments ({selectedPost.comments.length})</Text>
                {selectedPost.comments.map((comment) => (
                  <View key={comment.id} style={styles.commentItemDetailed}>
                    <Image
                      source={{ uri: "https://randomuser.me/api/portraits/women/32.jpg" }}
                      style={styles.commentAvatarDetailed}
                    />
                    <View style={styles.commentContent}>
                      <Text style={styles.commentAuthorDetailed}>{comment.name}</Text>
                      <Text style={styles.commentBodyDetailed}>{comment.body}</Text>
                      <View style={styles.commentActions}>
                        <Text style={styles.commentTime}>1h ago</Text>
                        <TouchableOpacity>
                          <Text style={styles.commentReply}>Reply</Text>
                        </TouchableOpacity>
                        <TouchableOpacity>
                          <Ionicons name="heart-outline" size={16} color="#64748b" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={100}
            style={styles.commentInputContainer}
          >
            <Image source={{ uri: currentUser?.avatar }} style={styles.commentAvatar} />
            <TextInput
              style={styles.commentInputDetail}
              placeholder="Add a comment..."
              placeholderTextColor="#94a3b8"
              value={commentText}
              onChangeText={setCommentText}
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={() => {
                if (selectedPost) {
                  addComment(selectedPost.userId, selectedPost.id, commentText);
                }
              }}
            >
              <Ionicons name="send" size={20} color="#4f46e5" />
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Loading your feed...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#4f46e5", "#6366f1"]} style={styles.headerGradient}>
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "feed" && styles.activeTab]}
            onPress={() => setActiveTab("feed")}
          >
            <Ionicons name={activeTab === "feed" ? "home" : "home-outline"} size={22} color="#fff" />
            <Text style={styles.tabText}>Feed</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "people" && styles.activeTab]}
            onPress={() => setActiveTab("people")}
          >
            <Ionicons name={activeTab === "people" ? "people" : "people-outline"} size={22} color="#fff" />
            <Text style={styles.tabText}>People</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "discover" && styles.activeTab]}
            onPress={() => setActiveTab("discover")}
          >
            <Ionicons name={activeTab === "discover" ? "compass" : "compass-outline"} size={22} color="#fff" />
            <Text style={styles.tabText}>Discover</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "profile" && styles.activeTab]}
            onPress={() => setActiveTab("profile")}
          >
            <Ionicons name={activeTab === "profile" ? "person" : "person-outline"} size={22} color="#fff" />
            <Text style={styles.tabText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {activeTab === "profile" ? (
        renderProfileSection()
      ) : (
        <>
          <View style={styles.storyContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storyScrollView}>
              <TouchableOpacity style={styles.addStoryButton}>
                <View style={styles.addStoryIcon}>
                  <Ionicons name="add" size={24} color="#4f46e5" />
                </View>
                <Text style={styles.storyText}>Your Story</Text>
              </TouchableOpacity>
              {users.slice(0, 7).map((user) => (
                <TouchableOpacity key={user.id} style={styles.storyItem}>
                  <View style={styles.storyRing}>
                    <Image source={{ uri: user.avatar }} style={styles.storyAvatar} />
                  </View>
                  <Text style={styles.storyText} numberOfLines={1}>
                    {user.name.split(" ")[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <AnimatedFlatList
            ref={flatListRef}
            data={users}
            renderItem={({ item }) => renderUserFeedItem({ item })}
            keyExtractor={(item: User) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />
        </>
      )}

      <TouchableOpacity style={styles.fabButton} onPress={() => setShowCreatePost(true)}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {renderCreatePostModal()}
      {renderPostDetailModal()}
      {renderMemberPostsModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 18,
    color: "#4f46e5",
    fontWeight: "600",
  },
  headerGradient: {
    paddingBottom: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  tabText: {
    color: "#fff",
    marginLeft: 4,
    fontWeight: "500",
    fontSize: 14,
  },
  storyContainer: {
    height: 100,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  storyScrollView: {
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  storyItem: {
    alignItems: "center",
    marginHorizontal: 8,
    width: 70,
  },
  storyRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#4f46e5",
  },
  storyAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "#fff",
  },
  storyText: {
    marginTop: 4,
    fontSize: 12,
    color: "#475569",
    fontWeight: "500",
    textAlign: "center",
    width: 70,
  },
  addStoryButton: {
    alignItems: "center",
    marginHorizontal: 8,
    width: 70,
  },
  addStoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
  },
  listContent: {
    padding: 12,
    paddingBottom: 80,
  },
  postContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  postAuthorContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: "#4f46e5",
  },
  postAuthor: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  postImage: {
    width: "100%",
    height: 250,
    borderRadius: 10,
    marginBottom: 12,
  },
  postContent: {
    marginBottom: 16,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 6,
  },
  postBody: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 22,
  },
  readMore: {
    color: "#4f46e5",
    fontWeight: "500",
    marginTop: 4,
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    paddingVertical: 10,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
  },
  commentsPreview: {
    marginBottom: 12,
  },
  commentsHeader: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
  },
  commentItem: {
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },
  commentBody: {
    fontSize: 14,
    color: "#64748b",
  },
  viewAllComments: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
    marginTop: 6,
  },
  addCommentContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#f1f5f9",
    paddingTop: 12,
    marginBottom: 8, // Add this to control spacing below
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: "#334155",
    maxHeight: 80,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  fabButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4f46e5",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
  },
  createPostContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 50,
  },
  createPostHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  createPostTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
  },
  postButton: {
    backgroundColor: "#4f46e5",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  postButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  currentUserAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#4f46e5",
  },
  currentUserName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  createPostForm: {
    flex: 1,
    padding: 16,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 16,
    padding: 0,
  },
  bodyInput: {
    fontSize: 16,
    color: "#475569",
    lineHeight: 24,
    minHeight: 200,
    textAlignVertical: "top",
    padding: 0,
  },
  addContentRow: {
    flexDirection: "row",
    marginTop: 24,
    justifyContent: "space-around",
  },
  addContentButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  addContentText: {
    marginLeft: 8,
    color: "#4f46e5",
    fontWeight: "600",
  },
  postDetailContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 50,
  },
  postDetailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  postDetailTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  postDetailContent: {
    flex: 1,
    padding: 16,
  },
  postDetailAuthorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  postDetailAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#4f46e5",
  },
  postDetailAuthor: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  postDetailTime: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  postDetailImage: {
    width: "100%",
    height: 250,
    borderRadius: 12,
    marginBottom: 16,
  },
  postDetailBody: {
    fontSize: 16,
    color: "#475569",
    lineHeight: 24,
    marginBottom: 16,
  },
  postDetailStats: {
    flexDirection: "row",
    marginBottom: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  statText: {
    fontSize: 14,
    color: "#64748b",
    marginLeft: 4,
  },
  postDetailActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    paddingVertical: 12,
    marginBottom: 16,
  },
  detailActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  detailActionText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
  },
  commentsSection: {
    marginBottom: 100,
  },
  commentsSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 16,
  },
  commentItemDetailed: {
    flexDirection: "row",
    marginBottom: 16,
  },
  commentAvatarDetailed: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 12,
  },
  commentAuthorDetailed: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },
  commentBodyDetailed: {
    fontSize: 14,
    color: "#475569",
    marginTop: 4,
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  commentTime: {
    fontSize: 12,
    color: "#94a3b8",
    marginRight: 12,
  },
  commentReply: {
    fontSize: 12,
    color: "#4f46e5",
    fontWeight: "500",
    marginRight: 12,
  },
  commentInputContainer: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  commentInputDetail: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: "#334155",
    maxHeight: 80,
  },
  userCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userCardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  userCardAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#4f46e5",
  },
  userInfo: {
    flex: 1,
  },
  userCardName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  userStats: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  followButton: {
    backgroundColor: "#4f46e5",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  followButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  userPostsPreview: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  postPreview: {
    width: "32%",
    aspectRatio: 1,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f1f5f9",
  },
  postPreviewImage: {
    width: "100%",
    height: "100%",
  },
  postPreviewText: {
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 18,
    color: "#94a3b8",
    marginTop: 12,
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: "#4f46e5",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  refreshButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  profileContainer: {
    padding: 16,
    backgroundColor: "#f8fafc",
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#4f46e5",
    marginBottom: 12,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
  },
  profileStats: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  groupSection: {
    marginBottom: 20,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
  },
  groupMembersList: {
    paddingVertical: 8,
  },
  groupMemberCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  groupMemberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: "#4f46e5",
  },
  groupMemberInfo: {
    flex: 1,
  },
  groupMemberName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  groupMemberStats: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  noGroupText: {
    fontSize: 16,
    color: "#94a3b8",
    textAlign: "center",
  },
  userPostsSection: {
    marginBottom: 20,
  },
  postsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
  },
  noPostsText: {
    fontSize: 16,
    color: "#94a3b8",
    textAlign: "center",
  },
  memberPostsContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 50,
  },
  memberPostsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  memberPostsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  memberPostsList: {
    padding: 16,
  },
});
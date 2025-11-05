import { useState, useEffect, useRef } from "react";
import { Search, MessageSquare, User as UserIcon, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/common/user/Home/Header";
import api from "@/services/api";
import chatApi from "@/services/user/chat/chatApi";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { Input } from "@/components/ui/input";

const UserSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState(null);
  const navigate = useNavigate();
  const { user: currentUser } = useSelector((state) => state.user);
  const searchInputRef = useRef(null);

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get("profile/search-users/", {
        params: { search: query, limit: 20 },
      });
      setUsers(response.data.results || []);
    } catch (error) {
      console.error("Error searching users:", error);
      toast.error("Failed to search users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    setDebounceTimer(timer);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [searchQuery]);

  const handleMessageClick = async (userId, username, e) => {
    e.stopPropagation();
    try {
      const conversation = await chatApi.createConversation(userId);
      navigate(`/chat?conversation=${conversation.id}`);
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error(
        error.response?.data?.error || "Failed to start conversation"
      );
    }
  };

  const handleUserClick = (username) => {
    navigate(`/user/${username}`);
  };

  return (
    <div className="bg-[#0f172b] min-h-screen text-white flex flex-col">
      <Header />
      <div className="flex-1 pt-20 px-4 md:px-8 pb-8 max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Search Users</h1>
          <p className="text-gray-400">Find and connect with other users</p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search by username or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-4 py-3 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-green-400 focus:ring-green-400 rounded-lg"
          />
          {loading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
          )}
        </div>

        {searchQuery.trim() && (
          <div className="space-y-3">
            {loading && users.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-green-400" />
              </div>
            ) : users.length > 0 ? (
              users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserClick(user.username)}
                  className="bg-gray-800/50 hover:bg-gray-800 rounded-lg p-4 cursor-pointer transition-all border border-gray-700 hover:border-green-400/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={user.profile_picture || "/default-profile.png"}
                        alt={user.username}
                        className="w-14 h-14 rounded-full object-cover border-2 border-gray-700"
                      />
                      {user.organizer_verified && (
                        <div className="absolute -bottom-1 -right-1 bg-green-400 rounded-full p-1">
                          <UserIcon className="h-3 w-3 text-gray-900" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg truncate">
                          {user.username}
                        </h3>
                        {user.is_following && (
                          <span className="text-xs bg-green-400/20 text-green-400 px-2 py-0.5 rounded-full">
                            Following
                          </span>
                        )}
                      </div>
                      {user.title && (
                        <p className="text-sm text-gray-400 mb-1 truncate">
                          {user.title}
                        </p>
                      )}
                      {user.bio && (
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {user.bio}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={(e) =>
                        handleMessageClick(user.id, user.username, e)
                      }
                      className="p-2 rounded-full bg-gray-700 hover:bg-green-400 hover:text-gray-900 transition-colors flex-shrink-0"
                      title="Send message"
                    >
                      <MessageSquare size={20} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No users found</p>
                <p className="text-sm mt-2">Try a different search term</p>
              </div>
            )}
          </div>
        )}

        {!searchQuery.trim() && (
          <div className="text-center py-16 text-gray-400">
            <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Start searching to find users</p>
            <p className="text-sm mt-2">
              Search by username or email to connect with others
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSearch;

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Send, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import MobileHeader from "@/components/layout/mobile-header";
import DesktopHeader from "@/components/layout/desktop-header";
import MobileBottomNav from "@/components/layout/mobile-bottom-nav";

export default function MessagesPage() {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");

  // Get conversations
  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['/api/messages/conversations'],
    enabled: !!user,
  });

  // Get messages for selected conversation
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/messages', selectedConversation],
    enabled: !!selectedConversation,
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { receiverId: number, content: string }) => {
      const res = await apiRequest("POST", "/api/messages", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
      setMessageText("");
    },
  });
  
  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return;
    
    sendMessageMutation.mutate({
      receiverId: selectedConversation,
      content: messageText,
    });
  };
  
  return (
    <>
      <MobileHeader />
      <DesktopHeader />
      
      <main className="pt-14 md:pt-20 pb-20 md:pb-10">
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-semibold mb-6">Messages</h1>
          
          <div className="grid md:grid-cols-3 gap-4 h-[calc(100vh-220px)]">
            {/* Conversations Sidebar */}
            <div className="md:col-span-1 border rounded-lg overflow-hidden bg-white">
              <div className="p-3 border-b">
                <div className="relative">
                  <Input 
                    placeholder="Search messages..." 
                    className="pl-9"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                </div>
              </div>
              
              <ScrollArea className="h-[calc(100%-56px)]">
                {conversationsLoading ? (
                  <div className="p-3 space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center p-2">
                        <Skeleton className="h-12 w-12 rounded-full mr-3" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    {conversations && conversations.length > 0 ? (
                      conversations.map((convo: any) => (
                        <div 
                          key={convo.userId}
                          className={`flex items-center p-3 cursor-pointer hover:bg-neutral-50 ${
                            selectedConversation === convo.userId ? 'bg-neutral-100' : ''
                          }`}
                          onClick={() => setSelectedConversation(convo.userId)}
                        >
                          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                            <span className="text-primary-700 font-medium">
                              {convo.userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{convo.userName}</p>
                            <p className="text-sm text-neutral-500 truncate">
                              {convo.lastMessage}
                            </p>
                          </div>
                          {convo.unreadCount > 0 && (
                            <div className="ml-auto">
                              <span className="bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {convo.unreadCount}
                              </span>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center">
                        <p className="text-neutral-500">No conversations yet</p>
                        <Button className="mt-4" asChild>
                          <a href="/">Find Providers</a>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </div>
            
            {/* Messages Area */}
            <div className="md:col-span-2 border rounded-lg overflow-hidden bg-white flex flex-col">
              {selectedConversation ? (
                <>
                  <div className="p-4 border-b">
                    {conversationsLoading ? (
                      <Skeleton className="h-6 w-40" />
                    ) : (
                      <h2 className="font-semibold">
                        {conversations?.find((c: any) => c.userId === selectedConversation)?.userName}
                      </h2>
                    )}
                  </div>
                  
                  <ScrollArea className="flex-1 p-4">
                    {messagesLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : ''}`}>
                            <Skeleton className={`h-10 w-64 rounded-lg ${i % 2 === 0 ? 'rounded-tr-none' : 'rounded-tl-none'}`} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages?.length > 0 ? (
                          messages.map((msg: any) => (
                            <div 
                              key={msg.id} 
                              className={`flex ${msg.senderId === user?.id ? 'justify-end' : ''}`}
                            >
                              <div 
                                className={`p-3 rounded-lg max-w-[75%] ${
                                  msg.senderId === user?.id 
                                    ? 'bg-primary text-white rounded-tr-none' 
                                    : 'bg-neutral-100 text-neutral-800 rounded-tl-none'
                                }`}
                              >
                                <p>{msg.content}</p>
                                <p className={`text-xs mt-1 ${
                                  msg.senderId === user?.id ? 'text-white/70' : 'text-neutral-500'
                                }`}>
                                  {new Date(msg.createdAt).toLocaleTimeString('en-US', { 
                                    hour: '2-digit', 
                                    minute: '2-digit',
                                    hour12: true
                                  })}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-neutral-500">No messages yet</p>
                            <p className="text-sm text-neutral-400 mt-1">Send a message to start the conversation</p>
                          </div>
                        )}
                      </div>
                    )}
                  </ScrollArea>
                  
                  <div className="p-3 border-t">
                    <div className="flex">
                      <Input 
                        placeholder="Type a message..." 
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        className="mr-2"
                      />
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!messageText.trim() || sendMessageMutation.isPending}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-6">
                    <h2 className="text-lg font-medium mb-2">Select a conversation</h2>
                    <p className="text-neutral-500">
                      Choose a conversation from the sidebar to start chatting
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <MobileBottomNav />
    </>
  );
}

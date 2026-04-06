'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Send } from 'lucide-react';

export default function GroupsPage() {
    const [groups, setGroups] = useState<any[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        fetch('/api/groups').then(r => r.json()).then(d => setGroups(d.groups || []));
    }, []);

    const loadMessages = async (groupId: string) => {
        const res = await fetch(`/api/groups/${groupId}/messages`);
        const data = await res.json();
        setMessages(data.messages || []);
    };

    const sendMessage = async () => {
        if (!selectedGroup || !newMessage) return;

        await fetch(`/api/groups/${selectedGroup.id}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: newMessage })
        });

        setNewMessage('');
        loadMessages(selectedGroup.id);
    };

    return (
        <div className="flex flex-col gap-8">
            <header>
                <h1 className="text-4xl font-bold">Study <span className="text-gradient">Groups</span></h1>
                <p className="text-muted-foreground">Collaborate and learn together</p>
            </header>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Groups List */}
                <div className="space-y-2">
                    {groups.map(group => (
                        <button
                            key={group.id}
                            onClick={() => { setSelectedGroup(group); loadMessages(group.id); }}
                            className="w-full p-4 text-left bg-card border rounded-xl hover:border-primary"
                        >
                            <h3 className="font-bold">{group.name}</h3>
                            <p className="text-sm text-muted-foreground">{group.memberCount} members</p>
                        </button>
                    ))}
                </div>

                {/* Chat */}
                {selectedGroup && (
                    <div className="md:col-span-2 bento-card p-6 flex flex-col h-[600px]">
                        <h2 className="font-bold mb-4">{selectedGroup.name}</h2>
                        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                            {messages.map(msg => (
                                <div key={msg.id} className="p-3 bg-muted/20 rounded-lg">
                                    <p className="text-xs text-muted-foreground">{msg.userName}</p>
                                    <p className="text-sm">{msg.message}</p>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 h-10 px-4 bg-muted/20 rounded-lg"
                                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            />
                            <button onClick={sendMessage} className="h-10 px-4 bg-primary text-primary-foreground rounded-lg">
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

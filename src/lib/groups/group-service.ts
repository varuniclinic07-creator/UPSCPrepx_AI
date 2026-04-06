// ═══════════════════════════════════════════════════════════════
// STUDY GROUPS SERVICE
// Collaborative learning groups
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';

export interface StudyGroup {
    id: string;
    name: string;
    description: string;
    ownerId: string;
    memberCount: number;
    isPrivate: boolean;
    createdAt: string;
}

export interface GroupMessage {
    id: string;
    groupId: string;
    userId: string;
    userName: string;
    message: string;
    createdAt: string;
}

/**
 * Create study group
 */
export async function createGroup(
    userId: string,
    name: string,
    description: string,
    isPrivate: boolean = false
): Promise<StudyGroup> {
    const supabase = await createClient();

    const { data, error } = await (supabase
        .from('study_groups') as any)
        .insert({
            name,
            description,
            owner_id: userId,
            is_private: isPrivate,
            member_count: 1
        })
        .select()
        .single();

    if (error) throw new Error(error.message);

    // Add creator as member
    await (supabase.from('group_members') as any).insert({
        group_id: data.id,
        user_id: userId,
        role: 'owner'
    });

    return {
        id: data.id,
        name: data.name,
        description: data.description,
        ownerId: data.owner_id,
        memberCount: data.member_count,
        isPrivate: data.is_private,
        createdAt: data.created_at
    };
}

/**
 * Get all groups
 */
export async function getAllGroups(): Promise<StudyGroup[]> {
    const supabase = await createClient();

    const { data, error } = await (supabase
        .from('study_groups') as any)
        .select('*')
        .eq('is_private', false)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return data.map((g: any) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        ownerId: g.owner_id,
        memberCount: g.member_count,
        isPrivate: g.is_private,
        createdAt: g.created_at
    }));
}

/**
 * Join group
 */
export async function joinGroup(groupId: string, userId: string): Promise<void> {
    const supabase = await createClient();

    await (supabase.from('group_members') as any).insert({
        group_id: groupId,
        user_id: userId,
        role: 'member'
    });

    // Increment member count
    await (supabase.rpc as any)('increment_group_members', { group_id: groupId });
}

/**
 * Send message
 */
export async function sendMessage(
    groupId: string,
    userId: string,
    message: string
): Promise<void> {
    const supabase = await createClient();

    await (supabase.from('group_messages') as any).insert({
        group_id: groupId,
        user_id: userId,
        message
    });
}

/**
 * Get messages
 */
export async function getMessages(groupId: string): Promise<GroupMessage[]> {
    const supabase = await createClient();

    const { data, error } = await (supabase
        .from('group_messages') as any)
        .select(`
            id,
            group_id,
            user_id,
            message,
            created_at,
            users:user_id (name)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .limit(100);

    if (error) throw new Error(error.message);

    return data.map((m: any) => ({
        id: m.id,
        groupId: m.group_id,
        userId: m.user_id,
        userName: (m.users as any)?.name || 'Unknown',
        message: m.message,
        createdAt: m.created_at
    }));
}

import React from "react";
import type { GroupThread, GroupMember } from "@/types/chat";

interface GroupListProps {
  groups: GroupThread[];
  activeGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
  onCreateGroup: () => void;
}

export function GroupList({
  groups,
  activeGroupId,
  onSelectGroup,
  onCreateGroup
}: GroupListProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-4 py-2">
        <h3 className="font-semibold text-sm">Groups</h3>
        <button
          onClick={onCreateGroup}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          title="Create new group"
        >
          + New
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-slate-500">
          <p>No groups yet</p>
          <button
            onClick={onCreateGroup}
            className="mt-2 text-blue-600 hover:text-blue-700 font-medium text-xs"
          >
            Create your first group
          </button>
        </div>
      ) : (
        <div className="space-y-1">
          {groups.map((group) => (
            <button
              key={group.groupId}
              onClick={() => onSelectGroup(group.groupId)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                activeGroupId === group.groupId
                  ? "bg-blue-50 border-l-4 border-blue-600"
                  : "hover:bg-slate-100"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">
                      {group.name}
                    </span>
                    {group.unread > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
                        {group.unread}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    {group.lastMessage || "No messages yet"}
                  </p>
                </div>
              </div>
              {group.isPrivate && (
                <span className="text-xs text-slate-400 mt-1">🔒 Private</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface GroupDetailProps {
  group: GroupThread;
  onBack: () => void;
  onLeave: () => void;
}

export function GroupDetail({ group, onBack, onLeave }: GroupDetailProps) {
  return (
    <div className="border-l border-slate-200">
      {/* Header */}
      <div className="border-b border-slate-200 p-4">
        <button
          onClick={onBack}
          className="mb-2 text-sm text-slate-600 hover:text-slate-900"
        >
          ← Back
        </button>
        <h2 className="text-lg font-bold">{group.name}</h2>
        {group.description && (
          <p className="text-sm text-slate-600 mt-1">{group.description}</p>
        )}
      </div>

      {/* Members */}
      <div className="p-4 border-b border-slate-200">
        <h3 className="font-semibold text-sm mb-3">Members ({group.members.length})</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {group.members.map((member) => (
            <div key={member.userId} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{member.displayName}</p>
                <p className="text-xs text-slate-500">@{member.username}</p>
              </div>
              {member.role === "admin" && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  Admin
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4">
        <button
          onClick={onLeave}
          className="w-full text-sm px-3 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
        >
          Leave Group
        </button>
      </div>
    </div>
  );
}

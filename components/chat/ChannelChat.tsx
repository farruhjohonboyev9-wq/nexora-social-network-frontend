import React from "react";
import type { ChannelThread } from "@/types/chat";

interface ChannelListProps {
  channels: ChannelThread[];
  activeChannelId: string | null;
  onSelectChannel: (channelId: string) => void;
  onCreateChannel: () => void;
}

export function ChannelList({
  channels,
  activeChannelId,
  onSelectChannel,
  onCreateChannel
}: ChannelListProps) {
  const publicChannels = channels.filter((c) => c.isPublic);
  const privateChannels = channels.filter((c) => !c.isPublic);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-4 py-2">
        <h3 className="font-semibold text-sm">Channels</h3>
        <button
          onClick={onCreateChannel}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          title="Create new channel"
        >
          + New
        </button>
      </div>

      {channels.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-slate-500">
          <p>No channels yet</p>
          <button
            onClick={onCreateChannel}
            className="mt-2 text-blue-600 hover:text-blue-700 font-medium text-xs"
          >
            Create your first channel
          </button>
        </div>
      ) : (
        <>
          {/* Public Channels */}
          {publicChannels.length > 0 && (
            <div>
              <p className="px-4 text-xs font-semibold text-slate-500 uppercase">Public</p>
              <div className="space-y-1">
                {publicChannels.map((channel) => (
                  <ChannelItem
                    key={channel.channelId}
                    channel={channel}
                    active={activeChannelId === channel.channelId}
                    onSelect={() => onSelectChannel(channel.channelId)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Private Channels */}
          {privateChannels.length > 0 && (
            <div>
              <p className="px-4 text-xs font-semibold text-slate-500 uppercase">Private</p>
              <div className="space-y-1">
                {privateChannels.map((channel) => (
                  <ChannelItem
                    key={channel.channelId}
                    channel={channel}
                    active={activeChannelId === channel.channelId}
                    onSelect={() => onSelectChannel(channel.channelId)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface ChannelItemProps {
  channel: ChannelThread;
  active: boolean;
  onSelect: () => void;
}

function ChannelItem({ channel, active, onSelect }: ChannelItemProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
        active ? "bg-blue-50 border-l-4 border-blue-600" : "hover:bg-slate-100"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">
              {channel.isPublic ? "#" : "🔒"}
            </span>
            <span className="text-sm font-medium text-slate-900">
              {channel.name}
            </span>
            {channel.unread > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
                {channel.unread}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 truncate">
            {channel.lastMessage || "No messages yet"}
          </p>
        </div>
      </div>
    </button>
  );
}

interface ChannelDetailProps {
  channel: ChannelThread;
  onBack: () => void;
  onLeave: () => void;
}

export function ChannelDetail({
  channel,
  onBack,
  onLeave
}: ChannelDetailProps) {
  const isModerator = channel.moderators.includes("current-user-id");

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
        <div className="flex items-center gap-2">
          <span className="text-lg">
            {channel.isPublic ? "#" : "🔒"}
          </span>
          <div>
            <h2 className="text-lg font-bold">{channel.name}</h2>
            {channel.description && (
              <p className="text-sm text-slate-600 mt-1">{channel.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="p-4 border-b border-slate-200">
        <h3 className="font-semibold text-sm mb-2">Notifications</h3>
        <div className="space-y-2">
          {["all", "mentions", "muted"].map((option) => (
            <label key={option} className="flex items-center gap-2">
              <input
                type="radio"
                name="notifications"
                value={option}
                checked={channel.notifications === option}
                className="w-4 h-4"
                readOnly
              />
              <span className="text-sm capitalize">{option}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Members */}
      <div className="p-4 border-b border-slate-200">
        <h3 className="font-semibold text-sm mb-3">
          Members ({channel.members.length})
        </h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {channel.members.slice(0, 10).map((member) => (
            <div key={member.userId} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{member.displayName}</p>
                <p className="text-xs text-slate-500">@{member.username}</p>
              </div>
              {channel.moderators.includes(member.userId) && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                  Moderator
                </span>
              )}
            </div>
          ))}
          {channel.members.length > 10 && (
            <p className="text-xs text-slate-500 pt-2">
              +{channel.members.length - 10} more members
            </p>
          )}
        </div>
      </div>

      {/* Pinned Messages */}
      {channel.pinned && channel.pinned.length > 0 && (
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-semibold text-sm mb-2">
            📌 Pinned ({channel.pinned.length})
          </h3>
          <p className="text-xs text-slate-600">
            {channel.pinned.length} message{channel.pinned.length !== 1 ? "s" : ""} pinned
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="p-4 space-y-2">
        {isModerator && (
          <button className="w-full text-sm px-3 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors">
            Edit Channel
          </button>
        )}
        <button
          onClick={onLeave}
          className="w-full text-sm px-3 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
        >
          Leave Channel
        </button>
      </div>
    </div>
  );
}

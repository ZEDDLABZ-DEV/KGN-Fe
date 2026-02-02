import { useState } from 'react';
import { FaInstagram } from 'react-icons/fa';
import {
  FiHome,
  FiSearch,
  FiPlusSquare,
  FiHeart,
  FiMessageCircle,
  FiSend,
  FiBookmark,
  FiChevronDown,
  FiMenu,
  FiPlay,
  FiBell,
  FiX,
  FiImage,
  FiSmile,
  FiHash,
} from 'react-icons/fi';
import { ParentLayout } from '../../layout/ParentLayout';

const stories = [
  { id: 1, name: 'Your Story', avatar: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=200&q=80', isOwner: true },
  { id: 2, name: 'alex.the.builder', avatar: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=200&q=80' },
  { id: 3, name: 'urban.design', avatar: 'https://images.unsplash.com/photo-1529429617124-aee2a6990f43?auto=format&fit=crop&w=200&q=80' },
  { id: 4, name: 'steelstructure', avatar: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=200&q=80' },
  { id: 5, name: 'future.cities', avatar: 'https://images.unsplash.com/photo-1505843861231-89ff44ec75f0?auto=format&fit=crop&w=200&q=80' },
  { id: 6, name: 'site360', avatar: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=200&q=80' },
  { id: 7, name: 'archdaily', avatar: 'https://images.unsplash.com/photo-1429552077091-836152271555?auto=format&fit=crop&w=200&q=80' },
  { id: 8, name: 'green.build', avatar: 'https://images.unsplash.com/photo-1582719478250-4b7d9d94a3ad?auto=format&fit=crop&w=200&q=80' },
];

const posts = [
  {
    id: 1,
    user: 'urban.design',
    location: 'Seoul, South Korea',
    avatar: 'https://images.unsplash.com/photo-1529429617124-aee2a6990f43?auto=format&fit=crop&w=200&q=80',
    image: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?auto=format&fit=crop&w=900&q=80',
    likes: '12,488',
    caption:
      'Reimagining downtown skylines with green terraces and collaborative workspaces. Which detail stands out to you the most?',
    timeAgo: '2 hours ago',
    comments: 126,
  },
  {
    id: 2,
    user: 'future.cities',
    location: 'Rotterdam, Netherlands',
    avatar: 'https://images.unsplash.com/photo-1505843861231-89ff44ec75f0?auto=format&fit=crop&w=200&q=80',
    image: 'https://images.unsplash.com/photo-1465800872432-3041a02501b7?auto=format&fit=crop&w=900&q=80',
    likes: '8,930',
    caption:
      'Glass, steel, and movement. Capturing the rhythm of public spaces built for people.',
    timeAgo: '6 hours ago',
    comments: 84,
  },
  {
    id: 3,
    user: 'site360',
    location: 'Dubai, UAE',
    avatar: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=200&q=80',
    image: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=80',
    likes: '24,301',
    caption:
      'Sunset pours gold across the skyline. Site monitoring never looked this good.',
    timeAgo: '1 day ago',
    comments: 310,
  },
];

const reels = [
  {
    id: 1,
    title: 'Adaptive Facade System',
    creator: 'green.build',
    thumbnail: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=500&q=80',
    views: '1.2M',
    duration: '00:32',
  },
  {
    id: 2,
    title: 'Concrete Pour Timelapse',
    creator: 'site360',
    thumbnail: 'https://images.unsplash.com/photo-1465800872432-3041a02501b7?auto=format&fit=crop&w=500&q=80',
    views: '842K',
    duration: '01:12',
  },
  {
    id: 3,
    title: 'Prefabricated Pods Install',
    creator: 'prefab.pro',
    thumbnail: 'https://images.unsplash.com/photo-1581090700227-1e37b190418e?auto=format&fit=crop&w=500&q=80',
    views: '560K',
    duration: '00:54',
  },
  {
    id: 4,
    title: 'Glass Curtain Tests',
    creator: 'modularlabs',
    thumbnail: 'https://images.unsplash.com/photo-1505843861231-89ff44ec75f0?auto=format&fit=crop&w=500&q=80',
    views: '410K',
    duration: '00:46',
  },
];

const directMessages = [
  {
    id: 1,
    user: 'urban.design',
    avatar: 'https://images.unsplash.com/photo-1529429617124-aee2a6990f43?auto=format&fit=crop&w=200&q=80',
    preview: 'Let’s sync on the facade renders later today.',
    time: '2m',
    unread: true,
  },
  {
    id: 2,
    user: 'prefab.pro',
    avatar: 'https://images.unsplash.com/photo-1582719478244-5f785ae18673?auto=format&fit=crop&w=200&q=80',
    preview: 'Updated BIM model delivered. Thoughts?',
    time: '17m',
    unread: false,
  },
  {
    id: 3,
    user: 'construct.ai',
    avatar: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=200&q=80',
    preview: 'AI summary for the new site inspection is ready.',
    time: '1h',
    unread: false,
  },
  {
    id: 4,
    user: 'bridgeworks',
    avatar: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9e?auto=format&fit=crop&w=200&q=80',
    preview: 'Sent you the drone captures from today.',
    time: '3h',
    unread: true,
  },
];

const notifications = [
  {
    id: 1,
    user: 'future.cities',
    avatar: 'https://images.unsplash.com/photo-1505843861231-89ff44ec75f0?auto=format&fit=crop&w=200&q=80',
    message: 'liked your post • Sunset pour',
    time: '5m',
  },
  {
    id: 2,
    user: 'modularlabs',
    avatar: 'https://images.unsplash.com/photo-1515165562835-c4c375a5efaa?auto=format&fit=crop&w=200&q=80',
    message: 'started following you',
    time: '22m',
  },
  {
    id: 3,
    user: 'archdaily',
    avatar: 'https://images.unsplash.com/photo-1429552077091-836152271555?auto=format&fit=crop&w=200&q=80',
    message: 'commented: “Stunning!”',
    time: '1h',
  },
];

const suggestions = [
  {
    id: 1,
    user: 'construct.ai',
    reason: 'Follows you',
    avatar: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 2,
    user: 'modularlabs',
    reason: 'New to Instagram',
    avatar: 'https://images.unsplash.com/photo-1515165562835-c4c375a5efaa?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 3,
    user: 'bridgeworks',
    reason: 'Suggested for you',
    avatar: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9e?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 4,
    user: 'prefab.pro',
    reason: 'Followed by site360',
    avatar: 'https://images.unsplash.com/photo-1582719478244-5f785ae18673?auto=format&fit=crop&w=200&q=80',
  },
];

const StoryBubble = ({ name, avatar, isOwner = false }: (typeof stories)[number]) => (
  <button className="flex flex-col items-center gap-1">
    <span
      className={`p-0.5 rounded-full ${isOwner ? 'bg-linear-to-r from-purple-500 via-pink-500 to-yellow-400' : 'bg-linear-to-r from-orange-400 via-red-500 to-purple-500'}`}
    >
      <span className="bg-white p-0.5 rounded-full">
        <img
          src={avatar}
          alt={name}
          className="h-16 w-16 rounded-full object-cover"
        />
      </span>
    </span>
    <span className="text-xs text-gray-600">{name}</span>
  </button>
);

const PostCard = ({
  user,
  location,
  avatar,
  image,
  likes,
  caption,
  timeAgo,
  comments,
}: (typeof posts)[number]) => (
  <article className="rounded-xl border border-gray-200 bg-white shadow-sm">
    <header className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3">
        <img src={avatar} alt={user} className="h-10 w-10 rounded-full object-cover" />
        <div>
          <h4 className="text-sm font-semibold text-gray-900">{user}</h4>
          <p className="text-xs text-gray-500">{location}</p>
        </div>
      </div>
      <button className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100">
        <FiMenu size={18} />
      </button>
    </header>

    <div className="relative">
      <img src={image} alt={`${user} post`} className="h-[500px] w-full object-cover" />
      <span className="absolute top-4 left-4 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
        • Live site cam
      </span>
    </div>

    <div className="px-4 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-gray-700">
          <button className="transition-colors hover:text-rose-500">
            <FiHeart size={22} />
          </button>
          <button className="transition-colors hover:text-gray-900">
            <FiMessageCircle size={22} />
          </button>
          <button className="transition-colors hover:text-gray-900">
            <FiSend size={22} />
          </button>
        </div>
        <button className="transition-colors hover:text-gray-900">
          <FiBookmark size={22} />
        </button>
      </div>

      <p className="text-sm font-semibold text-gray-900">{likes} likes</p>
      <p className="text-sm text-gray-800">
        <span className="font-semibold">{user}</span> {caption}
      </p>
      <button className="text-sm font-medium text-gray-500 hover:text-gray-700">
        View all {comments} comments
      </button>
      <p className="text-xs uppercase tracking-wide text-gray-400">{timeAgo}</p>
    </div>

    <footer className="border-t border-gray-100 px-4 py-3">
      <form className="flex items-center gap-3">
        <img
          src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=200&q=80"
          alt="You"
          className="h-8 w-8 rounded-full object-cover"
        />
        <input
          type="text"
          placeholder="Add a comment..."
          className="flex-1 border-none bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
        />
        <button type="button" className="text-sm font-semibold text-sky-600">
          Post
        </button>
      </form>
    </footer>
  </article>
);

const ReelCard = ({ title, creator, thumbnail, views, duration }: (typeof reels)[number]) => (
  <article className="group relative h-60 w-40 overflow-hidden rounded-2xl bg-slate-900 text-white shadow-md">
    <img src={thumbnail} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
    <div className="absolute inset-0 bg-linear-to-t from-slate-950/90 via-slate-950/20 to-slate-900/0" />
    <span className="absolute top-3 right-3 rounded-full bg-black/60 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide">
      {duration}
    </span>
    <div className="absolute bottom-3 left-3 right-3 space-y-1.5">
      <div className="flex items-center gap-1 text-xs text-white/70">
        <FiPlay size={14} />
        <span>{views} views</span>
      </div>
      <h3 className="text-sm font-semibold leading-tight">{title}</h3>
      <p className="text-xs text-white/80">@{creator}</p>
    </div>
  </article>
);

const InstagramTopBar = () => (
  <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white/95 px-6 py-4 shadow-sm backdrop-blur">
    <div className="flex items-center gap-2 text-gray-900">
      <FaInstagram size={28} />
      <div className="flex items-center gap-1 text-lg font-semibold tracking-wide">
        <span>Instagram</span>
        <FiChevronDown size={18} className="text-gray-500" />
      </div>
    </div>
    <div className="flex items-center gap-3 text-gray-600">
      <button className="hidden h-11 items-center gap-3 rounded-full border border-gray-200 px-4 text-sm text-gray-500 shadow-sm transition-colors hover:border-gray-300 hover:text-gray-700 md:flex">
        <FiSearch size={18} />
        <span className="text-sm">Search</span>
      </button>
      <div className="flex items-center gap-4">
        <button className="rounded-full p-2 transition-colors hover:bg-gray-100">
          <FiHome size={22} />
        </button>
        <button className="rounded-full p-2 transition-colors hover:bg-gray-100" data-modal-trigger="create-post">
          <FiPlusSquare size={22} />
        </button>
        <button className="rounded-full p-2 transition-colors hover:bg-gray-100">
          <FiBell size={22} />
        </button>
        <button className="rounded-full p-2 transition-colors hover:bg-gray-100">
          <FiHeart size={22} />
        </button>
        <button className="rounded-full p-2 transition-colors hover:bg-gray-100">
          <FiMessageCircle size={22} />
        </button>
        <img
          src="https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80"
          alt="Profile"
          className="h-9 w-9 rounded-full object-cover ring-2 ring-purple-500/40"
        />
      </div>
    </div>
  </div>
);

const NotificationsPanel = () => (
  <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <FiBell size={18} className="text-slate-500" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Notifications</h3>
      </div>
      <button className="text-xs font-semibold text-sky-600">Manage</button>
    </header>
    <div className="space-y-4">
      {notifications.map(({ id, user, avatar, message, time }) => (
        <div key={id} className="flex items-center gap-3">
          <img src={avatar} alt={user} className="h-11 w-11 rounded-full object-cover" />
          <div className="flex-1">
            <p className="text-sm text-gray-800">
              <span className="font-semibold text-gray-900">{user}</span> {message}
            </p>
            <span className="text-xs uppercase tracking-wide text-gray-400">{time}</span>
          </div>
          <button className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-800">
            View
          </button>
        </div>
      ))}
    </div>
  </section>
);

const DirectMessagesPanel = () => (
  <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <FiMessageCircle size={18} className="text-slate-500" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Direct messages</h3>
      </div>
      <button className="text-xs font-semibold text-sky-600">New message</button>
    </header>
    <div className="space-y-4">
      {directMessages.map(({ id, user, avatar, preview, time, unread }) => (
        <div key={id} className="flex items-center gap-3">
          <div className="relative">
            <img src={avatar} alt={user} className="h-11 w-11 rounded-full object-cover" />
            {unread && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-sky-500" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900">{user}</h4>
              <span className="text-xs uppercase tracking-wide text-gray-400">{time}</span>
            </div>
            <p className="text-xs text-gray-500">{preview}</p>
          </div>
          <button className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-800">
            Reply
          </button>
        </div>
      ))}
    </div>
  </section>
);

const SuggestionsPanel = () => (
  <aside className="hidden w-full max-w-sm flex-col gap-6 lg:flex">
    <section className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img
          src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=200&q=80"
          alt="You"
          className="h-14 w-14 rounded-full object-cover"
        />
        <div>
          <h3 className="text-sm font-semibold text-gray-900">site.manager</h3>
          <p className="text-sm text-gray-500">Site Manager • Construct Pro</p>
        </div>
      </div>
      <button className="text-sm font-semibold text-sky-600">Switch</button>
    </section>

    <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <FiHash size={18} className="text-slate-500" />
          <span className="uppercase tracking-wide">Suggested for you</span>
        </div>
        <button className="font-semibold text-gray-800 transition-colors hover:text-gray-900">See All</button>
      </div>
      <div className="flex flex-col gap-4">
        {suggestions.map(({ id, user, reason, avatar }) => (
          <div key={id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={avatar} alt={user} className="h-11 w-11 rounded-full object-cover" />
              <div>
                <h4 className="text-sm font-semibold text-gray-900">{user}</h4>
                <p className="text-xs text-gray-500">{reason}</p>
              </div>
            </div>
            <button className="text-sm font-semibold text-sky-600">Follow</button>
          </div>
        ))}
      </div>
    </section>

    <NotificationsPanel />
    <DirectMessagesPanel />

    <section className="space-y-2 text-xs text-gray-400">
      <p>About • Help • Press • API • Careers • Privacy • Terms • Locations</p>
      <p>© 2025 INSTAGRAM FROM CONSTRUCT PRO</p>
    </section>
  </aside>
);

const MobileBottomNav = ({ onCreatePost }: { onCreatePost: () => void }) => {
  return (
    <nav className="fixed inset-x-6 bottom-6 z-20 flex items-center justify-around rounded-full border border-gray-200 bg-white/95 px-6 py-3 shadow-[0_15px_40px_-15px_rgba(15,23,42,0.25)] backdrop-blur md:hidden">
      <button className="text-gray-900">
        <FiHome size={24} />
      </button>
      <button className="text-gray-500 transition-colors hover:text-gray-900">
        <FiSearch size={24} />
      </button>
      <button className="text-gray-500 transition-colors hover:text-gray-900" onClick={onCreatePost}>
        <FiPlusSquare size={24} />
      </button>
      <button className="text-gray-500 transition-colors hover:text-gray-900">
        <FiHeart size={24} />
      </button>
      <button className="text-gray-500 transition-colors hover:text-gray-900">
        <FiMessageCircle size={24} />
      </button>
    </nav>
  );
};

const CreatePostModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-3xl border border-gray-200 bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Create new post</h2>
          <button onClick={onClose} className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700">
            <FiX size={20} />
          </button>
        </header>

        <div className="grid gap-6 p-6 md:grid-cols-[2fr,1fr]">
          <section className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50/80 p-8 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-inner">
              <FiImage size={40} className="text-slate-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-gray-900">Drag photos and videos here</h3>
              <p className="text-sm text-gray-500">Your media will appear in the preview once uploaded.</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800">
                Select from computer
              </button>
              <button className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-400 hover:text-gray-900">
                Import from cloud
              </button>
            </div>
          </section>

          <aside className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=200&q=80"
                alt="You"
                className="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <h4 className="text-sm font-semibold text-gray-900">site.manager</h4>
                <p className="text-xs text-gray-500">Construct Pro</p>
              </div>
            </div>

            <textarea
              placeholder="Write a caption..."
              className="min-h-[120px] w-full resize-none rounded-2xl border border-gray-200 bg-gray-50/80 p-4 text-sm text-gray-700 outline-none transition-colors focus:border-slate-400 focus:bg-white"
            />

            <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50/60 px-4 py-3 text-sm text-gray-600">
              <span>Add location</span>
              <button className="font-semibold text-sky-600">Search</button>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50/60 px-4 py-3 text-sm text-gray-600">
              <span>Advanced settings</span>
              <button className="font-semibold text-sky-600">View</button>
            </div>

            <div className="flex items-center justify-between">
              <button className="flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-900">
                <FiSmile size={18} />
                Add emoji
              </button>
              <div className="flex items-center gap-2">
                <button className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700">
                  Draft
                </button>
                <button className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800">
                  Share
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

const Instagram = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const openCreatePost = () => setIsCreateOpen(true);
  const closeCreatePost = () => setIsCreateOpen(false);

  return (
    <ParentLayout title="Instagram Clone">
      <div className="relative flex flex-col gap-8 pb-24">
        <div onClick={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest('[data-modal-trigger="create-post"]')) {
            openCreatePost();
          }
        }}>
          <InstagramTopBar />
        </div>

        <section className="rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Stories</h2>
            <button className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition-colors hover:bg-slate-800">
              <FiPlusSquare size={16} />
              <span>Add story</span>
            </button>
          </div>
          <div className="mt-4 flex gap-5 overflow-x-auto pb-3">
            {stories.map((story) => (
              <StoryBubble key={story.id} {...story} />
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Reels</h2>
            <button className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-800">
              Explore more
            </button>
          </div>
          <div className="scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 flex gap-4 overflow-x-auto pb-3">
            {reels.map((reel) => (
              <ReelCard key={reel.id} {...reel} />
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="flex w-full flex-col gap-8 lg:max-w-3xl">
            {posts.map((post) => (
              <PostCard key={post.id} {...post} />
            ))}
          </div>

          <SuggestionsPanel />
        </div>
      </div>
      <CreatePostModal open={isCreateOpen} onClose={closeCreatePost} />
      <MobileBottomNav onCreatePost={openCreatePost} />
    </ParentLayout>
  );
};

export { Instagram };


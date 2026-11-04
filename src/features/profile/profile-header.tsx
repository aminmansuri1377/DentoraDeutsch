import Link from "next/link";
import { ArrowLeft, Flame, Star } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { AvatarEditor } from "./avatar-editor";
import { FollowButton } from "@/features/community/components/follow-button";
import styles from "./profile.module.css";
type ProfileView = {
  id: string;
  name: string | null;
  image: string | null;
  username: string | null;
  bio: string;
  university: string;
  _count: {
    post_author: number;
    follow_following: number;
    follow_follower: number;
  };
};
export function ProfileHeader({
  user,
  xp,
  streak,
  own = false,
  following = false,
  onConnections,
  onPosts,
}: {
  user: ProfileView;
  xp: number;
  streak: number;
  own?: boolean;
  following?: boolean;
  onConnections: (kind: "followers" | "following") => void;
  onPosts: () => void;
}) {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.top}>
          <Link href="/community" aria-label="Zur Community">
            <ArrowLeft size={19} />
          </Link>
          <span>{own ? "Dein Profil" : "Profil"}</span>
        </div>
        <div className={styles.identity}>
          {own ? (
            <AvatarEditor image={user.image} name={user.name} />
          ) : (
            <Avatar image={user.image} name={user.name} size={88} />
          )}
          <img
            className={styles.mascot}
            src="/mascots/purple-rabbit.png"
            alt=""
            aria-hidden="true"
          />
          <h1>{user.name || "Dentora Mitglied"}</h1>
          {user.username && (
            <span className={styles.username}>@{user.username}</span>
          )}
          {user.bio && <p>{user.bio}</p>}
          {user.university && (
            <p className={styles.university}>{user.university}</p>
          )}
        </div>
        <div className={styles.counts}>
          <button onClick={onPosts}>
            <strong>{user._count.post_author}</strong>
            <span>Beiträge</span>
          </button>
          <button onClick={() => onConnections("following")}>
            <strong>{user._count.follow_follower}</strong>
            <span>Folgt</span>
          </button>
          <button onClick={() => onConnections("followers")}>
            <strong>{user._count.follow_following}</strong>
            <span>Follower</span>
          </button>
        </div>
        <div className={styles.heroAction}>
          {own ? (
            <Link href="/einstellungen">Profil bearbeiten</Link>
          ) : (
            <FollowButton userId={user.id} following={following} />
          )}
        </div>
      </section>
      <div className={styles.stats}>
        <div>
          <Star size={24} />
          <span>
            <strong>{xp.toLocaleString("de-DE")}</strong>Erfahrungspunkte
          </span>
        </div>
        <div>
          <Flame size={24} />
          <span>
            <strong>{streak}</strong>Tage in Folge
          </span>
        </div>
      </div>
    </>
  );
}

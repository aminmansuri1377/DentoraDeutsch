"use client";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/features/auth/actions";
import styles from "./profile.module.css";
export function LogoutButton() {
  const cache = useQueryClient();
  return (
    <form action={logoutAction} onSubmit={() => cache.clear()}>
      <button className={styles.logout}>
        <LogOut size={19} />
        Abmelden
      </button>
    </form>
  );
}

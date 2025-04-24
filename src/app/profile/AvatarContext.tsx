"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

interface AvatarContextType {
  avatar: string;
  setAvatar: (avatar: string) => void;
}

const AvatarContext = createContext<AvatarContextType | undefined>(undefined);

export const AvatarProvider = ({ initialAvatar, children }: { initialAvatar: string, children: ReactNode }) => {
  const [avatar, setAvatar] = useState(initialAvatar);
  return (
    <AvatarContext.Provider value={{ avatar, setAvatar }}>
      {children}
    </AvatarContext.Provider>
  );
};

export const useAvatar = () => {
  const context = useContext(AvatarContext);
  if (!context) {
    throw new Error("useAvatar must be used within an AvatarProvider");
  }
  return context;
};

"use client";
import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Chatbot } from "@/components/dashboard/chatbot";
import { getUserSidebarLinks, Logo, LogoIcon } from "@/components/dashboard/user-sidebar";
import { useParams } from "next/navigation";

export default function ChatPage() {
  const params = useParams();
  const hash = params.hash as string;

  const links = getUserSidebarLinks(hash);
  const [open, setOpen] = React.useState(false);

  const [chatMessages, setChatMessages] = useState<{ id: string; text: string; sender: "user" | "bot"; timestamp: Date }[]>([
    {
      id: "1",
      text: "Hello! How can I help you with your health today?",
      sender: "bot",
      timestamp: new Date()
    }
  ]);

  const handleSendMessage = (message: string) => {
    const newMessage = {
      id: Date.now().toString(),
      text: message,
      sender: "user" as const,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, newMessage]);

    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: (Date.now() + 1).toString(),
        text: "Thank you for your question. Please consult with your doctor for personalized medical advice.",
        sender: "bot" as const,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-1 flex-col overflow-auto md:overflow-hidden rounded-md border border-neutral-200 bg-gray-100 md:flex-row dark:border-neutral-700 dark:bg-neutral-800",
        "h-screen",
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          <div>
            <SidebarLink
              link={{
                label: "Patient Name",
                href: "#",
                icon: (
                  <img
                    src="https://assets.aceternity.com/manu.png"
                    className="h-7 w-7 shrink-0 rounded-full"
                    width={50}
                    height={50}
                    alt="Avatar"
                  />
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>
      <div className="flex flex-1">
        <div className="flex h-full w-full flex-1 flex-col gap-6 rounded-tl-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900 overflow-y-auto">
          <Chatbot messages={chatMessages} onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  );
}

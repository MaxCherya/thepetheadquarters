"use client";

import { useState } from "react";
import { toast } from "@heroui/react";
import { Link2, Share2, MessageCircle, Mail } from "lucide-react";

interface ShareButtonsProps {
  url: string;
  title: string;
}

export function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  const links = [
    {
      icon: <Share2 size={16} />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      label: "Facebook",
    },
    {
      icon: <MessageCircle size={16} />,
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      label: "WhatsApp",
    },
    {
      icon: <Mail size={16} />,
      href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
      label: "Email",
    },
  ];

  return (
    <div className="flex items-center gap-2">
      <span
        style={{
          fontFamily: "var(--font-montserrat)",
          fontSize: "var(--text-xs)",
          color: "var(--white-faint)",
        }}
      >
        Share
      </span>
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${link.label}`}
          className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 hover:bg-[var(--gold)] hover:text-[var(--black)]"
          style={{
            background: "var(--bg-tertiary)",
            color: "var(--white-dim)",
            border: "1px solid var(--bg-border)",
          }}
        >
          {link.icon}
        </a>
      ))}
      <button
        onClick={copyLink}
        aria-label="Copy link"
        className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 hover:bg-[var(--gold)] hover:text-[var(--black)]"
        style={{
          background: copied ? "var(--gold)" : "var(--bg-tertiary)",
          color: copied ? "var(--black)" : "var(--white-dim)",
          border: `1px solid ${copied ? "var(--gold)" : "var(--bg-border)"}`,
        }}
      >
        <Link2 size={16} />
      </button>
    </div>
  );
}

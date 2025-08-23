import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GoogleTranslate from "@/components/GoogleTranslate";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Financial Health Dashboard",
  description: "Manage your finances smartly and achieve your goals",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script type="module" defer dangerouslySetInnerHTML={{
          __html: `
        import Chatbot from "https://cdn.n8nchatui.com/v1/embed.js";

Chatbot.init({
  "n8nChatUrl": "https://cipherxxx7.app.n8n.cloud/webhook/8a5da32d-5561-4ef4-80d7-d0bb0f51eac3/chat",
  "metadata": {},
  "theme": {
    "button": {
      "backgroundColor": "#2563eb", // modern blue
      "right": 24,
      "bottom": 24,
      "size": 72,
      "iconColor": "white",
      "customIconSrc": "https://cdn-icons-png.freepik.com/512/8649/8649605.png", // clean bot icon
      "customIconSize": 64,
      "customIconBorderRadius": 50,
      "autoWindowOpen": {
        "autoOpen": true,
        "openDelay": 2
      },
      "borderRadius": "circle"
    },
    "tooltip": {
      "showTooltip": true,
      "tooltipMessage": "💰 Your Finance Assistant",
      "tooltipBackgroundColor": "#1e293b",
      "tooltipTextColor": "#f8fafc",
      "tooltipFontSize": 14
    },
    "chatWindow": {
      "borderRadiusStyle": "rounded",
      "avatarBorderRadius": 50,
      "messageBorderRadius": 16,
      "showTitle": true,
      "title": "FinBot",
      "titleAvatarSrc": "https://www.svgrepo.com/show/532327/robot.svg",
      "avatarSize": 20,
      "welcomeMessage": "👋 Hello! Let’s manage your finances smartly.",
      "errorMessage": "⚠️ Connection error. Try again.",
      "backgroundColor": "#f9fafb", // soft light background
      "height": 500,
      "width": 420,
      "fontSize": 15,
      "starterPrompts": [
        "📊 Show me my monthly expenses",
        "💡 Where should I invest?",
        "📈 How much did I save this week?"
      ],
      "starterPromptFontSize": 14,
      "renderHTML": false,
      "clearChatOnReload": false,
      "showScrollbar": true,
      "botMessage": {
        "backgroundColor": "#2563eb",
        "textColor": "#ffffff",
        "showAvatar": true,
        "avatarSrc": "https://www.svgrepo.com/show/532327/robot.svg"
      },
      "userMessage": {
        "backgroundColor": "#e0f2fe",
        "textColor": "#0f172a",
        "showAvatar": true,
        "avatarSrc": "https://www.svgrepo.com/show/532363/user-alt-1.svg"
      },
      "textInput": {
        "placeholder": "Type your question...",
        "backgroundColor": "#ffffff",
        "textColor": "#0f172a",
        "sendButtonColor": "#2563eb",
        "maxChars": 100,
        "maxCharsWarningMessage": "⚠️ Max 100 characters allowed.",
        "autoFocus": false,
        "borderRadius": 8,
        "sendButtonBorderRadius": 50
      },
      "uploadsConfig": {
        "enabled": true,
        "acceptFileTypes": ["txt", "csv", "pdf"],
        "maxFiles": 3,
        "maxSizeInMB": 5
      },
      "voiceInputConfig": {
        "enabled": true,
        "maxRecordingTime": 20,
        "recordingNotSupportedMessage": "🎤 Voice input works only in modern browsers (Chrome/Firefox)."
      }
    }
  }
});

          `
        }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >

        {/* Google Translate Widget (visible everywhere) */}
        <div className="fixed top-9 right-9 z-50">
          <GoogleTranslate />
        </div>


        {children}
      </body>
    </html>
  );
}

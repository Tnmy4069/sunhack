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
                  "backgroundColor": "#9fe2fe",
                  "right": 20,
                  "bottom": 20,
                  "size": 50,
                  "iconColor": "#373434",
                  "customIconSrc": "https://www.svgrepo.com/show/339963/chat-bot.svg",
                  "customIconSize": 88,
                  "customIconBorderRadius": 13,
                  "autoWindowOpen": {
                    "autoOpen": true,
                    "openDelay": 2
                  },
                  "borderRadius": "rounded"
                },
                "tooltip": {
                  "showTooltip": true,
                  "tooltipMessage": "update me here!",
                  "tooltipBackgroundColor": "#050505",
                  "tooltipTextColor": "#fefbfb",
                  "tooltipFontSize": 13
                },
                "chatWindow": {
                  "borderRadiusStyle": "rounded",
                  "avatarBorderRadius": 32,
                  "messageBorderRadius": 29,
                  "showTitle": true,
                  "title": "N8N Chat UI Bot",
                  "titleAvatarSrc": "https://www.svgrepo.com/show/339963/chat-bot.svg",
                  "avatarSize": 14,
                  "welcomeMessage": "Hello! update me with finance",
                  "errorMessage": "Please connect me to n8n first",
                  "backgroundColor": "#d4e0d1",
                  "height": 598,
                  "width": 400,
                  "fontSize": 16,
                  "starterPrompts": [
                    "what are my monthly expenses ?",
                    "where do i need to invest"
                  ],
                  "starterPromptFontSize": 14,
                  "renderHTML": false,
                  "clearChatOnReload": false,
                  "showScrollbar": false,
                  "botMessage": {
                    "backgroundColor": "#f36539",
                    "textColor": "#fafafa",
                    "showAvatar": true,
                    "avatarSrc": "https://www.svgrepo.com/show/334455/bot.svg"
                  },
                  "userMessage": {
                    "backgroundColor": "#fff6f3",
                    "textColor": "#050505",
                    "showAvatar": true,
                    "avatarSrc": "https://www.svgrepo.com/show/532363/user-alt-1.svg"
                  },
                  "textInput": {
                    "placeholder": "Type your query",
                    "backgroundColor": "#ffffff",
                    "textColor": "#1e1e1f",
                    "sendButtonColor": "#f36539",
                    "maxChars": 50,
                    "maxCharsWarningMessage": "You exceeded the characters limit. Please input less than 50 characters.",
                    "autoFocus": false,
                    "borderRadius": 6,
                    "sendButtonBorderRadius": 50
                  },
                  "uploadsConfig": {
                    "enabled": true,
                    "acceptFileTypes": [
                      "txt"
                    ],
                    "maxFiles": 5,
                    "maxSizeInMB": 10
                  },
                  "voiceInputConfig": {
                    "enabled": true,
                    "maxRecordingTime": 29,
                    "recordingNotSupportedMessage": "To record audio, use modern browsers like Chrome or Firefox that support audio recording"
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

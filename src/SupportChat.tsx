

import { useState } from "react";
import "./SupportChat.css";

export default function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="support-widget">
      <div
        className={`support-window ${
          isOpen ? "support-window-open" : ""
        }`}
      >
        <div className="support-image-container">
          <img
            className="support-screenshot"
            src="/support.png"
            alt="Окно поддержки UPGRADER"
          />

          <a
            className="support-telegram-hotspot"
            href="https://t.me/Upgrader_fake"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Открыть Telegram поддержки"
          />
        </div>
      </div>

      <button
        type="button"
        className="support-button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={
          isOpen ? "Закрыть поддержку" : "Открыть поддержку"
        }
        aria-expanded={isOpen}
      >
        <span className="support-avatar" />
      </button>
    </div>
  );
}




// components/TelegramNewsletterSimple.tsx
export default function TelegramNewsletterSimple() {
    return (
      <div className="text-center p-6 border rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50">
        {/* Telegram Icon */}
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.022c.242-.213-.054-.333-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.656-.643.136-.953l11.57-4.461c.536-.196 1.006.128.832.941z"/>
          </svg>
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Join Our Telegram Channel
        </h3>
        
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Get instant updates, announcements, and exclusive content delivered directly to your Telegram.
        </p>
        
        {/* Channel Link */}
        <a
          href="https://t.me/great_paperless_events"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors shadow-md hover:shadow-lg"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.022c.242-.213-.054-.333-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.656-.643.136-.953l11.57-4.461c.536-.196 1.006.128.832.941z"/>
          </svg>
          Join Telegram Channel
        </a>
      </div>
    );
  }
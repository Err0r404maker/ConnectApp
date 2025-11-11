interface QuickReplyProps {
  onSend: (text: string) => void;
}

const QUICK_REPLIES = [
  '👍 Хорошо',
  '✅ Понял',
  '🤔 Подумаю',
  '⏰ Позже отвечу',
  '❤️ Спасибо',
  '😊 Отлично'
];

export const QuickReply = ({ onSend }: QuickReplyProps) => {
  return (
    <div className="flex gap-2 p-2 overflow-x-auto">
      {QUICK_REPLIES.map(reply => (
        <button
          key={reply}
          onClick={() => onSend(reply)}
          className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm whitespace-nowrap hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          {reply}
        </button>
      ))}
    </div>
  );
};

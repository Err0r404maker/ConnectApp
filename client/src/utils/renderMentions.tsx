export const renderMentions = (text: string) => {
  const mentionRegex = /@(\w+)/g;
  const parts = text.split(mentionRegex);
  
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return (
        <span key={index} className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1 rounded font-semibold">
          @{part}
        </span>
      );
    }
    return part;
  });
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

/**
 * Guest comments are technically posted by the Bot account.
 * We parse the body to extract the "Real" guest name if it follows our signature pattern.
 * Pattern: Body text... \n\n<sub>Guest posting by **Name**</sub>
 */
export const parseGuestAuthor = (body: string, originalAuthor: string) => {
  const guestRegex = /<sub>Guest posting by \*\*(.*?)\*\*<\/sub>/;
  const match = body.match(guestRegex);
  
  if (match && match[1]) {
    return {
      name: match[1],
      isGuest: true,
      cleanBody: body.replace(guestRegex, '').trim()
    };
  }

  return {
    name: originalAuthor,
    isGuest: false,
    cleanBody: body
  };
};

/**
 * Simple parser to convert URLs into clickable links.
 * Returns an array of strings and React elements.
 */
export const linkify = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return { type: 'link', content: part, key: i };
    }
    return { type: 'text', content: part, key: i };
  });
};
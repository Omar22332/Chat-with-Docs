/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// This is a placeholder for localization strings.
// A more robust solution would involve a library like i18next and a context provider.
export const translations = {
  en: {
    knowledgeBase: 'Knowledge Base',
    newUrlGroup: 'New URL Group',
    add: 'Add',
    contextualChat: 'Contextual Chat',
    welcome: 'Welcome!',
    askAnything: 'Ask me anything about the documents in your knowledge base.',
    askFollowUp: 'Ask a follow-up question...',
    sources: 'Sources',
  },
  es: {
    knowledgeBase: 'Base de Conocimiento',
    newUrlGroup: 'Nuevo Grupo de URL',
    add: 'Añadir',
    contextualChat: 'Chat Contextual',
    welcome: '¡Bienvenido!',
    askAnything: 'Pregúntame cualquier cosa sobre los documentos en tu base de conocimiento.',
    askFollowUp: 'Haz una pregunta de seguimiento...',
    sources: 'Fuentes',
  },
};

export type Language = keyof typeof translations;

export const defaultLang: Language = 'en';

// A simple translation function placeholder.
export const t = (key: keyof typeof translations['en'], lang: Language = defaultLang) => {
  return translations[lang][key] || translations[defaultLang][key];
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export enum MessageSender {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system',
}

export interface UrlContextMetadataItem {
  retrievedUrl: string; // Changed from retrieved_url
  urlRetrievalStatus: string; // Changed from url_retrieval_status
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: MessageSender;
  timestamp: string; // Changed from Date to string for reliable serialization
  isLoading?: boolean;
  urlContext?: UrlContextMetadataItem[];
  isError?: boolean;
}

export interface URLGroup {
  id: string;
  name: string;
  urls: string[];
  isEditable: boolean;
}
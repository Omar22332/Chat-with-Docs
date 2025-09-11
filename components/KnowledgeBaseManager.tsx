/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { URLGroup } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, Edit, Save, X, AlertTriangle } from 'lucide-react';

interface KnowledgeBaseManagerProps {
  urlGroups: URLGroup[];
  setUrlGroups: React.Dispatch<React.SetStateAction<URLGroup[]>>;
  activeUrlGroupId: string | null;
  setActiveUrlGroupId: React.Dispatch<React.SetStateAction<string | null>>;
  onClose: () => void;
}

const KnowledgeBaseManager: React.FC<KnowledgeBaseManagerProps> = ({
  urlGroups,
  setUrlGroups,
  activeUrlGroupId,
  setActiveUrlGroupId,
  onClose,
}) => {
  const [newGroupName, setNewGroupName] = useState('');
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [editingUrls, setEditingUrls] = useState<string[]>([]);
  const [newUrlInput, setNewUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const [groupToDelete, setGroupToDelete] = useState<URLGroup | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingGroupId && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [editingGroupId]);
  
  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGroupName.trim()) {
      const newGroup: URLGroup = {
        id: uuidv4(),
        name: newGroupName.trim(),
        urls: [],
        isEditable: true,
      };
      const newUrlGroups = [...urlGroups, newGroup];
      setUrlGroups(newUrlGroups);
      setActiveUrlGroupId(newGroup.id);
      setNewGroupName('');
      setIsAddingGroup(false);
      onClose();
    }
  };

  const handleConfirmDelete = () => {
    if (!groupToDelete) return;

    const groupId = groupToDelete.id;
    if (groupId === editingGroupId) {
        handleCancelEdit();
    }
    const newUrlGroups = urlGroups.filter(g => g.id !== groupId);
    setUrlGroups(newUrlGroups);
    if (activeUrlGroupId === groupId) {
      setActiveUrlGroupId(newUrlGroups.length > 0 ? newUrlGroups[0].id : null);
    }
    setGroupToDelete(null);
  };

  const handleStartEdit = (group: URLGroup) => {
    setEditingGroupId(group.id);
    setEditingGroupName(group.name);
    setEditingUrls(group.urls);
  };

  const handleCancelEdit = () => {
    setEditingGroupId(null);
    setEditingGroupName('');
    setEditingUrls([]);
    setNewUrlInput('');
    setUrlError('');
  };

  const handleSaveEdit = (groupId: string) => {
    if (!editingGroupName.trim()) return;
    const updatedUrlGroups = urlGroups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          name: editingGroupName.trim(),
          urls: editingUrls,
        };
      }
      return group;
    });
    setUrlGroups(updatedUrlGroups);
    handleCancelEdit();
  };
  
  const handleAddUrl = (e?: React.FormEvent) => {
    e?.preventDefault();
    const urlToAdd = newUrlInput.trim();

    // Validation
    if (!urlToAdd) return;
    try {
      new URL(urlToAdd); // This will throw if the URL is invalid
    } catch (_) {
      setUrlError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }
    if (editingUrls.includes(urlToAdd)) {
      setUrlError('This URL has already been added.');
      return;
    }

    setEditingUrls([...editingUrls, urlToAdd]);
    setNewUrlInput('');
    setUrlError('');
  };

  const handleDeleteUrl = (urlToDelete: string) => {
    setEditingUrls(editingUrls.filter(url => url !== urlToDelete));
  };
  
  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, groupId: string) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          handleSaveEdit(groupId);
      } else if (e.key === 'Escape') {
          e.preventDefault();
          handleCancelEdit();
      }
  };

  const handleSelectGroup = (groupId: string) => {
    setActiveUrlGroupId(groupId);
    onClose(); // Close sidebar on selection in mobile view
  };

  return (
    <aside className="w-80 h-full bg-white dark:bg-[#26272B] border-r border-black/10 dark:border-white/10 p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Knowledge Base</h2>
        <button onClick={onClose} className="p-1.5 md:hidden" aria-label="Close knowledge base">
          <X size={20} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto -mr-2 pr-2">
        {urlGroups.map(group => (
          <div key={group.id}>
            {editingGroupId === group.id ? (
              <div className="p-2 mb-2 bg-black/5 dark:bg-white/10 rounded-lg space-y-3">
                <input
                  ref={nameInputRef}
                  type="text"
                  value={editingGroupName}
                  onChange={(e) => setEditingGroupName(e.target.value)}
                  onKeyDown={(e) => handleEditKeyDown(e, group.id)}
                  className="w-full p-1 font-medium bg-transparent border-b border-black/20 dark:border-white/20 focus:outline-none"
                />
                
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {editingUrls.map((url, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                            <span className="flex-1 truncate text-gray-600 dark:text-gray-400" title={url}>{url}</span>
                            <button onClick={() => handleDeleteUrl(url)} className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/20" title="Delete URL">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>

                <form onSubmit={handleAddUrl} className="space-y-1">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newUrlInput}
                      onChange={(e) => { setNewUrlInput(e.target.value); setUrlError(''); }}
                      placeholder="https://example.com"
                      className={`w-full p-1 text-sm bg-transparent border rounded-md focus:outline-none ${urlError ? 'border-red-500' : 'dark:border-white/20'}`}
                    />
                    <button type="submit" className="p-1.5 rounded-md hover:bg-black/10 dark:hover:bg-white/20" title="Add URL"><Plus size={16} /></button>
                  </div>
                  {urlError && <p className="text-xs text-red-500">{urlError}</p>}
                </form>

                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={handleCancelEdit} className="p-1.5 rounded-md hover:bg-black/10 dark:hover:bg-white/20" title="Cancel (Esc)"><X size={16} /></button>
                  <button onClick={() => handleSaveEdit(group.id)} className="p-1.5 rounded-md hover:bg-black/10 dark:hover:bg-white/20" title="Save (Enter)"><Save size={16} /></button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => handleSelectGroup(group.id)}
                className={`group p-3 rounded-lg cursor-pointer mb-2 transition-colors flex justify-between items-center ${activeUrlGroupId === group.id ? 'bg-blue-500 text-white' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
              >
                <span className="font-medium truncate pr-2">{group.name}</span>
                {group.isEditable && (
                  <div className={`flex items-center gap-1 shrink-0 ${activeUrlGroupId === group.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'}`} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleStartEdit(group)}
                      className="p-1.5 rounded-md hover:bg-black/20 dark:hover:bg-white/20"
                      title="Edit group"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => setGroupToDelete(group)}
                      className="p-1.5 rounded-md hover:bg-black/20 dark:hover:bg-white/20"
                      title="Delete group"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/10">
        {isAddingGroup ? (
          <form onSubmit={handleAddGroup}>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="New group name..."
              className="w-full p-2 mb-2 border rounded-md bg-transparent dark:border-white/20"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Escape') setIsAddingGroup(false); }}
            />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400" disabled={!newGroupName.trim()}>Add</button>
              <button type="button" onClick={() => setIsAddingGroup(false)} className="flex-1 p-2 border rounded-md hover:bg-black/5 dark:hover:bg-white/10">Cancel</button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAddingGroup(true)}
            className="w-full flex items-center justify-center gap-2 p-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <Plus size={16} />
            New URL Group
          </button>
        )}
      </div>

       {/* Confirmation Modal */}
      {groupToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-fade-in">
          <div className="absolute inset-0 bg-black/50" onClick={() => setGroupToDelete(null)}></div>
          <div className="relative z-30 bg-white dark:bg-[#26272B] p-6 rounded-lg shadow-xl w-full max-w-sm">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-full">
                <AlertTriangle className="text-red-500" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Delete Group</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Are you sure you want to delete the "<strong>{groupToDelete.name}</strong>" group? All associated conversations will also be removed. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setGroupToDelete(null)}
                className="px-4 py-2 text-sm font-medium rounded-md border dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default KnowledgeBaseManager;

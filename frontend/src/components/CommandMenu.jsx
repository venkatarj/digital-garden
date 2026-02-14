
import React, { useEffect, useState } from 'react'
import { Command } from 'cmdk'
import { Search, Calendar, Moon, Sun, BookOpen, BarChart2, Brain } from 'lucide-react'

export function CommandMenu({ view, setView, theme, setTheme }) {
    const [open, setOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

    useEffect(() => {
        const down = (e) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener('keydown', down)
        return () => document.removeEventListener('keydown', down)
    }, [])

    // Debounced Search
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.length > 2) {
                try {
                    const token = localStorage.getItem('token');
                    // Assuming axios is globally available or imported, strictly speaking we should import it.
                    // For now using fetch for simplicity in this component
                    const response = await fetch(`${API_URL}/search/`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-token': token
                        },
                        body: JSON.stringify({ query: searchQuery })
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setSearchResults(data);
                    }
                } catch (error) {
                    console.error("Search failed", error);
                }
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const runCommand = (command) => {
        setOpen(false)
        command()
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setOpen(false)}>
            <div
                className="w-full max-w-lg bg-white dark:bg-[#161616] border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <Command label="Command Menu" className="w-full" shouldFilter={false}>
                    <div className="flex items-center border-b border-gray-100 dark:border-gray-800 px-3">
                        <Search className="w-4 h-4 text-gray-400 mr-2" />
                        <Command.Input
                            autoFocus
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                            placeholder="Ask your second brain..."
                            className="flex-1 py-4 bg-transparent outline-none text-gray-800 dark:text-gray-100 placeholder:text-gray-400 text-sm font-medium"
                        />
                        <div className="text-[10px] font-mono text-gray-400 border border-gray-200 dark:border-gray-700 px-1.5 py-0.5 rounded">Esc</div>
                    </div>

                    <Command.List className="max-h-[300px] overflow-y-auto py-2 px-2">

                        {searchResults.length > 0 && (
                            <Command.Group heading="By Meaning (AI)" className="text-xs font-medium text-gray-400 mb-2 px-2">
                                {searchResults.map(entry => (
                                    <Command.Item
                                        key={entry.id}
                                        onSelect={() => runCommand(() => {
                                            // TODO: Ideally we load the entry into view. For now, switch to journal.
                                            setView('journal');
                                            // Dispatch event or use context to open entry? 
                                            // Simpler: Just reload logic.
                                        })}
                                        className="flex flex-col gap-1 px-2 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800 transition-colors"
                                    >
                                        <div className="flex items-center gap-2 font-medium">
                                            <Brain className="w-3 h-3 text-purple-500" />
                                            <span>{entry.title || "Untitled"}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 line-clamp-1 pl-5">{entry.content}</div>
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}

                        <Command.Separator className="h-px bg-gray-100 dark:bg-gray-800 my-2 mx-[-8px]" />

                        <Command.Group heading="Navigation" className="text-xs font-medium text-gray-400 mb-2 px-2">
                            <Command.Item
                                onSelect={() => runCommand(() => setView('journal'))}
                                className="flex items-center gap-2 px-2 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800 transition-colors"
                                value="journal"
                            >
                                <BookOpen className="w-4 h-4" />
                                <span>Go to Journal</span>
                                {view === 'journal' && <span className="ml-auto text-xs text-green-500">Active</span>}
                            </Command.Item>

                            <Command.Item
                                onSelect={() => runCommand(() => setView('calendar'))}
                                className="flex items-center gap-2 px-2 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800 transition-colors"
                                value="calendar"
                            >
                                <Calendar className="w-4 h-4" />
                                <span>Go to Calendar</span>
                                {view === 'calendar' && <span className="ml-auto text-xs text-green-500">Active</span>}
                            </Command.Item>

                            <Command.Item
                                onSelect={() => runCommand(() => setView('insights'))}
                                className="flex items-center gap-2 px-2 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800 transition-colors"
                                value="insights"
                            >
                                <BarChart2 className="w-4 h-4" />
                                <span>Go to Insights</span>
                                {view === 'insights' && <span className="ml-auto text-xs text-green-500">Active</span>}
                            </Command.Item>
                        </Command.Group>

                        <Command.Separator className="h-px bg-gray-100 dark:bg-gray-800 my-2 mx-[-8px]" />

                        <Command.Group heading="Settings" className="text-xs font-medium text-gray-400 mb-2 px-2">
                            <Command.Item
                                onSelect={() => runCommand(() => setTheme(theme === 'light' ? 'dark' : 'light'))}
                                className="flex items-center gap-2 px-2 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800 transition-colors"
                                value="toggle theme"
                            >
                                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                                <span>Toggle {theme === 'light' ? 'Dark' : 'Light'} Mode</span>
                            </Command.Item>
                        </Command.Group>
                    </Command.List>
                </Command>
            </div>
        </div>
    )
}

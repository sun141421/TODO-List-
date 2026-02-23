/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Plus, Trash2, Circle, CheckCircle2, Moon, Sun } from "lucide-react";
import { Todo } from "./types";

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem("darkMode") === "true" || 
      (!("darkMode" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setIsDarkMode(isDark);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  }, [isDarkMode]);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const res = await fetch("/api/todos");
      const data = await res.json();
      setTodos(data);
    } catch (error) {
      console.error("Failed to fetch todos:", error);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTodo }),
      });
      const data = await res.json();
      setTodos([data, ...todos]);
      setNewTodo("");
    } catch (error) {
      console.error("Failed to add todo:", error);
    }
  };

  const toggleTodo = async (id: number, currentCompleted: boolean | number) => {
    try {
      const newCompleted = !currentCompleted;
      const res = await fetch(`/api/todos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: newCompleted }),
      });
      const data = await res.json();
      setTodos(todos.map((t) => (t.id === id ? data : t)));
    } catch (error) {
      console.error("Failed to toggle todo:", error);
    }
  };

  const deleteTodo = async (id: number) => {
    try {
      await fetch(`/api/todos/${id}`, { method: "DELETE" });
      setTodos(todos.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  };

  const completedCount = todos.filter((t) => t.completed).length;
  const totalCount = todos.length;
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-zinc-200 dark:selection:bg-zinc-800 transition-colors duration-300">
      <main className="max-w-xl mx-auto pt-20 pb-12 px-6">
        <header className="mb-12">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-4xl font-light tracking-tight">Tasks</h1>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-zinc-500 dark:text-zinc-400"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
          <div className="flex items-center gap-4 text-zinc-500 dark:text-zinc-400 text-sm">
            <span>{totalCount} total</span>
            <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <span>{completedCount} completed</span>
          </div>
          
          {totalCount > 0 && (
            <div className="mt-6">
              <div className="flex justify-between text-xs text-zinc-400 dark:text-zinc-500 mb-2 font-mono uppercase tracking-wider">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full"
                />
              </div>
            </div>
          )}
        </header>

        <form onSubmit={addTodo} className="mb-8 relative">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="What needs to be done?"
            className="w-full bg-white dark:bg-zinc-900 border-0 rounded-2xl py-4 pl-6 pr-14 shadow-sm text-lg placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!newTodo.trim()}
            className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:hover:bg-zinc-900 dark:disabled:hover:bg-zinc-100 transition-colors"
          >
            <Plus size={20} />
          </button>
        </form>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-700 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {todos.map((todo) => (
                <motion.div
                  key={todo.id}
                  layout
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  className={`group flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-transparent transition-all hover:border-zinc-100 dark:hover:border-zinc-800 ${
                    todo.completed ? "opacity-60" : ""
                  }`}
                >
                  <button
                    onClick={() => toggleTodo(todo.id, todo.completed)}
                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      todo.completed
                        ? "bg-zinc-900 border-zinc-900 text-white dark:bg-zinc-100 dark:border-zinc-100 dark:text-zinc-900"
                        : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 text-transparent"
                    }`}
                  >
                    <Check size={14} strokeWidth={3} />
                  </button>
                  
                  <span
                    className={`flex-grow text-lg transition-all ${
                      todo.completed ? "text-zinc-400 dark:text-zinc-600 line-through decoration-zinc-300 dark:decoration-zinc-700" : "text-zinc-800 dark:text-zinc-200"
                    }`}
                  >
                    {todo.title}
                  </span>

                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </motion.div>
              ))}
              
              {todos.length === 0 && !loading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16 text-zinc-400 dark:text-zinc-600"
                >
                  <p>No tasks yet. Add one above to get started.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}

import React, { useState } from 'react';
import { ShieldCheck, RefreshCw, Plus, LayoutGrid, Users, Package, Wallet, X, Sun, Moon, PanelLeftClose, PanelLeftOpen, ListTodo, StickyNote, LogOut, Settings } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { useApp } from '../AppContext';
import { Module, View } from '../constants';
import { SettingsModal } from '../modals/SettingsModal';
import { useToast } from './Toast';

export function Sidebar() {
  const { activeModule, setActiveModule, setView, theme, toggleTheme, sidebarCollapsed, toggleSidebar, canViewModule } = useApp();
  const c = sidebarCollapsed;
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const t = useToast();

  const analyticsItems = [
    { module: 'analytics-dashboard' as Module, viewTarget: 'analytics' as View, icon: LayoutGrid, label: 'Dashboard' },
    { module: 'customers-module' as Module, viewTarget: 'customers-list' as View, icon: Users, label: 'Customers' },
    { module: 'data-input' as Module, viewTarget: 'dashboard' as View, icon: Plus, label: 'Invoice Creator' },
    { module: 'inventory-module' as Module, viewTarget: 'inventory-list' as View, icon: Package, label: 'Inventory' },
  ];
  const servicesItems = [
    { module: 'money-module' as Module, viewTarget: 'money-tracking' as View, icon: Wallet, label: 'Money Tracking' },
    { module: 'todo-module' as Module, viewTarget: 'todo-list' as View, icon: ListTodo, label: 'Todo List' },
    { module: 'notes-module' as Module, viewTarget: 'notes' as View, icon: StickyNote, label: 'Notes' },
  ];
  const filterItems = (items: typeof analyticsItems) => items.filter(item => !canViewModule || canViewModule(item.module));

  const renderNavItem = (item: typeof analyticsItems[0]) => {
    const isActive = activeModule === item.module;
    const Icon = item.icon;
    return (
      <button
        key={item.module}
        onClick={() => { setActiveModule(item.module); setView(item.viewTarget); }}
        title={c ? item.label : undefined}
        className={`w-full flex items-center rounded-2xl font-bold transition-all group relative ${
          c ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5 text-sm'
        } ${
          isActive
            ? 'bg-gradient-to-r from-emerald-500/10 to-blue-500/10 dark:from-emerald-500/20 dark:to-blue-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-gray-200'
        }`}
      >
        <div className={`shrink-0 ${c ? 'p-2.5 rounded-xl' : 'p-1.5 rounded-lg'} ${isActive ? 'bg-emerald-500/20 dark:bg-emerald-500/30' : 'bg-gray-100 dark:bg-slate-800'}`}>
          <Icon className={c ? 'w-5 h-5' : 'w-4 h-4'} />
        </div>
        {!c && <span className="truncate">{item.label}</span>}
        {!c && isActive && <div className="ml-auto w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />}
        {c && (
          <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 dark:bg-slate-700 text-white text-xs font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-lg">
            {item.label}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 bg-white dark:bg-slate-950 border-r border-gray-200 dark:border-slate-800 z-40 overflow-y-auto overflow-x-hidden transition-all duration-300 no-scrollbar ${c ? 'w-[68px]' : 'w-64'}`}>

      {/* Header — collapse toggle only */}
      <div className="border-b border-gray-200 dark:border-slate-800 flex items-center justify-end px-3 py-3">
        <button
          onClick={toggleSidebar}
          title={c ? 'Expand' : 'Collapse'}
          aria-label={c ? 'Expand sidebar' : 'Collapse sidebar'}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-emerald-500 dark:hover:text-emerald-400 transition-all"
        >
          {c ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav — 2 sections */}
      <nav className={`flex-1 py-3 ${c ? 'px-2' : 'px-3'}`}>
        {/* Analytics section */}
        {!c && (
          <p className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em] px-3 mb-1.5">Analytics</p>
        )}
        <div className="space-y-1 mb-3">
          {filterItems(analyticsItems).map(renderNavItem)}
        </div>

        {/* Divider */}
        <div className={`border-t border-gray-100 dark:border-slate-800 mb-3 ${c ? 'mx-1' : 'mx-1'}`} />

        {/* Services section */}
        {!c && (
          <p className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em] px-3 mb-1.5">Services</p>
        )}
        <div className="space-y-1">
          {filterItems(servicesItems).map(renderNavItem)}
        </div>
      </nav>

      {/* Bottom actions */}
      <div className={`border-t border-gray-200 dark:border-slate-800 space-y-2 ${c ? 'p-2' : 'p-4'}`}>

        {/* Settings — placed above mode toggle */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          title={c ? 'Settings' : undefined}
          aria-label="Settings"
          className={`w-full flex items-center bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-[10px] font-black text-gray-700 dark:text-gray-400 uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-slate-700 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all ${c ? 'justify-center p-3' : 'justify-center gap-2 py-2.5'}`}
        >
          <Settings className="w-3.5 h-3.5" />
          {!c && 'Settings'}
        </button>

        {/* Light / Dark two-segment toggle */}
        {!c ? (
          <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 p-1 gap-1">
            <button
              onClick={() => theme !== 'light' && toggleTheme()}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                theme === 'light'
                  ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-200 shadow-sm'
                  : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-slate-300'
              }`}
            >
              <Sun className="w-3 h-3" />
              Light
            </button>
            <button
              onClick={() => theme !== 'dark' && toggleTheme()}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                theme === 'dark'
                  ? 'bg-slate-900 text-emerald-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-slate-300'
              }`}
            >
              <Moon className="w-3 h-3" />
              Dark
            </button>
          </div>
        ) : (
          /* Collapsed: single icon cycles theme */
          <button
            onClick={toggleTheme}
            title={`Theme: ${theme}`}
            className="w-full flex items-center justify-center p-3 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all"
          >
            {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        )}

        <button
          onClick={() => window.location.reload()}
          title={c ? 'Sync' : undefined}
          aria-label="Sync data"
          className={`w-full flex items-center bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-[10px] font-black text-gray-700 dark:text-gray-400 uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-slate-700 transition-all group ${c ? 'justify-center p-3' : 'justify-center gap-2 py-2.5'}`}
        >
          <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
          {!c && 'Sync'}
        </button>

        {isSupabaseConfigured && (
          <button
            onClick={async () => { const { error } = await supabase.auth.signOut(); if (error) t.error(error.message); else t.success('Logged out'); }}
            title={c ? 'Logout' : undefined}
            aria-label="Log out"
            className={`w-full flex items-center bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-500/20 transition-all ${c ? 'justify-center p-3' : 'justify-center gap-2 py-2.5'}`}
          >
            <LogOut className="w-3.5 h-3.5" />
            {!c && 'Logout'}
          </button>
        )}
      </div>

      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
    </aside>
  );
}

export function MobileMenu() {
  const { isMenuOpen, setIsMenuOpen, activeModule, setActiveModule, setView, setDashboardSubView, theme, toggleTheme, canViewModule } = useApp();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const t = useToast();
  if (!isMenuOpen && !isSettingsOpen) return null;
  if (!isMenuOpen && isSettingsOpen) return <SettingsModal onClose={() => setIsSettingsOpen(false)} />;

  const mobileAnalyticsItems = [
    { module: 'analytics-dashboard' as const, viewTarget: 'analytics' as const, icon: LayoutGrid, label: 'Dashboard', hasSubView: true },
    { module: 'customers-module' as const, viewTarget: 'customers-list' as const, icon: Users, label: 'Customers', hasSubView: false },
    { module: 'data-input' as const, viewTarget: 'dashboard' as const, icon: Plus, label: 'Invoice Creator', hasSubView: false },
    { module: 'inventory-module' as const, viewTarget: 'inventory-list' as const, icon: Package, label: 'Inventory', hasSubView: false },
  ];
  const mobileServicesItems = [
    { module: 'money-module' as const, viewTarget: 'money-tracking' as const, icon: Wallet, label: 'Money Tracking', hasSubView: false },
    { module: 'todo-module' as const, viewTarget: 'todo-list' as const, icon: ListTodo, label: 'Todo List', hasSubView: false },
    { module: 'notes-module' as const, viewTarget: 'notes' as const, icon: StickyNote, label: 'Notes', hasSubView: false },
  ];
  type MobileNavItem = { module: Module; viewTarget: View; icon: React.ElementType; label: string; hasSubView: boolean };
  const filterMobile = (items: MobileNavItem[]) => items.filter(item => !canViewModule || canViewModule(item.module));

  const renderMobileItem = (item: MobileNavItem) => {
    const isActive = activeModule === item.module;
    const Icon = item.icon;
    return (
      <button
        key={item.module}
        onClick={() => {
          setActiveModule(item.module);
          setView(item.viewTarget);
          if (item.hasSubView) setDashboardSubView('overview');
          setIsMenuOpen(false);
        }}
        className={`w-full flex items-center justify-between px-3 py-3 rounded-2xl transition-all font-bold text-sm ${
          isActive
            ? 'bg-gradient-to-r from-emerald-500/10 to-blue-500/10 dark:from-emerald-500/20 dark:to-blue-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg ${isActive ? 'bg-emerald-500/20 dark:bg-emerald-500/30' : 'bg-gray-100 dark:bg-slate-800'}`}>
            <Icon className="w-4 h-4" />
          </div>
          {item.label}
        </div>
        {isActive && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />}
      </button>
    );
  };

  return (
    <>
      <div className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[55] animate-in fade-in duration-300" onClick={() => setIsMenuOpen(false)} />
      <div className="lg:hidden fixed inset-y-0 left-0 w-full max-w-[280px] bg-white dark:bg-slate-950 z-[60] shadow-2xl flex flex-col animate-in slide-in-from-left duration-500 border-r border-gray-100 dark:border-slate-800">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800">
          <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors ml-auto">
            <X className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </button>
        </div>

        {/* Nav — 2 sections */}
        <nav className="flex-1 overflow-y-auto no-scrollbar px-3 py-3">
          {/* Analytics */}
          <p className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em] px-3 mb-1.5">Analytics</p>
          <div className="space-y-1 mb-3">
            {filterMobile(mobileAnalyticsItems).map(renderMobileItem)}
          </div>
          <div className="border-t border-gray-100 dark:border-slate-800 mb-3 mx-1" />
          {/* Services */}
          <p className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em] px-3 mb-1.5">Services</p>
          <div className="space-y-1">
            {filterMobile(mobileServicesItems).map(renderMobileItem)}
          </div>
        </nav>

        {/* Bottom — Settings + Light/Dark toggle + Sync */}
        <div className="px-3 py-4 border-t border-gray-100 dark:border-slate-800 space-y-2">
          {/* Settings — above mode toggle */}
          <button
            onClick={() => { setIsMenuOpen(false); setIsSettingsOpen(true); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-[10px] font-black text-gray-700 dark:text-gray-400 uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-slate-700 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
          >
            <Settings className="w-3.5 h-3.5" />
            Settings
          </button>

          {/* Two-segment Light / Dark */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 p-1 gap-1">
            <button
              onClick={() => theme !== 'light' && toggleTheme()}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                theme === 'light'
                  ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-200 shadow-sm'
                  : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-slate-300'
              }`}
            >
              <Sun className="w-3.5 h-3.5" /> Light
            </button>
            <button
              onClick={() => theme !== 'dark' && toggleTheme()}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                theme === 'dark'
                  ? 'bg-slate-900 text-emerald-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-slate-300'
              }`}
            >
              <Moon className="w-3.5 h-3.5" /> Dark
            </button>
          </div>

          {/* Sync */}
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-[10px] font-black text-gray-700 dark:text-gray-400 uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-slate-700 transition-all group"
          >
            <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
            Sync
          </button>

          {/* Logout */}
          {isSupabaseConfigured && (
            <button
              onClick={async () => { setIsMenuOpen(false); const { error } = await supabase.auth.signOut(); if (error) t.error(error.message); else t.success('Logged out'); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-500/20 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          )}
        </div>
      </div>

      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
    </>
  );
}

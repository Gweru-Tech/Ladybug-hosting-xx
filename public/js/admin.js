// Admin Panel JavaScript
class AdminPanel {
    constructor() {
        this.socket = io();
        this.users = [];
        this.bots = [];
        this.stats = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupSocketEvents();
        this.loadDashboardData();
    }

    setupEventListeners() {
        // Admin navigation
        document.querySelectorAll('.admin-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.dataset.section;
                this.showSection(section);
            });
        });

        // User management
        document.getElementById('search-users')?.addEventListener('input', (e) => {
            this.filterUsers(e.target.value);
        });

        // Bot management
        document.getElementById('search-bots')?.addEventListener('input', (e) => {
            this.filterBots(e.target.value);
        });

        // System controls
        document.getElementById('restart-system')?.addEventListener('click', () => {
            this.restartSystem();
        });

        document.getElementById('clear-cache')?.addEventListener('click', () => {
            this.clearCache();
        });
    }

    setupSocketEvents() {
        this.socket.on('admin-stats', (data) => {
            this.updateStats(data);
        });

        this.socket.on('user-activity', (data) => {
            this.updateActivityFeed(data);
        });

        this.socket.on('system-alert', (alert) => {
            this.showSystemAlert(alert);
        });
    }

    async loadDashboardData() {
        try {
            const [usersResponse, botsResponse, statsResponse] = await Promise.all([
                fetch('/api/admin/users'),
                fetch('/api/admin/bots'),
                fetch('/api/admin/stats')
            ]);

            if (usersResponse.ok) this.users = await usersResponse.json();
            if (botsResponse.ok) this.bots = await botsResponse.json();
            if (statsResponse.ok) this.stats = await statsResponse.json();

            this.renderDashboard();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showNotification('Error loading dashboard data', 'error');
        }
    }

    renderDashboard() {
        this.renderStats();
        this.renderUsers();
        this.renderBots();
        this.renderActivityFeed();
    }

    renderStats() {
        const statsContainer = document.getElementById('admin-stats');
        if (!statsContainer) return;

        statsContainer.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div class="stat-card bg-blue-900/20 border-blue-500/30">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-blue-300">Total Users</p>
                            <p class="text-3xl font-bold text-blue-400">${this.stats.totalUsers || 0}</p>
                        </div>
                        <i class="fas fa-users text-3xl text-blue-500"></i>
                    </div>
                </div>
                <div class="stat-card bg-green-900/20 border-green-500/30">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-green-300">Active Bots</p>
                            <p class="text-3xl font-bold text-green-400">${this.stats.activeBots || 0}</p>
                        </div>
                        <i class="fas fa-robot text-3xl text-green-500"></i>
                    </div>
                </div>
                <div class="stat-card bg-purple-900/20 border-purple-500/30">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-purple-300">Server Load</p>
                            <p class="text-3xl font-bold text-purple-400">${this.stats.serverLoad || '0%'}</p>
                        </div>
                        <i class="fas fa-server text-3xl text-purple-500"></i>
                    </div>
                </div>
                <div class="stat-card bg-yellow-900/20 border-yellow-500/30">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-yellow-300">Storage Used</p>
                            <p class="text-3xl font-bold text-yellow-400">${this.stats.storageUsed || '0MB'}</p>
                        </div>
                        <i class="fas fa-database text-3xl text-yellow-500"></i>
                    </div>
                </div>
            </div>
        `;
    }

    renderUsers() {
        const container = document.getElementById('users-table');
        if (!container) return;

        container.innerHTML = `
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead class="border-b border-gray-700">
                        <tr>
                            <th class="pb-3 text-gray-400">User</th>
                            <th class="pb-3 text-gray-400">Discord ID</th>
                            <th class="pb-3 text-gray-400">Email</th>
                            <th class="pb-3 text-gray-400">Bots</th>
                            <th class="pb-3 text-gray-400">Joined</th>
                            <th class="pb-3 text-gray-400">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.users.map(user => this.createUserRow(user)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    createUserRow(user) {
        const avatarUrl = user.avatar 
            ? `https://cdn.discordapp.com/avatars/${user.discord_id}/${user.avatar}.png`
            : '/img/default-avatar.png';

        return `
            <tr class="border-b border-gray-800 hover:bg-gray-800/50">
                <td class="py-3">
                    <div class="flex items-center space-x-3">
                        <img src="${avatarUrl}" class="w-8 h-8 rounded-full">
                        <span class="font-medium">${user.username}</span>
                    </div>
                </td>
                <td class="py-3 text-gray-400">${user.discord_id}</td>
                <td class="py-3 text-gray-400">${user.email || 'N/A'}</td>
                <td class="py-3">
                    <span class="inline-flex items-center px-2 py-1 rounded bg-gray-700 text-sm">
                        ${user.bot_count || 0} bots
                    </span>
                </td>
                <td class="py-3 text-gray-400">
                    ${new Date(user.created_at).toLocaleDateString()}
                </td>
                <td class="py-3">
                    <div class="flex space-x-2">
                        <button onclick="adminPanel.viewUserBots(${user.id})" 
                                class="text-blue-400 hover:text-blue-300">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="adminPanel.suspendUser(${user.id})" 
                                class="text-yellow-400 hover:text-yellow-300">
                            <i class="fas fa-ban"></i>
                        </button>
                        <button onclick="adminPanel.deleteUser(${user.id})" 
                                class="text-red-400 hover:text-red-300">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    renderBots() {
        const container = document.getElementById('bots-table');
        if (!container) return;

        container.innerHTML = `
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead class="border-b border-gray-700">
                        <tr>
                            <th class="pb-3 text-gray-400">Bot Name</th>
                            <th class="pb-3 text-gray-400">Owner</th>
                            <th class="pb-3 text-gray-400">Runtime</th>
                            <th class="pb-3 text-gray-400">Status</th>
                            <th class="pb-3 text-gray-400">CPU</th>
                            <th class="pb-3 text-gray-400">Memory</th>
                            <th class="pb-3 text-gray-400">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.bots.map(bot => this.createBotRow(bot)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    createBotRow(bot) {
        const statusClass = bot.status === 'running' ? 'text-green-400' : 'text-red-400';
        const statusText = bot.status === 'running' ? 'Running' : 'Stopped';

        return `
            <tr class="border-b border-gray-800 hover:bg-gray-800/50">
                <td class="py-3 font-medium">${bot.name}</td>
                <td class="py-3 text-gray-400">${bot.username}</td>
                <td class="py-3">
                    <span class="inline-flex items-center px-2 py-1 rounded bg-gray-700 text-sm">
                        <i class="fab fa-${this.getRuntimeIcon(bot.runtime)} mr-2"></i>
                        ${bot.runtime}
                    </span>
                </td>
                <td class="py-3">
                    <span class="${statusClass}">
                        <i class="fas fa-circle text-xs mr-1"></i>
                        ${statusText}
                    </span>
                </td>
                <td class="py-3 text-gray-400">${bot.cpu_usage || '0%'}</td>
                <td class="py-3 text-gray-400">${bot.memory_usage || '0MB'}</td>
                <td class="py-3">
                    <div class="flex space-x-2">
                        <button onclick="adminPanel.restartBot(${bot.id})" 
                                class="text-green-400 hover:text-green-300">
                            <i class="fas fa-redo"></i>
                        </button>
                        <button onclick="adminPanel.stopBot(${bot.id})" 
                                class="text-yellow-400 hover:text-yellow-300">
                            <i><i class="fas fa-stop"></i></i>
                        </button>
                        <button onclick="adminPanel.deleteBot(${bot.id})" 
                                class="text-red-400 hover:text-red-300">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    renderActivityFeed() {
        const container = document.getElementById('activity-feed');
        if (!container) return;

        // Mock activity data for now
        const activities = [
            { type: 'user', message: 'New user registered', time: '2 min ago' },
            { type: 'bot', message: 'Bot started', time: '5 min ago' },
            { type: 'system', message: 'System backup completed', time: '1 hour ago' }
        ];

        container.innerHTML = `
            <div class="space-y-3">
                ${activities.map(activity => `
                    <div class="flex items-start space-x-3 p-3 bg-gray-800/50 rounded-lg">
                        <div class="w-2 h-2 rounded-full mt-2 ${
                            activity.type === 'user' ? 'bg-blue-400' :
                            activity.type === 'bot' ? 'bg-green-400' :
                            'bg-purple-400'
                        }"></div>
                        <div class="flex-1">
                            <p class="text-sm text-gray-200">${activity.message}</p>
                            <p class="text-xs text-gray-500">${activity.time}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    showSection(section) {
        // Hide all sections
        document.querySelectorAll('.admin-section').forEach(s => {
            s.classList.add('hidden');
        });

        // Show selected section
        const targetSection = document.getElementById(`section-${section}`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }

        // Update nav
        document.querySelectorAll('.admin-nav-item').forEach(item => {
            item.classList.remove('text-purple-400');
        });
        document.querySelector(`[data-section="${section}"]`)?.classList.add('text-purple-400');
    }

    filterUsers(searchTerm) {
        const filtered = this.users.filter(user => 
            user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.discord_id.includes(searchTerm) ||
            (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        // Re-render with filtered users
    }

    filterBots(searchTerm) {
        const filtered = this.bots.filter(bot => 
            bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bot.username.toLowerCase().includes(searchTerm.toLowerCase())
        );
        // Re-render with filtered bots
    }

    async restartSystem() {
        if (!confirm('Are you sure you want to restart the system? This will affect all users.')) {
            return;
        }

        try {
            const response = await fetch('/api/admin/system/restart', { method: 'POST' });
            if (response.ok) {
                this.showNotification('System restart initiated', 'success');
            }
        } catch (error) {
            this.showNotification('Failed to restart system', 'error');
        }
    }

    async clearCache() {
        try {
            const response = await fetch('/api/admin/cache/clear', { method: 'POST' });
            if (response.ok) {
                this.showNotification('Cache cleared successfully', 'success');
            }
        } catch (error) {
            this.showNotification('Failed to clear cache', 'error');
        }
    }

    async viewUserBots(userId) {
        // Show user's bots in a modal
        console.log('Viewing bots for user:', userId);
    }

    async suspendUser(userId) {
        if (!confirm('Are you sure you want to suspend this user?')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/users/${userId}/suspend`, { method: 'POST' });
            if (response.ok) {
                this.showNotification('User suspended successfully', 'success');
                this.loadDashboardData();
            }
        } catch (error) {
            this.showNotification('Failed to suspend user', 'error');
        }
    }

    async deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
            if (response.ok) {
                this.showNotification('User deleted successfully', 'success');
                this.loadDashboardData();
            }
        } catch (error) {
            this.showNotification('Failed to delete user', 'error');
        }
    }

    async restartBot(botId) {
        try {
            const response = await fetch(`/api/admin/bots/${botId}/restart`, { method: 'POST' });
            if (response.ok) {
                this.showNotification('Bot restarted successfully', 'success');
                this.loadDashboardData();
            }
        } catch (error) {
            this.showNotification('Failed to restart bot', 'error');
        }
    }

    async stopBot(botId) {
        try {
            const response = await fetch(`/api/admin/bots/${botId}/stop`, { method: 'POST' });
            if (response.ok) {
                this.showNotification('Bot stopped successfully', 'success');
                this.loadDashboardData();
            }
        } catch (error) {
            this.showNotification('Failed to stop bot', 'error');
        }
    }

    async deleteBot(botId) {
        if (!confirm('Are you sure you want to delete this bot? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/bots/${botId}`, { method: 'DELETE' });
            if (response.ok) {
                this.showNotification('Bot deleted successfully', 'success');
                this.loadDashboardData();
            }
        } catch (error) {
            this.showNotification('Failed to delete bot', 'error');
        }
    }

    updateStats(data) {
        this.stats = { ...this.stats, ...data };
        this.renderStats();
    }

    updateActivityFeed(activity) {
        // Add new activity to feed
        console.log('New activity:', activity);
    }

    showSystemAlert(alert) {
        // Show system alert to admin
        console.log('System alert:', alert);
    }

    getRuntimeIcon(runtime) {
        const icons = {
            'nodejs': 'node-js',
            'python': 'python',
            'java': 'java',
            'deno': 'code',
            'lua': 'gem'
        };
        return icons[runtime] || 'code';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize admin panel when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('admin-panel')) {
        window.adminPanel = new AdminPanel();
    }
});
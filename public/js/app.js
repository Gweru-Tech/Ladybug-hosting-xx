// Main application JavaScript
class BotHostingApp {
    constructor() {
        this.socket = io();
        this.bots = [];
        this.user = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupSocketEvents();
        this.loadUser();
        this.loadBots();
    }

    setupEventListeners() {
        // Navigation smooth scrolling
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(e.target.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        // Navbar scroll effect
        window.addEventListener('scroll', this.handleScroll.bind(this));

        // Form submissions
        const createBotForm = document.getElementById('create-bot-form');
        if (createBotForm) {
            createBotForm.addEventListener('submit', this.handleCreateBot.bind(this));
        }

        // Modal close handlers
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeAllModals();
            }
        });

        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    setupSocketEvents() {
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.showNotification('Connected to server', 'success');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.showNotification('Disconnected from server', 'error');
        });

        this.socket.on('bot-status', (data) => {
            this.updateBotStatus(data.id, data.status);
        });

        this.socket.on('bot-created', (bot) => {
            this.bots.unshift(bot);
            this.renderBots();
            this.updateStats();
            this.showNotification('Bot created successfully!', 'success');
        });

        this.socket.on('bot-updated', (bot) => {
            const index = this.bots.findIndex(b => b.id === bot.id);
            if (index !== -1) {
                this.bots[index] = bot;
                this.renderBots();
                this.updateStats();
            }
        });
    }

    handleScroll() {
        const nav = document.querySelector('nav');
        if (window.scrollY > 50) {
            nav.classList.add('shadow-2xl');
        } else {
            nav.classList.remove('shadow-2xl');
        }
    }

    async loadUser() {
        try {
            const response = await fetch('/api/user');
            if (response.ok) {
                this.user = await response.json();
                this.updateUserUI();
            }
        } catch (error) {
            console.error('Error loading user:', error);
        }
    }

    async loadBots() {
        try {
            const response = await fetch('/api/bots');
            if (response.ok) {
                this.bots = await response.json();
                this.renderBots();
                this.updateStats();
                this.subscribeToBots();
            }
        } catch (error) {
            console.error('Error loading bots:', error);
            this.showNotification('Error loading bots', 'error');
        }
    }

    subscribeToBots() {
        this.bots.forEach(bot => {
            this.socket.emit('subscribe-bot', bot.id);
        });
    }

    renderBots() {
        const container = document.getElementById('bots-container');
        const emptyState = document.getElementById('empty-state');

        if (!container) return;

        if (this.bots.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');

        container.innerHTML = this.bots.map(bot => this.createBotCard(bot)).join('');

        // Add event listeners to bot cards
        this.attachBotCardListeners();
    }

    createBotCard(bot) {
        const statusClass = bot.status === 'running' ? 'bg-green-900 text-green-300 status-running' : 'bg-red-900 text-red-300';
        const buttonClass = bot.status === 'running' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700';
        const buttonText = bot.status === 'running' ? 'Stop' : 'Start';

        return `
            <div class="bot-card rounded-xl p-6 card-hover" data-bot-id="${bot.id}">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-xl font-semibold mb-2">${this.escapeHtml(bot.name)}</h3>
                        <p class="text-gray-400 text-sm">${this.escapeHtml(bot.description) || 'No description'}</p>
                    </div>
                    <span class="px-3 py-1 rounded-full text-sm font-medium ${statusClass}">
                        ${bot.status}
                    </span>
                </div>
                <div class="mb-4">
                    <span class="inline-flex items-center px-3 py-1 rounded-lg text-sm bg-gray-700">
                        <i class="fab fa-${this.getRuntimeIcon(bot.runtime)} mr-2"></i>
                        ${bot.runtime}
                    </span>
                </div>
                <div class="flex justify-between items-center">
                    <button onclick="app.viewBotDetails(${bot.id})" 
                            class="text-purple-400 hover:text-purple-300 transition">
                        <i class="fas fa-cog mr-1"></i> Manage
                    </button>
                    <button onclick="app.toggleBot(${bot.id})" 
                            class="px-4 py-2 rounded-lg font-medium transition ${buttonClass}">
                        ${buttonText}
                    </button>
                </div>
            </div>
        `;
    }

    attachBotCardListeners() {
        // Additional listeners for bot cards if needed
    }

    updateStats() {
        const totalBotsEl = document.getElementById('total-bots');
        const runningBotsEl = document.getElementById('running-bots');
        const stoppedBotsEl = document.getElementById('stopped-bots');

        if (totalBotsEl) totalBotsEl.textContent = this.bots.length;
        if (runningBotsEl) {
            runningBotsEl.textContent = this.bots.filter(bot => bot.status === 'running').length;
        }
        if (stoppedBotsEl) {
            stoppedBotsEl.textContent = this.bots.filter(bot => bot.status === 'stopped').length;
        }
    }

    updateUserUI() {
        // Update user avatar and name in UI
        const userAvatar = document.querySelector('[data-user-avatar]');
        const userName = document.querySelector('[data-user-name]');

        if (userAvatar && this.user && this.user.avatar) {
            userAvatar.src = `https://cdn.discordapp.com/avatars/${this.user.id}/${this.user.avatar}.png`;
        }

        if (userName && this.user) {
            userName.textContent = this.user.username;
        }
    }

    async handleCreateBot(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const botData = {
            name: formData.get('name'),
            description: formData.get('description'),
            runtime: formData.get('runtime')
        };

        try {
            const response = await fetch('/api/bots', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(botData)
            });

            if (response.ok) {
                this.hideCreateBotModal();
                e.target.reset();
            } else {
                const error = await response.json();
                this.showNotification(error.message || 'Failed to create bot', 'error');
            }
        } catch (error) {
            console.error('Error creating bot:', error);
            this.showNotification('Error creating bot', 'error');
        }
    }

    async toggleBot(botId) {
        const bot = this.bots.find(b => b.id === botId);
        if (!bot) return;

        const action = bot.status === 'running' ? 'stop' : 'start';

        try {
            const response = await fetch(`/api/bots/${botId}/${action}`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error(`Failed to ${action} bot`);
            }

            this.showNotification(`Bot ${action}ed successfully`, 'success');
        } catch (error) {
            console.error(`Error ${action}ing bot:`, error);
            this.showNotification(`Error ${action}ing bot`, 'error');
        }
    }

    updateBotStatus(botId, status) {
        const bot = this.bots.find(b => b.id === botId);
        if (bot) {
            bot.status = status;
            this.renderBots();
            this.updateStats();
        }
    }

    viewBotDetails(botId) {
        const bot = this.bots.find(b => b.id === botId);
        if (!bot) return;

        const modal = document.getElementById('bot-details-modal');
        const title = document.getElementById('bot-details-title');
        const content = document.getElementById('bot-details-content');

        if (!modal || !title || !content) return;

        title.textContent = bot.name;
        content.innerHTML = this.createBotDetailsHTML(bot);
        modal.classList.remove('hidden');
    }

    createBotDetailsHTML(bot) {
        const statusClass = bot.status === 'running' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300';
        const buttonClass = bot.status === 'running' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700';
        const buttonText = bot.status === 'running' ? 'Stop Bot' : 'Start Bot';

        return `
            <div class="space-y-6">
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">Status</label>
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusClass}">
                        <i class="fas fa-circle mr-2 text-xs"></i>
                        ${bot.status}
                    </span>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">Runtime</label>
                    <span class="inline-flex items-center px-3 py-1 rounded-lg bg-gray-700">
                        <i class="fab fa-${this.getRuntimeIcon(bot.runtime)} mr-2"></i>
                        ${bot.runtime}
                    </span>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">Description</label>
                    <p class="text-gray-200">${this.escapeHtml(bot.description) || 'No description provided'}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">Created</label>
                    <p class="text-gray-200">${new Date(bot.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">Actions</label>
                    <div class="flex flex-wrap gap-4">
                        <button onclick="app.toggleBot(${bot.id}); app.hideBotDetailsModal();" 
                                class="px-4 py-2 rounded-lg font-medium transition ${buttonClass}">
                            ${buttonText}
                        </button>
                        <button onclick="app.editBotFiles(${bot.id})" 
                                class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-medium transition">
                            <i class="fas fa-code mr-2"></i> Edit Files
                        </button>
                        <button onclick="app.viewBotLogs(${bot.id})" 
                                class="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg font-medium transition">
                            <i class="fas fa-terminal mr-2"></i> View Logs
                        </button>
                        <button onclick="app.deleteBot(${bot.id})" 
                                class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-medium transition">
                            <i class="fas fa-trash mr-2"></i> Delete Bot
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    editBotFiles(botId) {
        this.showNotification('File editor coming soon!', 'info');
        this.hideBotDetailsModal();
    }

    viewBotLogs(botId) {
        this.showNotification('Log viewer coming soon!', 'info');
        this.hideBotDetailsModal();
    }

    async deleteBot(botId) {
        if (!confirm('Are you sure you want to delete this bot? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/bots/${botId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.bots = this.bots.filter(b => b.id !== botId);
                this.renderBots();
                this.updateStats();
                this.hideBotDetailsModal();
                this.showNotification('Bot deleted successfully', 'success');
            } else {
                throw new Error('Failed to delete bot');
            }
        } catch (error) {
            console.error('Error deleting bot:', error);
            this.showNotification('Error deleting bot', 'error');
        }
    }

    // Modal methods
    showCreateBotModal() {
        document.getElementById('create-bot-modal')?.classList.remove('hidden');
    }

    hideCreateBotModal() {
        document.getElementById('create-bot-modal')?.classList.add('hidden');
    }

    hideBotDetailsModal() {
        document.getElementById('bot-details-modal')?.classList.add('hidden');
    }

    closeAllModals() {
        this.hideCreateBotModal();
        this.hideBotDetailsModal();
    }

    // Utility methods
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

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out forwards';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    async refreshBots() {
        await this.loadBots();
        this.showNotification('Bots refreshed', 'info');
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new BotHostingApp();
});

// Global functions for inline event handlers
window.showCreateBotModal = () => window.app.showCreateBotModal();
window.hideCreateBotModal = () => window.app.hideCreateBotModal();
window.hideBotDetailsModal = () => window.app.hideBotDetailsModal();
window.refreshBots = () => window.app.refreshBots();